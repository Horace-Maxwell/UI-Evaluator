// Unit tests of the browser layer's pure parts: locators, actions, thresholds, motion rules, vitals CLS, cross-page
// helpers, auth walls, capture bookkeeping, PNG diffs and the identity diff of `uie diff` with its register updates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lib } from './helpers.mjs';

const { parseTarget, splitChain, describeTarget } = await lib('browser/locators.mjs');
const { validateActions, parseActionsArg } = await lib('browser/actions.mjs');
const T = await lib('browser/thresholds.mjs');
const MR = await lib('browser/motion-rules.mjs');
const { clsFromShifts, vitalsInitScript } = await lib('browser/checks/vitals.mjs');
const { comparableName, sharedOrderDiffers } = await lib('browser/checks/cross-page.mjs');
const { isLocalUrl, contextOptions } = await lib('browser/launch.mjs');
const { authWallFor, pageState } = await lib('browser/pages.mjs');
const { mergeCaptures, urlSlug, parseWidths, loadImageDeps } = await lib('browser/command-kit.mjs');
const { diffImages, changedRegions, cropImage } = await lib('browser/png.mjs');
const D = await lib('commands/diff.mjs');
const { compareSmoke } = await lib('browser/smoke.mjs');
const { setStatus } = await lib('findings/core.mjs');
const { wordList, matchedTexts } = await lib('browser/data.mjs');

test('locators: role, label, text, chains and CSS fallback', () => {
  const [r] = parseTarget('role=button[name="Save draft"]');
  assert.equal(r.kind, 'role');
  assert.equal(r.value, 'button');
  assert.deepEqual(r.options, { name: 'Save draft', exact: true });
  const [h] = parseTarget('role=heading[level=2][name=/Orders/i]');
  assert.equal(h.options.level, 2);
  assert.ok(h.options.name instanceof RegExp);
  const [ci] = parseTarget('role=link[name="home" i]');
  assert.equal(ci.options.exact, false);
  assert.deepEqual(parseTarget('label="Email"')[0], { kind: 'label', value: 'Email', options: { exact: true } });
  assert.equal(parseTarget('text=Sign in')[0].options.exact, false);
  assert.equal(parseTarget('testid=save')[0].kind, 'testid');
  assert.deepEqual(parseTarget('#main > .card'), [{ kind: 'css', value: '#main > .card' }]);
  assert.deepEqual(splitChain('nav >> role=link[name="A >> B"]'), ['nav', 'role=link[name="A >> B"]']);
  assert.match(describeTarget('role=button[name="Save"]'), /button "Save"/);
  assert.throws(() => parseTarget('role=button[nam="x"]'), /unknown role option/);
  assert.throws(() => parseTarget('role=button[name="x'), /unterminated|missing/);
  assert.throws(() => parseTarget(''), /non-empty/);
});

test('actions: validation names the step and the problem; JSON and files are accepted', () => {
  assert.deepEqual(validateActions([{ action: 'click', target: 'role=button[name="Go"]' }]), []);
  const probs = validateActions([{ action: 'jump' }, { action: 'fill', target: '#q' }, { action: 'expect' }, { action: 'wait', ms: 120000 }, { action: 'tab', count: 0 }, { action: 'scroll' }, { action: 'expect', target: '#x', state: 'shiny' }]);
  const msgs = probs.map((p) => `${p.step}:${p.message}`);
  assert.ok(msgs.some((m) => m.startsWith('1:unknown action')));
  assert.ok(msgs.some((m) => m.startsWith('2:fill needs "value"')));
  assert.ok(msgs.some((m) => m.startsWith('3:expect needs')));
  assert.ok(msgs.some((m) => m.startsWith('4:wait ms')));
  assert.ok(msgs.some((m) => m.startsWith('5:tab count')));
  assert.ok(msgs.some((m) => m.startsWith('6:scroll needs')));
  assert.ok(msgs.some((m) => m.startsWith('7:expect state')));
  assert.deepEqual(validateActions({}), [{ step: 0, message: 'actions must be an array' }]);
  assert.equal(parseActionsArg('[{"action":"tab"}]', () => '').length, 1);
  assert.equal(parseActionsArg('{"correct_actions":[{"action":"tab"},{"action":"tab"}]}', () => '').length, 2);
  const tmp = path.join(os.tmpdir(), `uie-actions-${process.pid}.json`);
  fs.writeFileSync(tmp, JSON.stringify({ actions: [{ action: 'press', key: 'Escape' }] }));
  assert.equal(parseActionsArg(tmp, (p) => fs.readFileSync(p, 'utf8'))[0].key, 'Escape');
  fs.rmSync(tmp);
  assert.throws(() => parseActionsArg('[oops', () => ''), /not valid JSON/);
});

