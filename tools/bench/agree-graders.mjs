#!/usr/bin/env node
// Agreement between two blind graders who mapped the same review to the seeded defects (grade-eval.mjs packets),
// before a third grader settles the disagreements: rate independently, then reach consensus.
//
//   node tools/bench/agree-graders.mjs <answers-a.json> <answers-b.json> [--truth <ground-truth.json>] [--out <file>]
//
// Defect level: for each seeded defect, whether each grader mapped any reported problem to it. Item level, when both
// graders mapped the same item ids (finding ids): the category each chose (a defect id, real-unseeded, not-a-problem).
// Prints percentage agreement and Krippendorff's alpha (nominal) for both, the assertion answers that differ, and
// writes the disagreements as JSON for the adjudicator.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, SKILL_DIR, parseArgs, readJson, usage, writeJson } from './lib.mjs';

const { pos, opts } = parseArgs(process.argv.slice(2));
if (pos.length !== 2) usage('usage: node tools/bench/agree-graders.mjs <answers-a.json> <answers-b.json> [--truth <ground-truth.json>] [--out <file>]', opts.help);
const [a, b] = pos.map((p) => readJson(path.resolve(p)));
const truth = readJson(path.resolve(String(opts.truth || path.join(ROOT, 'evals/fixtures/journey-app/ground-truth.json'))));
const { krippendorffAlpha } = await import(pathToFileURL(path.join(SKILL_DIR, 'scripts/lib/study/alpha.mjs')).href);

const found = (ans) => new Set((ans.mapping || []).map((m) => m.maps_to).filter((t) => truth.defects.some((d) => d.id === t)));
const fa = found(a);
const fb = found(b);
const defects = truth.defects.map((d) => ({ defect: d.id, a: fa.has(d.id), b: fb.has(d.id) }));
const defectSplit = defects.filter((d) => d.a !== d.b);
const alphaOf = (rows) => {
  const alpha = krippendorffAlpha(rows, 'nominal');
  return Number.isNaN(alpha) ? null : Math.round(alpha * 1000) / 1000;
};
const result = {
  defect_level: {
    units: defects.length,
    agreement: (defects.length - defectSplit.length) / defects.length,
    alpha_nominal: alphaOf(defects.map((d) => [Number(d.a), Number(d.b)])),
    found_by_a: fa.size,
    found_by_b: fb.size,
    disagreements: defectSplit,
  },
};

// Item level: only when the graders mapped the same items (a findings packet, not free text).
const ia = new Map((a.mapping || []).map((m) => [m.item, m]));
const ib = new Map((b.mapping || []).map((m) => [m.item, m]));
const shared = [...ia.keys()].filter((k) => ib.has(k));
if (shared.length && shared.length === ia.size && shared.length === ib.size) {
  const codes = new Map();
  const code = (v) => {
    if (!codes.has(v)) codes.set(v, codes.size);
    return codes.get(v);
  };
  const kind = (t) => (truth.defects.some((d) => d.id === t) ? 'seeded' : t);
  const split = shared.filter((k) => ia.get(k).maps_to !== ib.get(k).maps_to);
  result.item_level = {
    units: shared.length,
    agreement: (shared.length - split.length) / shared.length,
    alpha_nominal: alphaOf(shared.map((k) => [code(ia.get(k).maps_to), code(ib.get(k).maps_to)])),
    kind_agreement: shared.filter((k) => kind(ia.get(k).maps_to) === kind(ib.get(k).maps_to)).length / shared.length,
    disagreements: split.map((k) => ({ item: k, title: ia.get(k).title || ib.get(k).title, a: ia.get(k).maps_to, a_reason: ia.get(k).reason, b: ib.get(k).maps_to, b_reason: ib.get(k).reason })),
  };
} else {
  result.item_level = { units: null, note: `item lists differ (${ia.size} and ${ib.size} items, ${shared.length} shared ids): free-text extraction, compared at defect level only`, items_a: ia.size, items_b: ib.size };
}

const ansA = new Map((a.answers || []).map((x) => [x.text, x]));
result.assertions = (b.answers || []).map((x) => ({ text: x.text, a: ansA.get(x.text)?.passed ?? null, b: x.passed })).map((x) => ({ ...x, agree: x.a === x.b }));

const pct = (v) => `${Math.round(v * 100)}%`;
console.log(`defects: ${pct(result.defect_level.agreement)} agreement over ${defects.length}, alpha ${result.defect_level.alpha_nominal ?? 'undefined'}; found ${fa.size} and ${fb.size}; split: ${defectSplit.map((d) => d.defect).join(', ') || 'none'}`);
if (result.item_level.units) console.log(`items: ${pct(result.item_level.agreement)} agreement over ${result.item_level.units}, alpha ${result.item_level.alpha_nominal ?? 'undefined'}; kind agreement ${pct(result.item_level.kind_agreement)}; split: ${result.item_level.disagreements.length}`);
else console.log(`items: ${result.item_level.note}`);
for (const x of result.assertions) console.log(`assertion ${x.agree ? 'agree' : 'SPLIT'}: ${x.text} (a ${x.a}, b ${x.b})`);
if (opts.out) writeJson(path.resolve(String(opts.out)), result);
