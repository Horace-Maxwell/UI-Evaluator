// Lint access to the rule data in assets/data: tell parameters, gate rules, word lists, saturated faces.
// Thresholds live in the data files (tells.json detect.params, QUALITY-BAR via rules.json) so detectors and
// documentation cannot drift apart.
import { loadData, loadRules } from '../gates/rules.mjs';

export function tells() {
  return loadData('tells', { tells: {} }).tells || {};
}

export function tell(id) {
  return tells()[id] || null;
}

/** detect.params of a tell, merged over defaults that equal the catalogue (used only if the data file is missing). */
export function tellParams(id, defaults = {}) {
  return { ...defaults, ...(tell(id)?.detect?.params || {}) };
}

export function rules() {
  return loadRules();
}

const listCache = new Map();

/**
 * A compiled word list: [{ text, re, heuristic, ... }].
 * @param {'en'|'zh'} lang
 * @param {string} name list key in words-<lang>.json
 * @param {{ all?: boolean, includeAmbiguous?: boolean }} [opts] gate use leaves out heuristic, cpy09_only and ambiguous entries
 */
export function wordList(lang, name, { all = false, includeAmbiguous = false } = {}) {
  const key = `${lang}|${name}|${all}|${includeAmbiguous}`;
  if (listCache.has(key)) return listCache.get(key);
  const file = loadData(`words-${lang}`, { lists: {} });
  const list = file.lists?.[name] || { entries: [] };
  const out = [];
  for (const e of list.entries || []) {
    if (!e.pattern) continue;
    if (!all && (e.heuristic || e.cpy09_only)) continue;
    if (!includeAmbiguous && e.ambiguous) continue;
    let flags = e.flags || list.flags || 'iu';
    if (!flags.includes('u')) flags += 'u';
    try {
      out.push({ ...e, text: e.text || e.word || e.name, re: new RegExp(e.pattern, flags) });
    } catch {
      // A bad pattern in the data file is caught by the schema tests; skip it here.
    }
  }
  listCache.set(key, out);
  return out;
}

export function listMeta(lang, name) {
  const file = loadData(`words-${lang}`, { lists: {} });
  const { entries, ...meta } = file.lists?.[name] || {};
  return meta;
}

/** Every match of a compiled list in a text: [{ entry, index, match }]. */
export function matchAll(list, text) {
  const out = [];
  for (const e of list) {
    const re = new RegExp(e.re.source, e.re.flags.includes('g') ? e.re.flags : `${e.re.flags}g`);
    let m;
    while ((m = re.exec(text))) {
      out.push({ entry: e, index: m.index, match: m[0] });
      if (m[0] === '') re.lastIndex += 1;
    }
  }
  return out.sort((a, b) => a.index - b.index);
}

export function firstMatch(list, text) {
  for (const e of list) {
    e.re.lastIndex = 0;
    const m = e.re.exec(text);
    if (m) return { entry: e, index: m.index, match: m[0] };
  }
  return null;
}

/** Saturated faces with lower-case match forms. */
export function saturatedFaces() {
  const d = loadData('saturated-faces', { faces: [] });
  return (d.faces || []).map((f) => ({ ...f, match: (f.match || [f.name]).map((x) => x.toLowerCase()) }));
}

/** Normalise a family name: no quotes, next/font hash removed, weight words removed, lower case. */
export function normaliseFamily(f) {
  return String(f || '')
    .replace(/["']/g, '')
    .replace(/^__([A-Za-z][A-Za-z0-9]*?)_[a-f0-9]{5,}$/i, '$1')
    .replace(/_/g, ' ')
    .replace(/\b(?:fallback|variable|var|thin|light|regular|medium|semibold|bold|black)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function faceOnList(family) {
  const n = normaliseFamily(family);
  if (!n) return null;
  for (const f of saturatedFaces()) if (f.match.includes(n)) return f;
  return null;
}
