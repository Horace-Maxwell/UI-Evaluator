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
