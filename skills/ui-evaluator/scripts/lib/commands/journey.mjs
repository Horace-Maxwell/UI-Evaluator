// uie journey <id> — replay a journey's correct_actions from its start state and check its success condition
// (FUN-03; ARCHITECTURE §8.5). Per-step evidence (status, URL, timing, screenshot) goes to
// runs/<run>/journeys/<id>.json and runs/<run>/journeys/<id>/step-NN.png. A failed replay adds a FUN-03 hit (and
// console errors during the replay FUN-02 hits) to tool-findings.jsonl; checks.json records `journeys`.
import path from 'node:path';
import { readJson, writeJson, exists, ensureDir, readJsonl, writeJsonl, writeText } from '../util/fs.mjs';
import { UsageError, intOpt } from '../util/args.mjs';
import { isoNow } from '../util/time.mjs';
import { validate, loadSchema } from '../schema.mjs';
import { paths, resolveRun, loadConfig, loadJourneys, appendIndex, readManifest, updateManifest } from '../project.mjs';
import { version } from '../cli.mjs';
import { pageState, BrowserSession, AUTH_WALL_ADVICE } from '../browser/pages.mjs';
import { launchBrowser, resolveUrl } from '../browser/launch.mjs';
import { runActions, checkPredicate } from '../browser/actions.mjs';
import { ariaSnapshot, runClock } from '../browser/capture.mjs';
import { makeHit } from '../browser/hits.mjs';
import { ensureApp } from '../browser/app.mjs';
import { loadDeps, toolVersions } from '../browser/command-kit.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'all', 'allow-remote'] };

export const help = `uie journey <id> [--all] [--run <id>] [--width <px>] [--storage-state <file>] [--timeout <ms>] [--allow-remote] [--json]

Replays .ui-evaluator/journeys/<id>.json: opens start_state.url (against config.app.base_url) at
start_state.viewport_width (or --width), performs correct_actions in order and checks success_condition
(every predicate in "all" and at least one in "any"; predicates {url}, {text, target?} or {target, state}).
--all replays every journey. --storage-state <file> loads a Playwright storage state (a signed-in session the
owner saved); journeys never carry credentials.

Writes runs/<run>/journeys/<id>.json (per-step evidence) and step screenshots; a failure adds a FUN-03 hit, and
console errors during the replay add FUN-02 hits, to tool-findings.jsonl; checks.json records "journeys"
(partial while critical journeys of the project have not been replayed in this run).
Exit codes: 0 every replayed journey succeeded · 2 a journey failed · 1 could not run.`;

const CHECK = 'journeys';

function loadJourney(root, id) {
  const file = path.join(paths(root).journeys, `${id}.json`);
  if (!exists(file)) {
    const known = loadJourneys(root).map((j) => j.id);
    throw new UsageError(`no journey "${id}" (${path.relative(root, file)}).${known.length ? ` Known: ${known.join(', ')}` : ' No journeys yet; see references/templates/journey.example.json'}`);
  }
  const doc = readJson(file);
  const res = validate(loadSchema('journey'), doc);
  if (!res.valid) throw new UsageError(`${path.relative(root, file)} is invalid:\n${res.errors.slice(0, 8).map((e) => `  ${e.path}: ${e.message}`).join('\n')}`);
  return { ...doc, id: doc.id || id, _file: file };
}

function routeOf(url, base) {
  try {
    const u = new URL(url, base);
    return u.pathname || '/';
  } catch {
    return String(url);
  }
}

async function evaluateCondition(page, cond, timeout) {
  const all = Array.isArray(cond?.all) ? cond.all : [];
  const any = Array.isArray(cond?.any) ? cond.any : [];
  if (!all.length && !any.length) return { ok: false, mode: 'none', results: [], detail: 'the success condition has no predicates ("all" or "any"), so success cannot be checked' };
  const results = [];
  for (const p of all) results.push({ group: 'all', predicate: p, ...(await checkPredicate(page, p, timeout)) });
  for (const p of any) results.push({ group: 'any', predicate: p, ...(await checkPredicate(page, p, Math.min(timeout, 3000))) });
  const allOk = results.filter((r) => r.group === 'all').every((r) => r.ok);
  const anyOk = !any.length || results.filter((r) => r.group === 'any').some((r) => r.ok);
  const failed = results.filter((r) => (r.group === 'all' && !r.ok) || (r.group === 'any' && !anyOk));
  return { ok: allOk && anyOk, mode: all.length && any.length ? 'all+any' : all.length ? 'all' : 'any', results, detail: failed.map((r) => r.detail).join('; ') };
}

