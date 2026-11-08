// The macrostructure that tools/bench/variety.mjs reads from a rendered page: chrome, a hero inside the page header,
// a div-soup container expanded into its blocks, and each block typed by what it holds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { browserAvailable, lib } from './helpers.mjs';
import { outlineInPage } from '../../tools/bench/variety.mjs';

const ORDER = ['h1', 'heading', 'cols2', 'cols3', 'form', 'cards', 'items', 'list', 'table', 'faq', 'deflist', 'quote', 'media', 'action', 'text'];

const PAGE = `<!doctype html><html><head><style>
  body { margin: 0; font: 16px/1.5 sans-serif; }
  .skip { position: absolute; top: -40px; left: 0; }
  .site-header { min-height: 520px; }
  .hero { display: flex; gap: 24px; } .hero > * { flex: 1; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .block { min-height: 300px; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .cta { display: inline-block; padding: 10px 16px; background: #1d4ed8; color: #fff; }
</style></head><body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="top"><a href="/">Repair cafe</a><nav><ul><li><a href="/">Home</a></li><li><a href="/visit">Visit</a></li><li><a href="/fix">Fix</a></li></ul></nav></div>
    <div class="hero"><div><h1>Repair cafe</h1><p>Bring it broken, take it home fixed.</p><a class="cta" href="#book">Book a slot</a></div>
      <svg width="400" height="240" role="img" aria-label="A kettle"><rect width="400" height="240"/></svg></div>
  </header>
  <div class="page"><div id="main">
    <div class="block"><h2>What we fix</h2><div class="grid">
      <article class="card">Kettles, toasters and lamps</article><article class="card">Bicycles, punctures and brakes</article><article class="card">Clothes, zips and hems</article>
    </div></div>
    <div class="block"><h2>Book a slot</h2><form><label>Name <input name="n"></label><label>Item <input name="i"></label><button>Book</button></form></div>
    <div class="block"><h2>Questions</h2><details><summary>Is it free?</summary><p>Yes, donations welcome.</p></details></div>
    <p class="sr">Hidden note for screen readers</p>
    <div hidden><h2>Not rendered</h2></div>
  </div></div>
  <footer><p>First Saturday, 10 till 1</p></footer>
</body></html>`;

test('the outline: chrome, the hero in the header, expanded containers and typed blocks', { timeout: 60000 }, async (t) => {
  const avail = await browserAvailable();
  if (!avail.ok) {
    t.skip(avail.reason);
    return;
  }
  const { launchBrowser } = await lib('browser/launch.mjs');
  const browser = await launchBrowser(avail.deps);
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.setContent(PAGE);
    const o = await page.evaluate(outlineInPage, ORDER);
    assert.deepEqual(o.sections, ['nav', 'h1+cols2+media+action', 'heading+cards', 'heading+form+action', 'heading+faq', 'footer']);
    assert.deepEqual(o.components, ['nav', 'h1', 'cols2', 'media', 'action', 'heading', 'cards', 'heading', 'form', 'action', 'heading', 'faq', 'footer']);
    // A short page header is chrome, and the same cards stacked one under another are items, not cards.
    await page.setContent(PAGE.replace('min-height: 520px', 'min-height: 0').replace('<h1>Repair cafe</h1>', '<p>Repair cafe</p>').replace('repeat(3, 1fr)', '1fr'));
    const o2 = await page.evaluate(outlineInPage, ORDER);
    assert.equal(o2.sections[0], 'header');
    assert.ok(o2.sections.includes('heading+items'), o2.sections.join(' > '));
  } finally {
    await browser.close();
  }
});
