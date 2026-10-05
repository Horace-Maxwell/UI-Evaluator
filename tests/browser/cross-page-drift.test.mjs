// SLP-45 cross-page system drift (soft tell): the pure decision rule, and the check on three served pages where the
// third uses another body family and another control radius.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { systemDrift } from '../../skills/ui-evaluator/scripts/lib/browser/checks/cross-page.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.resolve(HERE, '../../skills/ui-evaluator/scripts/lib');
const page = (route, families, radii) => ({ ps: { route }, system: { families, chars: Object.values(families).reduce((a, b) => a + b, 0), radii } });

test('systemDrift flags the route that departs from the majority, and only that one', () => {
  const pages = [page('/', { georgia: 900 }, { 6: 4 }), page('/members', { georgia: 700 }, { 6: 3 }), page('/scores', { arial: 800 }, { 20: 3 })];
  const d = systemDrift(pages);
  assert.deepEqual(d.map((x) => `${x.kind}:${x.ps.route}`).sort(), ['family:/scores', 'radius:/scores']);
});

test('systemDrift stays quiet on declared families, small radius noise and thin pages', () => {
  const pages = [page('/', { georgia: 900 }, { 6: 4 }), page('/members', { georgia: 700 }, { 8: 3 }), page('/scores', { arial: 800 }, { 6: 3 })];
  assert.deepEqual(systemDrift(pages, { declaredFamilies: ['Arial'] }), [], 'a family DESIGN.md declares is a role, not drift; 2 px radius noise is ignored');
  assert.deepEqual(systemDrift([page('/', { georgia: 900 }, {}), page('/x', { arial: 50 }, {})]), [], 'pages with under 200 characters are not compared');
  assert.equal(systemDrift([page('/', { georgia: 900 }, { 6: 3 }), page('/x', { georgia: 900 }, { 20: 3 })]).length, 0, 'two routes are too few to call a radius majority');
});

test('the cross-page check reports SLP-45 on served pages', { timeout: 120000 }, async (t) => {
  let deps;
  try {
    deps = await (await import(path.join(LIB, 'deps.mjs'))).loadBrowserDeps({});
  } catch (err) {
    if (process.env.UIE_REQUIRE_BROWSER === '1') throw err;
    t.skip('browser runtime not installed');
    return;
  }
  const { serveStatic } = await import(path.join(LIB, 'browser/static-server.mjs'));
  const { AuditRunner, selectChecks } = await import(path.join(LIB, 'browser/runner.mjs'));
  const srv = await serveStatic(path.resolve(HERE, '../fixtures/browser/drift'));
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-drift-'));
  t.after(async () => {
    await srv.close();
    fs.rmSync(runDir, { recursive: true, force: true });
  });
  const config = {
    app: { base_url: srv.url, timeout_ms: 20000 },
    routes: ['/a.html', '/b.html', '/c.html'].map((p) => ({ path: p, surface: p, mode: 'read', states: [{ name: 'default', actions: [] }] })),
    matrix: { widths: [1280], height: 800, device_scale_factor: 1, themes: ['light'], preferences: ['default'] },
    locales: { list: ['en'] },
  };
  const r = new AuditRunner({ root: null, config, runDir, deps, checks: selectChecks({ checks: ['cross-page'] }), log: () => {}, noSourceSearch: true });
  const out = await r.run();
  const hits = out.results['cross-page'].hits.filter((h) => h.criteria[0].id === 'SLP-45');
  assert.deepEqual(hits.map((h) => `${h.locations[0].route}:${/family/.test(h.title) ? 'family' : 'radius'}`).sort(), ['/c.html:family', '/c.html:radius']);
  assert.equal(hits[0].gate, 'G4');
  assert.ok(!hits[0].advisory, 'a soft tell counts toward G4 and needs a disposition');
  assert.equal(out.results['cross-page'].hits.filter((h) => h.criteria[0].id === 'A11Y-18').length, 0, 'the shared navigation is consistent');
});
