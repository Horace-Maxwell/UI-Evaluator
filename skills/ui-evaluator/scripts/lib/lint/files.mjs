// File discovery and project context for `uie lint` and `uie hook`.
// Context read: DESIGN.md (accepted tells, brand palette, spacing scale, declared exceptions, spring policy),
// PRODUCT.md (Facts section for SLP-12), .ui-evaluator/config.json (locales). Every reader tolerates missing or
// malformed files, because a lint run must never fail on project documents.
import fs from 'node:fs';
import path from 'node:path';
import { walkFiles, relPath, readText, readJson, exists, isDir } from '../util/fs.mjs';
import { paths } from '../project.mjs';
import { parseColor } from '../util/color.mjs';
import { inIndigoVioletBand } from './colors.mjs';
import { tellParams } from './data.mjs';

export const UI_EXTS = new Set(['.css', '.scss', '.less', '.html', '.jsx', '.tsx', '.js', '.ts', '.vue', '.svelte', '.astro', '.mdx']);
export const FONT_EXTS = new Set(['.woff', '.woff2', '.ttf', '.otf', '.ttc', '.eot']);

// Build output, dependencies and vendored code: never the project's own UI source.
const BASE_IGNORES = [
  'node_modules', '.git', '.hg', '.svn', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', '.output', '.vercel',
  '.turbo', '.cache', 'coverage', '.ui-evaluator', 'vendor', 'vendors', 'third_party', 'third-party', 'bower_components',
  'jspm_packages', 'web_modules', '__generated__', '.docusaurus', 'pagefind', '_pagefind', '.parcel-cache', 'storybook-static', '.astro', '.expo',
  'Pods', '.venv', 'venv', '__pycache__', '.yarn', '.pnpm-store',
];
// Folders that hold tests, stories and mocks: not shipped UI. Skipped below every scanned folder (the whole project
// or a folder given on the command line); a file named explicitly is still linted.
export const NON_SHIPPED_DIRS = ['__tests__', '__mocks__', '__fixtures__', '__snapshots__', 'test', 'tests', 'e2e', 'cypress', 'playwright', 'stories', 'mocks', 'fixtures', 'spec', 'specs', '.storybook'];
const NON_SHIPPED_DIR_SET = new Set(NON_SHIPPED_DIRS);
const NON_SHIPPED_FILE = /\.(?:test|spec|stories|story|cy|e2e|fixture|mock)\.[a-z]+$/i;
const TOOL_CONFIG = /(?:^|\/)(?:vite|vitest|next|nuxt|svelte|astro|webpack|rollup|babel|jest|eslint|prettier|postcss|playwright|cypress|tsup|turbo|commitlint|lint-staged|stylelint|remix|react-router|metro|karma|gulpfile|gruntfile)(?:\.config)?\.[cm]?[jt]s$|(?:^|\/)\.[\w-]+rc\.[cm]?js$/i;
const MAX_BYTES = 1_000_000;

export function isUiFile(p) {
  const ext = path.extname(p).toLowerCase();
  if (!UI_EXTS.has(ext)) return false;
  const base = path.basename(p);
  if (/\.d\.ts$/i.test(base) || /[.-]min\.(?:css|js)$/i.test(base) || /\.(?:bundle|chunk)\.js$/i.test(base)) return false;
  return true;
}

/** Test, story and mock files (by name) never count as shipped UI. */
export function isNonShippedFile(rel) {
  return NON_SHIPPED_FILE.test(rel);
}

/** True when a project-relative path is a test, story or mock file, or sits in such a folder. */
export function isNonShippedPath(rel) {
  const parts = String(rel).split(/[\\/]/);
  return NON_SHIPPED_FILE.test(parts[parts.length - 1] || '') || parts.slice(0, -1).some((p) => NON_SHIPPED_DIR_SET.has(p));
}

