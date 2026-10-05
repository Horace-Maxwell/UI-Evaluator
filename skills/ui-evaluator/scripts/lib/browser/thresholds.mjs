// Pure threshold helpers behind the browser checks. Numbers repeat QUALITY-BAR (G1–G4) exactly;
// proposals marked [calibrating] there are marked here too. No DOM, no Playwright: unit-tested directly.
import { parseColor, contrastRatio, toOklch, rgbToHsl, luminance } from '../util/color.mjs';

const EPS = 0.005;

// --- contrast (A11Y-11, A11Y-12, COL-02) -------------------------------------------------------

/** WCAG "large scale": ≥ 24 px, or ≥ 18.66 px when bold (computed weight ≥ 700 [calibrating]). */
export function isLargeText(px, weight) {
  return px >= 24 - EPS || (px >= 18.66 - EPS && Number(weight) >= 700);
}

export function textContrastMinimum(px, weight) {
  return isLargeText(px, weight) ? 3 : 4.5;
}

/** CJK text from 18 to < 24 px (not bold-large) with contrast in [3, 4.5) goes to the auditor (accessibility.md §5). */
export function cjkReviewBand(px, weight, ratio) {
  return !isLargeText(px, weight) && px >= 18 - EPS && px < 24 && ratio >= 3 && ratio < 4.5;
}

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

function premul(c) {
  const a = c.alpha ?? 1;
  return { r: c.r * a, g: c.g * a, b: c.b * a, a };
}
function over(top, bottom) {
  // premultiplied source-over
  return { r: top.r + bottom.r * (1 - top.a), g: top.g + bottom.g * (1 - top.a), b: top.b + bottom.b * (1 - top.a), a: top.a + bottom.a * (1 - top.a) };
}
function scale(c, k) {
  return { r: c.r * k, g: c.g * k, b: c.b * k, a: c.a * k };
}
function unpremul(c) {
  if (c.a <= 0) return { r: 0, g: 0, b: 0, alpha: 0 };
  return { r: c.r / c.a, g: c.g / c.a, b: c.b / c.a, alpha: c.a };
}

/**
 * Composite a text colour and its ancestors' backgrounds with group opacity, as the browser paints them.
 * @param {{bg:object|null, op:number}[]} chain element first, root last (bg parsed colours; null = transparent)
 * @param {object} canvas the page canvas colour
 * @param {object|null} fg text colour (parsed), or null to get only the background
 * @returns {{bg:object, fg:object|null}} opaque sRGB colours
 */
export function compositeChain(chain, canvas, fg = null) {
  // Paint from the root down; each layer is a group whose opacity applies to everything inside it.
  const layers = [...chain].reverse();
  const paint = (i, withText) => {
    if (i >= layers.length) return withText && fg ? premul(fg) : premul(TRANSPARENT);
    const L = layers[i];
    let content = premul(L.bg || TRANSPARENT);
    content = over(paint(i + 1, withText), content);
    const op = Number.isFinite(L.op) ? L.op : 1;
    return op < 1 ? scale(content, op) : content;
  };
  const base = premul({ ...(canvas || { r: 1, g: 1, b: 1 }), alpha: 1 });
  const bg = unpremul(over(paint(0, false), base));
  const fgc = fg ? unpremul(over(paint(0, true), base)) : null;
  return { bg: { ...bg, alpha: 1 }, fg: fgc ? { ...fgc, alpha: 1 } : null };
}

export function ratio(fg, bg) {
  return Math.round(contrastRatio(fg, bg) * 100) / 100;
}

export function chroma(c) {
  return toOklch(c).c;
}

/**
 * COL-02 [calibrating]: text OKLCH chroma < 0.005 on a surface with chroma ≥ 0.05. Near-white and near-black text
 * (OKLCH L ≥ 0.95 or ≤ 0.2 [calibrating]) is not "grey": it is the conventional on-colour role (Material on-primary).
 */
export function isGreyOnColour(fg, bg) {
  const f = toOklch(fg);
  if (f.l >= 0.95 || f.l <= 0.2) return false;
  return f.c < 0.005 && chroma(bg) >= 0.05;
}

// --- typography (TYP-01…10) ----------------------------------------------------------------------

