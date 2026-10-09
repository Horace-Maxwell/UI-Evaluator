// Finding identity, severity, priority, lifecycle and rating aggregation (FRAMEWORK §4.3–4.5; ADR-029, ADR-030).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../../skills/ui-evaluator/scripts/lib/findings/core.mjs';
import { aggregateWithValidity } from '../../skills/ui-evaluator/scripts/lib/findings/register.mjs';
import { mergeRun } from '../../skills/ui-evaluator/scripts/lib/findings/merge.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const judged = (over = {}) => ({
  title: 'Fee is not shown until the payment step',
  problem_type: 'single_location',
  criteria: [{ kind: 'heuristic', id: 'H1', primary: true }],
  locations: [{ route: '/book/items', state: 'default', selector: 'main  .item-summary', snippet: '<div class="item-summary">' }],
  found_by: [{ role: 'heuristic-evaluator', method: 'HE' }],
  ...over,
});

test('fingerprints ignore line numbers and whitespace but not location', () => {
  const a = C.fingerprint(judged());
  const b = C.fingerprint(judged({ locations: [{ route: '/book/items', state: 'default', selector: 'main .item-summary', snippet: '<div class="item-summary">', source: { file: 'a.tsx', line: 99 } }] }));
  assert.equal(a, b);
  assert.notEqual(a, C.fingerprint(judged({ locations: [{ route: '/book/pay', state: 'default', selector: 'main .item-summary' }] })));
});

test('deterministic findings: identity is rule × route, independent of instances (ADR-033)', () => {
  const tool = (sels) => ({
    criteria: [{ kind: 'rule', id: 'A11Y-11', primary: true }],
    found_by: [{ role: 'tool', method: 'tool', check: 'contrast' }],
    locations: sels.map((s) => ({ route: '/', selector: s })),
  });
  assert.equal(C.fingerprint(tool(['a', 'b', 'c'])), C.fingerprint(tool(['a'])));
});

test('suggested severity is monotone and respects the impact anchors', () => {
  assert.equal(C.suggestedSeverity({ frequency: 3, impact: 0, persistence: 2 }), 1);
  assert.equal(C.suggestedSeverity({ frequency: 0, impact: 3, persistence: 0 }), 3);
  assert.equal(C.suggestedSeverity({ frequency: 3, impact: 3, persistence: 2 }), 4);
  for (let f = 0; f <= 3; f += 1) {
    for (let i = 0; i < 3; i += 1) {
      for (let p = 0; p <= 2; p += 1) {
        assert.ok(C.suggestedSeverity({ frequency: f, impact: i + 1, persistence: p }) >= C.suggestedSeverity({ frequency: f, impact: i, persistence: p }));
      }
    }
  }
});

test('priority thresholds, peripheral cap and the G1/G2 floor that wins over it', () => {
  assert.equal(C.priorityFromMean(3.5), 'P0');
  assert.equal(C.priorityFromMean(3.49), 'P1');
  assert.equal(C.priorityFromMean(2.5), 'P1');
  assert.equal(C.priorityFromMean(1.5), 'P2');
  assert.equal(C.priorityFromMean(0.5), 'P3');
  assert.equal(C.priorityFromMean(0.2), 'none');
  assert.equal(C.applyPriorityPolicy({ severity: { mean: 3.8 }, criticality: 'peripheral' }).priority, 'P2');
  assert.equal(C.applyPriorityPolicy({ severity: { mean: 1 }, gate: 'G2' }).priority, 'P1');
  assert.equal(C.applyPriorityPolicy({ severity: { mean: 3.8 }, gate: 'G2', criticality: 'peripheral' }).priority, 'P1');
});

test('lifecycle: transitions are checked and only humans resolve', () => {
  const f = { id: 'F-1', status: 'candidate' };
  C.setStatus(f, 'confirmed');
  C.setStatus(f, 'open');
  C.setStatus(f, 'fixed');
  assert.throws(() => C.setStatus(f, 'resolved', { by: 'lead' }));
  C.setStatus(f, 'verified', { by: 'fix-reviewer' });
  C.setStatus(f, 'resolved', { by: 'human:owner' });
  assert.equal(f.status, 'resolved');
  assert.equal(f.status_history.length, 5);
  assert.throws(() => C.setStatus({ status: 'candidate' }, 'fixed'));
});

