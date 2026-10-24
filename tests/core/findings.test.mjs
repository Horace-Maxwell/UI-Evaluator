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
  // A page reached by different query strings, or as /index.html, is one page.
  const pages = ['/basket.html?items=a', '/basket.html', '/', '/index.html', '/basket.html?items=b&day=1', '/?q=drill'].map((route, i) => ({ candidate_id: `K-${i}`, locations: [{ route }] }));
  const byPage = partitionCandidates(pages, 2).map((p) => p.map((c) => c.candidate_id).sort());
  assert.deepEqual(byPage, [['K-0', 'K-1', 'K-4'], ['K-2', 'K-3', 'K-5']], 'each page stays in one packet');
});

test('candidates whose check has to wait come first, in a packet of their own', async () => {
  const { partitionCandidates, timeBound } = await import('../../skills/ui-evaluator/scripts/lib/findings/merge.mjs');
  const c = (id, route, title, state) => ({ candidate_id: id, title, description: '', locations: [{ route, ...(state ? { state } : {}) }] });
  // Wording from round 5: the hold, the expired error, a state named for the expiry.
  assert.ok(timeBound(c('a', '/', 'The 5-minute slot hold expires without any warning')));
  assert.ok(timeBound(c('b', '/', 'No indication anywhere of how long a chosen slot is held')));
  assert.ok(timeBound(c('c', '/', "'Change slot' reopens on Today", 'expired')));
  assert.ok(timeBound(c('d', '/', 'The confirmation email arrives after two minutes')));
  assert.ok(timeBound(c('e', '/', 'The session times out with no warning')));
  // Code words and other verbs are not waits.
  assert.ok(!timeBound(c('f', '/', 'The permit is checked only inside the 1.5 s booking timeout')));
  assert.ok(!timeBound(c('g', '/', "The page reached by 'Change vehicle' also holds the waste checkboxes")));
  assert.ok(!timeBound(c('h', '/', 'A slot button shows only its start time; a slot lasts 20 minutes')));
  const cands = [
    c('F-1', '/', 'Slot buttons are 32 px tall'), c('F-2', '/confirm.html', 'Expired-hold error does not say what to do next'),
    c('F-3', '/vehicle.html', 'Permit field has no label'), c('F-4', '/', 'Nothing says the chosen slot is held or for how long'),
    c('F-5', '/vehicle.html', 'Help icon has no name'), c('F-6', '/confirm.html', 'Summary omits the day'),
  ];
  const ids = (parts) => parts.map((p) => p.map((x) => x.candidate_id));
  assert.deepEqual(ids(partitionCandidates(cands, 3)), [['F-2', 'F-4'], ['F-3', 'F-5'], ['F-1', 'F-6']], 'the waiting checks get the first packet, whatever their page');
  assert.deepEqual(ids(partitionCandidates(cands, 1)), [['F-2', 'F-4', 'F-1', 'F-3', 'F-5', 'F-6']], 'one packet lists them first');
  assert.equal(partitionCandidates(cands.filter((x) => !timeBound(x)), 2).length, 2, 'without waiting checks the split is as before');
});

test('part of a same-cause proposal can be accepted; the other members stay apart (ADR-039)', async () => {
  const { acceptProposals } = await import('../../skills/ui-evaluator/scripts/lib/findings/merge.mjs');
  const f = (id, title) => ({ id, status: 'confirmed', title, found_by: [{ role: 'heuristic-evaluator', agent: 'he-1', method: 'HE' }], locations: [{ route: '/tool.html', selector: '#reserve' }], evidence: [{ type: 'screenshot', ref: `${id}.png` }], criteria: [{ kind: 'heuristic', id: 'H1', primary: true }] });
  const doc = {
    findings: [f('F-0008', 'Fixed bar covers the focused day'), f('F-0011', 'Text overlaps under the fixed bar'), f('F-0063', "'Reserve this tool' only adds to a basket")],
    proposals: [{ id: 'S14', members: ['F-0008', 'F-0011', 'F-0063'], reason: 'same cause: the code reviewer located them at tool.html:68–73', kind: 'same-cause' }],
  };
  assert.match(acceptProposals(doc, ['S14:F-0008+F-0099']).refused[0].reason, /F-0099 not in S14/);
  const bad = acceptProposals(doc, ['S14:F-0008', 'S14x']);
  assert.deepEqual(bad.removed, []);
  assert.deepEqual(bad.refused.map((r) => `${r.id}: ${r.reason}`).sort(), ['S14: name two or more members', 'S14x: no such proposal']);
  assert.equal(doc.findings.length, 3, 'nothing was merged by a refused entry');
  const res = acceptProposals(doc, ['S14:F-0008+F-0011']);
  assert.deepEqual(res.removed, ['F-0011']);
  assert.deepEqual(doc.findings.map((x) => x.id), ['F-0008', 'F-0063'], 'the member with another cause stays a finding of its own');
  assert.deepEqual(doc.proposals[0].applied_members, ['F-0008', 'F-0011']);
  assert.equal(doc.findings[0].evidence.length, 2, 'the merged finding keeps both members’ evidence');
  assert.match(acceptProposals(doc, ['S14']).refused[0].reason, /already applied/);
});

