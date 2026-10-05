// Minimal, dependency-free argument parser.
// Supports: --flag, --flag=value, --flag value, -h, repeated flags (collected into arrays
// when declared as `multi`), and `--` to end option parsing.

export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.userMessage = message;
    this.isUsage = true;
  }
}

/**
 * @param {string[]} argv
 * @param {{ boolean?: string[], multi?: string[], alias?: Record<string,string> }} spec
 * @returns {{ _: string[], [k: string]: any }}
 */
export function parseArgs(argv, spec = {}) {
  const booleans = new Set(spec.boolean || []);
  const multi = new Set(spec.multi || []);
  const alias = spec.alias || {};
  const out = { _: [] };
  let i = 0;
  const set = (key, value) => {
    const k = alias[key] || key;
    if (multi.has(k)) {
      if (!Array.isArray(out[k])) out[k] = [];
      if (Array.isArray(value)) out[k].push(...value);
      else out[k].push(value);
    } else {
      out[k] = value;
    }
  };
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--') {
      out._.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      const rawKey = eq >= 0 ? a.slice(2, eq) : a.slice(2);
      const key = alias[rawKey] || rawKey;
      if (key.startsWith('no-') && booleans.has(key.slice(3))) {
        set(key.slice(3), false);
        i += 1;
        continue;
      }
      if (eq >= 0) {
        set(key, coerce(a.slice(eq + 1), booleans.has(key)));
        i += 1;
        continue;
      }
      if (booleans.has(key)) {
        set(key, true);
        i += 1;
        continue;
      }
      const next = argv[i + 1];
      if (next === undefined || (next.startsWith('--') && next.length > 2)) {
        set(key, true);
        i += 1;
      } else {
        set(key, next);
        i += 2;
      }
      continue;
    }
    if (a.length === 2 && a[0] === '-' && a[1] !== '-') {
      const key = alias[a[1]] || a[1];
      set(key, true);
      i += 1;
      continue;
    }
    out._.push(a);
    i += 1;
  }
  return out;
}

function coerce(value, isBoolean) {
  if (!isBoolean) return value;
  if (value === 'false' || value === '0' || value === 'no') return false;
  return true;
}

/** Split comma-separated values (and arrays of them) into a flat list of trimmed strings. */
export function list(value) {
  if (value === undefined || value === null || value === true) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr
    .flatMap((v) => String(v).split(','))
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Parse an integer option with bounds; throws UsageError on bad input. */
export function intOpt(value, name, { min = -Infinity, max = Infinity, fallback } = {}) {
  if (value === undefined || value === null || value === true) {
    if (fallback !== undefined) return fallback;
    throw new UsageError(`--${name} needs a number`);
  }
  const n = Number(value);
  if (!Number.isFinite(n) || Math.trunc(n) !== n) throw new UsageError(`--${name} must be an integer, got "${value}"`);
  if (n < min || n > max) throw new UsageError(`--${name} must be between ${min} and ${max}`);
  return n;
}

/** Parse a float option. */
export function numOpt(value, name, { min = -Infinity, max = Infinity, fallback } = {}) {
  if (value === undefined || value === null || value === true) {
    if (fallback !== undefined) return fallback;
    throw new UsageError(`--${name} needs a number`);
  }
  const n = Number(value);
  if (!Number.isFinite(n)) throw new UsageError(`--${name} must be a number, got "${value}"`);
  if (n < min || n > max) throw new UsageError(`--${name} must be between ${min} and ${max}`);
  return n;
}
