// Browser tests of the motion (MOT-01…07) and vitals (FUN-07, FUN-08) checks, the reviewed cvd and cross-page
// checks, the auth-wall guard, and the precision page: good.html must produce no gate-level hit in any of the
// fifteen DOM checks. Skips cleanly without Chromium or the runtime packages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { browserAvailable, runChecks, ROOT } from './helpers.mjs';

const env = await browserAvailable();
const skip = env.ok ? false : env.reason;
const gateLevel = (hits) => hits.filter((h) => h.gate && !h.advisory);
const ids = (hits) => [...new Set(hits.map((h) => h.criteria[0].id))].sort();

test('motion: every MOT criterion fires on the defect page, with measurements', { skip }, async () => {
  const r = await runChecks({ deps: env.deps, files: ['mv-motion-bad.html'], checks: ['motion'], preferences: ['default', 'reduced-motion'] });
  const res = r.byCheck('motion');
  assert.equal(res.entry.state, 'ran');
  assert.deepEqual(ids(res.hits), ['MOT-01', 'MOT-02', 'MOT-03', 'MOT-04', 'MOT-05', 'MOT-06', 'MOT-07']);
  const mot02 = res.hits.filter((h) => h.criteria[0].id === 'MOT-02');
  assert.ok(mot02.some((h) => h.evidence[0].value.duration_ms === 900 && h.evidence[0].value.ceiling_ms === 250), 'a 900 ms state transition against the 250 ms Operate ceiling');
  const mot04 = res.hits.find((h) => h.criteria[0].id === 'MOT-04');
  assert.equal(mot04.locations[0].preference, 'reduced-motion');
  assert.equal(res.entry.sequences[0].allowed, 0);
  assert.ok(res.entry.no_reduce_path.includes('rise'));
  assert.ok(!res.hits.some((h) => h.criteria[0].id.startsWith('SLP-')), 'tells stay with the tells check');
  fs.rmSync(r.runDir, { recursive: true, force: true });
});

test('motion: under reduced motion, measured travel and scroll-linked movement fail MOT-04 (ADR-032)', { skip }, async () => {
  const r = await runChecks({ deps: env.deps, files: ['mv-motion-reduce.html'], checks: ['motion'], mode: 'persuade', preferences: ['default', 'reduced-motion'] });
  const res = r.byCheck('motion');
  const mot04 = res.hits.filter((h) => h.criteria[0].id === 'MOT-04');
  const travel = mot04.find((h) => /Large-displacement/.test(h.title));
  assert.ok(travel, 'the 360 px entrance is measured under reduce');
  assert.ok(travel.evidence[0].value.dy >= 200, `measured ${travel.evidence[0].value.dy} px`);
  assert.ok(mot04.some((h) => /Scroll-linked/.test(h.title)), 'JS parallax is scroll-linked movement');
  assert.equal(res.entry.reduced_motion.large_displacement, 1);
  assert.ok(!ids(res.hits).includes('MOT-07'), 'one load sequence is within the Persuade allowance');
  fs.rmSync(r.runDir, { recursive: true, force: true });
});

test('motion: restrained motion with a reduced-motion path produces no hit', { skip }, async () => {
  const r = await runChecks({ deps: env.deps, files: ['mv-motion-good.html'], checks: ['motion'], preferences: ['default', 'reduced-motion'] });
  const res = r.byCheck('motion');
  assert.equal(res.entry.state, 'ran');
  assert.deepEqual(res.hits.map((h) => h.title), []);
  assert.equal(res.entry.reduced_motion.allowed_progress, 1, 'the spinner becomes an opacity pulse under reduce');
  fs.rmSync(r.runDir, { recursive: true, force: true });
});

test('vitals: CLS above 0.1 fails FUN-07; a 350 ms handler is an advisory FUN-08; attribution is recorded', { skip }, async () => {
  const r = await runChecks({ deps: env.deps, files: ['mv-vitals-bad.html'], checks: ['vitals'], widths: [375, 1280] });
  const res = r.byCheck('vitals');
  assert.equal(res.entry.state, 'ran');
  const fun07 = res.hits.find((h) => h.criteria[0].id === 'FUN-07');
  const fun08 = res.hits.find((h) => h.criteria[0].id === 'FUN-08');
  assert.ok(fun07 && fun07.gate === 'G1' && !fun07.advisory);
  assert.ok(fun07.evidence[0].value.cls > 0.1);
  assert.ok(fun07.evidence[0].value.sources.length >= 1, 'the largest shift sources are named');
  assert.ok(fun08 && fun08.advisory === true, 'FUN-08 never fails the gate');
  const m = res.entry.metrics[0];
  assert.ok(m.inp_ms > 200 && m.lcp_ms > 0 && m.lcp_element);
  assert.equal(m.interaction.selector, '#more');
  assert.match(res.entry.caveat, /advisory/);
  fs.rmSync(r.runDir, { recursive: true, force: true });
});

