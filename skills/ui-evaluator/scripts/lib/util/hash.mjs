// Hashing helpers (node:crypto only).
import crypto from 'node:crypto';
import fs from 'node:fs';

export function sha1(text) {
  return crypto.createHash('sha1').update(String(text)).digest('hex');
}

export function sha256(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

export function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

/** Stable short hash for IDs (first n hex chars of sha1). */
export function shortHash(text, n = 8) {
  return sha1(text).slice(0, n);
}

/** Deterministic JSON stringify with sorted keys, for hashing structured data. */
export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}