test('thresholds: times, overshoot, layout properties, ceilings, 2.5.8 spacing, large text', () => {
  assert.deepEqual(T.parseTimes('0.3s, 150ms, 1s'), [300, 150, 1000]);
  assert.deepEqual(T.bezierOvershoot('cubic-bezier(0.68, -0.55, 0.27, 1.55)'), ['cubic-bezier(0.68, -0.55, 0.27, 1.55)']);
  assert.deepEqual(T.bezierOvershoot('cubic-bezier(0.2, 0, 0, 1)'), []);
  assert.deepEqual(T.bezierOvershoot('cubic-bezier(.2,-0.1,.2,1.1)'), [], 'the limits −0.1 and 1.1 are inclusive');
  assert.ok(T.isLayoutProperty('margin-top') && T.isLayoutProperty('paddingLeft') && !T.isLayoutProperty('transform'));
  assert.equal(T.durationCeiling('state', 'operate'), 250);
  assert.equal(T.durationCeiling('state', 'persuade'), 300);
  assert.equal(T.durationCeiling('overlay'), 500);
  assert.equal(T.durationCeiling('scrim'), 700);
  assert.equal(T.durationCeiling('focal'), 800);
  const fails = T.spacingFailures([
    { id: 'a', x: 0, y: 0, w: 16, h: 16, undersized: true },
    { id: 'b', x: 18, y: 0, w: 16, h: 16, undersized: true },
    { id: 'c', x: 200, y: 0, w: 16, h: 16, undersized: true },
  ]);
  assert.deepEqual(fails.map((f) => f.id).sort(), ['a', 'b']);
  assert.ok(T.isLargeText(24, 400) && T.isLargeText(18.66, 700) && !T.isLargeText(18.66, 400));
});