async function replay(j, { session, runDir, base, timeout, storageState }) {
  const dir = ensureDir(path.join(runDir, 'journeys', j.id));
  const startUrl = resolveUrl(base, j.start_state.url);
  const width = j._width || j.start_state.viewport_width || 1280;
  const routeCfg = { path: j.start_state.url, mode: 'operate', states: [{ name: `journey:${j.id}`, actions: [] }] };
  const ps = pageState({ routeCfg, stateCfg: routeCfg.states[0], width, height: j._height || 900, theme: 'light', preference: 'default' });
  const t0 = Date.now();
  const out = { schema: 'journey-replay', journey: j.id, title: j.title, criticality: j.criticality, at: isoNow(), start_url: startUrl, viewport: { width, height: ps.height }, steps: [], ok: false };
  const pg = await session.open(ps, { settle: false, recipe: false, storageState });
  try {
    out.load = { status: pg.load.status, ms: pg.load.ms, ok: !!pg.load.ok, error: pg.load.error || null };
    if (pg.authWall) {
      out.auth_wall = { route: pg.authWall.route, final_url: pg.authWall.final_url };
      out.failure = { step: 0, reason: pg.load.error };
    } else if (!pg.load.ok) {
      out.failure = { step: 0, reason: pg.error || `could not open ${startUrl}` };
    } else {
      const shoot = async (step) => {
        const file = path.join(dir, `step-${String(step.step).padStart(2, '0')}.png`);
        try {
          await pg.page.screenshot({ path: file, animations: 'disabled', caret: 'hide' });
          step.screenshot = path.relative(runDir, file).split(path.sep).join('/');
        } catch {
          /* the page may be navigating */
        }
      };
      const res = await runActions(pg.page, j.correct_actions, { baseUrl: base, allowRemote: session.allowRemote, timeout, outDir: dir, onStep: shoot });
      out.steps = res.steps;
      if (!res.ok) {
        const bad = res.steps.find((s) => !s.ok);
        out.failure = { step: bad ? bad.step : 0, reason: res.error, target: bad?.target || null };
      } else {
        const cond = await evaluateCondition(pg.page, j.success_condition, Math.min(timeout, 8000));
        out.success_condition = cond;
        if (cond.ok) out.ok = true;
        else out.failure = { step: 'success_condition', reason: cond.detail };
      }
      out.final_url = pg.page.url();
      if (!out.ok) {
        try {
          const f = path.join(dir, 'failure.yml');
          writeText(f, `${await ariaSnapshot(pg.page)}\n`);
          out.failure.aria = path.relative(runDir, f).split(path.sep).join('/');
        } catch {
          /* best effort */
        }
      }
    }
    out.console = { errors: pg.console.slice(0, 30), page_errors: pg.pageErrors.slice(0, 20) };
    out.network = { failed: pg.failedRequests.slice(0, 30), bad_responses: pg.badResponses.slice(0, 30) };
  } finally {
    await pg.close();
  }
  out.duration_ms = Date.now() - t0;
  return out;
}