/** TYP-01: no text < 12 px; non-interactive legal or caption text ≥ 11 px; CJK ≥ 12 px without exception. */
export function minTextSize({ cjk, legalOrCaption, interactive }) {
  if (cjk) return 12;
  return legalOrCaption && !interactive ? 11 : 12;
}

/** TYP-02 body thresholds by mode; inputs ≥ 16 px below 768 px. */
export function bodyMinimum(mode) {
  return mode === 'operate' ? 14 : 16;
}

/**
 * TYP-03 line height. Returns {ok, min, kind} for text that renders on `lines` lines.
 * Latin body ≥ 3 lines ≥ 1.4; two-line UI text ≥ 1.3; multi-line CJK body ≥ 1.5;
 * wrapping headings ≥ 1.1 (Latin) or ≥ 1.2 (CJK [calibrating]); line-height ≤ 1.0 on wrapping text ≥ 48 px fails.
 */
export function lineHeightRule({ lines, ratio: lh, cjk, heading, px }) {
  if (!(lines >= 2) || !Number.isFinite(lh)) return { ok: true, min: null, kind: 'single-line' };
  let min;
  let kind;
  if (heading) {
    min = cjk ? 1.2 : 1.1;
    kind = cjk ? 'wrapping CJK heading' : 'wrapping heading';
  } else if (cjk) {
    min = 1.5;
    kind = 'multi-line CJK body text';
  } else if (lines >= 3) {
    min = 1.4;
    kind = 'Latin body text of 3+ lines';
  } else {
    min = 1.3;
    kind = 'two-line text';
  }
  let ok = lh >= min - EPS;
  if (px >= 48 && lh <= 1.0 + EPS) {
    ok = false;
    kind = `${kind}; line-height 1.0 on wrapping text ≥ 48 px`;
  }
  return { ok, min, kind };
}

/** TYP-04 measure: fails when ≥ 2 rendered lines exceed 80 characters (Latin) or 48 glyphs (CJK). */
export function measureRule(lines, cjkDominant) {
  const limit = cjkDominant ? 48 : 80;
  const over = lines.filter((l) => (cjkDominant ? l.cjk : l.chars) > limit);
  return { ok: over.length < 2, limit, over: over.length, longest: Math.max(0, ...lines.map((l) => (cjkDominant ? l.cjk : l.chars))) };
}

/** Longest run of uppercase text (letters all capitals; spaces, digits and punctuation allowed inside). */
export function uppercaseRunLength(text) {
  const s = String(text || '');
  let best = 0;
  let start = -1;
  let letters = 0;
  let lastUpperEnd = -1;
  for (let i = 0; i <= s.length; i += 1) {
    const ch = s[i];
    const isLetter = ch !== undefined && /\p{L}/u.test(ch);
    const isUpper = isLetter && ch === ch.toUpperCase() && ch !== ch.toLowerCase();
    if (isUpper) {
      if (start < 0) start = i;
      letters += 1;
      lastUpperEnd = i + 1;
    } else if (ch === undefined || (isLetter && !isUpper)) {
      if (start >= 0 && letters >= 2) best = Math.max(best, lastUpperEnd - start);
      start = -1;
      letters = 0;
    }
  }
  return best;
}

/**
 * TYP-08 tracking. letterSpacing in px. Returns a list of problems (strings).
 * Lowercase body ≤ 0.05em; display ≥ −0.04em; CJK ≥ 0; no uppercase run > 30 characters.
 */
export function trackingProblems({ px, letterSpacingPx, uppercase, display, cjk, text }) {
  const out = [];
  const em = px > 0 ? letterSpacingPx / px : 0;
  if (cjk && letterSpacingPx < -EPS) out.push(`CJK letter-spacing ${round(em, 3)}em < 0`);
  if (!cjk && !uppercase && !display && em > 0.05 + 1e-4) out.push(`lowercase body letter-spacing ${round(em, 3)}em > 0.05em`);
  if (!cjk && display && em < -0.04 - 1e-4) out.push(`display letter-spacing ${round(em, 3)}em < −0.04em`);
  const run = uppercase ? longestRunTransformed(text) : uppercaseRunLength(text);
  if (run > 30) out.push(`uppercase run of ${run} characters > 30`);
  return out;
}

