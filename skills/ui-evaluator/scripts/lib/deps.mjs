// Runtime dependency resolution for the browser layer (ARCHITECTURE §7.4).
// Order: scripts/node_modules → $UIE_HOME/runtime/<deps-hash>/node_modules → the project's node_modules
// (playwright only). Packages are located with createRequire and loaded by dynamic import of the file URL,
// so the zero-dependency core never imports them statically.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readJson, exists, ensureDir, writeJson } from './util/fs.mjs';
import { sha256, stableStringify } from './util/hash.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SCRIPTS_DIR = path.resolve(HERE, '..');

/** Packages of the browser layer; `project: true` may also come from the target project's node_modules. */
export const BROWSER_PACKAGES = {
  playwright: { project: true },
  '@axe-core/playwright': {},
  'axe-core': {},
  pixelmatch: {},
  pngjs: {},
  'web-vitals': {},
  'colorjs.io': {},
};

export const MISSING_MESSAGE = 'browser layer missing — run `uie doctor --install` (asks the owner first)';

export class BrowserDepsError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.userMessage = message;
    this.details = details;
  }
}

export function pinnedDependencies() {
  return readJson(path.join(SCRIPTS_DIR, 'package.json'), { dependencies: {} }).dependencies || {};
}

/** Short hash of the pinned dependency set; the runtime cache is keyed by it. */
export function depsHash() {
  return sha256(stableStringify(pinnedDependencies())).slice(0, 12);
}

export function uieHome() {
  return process.env.UIE_HOME ? path.resolve(process.env.UIE_HOME) : path.join(os.homedir(), '.cache', 'ui-evaluator');
}

export function runtimeDir() {
  return path.join(uieHome(), 'runtime', depsHash());
}

/** Candidate node_modules folders in resolution order. */
export function candidateDirs(projectRoot) {
  const out = [
    { source: 'scripts', dir: path.join(SCRIPTS_DIR, 'node_modules') },
    { source: 'runtime-cache', dir: path.join(runtimeDir(), 'node_modules') },
  ];
  if (projectRoot) out.push({ source: 'project', dir: path.join(path.resolve(projectRoot), 'node_modules'), only: ['playwright'] });
  return out;
}

function entryFromPackageJson(pkgDir) {
  const pkg = readJson(path.join(pkgDir, 'package.json'), null);
  if (!pkg) return null;
  const pick = (v) => {
    if (!v) return null;
    if (typeof v === 'string') return v;
    return pick(v.import) || pick(v.default) || pick(v.node) || pick(v.require);
  };
  let rel = null;
  if (pkg.exports) {
    const root = typeof pkg.exports === 'string' ? pkg.exports : pkg.exports['.'] ?? (Object.keys(pkg.exports).every((k) => !k.startsWith('.')) ? pkg.exports : null);
    rel = pick(root);
  }
  rel = rel || pkg.module || pkg.main || 'index.js';
  return { file: path.join(pkgDir, rel), version: pkg.version || 'unknown' };
}

/**
 * Locate one package. Returns { name, dir, file, version, source } or null.
 * createRequire resolves CommonJS entries; packages whose exports only allow `import` fall back to package.json.
 */
export function resolvePackage(name, { projectRoot } = {}) {
  for (const cand of candidateDirs(projectRoot)) {
    if (cand.only && !cand.only.includes(name)) continue;
    const pkgDir = path.join(cand.dir, ...name.split('/'));
    if (!exists(path.join(pkgDir, 'package.json'))) continue;
    let file = null;
    try {
      file = createRequire(path.join(cand.dir, '__uie__.js')).resolve(name);
    } catch {
      file = null;
    }
    const meta = entryFromPackageJson(pkgDir);
    if (!meta) continue;
    // Prefer the ESM entry when the package is an ES module; createRequire may return the CJS build.
    const esm = meta.file;
    return { name, dir: pkgDir, file: exists(esm) ? esm : file, cjs: file, version: meta.version, source: cand.source };
  }
  return null;
}

/** Report which packages resolve and from where (doctor). */
export function dependencyReport(projectRoot) {
  const out = {};
  for (const name of Object.keys(BROWSER_PACKAGES)) {
    const r = resolvePackage(name, { projectRoot });
    out[name] = r ? { version: r.version, source: r.source, dir: r.dir } : null;
  }
  return out;
}

async function importFile(file) {
  return import(pathToFileURL(file).href);
}

let cached = null;

/**
 * Load the browser layer. Throws BrowserDepsError (with MISSING_MESSAGE) when a required package is absent.
 * @returns {Promise<{playwright:any, AxeBuilder:any, pixelmatch:Function, PNG:any, webVitalsIife:string|null, versions:Record<string,string>, sources:Record<string,string>}>}
 */