test("a design critic's remark that names no harm is a design note; one that names a harm is a candidate (ADR-040)", async () => {
  const { acceptProposals, namesHarm } = await import('../../skills/ui-evaluator/scripts/lib/findings/merge.mjs');
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-note-'));
  try {
    const item = (title, selector, extra = {}) => ({ title, description: `${title}, seen at 375 px in dark mode.`, problem_type: 'single_location', criteria: [{ kind: 'heuristic', id: 'H8', primary: true }], locations: [{ route: '/', state: 'default', selector }], evidence: [], ...extra });
    fs.mkdirSync(path.join(runDir, 'panel'));
    fs.writeFileSync(path.join(runDir, 'panel', 'critic-1.json'), JSON.stringify({ role: 'design-critic', agent: 'critic-1', findings: [
      item('Every card shows the same wrench glyph', '.card__thumb'),
      item('Sessions before the chosen day are offered', '.sessions', { harm: { kind: 'task', statement: 'Members may pick a session that contradicts the day they chose.' } }),
      item('The brand mark is set in body type', '.brand', { harm: { kind: 'requirement', statement: 'The identity rule in DESIGN.md is not followed.' } }),
    ] }));
    fs.mkdirSync(path.join(runDir, 'evaluators'));
    fs.writeFileSync(path.join(runDir, 'evaluators', 'he-1.json'), JSON.stringify({ role: 'heuristic-evaluator', agent: 'he-1', candidates: [item('Card thumbnails all look alike', '.card__img')] }));
    const res = mergeRun(runDir, { rules: {} });
    const by = Object.fromEntries(res.findings.map((f) => [f.title, f]));
    assert.equal(by['Every card shows the same wrench glyph'].design_note, true);
    assert.equal(by['Every card shows the same wrench glyph'].status, 'candidate');
    assert.equal(by['Sessions before the chosen day are offered'].design_note, undefined, 'a named harm makes it a candidate');
    assert.equal(by['Sessions before the chosen day are offered'].harm.kind, 'task');
    assert.equal(by['The brand mark is set in body type'].design_note, true, 'a broken requirement needs the line quoted');
    assert.equal(by['Card thumbnails all look alike'].design_note, undefined, 'only critics write design notes');
    // Another inspector reporting the same problem makes the note a finding.
    const doc = { findings: res.findings, proposals: [{ id: 'P9', members: [by['Every card shows the same wrench glyph'].id, by['Card thumbnails all look alike'].id], reason: 'similar wording', kind: 'judged' }] };
    acceptProposals(doc, ['P9']);
    assert.equal(doc.findings.find((f) => f.title === 'Every card shows the same wrench glyph').design_note, undefined);
    assert.equal(namesHarm({ kind: 'trust', statement: 'too short' }), false);
    assert.equal(namesHarm({ kind: 'requirement', statement: 'Breaks the one-filled-button rule.', requirement: 'DESIGN.md: "One filled button per screen."' }), true);
    assert.equal(namesHarm({ kind: 'looks', statement: 'It looks generic and unfinished.' }), false);
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
});

test("an inspector's own advisory flag is dropped: its candidate is verified and rated like any other (ADR-038)", () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-adv-insp-'));
  try {
    fs.mkdirSync(path.join(runDir, 'evaluators'));
    fs.writeFileSync(path.join(runDir, 'evaluators', 'a11y.json'), JSON.stringify({
      role: 'accessibility-auditor', agent: 'a11y',
      candidates: [{ title: 'Session dots vanish in forced colours', description: 'In the forced-colours capture the dots under session days disappear.', problem_type: 'single_location', advisory: true, criteria: [{ kind: 'rule', id: 'A11Y-22', primary: true }], locations: [{ route: '/tool.html', state: 'default', selector: '.day__mark' }], evidence: [] }],
    }));
    const res = mergeRun(runDir, { rules: {} });
    assert.equal(res.findings.length, 1);
    assert.equal(res.findings[0].status, 'candidate');
    assert.equal(res.findings[0].advisory, undefined);
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
});

test('same-cause proposals on a minified line group by column, not by line (ADR-039)', async () => {
  const { sameCauseProposals } = await import('../../skills/ui-evaluator/scripts/lib/findings/merge.mjs');
  const at = (id, file, line, col) => ({ id, status: 'confirmed', locations: [{ route: '/', source: { file, line, ...(col !== undefined ? { col } : {}), method: 'text-search', confidence: 'low' } }] });
  const findings = [
    at('F-0001', 'app.js', 1, 5200),
    at('F-0002', 'app.js', 1, 5260),
    at('F-0003', 'app.js', 1, 9100),
    at('F-0004', 'app.js', 1),
    at('F-0005', 'app.js', 1, 9180),
    at('F-0006', 'pages.html', 40),
    at('F-0007', 'pages.html', 42),
  ];
  const minified = (file, line) => file === 'app.js' && line === 1;
  const same = sameCauseProposals(findings, [], { minified });
  assert.deepEqual(same.map((p) => p.members), [['F-0001', 'F-0002'], ['F-0003', 'F-0005'], ['F-0006', 'F-0007']]);
  assert.match(same[0].reason, /app\.js:1, columns 5200–5260/);
  assert.equal(sameCauseProposals(findings, []).length, 2, 'without the check, the whole line is one group (and the pages another)');
});

test('a confirmed verdict can correct an overstated description; the original wording is kept', async () => {
  const { applyVerifierVerdicts } = await import('../../skills/ui-evaluator/scripts/lib/findings/register.mjs');
  const f = { id: 'F-0042', status: 'candidate', title: 'Slot end time only in a tooltip', description: 'The slot end time and arrival rule exist only in the title attribute.', evidence: [], criteria: [{ kind: 'heuristic', id: 'H6', primary: true }], locations: [{ route: '/' }] };
  applyVerifierVerdicts([f], { verdicts: [{ candidate_id: 'F-0042', verdict: 'confirmed', step: 'none', reason: 'Reproduced on the slot buttons.', corrected_description: 'A slot button shows only its start time; its end and the arrival rule are in a hover tooltip, and the intro mentions the 20-minute length once.' }] });
  assert.equal(f.status, 'confirmed');
  assert.match(f.description, /shows only its start time/);
  assert.equal(f.description_as_reported, 'The slot end time and arrival rule exist only in the title attribute.');
});

test('a dismissal never waives a WCAG or tool finding, and only catches the same problem on the same element', async () => {
  const { applyVerifierVerdicts, addDismissal, matchesDismissal } = await import('../../skills/ui-evaluator/scripts/lib/findings/register.mjs');
  const at = [{ route: '/', state: 'default', selector: 'button.primary' }];
  const judged = (id, title, crit, status = 'candidate') => ({ id, status, fingerprint: `sha1:${id}`, title, criteria: [{ kind: 'heuristic', id: crit, primary: true }], locations: at, found_by: [{ role: 'heuristic-evaluator', agent: 'he-1', method: 'HE' }] });
  const ledger = addDismissal({ version: 1, entries: [] }, judged('F-0001', 'Primary button uses an off-brand green', 'H8'), { reason: 'brand colour, owner decision', by: 'human:owner' });
  const contrast = { id: 'F-0002', status: 'confirmed', fingerprint: 'sha1:b', gate: 'G2', severity: { source: 'rule', value: 3, mean: 3 }, criteria: [{ kind: 'rule', id: 'A11Y-11', primary: true }], locations: at, found_by: [{ role: 'tool', method: 'tool' }], title: 'Text contrast 3.1:1' };
  const target = { id: 'F-0003', status: 'candidate', fingerprint: 'sha1:c', criteria: [{ kind: 'wcag', id: '2.5.8', primary: true }], locations: at, found_by: [{ role: 'heuristic-evaluator', agent: 'he-2', method: 'HE' }], title: 'Target is 18 px tall' };
  const again = judged('F-0004', 'Primary button green is off-brand', 'H4');
  const other = judged('F-0005', 'Primary button label says Proceed, other steps say Continue', 'H4');
  const confirmed = judged('F-0006', 'The off-brand green on the primary button', 'H8');
  assert.equal(matchesDismissal(contrast, ledger), undefined, 'a deterministic G2 failure is never waived');
  assert.equal(matchesDismissal(target, ledger), undefined, 'a WCAG success criterion is never waived');
  const findings = [contrast, target, again, other, confirmed];
  const counts = applyVerifierVerdicts(findings, { verdicts: [{ candidate_id: 'F-0006', verdict: 'confirmed', reason: 'new evidence: the brand changed' }] }, { dismissals: ledger });
  assert.deepEqual(findings.map((f) => f.status), ['confirmed', 'candidate', 'rejected', 'candidate', 'confirmed']);
  assert.equal(confirmed.dismissal_match.finding, 'F-0001', 'a confirmed finding keeps its verdict and shows the match');
  assert.deepEqual([counts.confirmed, counts.rejected], [1, 1], 'each finding is counted once');
});

test('a merge on one element and criterion keeps what each report said, for the verifier to split', () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-texts-'));
  try {
    const loc = { route: '/', state: 'default', selector: 'button#next', viewport: { width: 375, height: 812 } };
    const cand = (title, description) => ({ title, description, problem_type: 'single_location', criteria: [{ kind: 'heuristic', id: 'H4', primary: true }], locations: [loc], evidence: [] });
    fs.mkdirSync(path.join(runDir, 'evaluators'), { recursive: true });
    const write = (agent, c) => fs.writeFileSync(path.join(runDir, `evaluators/${agent}.json`), JSON.stringify({ role: 'heuristic-evaluator', agent, candidates: [c] }));
    write('he-1', cand('Next says "Proceed" here but "Continue" elsewhere', 'The same action has two names.'));
    write('he-2', cand('Next is grey like the disabled Back button', 'It looks unavailable.'));
    write('he-3', cand('Next says "Proceed" here but "Continue" elsewhere', 'The same action has two names.'));
    const [f] = mergeRun(runDir, {}).findings.filter((x) => x.locations.some((l) => l.selector === 'button#next'));
    assert.deepEqual(f.merged_texts.map((t) => [t.agent, t.title]), [['he-1', 'Next says "Proceed" here but "Continue" elsewhere'], ['he-2', 'Next is grey like the disabled Back button']], 'the second problem is kept; an identical third report adds nothing');
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
});

test('the time-bound detector: words that only look like a wait are not one, and common durations are', async () => {
  const { timeBound } = await import('../../skills/ui-evaluator/scripts/lib/findings/merge.mjs');
  const notWaits = ['Hold Shift and Tab skips the search field', 'Press and hold on a slot opens nothing on touch devices', 'The Save button looks idle: no hover or pressed state', 'Placeholder text is held in the label slot instead of a real label', 'The expiry date field on the payment form has no format hint', 'Card expiration month uses a free text box', 'The countdown of remaining characters is not announced', 'Takes 3 minutes to read the terms before the button appears below the fold', 'Small detailing lapses: a stranded icon', "After a day is tapped the slot area stays empty"];
  const waits = ['Your session ends after 15 seconds without a warning', 'The reservation is released after 90 seconds and the page does not say so', 'The confirmation email arrives a day later, nothing tells the user to wait', 'The basket empties itself after half an hour', 'Sign-in is lost after 20 min of no activity', 'The code you were texted is only valid for 10 minutes', 'The offer disappears at midnight', 'The 5-minute slot hold expires without any warning', 'How long a chosen slot is held is never stated'];
  for (const title of notWaits) assert.equal(timeBound({ title }), false, title);
  for (const title of waits) assert.equal(timeBound({ title }), true, title);
  assert.equal(timeBound({ title: 'x', locations: [{ state: 'hold-expired' }] }), true);
  assert.equal(timeBound({ title: 'x', locations: [{ state: 'placeholder-shown' }, { state: 'household-form' }] }), false, 'state names match on whole words');
});