test('motion rules: overshoot, MOT-01 problems, ADR-032 limits, classes and choreography', () => {
  assert.equal(MR.linearOvershoot('linear(0, 0.25 25%, 1.18 60%, 1)').length, 1);
  assert.equal(MR.linearOvershoot('linear(0, 0.5, 1)').length, 0);
  assert.equal(MR.overshootingEasings('ease-out, cubic-bezier(.34,1.56,.64,1)').length, 1);
  assert.ok(MR.isBounceName('bounce-in') && MR.isBounceName('elastic') && !MR.isBounceName('fade-up'));
  assert.equal(MR.transitionProblem('all', 300), 'all');
  assert.equal(MR.transitionProblem('width', 200), 'layout');
  assert.equal(MR.transitionProblem('all', 0), null, 'the default "all 0s" is not a transition');
  assert.equal(MR.transitionProblem('opacity', 200), null);
  // 1280 × 800: translation limits min(200, 426.7) and min(200, 266.7) → 200 px each.
  const big = { vw: 1280, vh: 800 };
  assert.equal(MR.largeDisplacement({ dx: 199, dy: 0, scaleRatio: 1, areaShare: 0, rotation: 0 }, big).large, false);
  assert.equal(MR.largeDisplacement({ dx: 200, dy: 0, scaleRatio: 1, areaShare: 0, rotation: 0 }, big).large, true);
  // 320 × 568: a third of the width (106.7 px) is the horizontal limit.
  assert.equal(MR.largeDisplacement({ dx: 110, dy: 0, scaleRatio: 1, areaShare: 0, rotation: 0 }, { vw: 320, vh: 568 }).large, true);
  assert.equal(MR.largeDisplacement({ dx: 0, dy: 0, scaleRatio: 1.3, areaShare: 0.2, rotation: 0 }, big).large, false, 'small boxes may scale');
  assert.equal(MR.largeDisplacement({ dx: 0, dy: 0, scaleRatio: 1.25, areaShare: 0.3, rotation: 0 }, big).large, true);
  assert.equal(MR.largeDisplacement({ dx: 0, dy: 0, scaleRatio: 1, areaShare: 0, rotation: 90 }, big).large, true);
  const agg = { minTx: 0, maxTx: 0, minTy: -360, maxTy: 0, minCx: 0, maxCx: 300, minCy: 0, maxCy: 0, minS: 1, maxS: 1, minW: 100, maxW: 100, minH: 50, maxH: 50, rotMax: 0 };
  assert.equal(MR.trackRanges(agg, { vw: 1280, vh: 800 }).dx, 0, 'box movement counts only when a layout property animates');
  assert.equal(MR.trackRanges(agg, { layoutAnimated: true, vw: 1280, vh: 800 }).dx, 300);
  assert.equal(MR.trackRanges(agg, { vw: 1280, vh: 800 }).dy, 360);
  assert.equal(MR.motionClass({ infinite: true }), 'continuous');
  assert.equal(MR.ceilingFor('state', 'operate'), 250);
  assert.equal(MR.ceilingFor('entrance', 'persuade'), 500);
  assert.equal(MR.ceilingFor('entrance', 'persuade', { focalDeclared: true }), 800);
  assert.equal(MR.ceilingFor('continuous', 'operate'), null);
  assert.equal(MR.sequenceAllowance('operate'), 0);
  assert.equal(MR.sequenceAllowance('persuade'), 1);
  assert.equal(MR.sequenceAllowance('experience', 2), 2);
  const info = { 1: { page: true }, 2: { firstViewport: true, section: 10 }, 3: { section: 20 }, 4: { section: 20 }, 5: { section: 30 }, 6: { progress: true } };
  const g = MR.groupSequences(
    [
      { node: 1, phase: 'load', props: ['opacity'] },
      { node: 2, phase: 'load', props: ['transform'] },
      { node: 3, phase: 'settle', props: ['opacity', 'transform'] },
      { node: 4, phase: 'settle', props: ['opacity'] },
      { node: 5, phase: 'settle', props: ['transform'] },
      { node: 6, phase: 'load', props: ['transform'] },
      { node: 5, phase: 'recipe', props: ['transform'] },
      { node: 5, phase: 'settle', props: ['background-color'] },
    ],
    (id) => info[id],
  );
  assert.equal(g.pageFades, 1);
  assert.deepEqual(g.sequences.map((s) => s.kind), ['load', 'scroll', 'scroll']);
});

test('vitals: CLS session windows exclude input-driven shifts; the init script passes webVitals by name', () => {
  assert.equal(clsFromShifts([{ value: 0.05, t: 100 }, { value: 0.04, t: 600 }, { value: 0.2, t: 4000, input: true }]), 0.09);
  assert.equal(clsFromShifts([{ value: 0.05, t: 100 }, { value: 0.04, t: 2000 }, { value: 0.06, t: 2500 }]), 0.1);
  assert.equal(clsFromShifts([]), 0);
  assert.match(vitalsInitScript('var webVitals={};'), /typeof webVitals !== 'undefined' \? webVitals/);
});

test('cross-page helpers: names compare without case or current-page markers; shared order', () => {
  assert.equal(comparableName('Orders (current page)'), comparableName('orders'));
  assert.notEqual(comparableName('Your orders'), comparableName('Orders'));
  assert.equal(sharedOrderDiffers(['a', 'b', 'c'], ['a', 'x', 'b', 'c']), null);
  assert.deepEqual(sharedOrderDiffers(['a', 'b', 'c'], ['c', 'a', 'b']), { reference: ['a', 'b', 'c'], other: ['c', 'a', 'b'] });
  assert.equal(sharedOrderDiffers(['a'], ['a']), null);
});

