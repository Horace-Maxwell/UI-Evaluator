// W3C Design Tokens (DTCG) format, first stable version 2025.10 [TOOL-28]: read `.tokens` / `.tokens.json` files
// into a flat list of resolved tokens. The census and the lint layer use the result as the project's allowed values
// when tokens live in a DTCG file rather than (or as well as) in DESIGN.md. Zero dependencies.
//
// Supported: `$value`, `$type` (inherited from groups), `$deprecated`, curly-brace aliases "{group.token}",
// JSON Pointer `{ "$ref": "#/a/b" }` values, 2025.10 structured colours {colorSpace, components, alpha, hex} and
// legacy colour strings, dimension and duration objects {value, unit} and legacy strings, fontFamily, fontWeight,
// number, cubicBezier, and the composite types (kept as raw values).
import fs from 'node:fs';
import path from 'node:path';
import { parseColor, toHex } from '../util/color.mjs';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', '.output', 'coverage', '.turbo', '.cache', '.ui-evaluator', 'vendor']);

/** Token files under `root`: *.tokens, *.tokens.json, and tokens.json / design-tokens.json that parse as DTCG. */
export function findTokenFiles(root, { max = 50, maxDepth = 6 } = {}) {
  const out = [];
  const walk = (dir, depth) => {
    if (out.length >= max || depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (out.length >= max) return;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (!SKIP_DIRS.has(ent.name) && !ent.name.startsWith('.')) walk(p, depth + 1);
      } else if (/\.tokens(\.json)?$/i.test(ent.name) || /^(design-)?tokens\.json$/i.test(ent.name)) {
        out.push(p);
      }
    }
  };
  walk(root, 0);
  return out.sort();
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const ALIAS = /^\{([^{}]+)\}$/;

/** True when a JSON document looks like DTCG: some nested object carries `$value`. */
export function looksLikeDtcg(doc, depth = 0) {
  if (!isObj(doc) || depth > 12) return false;
  if ('$value' in doc) return true;
  return Object.entries(doc).some(([k, v]) => !k.startsWith('$') && looksLikeDtcg(v, depth + 1));
}

function pointerGet(doc, pointer) {
  if (!pointer.startsWith('#')) return undefined;
  const parts = pointer.slice(1).split('/').filter((x, i) => !(i === 0 && x === '')).map((x) => x.replace(/~1/g, '/').replace(/~0/g, '~'));
  let cur = doc;
  for (const p of parts) {
    if (!isObj(cur) && !Array.isArray(cur)) return undefined;
    cur = cur[p];
    if (cur === undefined) return undefined;
  }
  return cur;
}

/**
 * Parse one DTCG document. Returns { tokens: [{ path, type, value, deprecated }], errors: [] } where `value` has every
 * alias and `$ref` resolved (composite values are resolved member by member).
 */
export function parseDtcg(doc, { file = '' } = {}) {
  const raw = new Map();
  const errors = [];
  const visit = (node, trail, inheritedType) => {
    if (!isObj(node)) return;
    const type = typeof node.$type === 'string' ? node.$type : inheritedType;
    if ('$value' in node) {
      raw.set(trail.join('.'), { path: trail.join('.'), type: type || null, value: node.$value, deprecated: !!node.$deprecated });
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      if (k.includes('.') || k.includes('{') || k.includes('}')) errors.push(`${file}: invalid token or group name "${k}" (no ".", "{" or "}")`);
      visit(v, [...trail, k], type);
    }
  };
  visit(doc, [], null);

  const resolving = new Set();
  const resolve = (value, where) => {
    if (typeof value === 'string') {
      const m = ALIAS.exec(value.trim());
      if (!m) return value;
      const target = raw.get(m[1]);
      if (!target) {
        errors.push(`${file}: ${where} refers to missing token {${m[1]}}`);
        return null;
      }
      if (resolving.has(m[1])) {
        errors.push(`${file}: ${where} is part of an alias cycle through {${m[1]}}`);
        return null;
      }
      resolving.add(m[1]);
      const v = resolve(target.value, m[1]);
      resolving.delete(m[1]);
      return v;
    }
    if (isObj(value) && typeof value.$ref === 'string' && Object.keys(value).length === 1) {
      const got = pointerGet(doc, value.$ref);
      if (got === undefined) {
        errors.push(`${file}: ${where} has a $ref that does not resolve: ${value.$ref}`);
        return null;
      }
      const key = `$ref:${value.$ref}`;
      if (resolving.has(key)) {
        errors.push(`${file}: ${where} is part of a $ref cycle`);
        return null;
      }
      resolving.add(key);
      const v = resolve(isObj(got) && '$value' in got ? got.$value : got, where);
      resolving.delete(key);
      return v;
    }
    if (Array.isArray(value)) return value.map((x, i) => resolve(x, `${where}[${i}]`));
    if (isObj(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, `${where}.${k}`)]));
    return value;
  };

  const tokens = [];
  for (const t of raw.values()) {
    let type = t.type;
    // An alias without its own type takes the type of the token it points to.
    if (!type && typeof t.value === 'string' && ALIAS.test(t.value.trim())) type = raw.get(ALIAS.exec(t.value.trim())[1])?.type || null;
    tokens.push({ ...t, type, value: resolve(t.value, t.path) });
  }
  return { tokens, errors };
}

