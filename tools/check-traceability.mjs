#!/usr/bin/env node
// Every research adopt item has a disposition in docs/framework/TRACEABILITY.md (implemented, partial, rejected or
// deferred), and every implemented or partial item names where. `--draft` prints a starting table from citations.
//
//   node tools/check-traceability.mjs            check; exit 1 on gaps
//   node tools/check-traceability.mjs --draft    write docs/framework/traceability-draft.json (citations per ID)
//   node tools/check-traceability.mjs --write    (re)write the TRACEABILITY.md rows, keeping existing dispositions
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH = path.join(ROOT, 'docs/research');
const TRACE = path.join(ROOT, 'docs/framework/TRACEABILITY.md');
const PREFIXES = ['IMP', 'DSL', 'LOOP', 'EVAL', 'PLAT', 'HCI', 'CRAFT', 'TOOL', 'PKG', 'PROC'];
const DISPOSITIONS = new Set(['implemented', 'partial', 'rejected', 'deferred']);
const ID_RE = new RegExp(`\\b(${PREFIXES.join('|')})-(\\d{2,3})((?:/\\d{2,3})*)\\b`, 'g');

/** Adopt items: { id, note, practice } from the adopt tables at the end of each research note. */
export function adoptItems() {
  const items = [];
  for (const f of fs.readdirSync(RESEARCH).filter((n) => /^\d\d-.*\.md$/.test(n)).sort()) {
    const text = fs.readFileSync(path.join(RESEARCH, f), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(new RegExp(`^\\|\\s*((?:${PREFIXES.join('|')})-\\d{2,3})\\s*\\|\\s*(.+?)\\s*\\|`));
      if (m) items.push({ id: m[1], note: f.slice(0, 2), practice: m[2].replace(/\*\*/g, '').slice(0, 140) });
    }
  }
  const seen = new Set();
  return items.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
}

/** Expand "HCI-037/039/040" into three IDs. */
function idsIn(text) {
  const out = new Set();
  for (const m of text.matchAll(ID_RE)) {
    out.add(`${m[1]}-${m[2]}`);
    for (const extra of (m[3] || '').split('/').filter(Boolean)) out.add(`${m[1]}-${extra.padStart(m[2].length, '0')}`);
  }
  return out;
}

function walk(dir, exts, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, exts, acc);
    else if (exts.has(path.extname(ent.name))) acc.push(p);
  }
  return acc;
}

/** ID → files that cite it (skill content, framework docs other than TRACEABILITY, tools). */
export function citations() {
  const files = [
    ...walk(path.join(ROOT, 'skills/ui-evaluator'), new Set(['.md', '.mjs', '.json'])),
    ...walk(path.join(ROOT, 'docs/framework'), new Set(['.md'])).filter((f) => !/TRACEABILITY/.test(f)),
    ...walk(path.join(ROOT, 'commands'), new Set(['.md'])),
    ...walk(path.join(ROOT, 'agents'), new Set(['.md'])),
  ];
  const map = new Map();
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    for (const id of idsIn(fs.readFileSync(f, 'utf8'))) {
      if (!map.has(id)) map.set(id, new Set());
      map.get(id).add(rel);
    }
  }
  return map;
}

/** Parse TRACEABILITY.md rows: | ID | practice | disposition | where or reason | */
export function parseTrace(text) {
  const rows = new Map();
  const dupes = [];
  for (const line of text.split('\n')) {
    const m = line.match(new RegExp(`^\\|\\s*((?:${PREFIXES.join('|')})-\\d{2,3})\\s*\\|([^|]*)\\|\\s*([a-z_]+)\\s*\\|(.*)\\|\\s*$`));
    if (!m) continue;
    if (rows.has(m[1])) dupes.push(m[1]);
    rows.set(m[1], { practice: m[2].trim(), disposition: m[3].trim(), where: m[4].trim() });
  }
  return { rows, dupes };
}

/** Criterion IDs (QUALITY-BAR rows) whose sources column cites each adopt ID. */
function criteriaCiting() {
  const qb = fs.readFileSync(path.join(ROOT, 'docs/framework/QUALITY-BAR.md'), 'utf8');
  const map = new Map();
  for (const line of qb.split('\n')) {
    const m = line.match(/^\|\s*([A-Z0-9]{2,5}-\d{2})\s*\|/);
    if (!m) continue;
    for (const id of idsIn(line)) {
      if (!map.has(id)) map.set(id, new Set());
      map.get(id).add(m[1]);
    }
  }
  return map;
}

const NOTE_TITLES = {
  '01': 'Impeccable and Anthropic frontend-design (IMP)',
  '02': 'Design-skill landscape (DSL)',
  '03': 'Fix loops and review pipelines (LOOP)',
  '04': 'Evaluation skills, research prototypes and feedback intake (EVAL)',
  '05': 'Platform design systems and CJK (PLAT)',
  '06': 'HCI evaluation methodology (HCI)',
  '07': 'Anti-slop and visual craft (CRAFT)',
  '08': 'Accessibility and verification tooling (TOOL)',
  '09': 'Agent Skills packaging (PKG)',
  '10': 'Design-process frameworks (PROC)',
};