test('network guard, context options and auth walls', () => {
  for (const u of ['http://localhost:3000/', 'http://127.0.0.1:8080/x', 'http://[::1]:5173/', 'http://app.localhost/', 'file:///tmp/x.html']) assert.ok(isLocalUrl(u), u);
  for (const u of ['https://example.com/', 'http://10.0.0.5/', 'http://localhost.example.com/']) assert.ok(!isLocalUrl(u), u);
  assert.equal(contextOptions({ preference: 'default' }).reducedMotion, 'no-preference');
  assert.equal(contextOptions({ preference: 'reduced-motion' }).reducedMotion, 'reduce');
  assert.equal(contextOptions({ preference: 'default', reducedMotion: 'reduce' }).reducedMotion, 'reduce');
  assert.equal(contextOptions({ width: 375 }).hasTouch, true);
  assert.equal(contextOptions({ width: 1280 }).hasTouch, false);
  assert.ok(authWallFor('http://h/dashboard', 'http://h/login.html?next=/dashboard'));
  assert.ok(authWallFor('http://h/a', 'http://h/sso/start'));
  assert.equal(authWallFor('http://h/login', 'http://h/login'), null, 'a requested sign-in route is not a wall');
  assert.equal(authWallFor('http://h/a', 'http://h/authors'), null);
  const a = pageState({ routeCfg: { path: '/' }, stateCfg: null, width: 320 });
  const b = pageState({ routeCfg: { path: '/' }, stateCfg: null, width: 320, reducedMotion: 'reduce' });
  assert.notEqual(a.key, b.key, 'a forced-reduce state never shares a page with a default one');
});

test('capture bookkeeping: merge by file, count images only; URL slugs; widths', () => {
  const m1 = mergeCaptures(null, [{ kind: 'still', file: 'a.png', valid: false }, { kind: 'aria', file: 'a.yml', valid: true }]);
  assert.deepEqual([m1.valid, m1.invalid], [0, 1]);
  const m2 = mergeCaptures(m1, [{ kind: 'still', file: 'a.png', valid: true }, { kind: 'cvd', file: 'b.png', valid: true }]);
  assert.deepEqual([m2.valid, m2.invalid, m2.items.length], [2, 0, 3]);
  assert.equal(urlSlug('file:///Users/x/.ui-evaluator/directions/d1/specimen.html'), 'd1-specimen-html');
  assert.equal(urlSlug('http://localhost:5173/shipments?id=4'), 'shipments-id-4');
  assert.deepEqual(parseWidths('1280,320,320'), [320, 1280]);
  assert.throws(() => parseWidths('100'), /between 200 and 4000/);
});

test('audit: --checks aliases and --quick', async () => {
  // Imported here: the audit command loads the check registry, which other work may be editing.
  const { resolveChecks } = await lib('commands/audit.mjs');
  assert.deepEqual(resolveChecks({ checks: ['reflow'] }), ['layout']);
  assert.deepEqual(resolveChecks({ quick: true }), ['routes', 'console', 'axe', 'keyboard', 'layout', 'contrast', 'census', 'tells', 'copy']);
  assert.throws(() => resolveChecks({ checks: ['nope'] }), /unknown check/);
  assert.throws(() => resolveChecks({ checks: ['axe'], quick: true }), /either --quick or --checks/);
});

test('png: pixel diff with changed regions; crops are clamped', async (t) => {
  const img = await loadImageDeps(null);
  if (!img) return t.skip('pngjs/pixelmatch not installed');
  const mk = (w, h, paint) => {
    const data = new Uint8Array(w * h * 4).fill(255);
    for (const [x, y] of paint) data.set([0, 0, 0, 255], (y * w + x) * 4);
    return { width: w, height: h, data };
  };
  const a = mk(64, 64, []);
  const pts = [];
  for (let y = 40; y < 48; y += 1) for (let x = 40; x < 48; x += 1) pts.push([x, y]);
  const b = mk(64, 64, pts);
  const d = diffImages(img.pixelmatch, a, b, { threshold: 0.1 });
  assert.equal(d.changed, 64);
  const regions = changedRegions(d.mask, d.width, d.height, { cell: 16 });
  assert.equal(regions.length, 1);
  assert.deepEqual(regions[0], [32, 32, 16, 16]);
  const taller = diffImages(img.pixelmatch, a, mk(64, 70, []));
  assert.equal(taller.changed, 64 * 6, 'rows beyond the overlap count as changed');
  assert.equal(cropImage(a, [60, 60, 20, 20]).width, 4);
  assert.equal(cropImage(a, [100, 100, 4, 4]), null);
});

