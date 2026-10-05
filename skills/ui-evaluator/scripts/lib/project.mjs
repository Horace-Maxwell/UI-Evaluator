// Project discovery, workspace layout, configuration and runs.
import path from 'node:path';
import fs from 'node:fs';
import { exists, isDir, readJson, writeJson, ensureDir, readText, writeText, appendText, listDir } from './util/fs.mjs';
import { runStamp, slug, isoNow } from './util/time.mjs';
import { validate, loadSchema } from './schema.mjs';
import { UsageError } from './util/args.mjs';

export const WS_DIR = '.ui-evaluator';

/** Walk up from `start` to find a directory containing .ui-evaluator/, else package.json, else `start`. */
export function findRoot(start = process.cwd()) {
  let dir = path.resolve(start);
  let pkgDir = null;
  for (;;) {
    if (isDir(path.join(dir, WS_DIR))) return dir;
    if (!pkgDir && exists(path.join(dir, 'package.json'))) pkgDir = dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return pkgDir || path.resolve(start);
}

export function paths(root) {
  const ws = path.join(root, WS_DIR);
  return {
    root,
    ws,
    config: path.join(ws, 'config.json'),
    preflight: path.join(ws, 'preflight.json'),
    journeys: path.join(ws, 'journeys'),
    directions: path.join(ws, 'directions'),
    runs: path.join(ws, 'runs'),
    latest: path.join(ws, 'runs', 'LATEST'),
    register: path.join(ws, 'findings.json'),
    feedback: path.join(ws, 'feedback'),
    feedbackRaw: path.join(ws, 'feedback', 'raw'),
    feedbackJsonl: path.join(ws, 'feedback', 'feedback.jsonl'),
    themes: path.join(ws, 'feedback', 'themes.json'),
    studies: path.join(ws, 'studies'),
    ledger: path.join(ws, 'ledger.json'),
    dismissals: path.join(ws, 'dismissals.json'),
    waivers: path.join(ws, 'waivers.json'),
    debt: path.join(ws, 'debt.md'),
    index: path.join(ws, 'index.md'),
    doctor: path.join(ws, 'doctor.json'),
    humanChecks: path.join(ws, 'human-checks.json'),
    product: path.join(root, 'PRODUCT.md'),
    design: path.join(root, 'DESIGN.md'),
  };
}

export const DEFAULT_CONFIG = Object.freeze({
  schema_version: 1,
  project: { name: '', work: 'existing', ai_features: false },
  app: { start: null, cwd: '.', base_url: 'http://localhost:3000', ready_url: null, timeout_ms: 60000, env: {} },
  routes: [{ path: '/', surface: 'home', mode: 'operate', states: [{ name: 'default', actions: [] }] }],
  matrix: {
    widths: [320, 375, 768, 1024, 1280, 1440],
    height: 900,
    device_scale_factor: 1,
    themes: ['light'],
    preferences: ['default', 'reduced-motion'],
    g2_preferences: ['forced-colors', 'more-contrast'],
  },
  locales: { list: ['en'], default: 'en', switch: null },
  platform_profile: 'web',
  depth: 'standard',
  target_level: 'L3',
  evaluator_models: { default: 'inherit', external_cli: { enabled: false, command: null } },
  fix_policy: {
    mode: 'direct',
    record: 'commit',
    branch: 'ui-evaluator/fixes',
    max_attempts_per_finding: 3,
    max_fixes_per_run: 30,
    max_judgment_rounds: 2,
    risk_pause_threshold: 0.2,
  },
  threshold_overrides: [],
  privacy: { scrub_pii: true, roster: null },
});

/** Remove human-note keys (starting with "_") recursively. */
export function stripNotes(v) {
  if (Array.isArray(v)) return v.map(stripNotes);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(v)) if (!k.startsWith('_')) out[k] = stripNotes(val);
    return out;
  }
  return v;
}

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

