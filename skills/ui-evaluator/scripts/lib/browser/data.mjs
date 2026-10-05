// Shared data for the DOM checks: tell parameters (tells.json), word lists (words-en/zh.json) and the saturated-face
// list. Each accessor falls back to the QUALITY-BAR / knowledge-file values when a data file is absent.
import { loadData } from '../gates/rules.mjs';

const FALLBACK_LISTS = {
  en: {
    placeholder_text: ['\\blorem ipsum\\b', '\\bdolor sit amet\\b', ['\\bTODO\\b', 'u'], ['\\bTBD\\b', 'u']],
    link_text_vague: ['^click here$', '^here$', '^read more$', '^learn more$'],
    generic_ctas: ['^get started(?: (?:free|for free|now|today|in minutes))?$', '^learn more$', '^click here$', '^submit$', '^ok(?:ay)?$'],
    error_generic: ['^an? (?:unexpected |unknown )?error (?:has )?occurred[.!]?$', '^(?:oops[,!.]?\\s*)?something went wrong[.!]?$', '^invalid(?: (?:input|value|entry|data|field|request))?[.!]?$', '^oops\\b', '^(?:error\\s*)?(?:code\\s*)?[:#]?\\s*(?:[A-Z]{1,6}[-_])?\\d{3,5}$'],
    error_blame: ['\\byou forgot\\b', '\\bforbidden\\b', '\\billegal\\b'],
    placeholder_identities: [['\\bJane Doe\\b', 'u'], ['\\bJohn Doe\\b', 'u'], ['\\bJohn Smith\\b', 'u'], ['\\b(?:Acme|ACME)(?: (?:Inc|Corp|Corporation|Co|Ltd|LLC|Industries|Labs))?\\b', 'u'], '\\b[\\w.+-]+@example\\.(?:com|org|net)\\b', '\\b(?:www\\.)?example\\.(?:com|org|net)\\b'],
    ai_buzzwords: ['\\bsupercharg(?:e|es|ed|ing)\\b', '\\bunleash(?:es|ed|ing)?\\b', '\\bunlock(?:s|ed|ing)? the (?:full |true )?power of\\b', '\\bharness(?:es|ed|ing)? the (?:full |true )?power of\\b', '\\bleverag(?:e|es|ed|ing)\\b', '\\brevolutioni[sz](?:e|es|ed|ing)\\b', '\\belevat(?:e|es|ing)\\b', '\\bempower(?:s|ed|ing|ment)?\\b', '\\bstreamlin(?:e|es|ed|ing)\\b', '\\bseamless(?:ly)?\\b', '\\beffortless(?:ly)?\\b', '\\brobust\\b', '\\bbest[- ]in[- ]class\\b', '\\bworld[- ]class\\b', '\\benterprise[- ]grade\\b', '\\bnext[- ]generation\\b', '\\bnext[- ]gen\\b', '\\bcutting[- ]edge\\b', '\\bmission[- ]critical\\b', '\\bfuture[- ]proof(?:ed|ing)?\\b', '\\bgame[- ]chang(?:ing|er|ers)\\b'],
    theatre_phrases: ['\\bbuilt for the way you work\\b', '\\bdesigned for teams like yours\\b', '\\bmeet your new\\b', '\\bthe future of\\b', '\\bship faster\\b'],
    generic_hero_phrases: ['^\\s*welcome to\\b', '\\ball[- ]in[- ]one (?:solution|platform)\\b', '\\bbuild faster[.,]?\\s+ship smarter\\b'],
    aphorism_patterns: ['(?:^|[.!?]\\s+)[Nn]ot (?:a|an|just a|just an|just) [^.!?\\n]{1,40}[.!?]\\s+(?:An?|The|It\'s|It’s|It is)\\s', '(?:^|[.!?]\\s+)[A-Z][^.!?\\n]{1,40}\\.\\s+No [^.!?\\n]{1,40}[.!?]', '(?:^|[.!?]\\s+)[A-Z][^.!?\\n]{1,40}\\.\\s+Just [^.!?\\n]{1,40}[.!?]', '\\b[Nn]ot just [^,.;!?\\n]{1,40}[,;—–-]\\s*(?:it\'s|it’s|it is|but)\\b'],
  },
  zh: {
    placeholder_text: ['待补充', '占位(?:文本|文字|符)'],
    link_text_vague: ['^点击这里$', '^点此$', '^这里$', '^更多$', '^了解更多$'],
    error_generic: ['^发生(?:了)?错误[。！!]?$', '^出错了[。！!]?$', '^操作失败[。！!]?$', '^无效[。！!]?$', '^非法[。！!]?$', '^哎呀', '^糟糕', '^错误\\s*[：:]?\\s*\\d{3,5}$'],
    error_blame: ['您忘记了'],
    placeholder_identities: ['张三', '李四', '王五'],
  },
};

