// `uie diff` coverage rule for ADR-030: a cleared deterministic finding is verified only when its check re-ran over
// the instance's own page state. A check that is partial only because other page states did not load still counts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverageFor } from '../../skills/ui-evaluator/scripts/lib/commands/diff.mjs';

const finding = (route, width = 1280) => ({
  criteria: [{ kind: 'rule', id: 'A11Y-11', primary: true }],
  found_by: [{ role: 'tool', method: 'tool', check: 'contrast' }],
  locations: [{ route, state: 'default', viewport: { width, height: 900 }, theme: 'light' }],
});
const ran = (extra = {}) => ({ contrast: { state: 'ran', coverage: { routes: ['/', '/pricing'], states: ['/#default', '/pricing#default'], widths: [320, 1280], themes: ['light'] }, ...extra } });

test('a full re-run covers the finding', () => {
  assert.equal(coverageFor(finding('/'), ran()).covered, true);
});

test('a check partial on its own terms never covers', () => {
  assert.equal(coverageFor(finding('/'), ran({ partial: true, partial_scope: 'check' })).covered, false);
  assert.equal(coverageFor(finding('/'), ran({ partial: true })).covered, false, 'older entries without partial_scope stay conservative');
});

test('a load-only partial run covers the states that loaded and not the ones that did not', () => {
  const checks = ran({ partial: true, partial_scope: 'load', unevaluated: ['/account#default@1280x900/light/default'] });
  assert.equal(coverageFor(finding('/'), checks).covered, true, 'another route hit an auth wall; this one loaded');
  assert.equal(coverageFor(finding('/account'), checks).covered, false, 'the walled route is not re-checked');
  const sameRouteOtherWidth = ran({ partial: true, partial_scope: 'load', unevaluated: ['/#default@320x900/light/default'] });
  assert.equal(coverageFor(finding('/', 1280), sameRouteOtherWidth).covered, true);
  assert.equal(coverageFor(finding('/', 320), sameRouteOtherWidth).covered, false);
});
