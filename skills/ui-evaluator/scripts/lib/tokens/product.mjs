// PRODUCT.md checks (DEC-01) and extraction of surfaces, facts and target level.
import { sections, stripComments, tables, placeholders } from '../util/markdown.mjs';

export const PRODUCT_SECTIONS = [
  'Product summary', 'Users and groups', 'Top tasks', 'Context of use', 'Positioning', 'Constraints',
  'Brand commitments', 'Facts', 'Principles', 'Accessibility needs', 'Platforms and locales',
  'Target assurance level', 'Surfaces',
];

const norm = (s) => s.toLowerCase().replace(/[^a-z]+/g, ' ').trim();

export function productSections(text) {
  const map = new Map();
  for (const s of sections(text, 2)) map.set(norm(s.title), s);
  return map;
}

/** DEC-01: every required section present with real content; inferred facts labelled; no template placeholders. */
export function checkProduct(text) {
  const map = productSections(text);
  const missing = [];
  const empty = [];
  for (const name of PRODUCT_SECTIONS) {
    const s = map.get(norm(name));
    if (!s) {
      missing.push(name);
      continue;
    }
    const body = stripComments(s.content).trim();
    if (!body || /^\[[^\]]*\]$/.test(body)) empty.push(name);
  }
  const ph = placeholders(text);
  const unlabeled = [];
  for (const name of ['Product summary', 'Users and groups', 'Facts', 'Surfaces']) {
    const s = map.get(norm(name));
    if (!s) continue;
    const body = stripComments(s.content);
    if (body.trim() && !/\[(confirmed|inferred)[:\]]/i.test(body)) unlabeled.push(name);
  }
  const problems = [
    ...missing.map((m) => `missing section "${m}"`),
    ...empty.map((m) => `empty section "${m}"`),
    ...(ph.length ? [`${ph.length} template placeholder(s) remain, e.g. ${ph[0]}`] : []),
    ...unlabeled.map((m) => `facts in "${m}" carry no [confirmed: …] or [inferred: …] labels`),
  ];
  return { ok: problems.length === 0, missing: problems, sections: [...map.keys()] };
}

/** Surfaces table → [{ id, routes, job, mode }]. */
export function productSurfaces(text) {
  const s = productSections(text).get('surfaces');
  if (!s) return [];
  const t = tables(stripComments(s.content))[0];
  if (!t) return [];
  const h = t.header.map((x) => x.toLowerCase());
  const col = (re) => h.findIndex((x) => re.test(x));
  const ci = { id: col(/surface/), routes: col(/route/), job: col(/job/), mode: col(/mode/) };
  return t.rows.map((r) => ({
    id: r[ci.id] || '',
    routes: (r[ci.routes] || '').split(/[,;]\s*/).filter(Boolean),
    job: r[ci.job] || '',
    mode: (r[ci.mode] || '').toLowerCase().trim(),
  }));
}

/** Facts table → [{ claim, wording, source, label }] plus explicit absences. */
export function productFacts(text) {
  const s = productSections(text).get('facts');
  if (!s) return { facts: [], absences: [] };
  const body = stripComments(s.content);
  const t = tables(body)[0];
  const facts = t
    ? t.rows.map((r) => ({ claim: r[0] || '', wording: (r[1] || '').replace(/^"|"$/g, ''), source: r[2] || '', label: r[3] || '' }))
    : [];
  const absences = body
    .split(/\r?\n/)
    .filter((l) => /^\s*[-*]\s+/.test(l) && /\bno\b|没有|无/i.test(l))
    .map((l) => l.replace(/^\s*[-*]\s+/, '').trim());
  return { facts, absences };
}

export function productTargetLevel(text) {
  const s = productSections(text).get('target assurance level');
  const m = s && stripComments(s.content).match(/\bL([1-4])\b/);
  return m ? `L${m[1]}` : null;
}

export function productLocales(text) {
  const s = productSections(text).get('platforms and locales');
  if (!s) return [];
  return [...new Set((stripComments(s.content).match(/\b[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2})\b/g) || []))];
}
