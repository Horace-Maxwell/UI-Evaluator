// The deterministic capture recipe (ARCHITECTURE §9.1; TOOL-25): fixed viewport and DPR, reduced motion for stills,
// animations disabled, caret hidden, clock frozen, fonts explicitly loaded then document.fonts.ready, dynamic regions
// masked, full-page captures from the top, and a validity check (EVD-03). Also ARIA snapshots and the DOM inventory.
import { ensureHelpers } from './inpage.mjs';
import { decodePng, imageStats } from './png.mjs';

/** Fallback frozen clock, used only when no run date is known. */
export const FIXED_TIME = new Date('2026-01-15T10:00:00.000Z');

/**
 * The frozen clock for a run: 10:00 UTC on the day the run was opened, so every capture in a run shows the same
 * moment and dates on the page stay plausible (a clock months in the past makes "next session" dates look wrong to
 * reviewers). `config.capture.clock` overrides it with an ISO date-time, e.g. to pin a date-dependent state.
 */
export function runClock(config, runCreatedAt) {
  const pinned = config?.capture?.clock;
  if (pinned && !Number.isNaN(Date.parse(pinned))) return new Date(pinned);
  const day = runCreatedAt && !Number.isNaN(Date.parse(runCreatedAt)) ? new Date(runCreatedAt) : new Date();
  return new Date(`${day.toISOString().slice(0, 10)}T10:00:00.000Z`);
}

/** Load every face the visible text uses, then wait for document.fonts.ready (bounded). */
export async function loadFonts(page, { timeout = 6000 } = {}) {
  await ensureHelpers(page);
  return page.evaluate(async (ms) => {
    const U = window.__uie;
    const specs = new Set();
    for (const el of U.textElements(document.body, { limit: 3000 })) {
      const s = getComputedStyle(el);
      specs.add(`${s.fontStyle} ${s.fontWeight} 16px ${s.fontFamily}`);
      if (specs.size >= 60) break;
    }
    const wait = (p) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
    await wait(Promise.all([...specs].map((f) => document.fonts.load(f).catch(() => null))));
    await wait(document.fonts.ready);
    const failed = [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family);
    const loading = [...document.fonts].filter((f) => f.status === 'loading').map((f) => f.family);
    return { status: document.fonts.status, failed: [...new Set(failed)], loading: [...new Set(loading)], specs: specs.size };
  }, timeout);
}

/** Scroll through the page (lazy content, reveal-on-scroll), then return to the top. */
export async function scrollThrough(page, { maxSteps = 40, pause = 60 } = {}) {
  await page.evaluate(async ({ maxSteps: n, pause: p }) => {
    const step = Math.max(200, Math.floor(innerHeight * 0.8));
    const max = Math.min(document.documentElement.scrollHeight, step * n);
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, p));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, p));
    window.scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, { maxSteps, pause });
}

/** Bring a freshly loaded page to a measurable resting state. */
export async function settlePage(page, { scroll = true, networkIdleMs = 3000 } = {}) {
  await page.waitForLoadState('networkidle', { timeout: networkIdleMs }).catch(() => {});
  if (scroll) await scrollThrough(page).catch(() => {});
  const fonts = await loadFonts(page).catch((err) => ({ status: 'unknown', failed: [], error: err.message }));
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  return { fonts };
}

/**
 * Take a still and check its validity (EVD-03).
 * @returns {Promise<{buffer:Buffer, valid:boolean, reasons:string[], stats:object, width:number, height:number}>}
 */
export async function captureStill(page, { PNG, fullPage = true, masks = [], dsf = 1, fonts = null, path: file } = {}) {
  const scrollY = await page.evaluate(() => {
    window.scrollTo(0, 0);
    return window.scrollY;
  });
  const maskLocators = [];
  for (const sel of masks) {
    try {
      maskLocators.push(page.locator(sel));
    } catch {
      /* ignore bad mask selectors here; reported by config validation */
    }
  }
  const buffer = await page.screenshot({
    fullPage,
    animations: 'disabled',
    caret: 'hide',
    scale: 'device',
    mask: maskLocators,
    maskColor: '#FF00FF',
    ...(file ? { path: file } : {}),
  });
  const vp = page.viewportSize() || { width: 0, height: 0 };
  const reasons = [];
  let stats = null;
  let width = 0;
  let height = 0;
  try {
    const img = decodePng(PNG, buffer);
    width = img.width;
    height = img.height;
    stats = imageStats(img);
    if (stats.luminanceSd < 1.5 || stats.dominantShare > 0.995) reasons.push(`blank or near-uniform capture (luminance sd ${stats.luminanceSd}, dominant colour ${Math.round(stats.dominantShare * 1000) / 10}%)`);
  } catch (err) {
    reasons.push(`capture could not be decoded: ${err.message}`);
  }
  const expectW = Math.round(vp.width * dsf);
  // A full-page capture is as wide as the page's scrollable width (an overflowing page is wider than the viewport,
  // which the layout check reports); it is never narrower.
  if (width && (fullPage ? width < expectW - 1 : Math.abs(width - expectW) > 1)) reasons.push(`width ${width} px does not match viewport ${vp.width} × DPR ${dsf}`);
  if (height && height < Math.round(vp.height * dsf) - 1 && fullPage) reasons.push(`height ${height} px < viewport height`);
  if (scrollY !== 0) reasons.push(`capture did not start at the top (scrollY ${scrollY})`);
  if (fonts && fonts.failed && fonts.failed.length) reasons.push(`fonts failed to load: ${fonts.failed.join(', ')}`);
  if (fonts && fonts.loading && fonts.loading.length) reasons.push(`fonts still loading: ${fonts.loading.join(', ')}`);
  return { buffer, valid: reasons.length === 0, reasons, stats, width, height };
}

/** ARIA snapshot (YAML) of the whole page. */
export async function ariaSnapshot(page, { timeout = 15000 } = {}) {
  return page.locator('body').ariaSnapshot({ timeout });
}

/** Interactive inventory: selector, role, accessible name, box (document coordinates) and source hint per control. */
export async function domInventory(page) {
  await ensureHelpers(page);
  return page.evaluate(() => {
    const U = window.__uie;
    const out = [];
    const all = document.querySelectorAll('a[href],area[href],button,input:not([type=hidden]),select,textarea,summary,[role],[tabindex],[onclick],[contenteditable]');
    for (const el of all) {
      if (out.length >= 2000) break;
      const role = U.role(el);
      const interactive = U.isInteractive(el) || el.hasAttribute('onclick') || (el.hasAttribute('tabindex') && Number(el.getAttribute('tabindex')) >= 0);
      if (!interactive) continue;
      if (!U.isVisible(el)) continue;
      out.push({
        selector: U.selector(el),
        role,
        name: U.accName(el).slice(0, 160),
        tag: el.tagName.toLowerCase(),
        bbox: U.docRect(el),
        tabbable: U.tabbable(el),
        disabled: U.isDisabled(el) || undefined,
        insp: U.inspPath(el) || undefined,
      });
    }
    return out;
  });
}
