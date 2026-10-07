// End-to-end through the CLI on a temporary project whose config points at fixture pages served from a child
// process: run new → capture (routes, --url, an auth wall) → audit (selected checks, --quick) → journey (passing and
// failing) → probe → findings merge/promote/set fixed → fix the page → second run → diff (dry run, then applied:
// the fixed finding becomes verified) → gates. Every JSON artefact is checked against its schema.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { browserAvailable, serveInChild, makeProject, latestRun, readJsonl, lib, FIX } from './helpers.mjs';

const env = await browserAvailable();
const skip = env.ok ? false : env.reason;
const { validate, loadSchema } = await lib('schema.mjs');

const valid = (schema, doc, label) => {
  const res = validate(loadSchema(schema), doc);
  assert.ok(res.valid, `${label} is not a valid ${schema}: ${JSON.stringify(res.errors.slice(0, 3))}`);
};

const SIGN_IN = { '/login.html': { status: 200, type: 'text/html; charset=utf-8', body: '<!doctype html><html lang="en"><title>Sign in</title><main><h1>Sign in</h1></main></html>' } };

function journey(id, title, criticality, actions, success) {
  return {
    id,
    title,
    criticality,
    frequency: 'frequent',
    persona: { group: 'Depot staff who plan collections' },
    goal: 'Make sure a waiting shipment has a carrier today',
    scenario: 'Shipment SH-1042 is waiting on the dock and needs a carrier before noon.',
    start_state: { url: '/cmd-home.html', viewport_width: 1280 },
    success_condition: success,
    correct_actions: actions,
  };
}

