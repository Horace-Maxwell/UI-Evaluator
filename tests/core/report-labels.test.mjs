// Report labels in the CMU lecture's vocabulary: H2-1…H2-10, the walkthrough's four questions, the 0–4 scale.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criterionLabel, severityWord, HEURISTICS, CW_QUESTIONS } from '../../skills/ui-evaluator/scripts/lib/report/labels.mjs';

test('Nielsen v2 heuristics print with the lecture numbers H2-1…H2-10', () => {
  assert.equal(Object.keys(HEURISTICS).length, 10);
  assert.deepEqual(criterionLabel({ kind: 'heuristic', id: 'H1' }), { number: 'H2-1', name: 'Visibility of system status', kind: 'heuristic' });
  assert.equal(criterionLabel({ id: 'H10' }).number, 'H2-10');
  assert.equal(criterionLabel({ id: 'H4' }).name, 'Consistency and standards');
});

test('walkthrough questions print in the lecture words; WCAG and rules get their names', () => {
  assert.equal(Object.keys(CW_QUESTIONS).length, 4);
  assert.equal(criterionLabel({ kind: 'cw', id: 'CW-Q2' }).name, 'Is the action visible?');
  assert.equal(criterionLabel({ kind: 'cw', id: 'CW-Q4' }).name, 'Will the user understand the feedback?');
  assert.deepEqual(criterionLabel({ kind: 'wcag', id: '1.4.3' }, { wcag: { '1.4.3': { name: 'Contrast (minimum)' } } }), { number: 'WCAG 1.4.3', name: 'Contrast (minimum)', kind: 'wcag' });
  assert.equal(criterionLabel({ kind: 'rule', id: 'TYP-01' }, { rules: { 'TYP-01': { title: 'Minimum rendered text size' } } }).name, 'Minimum rendered text size');
});

test('severity words follow the lecture scale', () => {
  assert.equal(severityWord(0), 'not a usability problem');
  assert.equal(severityWord(1), 'cosmetic');
  assert.equal(severityWord(2.4), 'minor');
  assert.equal(severityWord(3.33), 'major');
  assert.equal(severityWord(3.7), 'catastrophe');
  assert.equal(severityWord(null), null);
});

test('the HTML report tints severity and ease of fixing in a lecture entry table, and no other table', async () => {
  const { markdownToHtml } = await import('../../skills/ui-evaluator/scripts/lib/report/html.mjs');
  const entry = markdownToHtml('| # | Problem | Severity | Ease of fixing | Heuristic | Broad heuristic |\n|---|---|---|---|---|---|\n| F-0004 | Not all buttons have tooltips | 2.33 · minor | 1 · one value or token | H2-6 | Recognition rather than recall |');
  assert.match(entry, /<table class="he">/);
  assert.match(entry, /<td class="sev sev-2">2\.33 · minor<\/td>/);
  assert.match(entry, /<td class="ease ease-1">1 · one value or token<\/td>/);
  const other = markdownToHtml('| Gate | Severity |\n|---|---|\n| G1 | 3 |');
  assert.doesNotMatch(other, /class="(he|sev)/);
});