function longestRunTransformed(text) {
  return uppercaseRunLength(String(text || '').toUpperCase());
}

/** TYP-09: display ≤ 6rem unless declared; a full-sentence h1 ≥ 72 px with ≥ 40 characters fails. */
export function displayProblems({ px, rootPx = 16, isH1, text, declaredMax }) {
  const out = [];
  const max = declaredMax || 6 * rootPx;
  if (px > max + EPS) out.push(`display text ${round(px, 1)} px > ${declaredMax ? `declared ${declaredMax} px` : `6rem (${max} px)`}`);
  const chars = String(text || '').replace(/\s+/g, ' ').trim().length;
  if (isH1 && px >= 72 - EPS && chars >= 40) out.push(`h1 of ${chars} characters at ${round(px, 1)} px (≥ 72 px with ≥ 40 characters)`);
  return out;
}

/** TYP-06: adjacent role steps ≥ 1.25 (≥ 1.125 Operate), or separated by weight (≥ 200 [heuristic]). */
export function flatSteps(roles, mode) {
  const min = mode === 'operate' ? 1.125 : 1.25;
  const out = [];
  for (let i = 0; i + 1 < roles.length; i += 1) {
    const a = roles[i];
    const b = roles[i + 1];
    const r = b.px > 0 ? a.px / b.px : Infinity;
    const weightSep = Math.abs((a.weight || 400) - (b.weight || 400)) >= 200;
    if (r < min - 1e-6 && !weightSep) out.push({ upper: a.role, lower: b.role, ratio: round(r, 3), min });
  }
  return out;
}

// --- spacing and layout (LAY-01…05, SHP-01, SHP-02) ------------------------------------------------

/** LAY-01: with no declared scale, on-scale = 0, 2 px or a multiple of 4 px (±0.5 px) [calibrating]. */
export function onSpacingScale(px, scale = null) {
  const v = Math.abs(px);
  if (v < 0.5) return true;
  if (Array.isArray(scale) && scale.length) return scale.some((s) => Math.abs(s - v) <= 0.5);
  if (Math.abs(v - 2) <= 0.5) return true;
  const r = v % 4;
  return r <= 0.5 || r >= 3.5;
}

/** LAY-02: among ≥ 10 declarations (deduplicated), fail when one value > 60% and ≤ 3 distinct values. */
export function spacingMonotony(values) {
  const rounded = values.map((v) => Math.round(Math.abs(v) / 4) * 4).filter((v) => v > 0);
  const counts = new Map();
  for (const v of rounded) counts.set(v, (counts.get(v) || 0) + 1);
  const n = rounded.length;
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [0, 0];
  const share = n ? top[1] / n : 0;
  return { n, distinct: counts.size, topValue: top[0], topShare: round(share, 3), fail: n >= 10 && share > 0.6 && counts.size <= 3 };
}

/** LAY-04: vertical inset ≥ max(4 px, 0.3em); horizontal ≥ max(8 px, 0.5em). */
export function crampedPadding({ top, bottom, left, right, fontPx }) {
  const v = Math.max(4, 0.3 * fontPx);
  const h = Math.max(8, 0.5 * fontPx);
  const out = [];
  if (Math.min(top, bottom) < v - 0.5) out.push(`vertical inset ${round(Math.min(top, bottom), 1)} px < ${round(v, 1)} px`);
  if (Math.min(left, right) < h - 0.5) out.push(`horizontal inset ${round(Math.min(left, right), 1)} px < ${round(h, 1)} px`);
  return out;
}

/**
 * SHP-01: when the inset is smaller than the parent radius, child radius ≤ parent radius − inset;
 * otherwise child radius ≤ parent radius.
 */
export function concentricLimit(parentRadius, inset) {
  return inset < parentRadius ? Math.max(0, parentRadius - inset) : parentRadius;
}

export function concentricViolation({ parentRadius, inset, childRadius }) {
  const limit = concentricLimit(parentRadius, inset);
  return { fail: childRadius > limit + 0.5, limit };
}

