#!/usr/bin/env node
// Audit one static site in-process and capture it, for an annotated README image:
//   node tools/readme-media/audit-capture.mjs <site-dir> <out-prefix> [--width 1280] [--mode persuade] [--max-height <px>]
// Writes <out-prefix>-hits.json (every hit with its rule, title and bounding box on the home page) and
// <out-prefix>-<width>.png (a full-page capture at the same width, taken right after the audit, cut at --max-height).
// The audit's checks see the live clock, so a page that prints dates must have its boxes and its capture taken
// together, on the same day.
// Needs the browser runtime (`node skills/ui-evaluator/scripts/uie.mjs doctor --install`).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SKILL_DIR, parseArgs, usage, writeJson } from '../bench/lib.mjs';

const { pos, opts } = parseArgs(process.argv.slice(2));
const [siteDir, prefix] = pos;
if (!siteDir || !prefix || !fs.existsSync(path.join(siteDir, 'index.html'))) usage('usage: node tools/readme-media/audit-capture.mjs <site-dir with index.html> <out-prefix> [--width 1280] [--mode persuade] [--max-height <px>]', opts.help);
const width = Number(opts.width || 1280);
const lib = (p) => import(pathToFileURL(path.join(SKILL_DIR, 'scripts/lib', p)).href);
const { loadBrowserDeps } = await lib('deps.mjs');
const { serveStatic } = await lib('browser/static-server.mjs');
const { AuditRunner, selectChecks } = await lib('browser/runner.mjs');
const deps = await loadBrowserDeps({});
const srv = await serveStatic(path.resolve(siteDir));
const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-audit-capture-'));
try {
  const config = {
    app: { base_url: srv.url, timeout_ms: 20000 },
    routes: [{ path: '/', surface: 'home', mode: opts.mode || 'persuade', states: [{ name: 'default', actions: [] }] }],
    matrix: { widths: [width], height: 800, device_scale_factor: 1, themes: ['light'], preferences: ['default'] },
    locales: { list: ['en'] },
  };
  const checks = selectChecks({ checks: ['tells', 'contrast', 'census', 'targets', 'copy', 'axe'] });
  const runner = new AuditRunner({ root: null, config, runDir, deps, checks, allowRemote: true, designText: '', productText: '', noSourceSearch: true });
  const out = await runner.run();
  const hits = [];
  for (const [check, res] of Object.entries(out.results)) {
    for (const h of res.hits || []) {
      const loc = (h.locations || [])[0] || {};
      hits.push({ check, id: h.criteria?.[0]?.id, title: h.title, gate: h.gate, advisory: !!h.advisory, bbox: loc.bbox || null, selector: loc.selector || null });
    }
  }
  writeJson(`${prefix}-hits.json`, hits);
  const browser = await deps.playwright.chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await page.goto(`${srv.url}/`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const full = await page.evaluate(() => document.documentElement.scrollHeight);
    const height = opts['max-height'] ? Math.min(full, Number(opts['max-height'])) : full;
    await page.screenshot({ path: `${prefix}-${width}.png`, fullPage: true, clip: { x: 0, y: 0, width, height }, animations: 'disabled' });
  } finally {
    await browser.close();
  }
  console.log(`${hits.length} hits, ${hits.filter((h) => h.bbox).length} with a box; wrote ${prefix}-hits.json and ${prefix}-${width}.png`);
} finally {
  await srv.close();
  fs.rmSync(runDir, { recursive: true, force: true });
}
