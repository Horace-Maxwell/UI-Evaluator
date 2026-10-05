// Study statistics against published or hand-derived values (METHODS §9).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../../skills/ui-evaluator/scripts/lib/study/stats.mjs';
import { krippendorffAlpha } from '../../skills/ui-evaluator/scripts/lib/study/alpha.mjs';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} expected ${b} ± ${tol}, got ${a}`);

test('normal and t quantiles', () => {
  near(S.normalQuantile(0.975), 1.959964, 1e-5);
  near(S.normalQuantile(0.8), 0.841621, 1e-5);
  near(S.tQuantile(0.975, 10), 2.228139, 1e-4);
  near(S.tQuantile(0.975, 4), 2.776445, 1e-4);
  near(S.chiSquareSurvival(3.841459, 1), 0.05, 1e-4);
});

test('adjusted-Wald interval: 4 of 5 (Sauro and Lewis worked example)', () => {
  const r = S.adjustedWald(4, 5);
  near(r.low, 0.36, 0.01);
  near(r.high, 0.98, 0.01);
  assert.equal(r.p, 0.8);
  assert.throws(() => S.adjustedWald(6, 5));
});

test('t-interval and geometric mean', () => {
  const c = S.meanCI([5, 6, 7, 4, 6, 5, 7, 6, 5, 6, 4, 5]);
  near(c.mean, 5.5, 1e-9);
  assert.ok(c.low < 5.5 && c.high > 5.5);
  const g = S.geometricMeanCI([10, 20, 40]);
  near(g.geometric_mean, 20, 1e-9);
  assert.throws(() => S.geometricMeanCI([10, 0]));
});

test('SUS scoring, grade and UMUX-Lite', () => {
  assert.equal(S.susScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]), 50);
  assert.equal(S.susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]), 100);
  assert.equal(S.susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5]), 0);
  assert.throws(() => S.susScore([3, 3, 3]));
  assert.equal(S.susGrade(68), 'C');
  assert.equal(S.susGrade(85), 'A+');
  assert.equal(S.susGrade(40), 'F');
  const u = S.umuxLite(7, 7);
  near(u.raw, 100, 1e-9);
  near(u.sus_equivalent, 87.9, 1e-9);
});

test('NASA-TLX raw and weighted', () => {
  assert.equal(S.tlx([50, 50, 50, 50, 50, 50]).raw, 50);
  near(S.tlx([50, 60, 40, 30, 20, 10], [5, 4, 3, 2, 1, 0]).weighted, 46, 1e-9);
  assert.throws(() => S.tlx([50, 50, 50, 50, 50, 50], [1, 1, 1, 1, 1, 1]));
});

test('planning: sample size, discovery, sessions', () => {
  assert.equal(S.sampleSizeProportion(0.15), 43);
  near(S.discoveryProbability(0.31, 5), 0.844, 0.001);
  assert.equal(S.sessionsNeeded(0.15, 0.85), 12);
  near(S.discoveryProbability(0.3, 6), 0.882, 0.001);
  near(S.discoveryProbability(0.1, 6), 0.469, 0.001);
});

test('A/B sizing and SRM', () => {
  assert.equal(S.abSampleSize({ baseline: 0.05, delta: 0.01 }).per_variant, 7600);
  assert.equal(S.abSampleSize({ sd: 12, delta: 3, power: 0.9 }).multiplier, 21);
  const ok = S.srm([50000, 49000], [1, 1]);
  near(ok.p, 0.00148, 0.0001);
  assert.equal(ok.mismatch, false);
  assert.equal(S.srm([50000, 48500], [1, 1]).mismatch, true);
});

test('any-two agreement and discovery estimate', () => {
  near(S.anyTwoAgreement([['a', 'b'], ['a', 'c']]).mean, 1 / 3, 1e-9);
  const d = S.discoveryEstimate([2, 1, 1], 3);
  assert.equal(d.found, 3);
  assert.ok(d.estimated_total >= 3);
});

test("Krippendorff's alpha matches Krippendorff's published example", () => {
  const coders = [
    [1, 2, 3, 3, 2, 1, 4, 1, 2, null, null, null],
    [1, 2, 3, 3, 2, 2, 4, 1, 2, 5, null, 3],
    [null, 3, 3, 3, 2, 3, 4, 2, 2, 5, 1, null],
    [1, 2, 3, 3, 2, 4, 4, 1, 2, 5, 1, null],
  ];
  const units = coders[0].map((_, u) => coders.map((c) => c[u]));
  near(krippendorffAlpha(units, 'nominal'), 0.743, 0.001);
  near(krippendorffAlpha(units, 'ordinal'), 0.815, 0.001);
  near(krippendorffAlpha(units, 'interval'), 0.849, 0.001);
  near(krippendorffAlpha(units, 'ratio'), 0.797, 0.001);
  assert.ok(Number.isNaN(krippendorffAlpha([[1, 1], [1, 1]], 'ordinal')));
});