test('commands: capture, audit, journey, probe, diff and gates through the CLI', { skip, timeout: 300000 }, async (t) => {
  const p = makeProject('uie-cmd-');
  const site = path.join(p.root, 'site');
  fs.mkdirSync(site);
  for (const f of ['cmd-home.html', 'cmd-about.html', 'cmd-private.html', 'good.html']) fs.copyFileSync(path.join(FIX, f), path.join(site, f));
  const srv = await serveInChild(site, SIGN_IN);
  t.after(async () => {
    await srv.stop();
    p.cleanup();
  });
  assert.equal(p.uie('init', '--quiet').code, 0);
  const config = (routes) => ({
    schema_version: 1,
    app: { start: null, base_url: srv.url, timeout_ms: 20000 },
    routes: routes.map(([p2, surface, mode]) => ({ path: p2, surface, mode, states: [{ name: 'default', actions: [] }] })),
    matrix: { widths: [320, 1280], height: 800, device_scale_factor: 1, themes: ['light'], preferences: ['default'], g2_preferences: [] },
    locales: { list: ['en'], default: 'en' },
    target_level: 'L1',
  });
  const PUBLIC = [['/cmd-home.html', 'desk', 'operate'], ['/cmd-about.html', 'about', 'read']];
  const assign = [
    { action: 'fill', target: 'label=Shipment number', value: 'SH-1042' },
    { action: 'click', target: 'role=button[name="Assign carrier"]' },
    { action: 'expect', target: 'role=status', text: 'Carrier assigned' },
  ];
  p.write('.ui-evaluator/journeys/assign-carrier.json', journey('assign-carrier', 'Assign a carrier to a shipment', 'critical', assign, { all: [{ target: 'role=status', text: 'Carrier assigned to SH-1042' }, { url: 'cmd-home' }] }));
  p.write('.ui-evaluator/journeys/reschedule.json', journey('reschedule', 'Reschedule a collection', 'peripheral', [{ action: 'click', target: 'role=button[name="Reschedule"]' }], { all: [{ text: 'Rescheduled' }] }));

  await t.test('auth wall: a route that redirects to sign-in is reported, never captured or audited in its place', () => {
    p.write('.ui-evaluator/config.json', config([...PUBLIC, ['/cmd-private.html', 'account', 'operate']]));
    assert.equal(p.uie('run', 'new', '--label', 'walls').code, 0);
    const run = latestRun(p.root);
    const wall = p.uie('capture', '--route', '/cmd-private.html', '--widths', '320', '--no-cvd');
    assert.equal(wall.code, 2, 'an auth-walled route yields no valid capture');
    assert.match(wall.out, /\/cmd-private\.html redirected to a sign-in page\. Add a state recipe or journey start_state/);
    const a = p.uie('audit', '--checks', 'routes,contrast', '--json');
    assert.equal(a.code, 2, a.out);
    assert.deepEqual(a.json().auth_walls.map((w) => w.route), ['/cmd-private.html']);
    const checks = p.read(path.relative(p.root, path.join(run.dir, 'checks.json')));
    assert.deepEqual(checks.auth_walls.map((w) => w.route), ['/cmd-private.html']);
    assert.deepEqual(checks.checks.routes.auth_walls.map((w) => w.route), ['/cmd-private.html']);
    assert.equal(checks.checks.contrast.partial, true, 'the walled route was not evaluated');
    assert.deepEqual(p.read(path.relative(p.root, path.join(run.dir, 'manifest.json'))).scope.auth_walls.map((w) => w.route), ['/cmd-private.html']);
    p.write('.ui-evaluator/config.json', config(PUBLIC));
  });

  await t.test('run new and capture: §8.6 paths, ARIA and DOM evidence, manifest captures', () => {
    assert.equal(p.uie('run', 'new', '--label', 'base').code, 0);
    const base = latestRun(p.root);
    const c = p.uie('capture', '--json');
    assert.equal(c.code, 0, c.err || c.out);
    const res = c.json();
    assert.equal(res.invalid.length, 0);
    for (const rel of ['screens/cmd-home-html/default/320-light.png', 'screens/cmd-home-html/default/1280-light.png', 'screens/cmd-home-html/default/1280-light-cvd-deuteranopia.png', 'aria/cmd-about-html/default/320-light.yml', 'dom/cmd-home-html/default/1280-light.json']) {
      assert.ok(fs.existsSync(path.join(base.dir, 'evidence', rel)), rel);
    }
    const man = p.read(path.relative(p.root, path.join(base.dir, 'manifest.json')));
    valid('manifest', man, 'manifest.json');
    assert.ok(man.captures.valid >= 12 && man.captures.invalid === 0, JSON.stringify({ valid: man.captures.valid, invalid: man.captures.invalid }));
    assert.ok(man.tools.playwright && man.tools.uie);
    const url = p.uie('capture', '--url', pathToFileURL(path.join(site, 'good.html')).href, '--widths', '1280', '--no-cvd', '--json');
    assert.equal(url.code, 0, url.err || url.out);
    assert.ok(fs.existsSync(path.join(base.dir, 'evidence/screens/site-good-html/default/1280-light.png')), 'capture --url writes screens/<slug-of-url>/default/');
  });

  await t.test('audit: selected checks, findings in the §8.6 shape, checks.json, exit 2 on gate-level hits', () => {
    const a = p.uie('audit', '--checks', 'routes,console,contrast,cross-page,motion', '--json');
    assert.equal(a.code, 2, a.err || a.out);
    const run = latestRun(p.root);
    const checks = p.read(path.relative(p.root, path.join(run.dir, 'checks.json')));
    for (const c of ['routes', 'console', 'contrast', 'cross-page', 'motion']) assert.equal(checks.checks[c].state, 'ran', c);
    assert.equal(checks.checks.contrast.partial, false);
    const hits = readJsonl(path.join(run.dir, 'tool-findings.jsonl'));
    assert.ok(hits.some((h) => h.criteria[0].id === 'A11Y-11' && h.locations[0].route === '/cmd-home.html'), 'the seeded 2.3:1 text');
    for (const h of hits) valid('finding', h, `hit ${h.title}`);
    const quick = p.uie('audit', '--quick');
    assert.equal(quick.code, 2, quick.err || quick.out);
    assert.match(quick.out, /keyboard/);
  });

  await t.test('journey: a passing replay, a failing one with a FUN-03 hit, and checks.journeys', () => {
    const ok = p.uie('journey', 'assign-carrier');
    assert.equal(ok.code, 0, ok.err || ok.out);
    const run = latestRun(p.root);
    const rec = p.read(path.relative(p.root, path.join(run.dir, 'journeys/assign-carrier.json')));
    assert.equal(rec.ok, true);
    assert.equal(rec.steps.length, 3);
    assert.ok(rec.steps.every((s) => s.ok && s.screenshot));
    assert.equal(rec.success_condition.mode, 'all');
    const bad = p.uie('journey', 'reschedule', '--timeout', '1500');
    assert.equal(bad.code, 2);
    const hits = readJsonl(path.join(run.dir, 'tool-findings.jsonl')).filter((h) => h.found_by[0].check === 'journeys');
    assert.equal(hits.length, 1);
    assert.equal(hits[0].criteria[0].id, 'FUN-03');
    assert.equal(hits[0].locations[0].journey, 'reschedule');
    valid('finding', hits[0], 'FUN-03 hit');
    const checks = p.read(path.relative(p.root, path.join(run.dir, 'checks.json')));
    assert.equal(checks.checks.journeys.state, 'ran');
    assert.equal(checks.checks.journeys.partial, false, 'the one critical journey was replayed');
    assert.deepEqual(Object.keys(checks.checks.journeys.journeys).sort(), ['assign-carrier', 'reschedule']);
  });

  await t.test('probe: steps, screenshots, ARIA, console and network; remote URLs refused', () => {
    const actions = JSON.stringify([{ action: 'fill', target: 'label=Shipment number', value: 'SH-7' }, { action: 'press', target: 'label=Shipment number', key: 'Enter' }, { action: 'expect', target: 'role=status', text: 'SH-7' }]);
    const pr = p.uie('probe', '--url', '/cmd-home.html', '--actions', actions, '--json');
    assert.equal(pr.code, 0, pr.err || pr.out);
    const out = pr.json();
    const dir = path.join(p.root, out.dir);
    const rec = JSON.parse(fs.readFileSync(path.join(dir, 'probe.json'), 'utf8'));
    assert.equal(rec.steps.length, 3);
    assert.ok(fs.existsSync(path.join(dir, 'final.png')) && fs.existsSync(path.join(dir, 'aria.yml')) && fs.existsSync(path.join(dir, 'step-01.png')));
    assert.ok(Array.isArray(rec.console.errors) && Array.isArray(rec.network.failed) && rec.timing.total_ms > 0);
    assert.match(out.dir, /probes\/1$/);
    const failing = p.uie('probe', '--url', '/cmd-home.html', '--actions', '[{"action":"expect","text":"No such text"}]', '--timeout', '1500');
    assert.equal(failing.code, 2);
    // The browser's history: Back and Forward move between pages; with nothing to go to, the step fails.
    const history = JSON.stringify([{ action: 'goto', url: '/cmd-about.html' }, { action: 'back' }, { action: 'expect', url: 'cmd-home\\.html$' }, { action: 'forward' }, { action: 'expect', url: 'cmd-about\\.html$' }, { action: 'reload' }]);
    const hist = p.uie('probe', '--url', '/cmd-home.html', '--actions', history, '--json');
    assert.equal(hist.code, 0, hist.err || hist.out);
    assert.equal(p.uie('probe', '--url', '/cmd-home.html', '--actions', '[{"action":"back"}]', '--timeout', '1500').code, 2, 'nothing before the start page');
    assert.equal(p.uie('probe', '--url', '/cmd-home.html', '--actions', '[{"action":"forward"}]', '--timeout', '1500').code, 2, 'nothing after it');
    const remote = p.uie('probe', '--url', 'https://example.com/', '--actions', '[]');
    assert.equal(remote.code, 1);
    assert.match(remote.err, /only localhost/);
  });

  await t.test('diff: a fixed finding cleared under covered scope becomes verified; others stay or reopen', () => {
    const base = latestRun(p.root);
    assert.equal(p.uie('findings', 'merge').code, 0);
    assert.equal(p.uie('findings', 'promote').code, 0);
    const reg = p.read('.ui-evaluator/findings.json');
    const contrast = reg.findings.find((f) => f.criteria[0].id === 'A11Y-11' && f.locations.every((l) => l.route === '/cmd-home.html'));
    const journeyF = reg.findings.find((f) => f.criteria[0].id === 'FUN-03');
    assert.ok(contrast && journeyF, JSON.stringify(reg.findings.map((f) => [f.id, f.criteria[0].id, f.status, [...new Set(f.locations.map((l) => l.route))]])));
    for (const f of [contrast, journeyF]) assert.equal(p.uie('findings', 'set', f.id, '--status', 'fixed', '--by', 'fixer').code, 0);
    // The fix: the faint note gets 4.5:1.
    fs.writeFileSync(path.join(site, 'cmd-home.html'), fs.readFileSync(path.join(site, 'cmd-home.html'), 'utf8').replace('.faint { color: #aaaaaa; }', '.faint { color: #57606a; }'));
    assert.equal(p.uie('run', 'new', '--label', 'verify').code, 0);
    const verify = latestRun(p.root);
    const a = p.uie('audit', '--checks', 'routes,console,contrast,cross-page,motion');
    assert.equal(a.code, 0, a.out);
    assert.equal(p.uie('capture', '--no-cvd').code, 0);
    const dry = p.uie('diff', base.id, verify.id, '--findings', '--no-apply', '--json');
    assert.equal(dry.code, 0, dry.err || dry.out);
    assert.equal(p.read('.ui-evaluator/findings.json').findings.find((f) => f.id === contrast.id).status, 'fixed', '--no-apply leaves the register alone');
    const d = p.uie('diff', base.id, verify.id, '--json');
    assert.equal(d.code, 0, d.err || d.out);
    const res = d.json();
    assert.ok(res.findings.cleared >= 1);
    const after = p.read('.ui-evaluator/findings.json');
    const c2 = after.findings.find((f) => f.id === contrast.id);
    assert.equal(c2.status, 'verified');
    assert.equal(c2.status_history.at(-1).by, 'uie diff');
    assert.equal(c2.verification.result, 'cleared');
    assert.equal(c2.verification.check, 'contrast');
    assert.equal(after.findings.find((f) => f.id === journeyF.id).status, 'fixed', 'journeys were not replayed: cleared, but scope not re-checked');
    const fd = p.read(path.relative(p.root, path.join(verify.dir, 'diff/findings.json')));
    assert.ok(fd.cleared_not_rechecked.some((e) => e.criterion === 'FUN-03'));
    for (const f of ['diff/visual.json', 'diff/aria.json', 'diff/summary.md']) assert.ok(fs.existsSync(path.join(verify.dir, f)), f);
    const vis = p.read(path.relative(p.root, path.join(verify.dir, 'diff/visual.json')));
    const home = vis.captures.find((c) => c.file === 'cmd-home-html/default/1280-light.png');
    assert.ok(home && home.changed_px > 0 && home.regions.length >= 1, 'the recoloured note changed pixels');
    assert.deepEqual(home.collateral, [], 'the only change lies inside the fixed finding\'s box');
    assert.ok(fs.existsSync(path.join(verify.dir, home.diff_image)));
    const about = vis.captures.find((c) => c.file === 'cmd-about-html/default/1280-light.png');
    assert.equal(about.changed_px, 0, 'an untouched page does not change');
    const aria = p.read(path.relative(p.root, path.join(verify.dir, 'diff/aria.json')));
    assert.equal(aria.regressions, 0);
    assert.match(fs.readFileSync(path.join(verify.dir, 'diff/summary.md'), 'utf8'), /## Findings \(identity-based\)/);
    valid('finding', c2, 'verified register finding');
  });

  await t.test('gates: computed from the run artefacts, schema-valid, and never pass without the doctor', () => {
    const g = p.uie('gates', '--json');
    assert.equal(g.code, 2);
    const gates = g.json();
    valid('gates', gates, 'gates.json');
    assert.equal(gates.criteria['EVD-02'].state, 'not_run', 'the doctor did not run in this project');
    assert.equal(gates.criteria['A11Y-11'].state, 'pass', 'the fixed contrast no longer fires in the verify run');
    assert.equal(gates.criteria['MOT-01'].state, 'pass');
    assert.equal(gates.criteria['FUN-03'].state, 'not_run', 'the second run replayed no journey');
  });
});