/**
 * Minified, bundled or vendored content that slipped past the name checks: very long lines, or a library
 * licence banner (`/*!` or `@license` with a version or licence word) at the top of the file.
 * @returns {string|null} the reason to skip, or null
 */
export function generatedReason(text) {
  const head = String(text).slice(0, 4000);
  if (/^\s*\/\*[!*][\s\S]{0,600}?(?:@license|\bv\d+\.\d+|\blicen[cs]ed?\b|\bcopyright\b|\(c\))/i.test(head) && /^\s*\/\*!|@license/.test(head)) return 'vendored library (licence banner)';
  const lines = String(text).split('\n');
  const long = lines.filter((l) => l.length > 1000).length;
  if (long && (long >= 3 || String(text).length / lines.length > 400)) return 'minified or generated (very long lines)';
  return null;
}

export function isToolConfig(rel) {
  return TOOL_CONFIG.test(rel) && !/tailwind\.config/i.test(rel);
}

function relTo(root, cwd, abs) {
  const r = path.relative(root, abs);
  if (r && !r.startsWith('..') && !path.isAbsolute(r)) return r.split(path.sep).join('/');
  const c = path.relative(cwd, abs);
  return (c && !c.startsWith('..') ? c : abs).split(path.sep).join('/');
}

/**
 * Find the files to lint.
 * @returns {{ files: {abs:string, rel:string, size:number}[], fonts: {abs:string, rel:string}[], missing: string[], skipped: {path:string, reason:string}[], explicit: boolean }}
 */
export function discoverFiles(root, { paths: given = [], cwd = process.cwd(), max = 20000 } = {}) {
  const files = [];
  const fonts = [];
  const missing = [];
  const skipped = [];
  const seen = new Set();
  const skip = (rel, reason) => skipped.push({ path: rel, reason });
  // `named`: the file was given on the command line, so only its name decides whether it is shipped UI.
  const add = (abs, { named = false } = {}) => {
    if (seen.has(abs)) return;
    seen.add(abs);
    const rel = relTo(root, cwd, abs);
    if (!isUiFile(abs)) {
      if (named) skip(rel, UI_EXTS.has(path.extname(abs).toLowerCase()) ? 'minified, bundled or declaration file' : 'not a UI file extension');
      return;
    }
    if (isToolConfig(rel)) {
      skip(rel, 'build-tool configuration');
      return;
    }
    if (!named && isNonShippedFile(rel)) {
      skip(rel, 'test, story or mock file (not shipped UI)');
      return;
    }
    let size = 0;
    try {
      size = fs.statSync(abs).size;
    } catch {
      return;
    }
    if (size > MAX_BYTES) {
      skip(rel, `larger than ${MAX_BYTES} bytes (generated?)`);
      return;
    }
    const text = readText(abs, '');
    if (!named) {
      const why = generatedReason(text);
      if (why) {
        skip(rel, why);
        return;
      }
    }
    files.push({ abs, rel, size, text, nonShipped: isNonShippedFile(rel) });
  };
  const fontIgnore = new Set([...BASE_IGNORES, ...NON_SHIPPED_DIRS]);
  if (!given.length) {
    const ignore = new Set([...BASE_IGNORES, ...NON_SHIPPED_DIRS]);
    for (const f of walkFiles(root, { exts: UI_EXTS, ignore, max })) add(f);
    for (const f of walkFiles(root, { exts: FONT_EXTS, ignore: fontIgnore, max: 2000 })) fonts.push({ abs: f, rel: relTo(root, cwd, f) });
    return { files, fonts, missing, skipped, explicit: false };
  }
  for (const g of given) {
    let abs = path.resolve(cwd, String(g));
    if (!exists(abs)) abs = path.resolve(root, String(g));
    if (!exists(abs)) {
      missing.push(String(g));
      continue;
    }
    if (isDir(abs)) {
      // Test, story and mock folders below the given folder are skipped, as in a whole-project scan.
      const ignore = new Set([...BASE_IGNORES, ...NON_SHIPPED_DIRS]);
      for (const f of walkFiles(abs, { exts: UI_EXTS, ignore, max })) add(f);
      for (const f of walkFiles(abs, { exts: FONT_EXTS, ignore: fontIgnore, max: 2000 })) fonts.push({ abs: f, rel: relTo(root, cwd, f) });
    } else if (FONT_EXTS.has(path.extname(abs).toLowerCase())) fonts.push({ abs, rel: relTo(root, cwd, abs) });
    else add(abs, { named: true });
  }
  return { files, fonts, missing, skipped, explicit: true };
}

