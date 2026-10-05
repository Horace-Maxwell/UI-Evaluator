// Source document model for `uie lint`: a tokenizer front end for HTML, Vue, Svelte, Astro, JSX/TSX, JS/TS and MDX.
// It extracts elements (tag, attributes, parent, line), text nodes, JS string literals with their context
// (object key, callee, owning declaration), class tokens (class/className strings and cn/clsx/cva/twMerge
// arguments), inline styles, imports and embedded stylesheets. Comments are blanked in `doc.code` so regex scans of
// script code never match commented-out code. Malformed input degrades to fewer nodes, never to an exception.
import path from 'node:path';
import { parseCss, parseDeclarations, makePos } from './css.mjs';

export const CSS_EXTS = new Set(['.css', '.scss', '.less']);
const SCRIPT_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype']);
const CLASS_CALLEES = /^(?:cn|clsx|classnames|classNames|cx|twMerge|twJoin|cva|tv|tw|ctl|clx|cnBase|mergeClasses|classList)$/;
const CSS_TAGS = /^(?:styled(?:\.[\w$]+|\([^)]*\))(?:\.attrs\([^)]*\))?|css|keyframes|createGlobalStyle|injectGlobal|global)$/;
const KEYWORDS_BEFORE_EXPR = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await', 'default', 'extends']);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rarr: '→', larr: '←', copy: '©', reg: '®', trade: '™', middot: '·', bull: '•', times: '×', check: '✓', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
export function decodeEntities(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp < 0x110000 ? String.fromCodePoint(cp) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function unescapeJs(s) {
  return s.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (m, e) => {
    if (e[0] === 'u') {
      const hex = e[1] === '{' ? e.slice(2, -1) : e.slice(1);
      return String.fromCodePoint(parseInt(hex, 16));
    }
    if (e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
    return { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }[e] ?? e;
  });
}

const isIdStart = (c) => /[A-Za-z_$À-￿]/.test(c);
const isIdPart = (c) => /[\w$À-￿]/.test(c);

function createDoc(file, text, ext, rel) {
  const pos = makePos(text);
  return {
    file,
    rel: rel || file,
    ext,
    text,
    pos,
    lineOf: (o) => pos(o).line,
    elements: [],
    texts: [],
    strings: [],
    imports: [],
    sheets: [],
    inlineStyles: [],
    classTokens: [],
    codeRanges: [],
    comments: [],
    code: '',
    jsx: false,
    markup: false,
    errors: [],
    _decls: null,
  };
}

/** Mark a range as script code; doc.code is built in finalize() with comment ranges blanked. */
function markCode(S, start, end) {
  if (end > start) S.codeRanges.push([start, end]);
}
function blankCode(S, start, end) {
  if (end > start) S.comments.push([start, end]);
}

// ---- JS / JSX ----------------------------------------------------------------------------------------

function readQuoted(text, i, end) {
  const q = text[i];
  let j = i + 1;
  while (j < end) {
    const c = text[j];
    if (c === '\\') {
      j += 2;
      continue;
    }
    if (c === q || c === '\n') return j + 1;
    j += 1;
  }
  return end;
}

function readRegex(text, i, end) {
  let j = i + 1;
  let cls = false;
  while (j < end) {
    const c = text[j];
    if (c === '\\') {
      j += 2;
      continue;
    }
    if (c === '\n') return j;
    if (cls) {
      if (c === ']') cls = false;
    } else if (c === '[') cls = true;
    else if (c === '/') {
      j += 1;
      while (j < end && /[a-z]/i.test(text[j])) j += 1;
      return j;
    }
    j += 1;
  }
  return end;
}

/** Identifier chain (a.b.c or styled(Button)) that ends right before `offset`; type arguments (`<Props>`) are skipped. */
function tagBefore(text, offset) {
  let j = offset - 1;
  while (j >= 0 && /\s/.test(text[j])) j -= 1;
  if (text[j] === '>' && text[j - 1] !== '=') {
    // styled.li<{ $active: boolean }>`…` or styled(Link)<Props>`…`: walk back over the type arguments.
    let depth = 0;
    let k = j;
    for (; k >= 0 && j - k < 2000; k -= 1) {
      const c = text[k];
      if (c === '>' && text[k - 1] !== '=') depth += 1;
      else if (c === '<') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    if (k >= 0 && depth === 0) {
      j = k - 1;
      while (j >= 0 && /\s/.test(text[j])) j -= 1;
    }
  }
  const endTag = j + 1;
  // styled(Button) / styled.div.attrs(...)
  let depth = 0;
  while (j >= 0) {
    const c = text[j];
    if (c === ')') depth += 1;
    else if (c === '(') {
      if (depth === 0) break;
      depth -= 1;
    } else if (depth === 0 && !/[\w$.]/.test(c)) break;
    j -= 1;
  }
  return text.slice(j + 1, endTag).replace(/\s+/g, '');
}

/** Object key right before a value at `offset` (`key: "value"`), else null. */
function keyBefore(text, offset) {
  let j = offset - 1;
  while (j >= 0 && /\s/.test(text[j])) j -= 1;
  if (text[j] !== ':') return null;
  j -= 1;
  while (j >= 0 && /\s/.test(text[j])) j -= 1;
  if (text[j] === '"' || text[j] === "'") {
    const q = text[j];
    const k = text.lastIndexOf(q, j - 1);
    return k >= 0 ? text.slice(k + 1, j) : null;
  }
  const endK = j + 1;
  while (j >= 0 && /[\w$-]/.test(text[j])) j -= 1;
  const key = text.slice(j + 1, endK);
  // A ternary branch (`cond ? "a" : "b"`) is not an object key.
  let k = j;
  while (k >= 0 && /\s/.test(text[k])) k -= 1;
  if (text[k] === '?') return null;
  return key || null;
}

/** Callee of the call whose argument list contains `offset` (e.g. `toast.error`, `cn`), within 600 chars. */
function calleeBefore(text, offset) {
  let depth = 0;
  const stop = Math.max(0, offset - 600);
  for (let j = offset - 1; j >= stop; j -= 1) {
    const c = text[j];
    if (c === ')' || c === ']' || c === '}') depth += 1;
    else if (c === '[' || c === '{') {
      if (depth === 0) {
        // Inside an array or object literal argument: keep walking out.
        continue;
      }
      depth -= 1;
    } else if (c === '(') {
      if (depth === 0) {
        let k = j - 1;
        while (k >= 0 && /\s/.test(text[k])) k -= 1;
        const e = k + 1;
        while (k >= 0 && /[\w$.]/.test(text[k])) k -= 1;
        const name = text.slice(k + 1, e);
        return /^[A-Za-z_$][\w$.]*$/.test(name) ? name : null;
      }
      depth -= 1;
    } else if (c === ';' && depth === 0) return null;
  }
  return null;
}

/**
 * True when a string literal is applied conditionally: after `&&`, `||`, `??` or `?`, as the else branch of a ternary,
 * or as an object key (`clsx({ 'border-l-4': isActive })`). State-dependent classes are not the element's rest style.
 */
function conditionalAt(text, start, end) {
  let a = start - 2;
  while (a >= 0 && /\s/.test(text[a])) a -= 1;
  const before = text.slice(Math.max(0, a - 1), a + 1);
  if (/&&|\|\||\?\?/.test(before) || (text[a] === '?' && text[a + 1] !== '.')) return true;
  let b = end + 1;
  while (b < text.length && /\s/.test(text[b])) b += 1;
  if (text[b] === ':' && /[{,(]/.test(text[(() => { let k = start - 2; while (k >= 0 && /\s/.test(text[k])) k -= 1; return k; })()] || '')) return true;
  if (text[a] === ':') {
    let k = a - 1;
    while (k >= 0 && /\s/.test(text[k])) k -= 1;
    if (text[k] === '"' || text[k] === "'" || text[k] === '`') return true; // `cond ? 'a' : 'b'`
  }
  return false;
}

function recordString(S, start, end, quote, ctx, isTemplate = false) {
  const raw = S.text.slice(start, end);
  const value = isTemplate ? raw : unescapeJs(raw);
  S.strings.push({
    value,
    offset: start,
    end,
    quote,
    isTemplate,
    attr: ctx.attr || null,
    el: ctx.el || null,
    inJsxChild: !!ctx.inJsxChild,
    key: keyBefore(S.text, start - (isTemplate ? 1 : 1)),
    callee: calleeBefore(S.text, start - 1),
    cond: conditionalAt(S.text, start, end),
  });
}

/**
 * Scan JS (optionally with JSX) from `i` to `end`. With `ctx.stopAtBrace` it returns the index after the `}` that
 * closes the current expression container.
 */
function scanJs(S, i, end, ctx) {
  const start = i;
  const r = scanJsInner(S, i, end, ctx);
  markCode(S, start, r);
  return r;
}

function scanJsInner(S, i, end, ctx) {
  const { text } = S;
  let depth = 0;
  let prev = null;
  while (i < end) {
    const ch = text[i];
    if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') {
      i += 1;
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      let e = text.indexOf('\n', i);
      if (e < 0 || e > end) e = end;
      blankCode(S, i, e);
      i = e;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      let e = text.indexOf('*/', i + 2);
      e = e < 0 || e + 2 > end ? end : e + 2;
      blankCode(S, i, e);
      i = e;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const e = readQuoted(text, i, end);
      recordString(S, i + 1, Math.max(i + 1, e - 1), ch, ctx);
      i = e;
      prev = 'str';
      continue;
    }
    if (ch === '`') {
      i = readTemplate(S, i, end, ctx);
      prev = 'str';
      continue;
    }
    if (ch === '/') {
      if (prev === null || prev === 'op' || prev === 'punct' || prev === 'kw' || prev === 'arrow') {
        const e = readRegex(text, i, end);
        // A regex literal's body is not code: blank it so code-pattern rules never match inside a pattern.
        blankCode(S, i + 1, Math.max(i + 1, e - 1));
        i = e;
        prev = 'regex';
      } else {
        i += 1;
        prev = 'op';
      }
      continue;
    }
    if (ch === '<' && ctx.jsx && !S.jsxDisabled && (prev === null || prev === 'op' || prev === 'punct' || prev === 'kw' || prev === 'arrow' || prev === 'jsx')) {
      const nx = text[i + 1];
      // A TSX generic arrow function (`<T,>(…) =>`, `<T extends X>(…) =>`, `<T = Y>`) is a type parameter list.
      if (prev !== 'jsx' && /^<[A-Za-z_$][\w$]*\s*(?:,|=(?!>)|extends\b)/.test(text.slice(i, i + 80))) {
        i += 1;
        prev = 'op';
        continue;
      }
      if (nx && (isIdStart(nx) || nx === '>')) {
        const r = tryJsx(S, i, end, ctx.el || null);
        if (r > 0) {
          i = r;
          prev = 'jsx';
          continue;
        }
      }
    }
    if (ch === '{') {
      depth += 1;
      i += 1;
      prev = 'punct';
      continue;
    }
    if (ch === '}') {
      if (depth === 0 && ctx.stopAtBrace) return i + 1;
      depth -= 1;
      i += 1;
      prev = '}';
      continue;
    }
    if (ch === '(' || ch === '[') {
      i += 1;
      prev = 'punct';
      continue;
    }
    if (ch === ')' || ch === ']') {
      i += 1;
      prev = ')';
      continue;
    }
    if (isIdStart(ch)) {
      const s = i;
      while (i < end && isIdPart(text[i])) i += 1;
      const word = text.slice(s, i);
      prev = KEYWORDS_BEFORE_EXPR.has(word) ? 'kw' : 'id';
      if ((word === 'import' || word === 'export') && (s === 0 || /[\s;}]/.test(text[s - 1]))) readImport(S, s, end);
      continue;
    }
    if (/\d/.test(ch)) {
      while (i < end && /[\w.]/.test(text[i])) i += 1;
      prev = 'num';
      continue;
    }
    if (ch === '=' && text[i + 1] === '>') {
      i += 2;
      prev = 'arrow';
      continue;
    }
    i += 1;
    prev = 'op';
  }
  return i;
}

function readImport(S, s, end) {
  const slice = S.text.slice(s, Math.min(end, s + 1200));
  const m = slice.match(/^(?:import|export)\s+(?:type\s+)?([\s\S]*?)\s+from\s+(['"])([^'"\n]+)\2/) || slice.match(/^import\s+(['"])([^'"\n]+)\1/);
  if (!m) {
    const dyn = slice.match(/^import\s*\(\s*(['"])([^'"\n]+)\1/);
    if (dyn) S.imports.push({ source: dyn[2], names: [], offset: s, line: S.lineOf(s), dynamic: true });
    return;
  }
  if (m.length === 3) {
    S.imports.push({ source: m[2], names: [], offset: s, line: S.lineOf(s) });
    return;
  }
  const clause = m[1];
  const names = [];
  const def = clause.match(/^([A-Za-z_$][\w$]*)/);
  if (def && def[1] !== 'type') names.push(def[1]);
  const braces = clause.match(/\{([\s\S]*)\}/);
  if (braces) {
    for (const part of braces[1].split(',')) {
      const p = part.trim().replace(/^type\s+/, '');
      if (!p) continue;
      const am = p.match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/);
      if (am) names.push(am[1]);
    }
  }
  const ns = clause.match(/\*\s+as\s+([\w$]+)/);
  if (ns) names.push(ns[1]);
  S.imports.push({ source: m[3], names, offset: s, line: S.lineOf(s) });
}

function readTemplate(S, i, end, ctx) {
  const { text } = S;
  const tag = tagBefore(text, i);
  let j = i + 1;
  const parts = [];
  let partStart = j;
  const exprRanges = [];
  while (j < end) {
    const c = text[j];
    if (c === '\\') {
      j += 2;
      continue;
    }
    if (c === '`') {
      parts.push([partStart, j]);
      j += 1;
      break;
    }
    if (c === '$' && text[j + 1] === '{') {
      parts.push([partStart, j]);
      const e = scanJs(S, j + 2, end, { ...ctx, jsx: ctx.jsx, stopAtBrace: true, inTemplate: true });
      exprRanges.push([j, e]);
      j = e;
      partStart = j;
      continue;
    }
    j += 1;
  }
  if (CSS_TAGS.test(tag)) {
    // Styled-components / emotion template: parse as CSS with each interpolation replaced, at the same length, by the
    // placeholder `$e` (read as a token reference: theme values and props are not literals). An interpolation that
    // stands alone as a statement (a mixin or a nested css`` block) also ends the statement with `;`.
    const chars = S.text.slice(0, j).split('');
    for (const [a, b] of exprRanges) {
      for (let k = a; k < b; k += 1) if (chars[k] !== '\n') chars[k] = ' ';
      let p = a - 1;
      while (p > i && (text[p] === ' ' || text[p] === '\t')) p -= 1;
      let q = b;
      while (q < j && (text[q] === ' ' || text[q] === '\t')) q += 1;
      const standalone = (p <= i || /[\n;{}]/.test(text[p])) && (q >= j - 1 || /[\n;}]/.test(text[q]));
      if (b - a >= 3) {
        chars[a] = '$';
        chars[a + 1] = 'e';
        if (standalone) {
          // Newlines are kept so line numbers stay true; the `;` goes on the first blanked character that is not one.
          let s = a + 2;
          while (s < b && chars[s] === '\n') s += 1;
          if (s < b) chars[s] = ';';
        }
      }
    }
    const blanked = chars.join('');
    try {
      const sheet = parseCss(blanked, { start: i + 1, end: Math.max(i + 1, j - 1), pos: S.pos, rootSelector: tag.startsWith('keyframes') ? null : '&' });
      S.sheets.push({ sheet, kind: tag.startsWith('createGlobalStyle') || tag === 'injectGlobal' || tag === 'global' ? 'global' : 'styled', tag, offset: i });
    } catch (e) {
      S.errors.push(`styled template at ${S.lineOf(i)}: ${e.message}`);
    }
  } else if (parts.length) {
    const value = parts.map(([a, b]) => text.slice(a, b)).join(' ');
    S.strings.push({
      value,
      offset: parts[0][0],
      end: parts[parts.length - 1][1],
      quote: '`',
      isTemplate: true,
      tag: tag || null,
      attr: ctx.attr || null,
      el: ctx.el || null,
      inJsxChild: !!ctx.inJsxChild,
      key: keyBefore(text, i),
      callee: calleeBefore(text, i),
    });
  }
  return j;
}

function checkpoint(S) {
  return { e: S.elements.length, t: S.texts.length, s: S.strings.length, i: S.imports.length, sh: S.sheets.length };
}
function rollback(S, cp) {
  S.elements.length = cp.e;
  S.texts.length = cp.t;
  S.strings.length = cp.s;
  S.imports.length = cp.i;
  S.sheets.length = cp.sh;
}

function tryJsx(S, i, end, parent) {
  const cp = checkpoint(S);
  const r = parseJsxElement(S, i, end, parent);
  if (r < 0) {
    rollback(S, cp);
    S.jsxFailures = (S.jsxFailures || 0) + 1;
    if (S.jsxFailures > 60) S.jsxDisabled = true;
  }
  return r;
}

function newElement(S, tag, offset, parent, kind) {
  const p = S.pos(offset);
  const el = {
    tag,
    lower: tag.toLowerCase(),
    isComponent: /^[A-Z]/.test(tag) || tag.includes('.'),
    offset,
    end: offset,
    line: p.line,
    col: p.col,
    attrs: [],
    parent,
    children: [],
    texts: [],
    selfClosing: false,
    hasSpread: false,
    kind,
    index: S.elements.length,
  };
  return el;
}

function pushAttr(S, el, name, kind, value, offset, valueOffset) {
  const p = S.pos(offset);
  el.attrs.push({ name, lower: normAttr(name), kind, value, offset, valueOffset, line: p.line, col: p.col });
}

/** Normalise attribute names across JSX, HTML, Vue and Svelte. */
export function normAttr(name) {
  const n = String(name);
  if (n === 'className' || n === 'class' || n === ':class' || n === 'v-bind:class' || n === 'class:list') return 'class';
  if (n === ':style' || n === 'v-bind:style') return 'style';
  if (n === 'htmlFor') return 'for';
  const vb = n.match(/^(?::|v-bind:)([\w-]+)$/);
  if (vb) return vb[1].toLowerCase();
  return n.toLowerCase();
}

/** DOM event name of an event-handler attribute, or null. */
export function eventOf(name) {
  const n = String(name);
  let m = n.match(/^on([A-Z][A-Za-z]+?)(?:Capture)?$/);
  if (m) return m[1].toLowerCase();
  m = n.match(/^on([a-z]+)$/);
  if (m) return m[1];
  m = n.match(/^(?:@|v-on:)([\w-]+)/);
  if (m) return m[1].toLowerCase();
  m = n.match(/^on:([\w-]+)/);
  if (m) return m[1].toLowerCase();
  return null;
}

function parseJsxElement(S, i, end, parent) {
  const { text } = S;
  let j = i + 1;
  let tag = '';
  if (text[j] !== '>') {
    const m = /^[A-Za-z_$][\w$.:-]*/.exec(text.slice(j, j + 200));
    if (!m) return -1;
    tag = m[0];
    j += tag.length;
  }
  const el = newElement(S, tag || '#fragment', i, parent, 'jsx');
  let selfClosing = false;
  if (tag) {
    for (;;) {
      while (j < end && /\s/.test(text[j])) j += 1;
      if (j >= end) return -1;
      const c = text[j];
      if (c === '/' && text[j + 1] === '>') {
        selfClosing = true;
        j += 2;
        break;
      }
      if (c === '>') {
        j += 1;
        break;
      }
      if (c === '{') {
        const e = scanJs(S, j + 1, end, { jsx: true, stopAtBrace: true, el, attr: '{...}' });
        el.hasSpread = true;
        j = e;
        continue;
      }
      const am = /^[A-Za-z_$][\w$:.-]*/.exec(text.slice(j, j + 200));
      if (!am) return -1;
      const name = am[0];
      const nameOff = j;
      j += name.length;
      while (j < end && /[ \t]/.test(text[j])) j += 1;
      if (text[j] === '=') {
        j += 1;
        while (j < end && /\s/.test(text[j])) j += 1;
        const q = text[j];
        if (q === '"' || q === "'") {
          const e = text.indexOf(q, j + 1);
          if (e < 0 || e > end) return -1;
          pushAttr(S, el, name, 'string', decodeEntities(text.slice(j + 1, e)), nameOff, j + 1);
          j = e + 1;
        } else if (q === '{') {
          const e = scanJs(S, j + 1, end, { jsx: true, stopAtBrace: true, el, attr: name });
          pushAttr(S, el, name, 'expr', text.slice(j + 1, Math.max(j + 1, e - 1)), nameOff, j + 1);
          j = e;
        } else if (q === '<') {
          const e = parseJsxElement(S, j, end, el);
          if (e < 0) return -1;
          pushAttr(S, el, name, 'element', '', nameOff, j);
          j = e;
        } else return -1;
      } else pushAttr(S, el, name, 'bool', true, nameOff, null);
    }
  } else j += 1;
  el.selfClosing = selfClosing;
  S.elements.push(el);
  if (parent) parent.children.push(el);
  if (selfClosing) {
    el.end = j;
    return j;
  }
  // Children.
  let textStart = j;
  const flush = (a, b) => {
    if (b <= a) return;
    const raw = text.slice(a, b);
    if (!raw.trim()) return;
    const lead = raw.length - raw.trimStart().length;
    const p = S.pos(a + lead);
    const t = { value: decodeEntities(raw.trim().replace(/\s+/g, ' ')), offset: a + lead, line: p.line, col: p.col, el, kind: 'jsx' };
    S.texts.push(t);
    el.texts.push(t);
  };
  while (j < end) {
    const c = text[j];
    if (c === '<') {
      if (text[j + 1] === '/') {
        flush(textStart, j);
        const close = text.indexOf('>', j);
        if (close < 0) return -1;
        el.end = close + 1;
        return close + 1;
      }
      const nx = text[j + 1];
      if (nx && (isIdStart(nx) || nx === '>')) {
        flush(textStart, j);
        const r = parseJsxElement(S, j, end, el);
        if (r < 0) return -1;
        j = r;
        textStart = j;
        continue;
      }
      j += 1;
      continue;
    }
    if (c === '{') {
      flush(textStart, j);
      const e = scanJs(S, j + 1, end, { jsx: true, stopAtBrace: true, el, inJsxChild: true });
      j = e;
      textStart = j;
      continue;
    }
    j += 1;
  }
  return -1;
}

// ---- HTML-like (HTML, Vue, Svelte, Astro) ---------------------------------------------------------------

function parseHtmlLike(S, flavor) {
  const { text } = S;
  const end = text.length;
  S.markup = true;
  let i = 0;
  if (flavor === 'astro' && text.startsWith('---')) {
    const close = text.indexOf('\n---', 3);
    if (close > 0) {
      scanJs(S, 3, close, { jsx: false });
      i = close + 4;
    }
  }
  const stack = [];
  const top = () => stack[stack.length - 1] || null;
  let textStart = i;
  const flush = (a, b) => {
    if (b <= a) return;
    let raw = text.slice(a, b);
    if (flavor === 'vue') raw = raw.replace(/\{\{[\s\S]*?\}\}/g, (m) => ' '.repeat(m.length));
    if (!raw.trim()) return;
    // Split on blank runs so offsets stay close to the words.
    const lead = raw.length - raw.trimStart().length;
    const p = S.pos(a + lead);
    const el = top();
    const t = { value: decodeEntities(raw.trim().replace(/\s+/g, ' ')), offset: a + lead, line: p.line, col: p.col, el, kind: 'html' };
    S.texts.push(t);
    if (el) el.texts.push(t);
  };
  while (i < end) {
    const c = text[i];
    if (c === '{' && (flavor === 'svelte' || flavor === 'astro')) {
      flush(textStart, i);
      if (flavor === 'svelte' && /[#/:@]/.test(text[i + 1] || '')) {
        // Svelte block syntax ({#if}, {/each}, {:else}, {@html}): skip to the closing brace.
        let k = i + 1;
        let d = 1;
        while (k < end && d > 0) {
          if (text[k] === '{') d += 1;
          else if (text[k] === '}') d -= 1;
          k += 1;
        }
        i = k;
        textStart = i;
        continue;
      }
      const e = scanJs(S, i + 1, end, { jsx: flavor === 'astro', stopAtBrace: true, el: top(), inJsxChild: true });
      i = e;
      textStart = i;
      continue;
    }
    if (c !== '<') {
      i += 1;
      continue;
    }
    if (text.startsWith('<!--', i)) {
      flush(textStart, i);
      const e = text.indexOf('-->', i + 4);
      i = e < 0 ? end : e + 3;
      textStart = i;
      continue;
    }
    if (text[i + 1] === '!' || text[i + 1] === '?') {
      flush(textStart, i);
      const e = text.indexOf('>', i);
      i = e < 0 ? end : e + 1;
      textStart = i;
      continue;
    }
    if (text[i + 1] === '/') {
      flush(textStart, i);
      const e = text.indexOf('>', i);
      const name = text.slice(i + 2, e < 0 ? end : e).trim().toLowerCase();
      for (let k = stack.length - 1; k >= 0; k -= 1) {
        if (stack[k].lower === name) {
          stack[k].end = e < 0 ? end : e + 1;
          stack.length = k;
          break;
        }
      }
      i = e < 0 ? end : e + 1;
      textStart = i;
      continue;
    }
    if (!/[A-Za-z]/.test(text[i + 1] || '')) {
      i += 1;
      continue;
    }
    flush(textStart, i);
    const r = parseHtmlTag(S, i, end, top(), flavor);
    if (!r) {
      i += 1;
      textStart = i;
      continue;
    }
    const { el, next } = r;
    i = next;
    const lower = el.lower;
    if (lower === 'script' || lower === 'style') {
      const closeRe = new RegExp(`</${lower}\\s*>`, 'i');
      const m = closeRe.exec(text.slice(i));
      const contentEnd = m ? i + m.index : end;
      if (lower === 'style') {
        const langAttr = el.attrs.find((a) => a.lower === 'lang');
        const lang = langAttr && typeof langAttr.value === 'string' ? langAttr.value.toLowerCase() : 'css';
        try {
          S.sheets.push({ sheet: parseCss(text, { lang: ['scss', 'sass', 'less'].includes(lang) ? lang : 'css', start: i, end: contentEnd, pos: S.pos }), kind: 'style-block', offset: i });
        } catch (e) {
          S.errors.push(`style block at ${S.lineOf(i)}: ${e.message}`);
        }
      } else {
        const type = (el.attrs.find((a) => a.lower === 'type')?.value || '').toString().toLowerCase();
        const lang = (el.attrs.find((a) => a.lower === 'lang')?.value || '').toString().toLowerCase();
        if (!type || /javascript|module|babel|jsx|typescript/.test(type)) {
          scanJs(S, i, contentEnd, { jsx: lang === 'tsx' || lang === 'jsx' || /babel|jsx/.test(type) });
        }
      }
      el.end = m ? contentEnd + m[0].length : end;
      i = el.end;
      textStart = i;
      continue;
    }
    if (!el.selfClosing && !VOID.has(lower)) stack.push(el);
    textStart = i;
  }
  flush(textStart, end);
}

function parseHtmlTag(S, i, end, parent, flavor) {
  const { text } = S;
  const m = /^[A-Za-z][\w:.-]*/.exec(text.slice(i + 1, i + 200));
  if (!m) return null;
  const tag = m[0];
  const el = newElement(S, tag, i, parent, 'html');
  let j = i + 1 + tag.length;
  for (;;) {
    while (j < end && /\s/.test(text[j])) j += 1;
    if (j >= end) return null;
    const c = text[j];
    if (c === '/' && text[j + 1] === '>') {
      el.selfClosing = true;
      j += 2;
      break;
    }
    if (c === '>') {
      j += 1;
      break;
    }
    if (c === '{') {
      // Svelte/Astro shorthand {prop} or {...spread}.
      const e = scanJs(S, j + 1, end, { jsx: false, stopAtBrace: true, el, attr: '{...}' });
      if (/^\{\s*\.\.\./.test(text.slice(j, e))) el.hasSpread = true;
      else {
        const nm = text.slice(j + 1, e - 1).trim();
        if (/^[\w$]+$/.test(nm)) pushAttr(S, el, nm, 'expr', nm, j, j + 1);
      }
      j = e;
      continue;
    }
    const am = /^[^\s=/>"'`{]+/.exec(text.slice(j, j + 300));
    if (!am) {
      j += 1;
      continue;
    }
    const name = am[0];
    const nameOff = j;
    j += name.length;
    while (j < end && /[ \t]/.test(text[j])) j += 1;
    if (text[j] !== '=') {
      pushAttr(S, el, name, 'bool', true, nameOff, null);
      continue;
    }
    j += 1;
    while (j < end && /\s/.test(text[j])) j += 1;
    const q = text[j];
    const isJsAttr = /^(?::|@|v-|on:|bind:|use:|transition:|in:|out:|animate:|class:|style:)/.test(name) || /^on[a-z]+$/.test(name);
    if (q === '"' || q === "'") {
      const e = text.indexOf(q, j + 1);
      const stop = e < 0 ? end : e;
      const value = text.slice(j + 1, stop);
      if (isJsAttr && name !== 'class:list') {
        scanJs(S, j + 1, stop, { jsx: false, el, attr: name });
        pushAttr(S, el, name, 'expr', value, nameOff, j + 1);
      } else pushAttr(S, el, name, 'string', decodeEntities(value), nameOff, j + 1);
      j = stop + 1;
    } else if (q === '{') {
      const e = scanJs(S, j + 1, end, { jsx: flavor === 'astro', stopAtBrace: true, el, attr: name });
      pushAttr(S, el, name, 'expr', text.slice(j + 1, Math.max(j + 1, e - 1)), nameOff, j + 1);
      j = e;
    } else {
      const um = /^[^\s>]+/.exec(text.slice(j, j + 500));
      const value = um ? um[0].replace(/\/$/, '') : '';
      pushAttr(S, el, name, 'string', decodeEntities(value), nameOff, j);
      j += um ? um[0].length : 1;
    }
  }
  el.end = j;
  S.elements.push(el);
  if (parent) parent.children.push(el);
  return { el, next: j };
}

// ---- MDX ----------------------------------------------------------------------------------------------

/**
 * Blank fenced code blocks (``` or ~~~, any indentation, closed by the same character at least as long; an unclosed
 * fence runs to the end, as in CommonMark), inline code, link and image destinations, and HTML comments, keeping
 * every newline and offset. Code examples and URLs in documentation are not UI copy.
 */
export function blankMarkdownCode(text) {
  const lines = String(text).split('\n');
  // YAML front matter: the fences are not content; the keys stay as metadata text (title, description).
  if (/^---\s*$/.test(lines[0] || '')) {
    const close = lines.findIndex((l, i) => i > 0 && /^(?:---|\.\.\.)\s*$/.test(l));
    if (close > 0) {
      lines[0] = ' '.repeat(lines[0].length);
      lines[close] = ' '.repeat(lines[close].length);
    }
  }
  let open = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!open) {
      const m = /^[ \t]*(`{3,}|~{3,})(.*)$/.exec(line);
      if (m && !(m[1][0] === '`' && m[2].includes('`'))) {
        open = { ch: m[1][0], len: m[1].length };
        lines[i] = ' '.repeat(line.length);
      }
      continue;
    }
    lines[i] = ' '.repeat(line.length);
    const c = /^[ \t]*(`{3,}|~{3,})[ \t\r]*$/.exec(line);
    if (c && c[1][0] === open.ch && c[1].length >= open.len) open = null;
  }
  // Reference-style link definitions ("[label]: https://…") are link targets, not text.
  for (let i = 0; i < lines.length; i += 1) if (/^[ \t]{0,3}\[[^\]\n]+\]:\s*\S+/.test(lines[i])) lines[i] = ' '.repeat(lines[i].length);
  const blank = (x) => x.replace(/[^\n]/g, ' ');
  return lines
    .join('\n')
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/``[^`\n]+``|`[^`\n]+`/g, blank)
    .replace(/(\]\s?)(\([^()\s]*(?:\s+"[^"\n]*")?\))/g, (m, a, b) => a + ' '.repeat(b.length));
}

function parseMdx(S) {
  const { text } = S;
  S.markup = true;
  S.jsx = true;
  // Blank fenced code blocks, inline code and link targets so examples in documentation are not linted as UI.
  const blanked = blankMarkdownCode(text);
  const lines = blanked.split('\n');
  // import/export lines are JS.
  let off = 0;
  const jsRanges = [];
  for (const line of lines) {
    if (/^(?:import|export)\s/.test(line)) jsRanges.push([off, off + line.length]);
    off += line.length + 1;
  }
  const S2 = S;
  const original = S.text;
  S2.text = blanked;
  for (const [a, b] of jsRanges) scanJs(S2, a, b, { jsx: true });
  // Treat the rest as JSX children of a synthetic root, with markdown text as text nodes.
  const root = newElement(S2, '#mdx', 0, null, 'jsx');
  let j = 0;
  let textStart = 0;
  const end = blanked.length;
  const inJs = (o) => jsRanges.some(([a, b]) => o >= a && o < b);
  const flush = (a, b) => {
    if (b <= a) return;
    const raw = blanked.slice(a, b);
    // One text node per line keeps markdown headings and list items apart.
    let o = a;
    for (const line of raw.split('\n')) {
      if (line.trim() && !inJs(o)) {
        const lead = line.length - line.trimStart().length;
        const p = S2.pos(o + lead);
        const v = line.trim();
        const md = /^#{1,6}\s/.test(v) ? 'heading' : /^(?:[-*+]|\d+\.)\s/.test(v) ? 'list' : /^\|.*\|$|^\|?\s*:?-{3,}:?\s*\|/.test(v) ? 'table' : 'text';
        const t = { value: decodeEntities(v.replace(/\s+/g, ' ')), offset: o + lead, line: p.line, col: p.col, el: root, kind: 'md', md };
        S2.texts.push(t);
        root.texts.push(t);
      }
      o += line.length + 1;
    }
  };
  while (j < end) {
    if (inJs(j)) {
      flush(textStart, j);
      const r = jsRanges.find(([a, b]) => j >= a && j < b);
      j = r[1];
      textStart = j;
      continue;
    }
    const c = blanked[j];
    if (c === '<' && blanked[j + 1] && (isIdStart(blanked[j + 1]) || blanked[j + 1] === '>')) {
      const r = tryJsx(S2, j, end, root);
      if (r > 0) {
        flush(textStart, j);
        j = r;
        textStart = j;
        continue;
      }
    }
    if (c === '{') {
      flush(textStart, j);
      const e = scanJs(S2, j + 1, end, { jsx: true, stopAtBrace: true, el: root, inJsxChild: true });
      j = e;
      textStart = j;
      continue;
    }
    j += 1;
  }
  flush(textStart, end);
  S2.text = original;
}

// ---- class tokens, inline styles ------------------------------------------------------------------------

const UTILITY_LIKE = /^(?:[a-z0-9@[\]&>*=_."'/#:()%,-]+:)*!?-?[a-z@[][\w[\]/.#%(),:'"!&>*=-]*!?$/;

const BARE_UTILITIES = new Set(['flex', 'grid', 'block', 'inline', 'hidden', 'relative', 'absolute', 'fixed', 'sticky', 'static', 'contents', 'truncate', 'italic', 'underline', 'uppercase', 'lowercase', 'capitalize', 'container', 'invisible', 'visible', 'grow', 'shrink', 'border', 'rounded', 'shadow', 'outline', 'ring', 'transition', 'transform', 'antialiased', 'isolate', 'peer', 'group', 'prose', 'sr-only', 'not-sr-only', 'table', 'list-none', 'overflow-hidden', 'shrink-0', 'grow-0', 'collapse', 'filter', 'blur', 'invert', 'grayscale']);

/** True when a string looks like a list of utility classes: every token is utility-shaped and most carry a utility mark. */
export function looksLikeClassList(s) {
  const v = String(s || '').trim();
  if (!v || v.length > 2000 || /[\n{};]/.test(v)) return false;
  const toks = v.split(/\s+/);
  const marked = (t) => /[-:[\]/]|\d/.test(t) || BARE_UTILITIES.has(t.replace(/^!|!$/g, ''));
  if (toks.length === 1) return /^-?[a-z][a-z0-9]*(?:-[a-z0-9.[\]#%/]+)+$/.test(toks[0]) && /\d|\[|(?:^|-)(?:xs|sm|md|lg|xl|full|none|auto|center|bold|semibold|medium|start|end|between)$/.test(toks[0]);
  let shaped = 0;
  let mark = 0;
  for (const t of toks) {
    if (UTILITY_LIKE.test(t) && !/^[A-Z]/.test(t)) shaped += 1;
    if (marked(t)) mark += 1;
  }
  return shaped === toks.length && mark / toks.length >= 0.6;
}

function pushClassTokens(S, value, offset, el, source, owner, key = null, cond = false) {
  const re = /\S+/g;
  let m;
  while ((m = re.exec(value))) {
    const tok = m[0];
    if (/^\$\{/.test(tok)) continue;
    S.classTokens.push({ value: tok, offset: offset + m.index, el, source, owner: owner || null, str: offset, key, cond });
  }
}

/** Shallow parse of a JS object literal's `key: 'value' | number` pairs (style={{...}}). */
export function parseStyleObject(src, base) {
  const out = [];
  const re = /(?:^|[{,\s])(['"]?)([A-Za-z_$-][\w$-]*)\1\s*:\s*('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`[^`$]*`|-?\d*\.?\d+(?![\w.]))/g;
  let m;
  while ((m = re.exec(src))) {
    const key = m[2];
    const rawVal = m[3];
    const isNum = /^-?\d*\.?\d+$/.test(rawVal);
    const value = isNum ? rawVal : rawVal.slice(1, -1);
    const prop = key.startsWith('--') ? key : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace(/^(webkit|moz|ms)-/, '-$1-');
    out.push({ prop, value, numeric: isNum, offset: base + m.index + m[0].indexOf(key) });
  }
  return out;
}

const UNITLESS = new Set(['opacity', 'z-index', 'flex', 'flex-grow', 'flex-shrink', 'font-weight', 'line-height', 'order', 'zoom', 'scale', 'aspect-ratio', 'column-count', 'grid-row', 'grid-column', 'animation-iteration-count', 'tab-size', 'orphans', 'widows', 'fill-opacity', 'stroke-opacity']);

function buildCode(S) {
  const chars = S.text.replace(/[^\n]/g, ' ').split('');
  for (const [a, b] of S.codeRanges) for (let i = a; i < b; i += 1) chars[i] = S.text[i];
  for (const [a, b] of S.comments) for (let i = a; i < b; i += 1) if (chars[i] !== '\n') chars[i] = ' ';
  return chars.join('');
}

function finalize(S) {
  S.code = buildCode(S);
  // Class tokens from class attributes.
  for (const el of S.elements) {
    for (const a of el.attrs) {
      if (a.lower === 'class' && a.kind === 'string') pushClassTokens(S, a.value, a.valueOffset, el, 'attr');
      else if (/^class:(?!list$)/.test(a.name)) S.classTokens.push({ value: a.name.slice(6), offset: a.offset + 6, el, source: 'directive' });
      if (a.lower === 'style' && a.kind === 'string' && typeof a.value === 'string') {
        const decls = parseDeclarations(S.text, a.valueOffset, a.valueOffset + a.value.length, S.pos);
        S.inlineStyles.push({ decls, el, offset: a.valueOffset, kind: 'attr' });
      } else if (a.lower === 'style' && a.kind === 'expr') {
        const pairs = parseStyleObject(a.value, a.valueOffset);
        const decls = pairs.map((p) => {
          const pp = S.pos(p.offset);
          const value = p.numeric && !UNITLESS.has(p.prop) && Number(p.value) !== 0 ? `${p.value}px` : p.value;
          return { prop: p.prop, value, important: false, offset: p.offset, line: pp.line, col: pp.col, valueOffset: p.offset, fromObject: true };
        });
        if (decls.length) S.inlineStyles.push({ decls, el, offset: a.valueOffset, kind: 'object' });
      }
    }
  }
  // Class tokens from strings: inside class attribute expressions, class-merging calls, or class-list-shaped strings.
  for (const s of S.strings) {
    const inClassAttr = s.attr && normAttr(s.attr) === 'class';
    const callee = s.callee ? s.callee.split('.').pop() : null;
    const classCall = callee && CLASS_CALLEES.test(callee);
    const keyIsClass = s.key && /^(?:class|className|classes|base|variants?|tw|styles?)$/i.test(s.key);
    if (inClassAttr || classCall || keyIsClass || (!s.inJsxChild && looksLikeClassList(s.value))) {
      if (s.key && !inClassAttr && /^(?:aria-|data-|title|label|alt|placeholder|href|src|id|name|type|role)$/i.test(s.key)) continue;
      s.classLike = true;
      pushClassTokens(S, s.value, s.offset, inClassAttr ? s.el : s.el && classCall ? s.el : null, inClassAttr ? 'expr' : 'string', ownerOf(S, s.offset), s.key || null, !!s.cond);
    }
  }
}

/** Name of the declaration (`const X =`, `function X`) that encloses `offset`, from a cached index. */
export function ownerOf(S, offset) {
  if (!S._decls) {
    S._decls = [];
    const re = /(?:^|[\s;(])(?:export\s+)?(?:default\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;
    const src = S.code || S.text;
    let m;
    while ((m = re.exec(src))) S._decls.push({ offset: m.index, name: m[1] });
  }
  let lo = 0;
  let hi = S._decls.length - 1;
  let best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (S._decls[mid].offset <= offset) {
      best = S._decls[mid];
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return best ? best.name : null;
}

// ---- entry points ---------------------------------------------------------------------------------------

function parseStylesheet(S, lang) {
  S.sheets.push({ sheet: parseCss(S.text, { lang, pos: S.pos }), kind: 'stylesheet', offset: 0 });
}

function parseScriptFile(S, ext) {
  const jsx = ext !== '.ts' && ext !== '.mjs' && ext !== '.cjs';
  S.jsx = jsx;
  scanJs(S, 0, S.text.length, { jsx });
}

/**
 * Parse one source file into the document model.
 * @param {string} file absolute path
 * @param {string} text file contents
 * @param {{rel?: string}} [opts]
 */
export function parseDocument(file, text, opts = {}) {
  const ext = path.extname(file).toLowerCase();
  const S = createDoc(file, text.replace(/^﻿/, ' '), ext, opts.rel);
  try {
    if (CSS_EXTS.has(ext)) parseStylesheet(S, ext.slice(1));
    else if (ext === '.html' || ext === '.htm') parseHtmlLike(S, 'html');
    else if (ext === '.vue') parseHtmlLike(S, 'vue');
    else if (ext === '.svelte') parseHtmlLike(S, 'svelte');
    else if (ext === '.astro') parseHtmlLike(S, 'astro');
    else if (ext === '.mdx') parseMdx(S);
    else if (SCRIPT_EXTS.has(ext)) parseScriptFile(S, ext);
  } catch (err) {
    S.errors.push(String((err && err.message) || err));
  }
  try {
    finalize(S);
  } catch (err) {
    S.code = S.code || '';
    S.errors.push(`finalize: ${String((err && err.message) || err)}`);
  }
  return S;
}

// ---- element helpers used by the rules ------------------------------------------------------------------

export function attr(el, name) {
  const n = normAttr(name);
  return el.attrs.find((a) => a.lower === n) || null;
}

export function attrValue(el, name) {
  const a = attr(el, name);
  if (!a) return undefined;
  if (a.kind === 'string' || a.kind === 'bool') return a.value;
  const v = String(a.value).trim();
  const m = v.match(/^(['"`])([^'"`]*)\1$/);
  if (m) return m[2];
  if (/^-?\d+(\.\d+)?$/.test(v)) return v;
  if (v === 'true' || v === 'false') return v;
  return { expr: v };
}

export function handlers(el) {
  const out = [];
  for (const a of el.attrs) {
    const ev = eventOf(a.name);
    if (ev) out.push({ event: ev, attr: a });
  }
  return out;
}

export function* ancestors(el) {
  let p = el.parent;
  while (p) {
    yield p;
    p = p.parent;
  }
}

/** All visible text inside an element (own text nodes, string children and descendants), whitespace-collapsed. */
export function elementText(S, el, limit = 600) {
  const parts = [];
  const visit = (e) => {
    for (const t of e.texts) parts.push(t.value);
    for (const c of e.children) if (parts.join(' ').length < limit) visit(c);
  };
  visit(el);
  for (const s of S.strings) if (s.inJsxChild && s.el === el && !s.classLike) parts.push(s.value);
  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}

export function classesOf(S, el) {
  return S.classTokens.filter((t) => t.el === el).map((t) => t.value);
}