// --- uie diff: identity, instances, coverage and register updates (ADR-030, ADR-033) --------------------------

const toolHit = (rule, route, selector, extra = {}) => ({
  title: `${rule} at ${selector}`,
  description: 'deterministic test hit',
  problem_type: 'single_location',
  criteria: [{ kind: 'rule', id: rule, primary: true }],
  locations: [{ route, state: 'default', selector, viewport: { width: 1280, height: 800 }, theme: 'light', ...extra }],
  found_by: [{ role: 'tool', method: 'tool', check: rule.startsWith('MOT') ? 'motion' : 'contrast', engine: { name: 'uie', version: 't' } }],
  evidence_level: 'E1',
  severity: { source: 'rule', value: 3 },
  status: 'confirmed',
});

const ranChecks = (overrides = {}) => ({
  contrast: { state: 'ran', partial: false, coverage: { routes: ['/a', '/b'], states: ['/a#default', '/b#default'], widths: [320, 1280], themes: ['light'] } },
  motion: { state: 'ran', partial: false, coverage: { routes: ['/a'], states: ['/a#default'], widths: [1280], themes: ['light'] } },
  ...overrides,
});

test('diff: identity-based sets with k-of-n instances; clears count only under covered scope', () => {
  const base = D.groupHits([toolHit('A11Y-11', '/a', '.x'), toolHit('A11Y-11', '/a', '.y'), toolHit('A11Y-11', '/a', '.z'), toolHit('A11Y-11', '/b', '.q'), toolHit('MOT-01', '/b', '.m')]);
  const run = D.groupHits([toolHit('A11Y-11', '/a', '.x'), toolHit('A11Y-11', '/a', '.new'), toolHit('A11Y-12', '/a', '.border')]);
  const d = D.diffFindings(base, run, { runChecks: ranChecks(), runJudged: false });
  assert.equal(d.persisting.length, 1);
  const p = d.persisting[0];
  assert.deepEqual([p.base_instances, p.run_instances, p.cleared_instances, p.introduced_instances.length, p.partially_fixed], [3, 2, 2, 1, true]);
  assert.match(p.note, /2 of 3 instance\(s\) cleared/);
  assert.deepEqual(d.cleared.map((c) => `${c.criterion}${c.routes}`), ['A11Y-11/b']);
  assert.deepEqual(d.cleared_not_rechecked.map((c) => c.criterion), ['MOT-01'], 'motion did not cover /b');
  assert.match(d.cleared_not_rechecked[0].reason, /did not cover route \/b/);
  assert.deepEqual(d.introduced.map((c) => c.criterion), ['A11Y-12']);
  const partial = D.diffFindings(base, run, { runChecks: ranChecks({ contrast: { state: 'ran', partial: true, coverage: {} } }) });
  assert.equal(partial.cleared.length, 0, 'a partial re-run proves nothing');
  const failed = D.diffFindings(base, [], { runChecks: { contrast: { state: 'failed' } } });
  assert.equal(failed.cleared.length, 0);
  assert.ok(failed.cleared_not_rechecked.every((c) => /failed|did not run/.test(c.reason)));
});