export function deepMerge(base, over) {
  if (!isPlainObject(base) || !isPlainObject(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = isPlainObject(v) && isPlainObject(base[k]) ? deepMerge(base[k], v) : v;
  }
  return out;
}

/** Load and validate the project config, merged over defaults. Missing config → defaults (flagged). */
export function loadConfig(root, { required = false } = {}) {
  const p = paths(root);
  if (!exists(p.config)) {
    if (required) throw new UsageError(`no ${WS_DIR}/config.json in ${root}. Run \`uie init\` first (setup workflow).`);
    const cfg = deepMerge(DEFAULT_CONFIG, { project: { name: path.basename(root) } });
    return { ...cfg, _missing: true };
  }
  const raw = readJson(p.config);
  const res = validate(loadSchema('config'), raw);
  const user = stripNotes(raw);
  if (!res.valid) {
    const lines = res.errors.slice(0, 10).map((e) => `  ${e.path}: ${e.message}`).join('\n');
    throw new UsageError(`${WS_DIR}/config.json is invalid:\n${lines}`);
  }
  const cfg = deepMerge(DEFAULT_CONFIG, user);
  if (Array.isArray(user.routes)) cfg.routes = user.routes;
  if (!cfg.project.name) cfg.project.name = path.basename(root);
  return cfg;
}

/** Create a new run directory and manifest skeleton. Returns { id, dir }. */
export function newRun(root, { label = 'run', depth, target } = {}) {
  const p = paths(root);
  ensureDir(p.runs);
  const base = `${runStamp()}-${slug(label, 30)}`;
  let id = base;
  let n = 2;
  while (exists(path.join(p.runs, id))) {
    id = `${base}-${n}`;
    n += 1;
  }
  const dir = ensureDir(path.join(p.runs, id));
  for (const sub of ['evidence', 'evaluators', 'cw', 'panel', 'ratings', 'packets', 'probes']) ensureDir(path.join(dir, sub));
  writeText(p.latest, `${id}\n`);
  return { id, dir };
}

export function resolveRun(root, id) {
  const p = paths(root);
  let runId = id;
  if (!runId || runId === 'latest' || runId === true) {
    runId = readText(p.latest, '').trim();
    if (!runId) throw new UsageError('no runs yet. Start one with `uie run new --label <name>`.');
  }
  const dir = path.join(p.runs, runId);
  if (!isDir(dir)) throw new UsageError(`run "${runId}" not found in ${p.runs}`);
  return { id: runId, dir };
}

export function listRuns(root) {
  const p = paths(root);
  return listDir(p.runs)
    .filter((n) => n !== 'LATEST' && isDir(path.join(p.runs, n)))
    .sort();
}

export function manifestPath(runDir) {
  return path.join(runDir, 'manifest.json');
}

export function readManifest(runDir) {
  return readJson(manifestPath(runDir), null);
}

export function writeManifest(runDir, manifest) {
  return writeJson(manifestPath(runDir), manifest);
}

/** Merge fields into the run manifest (shallow per top-level key, arrays concatenated when `append`). */
export function updateManifest(runDir, patch, { append = [] } = {}) {
  const m = readManifest(runDir) || {};
  for (const [k, v] of Object.entries(patch)) {
    if (append.includes(k) && Array.isArray(m[k]) && Array.isArray(v)) m[k] = [...m[k], ...v];
    else if (isPlainObject(m[k]) && isPlainObject(v)) m[k] = { ...m[k], ...v };
    else m[k] = v;
  }
  m.updated_at = isoNow();
  writeManifest(runDir, m);
  return m;
}

export function appendIndex(root, line) {
  const p = paths(root);
  if (!exists(p.index)) writeText(p.index, '# UI-Evaluator run index\n\nAppend-only log of runs, gates and decisions.\n\n');
  appendText(p.index, `- ${isoNow()} — ${line}\n`);
}

export function readRegister(root) {
  return readJson(paths(root).register, { version: 1, next_id: 1, findings: [] });
}

export function writeRegister(root, reg) {
  return writeJson(paths(root).register, reg);
}

export function readDismissals(root) {
  return readJson(paths(root).dismissals, { version: 1, entries: [] });
}

export function readWaivers(root) {
  return readJson(paths(root).waivers, { version: 1, waivers: [] });
}

/** Load all journeys in .ui-evaluator/journeys. */
export function loadJourneys(root) {
  const dir = paths(root).journeys;
  return listDir(dir)
    .filter((n) => n.endsWith('.json'))
    .map((n) => {
      const j = readJson(path.join(dir, n));
      if (!j.id) j.id = path.basename(n, '.json');
      j._file = path.join(dir, n);
      return j;
    });
}

/** True when the given file is inside the project's own workspace or skill tree (used to avoid linting ourselves). */
export function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

export function fileMtime(p) {
  try {
    return fs.statSync(p).mtimeMs;
  } catch {
    return 0;
  }
}