test('validity votes stay outside the mean; a non-problem majority disputes (ADR-029)', () => {
  const r = (value, validity) => ({ rater: 'r', value, validity, frequency: 1, impact: 2, persistence: 1 });
  const a = aggregateWithValidity([r(3, 'problem'), r(3, 'problem'), r(null, 'not_a_problem')]);
  assert.equal(a.mean, 3);
  assert.equal(a.majority_validity, 'problem');
  assert.equal(a.divergent, true, 'a not_a_problem vote beside a mean ≥ 2.5 is divergent');
  const b = aggregateWithValidity([r(2, 'problem'), r(2, 'trade_off'), r(null, 'not_a_problem')]);
  assert.equal(b.mean, 2);
  assert.notEqual(b.majority_validity, 'problem');
  const c = aggregateWithValidity([r(1, 'problem'), r(3, 'problem'), r(2, 'problem')]);
  assert.equal(c.divergent, true, 'spread ≥ 2 is divergent');
});

test('fix queue: non-divergent P0/P1 and quick P2 first', () => {
  const q = C.buildQueue([
    { id: 'F-1', status: 'open', priority: 'P2', ease_of_fix: 1, criteria: [{ kind: 'rule', id: 'TYP-01' }] },
    { id: 'F-2', status: 'open', priority: 'P0', criteria: [{ kind: 'heuristic', id: 'H1' }] },
    { id: 'F-3', status: 'open', priority: 'P1', severity: { divergent: true }, criteria: [{ kind: 'heuristic', id: 'H5' }] },
    { id: 'F-4', status: 'dismissed', priority: 'P0', criteria: [{ kind: 'heuristic', id: 'H2' }] },
  ]);
  assert.deepEqual(q.map((x) => x.id), ['F-2', 'F-3', 'F-1'], 'priority order; closed findings left out');
  const now = q.filter((x) => x.fix_now).map((x) => x.id);
  assert.deepEqual(now.sort(), ['F-1', 'F-2']);
});

test('candidates a check emits for judgement are merged and verified, but never count as an evaluator (ADR-032)', () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-cand-'));
  try {
    const sel = 'form#book > button[type=submit]';
    const loc = { route: '/book', state: 'default', selector: sel, viewport: { width: 1280, height: 900 } };
    fs.mkdirSync(path.join(runDir, 'evidence/states'), { recursive: true });
    fs.mkdirSync(path.join(runDir, 'evaluators'), { recursive: true });
    fs.writeFileSync(path.join(runDir, 'checks.json'), JSON.stringify({ checks: { states: { state: 'ran', candidates_file: 'evidence/states/candidates.json' } } }));
    fs.writeFileSync(path.join(runDir, 'evidence/states/candidates.json'), JSON.stringify({
      schema: 'tool-candidates',
      check: 'states',
      candidates: [
        { title: 'Primary submit is disabled at rest', description: 'The submit is disabled before any input.', criteria: [{ kind: 'heuristic', id: 'H1', primary: true }, { kind: 'heuristic', id: 'H9' }], locations: [loc], evidence: [{ type: 'measurement', detail: 'disabled on first render' }], severity: { value: 3 } },
        { title: 'Another disabled submit', description: 'Disabled before any input on the newsletter form.', criteria: [{ kind: 'heuristic', id: 'H1', primary: true }], locations: [{ ...loc, route: '/news', selector: '#news button' }], evidence: [] },
      ],
    }));
    fs.writeFileSync(path.join(runDir, 'evaluators/he-1.json'), JSON.stringify({ role: 'heuristic-evaluator', agent: 'he-1', candidates: [{ title: 'Booking cannot be submitted', description: 'The button is greyed out with no hint.', criteria: [{ kind: 'heuristic', id: 'H1', primary: true }], locations: [loc], evidence: [] }] }));
    fs.writeFileSync(path.join(runDir, 'evaluators/he-2.json'), JSON.stringify({ role: 'heuristic-evaluator', agent: 'he-2', candidates: [] }));
    const out = mergeRun(runDir, {});
    assert.equal(out.inputs.tool_candidates, 2);
    assert.equal(out.inputs.judged_candidates, 1);
    const book = out.findings.find((f) => f.locations.some((l) => l.route === '/book'));
    assert.equal(book.status, 'candidate', 'goes through verification like any judged candidate');
    assert.deepEqual(book.detection, { k: 1, n: 2 }, 'the check is not an inspector: only he-1 counts');
    assert.ok(book.found_by.some((b) => b.method === 'tool-candidate' && b.check === 'states'));
    assert.equal(book.severity, undefined, 'no severity is carried from the finder');
    const news = out.findings.find((f) => f.locations.some((l) => l.route === '/news'));
    assert.deepEqual(news.detection, { k: 0, n: 2 });
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
});