/** Split a CSS list on top-level commas. */
export function splitTopLevel(s) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of String(s || '')) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const COLOR_RE = /(?:rgba?|hsla?|oklch|oklab|lab|lch|color|hwb)\([^()]*(?:\([^()]*\)[^()]*)*\)|#[0-9a-f]{3,8}\b|\b(?:transparent|currentcolor|black|white)\b/i;

/** Parse a computed box-shadow / text-shadow value into layers. */
export function parseShadow(value) {
  if (!value || value === 'none') return [];
  return splitTopLevel(value).map((layer) => {
    const m = layer.match(COLOR_RE);
    const colorText = m ? m[0] : 'rgb(0, 0, 0)';
    const rest = layer.replace(colorText, ' ');
    const inset = /\binset\b/.test(rest);
    const nums = (rest.match(/-?\d*\.?\d+px|-?\d*\.?\d+(?=\s|$)/g) || []).map((x) => parseFloat(x));
    const [x = 0, y = 0, blur = 0, spread = 0] = nums;
    return { inset, x, y, blur, spread, colorText, color: parseColor(colorText) };
  });
}

/** A normalised key for counting distinct shadow styles (colours rounded). */
export function shadowKey(layers) {
  return layers
    .map((l) => {
      const c = l.color || { r: 0, g: 0, b: 0, alpha: 1 };
      const col = [c.r, c.g, c.b].map((v) => Math.round(v * 255 / 8)).join('.');
      return `${l.inset ? 'i' : ''}${Math.round(l.x)},${Math.round(l.y)},${Math.round(l.blur)},${Math.round(l.spread)},${col},${Math.round((c.alpha ?? 1) * 20)}`;
    })
    .join('|');
}

/** Spread-only rings (zero blur, zero offset) are borders, not shadows. */
export function isBorderRing(layers) {
  return layers.length > 0 && layers.every((l) => l.blur === 0 && l.x === 0 && l.y === 0);
}

/** SHP-02: every non-focus shadow has at least one blurred layer with a non-zero offset. */
export function zeroOffsetShadow(layers) {
  const blurred = layers.filter((l) => l.blur > 0 && (l.color?.alpha ?? 1) > 0);
  return blurred.length > 0 && blurred.every((l) => l.x === 0 && l.y === 0);
}

/** SHP-02 ghost card [calibrating]: a visible border ≤ 1.5 px with a shadow layer of blur ≥ 24 px. */
export function ghostCard({ borderWidth, layers }) {
  return borderWidth > 0 && borderWidth <= 1.5 && layers.some((l) => l.blur >= 24 && !l.inset && (l.color?.alpha ?? 1) > 0);
}

// --- motion (MOT-01…07) ----------------------------------------------------------------------------

export const LAYOUT_PROPS = ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding', 'inset',
  'min-width', 'max-width', 'min-height', 'max-height', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'inline-size', 'block-size',
  'margin-inline', 'margin-block', 'padding-inline', 'padding-block', 'inset-inline', 'inset-block',
  'margin-inline-start', 'margin-inline-end', 'margin-block-start', 'margin-block-end',
  'padding-inline-start', 'padding-inline-end', 'padding-block-start', 'padding-block-end'];

export function isLayoutProperty(p) {
  const k = String(p || '').trim().replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).toLowerCase();
  return LAYOUT_PROPS.includes(k);
}

/** "0.3s, 150ms" → [300, 150]. */
export function parseTimes(value) {
  return splitTopLevel(value).map((t) => {
    const v = parseFloat(t);
    if (!Number.isFinite(v)) return 0;
    return /ms\s*$/.test(t) ? v : v * 1000;
  });
}

/** MOT-03: cubic-bezier with y1 or y2 outside [−0.1, 1.1]. */
export function bezierOvershoot(timing) {
  const out = [];
  const re = /cubic-bezier\(\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*\)/g;
  let m;
  while ((m = re.exec(String(timing || '')))) {
    const y1 = Number(m[2]);
    const y2 = Number(m[4]);
    if (y1 < -0.1 - 1e-9 || y1 > 1.1 + 1e-9 || y2 < -0.1 - 1e-9 || y2 > 1.1 + 1e-9) out.push(m[0]);
  }
  return out;
}

export const BOUNCE_NAME = /bounce|elastic|wobble|jiggle|spring|rubber|jello|tada/i;