const FALLBACK_FACES = [
  ['Inter', 'first-order'], ['Roboto', 'first-order'], ['Open Sans', 'first-order'], ['Lato', 'first-order'], ['Montserrat', 'first-order'],
  ['Poppins', 'first-order'], ['Arial', 'first-order'], ['Helvetica', 'first-order'], ['system-ui', 'first-order'], ['Geist', 'first-order'],
  ['Space Grotesk', 'second-order'], ['Space Mono', 'second-order'], ['Instrument Serif', 'second-order'], ['Instrument Sans', 'second-order'],
  ['Fraunces', 'second-order'], ['Syne', 'second-order'], ['Sora', 'second-order'], ['Bricolage Grotesque', 'second-order'], ['Young Serif', 'second-order'],
  ['Recoleta', 'second-order'], ['Bodoni', 'second-order'], ['Playfair Display', 'second-order'], ['Newsreader', 'second-order'], ['Cormorant', 'second-order'],
  ['Lora', 'second-order'], ['Crimson', 'second-order'], ['DM Sans', 'second-order'], ['DM Serif', 'second-order'], ['Outfit', 'second-order'],
  ['Plus Jakarta Sans', 'second-order'], ['IBM Plex', 'second-order'], ['Mona Sans', 'second-order'], ['Geist Sans', 'second-order'], ['Geist Mono', 'second-order'],
  ['Georgia', 'house-style'], ['JetBrains Mono', 'house-style'], ['Satoshi', 'house-style'],
];

/** Detection parameters of a tell from tells.json (`detect.params`), merged over in-code defaults. */
export function tellParams(id, defaults = {}) {
  const tells = loadData('tells', { tells: {} }).tells || {};
  const p = tells[id]?.detect?.params || tells[id]?.params || {};
  return { ...defaults, ...p };
}

export function tellClass(id) {
  const tells = loadData('tells', { tells: {} }).tells || {};
  return tells[id]?.class || null;
}

function compile(entry) {
  if (typeof entry === 'string') return { text: entry, re: new RegExp(entry, 'iu') };
  if (Array.isArray(entry)) return { text: entry[0], re: new RegExp(entry[0], entry[1] || 'iu') };
  const flags = entry.flags || 'iu';
  return { ...entry, re: new RegExp(entry.pattern, flags.includes('u') ? flags : `${flags}u`) };
}

const listCache = new Map();
/**
 * A compiled word list. Gate use excludes `heuristic` and `cpy09_only` entries unless `all` is set.
 * @returns {{text:string, re:RegExp, heuristic?:boolean}[]}
 */
export function wordList(lang, name, { all = false } = {}) {
  const key = `${lang}:${name}:${all}`;
  if (listCache.has(key)) return listCache.get(key);
  const file = loadData(`words-${lang}`, null);
  const entries = file?.lists?.[name]?.entries;
  let out;
  if (Array.isArray(entries) && entries.length) {
    out = entries.filter((e) => e.pattern && (all || (!e.heuristic && !e.cpy09_only))).map(compile);
  } else out = (FALLBACK_LISTS[lang]?.[name] || []).map(compile);
  listCache.set(key, out);
  return out;
}

/** Matches with their entry, matched text and position: [{ entry, match, index }]. */
export function matchEntries(list, text) {
  const out = [];
  for (const e of list) {
    const re = new RegExp(e.re.source, e.re.flags.includes('g') ? e.re.flags : `${e.re.flags}g`);
    for (const m of text.matchAll(re)) out.push({ entry: e, match: m[0], index: m.index });
  }
  return out;
}

/**
 * The matched strings themselves, as written in the text and in order: a match inside a longer one is dropped, so
 * "repaircafe@example.org" is reported once and not again as "example.org".
 */
export function matchedTexts(list, text) {
  const kept = [];
  for (const m of matchEntries(list, text).sort((a, b) => a.index - b.index || b.match.length - a.match.length)) {
    if (!m.match || kept.some((k) => m.index >= k.index && m.index + m.match.length <= k.index + k.match.length)) continue;
    kept.push(m);
  }
  return [...new Set(kept.map((m) => m.match))];
}

export function matchList(list, text) {
  const hits = [];
  for (const e of list) {
    e.re.lastIndex = 0;
    if (e.re.test(text)) hits.push(e.text || e.name || e.re.source);
  }
  return hits;
}

/** Saturated faces: [{name, group, match:[lower-case forms]}]. */
export function saturatedFaces() {
  const d = loadData('saturated-faces', null);
  if (d && Array.isArray(d.faces) && d.faces.length) return d.faces.map((f) => ({ name: f.name, group: f.group, match: (f.match || [f.name.toLowerCase()]).map((m) => m.toLowerCase()) }));
  return FALLBACK_FACES.map(([name, group]) => ({ name, group, match: [name.toLowerCase()] }));
}

/** Normalise a family name for matching: lower case, no quotes, no next/font hash, no weight suffixes. */
export function normaliseFamily(f) {
  return String(f || '')
    .replace(/["']/g, '')
    .replace(/^__([A-Za-z][A-Za-z0-9]*?)_[a-f0-9]{5,}$/i, '$1')
    .replace(/_/g, ' ')
    .replace(/\b(fallback|variable|var|thin|light|regular|medium|semibold|bold|black)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function faceOnList(family) {
  const n = normaliseFamily(family);
  if (!n) return null;
  for (const f of saturatedFaces()) if (f.match.includes(n) || f.match.some((m) => n === m || n.startsWith(`${m} `))) return f;
  return null;
}