function hitsFor(j, out, base, rel) {
  const engine = { name: 'uie/journeys', version: version() };
  const route = routeOf(j.start_state.url, base);
  const viewport = out.viewport;
  const where = { route, state: `journey:${j.id}`, journey: j.id, viewport };
  const hits = [];
  // A sign-in page instead of the start state is a setup problem, not a journey failure: no FUN-03 hit (LOOP-012).
  if (!out.ok && !out.auth_wall) {
    const f = out.failure || {};
    const shot = out.steps.find((s) => s.step === f.step)?.screenshot || out.steps.at(-1)?.screenshot;
    hits.push(makeHit({
      check: CHECK,
      engine,
      rule: 'FUN-03',
      title: `Journey "${j.title || j.id}" does not complete${typeof f.step === 'number' && f.step > 0 ? ` (step ${f.step})` : f.step === 'success_condition' ? ' (success condition not met)' : ''}`,
      description: `Replaying the ${j.criticality || ''} journey "${j.title || j.id}" from ${out.start_url} ${typeof f.step === 'number' && f.step > 0 ? `failed at step ${f.step}` : f.step === 'success_condition' ? 'finished its steps but the success condition does not hold' : 'could not start'}: ${f.reason || 'unknown reason'}.`,
      location: { ...where, step: f.step, ...(f.target ? { snippet: String(f.target) } : {}) },
      evidence: [{ type: 'probe', ref: rel, detail: String(f.reason || '').slice(0, 300) }, ...(shot ? [{ type: 'screenshot', ref: shot, detail: 'state at the failing step' }] : []), ...(f.aria ? [{ type: 'aria', ref: f.aria, detail: 'ARIA snapshot at the failure' }] : [])],
      problem_type: 'single_location',
      tags: ['journey'],
    }));
  }
  const seen = new Set();
  for (const e of [...out.console.page_errors.map((p) => ({ kind: 'uncaught exception', text: p.message })), ...out.console.errors.map((c) => ({ kind: 'console error', text: c.text }))]) {
    const sig = `${e.kind}|${String(e.text).replace(/\d+/g, '#').slice(0, 160)}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    hits.push(makeHit({
      check: CHECK,
      engine,
      rule: 'FUN-02',
      title: `${e.kind === 'uncaught exception' ? 'Uncaught exception' : 'Console error'} during journey "${j.title || j.id}"`,
      description: `${e.kind === 'uncaught exception' ? 'An uncaught exception' : 'A console error'} was raised while replaying the journey: "${String(e.text).slice(0, 200)}".`,
      location: { ...where, selector: 'html', snippet: String(e.text).slice(0, 200) },
      evidence: [{ type: 'console', value: String(e.text).slice(0, 500), ref: rel, detail: 'journey replay' }],
      tags: ['journey'],
    }));
  }
  return hits;
}

function recordRun(runDir, root, results, base) {
  // tool-findings.jsonl: replace this command's earlier hits for the replayed journeys.
  const jsonl = path.join(runDir, 'tool-findings.jsonl');
  const replayed = new Set(results.map((r) => r.journey.id));
  const kept = exists(jsonl) ? readJsonl(jsonl).filter((h) => !(h.found_by?.[0]?.check === CHECK && replayed.has(h.locations?.[0]?.journey))) : [];
  const fresh = results.flatMap((r) => r.hits);
  writeJsonl(jsonl, [...kept, ...fresh]);
  // checks.json: merge per-journey results.
  const p = path.join(runDir, 'checks.json');
  const doc = readJson(p, { checks: {} });
  doc.checks = doc.checks || {};
  const prev = doc.checks[CHECK] || {};
  const per = { ...(prev.journeys || {}) };
  for (const r of results) per[r.journey.id] = { ok: r.out.ok, ...(r.out.auth_wall ? { auth_wall: r.out.auth_wall.final_url } : {}), criticality: r.journey.criticality, file: r.rel, at: r.out.at, failure: r.out.ok ? null : r.out.failure?.reason?.slice(0, 200) || null, failed_step: r.out.ok ? null : r.out.failure?.step ?? null, route: routeOf(r.journey.start_state.url, base), width: r.out.viewport.width };
  const critical = loadJourneys(root).filter((j) => j.criticality === 'critical').map((j) => j.id);
  const missing = critical.filter((id) => !per[id] || per[id].auth_wall);
  const hitsTotal = (exists(jsonl) ? readJsonl(jsonl) : []).filter((h) => h.found_by?.[0]?.check === CHECK).length;
  doc.checks[CHECK] = {
    state: 'ran',
    at: isoNow(),
    partial: missing.length > 0,
    coverage: { routes: [...new Set(Object.values(per).map((x) => x.route))], states: Object.keys(per).map((id) => `${per[id].route}#journey:${id}`), widths: [...new Set(Object.values(per).map((x) => x.width))], themes: ['light'] },
    engine: { name: 'uie/journeys', version: version() },
    hits: hitsTotal,
    errors: [],
    notes: missing.length ? [`critical journeys not replayed in this run: ${missing.join(', ')}`] : [],
    journeys: per,
  };
  doc.updated_at = isoNow();
  writeJson(p, doc);
  return { jsonl, checks: p, missing };
}