/** MOT-02 ceilings in ms by class and mode. */
export function durationCeiling(kind, mode) {
  switch (kind) {
    case 'state':
      return mode === 'operate' ? 250 : 300;
    case 'overlay':
    case 'page':
      return 500;
    case 'scrim':
      return 700;
    case 'focal':
      return 800;
    case 'frequent':
      return 150;
    default:
      return mode === 'operate' ? 250 : 300;
  }
}

// --- targets (A11Y-10, CMP-06) ------------------------------------------------------------------------

/** Distance from a point to a rectangle {x,y,w,h} (0 when inside). */
export function pointRectDistance(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

export function rectGap(a, b) {
  const dx = Math.max(0, b.x - (a.x + a.w), a.x - (b.x + b.w));
  const dy = Math.max(0, b.y - (a.y + a.h), a.y - (b.y + b.h));
  return Math.hypot(dx, dy);
}

/**
 * SC 2.5.8 spacing exception: a 24 px circle centred on each undersized target must not intersect another
 * target or another undersized target's circle. Returns the ids of undersized targets that fail.
 * @param {{id:any, x:number, y:number, w:number, h:number, undersized:boolean, group?:any}[]} targets
 */
export function spacingFailures(targets, diameter = 24) {
  const r = diameter / 2;
  const under = targets.filter((t) => t.undersized);
  const fails = [];
  for (const t of under) {
    const cx = t.x + t.w / 2;
    const cy = t.y + t.h / 2;
    let conflict = null;
    for (const o of targets) {
      if (o === t || (o.group !== undefined && o.group === t.group)) continue;
      if (o.undersized) {
        const ox = o.x + o.w / 2;
        const oy = o.y + o.h / 2;
        if (Math.hypot(ox - cx, oy - cy) < diameter - 1e-6) {
          conflict = o.id;
          break;
        }
      } else if (pointRectDistance(cx, cy, o) < r - 1e-6) {
        conflict = o.id;
        break;
      }
    }
    if (conflict !== null) fails.push({ id: t.id, conflict });
  }
  return fails;
}

// --- copy (CPY-03) and language (A11Y-16) ---------------------------------------------------------------

const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'onto', 'or', 'over', 'per', 'so', 'the', 'to', 'up', 'via', 'vs', 'with', 'yet']);

/**
 * Classify a multi-word string's case: sentence | title | upper | lower; null when it cannot be told
 * (one word, no cased letters, or only small words after the first, as in "Sign in").
 */
