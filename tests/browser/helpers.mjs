// Shared helpers for the browser-layer tests: availability detection (tests skip cleanly without Chromium or the
// runtime packages), a static server in a child process (so spawnSync CLI calls cannot block it), temporary
// projects and a CLI runner.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '../..');
export const SCRIPTS = path.join(ROOT, 'skills/ui-evaluator/scripts');
export const LIB = path.join(SCRIPTS, 'lib');
export const UIE = path.join(SCRIPTS, 'uie.mjs');
export const FIX = path.join(ROOT, 'tests/fixtures/browser');

export const lib = (rel) => import(pathToFileURL(path.join(LIB, rel)).href);

let availability = null;
/** {ok, reason}: true when Playwright, the browser packages and the Chromium binary are all present. */
export async function browserAvailable() {
  if (availability) return availability;
  try {
    const { loadBrowserDeps, chromiumInstalled, BROWSER_PACKAGES } = await lib('deps.mjs');
    const deps = await loadBrowserDeps({ require: Object.keys(BROWSER_PACKAGES) });
    const c = chromiumInstalled(deps.playwright);
    availability = c.ok ? { ok: true, deps } : { ok: false, reason: 'Chromium is not installed (uie doctor --install)' };
  } catch (err) {
    availability = { ok: false, reason: `browser runtime unavailable: ${(err.userMessage || err.message).split('\n')[0]}` };
  }
  // `node tools/run-tests.mjs browser|all` sets UIE_REQUIRE_BROWSER: a missing browser fails loudly there instead of
  // turning every browser test into a silent skip.
  if (!availability.ok && process.env.UIE_REQUIRE_BROWSER === '1') throw new Error(`${availability.reason} (UIE_REQUIRE_BROWSER=1)`);
  return availability;
}

/** Serve `dir` from a child process; returns {url, stop()}. `routes` are scripted responses (static-server.mjs). */
export async function serveInChild(dir, routes = {}) {
  const code = `
    const { serveStatic } = await import(${JSON.stringify(pathToFileURL(path.join(LIB, 'browser/static-server.mjs')).href)});
    const srv = await serveStatic(${JSON.stringify(dir)}, { routes: ${JSON.stringify(routes)} });
    process.stdout.write(srv.url + '\\n');
    process.on('SIGTERM', async () => { await srv.close(); process.exit(0); });
    setInterval(() => {}, 1 << 30);
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', code], { stdio: ['ignore', 'pipe', 'inherit'] });
  const url = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('static server did not start')), 10000);
    child.stdout.on('data', (d) => {
      buf += d;
      const line = buf.split('\n')[0];
      if (buf.includes('\n')) {
        clearTimeout(timer);
        resolve(line.trim());
      }
    });
    child.on('exit', (c) => reject(new Error(`static server exited (${c})`)));
  });
  return {
    url,
    stop: () =>
      new Promise((resolve) => {
        child.once('exit', () => resolve());
        child.kill('SIGTERM');
        setTimeout(() => {
          try {
            child.kill('SIGKILL');
          } catch {
            /* gone */
          }
          resolve();
        }, 3000);
      }),
  };
}

/** A temporary project with .ui-evaluator/ initialised; returns {root, uie(...args), write(rel, data), read(rel)}. */
export function makeProject(prefix = 'uie-browser-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const env = { ...process.env, UIE_HOME: path.join(root, '.home') };
  const uie = (...args) => {
    const r = spawnSync(process.execPath, [UIE, ...args], { cwd: root, env, encoding: 'utf8', timeout: 240000 });
    return { code: r.status, out: r.stdout || '', err: r.stderr || '', json: () => JSON.parse(r.stdout) };
  };
  const abs = (rel) => path.join(root, rel);
  const write = (rel, data) => {
    fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
    fs.writeFileSync(abs(rel), typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  };
  const read = (rel) => JSON.parse(fs.readFileSync(abs(rel), 'utf8'));
  const exists = (rel) => fs.existsSync(abs(rel));
  const cleanup = () => fs.rmSync(root, { recursive: true, force: true });
  return { root, env, uie, write, read, exists, abs, cleanup };
}

/** The latest run directory of a project. */
export function latestRun(root) {
  const id = fs.readFileSync(path.join(root, '.ui-evaluator/runs/LATEST'), 'utf8').trim();
  return { id, dir: path.join(root, '.ui-evaluator/runs', id) };
}

export function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

/** Run the AuditRunner in-process on fixture files served in-process (no CLI). */
export async function runChecks({ deps, files, checks, widths = [1280], themes = ['light'], mode = 'operate', preferences = ['default'], g2 = [], routeExtra = {}, dir = FIX, serverRoutes = {} }) {
  const { serveStatic } = await lib('browser/static-server.mjs');
  const { AuditRunner, selectChecks } = await lib('browser/runner.mjs');
  const srv = await serveStatic(dir, { routes: serverRoutes });
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-run-'));
  try {
    const config = {
      app: { base_url: srv.url, timeout_ms: 20000 },
      routes: files.map((f) => ({ path: `/${f}`, surface: f.replace(/\.html.*$/, '').replace(/[^a-z0-9]+/gi, '-'), mode, states: [{ name: 'default', actions: [] }], ...routeExtra })),
      matrix: { widths, height: 800, device_scale_factor: 1, themes, preferences, g2_preferences: g2 },
      locales: { list: ['en'] },
    };
    const runner = new AuditRunner({ root: null, config, runDir, deps, checks: selectChecks({ checks }), designText: '', productText: '', noSourceSearch: true });
    const out = await runner.run();
    return { out, runDir, session: runner.session, byCheck: (name) => out.results[name], criteria: (name) => out.results[name].hits.map((h) => h.criteria[0].id) };
  } finally {
    await srv.close();
  }
}
