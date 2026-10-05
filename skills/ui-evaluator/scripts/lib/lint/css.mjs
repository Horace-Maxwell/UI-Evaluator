// Zero-dependency CSS scanner for `uie lint`.
// Produces rules (with nesting resolved), declarations with absolute offsets, the @media / @supports / @layer
// context of each rule, @keyframes, @font-face, @import and Tailwind v4 at-rules (@theme, @utility, @apply).
// It reads .css, .scss and .less files, <style> blocks, style attributes and styled-components templates.
// It is a scanner, not a validator: malformed input degrades to fewer rules, never to an exception.
import { parseColor, extractColors } from '../util/color.mjs';

/** Replace comments with spaces (newlines kept) so offsets stay valid. `//` comments only in SCSS and Less. */
export function blankComments(text, lang = 'css') {
  const out = text.split('');
  const n = text.length;
  let quote = null;
  let paren = 0;
  const lineComments = lang === 'scss' || lang === 'less' || lang === 'sass';
  for (let i = 0; i < n; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === quote || ch === '\n') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '(') paren += 1;
    else if (ch === ')' && paren > 0) paren -= 1;
    if (ch === '/' && text[i + 1] === '*') {
      let j = text.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      for (let k = i; k < j; k += 1) if (out[k] !== '\n') out[k] = ' ';
      i = j - 1;
      continue;
    }
    if (lineComments && paren === 0 && ch === '/' && text[i + 1] === '/') {
      let j = text.indexOf('\n', i);
      if (j < 0) j = n;
      for (let k = i; k < j; k += 1) out[k] = ' ';
      i = j - 1;
    }
  }
  return out.join('');
}

function skipString(s, i, end) {
  const q = s[i];
  let j = i + 1;
  while (j < end) {
    if (s[j] === '\\') {
      j += 2;
      continue;
    }
    if (s[j] === q || s[j] === '\n') return j + 1;
    j += 1;
  }
  return end;
}

/** Index of the `}` matching the `{` at `open`, or `end` when unbalanced. */
function findClose(s, open, end) {
  let depth = 0;
  for (let i = open; i < end; i += 1) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      i = skipString(s, i, end) - 1;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return end;
}

/** Split at a separator outside parentheses, brackets and strings. */
export function splitTopLevel(value, sep = ',') {
  const out = [];
  let depth = 0;
  let cur = '';
  let quote = null;
  const s = String(value ?? '');
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (quote) {
      cur += ch;
      if (ch === '\\') {
        cur += s[i + 1] ?? '';
        i += 1;
      } else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === '(' || ch === '[') depth += 1;
    else if ((ch === ')' || ch === ']') && depth > 0) depth -= 1;
    if (depth === 0 && (sep === ' ' ? /\s/.test(ch) : ch === sep)) {
      if (sep !== ' ' || cur.trim()) out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim() || (sep !== ' ' && out.length)) out.push(cur.trim());
  return out.filter((x, i, a) => x !== '' || (sep !== ' ' && a.length > 1));
}

export function splitWords(value) {
  return splitTopLevel(value, ' ').filter(Boolean);
}

function resolveNesting(parent, child) {
  const c = child.replace(/\s+/g, ' ').trim();
  if (!parent) return c;
  const parents = splitTopLevel(parent, ',').slice(0, 8);
  const children = splitTopLevel(c, ',').slice(0, 8);
  const out = [];
  for (const p of parents) for (const ch of children) out.push(ch.includes('&') ? ch.replace(/&/g, p) : `${p} ${ch}`);
  return out.join(', ');
}

function makePos(text) {
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
    return { line: lo + 1, col: offset - starts[lo] + 1 };
  };
}

const NESTING_AT = new Set(['media', 'supports', 'container', 'layer', 'scope', 'document', '-moz-document', 'include', 'mixin', 'if', 'else', 'each', 'for', 'while', 'function', 'at-root', 'variant', 'custom-variant', 'when', 'return']);
const KEYFRAMES_AT = /^-?(?:webkit-|moz-|o-)?keyframes$/;