/** Where an item lives, most specific first: criteria, then skill files, then framework sections. */
function whereOf(files, crits) {
  const short = (f) => f.replace(/^skills\/ui-evaluator\//, '').replace(/^docs\/framework\//, '');
  const rank = (f) => (/references\/(knowledge|methods|workflows|evaluators)\//.test(f) ? 0 : /scripts\//.test(f) ? 1 : /SKILL\.md|templates\//.test(f) ? 2 : /QUALITY-BAR|FRAMEWORK|METHODS|ARCHITECTURE/.test(f) ? 3 : 4);
  const sorted = [...files].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).map(short);
  return [...[...crits].sort().slice(0, 4), ...sorted.slice(0, 3)].join(', ');
}

/** Write TRACEABILITY.md, keeping every row a person already dispositioned. */
function writeTrace(items) {
  const cites = citations();
  const crits = criteriaCiting();
  const existing = fs.existsSync(TRACE) ? parseTrace(fs.readFileSync(TRACE, 'utf8')).rows : new Map();
  const head = fs.existsSync(TRACE) ? fs.readFileSync(TRACE, 'utf8').split('\n<!-- rows -->')[0] : '';
  const lines = [head || '# Traceability', '<!-- rows -->', ''];
  let note = null;
  for (const it of items) {
    if (it.note !== note) {
      note = it.note;
      lines.push('', `## ${it.note} · ${NOTE_TITLES[it.note] || ''}`, '', '| ID | Practice | Disposition | Where (criteria, files) or reason |', '|---|---|---|---|');
    }
    const prev = existing.get(it.id);
    const files = [...(cites.get(it.id) || [])];
    const c = crits.get(it.id) || new Set();
    const inSkill = files.some((f) => f.startsWith('skills/'));
    const disposition = prev && DISPOSITIONS.has(prev.disposition) ? prev.disposition : inSkill || c.size ? 'implemented' : 'todo';
    const where = prev && DISPOSITIONS.has(prev.disposition) ? prev.where : whereOf(files, c) || '';
    const practice = it.practice.replace(/\|/g, '/').replace(/\s+/g, ' ').slice(0, 110);
    lines.push(`| ${it.id} | ${practice}${it.practice.length > 110 ? '…' : ''} | ${disposition} | ${where.replace(/\|/g, '/')} |`);
  }
  fs.writeFileSync(TRACE, `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`);
  const todo = lines.filter((l) => /\| todo \|/.test(l)).length;
  console.log(`wrote ${path.relative(ROOT, TRACE)}: ${items.length} rows, ${todo} still "todo"`);
}

function main() {
  const items = adoptItems();
  if (process.argv.includes('--write')) {
    writeTrace(items);
    return 0;
  }
  if (process.argv.includes('--draft')) {
    const cites = citations();
    const draft = items.map((it) => {
      const files = [...(cites.get(it.id) || [])].sort();
      const inSkill = files.filter((f) => f.startsWith('skills/'));
      return { ...it, cited_in: files, guess: inSkill.length ? 'implemented' : files.length ? 'partial' : 'unmapped' };
    });
    const out = path.join(ROOT, 'docs/framework/traceability-draft.json');
    fs.writeFileSync(out, `${JSON.stringify(draft, null, 1)}\n`);
    const counts = draft.reduce((a, d) => ({ ...a, [d.guess]: (a[d.guess] || 0) + 1 }), {});
    console.log(`${items.length} adopt items; ${JSON.stringify(counts)}; wrote ${path.relative(ROOT, out)}`);
    return 0;
  }
  if (!fs.existsSync(TRACE)) {
    console.error('docs/framework/TRACEABILITY.md is missing');
    return 1;
  }
  const { rows, dupes } = parseTrace(fs.readFileSync(TRACE, 'utf8'));
  const problems = [];
  for (const d of dupes) problems.push(`${d}: listed more than once`);
  for (const it of items) {
    const r = rows.get(it.id);
    if (!r) {
      problems.push(`${it.id}: no row`);
      continue;
    }
    if (!DISPOSITIONS.has(r.disposition)) problems.push(`${it.id}: disposition "${r.disposition}" is not implemented, partial, rejected or deferred`);
    else if ((r.disposition === 'implemented' || r.disposition === 'partial') && !/[\w-]+\.(md|mjs|json)|\b[A-Z0-9]{2,5}-\d{2}\b|§/.test(r.where)) problems.push(`${it.id}: ${r.disposition} but names no file, criterion or section`);
    else if ((r.disposition === 'rejected' || r.disposition === 'deferred') && r.where.length < 12) problems.push(`${it.id}: ${r.disposition} without a reason`);
  }
  const known = new Set(items.map((i) => i.id));
  for (const id of rows.keys()) if (!known.has(id)) problems.push(`${id}: not an adopt ID in docs/research`);
  const counts = [...rows.values()].reduce((a, r) => ({ ...a, [r.disposition]: (a[r.disposition] || 0) + 1 }), {});
  if (problems.length) {
    console.error(`${problems.length} traceability problem(s):`);
    for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
    if (problems.length > 40) console.error(`  … ${problems.length - 40} more`);
    return 1;
  }
  console.log(`traceability: ${items.length} adopt items, all dispositioned (${Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(', ')})`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exitCode = main();