test('lint instances on different source lines stay separate instances of one rule × route finding', () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-lintinst-'));
  try {
    const hit = (line) => ({
      title: 'Raw colour literal', description: 'A raw colour literal in a component.', problem_type: 'single_location',
      criteria: [{ kind: 'rule', id: 'COL-01', primary: true }],
      locations: [{ route: '', source: { file: 'src/Card.tsx', line, col: 3, method: 'lint', confidence: 'high' } }],
      found_by: [{ role: 'tool', method: 'tool', check: 'lint' }], evidence: [], severity: { source: 'rule', value: 2 }, status: 'confirmed',
    });
    fs.writeFileSync(path.join(runDir, 'tool-findings.jsonl'), [hit(10), hit(22), hit(22)].map((h) => JSON.stringify(h)).join('\n'));
    const out = mergeRun(runDir, {});
    const f = out.findings.filter((x) => x.criteria[0].id === 'COL-01');
    assert.equal(f.length, 1, 'one finding per rule × route (ADR-033)');
    assert.equal(f[0].locations.length, 2, 'two distinct source lines, the duplicate dropped');
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
});

test('fix review: only an isolated review verifies judged findings; deterministic findings wait for a clean re-run (ADR-030)', async () => {
  const R = await import('../../skills/ui-evaluator/scripts/lib/findings/register.mjs');
  const judged = () => ({ id: 'F-1', status: 'fixed', found_by: [{ role: 'design-critic', method: 'C' }], criteria: [{ kind: 'rule', id: 'TYP-11', primary: true }] });
  const tool = () => ({ id: 'F-2', status: 'open', found_by: [{ role: 'tool', method: 'tool', check: 'census' }], criteria: [{ kind: 'rule', id: 'TYP-01', primary: true }] });
  const doc = (isolation) => ({ isolation, items: [{ finding_id: 'F-1', verdict: 'confirmed_fixed' }, { finding_id: 'F-2', verdict: 'confirmed_fixed' }] });

  let list = [judged(), tool()];
  let out = R.applyFixReview(list, doc('subagent'));
  assert.equal(list[0].status, 'verified');
  assert.equal(list[1].status, 'fixed', 'a deterministic finding is never verified by a reviewer');
  assert.deepEqual(out.held.map((h) => h.id), ['F-2']);

  list = [judged(), tool()];
  out = R.applyFixReview(list, doc('single-context'));
  assert.equal(list[0].status, 'fixed', 'a single-context review is the fixer\'s own evidence');
  assert.equal(out.independent, false);
  assert.equal(out.held.length, 2);

  list = [judged()];
  R.applyFixReview(list, { isolation: 'single-context', items: [{ finding_id: 'F-1', verdict: 'not_fixed' }] });
  assert.equal(list[0].status, 'reopened', 'negative verdicts count whatever the isolation');
});

test('judged candidates that both carry factor notes merge, with the notes combined per factor', () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-factor-'));
  try {
    const loc = { route: '/', state: 'default', selector: 'form#book .ticket', viewport: { width: 375, height: 812 } };
    const cand = (agent, freq) => ({ title: 'Ticket text breaks mid-word', description: `Seen by ${agent}.`, problem_type: 'single_location', criteria: [{ kind: 'heuristic', id: 'H8', primary: true }], locations: [loc], evidence: [], factor_notes: { frequency: freq, impact: 'hard to read the slot time' } });
    fs.mkdirSync(path.join(runDir, 'evaluators'), { recursive: true });
    fs.writeFileSync(path.join(runDir, 'evaluators/he-1.json'), JSON.stringify({ role: 'heuristic-evaluator', agent: 'he-1', candidates: [cand('he-1', 'every booking on a phone')] }));
    fs.writeFileSync(path.join(runDir, 'evaluators/he-2.json'), JSON.stringify({ role: 'heuristic-evaluator', agent: 'he-2', candidates: [cand('he-2', 'phones under 400 px')] }));
    const out = mergeRun(runDir, {});
    const f = out.findings.filter((x) => x.locations.some((l) => l.selector === loc.selector));
    assert.equal(f.length, 1);
    assert.deepEqual(f[0].factor_notes, { frequency: 'every booking on a phone / phones under 400 px', impact: 'hard to read the slot time' });
    assert.deepEqual(f[0].detection, { k: 2, n: 2 });
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
});

