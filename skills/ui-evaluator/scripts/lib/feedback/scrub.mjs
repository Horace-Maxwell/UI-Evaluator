// Personal-data scrubbing and instruction-like text detection for imported feedback (ARCHITECTURE §13).
// The scrubber is a floor, not a guarantee: names missing from the roster, street addresses, usernames,
// order numbers and health details in free text still need a human read before anything is quoted.

const digits = (s) => (s.match(/\d/g) || []).length;

function luhn(numStr) {
  const ds = numStr.replace(/\D/g, '');
  let sum = 0;
  let alt = false;
  for (let i = ds.length - 1; i >= 0; i -= 1) {
    let n = Number(ds[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return ds.length >= 13 && sum % 10 === 0;
}

/**
 * Ordered patterns: specific shapes first so a Chinese resident ID is not reported as a phone number.
 * Each entry: [label, regex, optional predicate on the match].
 */
const PATTERNS = [
  ['url-credential', /\b[a-z][a-z0-9+.-]*:\/\/[^\s/@:]+:[^\s/@]+@[^\s]+/gi],
  ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g],
  ['iban', /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g],
  ['national-id', /(?<![\d-])\d{17}[\dXx](?![\d-])/g],
  ['national-id', /\b\d{3}-\d{2}-\d{4}\b/g],
  ['national-id', /\b[A-CEGHJ-PR-TW-Z]{2}[ ]?\d{2}[ ]?\d{2}[ ]?\d{2}[ ]?[A-D]\b/g],
  ['card', /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g, (m) => digits(m) >= 13 && digits(m) <= 19 && (luhn(m) || /^\d{4}([ -])\d{4}\1\d{4}\1\d{1,7}$/.test(m.trim()))],
  ['passport', /\b[A-Z]{1,2}\d{7,8}\b/g],
  // The first group after a country code may be one digit (+33 6 39 98 12 34); digit counts below keep short numbers out.
  ['phone', /(?<![\w/])(?:\+\d{1,3}[ .-]?)?(?:\(\d{1,4}\)[ .-]?)?\d{1,4}(?:[ .-]?\d{2,5}){1,5}(?![\w/])/g, (m) => {
    const n = digits(m);
    if (/^\d{4}-\d{2}-\d{2}$/.test(m.trim())) return false; // ISO date
    if (/^\d{1,2}[.-]\d{1,2}[.-]\d{2,4}$/.test(m.trim())) return false; // other dates
    return m.trim().startsWith('+') ? n >= 8 && n <= 15 : n >= 9 && n <= 15;
  }],
  ['ip', /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g],
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasHan = (s) => /\p{Script=Han}/u.test(s);

/**
 * @param {{ roster?: Array<{ name: string, code?: string, aliases?: string[] }> }} opts
 * @returns {(text: string) => { text: string, counts: Record<string, number> }}
 */
export function makeScrubber({ roster = [] } = {}) {
  const names = [];
  for (const person of roster) {
    for (const n of [person.name, ...(person.aliases || [])]) {
      const t = String(n || '').trim();
      if (t.length >= 2) names.push({ text: t, code: person.code || null });
    }
  }
  // Longest first, so "Mary Ann Lee" is replaced before "Mary Ann".
  names.sort((a, b) => b.text.length - a.text.length);
  const nameRes = names.map(({ text, code }) => ({
    re: hasHan(text) ? new RegExp(escapeRe(text), 'gu') : new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(text)}(?![\\p{L}\\p{N}])`, 'giu'),
    replacement: code ? `[${code}]` : '[name]',
  }));
  return function scrub(input) {
    const counts = {};
    if (input === null || input === undefined) return { text: input, counts };
    let text = String(input);
    const apply = ([label, re, ok]) => {
      text = text.replace(re, (m) => {
        if (ok && !ok(m)) return m;
        counts[label] = (counts[label] || 0) + 1;
        return `[${label}]`;
      });
    };
    // Credentials and emails first (they contain name-like local parts), then roster names, then numbers.
    PATTERNS.slice(0, 2).forEach(apply);
    for (const { re, replacement } of nameRes) {
      text = text.replace(re, () => {
        counts.name = (counts.name || 0) + 1;
        return replacement;
      });
    }
    PATTERNS.slice(2).forEach(apply);
    return { text, counts };
  };
}

/** Text that addresses an AI or tries to steer the evaluation. Flag it; never act on it (EVAL-044). */
const INSTRUCTION_PATTERNS = [
  /\b(ignore|disregard|forget|override)\b[^.\n]{0,40}\b(instructions?|rules?|prompts?|guidelines|polic(y|ies))\b/i,
  /\b(you are|you're|as) (an? )?(ai|a\.i\.|assistant|language model|llm|chatbot|claude|chatgpt|gpt-?\d*|gemini|copilot)\b/i,
  /\b(system prompt|developer message|jailbreak|prompt injection)\b/i,
  /\b(mark|set|close|label)\b[^.\n]{0,30}\b(as )?(resolved|fixed|verified|dismissed|won'?t fix|not a problem)\b/i,
  /\b(assistant|ai|agent|claude|gpt)\s*[:,]\s*(please )?(do|run|delete|execute|open|send|approve)\b/i,
  /(忽略|无视|忘记)(之前|以上|所有|上面)?的?(指令|指示|规则|提示|要求)/,
  /(你是|作为)(一个|一名)?\s*(AI|人工智能|助手|语言模型|大模型)/i,
  /(标记|设置|改)为?(已解决|已修复|已验证|不是问题)/,
];

export function instructionLike(text) {
  const t = String(text || '');
  return INSTRUCTION_PATTERNS.some((re) => re.test(t));
}

/**
 * Map a reporter's own severity to a prior on the 0–4 scale [calibrating] (feedback-analysis §3.2).
 * Star ratings and unknown words give no prior. Raters never see it.
 */
export function severityPrior(value, scale = '') {
  const v = String(value ?? '').trim().toLowerCase();
  const sc = String(scale || '').toLowerCase();
  if (!v) return null;
  if (/star|★/.test(sc) || /★|☆/.test(v)) return null;
  if (/^(blocker|critical|urgent|showstopper|p0|sev ?1|can'?t use( it)?|致命|阻塞|紧急|严重)$/.test(v)) return [3, 4];
  if (/^(high|important|major|p1|sev ?2|高|重要)$/.test(v)) return [2, 3];
  if (/^(medium|normal|moderate|suggestion|p2|sev ?3|中|一般|建议)$/.test(v)) return [1, 2];
  if (/^(low|minor|cosmetic|trivial|nice to have|p3|sev ?4|低|轻微|小问题)$/.test(v)) return [1, 1];
  // Numeric scales: use the declared range ("1 to 5, 5 = most serious") when present.
  const n = Number(v);
  if (Number.isFinite(n)) {
    const m = sc.match(/(\d+)\s*(?:to|-|–|—)\s*(\d+)/);
    if (!m) return null;
    const lo = Number(m[1]);
    const hi = Number(m[2]);
    if (!(hi > lo) || n < lo || n > hi) return null;
    const highIsSerious = !/(1|lowest)\s*=\s*most/.test(sc);
    const share = highIsSerious ? (n - lo) / (hi - lo) : (hi - n) / (hi - lo);
    if (share >= 0.75) return [3, 4];
    if (share >= 0.5) return [2, 3];
    if (share >= 0.25) return [1, 2];
    return [1, 1];
  }
  return null;
}