// ---- project documents ---------------------------------------------------------------------------------

function parsePx(v) {
  if (typeof v === 'number') return v;
  const m = String(v ?? '').trim().match(/^(-?\d*\.?\d+)(px|rem)?$/);
  if (!m) return null;
  return m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1]);
}

async function importOptional(spec) {
  try {
    return await import(spec);
  } catch {
    return null;
  }
}

/** The first family of a stack or list, unquoted. */
function primaryFamily(v) {
  const first = Array.isArray(v) ? v[0] : String(v ?? '').split(',')[0];
  return String(first ?? '').replace(/["']/g, '').trim();
}

/**
 * DESIGN.md facts the detectors need. Uses lib/tokens/design.mjs when present. Named tokens use the design.md
 * reference syntax: colours `{colors.primary}` and ramp steps `{ramps.accent.5}`, spacing `{spacing.md}`, families
 * `{typography.body}`.
 */
export async function readDesignContext(root) {
  const out = {
    exists: false, status: null, accepted: new Map(), acceptedIds: new Set(), palette: [], paletteHasBand: false,
    spacingScalePx: null, exceptions: new Map(), springs: null, radiusDocumented: false, problems: [],
    colorTokens: [], spacingTokens: [], familyTokens: [],
  };
  const p = paths(root).design;
  if (!exists(p)) return out;
  out.exists = true;
  const mod = await importOptional('../tokens/design.mjs');
  if (!mod || !mod.parseDesign) return out;
  let design;
  try {
    design = mod.parseDesign(readText(p, ''));
  } catch (e) {
    out.problems.push(String(e.message || e));
    return out;
  }
  out.status = design.status;
  try {
    out.accepted = mod.acceptedTells ? mod.acceptedTells(design) : new Map();
  } catch {
    out.accepted = new Map();
  }
  out.acceptedIds = new Set(out.accepted.keys());
  const template = design.status === 'template';
  if (!template) {
    try {
      out.palette = (mod.brandHues ? mod.brandHues(design) : []).filter(Boolean);
    } catch {
      out.palette = [];
    }
    const band = tellParams('SLP-02');
    out.paletteHasBand = band.oklch ? out.palette.some((c) => inIndigoVioletBand(c, band)) : false;
    const sp = design.fm?.spacing;
    if (sp && typeof sp === 'object') {
      const vals = Object.values(sp).map(parsePx).filter((x) => Number.isFinite(x));
      if (vals.length) out.spacingScalePx = new Set([0, ...vals.map((x) => Math.abs(x))]);
      for (const [k, v] of Object.entries(sp)) {
        const px = parsePx(v);
        if (Number.isFinite(px)) out.spacingTokens.push({ name: `{spacing.${k}}`, px: Math.abs(px), source: 'DESIGN.md' });
      }
    }
    for (const [k, v] of Object.entries(design.fm?.colors || {})) {
      const c = parseColor(v);
      if (c) out.colorTokens.push({ name: `{colors.${k}}`, color: c, css: String(v), source: 'DESIGN.md' });
    }
    for (const [k, steps] of Object.entries(design.uie?.ramps || {})) {
      if (!Array.isArray(steps)) continue;
      steps.forEach((v, i) => {
        const c = parseColor(v);
        if (c) out.colorTokens.push({ name: `{ramps.${k}.${i}}`, color: c, css: String(v), source: 'DESIGN.md' });
      });
    }
    for (const [k, role] of Object.entries(design.fm?.typography || {})) {
      const fam = role && typeof role === 'object' ? primaryFamily(role.fontFamily) : '';
      if (fam && !/^</.test(fam)) out.familyTokens.push({ name: `{typography.${k}}`, family: fam, stack: String(role.fontFamily), source: 'DESIGN.md' });
    }
    out.radiusDocumented = !!(design.fm?.rounded && typeof design.fm.rounded === 'object' && Object.keys(design.fm.rounded).length);
  }
  const uie = design.uie || {};
  out.springs = uie.motion?.springs ?? null;
  for (const e of Array.isArray(uie.declared_exceptions) ? uie.declared_exceptions : []) {
    if (!e || typeof e !== 'object') continue;
    const id = e.criterion || e.id || e.rule;
    if (!id || !e.reason) continue;
    const vals = [...(Array.isArray(e.values) ? e.values : []), ...(e.value !== undefined ? [e.value] : [])].map((v) => String(v).trim().toLowerCase());
    const prev = out.exceptions.get(id) || { values: new Set(), reason: e.reason, criterionWide: false };
    for (const v of vals) prev.values.add(v);
    if (!vals.length) prev.criterionWide = true;
    out.exceptions.set(id, prev);
  }
  return out;
}

/** PRODUCT.md Facts section (claims the UI may make). */
export async function readProductContext(root) {
  const out = { exists: false, facts: [], factsText: '', absences: [], text: '' };
  const p = paths(root).product;
  if (!exists(p)) return out;
  out.exists = true;
  const mod = await importOptional('../tokens/product.mjs');
  const text = readText(p, '');
  out.text = text;
  try {
    if (mod && mod.productFacts) {
      const f = mod.productFacts(text);
      out.facts = f.facts || [];
      out.absences = f.absences || [];
    }
  } catch {
    out.facts = [];
  }
  out.factsText = out.facts.map((f) => `${f.claim || ''} ${f.wording || ''}`).join('\n');
  return out;
}

const CJK_LOCALE = /^(?:zh|ja|ko|yue|cmn|wuu)(?:[-_]|$)/i;

export function readConfigContext(root) {
  const p = paths(root).config;
  const out = { optedIn: exists(p), locales: [] };
  if (!out.optedIn) return out;
  try {
    const cfg = readJson(p, {});
    out.locales = Array.isArray(cfg?.locales?.list) ? cfg.locales.list.map(String) : [];
  } catch {
    out.locales = [];
  }
  return out;
}

/** Locale files or folders named for a CJK locale in the usual i18n places (bounded, no deep walk). */
export function cjkLocaleFiles(root) {
  const dirs = ['locales', 'locale', 'messages', 'i18n', 'lang', 'langs', 'translations', 'public/locales', 'src/locales', 'src/i18n', 'src/messages', 'src/lang', 'app/i18n', 'static/locales'];
  for (const d of dirs) {
    const full = path.join(root, d);
    if (!isDir(full)) continue;
    let names = [];
    try {
      names = fs.readdirSync(full);
    } catch {
      continue;
    }
    if (names.some((n) => CJK_LOCALE.test(n.replace(/\.(json|ya?ml|po|ts|js)$/i, '')))) return true;
  }
  return false;
}

/**
 * W3C design-token (DTCG) files in the project [TOOL-28], read with lib/tokens/dtcg.mjs: their colours, spacing
 * dimensions and font families are declared tokens, exactly like DESIGN.md's. Names use the DTCG alias syntax
 * (`{color.accent}`). Dimension tokens in a spacing group form the spacing scale; when no group is named for spacing,
 * every dimension token counts (a lenient reading: a declared size is never reported as off-scale).
 */
const TOKEN_DIRS = ['.', 'tokens', 'design-tokens', 'design', 'theme', 'styles', 'src', 'src/tokens', 'src/design-tokens', 'src/theme', 'src/styles', 'assets/tokens', 'packages/tokens', 'packages/design-tokens', 'packages/theme'];
const TOKEN_FILE_NAME = /\.tokens(?:\.json)?$|^(?:design-)?tokens\.json$/i;

/**
 * Token files in the usual places only (the folders above and their direct subfolders, at most 80 folder reads):
 * the per-edit hook must stay under 300 ms, and a full walk of a large repository does not.
 */
export function quickTokenFiles(root) {
  const out = new Set();
  let reads = 0;
  const scan = (dir, depth) => {
    if (reads >= 80) return;
    reads += 1;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ent.isFile() && TOKEN_FILE_NAME.test(ent.name)) out.add(path.join(dir, ent.name));
      else if (depth < 1 && ent.isDirectory() && !ent.name.startsWith('.') && !BASE_IGNORES.includes(ent.name)) scan(path.join(dir, ent.name), depth + 1);
    }
  };
  for (const d of TOKEN_DIRS) scan(path.join(root, d), d === '.' ? 1 : 0);
  return [...out].sort();
}