test('duplicate proposals meet across query strings: same page, a shared criterion and related wording', () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-dup-'));
  try {
    const cand = (title, description, route, ids) => ({ title, description, problem_type: 'single_location', criteria: ids.map((id, i) => ({ kind: 'heuristic', id, primary: i === 0 })), locations: [{ route, state: 'default', viewport: { width: 375, height: 812 } }], evidence: [] });
    fs.mkdirSync(path.join(runDir, 'evaluators'), { recursive: true });
    fs.writeFileSync(path.join(runDir, 'evaluators/he-1.json'), JSON.stringify({ role: 'heuristic-evaluator', agent: 'he-1', candidates: [cand("'Booking stopped' gives no reason and no way to fix the booking", 'The form is replaced by Booking stopped with a bare reference.', '/boat.html?date=2026-10-17&berth=B14', ['H9', 'H3'])] }));
    fs.writeFileSync(path.join(runDir, 'evaluators/code.json'), JSON.stringify({ role: 'code-reviewer', agent: 'code', candidates: [
      cand("Over-length boat leads to a 'Booking stopped' screen that gives no reason", 'The page shows Booking stopped and a reference, with no way back to the form.', '/boat.html', ['H9']),
      cand('Draught is collected but never used', 'No sill depth is shown for the draught given.', '/boat.html', ['H9']),
    ] }));
    const out = mergeRun(runDir, {});
    const byTitle = (re) => out.findings.find((f) => re.test(f.title)).id;
    const pairs = out.proposals.map((p) => [...p.members].sort().join('+'));
    assert.ok(pairs.includes([byTitle(/^'Booking stopped'/), byTitle(/^Over-length/)].sort().join('+')), 'the same dead end from two roles is proposed');
    assert.ok(!pairs.some((p) => p.includes(byTitle(/^Draught/))), 'a shared criterion alone is not enough');
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
});

test('candidates from user feedback merge and get verified, but never count as an inspector', () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-fb-'));
  try {
    const loc = { route: '/boat.html', state: 'default', selector: '#mmsi', viewport: { width: 375, height: 812 } };
    fs.mkdirSync(path.join(runDir, 'evaluators'), { recursive: true });
    fs.writeFileSync(path.join(runDir, 'evaluators/he-1.json'), JSON.stringify({ role: 'heuristic-evaluator', agent: 'he-1', candidates: [{ title: 'MMSI is required but not explained', description: 'No hint.', criteria: [{ kind: 'heuristic', id: 'H10', primary: true }], locations: [loc], evidence: [] }] }));
    fs.writeFileSync(path.join(runDir, 'evaluators/feedback.json'), JSON.stringify({ schema: 'evaluator-output', role: 'feedback', agent: 'feedback', candidates: [
      { title: 'Skippers without DSC cannot finish the booking', description: 'Seven skippers wrote that the MMSI field stopped them.', criteria: [{ kind: 'heuristic', id: 'H10', primary: true }], locations: [loc], evidence: [{ type: 'quote', ref: 'feedback:FB-0012' }] },
      { title: 'The total appears only at the end', description: 'Four reviews.', criteria: [{ kind: 'heuristic', id: 'H6', primary: true }], locations: [{ route: '/berths.html', state: 'default', viewport: { width: 375, height: 812 } }], evidence: [{ type: 'quote', ref: 'feedback:FB-0040' }] },
    ] }));
    const out = mergeRun(runDir, {});
    assert.equal(out.inputs.judged_outputs, 1, 'only he-1 is an inspector');
    assert.equal(out.inputs.feedback_outputs, 1);
    const mmsi = out.findings.find((f) => f.locations.some((l) => l.selector === '#mmsi'));
    assert.deepEqual(mmsi.detection, { k: 1, n: 1 }, 'the feedback source does not raise k');
    const total = out.findings.find((f) => /total/.test(f.title));
    assert.equal(total.status, 'candidate');
    assert.deepEqual(total.detection, { k: 0, n: 1 });
    assert.ok(total.found_by.every((b) => b.role === 'feedback' && b.method === 'feedback'));
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
});

test('an advisory tool hit is an observation: a candidate flagged advisory, never confirmed (ADR-038)', () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-adv-'));
  const hit = (id, extra) => ({ title: `${id} hit`, criteria: [{ kind: 'rule', id, primary: true }], locations: [{ route: '/', state: 'default', selector: 'p' }], evidence: [], found_by: [{ role: 'tool', method: 'tool', check: 'census' }], severity: { source: 'rule', value: 1 }, ...extra });
  fs.writeFileSync(path.join(runDir, 'tool-findings.jsonl'), [hit('A11Y-11', { gate: 'G2' }), hit('TYP-15', { gate: null, advisory: true }), hit('COL-14', { gate: null })].map((h) => JSON.stringify(h)).join('\n'));
  const res = mergeRun(runDir, { rules: { 'A11Y-11': { gate: 'G2' } } });
  const by = Object.fromEntries(res.findings.map((f) => [C.primaryCriterion(f).id, f]));
  assert.equal(by['A11Y-11'].status, 'confirmed');
  assert.equal(by['A11Y-11'].advisory, undefined);
  assert.equal(by['TYP-15'].status, 'candidate');
  assert.equal(by['TYP-15'].advisory, true);
  assert.equal(by['COL-14'].status, 'candidate', 'a rule with no gate is advisory even without the flag');
  assert.equal(res.proposals.length, 0, 'two tool findings are never proposed as one');
});