test('vitals: a stable page passes, and every metric is measured rather than assumed', { skip }, async () => {
  const r = await runChecks({ deps: env.deps, files: ['mv-vitals-good.html'], checks: ['vitals'], widths: [375, 1280] });
  const res = r.byCheck('vitals');
  assert.deepEqual(res.hits, []);
  for (const m of res.entry.metrics) {
    assert.equal(m.cls, 0);
    assert.ok(Number.isFinite(m.lcp_ms) && Number.isFinite(m.inp_ms));
    assert.deepEqual(m.unavailable, {});
  }
  fs.rmSync(r.runDir, { recursive: true, force: true });
});

test('cvd and cross-page: captures for the auditor; navigation order and names compared across routes', { skip }, async () => {
  const dir = path.join(ROOT, 'skills/ui-evaluator/assets/fixtures');
  const r = await runChecks({ deps: env.deps, dir, files: ['known-bad.html', 'known-bad.html?variant=b'], checks: ['cvd', 'cross-page'], g2: ['forced-colors'] });
  const cvd = r.byCheck('cvd');
  assert.equal(cvd.entry.state, 'ran');
  assert.deepEqual(cvd.hits, [], 'A11Y-19 is judged by the auditor; the check only captures');
  assert.ok(cvd.entry.valid >= 10, `${cvd.entry.valid} valid captures`);
  assert.ok(cvd.entry.captures.some((c) => c.preference === 'cvd-achromatopsia') && cvd.entry.captures.some((c) => c.preference === 'forced-colors'));
  for (const c of cvd.entry.captures) assert.ok(fs.existsSync(path.join(r.runDir, c.file)), c.file);
  const cp = r.byCheck('cross-page');
  const sc = cp.hits.flatMap((h) => h.criteria.filter((c) => c.kind === 'wcag').map((c) => c.id));
  assert.ok(sc.includes('3.2.3') && sc.includes('3.2.4'), sc.join(','));
  fs.rmSync(r.runDir, { recursive: true, force: true });
  const ok = await runChecks({ deps: env.deps, files: ['cmd-home.html', 'cmd-about.html'], checks: ['cross-page'] });
  assert.deepEqual(ok.byCheck('cross-page').hits, [], 'consistent chrome produces no hit');
  fs.rmSync(ok.runDir, { recursive: true, force: true });
  const one = await runChecks({ deps: env.deps, files: ['cmd-home.html'], checks: ['cross-page'] });
  assert.equal(one.byCheck('cross-page').entry.state, 'ran');
  assert.match(one.byCheck('cross-page').entry.not_applicable, /one route/);
  fs.rmSync(one.runDir, { recursive: true, force: true });
});

test('auth wall: a route that redirects to a sign-in page is never audited in its place (LOOP-012)', { skip }, async () => {
  const r = await runChecks({ deps: env.deps, files: ['cmd-private.html', 'cmd-home.html'], checks: ['routes', 'contrast'], serverRoutes: { '/login.html': { status: 200, type: 'text/html; charset=utf-8', body: '<!doctype html><html lang="en"><title>Sign in</title><h1>Sign in</h1><p style="color:#bbb">Use your account.</p></html>' } } });
  const routes = r.byCheck('routes');
  assert.deepEqual(routes.entry.auth_walls.map((w) => w.route), ['/cmd-private.html']);
  assert.match(routes.entry.auth_walls[0].final_url, /\/login\.html/);
  assert.equal(routes.entry.partial, true);
  assert.ok(!routes.hits.some((h) => h.criteria[0].id === 'FUN-01'), 'an auth wall is not a FUN-01 failure');
  const contrast = r.byCheck('contrast');
  assert.ok(!contrast.hits.some((h) => h.locations[0].route === '/cmd-private.html'), 'the sign-in page was not evaluated');
  assert.equal(contrast.entry.partial, true);
  assert.ok(contrast.entry.errors.some((e) => /auth_wall: \/cmd-private\.html redirected to \/login\.html/.test(e)));
  fs.rmSync(r.runDir, { recursive: true, force: true });
});

test('precision: good.html produces no gate-level hit in the fifteen DOM checks', { skip, timeout: 240000 }, async () => {
  const checks = ['routes', 'console', 'media', 'axe', 'layout', 'targets', 'contrast', 'census', 'tells', 'copy', 'lang', 'i18n', 'palette', 'motion', 'vitals'];
  const r = await runChecks({ deps: env.deps, files: ['good.html'], checks, widths: [320, 768, 1280], themes: ['light', 'dark'], preferences: ['default', 'reduced-motion'] });
  for (const name of checks) {
    const res = r.byCheck(name);
    assert.equal(res.entry.state, 'ran', `${name}: ${res.entry.state} ${JSON.stringify(res.entry.errors)}`);
    assert.equal(res.entry.partial, false, `${name} partial: ${JSON.stringify(res.entry.notes)}`);
    assert.deepEqual(gateLevel(res.hits).map((h) => `${h.criteria[0].id} ${h.title}`), [], name);
  }
  fs.rmSync(r.runDir, { recursive: true, force: true });
});