export async function readDtcgContext(root, { fast = false } = {}) {
  const out = { files: [], colorTokens: [], spacingTokens: [], familyTokens: [], errors: [] };
  const mod = await importOptional('../tokens/dtcg.mjs');
  if (!mod || !mod.loadDtcgTokens) return out;
  let t;
  try {
    t = mod.loadDtcgTokens(root, fast ? { files: quickTokenFiles(root) } : {});
  } catch (e) {
    out.errors.push(String(e.message || e));
    return out;
  }
  out.files = t.files || [];
  out.errors = t.errors || [];
  for (const c of t.colors || []) {
    const color = parseColor(c.css);
    if (color) out.colorTokens.push({ name: `{${c.path}}`, color, css: c.css, source: c.file });
  }
  const dims = (t.dimensions || []).filter((d) => Number.isFinite(d.px));
  const spacing = dims.filter((d) => /(?:^|[.\-_])(?:space|spacing|spacer|gap|gutter|inset|padding|margin|stack|layout)(?:[.\-_]|$)/i.test(d.path));
  for (const d of spacing.length ? spacing : dims) out.spacingTokens.push({ name: `{${d.path}}`, px: Math.abs(d.px), source: d.file });
  for (const f of t.fontFamilies || []) {
    const fam = primaryFamily(f.families);
    if (fam) out.familyTokens.push({ name: `{${f.path}}`, family: fam, stack: f.families.join(', '), source: f.file });
  }
  return out;
}

