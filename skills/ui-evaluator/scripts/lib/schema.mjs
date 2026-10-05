// A small JSON Schema validator covering the subset used by UI-Evaluator's schemas:
// type, enum, const, required, properties, additionalProperties, patternProperties,
// items, minItems, maxItems, uniqueItems, minimum, maximum, exclusiveMinimum, exclusiveMaximum,
// minLength, maxLength, pattern, format (date-time, uri-reference: light checks),
// oneOf, anyOf, allOf, not, if/then/else, $ref to "#/$defs/..." within the same document, $defs.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, exists } from './util/fs.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMA_DIR = path.resolve(HERE, '../../assets/schemas');

const cache = new Map();

/** Load a schema by short name (e.g. "finding") or file name. */
export function loadSchema(name) {
  const file = name.endsWith('.json') ? name : `${name}.schema.json`;
  const full = path.join(SCHEMA_DIR, file);
  if (cache.has(full)) return cache.get(full);
  if (!exists(full)) {
    const e = new Error(`unknown schema "${name}" (looked for ${full})`);
    e.userMessage = e.message;
    throw e;
  }
  const schema = readJson(full);
  cache.set(full, schema);
  return schema;
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

function matchesType(v, t) {
  const actual = typeOf(v);
  if (t === 'number') return actual === 'number' || actual === 'integer';
  return actual === t;
}

function resolveRef(ref, root) {
  if (!ref.startsWith('#/')) throw new Error(`only local $ref supported, got ${ref}`);
  return ref
    .slice(2)
    .split('/')
    .map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((node, key) => (node ? node[key] : undefined), root);
}

const DATE_TIME = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Validate `data` against `schema`.
 * @returns {{ valid: boolean, errors: { path: string, message: string }[] }}
 */
export function validate(schema, data, opts = {}) {
  const root = opts.root || schema;
  const errors = [];
  const maxErrors = opts.maxErrors || 50;
  visit(schema, data, '$');
  return { valid: errors.length === 0, errors };

  function err(p, message) {
    if (errors.length < maxErrors) errors.push({ path: p, message });
  }

  function visit(s, v, p) {
    if (s === true || s === undefined) return;
    if (s === false) {
      err(p, 'no value allowed here');
      return;
    }
    if (s.$ref) {
      const target = resolveRef(s.$ref, root);
      if (!target) {
        err(p, `unresolved $ref ${s.$ref}`);
        return;
      }
      visit(target, v, p);
    }
    if (s.type) {
      const types = Array.isArray(s.type) ? s.type : [s.type];
      if (!types.some((t) => matchesType(v, t))) {
        err(p, `expected ${types.join(' or ')}, got ${typeOf(v)}`);
        return;
      }
    }
    if (s.const !== undefined && !deepEqual(s.const, v)) err(p, `must equal ${JSON.stringify(s.const)}`);
    if (s.enum && !s.enum.some((e) => deepEqual(e, v))) {
      err(p, `must be one of ${s.enum.map((e) => JSON.stringify(e)).join(', ')}; got ${JSON.stringify(v)}`);
    }
    const t = typeOf(v);
    if (t === 'string') {
      if (s.minLength !== undefined && [...v].length < s.minLength) err(p, `must be at least ${s.minLength} characters`);
      if (s.maxLength !== undefined && [...v].length > s.maxLength) err(p, `must be at most ${s.maxLength} characters`);
      if (s.pattern && !new RegExp(s.pattern, 'u').test(v)) err(p, `must match /${s.pattern}/`);
      if (s.format === 'date-time' && !DATE_TIME.test(v)) err(p, 'must be an ISO date or date-time');
    }
    if (t === 'number' || t === 'integer') {
      if (s.minimum !== undefined && v < s.minimum) err(p, `must be ≥ ${s.minimum}`);
      if (s.maximum !== undefined && v > s.maximum) err(p, `must be ≤ ${s.maximum}`);
      if (s.exclusiveMinimum !== undefined && v <= s.exclusiveMinimum) err(p, `must be > ${s.exclusiveMinimum}`);
      if (s.exclusiveMaximum !== undefined && v >= s.exclusiveMaximum) err(p, `must be < ${s.exclusiveMaximum}`);
    }
    if (t === 'array') {
      if (s.minItems !== undefined && v.length < s.minItems) err(p, `must have at least ${s.minItems} items`);
      if (s.maxItems !== undefined && v.length > s.maxItems) err(p, `must have at most ${s.maxItems} items`);
      if (s.uniqueItems) {
        const seen = new Set();
        v.forEach((item, i) => {
          const k = JSON.stringify(item);
          if (seen.has(k)) err(`${p}[${i}]`, 'duplicate item');
          seen.add(k);
        });
      }
      if (s.items) v.forEach((item, i) => visit(s.items, item, `${p}[${i}]`));
    }
    if (t === 'object') {
      const props = s.properties || {};
      for (const req of s.required || []) {
        if (!(req in v)) err(p, `missing required property "${req}"`);
      }
      for (const [k, val] of Object.entries(v)) {
        if (props[k] !== undefined) {
          visit(props[k], val, `${p}.${k}`);
          continue;
        }
        let matched = false;
        if (s.patternProperties) {
          for (const [pat, ps] of Object.entries(s.patternProperties)) {
            if (new RegExp(pat, 'u').test(k)) {
              matched = true;
              visit(ps, val, `${p}.${k}`);
            }
          }
        }
        if (!matched && s.additionalProperties !== undefined) {
          if (s.additionalProperties === false) err(`${p}.${k}`, 'unknown property');
          else if (typeof s.additionalProperties === 'object') visit(s.additionalProperties, val, `${p}.${k}`);
        }
      }
    }
    if (s.allOf) s.allOf.forEach((sub) => visit(sub, v, p));
    if (s.anyOf) {
      const ok = s.anyOf.some((sub) => validate(sub, v, { root }).valid);
      if (!ok) err(p, 'does not match any allowed shape (anyOf)');
    }
    if (s.oneOf) {
      const n = s.oneOf.filter((sub) => validate(sub, v, { root }).valid).length;
      if (n !== 1) err(p, n === 0 ? 'does not match any allowed shape (oneOf)' : 'matches more than one shape (oneOf)');
    }
    if (s.not && validate(s.not, v, { root }).valid) err(p, 'matches a forbidden shape (not)');
    if (s.if) {
      const cond = validate(s.if, v, { root }).valid;
      if (cond && s.then) visit(s.then, v, p);
      if (!cond && s.else) visit(s.else, v, p);
    }
  }
}

/** Validate against a named schema and throw a readable error if invalid. */
export function assertValid(name, data, label = name) {
  const schema = loadSchema(name);
  const res = validate(schema, data);
  if (!res.valid) {
    const lines = res.errors.slice(0, 12).map((e) => `  ${e.path}: ${e.message}`);
    const e = new Error(`${label} does not match the ${name} schema:\n${lines.join('\n')}`);
    e.userMessage = e.message;
    e.validation = res.errors;
    throw e;
  }
  return data;
}

/** Guess which schema a JSON document follows, from its shape, for `uie findings validate`. */
export function guessSchema(doc, file = '') {
  const base = path.basename(file);
  if (base.endsWith('verdict.json')) return 'critic-verdict';
  if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
    if (doc.schema && typeof doc.schema === 'string') return doc.schema;
    if (Array.isArray(doc.verdicts)) return 'verifier';
    if (Array.isArray(doc.ratings)) return 'rating';
    if (doc.disposition && Array.isArray(doc.items)) return 'fix-review';
    if (doc.tests && doc.verdict) return 'panel';
    if (Array.isArray(doc.steps) && doc.persona && doc.journey) return 'cw-record';
    if (Array.isArray(doc.candidates) && doc.role) return 'evaluator-output';
    if (Array.isArray(doc.candidates) && doc.brief !== undefined) return 'candidates';
    if (doc.gates && doc.achieved !== undefined) return 'gates';
    if (doc.fingerprint && doc.criteria) return 'finding';
    if (Array.isArray(doc.entries) && doc.version !== undefined) return 'ledger';
    if (doc.success && Array.isArray(doc.steps)) return 'journey';
    if (doc.app && doc.scope) return 'config';
    if (doc.run && doc.created_at && doc.scope) return 'manifest';
  }
  return null;
}
