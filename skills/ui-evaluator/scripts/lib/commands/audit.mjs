// uie audit — deterministic page audits over the run's scope (ARCHITECTURE §7.2 check table, §8.6, §9).
// Writes runs/<id>/tool-findings.jsonl (hits replace earlier hits of the same checks), runs/<id>/checks.json
// (one entry per check: ran | failed | skipped) and evidence/, and updates the manifest's scope, tools and
// captures. Exit 0: every selected check ran with no gate-level hit; 2: gate-level hits, or a check skipped;
// 1: could not run (no run, no config, runtime missing, app unreachable, a check crashed).
import path from 'node:path';
import { readJson, writeJson, exists } from '../util/fs.mjs';
import { list, UsageError } from '../util/args.mjs';
import { isoNow } from '../util/time.mjs';
import { resolveRun, loadConfig, readManifest, updateManifest, appendIndex } from '../project.mjs';
import { version } from '../cli.mjs';
import { CHECKS, CHECK_NAMES, QUICK_CHECKS, describeChecks } from '../browser/checks/index.mjs';
import { AuditRunner, selectChecks, buildScope, writeAuditOutputs } from '../browser/runner.mjs';
import { ensureApp } from '../browser/app.mjs';
import { runClock } from '../browser/capture.mjs';
import { AUTH_WALL_ADVICE } from '../browser/pages.mjs';
import { loadDeps, toolVersions, mergeCaptures } from '../browser/command-kit.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'quick', 'allow-remote', 'list'], multi: ['route', 'checks'] };

/** Names used in older guidance that map to a canonical check (layout.md says "--checks reflow"). */
export const CHECK_ALIASES = { reflow: 'layout', 'text-spacing': 'layout', focus: 'keyboard', 'live-region': 'live-regions', crosspage: 'cross-page' };

export const help = `uie audit [--checks a,b] [--quick] [--route <route>] [--run <id>] [--baseline <run>] [--allow-remote] [--json]

Runs the deterministic page checks over the run's scope (routes × states × widths × themes from
.ui-evaluator/config.json, frozen by \`uie run new\`). Default run: LATEST; with no run yet, start one with
\`uie run new --label audit-<depth>\`.

  --checks a,b      run only these checks (canonical names below; "reflow" means layout)
  --quick           build self-check only: ${QUICK_CHECKS.join(', ')} (other criteria stay not_run, so no level)
  --route <route>   only these configured routes (path or surface; repeat or comma-separate)
  --baseline <run>  run whose console errors are the FUN-02 parity baseline
  --allow-remote    allow a non-local base URL (default: localhost, 127.0.0.1, [::1], *.localhost, file:) and every
                    remote request. Without it, the pages' own remote assets (fonts, styles, images, scripts; GET only)
                    still load so captures look as visitors see them (config audit.remote_assets: false turns that off),
                    and every other remote request (navigation, fetch, form post, non-GET) is blocked
  --list            list the checks and the criteria they serve

The app is not started when its base URL answers. Otherwise, when config.app.start is set, it runs in app.cwd
with app.env until ready_url answers 2xx (app.timeout_ms), and is stopped afterwards.

Outputs: runs/<id>/tool-findings.jsonl, runs/<id>/checks.json, runs/<id>/evidence/ (screens, dom, axe, crops,
vitals), manifest scope, tools and captures. A check that crashes or cannot reach any page is recorded as
"failed" and its criteria stay not_run in \`uie gates\` — never pass.
Exit codes: 0 clean · 2 gate-level hits or skipped checks · 1 could not run.

Checks:
${CHECK_NAMES.map((n) => `  ${n.padEnd(13)} ${(CHECKS[n].criteria || []).join(', ') || '(see ARCHITECTURE §7.2)'}`).join('\n')}`;

/** --checks / --quick with aliases → canonical, ordered names. */
export function resolveChecks(args) {
  const asked = list(args.checks).map((c) => CHECK_ALIASES[c] || c);
  if (args.quick && asked.length) throw new UsageError('use either --quick or --checks, not both');
  return selectChecks({ checks: asked, quick: !!args.quick });
}

