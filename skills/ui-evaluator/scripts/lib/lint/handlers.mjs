// Event-handler analysis on the comment-free code view of a document: resolve a handler expression to the body
// the rule can read (inline arrow functions, local functions and useCallback wrappers), and list
// addEventListener calls with their target and handler. Imported handlers resolve to null: rules that need a
// body then stay silent rather than guess.

/** Index after the bracket that matches the one at `open` ('(' '{' '['), skipping strings; -1 if unbalanced. */
export function matchBracket(code, open) {
  const pairs = { '(': ')', '{': '}', '[': ']' };
  const stack = [pairs[code[open]]];
  for (let i = open + 1; i < code.length; i += 1) {
    const c = code[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i += 1;
      while (i < code.length && code[i] !== q) {
        if (code[i] === '\\') i += 1;
        i += 1;
      }
      continue;
    }
    if (pairs[c]) stack.push(pairs[c]);
    else if (c === ')' || c === '}' || c === ']') {
      if (stack[stack.length - 1] !== c) return -1;
      stack.pop();
      if (!stack.length) return i + 1;
    }
  }
  return -1;
}

/** Split a call's argument list (text between the parentheses) at top-level commas. */
export function splitArgs(text) {
  const out = [];
  let depth = 0;
  let cur = '';
  let q = null;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (q) {
      cur += c;
      if (c === '\\') {
        cur += text[i + 1] ?? '';
        i += 1;
      } else if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      q = c;
      cur += c;
      continue;
    }
    if (c === '(' || c === '{' || c === '[') depth += 1;
    else if (c === ')' || c === '}' || c === ']') depth -= 1;
    if (c === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const fnCache = new WeakMap();

/** Body text of a function defined in this document under `name` (function decl, const arrow, useCallback), or null. */
export function functionBody(doc, name) {
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) return null;
  let cache = fnCache.get(doc);
  if (!cache) {
    cache = new Map();
    fnCache.set(doc, cache);
  }
  if (cache.has(name)) return cache.get(name);
  const code = doc.code;
  const id = name.replace(/\$/g, '\\$'); // `$` is an identifier character and a regex anchor
  const res = [
    new RegExp(`function\\s+${id}\\s*\\(`, 'g'),
    new RegExp(`(?:const|let|var)\\s+${id}\\s*(?::[^=]{1,200})?=\\s*(?:useCallback\\s*\\(\\s*)?(?:async\\s*)?(?:function\\s*\\w*\\s*)?\\(`, 'g'),
    new RegExp(`(?:const|let|var)\\s+${id}\\s*=\\s*(?:async\\s*)?[A-Za-z_$][\\w$]*\\s*=>`, 'g'),
    new RegExp(`(?:^|[\\s;{,])${id}\\s*\\([^)]*\\)\\s*\\{`, 'g'),
  ];
  let body = null;
  for (const re of res) {
    const m = re.exec(code);
    if (!m) continue;
    // From the match, find the parameter list end, then either `{ body }` or an expression body.
    let i = m.index + m[0].length - 1;
    if (code[i] === '(') {
      const close = matchBracket(code, i);
      if (close < 0) continue;
      i = close;
    }
    while (i < code.length && /[\s:=>\w<>[\],|.?]/.test(code[i]) && code[i] !== '{') {
      if (code[i] === '=' && code[i + 1] === '>') {
        i += 2;
        while (/\s/.test(code[i] || '')) i += 1;
        break;
      }
      i += 1;
    }
    if (code[i] === '{') {
      const end = matchBracket(code, i);
      if (end > 0) body = code.slice(i, end);
    } else {
      const semi = code.indexOf(';', i);
      const nl = code.indexOf('\n', i);
      const stop = [semi, nl].filter((x) => x > 0).sort((a, b) => a - b)[0] ?? code.length;
      body = code.slice(i, stop);
    }
    if (body) break;
  }
  cache.set(name, body);
  return body;
}

/**
 * Resolve a handler expression (JSX attribute value, Vue/Svelte directive value) to readable code.
 * @returns {{ body: string, name: string|null, inline: boolean } | null}
 */
export function resolveHandler(doc, expr) {
  const e = String(expr || '').trim();
  if (!e) return null;
  if (/=>|^function\b|^async\b/.test(e)) return { body: e, name: null, inline: true };
  const id = e.match(/^(?:this\.|props\.)?([A-Za-z_$][\w$]*)$/);
  if (id) {
    const body = functionBody(doc, id[1]);
    return body ? { body, name: id[1], inline: false } : { body: null, name: id[1], inline: false };
  }
  // Calls such as handle(e) or a Vue statement: the expression itself is what runs.
  const call = e.match(/^([A-Za-z_$][\w$.]*)\s*\(/);
  if (call) {
    const body = functionBody(doc, call[1].split('.').pop());
    return { body: body ? `${e}\n${body}` : e, name: call[1], inline: true };
  }
  return { body: e, name: null, inline: true };
}

/**
 * addEventListener calls in the code view: [{ target, event, handler, options, offset, body }].
 * `target` is the receiver text (window, document, el, ref.current …).
 */
export function listenerCalls(doc, events) {
  const out = [];
  const code = doc.code;
  const re = /([A-Za-z_$][\w$.?]*(?:\([^()]*\))?(?:\.current)?)\s*\.\s*addEventListener\s*\(/g;
  let m;
  while ((m = re.exec(code))) {
    const open = m.index + m[0].length - 1;
    const close = matchBracket(code, open);
    if (close < 0) continue;
    const args = splitArgs(code.slice(open + 1, close - 1));
    const ev = (args[0] || '').match(/^(['"`])([\w-]+)\1$/);
    if (!ev) continue;
    const event = ev[2].toLowerCase();
    if (events && !events.includes(event)) continue;
    const handler = args[1] || '';
    const resolved = resolveHandler(doc, handler);
    out.push({ target: m[1].replace(/\?/g, ''), event, handler, options: args[2] || '', offset: m.index, body: resolved?.body ?? null, name: resolved?.name ?? null });
  }
  // on<event> property assignments: window.onkeydown = …
  const re2 = /([A-Za-z_$][\w$.]*)\s*\.\s*on([a-z]+)\s*=(?!=)\s*/g;
  while ((m = re2.exec(code))) {
    const event = m[2];
    if (events && !events.includes(event)) continue;
    const start = m.index + m[0].length;
    const stop = code.indexOf(';', start);
    const handler = code.slice(start, stop < 0 ? Math.min(code.length, start + 400) : stop);
    const resolved = resolveHandler(doc, handler);
    out.push({ target: m[1], event, handler, options: '', offset: m.index, body: resolved?.body ?? null, name: resolved?.name ?? null });
  }
  return out;
}

export function isGlobalTarget(target) {
  return /^(?:window|document|document\.body|document\.documentElement|globalThis|self|top|body)$/.test(String(target).replace(/\s+/g, ''));
}
