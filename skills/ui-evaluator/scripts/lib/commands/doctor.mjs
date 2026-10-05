// uie doctor — check Node ≥ 20, the browser runtime (ARCHITECTURE §7.4) and Chromium, then run the smoke test:
// every audit check against assets/fixtures/known-bad.html, served from a temporary local server, compared with
// assets/fixtures/known-bad.expected.json (EVD-02). Writes .ui-evaluator/doctor.json inside a project and
// $UIE_HOME/doctor.json always.
// `--install` installs the pinned runtime into the cache — only when the flag is given, after the owner agreed.
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson, exists, isDir } from '../util/fs.mjs';
import { UsageError } from '../util/args.mjs';
import { isoNow } from '../util/time.mjs';
import { paths } from '../project.mjs';
import { version, SKILL_DIR } from '../cli.mjs';
import { dependencyReport, loadBrowserDeps, installRuntime, browserCacheRegistration, runtimeDir, BROWSER_PACKAGES, resetDepsCache, uieHome } from '../deps.mjs';
import { launchBrowser } from '../browser/launch.mjs';
import { serveStatic } from '../browser/static-server.mjs';
import { AuditRunner, writeAuditOutputs } from '../browser/runner.mjs';
import { CHECK_NAMES } from '../browser/checks/index.mjs';
import { compareSmoke } from '../browser/smoke.mjs';

export { compareSmoke };

export const argSpec = { boolean: ['json', 'quiet', 'install', 'no-smoke', 'keep'] };

export const help = `uie doctor [--install] [--no-smoke] [--keep] [--json]

Checks Node.js ≥ 20, resolves the browser runtime (scripts/node_modules → the runtime cache
$UIE_HOME/runtime/<deps-hash> → the project's playwright), launches Chromium, and runs the smoke test: every audit
check against assets/fixtures/known-bad.html on a temporary 127.0.0.1 server, compared with
assets/fixtures/known-bad.expected.json. Each expected detection must fire (EVD-02). Expectations of a check that
is not implemented yet (skipped) are reported as pending, and the doctor does not pass while any are pending.
Inside a project it writes .ui-evaluator/doctor.json {passed, at, versions, missing, smoke}, and it always writes a
machine-level copy to $UIE_HOME/doctor.json. \`uie gates\` reads the newer of the two (fresh within 24 h, same version).

  --install   install the pinned browser runtime (Playwright with Chromium, axe-core, pixelmatch, pngjs,
              web-vitals, colorjs.io) into the runtime cache with npm and Playwright's browser download — about
              about 110 MB, outside the project; the project's package.json is never touched. The skill must ASK THE
              OWNER FIRST and state that size; the command installs only when this flag is given.
  --no-smoke  check the toolchain only (the smoke test is what proves the checks can see problems; EVD-02 needs it)
  --keep      keep the smoke-test run directory and print its path
Exit codes: 0 toolchain ready and every expected detection fired · 2 the smoke test missed, crashed or is
pending · 1 could not run (Node too old, runtime missing, Chromium does not launch).`;

export const FIXTURES_DIR = path.join(SKILL_DIR, 'assets', 'fixtures');

function nodeOk() {
  const major = Number(process.versions.node.split('.')[0]);
  return { ok: major >= 20, version: process.version };
}

async function smokeTest(deps, browser, ctx, { keep }) {
  const expFile = path.join(FIXTURES_DIR, 'known-bad.expected.json');
  const fixture = path.join(FIXTURES_DIR, 'known-bad.html');
  if (!exists(expFile) || !exists(fixture)) throw new UsageError(`the smoke-test fixture is missing (${path.relative(SKILL_DIR, fixture)}, ${path.relative(SKILL_DIR, expFile)})`);
  const spec = readJson(expFile);
  const srv = await serveStatic(FIXTURES_DIR, { routes: spec.scope.server_routes || {} });
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-smoke-'));
  const t0 = Date.now();
  try {
    const config = {
      app: { base_url: srv.url, timeout_ms: 20000 },
      routes: spec.scope.routes,
      matrix: spec.scope.matrix,
      locales: spec.scope.locales || { list: ['en'] },
    };
    const runner = new AuditRunner({ root: null, config, runDir, deps, browser, checks: [...CHECK_NAMES], engineVersion: version(), designText: '', productText: '', noSourceSearch: true, log: (m) => process.env.UIE_DEBUG && ctx.warn(m) });
    const out = await runner.run();
    writeAuditOutputs(runDir, { results: out.results, stills: out.stills, blocked: out.blocked });
    const cmp = compareSmoke(out.results, spec.expected);
    return { ...cmp, duration_ms: Date.now() - t0, run_dir: keep ? runDir : null, checks_total: Object.keys(out.results).length };
  } finally {
    await srv.close();
    if (!keep) fs.rmSync(runDir, { recursive: true, force: true });
  }
}