function failedEntry(reason) {
  return { state: 'failed', at: isoNow(), partial: false, coverage: { routes: [], states: [], widths: [], themes: [] }, engine: { name: 'uie', version: version() }, hits: 0, errors: [reason], notes: [] };
}

/** Pre-flight failures are recorded for checks that have no entry yet; earlier results are never overwritten. */
function recordPreflightFailure(runDir, checks, reason) {
  const p = path.join(runDir, 'checks.json');
  const doc = readJson(p, { checks: {} });
  doc.checks = doc.checks || {};
  let n = 0;
  for (const c of checks) {
    if (doc.checks[c]) continue;
    doc.checks[c] = failedEntry(reason);
    n += 1;
  }
  if (n) {
    doc.updated_at = isoNow();
    writeJson(p, doc);
  }
}

function loadBaseline(root, id) {
  if (!id) return null;
  const b = resolveRun(root, String(id));
  const doc = readJson(path.join(b.dir, 'checks.json'), null);
  if (!doc) throw new UsageError(`baseline run ${b.id} has no checks.json`);
  return { run: b.id, checks: doc.checks || {} };
}

export async function run(args, ctx) {
  if (args.list) {
    const rows = describeChecks();
    ctx.result(rows);
    for (const r of rows) ctx.print(`${r.name.padEnd(13)} ${r.mode.padEnd(10)} ${r.criteria.join(', ')}`);
    return 0;
  }
  const checks = resolveChecks(args);
  const r = resolveRun(ctx.root, args.run);
  const config = loadConfig(ctx.root, { required: true });
  const routes = list(args.route);
  const scope = buildScope(config, { routes });
  const allowRemote = !!args['allow-remote'];
  const baseline = loadBaseline(ctx.root, args.baseline);
  let deps;
  try {
    deps = await loadDeps(ctx.root);
  } catch (err) {
    recordPreflightFailure(r.dir, checks, err.userMessage || err.message);
    throw err;
  }
  let app;
  try {
    app = await ensureApp(config, ctx.root, { allowRemote, log: (m) => ctx.info(m) });
  } catch (err) {
    recordPreflightFailure(r.dir, checks, err.userMessage || err.message);
    throw err;
  }
  const t0 = Date.now();
  let out;
  let runner;
  try {
    ctx.info(`audit run ${r.id}: ${checks.length} check(s) over ${scope.routes.length} route(s) × widths ${scope.widths.join('/')} × themes ${scope.themes.join('/')}`);
    runner = new AuditRunner({
      root: ctx.root,
      config,
      runDir: r.dir,
      runId: r.id,
      deps,
      checks,
      routes,
      allowRemote,
      baseline,
      engineVersion: version(),
      app,
      fixedTime: runClock(config, readManifest(r.dir)?.created_at),
      log: (m) => {
        if (process.env.UIE_DEBUG) ctx.warn(m);
      },
    });
    out = await runner.run();
  } finally {
    await app.stop();
  }
  const written = writeAuditOutputs(r.dir, { results: out.results, stills: out.stills, blocked: out.blocked, assetHosts: out.assetHosts, scope, config, deps });
  // Routes that redirected to a sign-in page (LOOP-012): recorded in checks.json and the manifest scope.
  const walls = runner.session.authWalls.map((w) => ({ route: w.route, final_url: w.final_url }));
  if (walls.length) {
    const doc = readJson(written.checksPath, { checks: {} });
    doc.auth_walls = walls;
    writeJson(written.checksPath, doc);
  }
  // Manifest: scope as audited, tool versions, captures (audit stills and preference/CVD captures).
  const man = readManifest(r.dir) || {};
  const tools = { ...(man.tools || {}), node: process.version, uie: version(), ...toolVersions(deps, runner.browserVersion) };
  const audits = [...(man.scope?.audits || []), { at: isoNow(), checks, routes: scope.routes.map((x) => x.path), widths: scope.widths, themes: scope.themes }].slice(-20);
  const captureItems = out.stills.map((s) => ({ kind: s.kind || 'audit', file: s.file, route: s.route, state: s.state, width: s.width, theme: s.theme, preference: s.preference, valid: s.valid !== false, reasons: s.reasons || [] }));
  updateManifest(r.dir, {
    scope: { ...(man.scope || {}), base_url: config.app?.base_url, routes: man.scope?.routes || config.routes.map((x) => ({ path: x.path, surface: x.surface, mode: x.mode, states: (x.states || []).map((s) => s.name) })), matrix: man.scope?.matrix || config.matrix, audits, ...(walls.length ? { auth_walls: walls } : {}) },
    tools,
    captures: mergeCaptures(man.captures, captureItems),
  });
  // Summary.
  const rows = Object.entries(out.results).sort(([a], [b]) => CHECK_NAMES.indexOf(a) - CHECK_NAMES.indexOf(b)).map(([name, res]) => {
    const e = res.entry;
    // Gate-level: a hit of a gate criterion in rules.json (advisory FUN-08, and LAY-08 or COL-17, never count).
    const gateHits = res.hits.filter((h) => h.gate && !h.advisory).length;
    return { check: name, state: e.state, partial: !!e.partial, hits: res.hits.length, gate_hits: gateHits, errors: e.errors.slice(0, 3), skip_reason: e.skip_reason || null, not_applicable: e.not_applicable || null };
  });
  const failed = rows.filter((x) => x.state === 'failed');
  const skipped = rows.filter((x) => x.state === 'skipped');
  const gateHits = rows.reduce((a, x) => a + x.gate_hits, 0);
  const totalHits = rows.reduce((a, x) => a + x.hits, 0);
  const code = failed.length ? 1 : gateHits || skipped.length ? 2 : 0;
  appendIndex(ctx.root, `audit ${r.id}: ${rows.length} check(s), ${totalHits} hit(s) (${gateHits} gate-level), ${failed.length} failed, ${skipped.length} skipped`);
  const rel = (p) => path.relative(ctx.root, p);
  ctx.result({ run: r.id, checks: rows, hits: totalHits, gate_hits: gateHits, auth_walls: walls, duration_ms: Date.now() - t0, files: { tool_findings: rel(written.jsonl), checks: rel(written.checksPath) }, blocked_remote_requests: out.blocked.length, exit: code });
  ctx.print(`audit run ${r.id} (${Math.round((Date.now() - t0) / 1000)} s)`);
  for (const x of rows) {
    const state = `${x.state}${x.partial ? ' (partial)' : ''}`;
    const extra = x.state === 'skipped' ? `  ${x.skip_reason || ''}` : x.state === 'failed' ? `  ${x.errors[0] || ''}` : x.not_applicable ? `  not applicable: ${x.not_applicable}` : '';
    ctx.print(`  ${x.check.padEnd(13)} ${state.padEnd(16)} ${String(x.hits).padStart(4)} hit(s)${x.hits !== x.gate_hits ? ` (${x.hits - x.gate_hits} advisory or outside the gates)` : ''}${extra}`);
  }
  ctx.print(`${totalHits} hit(s), ${gateHits} gate-level → ${rel(written.jsonl)}; checks → ${rel(written.checksPath)}`);
  for (const w of walls) ctx.print(`${w.route} redirected to a sign-in page. ${AUTH_WALL_ADVICE}`);
  if (out.blocked.length) ctx.warn(`${out.blocked.length} request(s) to non-local hosts were blocked (pass --allow-remote to allow them)`);
  if (failed.length) ctx.warn(`${failed.length} check(s) failed and stay not_run in the gates: ${failed.map((x) => x.check).join(', ')}`);
  if (skipped.length) ctx.warn(`${skipped.length} check(s) skipped; their criteria stay not_run: ${skipped.map((x) => x.check).join(', ')}`);
  if (!exists(path.join(r.dir, 'merged.json'))) ctx.info('next: `uie findings merge`, then `uie gates`');
  return code;
}