export async function run(args, ctx) {
  const ids = args.all ? loadJourneys(ctx.root).map((j) => j.id) : args._.slice(0, 1);
  if (!ids.length) throw new UsageError(args.all ? 'no journeys in .ui-evaluator/journeys/' : 'give a journey id: `uie journey <id>` (or --all)');
  const journeys = ids.map((id) => loadJourney(ctx.root, id));
  const config = loadConfig(ctx.root, { required: true });
  const r = resolveRun(ctx.root, args.run);
  const allowRemote = !!args['allow-remote'];
  const timeout = args.timeout ? intOpt(args.timeout, 'timeout', { min: 500, max: 60000 }) : 10000;
  const width = args.width ? intOpt(args.width, 'width', { min: 200, max: 4000 }) : null;
  let storageState;
  if (args['storage-state']) {
    storageState = path.resolve(String(args['storage-state']));
    if (!exists(storageState)) throw new UsageError(`--storage-state: ${storageState} does not exist`);
  }
  for (const j of journeys) if (j.start_state.auth && !storageState) ctx.warn(`journey ${j.id} expects "${j.start_state.auth}"; without --storage-state it starts signed out`);
  const deps = await loadDeps(ctx.root);
  const app = await ensureApp(config, ctx.root, { allowRemote, log: (m) => ctx.info(m) });
  const base = config.app.base_url;
  const results = [];
  let browser = null;
  try {
    browser = await launchBrowser(deps);
    for (const j of journeys) {
      const session = new BrowserSession({ deps, browser, baseUrl: base, allowRemote, actionTimeout: timeout, loadTimeout: config.app?.timeout_ms || 60000, locale: j.start_state.locale || null, app, fixedTime: runClock(config, readManifest(r.dir)?.created_at) });
      j._width = width;
      j._height = config.matrix?.height || 900;
      const out = await replay(j, { session, runDir: r.dir, base, timeout, storageState });
      const file = path.join(r.dir, 'journeys', `${j.id}.json`);
      const rel = path.relative(r.dir, file).split(path.sep).join('/');
      writeJson(file, out);
      results.push({ journey: j, out, rel, hits: hitsFor(j, out, base, rel) });
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    await app.stop();
  }
  const rec = recordRun(r.dir, ctx.root, results, base);
  const man = readManifest(r.dir);
  if (man) updateManifest(r.dir, { tools: { ...(man.tools || {}), node: process.version, uie: version(), ...toolVersions(deps, null) } });
  const failed = results.filter((x) => !x.out.ok);
  appendIndex(ctx.root, `journey ${results.map((x) => `${x.journey.id}:${x.out.ok ? 'ok' : 'failed'}`).join(', ')} in run ${r.id}`);
  ctx.result({ run: r.id, journeys: results.map((x) => ({ id: x.journey.id, ok: x.out.ok, file: path.relative(ctx.root, path.join(r.dir, x.rel)), failure: x.out.failure || null, steps: x.out.steps.length, hits: x.hits.length })), not_replayed_critical: rec.missing });
  for (const x of results) {
    ctx.print(`journey ${x.journey.id}: ${x.out.ok ? 'succeeded' : 'FAILED'} (${x.out.steps.filter((s) => s.ok).length}/${x.journey.correct_actions.length} steps, ${Math.round(x.out.duration_ms / 100) / 10} s) → ${path.relative(ctx.root, path.join(r.dir, x.rel))}`);
    if (!x.out.ok) ctx.print(`  ${x.out.failure?.step === 'success_condition' ? 'success condition' : `step ${x.out.failure?.step}`}: ${x.out.failure?.reason}`);
    if (x.hits.length) ctx.print(`  ${x.hits.length} hit(s) → tool-findings.jsonl (${[...new Set(x.hits.map((h) => h.criteria[0].id))].join(', ')})`);
  }
  const walled = results.filter((x) => x.out.auth_wall);
  for (const x of walled) ctx.print(`${x.out.auth_wall.route} redirected to a sign-in page. ${AUTH_WALL_ADVICE} (journey ${x.journey.id}; --storage-state loads a saved test session)`);
  if (rec.missing.length) ctx.warn(`critical journeys not yet replayed in this run: ${rec.missing.join(', ')} (FUN-03 stays degraded)`);
  if (walled.length) return 1;
  return failed.length ? 2 : 0;
}
