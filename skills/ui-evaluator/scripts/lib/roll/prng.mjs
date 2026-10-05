// Seeded pseudo-random numbers (mulberry32) so that every roll is reproducible from its recorded seed.
import { sha1 } from '../util/hash.mjs';

export function seedToInt(seed) {
  return parseInt(sha1(String(seed)).slice(0, 8), 16) >>> 0;
}

export function mulberry32(a) {
  let t = a >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function rng(seed) {
  return mulberry32(seedToInt(seed));
}

/** Weighted choice; items: [{ value, weight }]. */
export function weightedPick(next, items) {
  const total = items.reduce((a, b) => a + (b.weight ?? 1), 0);
  if (!(total > 0)) return null;
  let u = next() * total;
  for (const it of items) {
    u -= it.weight ?? 1;
    if (u < 0) return it.value;
  }
  return items[items.length - 1].value;
}
