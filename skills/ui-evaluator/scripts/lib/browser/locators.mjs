// Target syntax (ARCHITECTURE §8.5) → Playwright locators.
//   role=<role>[name="…"][level=2][checked]   → getByRole (name in quotes is exact; add ` i` for case-insensitive)
//   label=…  text=…  placeholder=…  alt=…  title=…   → getByLabel / getByText / … (quoted value = exact match)
//   testid=…                                         → getByTestId
//   xpath=…  css=…                                   → locator()
//   anything else                                    → a CSS selector
// Parts can be chained with ` >> ` (each part is resolved inside the previous one).

export class TargetSyntaxError extends Error {
  constructor(message) {
    super(message);
    this.userMessage = message;
    this.isUsage = true;
  }
}

const SIMPLE_KINDS = ['label', 'text', 'placeholder', 'alt', 'title', 'testid'];
const ROLE_BOOL_OPTS = ['checked', 'disabled', 'expanded', 'pressed', 'selected', 'includeHidden'];

/** Split on `>>` that is not inside quotes or brackets. */
export function splitChain(target) {
  const parts = [];
  let cur = '';
  let quote = null;
  let depth = 0;
  for (let i = 0; i < target.length; i += 1) {
    const ch = target[i];
    if (quote) {
      cur += ch;
      if (ch === '\\' && i + 1 < target.length) {
        cur += target[i + 1];
        i += 1;
      } else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '[') depth += 1;
    else if (ch === ']') depth = Math.max(0, depth - 1);
    if (!quote && depth === 0 && ch === '>' && target[i + 1] === '>') {
      parts.push(cur.trim());
      cur = '';
      i += 1;
      continue;
    }
    cur += ch;
  }
  if (quote) throw new TargetSyntaxError(`unterminated quote in target "${target}"`);
  parts.push(cur.trim());
  if (parts.some((p) => !p)) throw new TargetSyntaxError(`empty part in chained target "${target}"`);
  return parts;
}

function unquote(raw) {
  const s = raw.trim();
  if (s.length >= 2 && (s[0] === '"' || s[0] === "'") && s.endsWith(s[0])) {
    return { value: s.slice(1, -1).replace(/\\(["'\\])/g, '$1'), quoted: true };
  }
  return { value: s, quoted: false };
}

function parseRegex(s) {
  const m = s.match(/^\/(.+)\/([a-z]*)$/);
  if (!m) return null;
  try {
    return new RegExp(m[1], m[2]);
  } catch (err) {
    throw new TargetSyntaxError(`invalid regular expression ${s}: ${err.message}`);
  }
}

/** Parse `[k="v"][k2=v][flag]` attribute lists of a role target. */
function parseRoleAttrs(rest, target) {
  const opts = {};
  let i = 0;
  while (i < rest.length) {
    if (rest[i] !== '[') throw new TargetSyntaxError(`expected "[" at "${rest.slice(i)}" in target "${target}"`);
    let j = i + 1;
    let quote = null;
    for (; j < rest.length; j += 1) {
      const ch = rest[j];
      if (quote) {
        if (ch === '\\') j += 1;
        else if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === ']') break;
    }
    if (j >= rest.length) throw new TargetSyntaxError(`missing "]" in target "${target}"`);
    const body = rest.slice(i + 1, j).trim();
    const eq = body.indexOf('=');
    if (eq < 0) {
      if (!ROLE_BOOL_OPTS.includes(body)) throw new TargetSyntaxError(`unknown role option "[${body}]" in target "${target}"`);
      opts[body] = true;
    } else {
      const key = body.slice(0, eq).trim();
      let raw = body.slice(eq + 1).trim();
      let insensitive = false;
      if (/\s+[is]$/.test(raw) && /^["']/.test(raw)) {
        insensitive = raw.endsWith('i');
        raw = raw.replace(/\s+[is]$/, '');
      }
      const { value, quoted } = unquote(raw);
      if (key === 'name') {
        const re = !quoted ? parseRegex(value) : null;
        if (re) opts.name = re;
        else {
          opts.name = value;
          opts.exact = quoted && !insensitive;
        }
      } else if (key === 'level') {
        const n = Number(value);
        if (!Number.isInteger(n)) throw new TargetSyntaxError(`level must be an integer in target "${target}"`);
        opts.level = n;
      } else if (ROLE_BOOL_OPTS.includes(key)) {
        if (!['true', 'false'].includes(value)) throw new TargetSyntaxError(`${key} must be true or false in target "${target}"`);
        opts[key] = value === 'true';
      } else if (key === 'exact') {
        opts.exact = value === 'true';
      } else {
        throw new TargetSyntaxError(`unknown role option "${key}" in target "${target}"`);
      }
    }
    i = j + 1;
  }
  return opts;
}

/**
 * Parse one target part into a descriptor.
 * @returns {{kind:string, value:string|RegExp, options?:object}}
 */
export function parseTargetPart(part, target = part) {
  const s = part.trim();
  if (!s) throw new TargetSyntaxError('empty target');
  const m = s.match(/^([a-z]+)=(.*)$/s);
  if (m) {
    const kind = m[1];
    const rest = m[2];
    if (kind === 'role') {
      const rm = rest.match(/^([a-z][a-z-]*)(.*)$/s);
      if (!rm) throw new TargetSyntaxError(`role target needs a role name, e.g. role=button[name="Save"] (got "${target}")`);
      return { kind: 'role', value: rm[1], options: parseRoleAttrs(rm[2].trim(), target) };
    }
    if (SIMPLE_KINDS.includes(kind)) {
      if (!rest.trim()) throw new TargetSyntaxError(`${kind}= needs a value (got "${target}")`);
      const { value, quoted } = unquote(rest);
      const re = !quoted ? parseRegex(value) : null;
      if (kind === 'testid') return { kind, value: re || value };
      return { kind, value: re || value, options: { exact: quoted } };
    }
    if (kind === 'css' || kind === 'xpath') {
      if (!rest.trim()) throw new TargetSyntaxError(`${kind}= needs a value (got "${target}")`);
      return { kind, value: rest.trim() };
    }
  }
  return { kind: 'css', value: s };
}

export function parseTarget(target) {
  if (typeof target !== 'string' || !target.trim()) throw new TargetSyntaxError('target must be a non-empty string');
  return splitChain(target.trim()).map((p) => parseTargetPart(p, target));
}

function applyPart(scope, d) {
  switch (d.kind) {
    case 'role':
      return scope.getByRole(d.value, d.options || {});
    case 'label':
      return scope.getByLabel(d.value, d.options || {});
    case 'text':
      return scope.getByText(d.value, d.options || {});
    case 'placeholder':
      return scope.getByPlaceholder(d.value, d.options || {});
    case 'alt':
      return scope.getByAltText(d.value, d.options || {});
    case 'title':
      return scope.getByTitle(d.value, d.options || {});
    case 'testid':
      return scope.getByTestId(d.value);
    case 'xpath':
      return scope.locator(`xpath=${d.value}`);
    default:
      return scope.locator(d.value);
  }
}

/** Build a Playwright locator for a target string, relative to a page, frame or locator. */
export function toLocator(scope, target) {
  return parseTarget(target).reduce((acc, d) => applyPart(acc, d), scope);
}

/** Human-readable description of a target, for error messages. */
export function describeTarget(target) {
  try {
    return parseTarget(target)
      .map((d) => (d.kind === 'role' ? `${d.value}${d.options?.name ? ` "${d.options.name}"` : ''}` : `${d.kind} ${d.value}`))
      .join(' › ');
  } catch {
    return String(target);
  }
}