export async function run(args, ctx) {
  const report = { at: isoNow(), uie: version(), node: nodeOk(), runtime: { cache: runtimeDir() }, versions: { node: process.version, uie: version() }, missing: [], chromium: null, smoke: null, passed: false };
  const node = report.node;
  ctx.print(`node ${node.version}: ${node.ok ? 'ok' : 'too old (UI-Evaluator needs Node.js ≥ 20)'}`);
  if (args.install) {
    ctx.print(`installing the pinned browser runtime into ${runtimeDir()} (about 110 MB; the owner agreed to this) …`);
    try {
      installRuntime({ log: (m) => ctx.print(m) });
    } catch (err) {
      throw new UsageError(`--install failed: ${err.userMessage || err.message}`);
    }
    resetDepsCache();
  }
  const depReport = dependencyReport(ctx.root);
  report.dependencies = depReport;
  for (const [name, r] of Object.entries(depReport)) {
    if (r) report.versions[name] = r.version;
    else report.missing.push(name);
    ctx.print(`${name.padEnd(22)} ${r ? `${r.version} (${r.source})` : 'MISSING'}`);
  }
  let deps = null;
  let browser = null;
  let code = 0;
  try {
    if (!node.ok) code = 1;
    else if (report.missing.length) {
      ctx.print(`browser layer missing: ${report.missing.join(', ')}. Ask the owner, then run \`uie doctor --install\` (about 110 MB into ${runtimeDir()}).`);
      code = 1;
    } else {
      deps = await loadBrowserDeps({ projectRoot: ctx.root, require: Object.keys(BROWSER_PACKAGES) });
      try {
        browser = await launchBrowser(deps);
        report.chromium = browser.version();
        report.versions.chromium = report.chromium;
        ctx.print(`chromium               ${report.chromium} (launches)`);
      } catch (err) {
        report.missing.push('chromium');
        ctx.print(`chromium               MISSING (${String(err.userMessage || err.message).split('\n')[0]}). Ask the owner, then run \`uie doctor --install\`.`);
        code = 1;
      }
      const reg = browserCacheRegistration(deps.resolved.playwright);
      report.browser_cache = reg;
      if (reg.registered === false) {
        ctx.print(`browser cache          this Playwright (${reg.coreDir}) is not registered in ${reg.linksDir}: another project's \`playwright install\` can delete its Chromium. Re-run \`uie doctor --install\` (no download when the build is present).`);
      }
    }
    if (!code && args['no-smoke']) {
      ctx.print('smoke test skipped (--no-smoke): EVD-02 stays unproven until `uie doctor` runs it.');
      code = 2;
    } else if (!code) {
      ctx.print('smoke test: every check against assets/fixtures/known-bad.html …');
      const s = await smokeTest(deps, browser, ctx, { keep: !!args.keep });
      report.smoke = { fixture: 'assets/fixtures/known-bad.html', expected: 'assets/fixtures/known-bad.expected.json', duration_ms: s.duration_ms, checks: s.rows, missed: s.missed, pending: s.pending, crashed: s.crashed, unexpected_checks: s.unexpected, run_dir: s.run_dir };
      for (const r of s.rows) {
        const status = r.state === 'skipped' ? 'PENDING' : r.missed.length ? 'MISSED' : 'ok';
        const detail = r.state === 'skipped' ? `${r.expected.join(', ')} pending (${r.note})` : r.missed.length ? `missed ${r.missed.join(', ')}${r.note ? ` (${r.note})` : ''}` : r.expected.join(', ') || 'evidence only';
        ctx.print(`  ${r.check.padEnd(13)} ${status.padEnd(8)} ${detail}${r.owner ? ` [${r.owner}]` : ''}`);
      }
      if (s.run_dir) ctx.print(`smoke run kept at ${s.run_dir}`);
      if (s.missed.length || s.crashed.length) code = 2;
      else if (s.pending.length) {
        code = 2;
        ctx.print(`${s.pending.length} expected detection(s) pending: checks not implemented yet. EVD-02 is not met until they fire.`);
      }
      ctx.print(`smoke test: ${s.rows.reduce((a, r) => a + r.fired.length, 0)} of ${s.rows.reduce((a, r) => a + r.expected.length, 0)} expected detection(s) fired in ${Math.round(s.duration_ms / 1000)} s; ${s.missed.length} missed, ${s.pending.length} pending, ${s.crashed.length} crashed.`);
    }
  } catch (err) {
    ctx.warn(err.userMessage || err.message);
    report.error = err.userMessage || err.message;
    code = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
  report.passed = code === 0;
  const p = paths(ctx.root);
  if (isDir(p.ws)) {
    writeJson(p.doctor, report);
    ctx.print(`wrote ${path.relative(ctx.root, p.doctor)} (passed: ${report.passed})`);
  }
  // Also kept per machine, so a doctor run before `uie init` (or in another project) still counts for EVD-02 when it is
  // fresh and from the same skill version. `uie gates` reads whichever of the two is newer.
  try {
    writeJson(path.join(uieHome(), 'doctor.json'), { ...report, cwd: ctx.root || process.cwd() });
  } catch {
    // the machine-level copy is a convenience; the project copy is the record
  }
  ctx.result(report);
  ctx.print(report.passed ? 'doctor: ready (EVD-02 met for this session).' : `doctor: not ready (exit ${code}).`);
  return code;
}