test('diff: a merge of tool findings alone never clears judged findings', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-diffrun-'));
  fs.writeFileSync(path.join(dir, 'merged.json'), JSON.stringify({ findings: D.groupHits([toolHit('A11Y-11', '/a', '.x')]) }));
  const rf = D.loadRunFindings(dir);
  assert.equal(rf.source, 'merged.json');
  assert.equal(rf.judged, false);
  const judgedBase = { id: 'F-7', title: 'Error text is vague', description: 'a judged finding', problem_type: 'single_location', criteria: [{ kind: 'heuristic', id: 'H9', primary: true }], locations: [{ route: '/a', state: 'default', selector: '#err' }], found_by: [{ role: 'heuristic-evaluator', method: 'HE' }], status: 'open' };
  const d = D.diffFindings([judgedBase], rf.findings, { runChecks: ranChecks(), runJudged: rf.judged });
  assert.equal(d.cleared.length, 0);
  assert.equal(d.judged_not_rechecked.length, 1);
  fs.mkdirSync(path.join(dir, 'evaluators'));
  fs.writeFileSync(path.join(dir, 'evaluators', 'he-1.json'), JSON.stringify({ role: 'heuristic-evaluator', agent: 'he-1', candidates: [] }));
  assert.equal(D.loadRunFindings(dir).judged, true, 'once a judged role evaluated the run, absence means cleared');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('diff: instance keys ignore width, keep generic selectors apart by snippet', () => {
  assert.equal(D.instanceKey({ state: 'default', selector: '.a:nth-of-type(2)', viewport: { width: 320 } }), D.instanceKey({ state: 'default', selector: '.a:nth-of-type(3)', viewport: { width: 1280 } }));
  assert.notEqual(D.instanceKey({ selector: 'html', snippet: 'TypeError: x' }), D.instanceKey({ selector: 'html', snippet: 'ReferenceError: y' }));
});

test('diff: register updates — fixed + cleared + covered → verified; uncovered → unchanged; persisting → reopened', () => {
  const base = D.groupHits([toolHit('A11Y-11', '/a', '.x'), toolHit('A11Y-11', '/b', '.q'), toolHit('MOT-01', '/b', '.m'), toolHit('A11Y-12', '/a', '.border')]);
  const run = D.groupHits([toolHit('A11Y-12', '/a', '.border')]);
  const d = D.diffFindings(base, run, { runChecks: ranChecks() });
  const reg = { findings: base.map((f, i) => ({ ...f, id: `F-${i + 1}`, status: 'open', status_history: [] })) };
  for (const f of reg.findings) setStatus(f, 'fixed', { by: 'fixer' });
  const judged = { id: 'F-9', title: 'Judged', description: 'a judged finding', problem_type: 'single_location', criteria: [{ kind: 'heuristic', id: 'H1', primary: true }], found_by: [{ role: 'heuristic-evaluator', method: 'HE' }], status: 'fixed', severity: { source: 'raters', mean: 2 } };
  reg.findings.push(judged);
  const { changes, unchanged } = D.applyDiffToRegister(reg, d, { base: 'b1', run: 'r2' });
  const status = Object.fromEntries(reg.findings.map((f) => [f.id, f.status]));
  assert.equal(status['F-1'], 'verified', 'A11Y-11 /a cleared under covered scope');
  assert.equal(status['F-2'], 'verified', 'A11Y-11 /b cleared under covered scope');
  assert.equal(status['F-3'], 'fixed', 'MOT-01 /b cleared but motion did not cover /b');
  assert.equal(status['F-4'], 'reopened', 'A11Y-12 /a persists');
  assert.equal(status['F-9'], 'fixed', 'judged findings are never verified by diff');
  assert.deepEqual(reg.findings[0].verification, { check: 'contrast', run: 'r2', base: 'b1', result: 'cleared', at: reg.findings[0].verification.at });
  assert.equal(reg.findings[0].status_history.at(-1).by, 'uie diff');
  assert.equal(changes.length, 3);
  assert.equal(unchanged.length, 1);
  assert.match(unchanged[0].reason, /scope not re-checked/);
});

test('diff: ARIA losses and line diff', () => {
  const a = '- banner:\n  - navigation "Main":\n    - link "Orders":\n      - /url: /orders\n- main:\n  - heading "Orders" [level=1]\n  - button "Save"\n';
  const b = '- main:\n  - heading "Shipments" [level=1]\n  - button\n';
  const lost = D.ariaLosses(a, b);
  assert.deepEqual(lost.landmarks.map((x) => x.role).sort(), ['banner', 'navigation']);
  assert.deepEqual(lost.headings.map((x) => x.name), ['Orders']);
  assert.deepEqual(lost.names.map((x) => `${x.role}:${x.name}`), ['button:Save']);
  assert.ok(lost.roles.some((r) => r.role === 'link' && r.after === 0));
  const ld = D.lineDiff('a\nb\nc', 'a\nc\nd');
  assert.deepEqual([ld.added, ld.removed], [1, 1]);
  assert.ok(ld.lines.includes('- b') && ld.lines.includes('+ d'));
  assert.equal(D.parseAria('- text: hello\n- /url: /x\n- img "Logo"').length, 2);
});

test('doctor: smoke comparison reports fired, missed, pending and crashed', () => {
  const res = {
    axe: { entry: { state: 'ran' }, hits: [{ criteria: [{ id: 'A11Y-01' }] }, { criteria: [{ id: 'A11Y-99' }] }] },
    layout: { entry: { state: 'ran' }, hits: [{ criteria: [{ id: 'FUN-05' }] }] },
    states: { entry: { state: 'skipped', skip_reason: 'not implemented yet' }, hits: [] },
    motion: { entry: { state: 'failed', errors: ['check crashed: boom'] }, hits: [] },
    cvd: { entry: { state: 'ran', valid: 3 }, hits: [] },
  };
  const exp = { axe: { criteria: ['A11Y-01'] }, layout: { criteria: ['FUN-05', 'A11Y-07'] }, states: { criteria: ['CMP-01'], owner: 'interaction-checks' }, motion: { criteria: ['MOT-01'] }, cvd: { criteria: [], fields: { valid: 5 } } };
  const c = compareSmoke(res, exp);
  assert.deepEqual(c.missed.sort(), ['cvd:valid', 'layout:A11Y-07', 'motion:MOT-01']);
  assert.deepEqual(c.pending, ['states:CMP-01']);
  assert.deepEqual(c.crashed, ['motion']);
  assert.deepEqual(c.rows.find((r) => r.check === 'axe').extra, ['A11Y-99']);
});

test('TYP-03: inline text inside a wrapping heading follows the heading limit, not the body limit', { timeout: 120000 }, async (t) => {
  const { browserAvailable, runChecks, FIX } = await import('./helpers.mjs');
  const avail = await browserAvailable();
  if (!avail.ok) {
    t.skip(avail.reason);
    return;
  }
  const { byCheck } = await runChecks({ deps: avail.deps, files: ['index.html'], checks: ['census'], widths: [375], dir: `${FIX}/heading-context`, mode: 'read' });
  const typ03 = byCheck('census').hits.filter((h) => h.criteria[0].id === 'TYP-03');
  assert.ok(!typ03.some((h) => /Saturday|Next repair/.test(h.title)), `the heading and its <time> are judged as a heading: ${typ03.map((h) => h.title).join(' | ')}`);
  assert.ok(typ03.some((h) => /set far too tight/.test(h.title)), 'tight body text still fails');
});

test('FUN-04: an email or phone link with no target is broken; share links and real targets are not', { timeout: 120000 }, async (t) => {
  const { browserAvailable, runChecks, FIX } = await import('./helpers.mjs');
  const avail = await browserAvailable();
  if (!avail.ok) {
    t.skip(avail.reason);
    return;
  }
  const { byCheck } = await runChecks({ deps: avail.deps, files: ['index.html'], checks: ['media'], widths: [1280], dir: `${FIX}/contact-links`, mode: 'read' });
  const titles = byCheck('media').hits.filter((h) => h.criteria[0].id === 'FUN-04').map((h) => h.title).sort();
  assert.deepEqual(titles, ['Email link has no address: "Send booking by email"', 'Phone link has no number: "Call us"']);
});

test('LAY-04: an aria-hidden display glyph does not set the size basis for a container measured to its visible text', { timeout: 120000 }, async (t) => {
  const { browserAvailable, runChecks, FIX } = await import('./helpers.mjs');
  const avail = await browserAvailable();
  if (!avail.ok) {
    t.skip(avail.reason);
    return;
  }
  const { byCheck } = await runChecks({ deps: avail.deps, files: ['index.html'], checks: ['census'], widths: [375], dir: `${FIX}/hidden-glyph`, mode: 'operate' });
  const lay04 = byCheck('census').hits.filter((h) => h.criteria[0].id === 'LAY-04');
  assert.deepEqual(lay04.map((h) => h.title), [], 'the 16 px padding suits the 20 px visible text');
});

test('TYP-15 / I18N-12: stranded last words and single CJK characters are reported as advisories', { timeout: 120000 }, async (t) => {
  const { browserAvailable, runChecks, FIX } = await import('./helpers.mjs');
  const avail = await browserAvailable();
  if (!avail.ok) {
    t.skip(avail.reason);
    return;
  }
  const { byCheck } = await runChecks({ deps: avail.deps, files: ['index.html'], checks: ['census'], widths: [1280], dir: `${FIX}/stranded`, mode: 'read' });
  const hits = byCheck('census').hits.filter((h) => ['TYP-15', 'I18N-12'].includes(h.criteria[0].id));
  const by = (id) => hits.filter((h) => h.locations[0].selector.includes(id)).map((h) => h.criteria[0].id);
  assert.deepEqual(by('zh-bad'), ['I18N-12']);
  assert.deepEqual(by('zh-ok'), []);
  assert.deepEqual(by('en-bad'), ['TYP-15']);
  assert.deepEqual(by('en-ok'), []);
  assert.deepEqual(by('en-long'), [], 'a long paragraph may end with one word');
  assert.ok(hits.every((h) => h.advisory), 'advisory only');
});

test('remote assets load as for a visitor, other remote requests stay blocked, and asset network failures are not FUN-02', { timeout: 120000 }, async (t) => {
  const { browserAvailable, runChecks, FIX } = await import('./helpers.mjs');
  const avail = await browserAvailable();
  if (!avail.ok) {
    t.skip(avail.reason);
    return;
  }
  const { byCheck, session } = await runChecks({ deps: avail.deps, files: ['index.html'], checks: ['console'], widths: [1280], dir: `${FIX}/remote-assets`, mode: 'read' });
  assert.ok(session.assetHosts.includes('fonts.example.invalid'), `asset hosts: ${session.assetHosts.join(', ')}`);
  assert.ok(session.assetHosts.includes('cdn.example.invalid'));
  assert.ok(session.blocked.some((u) => u.startsWith('https://api.example.invalid/')), 'the POST to a remote service is blocked');
  assert.equal(byCheck('console').hits.filter((h) => h.criteria[0].id === 'FUN-02').length, 0);
});

test('forms: an empty submission clears prefilled values, and a success note is not read as an error', { timeout: 120000 }, async (t) => {
  const { browserAvailable, runChecks, FIX } = await import('./helpers.mjs');
  const avail = await browserAvailable();
  if (!avail.ok) {
    t.skip(avail.reason);
    return;
  }
  const { byCheck } = await runChecks({ deps: avail.deps, files: ['index.html'], checks: ['forms'], widths: [1280], dir: `${FIX}/prefilled-form`, mode: 'operate' });
  const r = byCheck('forms');
  const a13 = r.hits.filter((h) => h.criteria[0].id === 'A11Y-13').map((h) => h.title);
  assert.deepEqual(a13, [], `no focus or error-text hit on a form that handles both: ${a13.join(' | ')}`);
});

test('placeholder identities are named as the page writes them (SLP-13)', () => {
  const list = [...wordList('en', 'placeholder_identities'), ...wordList('zh', 'placeholder_identities')];
  assert.deepEqual(matchedTexts(list, 'Not sure? Email a photo to repaircafe@example.org and we will reply.'), ['repaircafe@example.org']);
  assert.deepEqual(matchedTexts(list, 'Write to info@example.net or visit www.example.com'), ['info@example.net', 'www.example.com']);
  assert.deepEqual(matchedTexts(list, 'Our volunteers fix toasters for free.'), []);
});