/**
 * Everything the rules need to know about the project, loaded once per run. `tokens` merges the declared tokens of
 * DESIGN.md and DTCG files: { colors, spacing, families, spacingScalePx (null when nothing declares a scale) }.
 * `fast` (the hook) looks for token files only in the usual places.
 * @param {string} root
 */
export async function loadProjectContext(root, { fast = false } = {}) {
  const [design, product, dtcg] = await Promise.all([readDesignContext(root), readProductContext(root), readDtcgContext(root, { fast })]);
  const config = readConfigContext(root);
  const spacing = [...design.spacingTokens, ...dtcg.spacingTokens];
  const tokens = {
    colors: [...design.colorTokens, ...dtcg.colorTokens],
    spacing,
    families: [...design.familyTokens, ...dtcg.familyTokens],
    spacingScalePx: design.spacingScalePx || dtcg.spacingTokens.length ? new Set([0, ...(design.spacingScalePx || []), ...dtcg.spacingTokens.map((t) => t.px)]) : null,
  };
  return {
    root,
    design,
    product,
    config,
    dtcg,
    tokens,
    cjkLocale: config.locales.some((l) => CJK_LOCALE.test(l)),
    cjkLocaleFiles: cjkLocaleFiles(root),
  };
}

export { CJK_LOCALE, relPath };