const SPACE_FN = {
  srgb: (c) => `color(srgb ${c.join(' ')})`,
  'srgb-linear': (c) => `color(srgb-linear ${c.join(' ')})`,
  'display-p3': (c) => `color(display-p3 ${c.join(' ')})`,
  'xyz-d65': (c) => `color(xyz-d65 ${c.join(' ')})`,
  'xyz-d50': (c) => `color(xyz-d50 ${c.join(' ')})`,
  hsl: ([h, s, l]) => `hsl(${h} ${s}% ${l}%)`,
  lab: (c) => `lab(${c.join(' ')})`,
  lch: (c) => `lch(${c.join(' ')})`,
  oklab: (c) => `oklab(${c.join(' ')})`,
  oklch: (c) => `oklch(${c.join(' ')})`,
};

/** A CSS colour string for a DTCG colour value (2025.10 object or legacy string), or null when not representable. */
export function dtcgColorToCss(v) {
  if (typeof v === 'string') return parseColor(v) ? v.trim() : null;
  if (!isObj(v)) return null;
  const comps = Array.isArray(v.components) ? v.components.map((x) => (x === 'none' ? 'none' : Number(x))) : null;
  const fn = SPACE_FN[String(v.colorSpace || '').toLowerCase()];
  const alpha = v.alpha !== undefined && v.alpha !== 1 ? Number(v.alpha) : null;
  if (fn && comps && comps.length === 3 && comps.every((x) => x === 'none' || Number.isFinite(x))) {
    const css = fn(comps);
    const withAlpha = alpha !== null && Number.isFinite(alpha) ? css.replace(/\)$/, ` / ${alpha})`) : css;
    if (parseColor(withAlpha)) return withAlpha;
  }
  // The hex member is the sRGB fallback for spaces UI-Evaluator does not convert (hwb, a98-rgb, prophoto-rgb, rec2020).
  if (typeof v.hex === 'string' && parseColor(v.hex)) return v.hex;
  return null;
}

/** Pixels for a DTCG dimension: {value, unit: px|rem} or a legacy "16px" / "1rem" string. */
export function dtcgDimensionPx(v, { rootPx = 16 } = {}) {
  let value;
  let unit;
  if (isObj(v)) {
    value = Number(v.value);
    unit = String(v.unit || 'px');
  } else if (typeof v === 'string') {
    const m = /^(-?[\d.]+)(px|rem)?$/.exec(v.trim());
    if (!m) return null;
    value = Number(m[1]);
    unit = m[2] || 'px';
  } else if (typeof v === 'number') {
    value = v;
    unit = 'px';
  } else return null;
  if (!Number.isFinite(value)) return null;
  if (unit === 'px') return value;
  if (unit === 'rem') return value * rootPx;
  return null;
}

/** Milliseconds for a DTCG duration: {value, unit: ms|s} or a legacy "200ms" / "0.2s" string. */
export function dtcgDurationMs(v) {
  if (isObj(v)) {
    const n = Number(v.value);
    if (!Number.isFinite(n)) return null;
    return v.unit === 's' ? n * 1000 : v.unit === 'ms' ? n : null;
  }
  if (typeof v === 'string') {
    const m = /^([\d.]+)(ms|s)$/.exec(v.trim());
    return m ? Number(m[1]) * (m[2] === 's' ? 1000 : 1) : null;
  }
  return null;
}

/**
 * Load every DTCG file under `root`. Returns the allowed values the census and the lint layer compare against:
 * { files, tokens, colors: [{path, css, hex}], dimensions: [{path, px}], fontFamilies: [{path, families}],
 *   durations: [{path, ms}], errors }.
 */
export function loadDtcgTokens(root, { files: given } = {}) {
  const files = given || findTokenFiles(root);
  const out = { files: [], tokens: [], colors: [], dimensions: [], fontFamilies: [], durations: [], errors: [] };
  for (const f of files) {
    const rel = path.relative(root, f).split(path.sep).join('/');
    let doc;
    try {
      doc = JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch (e) {
      out.errors.push(`${rel}: not valid JSON (${e.message})`);
      continue;
    }
    if (!looksLikeDtcg(doc)) continue;
    out.files.push(rel);
    const { tokens, errors } = parseDtcg(doc, { file: rel });
    out.errors.push(...errors);
    for (const t of tokens) {
      out.tokens.push({ ...t, file: rel });
      if (t.type === 'color') {
        const css = dtcgColorToCss(t.value);
        if (css) out.colors.push({ path: t.path, css, hex: toHex(parseColor(css)), file: rel });
        else if (t.value !== null) out.errors.push(`${rel}: ${t.path} is not a colour UI-Evaluator can read`);
      } else if (t.type === 'dimension') {
        const px = dtcgDimensionPx(t.value);
        if (px !== null) out.dimensions.push({ path: t.path, px, file: rel });
      } else if (t.type === 'fontFamily') {
        const fam = Array.isArray(t.value) ? t.value : typeof t.value === 'string' ? t.value.split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')) : [];
        if (fam.length) out.fontFamilies.push({ path: t.path, families: fam, file: rel });
      } else if (t.type === 'duration') {
        const ms = dtcgDurationMs(t.value);
        if (ms !== null) out.durations.push({ path: t.path, ms, file: rel });
      }
    }
  }
  return out;
}