test('an inspector adopting an advisory observation turns it into a finding; same-cause groups come from source lines (ADR-038, ADR-039)', async () => {
  const { acceptProposals, sameCauseProposals, partitionCandidates } = await import('../../skills/ui-evaluator/scripts/lib/findings/merge.mjs');
  const doc = {
    findings: [
      { id: 'F-0001', status: 'candidate', advisory: true, title: 'One word on the last line', found_by: [{ role: 'tool', agent: 'tool:census' }], locations: [{ route: '/', selector: 'p.intro' }], evidence: [], criteria: [{ kind: 'rule', id: 'TYP-15', primary: true }] },
      { id: 'F-0002', status: 'candidate', title: 'The intro strands its last word', found_by: [{ role: 'heuristic-evaluator', agent: 'he-1', method: 'HE' }], locations: [{ route: '/', selector: 'p.intro' }], evidence: [], criteria: [{ kind: 'heuristic', id: 'H8', primary: true }] },
    ],
    proposals: [{ id: 'P1', members: ['F-0001', 'F-0002'], reason: 'same element', kind: 'tool+judged' }],
  };
  acceptProposals(doc, ['P1']);
  assert.equal(doc.findings.length, 1);
  assert.equal(doc.findings[0].advisory, undefined, 'the judged member lifts the advisory flag');
  assert.equal(doc.findings[0].status, 'candidate', 'it still goes to the verifier');
  const loc = (file, line) => [{ route: '/tool.html', selector: '.actionbar', source: { file, line } }];
  const findings = [
    { id: 'F-0010', status: 'confirmed', locations: loc('styles.css', 636) },
    { id: 'F-0011', status: 'confirmed', locations: loc('styles.css', 638) },
    { id: 'F-0012', status: 'confirmed', locations: loc('styles.css', 640) },
    { id: 'F-0013', status: 'confirmed', locations: loc('styles.css', 700) },
    { id: 'F-0014', status: 'confirmed', locations: loc('app.js', 10) },
    { id: 'F-0015', status: 'confirmed', advisory: true, locations: loc('styles.css', 637) },
    { id: 'F-0016', status: 'rejected', locations: loc('styles.css', 637) },
  ];
  const same = sameCauseProposals(findings, []);
  assert.deepEqual(same.map((p) => p.members), [['F-0010', 'F-0011', 'F-0012']]);
  assert.equal(same[0].id, 'S1');
  assert.match(same[0].reason, /styles\.css:636–640/);
  assert.equal(sameCauseProposals(findings, same).length, 0, 'an existing proposal is not repeated');
  const cands = ['/a', '/b', '/a', '/c', '/b', '/a', '/c'].map((route, i) => ({ candidate_id: `F-${i}`, locations: [{ route }] }));
  const parts = partitionCandidates(cands, 3);
  assert.equal(parts.length, 3);
  assert.equal(parts.flat().length, 7);
  const routesOf = (p) => [...new Set(p.map((c) => c.locations[0].route))];
  assert.deepEqual(parts.map(routesOf), [['/a'], ['/b'], ['/c']], 'each route stays in one packet');
  assert.deepEqual(partitionCandidates(cands, 3), parts, 'the split is deterministic');
  assert.equal(partitionCandidates(cands, 1).length, 1);
  // A route larger than a packet is cut, and the packets stay near equal.
  const one = Array.from({ length: 9 }, (_, i) => ({ candidate_id: `G-${i}`, locations: [{ route: '/big' }] }));
  assert.deepEqual(partitionCandidates(one, 3).map((p) => p.length), [3, 3, 3]);
  const mixed = [...one, ...['/x', '/y'].map((route, i) => ({ candidate_id: `H-${i}`, locations: [{ route }] }))];
  const sizes = partitionCandidates(mixed, 3).map((p) => p.length);
  assert.equal(sizes.reduce((a, b) => a + b, 0), 11);
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 2, `near equal: ${sizes}`);
});