export async function loadBrowserDeps({ projectRoot, require = ['playwright', 'pngjs', 'pixelmatch'] } = {}) {
  if (cached) return cached;
  const resolved = {};
  const missing = [];
  for (const name of Object.keys(BROWSER_PACKAGES)) {
    const r = resolvePackage(name, { projectRoot });
    if (r) resolved[name] = r;
    else if (require.includes(name)) missing.push(name);
  }
  if (missing.length) throw new BrowserDepsError(`${MISSING_MESSAGE}; not found: ${missing.join(', ')}`, { missing });
  const versions = Object.fromEntries(Object.entries(resolved).map(([k, v]) => [k, v.version]));
  const sources = Object.fromEntries(Object.entries(resolved).map(([k, v]) => [k, v.source]));
  const out = { versions, sources, resolved };
  try {
    const pw = await importFile(resolved.playwright.file);
    out.playwright = pw.default && pw.default.chromium ? pw.default : pw;
  } catch (err) {
    throw new BrowserDepsError(`${MISSING_MESSAGE}; playwright failed to load: ${err.message}`, { missing: ['playwright'] });
  }
  const pngMod = await importFile(resolved.pngjs.cjs || resolved.pngjs.file);
  out.PNG = pngMod.PNG || pngMod.default?.PNG;
  const pm = await importFile(resolved.pixelmatch.file);
  out.pixelmatch = pm.default || pm;
  if (resolved['@axe-core/playwright']) {
    try {
      const axe = await importFile(resolved['@axe-core/playwright'].file);
      out.AxeBuilder = axe.AxeBuilder || axe.default?.AxeBuilder || axe.default;
    } catch {
      out.AxeBuilder = null;
    }
  }
  if (resolved['axe-core']) out.axeVersion = resolved['axe-core'].version;
  // colorjs.io computes only the advisory APCA reading (COL-14); all other colour maths is util/color.mjs (ADR-026).
  if (resolved['colorjs.io']) {
    try {
      const c = await importFile(resolved['colorjs.io'].file);
      out.Color = c.default || c.Color || c;
    } catch {
      out.Color = null;
    }
  }
  if (resolved['web-vitals']) {
    const iife = path.join(resolved['web-vitals'].dir, 'dist', 'web-vitals.attribution.iife.js');
    out.webVitalsIife = exists(iife) ? fs.readFileSync(iife, 'utf8') : null;
  }
  cached = out;
  return out;
}

/**
 * Is a Chromium build this Playwright can launch installed? Headless runs use the headless shell, which
 * `uie doctor --install` installs alone (--only-shell); the full browser counts too.
 */
export function chromiumInstalled(playwright) {
  try {
    const full = playwright.chromium.executablePath();
    if (full && exists(full)) return { ok: true, path: full, kind: 'chromium' };
    const m = /chromium-(\d+)/.exec(full || '');
    if (m) {
      const shellDir = path.join(full.slice(0, full.indexOf(m[0])), `chromium_headless_shell-${m[1]}`);
      if (exists(path.join(shellDir, 'INSTALLATION_COMPLETE'))) return { ok: true, path: shellDir, kind: 'headless-shell' };
    }
    return { ok: false, path: full };
  } catch (err) {
    return { ok: false, path: null, error: err.message };
  }
}

/** Playwright's shared browser cache: PLAYWRIGHT_BROWSERS_PATH, or the per-OS default. */
export function playwrightBrowsersDir() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH && process.env.PLAYWRIGHT_BROWSERS_PATH !== '0') return process.env.PLAYWRIGHT_BROWSERS_PATH;
  const home = os.homedir();
  if (process.platform === 'darwin') return path.join(home, 'Library', 'Caches', 'ms-playwright');
  if (process.platform === 'win32') return path.join(process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'ms-playwright');
  return path.join(process.env.XDG_CACHE_HOME || path.join(home, '.cache'), 'ms-playwright');
}

/**
 * Is this Playwright registered in the shared browser cache? Each `playwright install` writes a link to its
 * playwright-core folder, and when any project installs browsers, Playwright deletes builds that no registered
 * folder needs. An unregistered install can therefore lose its Chromium to another project's install.
 */
export function browserCacheRegistration(resolvedPlaywright) {
  try {
    const req = createRequire(path.join(resolvedPlaywright.dir, 'package.json'));
    const coreDir = fs.realpathSync(path.dirname(req.resolve('playwright-core/package.json')));
    const linksDir = path.join(playwrightBrowsersDir(), '.links');
    const links = exists(linksDir) ? fs.readdirSync(linksDir).map((n) => {
      try {
        return fs.realpathSync(fs.readFileSync(path.join(linksDir, n), 'utf8').trim());
      } catch {
        return null;
      }
    }) : [];
    return { registered: links.includes(coreDir), coreDir, linksDir };
  } catch (err) {
    return { registered: null, error: err.message };
  }
}

/**
 * Install the pinned runtime into the cache (`uie doctor --install`). The caller must have the owner's consent.
 * Runs `npm install --prefix <cache>` and then Playwright's Chromium download with that prefix.
 */
export function installRuntime({ log = () => {} } = {}) {
  const dir = runtimeDir();
  ensureDir(dir);
  writeJson(path.join(dir, 'package.json'), {
    name: 'ui-evaluator-runtime-cache',
    private: true,
    description: 'Pinned browser-layer dependencies installed by `uie doctor --install`.',
    dependencies: pinnedDependencies(),
  });
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  log(`installing pinned packages into ${dir} …`);
  const a = spawnSync(npm, ['install', '--prefix', dir, '--no-audit', '--no-fund', '--no-package-lock'], { stdio: 'inherit' });
  if (a.status !== 0) throw new BrowserDepsError(`npm install into ${dir} failed (exit ${a.status})`);
  // Only the headless shell: every browser command runs headless. Installing also registers this Playwright in the
  // shared cache, so another project's install does not delete the build (browserCacheRegistration).
  log('installing headless Chromium through Playwright …');
  const b = spawnSync(npx, ['--prefix', dir, 'playwright', 'install', '--only-shell', 'chromium'], { stdio: 'inherit', cwd: dir });
  if (b.status !== 0) throw new BrowserDepsError(`playwright install --only-shell chromium failed (exit ${b.status})`);
  cached = null;
  return { dir };
}

export function resetDepsCache() {
  cached = null;
}
