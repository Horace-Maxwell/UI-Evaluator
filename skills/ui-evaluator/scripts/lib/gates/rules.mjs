// Loading rule and reference data from assets/data.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, exists } from '../util/fs.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.resolve(HERE, '../../../assets/data');

const cache = new Map();
export function loadData(name, fallback) {
  const p = path.join(DATA_DIR, name.endsWith('.json') ? name : `${name}.json`);
  if (cache.has(p)) return cache.get(p);
  if (!exists(p)) {
    if (fallback !== undefined) return fallback;
    const e = new Error(`missing data file ${p}`);
    e.userMessage = e.message;
    throw e;
  }
  const d = readJson(p);
  cache.set(p, d);
  return d;
}

/** Map of criterion ID → rule definition (from QUALITY-BAR via tools/build-rules.mjs). */
export function loadRules() {
  return loadData('rules', { rules: {} }).rules || {};
}

/** Map of tell ID → tell definition (anti-slop catalogue). */
export function loadTells() {
  return loadData('tells', { tells: {} }).tells || {};
}

export const GATES = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'];
export const GATE_NAMES = {
  G0: 'Evidence integrity',
  G1: 'Functional integrity',
  G2: 'Accessibility (WCAG 2.2 AA)',
  G3: 'Craft floor',
  G4: 'Deliberateness and anti-slop',
  G5: 'Analytical usability',
  G6: 'Design quality',
  G7: 'Empirical validation',
};