export function classifyCase(text, { ignore = [] } = {}) {
  const words = (String(text || '').match(/[\p{L}][\p{L}\p{M}'’-]*/gu) || []).filter((w) => !ignore.includes(w));
  const cased = words.filter((w) => w !== w.toLowerCase() || w !== w.toUpperCase());
  if (words.length < 2 || cased.length < 2) return null;
  const isUpper = (w) => w === w.toUpperCase() && w !== w.toLowerCase();
  const isCap = (w) => w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase();
  if (words.every(isUpper)) return 'upper';
  if (words.every((w) => w === w.toLowerCase())) return 'lower';
  if (!isCap(words[0])) return null;
  const sig = words.slice(1).filter((w) => !SMALL_WORDS.has(w.toLowerCase()) && !(w.length >= 2 && isUpper(w)));
  if (!sig.length) return null;
  const caps = sig.filter(isCap).length;
  if (caps === sig.length) return 'title';
  if (caps === 0) return 'sentence';
  return caps / sig.length > 0.5 ? 'title' : 'sentence';
}

/** Dominant script of a text sample from script counts. */
export function dominantScript({ han = 0, kana = 0, hangul = 0, latin = 0 }) {
  const total = han + kana + hangul + latin;
  if (total < 1) return null;
  if (kana > 0 && (kana + han) / total >= 0.5 && kana / Math.max(1, han + kana) >= 0.1) return 'japanese';
  if (hangul / total >= 0.5) return 'korean';
  if ((han + kana) / total >= 0.5) return kana > han * 0.1 ? 'japanese' : 'chinese';
  if (latin / total >= 0.5) return 'latin';
  return 'mixed';
}

/** Does a language tag fit the dominant script? */
export function langFitsScript(lang, script) {
  const l = String(lang || '').toLowerCase();
  const primary = l.split('-')[0];
  if (!l) return false;
  if (script === 'chinese') return primary === 'zh' || primary === 'yue' || primary === 'cmn' || primary === 'wuu';
  if (script === 'japanese') return primary === 'ja';
  if (script === 'korean') return primary === 'ko';
  if (script === 'latin') return !['zh', 'ja', 'ko', 'yue', 'cmn', 'wuu', 'ar', 'he', 'ru', 'uk', 'el', 'th', 'hi', 'fa'].includes(primary);
  return true;
}

export function isValidLangTag(lang) {
  return /^[a-z]{2,3}(-[A-Za-z]{4})?(-([A-Za-z]{2}|\d{3}))?(-[A-Za-z0-9]{5,8})*$/i.test(String(lang || ''));
}

/** Chinese tag carries a region or script subtag (zh-CN, zh-TW, zh-HK, zh-Hans, zh-Hant…). */
export function chineseTagHasSubtag(lang) {
  return /^zh-(hans|hant|cn|tw|hk|mo|sg)\b/i.test(String(lang || ''));
}

const SIMPLIFIED_ONLY = '们这个来时为说国会对样还发经过动学现开实点进后种问长没东机关处变见门车让钱书电话应该区汉语图写听觉爱时间头边见众';
const TRADITIONAL_ONLY = '們這個來時為說國會對樣還發經過動學現開實點進後種問長沒東機關處變見門車讓錢書電話應該區漢語圖寫聽覺愛時間頭邊見眾';

/** Count characters that exist only in Simplified or only in Traditional Chinese (a small common set). */
export function hanVariantCounts(text) {
  let simp = 0;
  let trad = 0;
  for (const ch of String(text || '')) {
    if (SIMPLIFIED_ONLY.includes(ch) && !TRADITIONAL_ONLY.includes(ch)) simp += 1;
    else if (TRADITIONAL_ONLY.includes(ch) && !SIMPLIFIED_ONLY.includes(ch)) trad += 1;
  }
  return { simplified: simp, traditional: trad };
}

export function tagVariant(lang) {
  const l = String(lang || '').toLowerCase();
  if (/^zh-(hant|tw|hk|mo)\b/.test(l)) return 'traditional';
  if (/^zh-(hans|cn|sg)\b/.test(l)) return 'simplified';
  return null;
}

// --- tells helpers (SLP-02, SLP-08, SLP-21) ------------------------------------------------------------

/** SLP-02 indigo-violet band (OKLCH hue 260–310°, C ≥ 0.10, L 0.25–0.85 [calibrating]; or HSL 250–310°, S > 0.25, 0.15 < L < 0.85). */
export function inIndigoBand(c) {
  if (!c || (c.alpha ?? 1) < 0.2) return false;
  const o = toOklch(c);
  if (o.h >= 260 && o.h <= 310 && o.c >= 0.1 && o.l >= 0.25 && o.l <= 0.85) return true;
  const h = rgbToHsl(c);
  return h.h >= 250 && h.h <= 310 && h.s > 0.25 && h.l > 0.15 && h.l < 0.85;
}

const srgbToLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** CIE LCh chroma (D65 white) of an sRGB colour, 0..~130. */
export function cieChroma(c) {
  const [r, g, b] = [c.r, c.g, c.b].map(srgbToLinear);
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const a = 500 * (f(X) - f(Y));
  const bb = 200 * (f(Y) - f(Z));
  return Math.hypot(a, bb);
}

/** SLP-21 cream ground: min(R,G,B) ≥ 209, R ≥ G ≥ B, 6 ≤ R−B ≤ 48 (8-bit). */
export function isCream(c) {
  const R = Math.round(c.r * 255);
  const G = Math.round(c.g * 255);
  const B = Math.round(c.b * 255);
  return Math.min(R, G, B) >= 209 && R >= G && G >= B && R - B >= 6 && R - B <= 48;
}

export function relLuminance(c) {
  return luminance(c);
}

export function round(v, d = 2) {
  const k = 10 ** d;
  return Math.round(v * k) / k;
}
