// Text helpers shared by lint, findings identity and report language checks.

export function collapseWs(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

/** Normalise a markup/text snippet for identity hashing: drop volatile ids, numbers in classes, whitespace. */
export function normalizeSnippet(s) {
  return collapseWs(s)
    .replace(/\s(data-[\w-]+|id|key|style)="[^"]*"/g, '')
    .replace(/\b(css|sc|jsx|svelte|emotion|tw)-[a-z0-9]{4,}\b/gi, '$1-#')
    .replace(/\b[a-f0-9]{8,}\b/gi, '#')
    .slice(0, 300)
    .toLowerCase();
}

/** Normalise a CSS selector for identity: remove nth-child indices, hashed class names. */
export function normalizeSelector(sel) {
  return collapseWs(sel)
    .replace(/:nth-(child|of-type)\(\d+\)/g, '')
    .replace(/\.(css|sc|jsx|svelte|emotion)-[a-z0-9]+/gi, '')
    .replace(/\.[a-zA-Z0-9_-]*__[a-zA-Z0-9_-]*--?[a-zA-Z0-9]{5,}/g, '')
    .replace(/\s*>\s*/g, '>')
    .toLowerCase();
}

const EMOJI_RE = /\p{Extended_Pictographic}/u;
export function hasEmoji(s) {
  return EMOJI_RE.test(String(s || ''));
}

export function countMatches(s, re) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  return (String(s || '').match(g) || []).length;
}

const CJK_RE = /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/u;
const CJK_RE_G = /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/gu;
export function hasCjk(s) {
  return CJK_RE.test(String(s || ''));
}

/** Share of letters that are CJK (0..1). */
export function cjkRatio(s) {
  const t = String(s || '');
  const letters = (t.match(/\p{Letter}/gu) || []).length;
  if (!letters) return 0;
  return (t.match(CJK_RE_G) || []).length / letters;
}

export function words(s) {
  return String(s || '').match(/[\p{Letter}\p{Number}'’-]+/gu) || [];
}

export function truncate(s, n = 120) {
  const t = collapseWs(s);
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

/** Line number (1-based) of a character offset in text. */
export function lineOf(text, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i += 1) if (text.charCodeAt(i) === 10) line += 1;
  return line;
}

/** Build a fast offset → line lookup for a text. */
export function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}