/**
 * Parse a stylesheet.
 * @param {string} text  source text (the whole file, or the file with non-CSS parts blanked)
 * @param {{lang?:string, start?:number, end?:number, pos?:(o:number)=>{line:number,col:number}, rootSelector?:string}} opts
 *   `start`/`end` limit parsing to a slice of `text` (offsets stay absolute); `rootSelector` collects top-level
 *   declarations into a rule with that selector (styled-components templates, style attributes).
 */
export function parseCss(text, opts = {}) {
  const lang = opts.lang || 'css';
  const start = opts.start ?? 0;
  const end = opts.end ?? text.length;
  // Blank comments only inside the slice: quotes in surrounding markup must not change the scanner's state.
  const src = text.slice(0, start).replace(/[^\n]/g, ' ') + blankComments(text.slice(start, end), lang);
  const pos = opts.pos || makePos(text);
  const sheet = { lang, rules: [], keyframes: [], fontFaces: [], imports: [], atRules: [], vars: [], start, end };
  const root = opts.rootSelector ? newRule(opts.rootSelector, start, { media: [], at: [] }) : null;
  if (root) sheet.rules.push(root);
  parseBlock(start, end, { selector: opts.rootSelector || null, rule: root, media: [], at: [], starting: false });
  return sheet;

  function newRule(selector, offset, ctx, raw) {
    const p = pos(offset);
    return { selector, raw: raw ?? selector, offset, line: p.line, col: p.col, decls: [], media: ctx.media, at: ctx.at, starting: !!ctx.starting };
  }

  function addDecl(raw, offset, ctx) {
    const lead = raw.length - raw.trimStart().length;
    const t = raw.trim();
    if (!t) return;
    const off = offset + lead;
    if (t.startsWith('@')) {
      const m = t.match(/^@([\w-]+)\s*(:)?\s*([\s\S]*)$/);
      if (!m) return;
      const name = m[1].toLowerCase();
      const p = pos(off);
      if (m[2] && lang === 'less') {
        sheet.vars.push({ name: `@${m[1]}`, value: m[3].trim(), offset: off, line: p.line, col: p.col });
        return;
      }
      if (name === 'import') {
        const um = m[3].match(/url\(\s*(['"]?)([^'")]+)\1\s*\)|(['"])([^'"]+)\3/);
        sheet.imports.push({ url: um ? um[2] || um[4] : m[3].trim(), raw: t, offset: off, line: p.line, col: p.col });
        return;
      }
      if (name === 'apply' && ctx.rule) {
        ctx.rule.decls.push({ prop: '@apply', value: m[3].replace(/!important\s*$/i, '').trim(), important: /!important\s*$/i.test(m[3]), offset: off, line: p.line, col: p.col, valueOffset: off + t.indexOf(m[3]) });
        return;
      }
      sheet.atRules.push({ name, params: m[3].trim(), offset: off, line: p.line, col: p.col });
      return;
    }
    // Declaration: first colon outside parentheses and strings.
    let colon = -1;
    let depth = 0;
    for (let i = 0; i < t.length; i += 1) {
      const ch = t[i];
      if (ch === '"' || ch === "'") {
        i = skipString(t, i, t.length) - 1;
        continue;
      }
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      else if (ch === ':' && depth === 0) {
        colon = i;
        break;
      }
    }
    if (colon <= 0) return;
    const rawProp = t.slice(0, colon).trim();
    if (!/^(?:--[\w-]+|\$[\w-]+|[*_]?-?[a-zA-Z][\w-]*)$/.test(rawProp)) return;
    let value = t.slice(colon + 1).trim();
    const important = /!\s*important\s*$/i.test(value);
    if (important) value = value.replace(/!\s*important\s*$/i, '').trim();
    const p = pos(off);
    const prop = rawProp.startsWith('--') || rawProp.startsWith('$') ? rawProp : rawProp.toLowerCase().replace(/^[*_]/, '');
    const valueOffset = off + colon + 1 + (t.slice(colon + 1).length - t.slice(colon + 1).trimStart().length);
    const decl = { prop, value, important, offset: off, line: p.line, col: p.col, valueOffset };
    if (prop.startsWith('$')) {
      sheet.vars.push({ name: prop, value, offset: off, line: p.line, col: p.col });
      if (!ctx.rule) return;
    }
    if (ctx.rule) {
      decl.rule = ctx.rule;
      ctx.rule.decls.push(decl);
    } else if (ctx.frame) ctx.frame.decls.push(decl);
  }

  function handleBlock(prelude, preludeOffset, innerStart, innerEnd, ctx) {
    const lead = prelude.length - prelude.trimStart().length;
    const p = prelude.trim().replace(/\s+/g, ' ');
    const off = preludeOffset + lead;
    if (!p) {
      parseBlock(innerStart, innerEnd, ctx);
      return;
    }
    if (p.startsWith('@')) {
      const m = p.match(/^@([\w-]+)\s*(.*)$/);
      const name = (m ? m[1] : '').toLowerCase();
      const params = m ? m[2].trim() : '';
      if (KEYFRAMES_AT.test(name)) {
        const pp = pos(off);
        const kf = { name: params.replace(/["']/g, ''), offset: off, line: pp.line, col: pp.col, frames: [], media: ctx.media };
        sheet.keyframes.push(kf);
        parseFrames(innerStart, innerEnd, kf);
        return;
      }
      if (name === 'font-face') {
        const rule = newRule('@font-face', off, ctx);
        sheet.fontFaces.push(rule);
        parseBlock(innerStart, innerEnd, { ...ctx, rule });
        return;
      }
      if (name === 'starting-style') {
        if (ctx.rule && ctx.selector) {
          const rule = newRule(ctx.selector, off, { ...ctx, starting: true });
          sheet.rules.push(rule);
          parseBlock(innerStart, innerEnd, { ...ctx, rule, starting: true });
        } else parseBlock(innerStart, innerEnd, { ...ctx, starting: true });
        return;
      }
      if (name === 'theme' || name === 'utility' || name === 'page') {
        const selector = name === 'utility' ? `.${params}` : name === 'theme' ? '@theme' : '@page';
        const rule = newRule(selector, off, ctx, p);
        sheet.rules.push(rule);
        parseBlock(innerStart, innerEnd, { ...ctx, selector, rule });
        return;
      }
      if (name === 'media' || name === 'supports' || name === 'container' || name === 'layer') {
        const next = name === 'media' ? { ...ctx, media: [...ctx.media, params] } : { ...ctx, at: [...ctx.at, `@${name} ${params}`.trim()] };
        if (ctx.rule && ctx.selector) {
          // Nested conditional group inside a rule: its declarations belong to the same selector under the new condition.
          const rule = newRule(ctx.selector, off, next);
          sheet.rules.push(rule);
          parseBlock(innerStart, innerEnd, { ...next, rule });
        } else parseBlock(innerStart, innerEnd, { ...next, rule: null });
        return;
      }
      if (name === 'mixin' && !ctx.rule) {
        const rule = newRule(`@mixin ${params}`, off, ctx, p);
        sheet.rules.push(rule);
        parseBlock(innerStart, innerEnd, { ...ctx, selector: null, rule });
        return;
      }
      if (NESTING_AT.has(name)) {
        parseBlock(innerStart, innerEnd, { ...ctx, at: [...ctx.at, `@${name} ${params}`.trim()] });
        return;
      }
      parseBlock(innerStart, innerEnd, { ...ctx, at: [...ctx.at, `@${name}`] });
      return;
    }
    // Less mixin call with a block or a guard: treat like a selector anyway.
    const selector = resolveNesting(ctx.selector, p);
    const rule = newRule(selector, off, ctx, p);
    sheet.rules.push(rule);
    parseBlock(innerStart, innerEnd, { ...ctx, selector, rule });
  }

  function parseFrames(s0, e0, kf) {
    let i = s0;
    let stmt = s0;
    while (i < e0) {
      const ch = src[i];
      if (ch === '"' || ch === "'") {
        i = skipString(src, i, e0);
        continue;
      }
      if (ch === '{') {
        const close = findClose(src, i, e0);
        const sel = src.slice(stmt, i).trim();
        const pp = pos(stmt + (src.slice(stmt, i).length - src.slice(stmt, i).trimStart().length));
        const frame = { selector: sel.toLowerCase(), line: pp.line, col: pp.col, decls: [] };
        kf.frames.push(frame);
        parseBlock(i + 1, close, { selector: null, rule: null, frame, media: kf.media, at: [] });
        i = close + 1;
        stmt = i;
        continue;
      }
      i += 1;
    }
  }

  function parseBlock(s0, e0, ctx) {
    let i = s0;
    let stmt = s0;
    let paren = 0;
    while (i < e0) {
      const ch = src[i];
      if (ch === '"' || ch === "'") {
        i = skipString(src, i, e0);
        continue;
      }
      if (ch === '(') {
        paren += 1;
        i += 1;
        continue;
      }
      if (ch === ')') {
        if (paren > 0) paren -= 1;
        i += 1;
        continue;
      }
      if (ch === '#' && src[i + 1] === '{') {
        i = findClose(src, i + 1, e0) + 1;
        continue;
      }
      if (paren === 0) {
        if (ch === ';') {
          addDecl(src.slice(stmt, i), stmt, ctx);
          stmt = i + 1;
        } else if (ch === '{') {
          const close = findClose(src, i, e0);
          handleBlock(src.slice(stmt, i), stmt, i + 1, close, ctx);
          i = close + 1;
          stmt = i;
          continue;
        } else if (ch === '}') {
          stmt = i + 1;
        }
      }
      i += 1;
    }
    if (stmt < e0 && src.slice(stmt, e0).trim()) addDecl(src.slice(stmt, e0), stmt, ctx);
  }
}

/** Declarations of a style attribute or another bare declaration list (absolute offsets). */
export function parseDeclarations(text, start, end, pos) {
  const sheet = parseCss(text, { start, end, pos, rootSelector: '[style]' });
  return sheet.rules[0] ? sheet.rules[0].decls : [];
}

// ---- value helpers --------------------------------------------------------------------------------

const LENGTH_RE = /^(-?(?:\d+\.?\d*|\.\d+))(px|rem|em|%|vh|vw|vmin|vmax|dvh|svh|lvh|dvw|svw|lvw|ch|ex|pt|pc|cm|mm|in|q|vi|vb|cqw|cqh|cqi|cqb|fr)?$/i;

/** Parse one length token: { n, unit } (unit '' for unitless) or null. */
export function parseLength(token) {
  const m = String(token || '').trim().match(LENGTH_RE);
  if (!m) return null;
  return { n: Number(m[1]), unit: (m[2] || '').toLowerCase() };
}

/** Length in CSS px for px and rem values (rem at `rootPx`); null for other units. */
export function lengthPx(token, rootPx = 16) {
  const l = parseLength(token);
  if (!l) return null;
  if (l.unit === 'px') return l.n;
  if (l.unit === 'rem') return l.n * rootPx;
  if (l.unit === '' && l.n === 0) return 0;
  return null;
}

export function parseTimeMs(token) {
  const m = String(token || '').trim().match(/^(\d*\.?\d+)(ms|s)$/i);
  if (!m) return null;
  return m[2].toLowerCase() === 's' ? Number(m[1]) * 1000 : Number(m[1]);
}

const GRADIENT_RE = /\b(?:-webkit-|-moz-)?(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/i;
export function hasGradient(value) {
  return GRADIENT_RE.test(String(value || ''));
}

/** The argument strings of every gradient function in a value. */
export function gradientArgs(value) {
  const s = String(value || '');
  const out = [];
  const re = /(?:-webkit-|-moz-)?(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/gi;
  let m;
  while ((m = re.exec(s))) {
    let depth = 1;
    let j = m.index + m[0].length;
    const start = j;
    while (j < s.length && depth > 0) {
      if (s[j] === '(') depth += 1;
      else if (s[j] === ')') depth -= 1;
      j += 1;
    }
    out.push({ fn: m[0].replace(/\s*\($/, '').toLowerCase(), args: s.slice(start, j - 1), index: m.index });
  }
  return out;
}

const NOT_COLOR_WORDS = new Set(['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert', 'none', 'auto']);

/**
 * Literal colours in a value: hex, colour functions and named colours. `var()` and keywords are not colours.
 * Returns [{ text, color, index }].
 */
export function colorsIn(value) {
  // url(#id) references (SVG paint servers, masks) and quoted strings are not colours.
  const s = String(value || '').replace(/url\([^)]*\)|"[^"]*"|'[^']*'/gi, (m) => ' '.repeat(m.length));
  const out = extractColors(s);
  // Named colours (outside function calls such as var(--white)).
  const masked = s.replace(/\([^()]*\)/g, (m) => ' '.repeat(m.length));
  const re = /(^|[\s,(/])([a-z]{3,20})(?=$|[\s,)/;!])/gi;
  let m;
  while ((m = re.exec(masked))) {
    const word = m[2].toLowerCase();
    if (NOT_COLOR_WORDS.has(word)) continue;
    const c = parseColor(word);
    if (c) out.push({ text: m[2], color: c, index: m.index + m[1].length, named: true });
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Custom-property references in a value. */
export function varRefs(value) {
  return [...String(value || '').matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
}

/** Every cubic-bezier() in a value as [x1, y1, x2, y2]. */
export function cubicBeziers(value) {
  return [...String(value || '').matchAll(/cubic-bezier\(\s*([^)]*)\)/gi)]
    .map((m) => m[1].split(/[\s,]+/).filter(Boolean).map(Number))
    .filter((a) => a.length === 4 && a.every(Number.isFinite));
}

/** Parse one box-shadow / text-shadow / drop-shadow() layer: { inset, x, y, blur, spread, color(text) }. */
export function parseShadowLayer(layer) {
  const words = splitWords(layer);
  const lengths = [];
  let color = null;
  let inset = false;
  for (const w of words) {
    if (/^inset$/i.test(w)) {
      inset = true;
      continue;
    }
    const l = parseLength(w);
    if (l && (l.unit === 'px' || l.unit === 'rem' || l.unit === 'em' || l.unit === '')) {
      lengths.push(l.unit === 'rem' || l.unit === 'em' ? l.n * 16 : l.n);
      continue;
    }
    if (/^calc\(/i.test(w)) {
      lengths.push(null);
      continue;
    }
    color = color ? `${color} ${w}` : w;
  }
  if (lengths.length < 2) return null;
  return { inset, x: lengths[0], y: lengths[1], blur: lengths[2] ?? 0, spread: lengths[3] ?? 0, color };
}

/** Animation names used in an `animation` shorthand or `animation-name` value. */
export function animationNames(prop, value) {
  const KEYWORDS = /^(?:none|initial|inherit|unset|infinite|linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end|forwards|backwards|both|normal|reverse|alternate|alternate-reverse|running|paused|auto)$/i;
  const out = [];
  for (const part of splitTopLevel(value, ',')) {
    if (prop === 'animation-name') {
      const n = part.trim().replace(/["']/g, '');
      if (n && !KEYWORDS.test(n) && !/^var\(/.test(n)) out.push(n);
      continue;
    }
    for (const w of splitWords(part)) {
      if (KEYWORDS.test(w) || parseTimeMs(w) !== null || /^\d*\.?\d+$/.test(w) || /^(?:cubic-bezier|steps|var|linear)\(/i.test(w)) continue;
      out.push(w.replace(/["']/g, ''));
      break;
    }
  }
  return out;
}

const TIMING_WORD = /^(?:linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end|allow-discrete|normal|initial|inherit|unset)$/i;

/**
 * Properties named in a `transition` shorthand or `transition-property`; a shorthand with no property means `all`.
 * A part whose property may come from a variable or an interpolation (`var(--motion)`, `$e`, `$speed`) is `unknown`.
 */
export function transitionProps(prop, value) {
  const v = String(value || '').trim();
  if (!v || /^none$/i.test(v)) return [];
  if (prop === 'transition-property') return splitTopLevel(v, ',').map((x) => x.trim().toLowerCase()).map((x) => (/^(?:var\(|\$|@)/.test(x) ? 'unknown' : x)).filter(Boolean);
  const out = [];
  for (const part of splitTopLevel(v, ',')) {
    let name = null;
    let indirect = false;
    for (const w of splitWords(part)) {
      if (/^(?:var|env)\(|^\$|^@[\w-]/.test(w)) {
        indirect = true;
        continue;
      }
      if (parseTimeMs(w) !== null || TIMING_WORD.test(w) || /^(?:cubic-bezier|steps|linear)\(/i.test(w) || /^\d/.test(w)) continue;
      name = w.toLowerCase();
      break;
    }
    out.push(name || (indirect ? 'unknown' : 'all'));
  }
  return out;
}

export { makePos };
