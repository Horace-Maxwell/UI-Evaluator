// keyboard — the Tab and Shift+Tab walk (08 §4.3 S3; TOOL-05/06/07) over every page state at the G2 widths in the
// first theme. Criteria:
//   A11Y-03 — reachability (reached set vs the clickable set: native controls, tabindex, interactive roles, click
//             handlers, pointer cursor with a click listener; 2.1.1), no trap (focus stops moving, or cycles inside a
//             non-modal region; Escape is tried first; 2.1.2), focus order (clear backward visual jumps only; 2.4.3),
//             no context change on focus (navigation, new window, modal opened by focus alone; 3.2.1);
//   A11Y-04 — every tab stop changes pixels: focused vs blurred crop of the box + 4 px, pixelmatch threshold 0 (2.4.7);
//             a change confined to a small enclosing container (≤ 640 × 480, e.g. a :focus-within card) also counts,
//             and visually hidden controls are judged on their label and parent;
//   A11Y-05 — nine elementFromPoint samples per stop in both directions; fails when none lands on the element and
//             author content paints over it (2.4.11);
//   CMP-02  — focus indicator quality, advisory until calibrated: changed pixels with ≥ 3:1 change contrast cover at
//             least a 2 px perimeter of the box, and the focus crop differs from the forced-hover crop.
// Other themes are walked only when their focus styling differs: their focus-visible styles are compared with the
// first theme's, and where they differ every focusable is diffed with :focus-visible forced through CDP.
import { ensureHelpers } from '../inpage.mjs';
import { ensureFocusLib, NO_SMOOTH_SCROLL_CSS, WalkTracker, clearInversions, focusChangeMetrics, indicatorProblems, changedPixels, clipAround, unionRects } from '../focus.mjs';
import { openCdp, nodeIdFor, forceState } from '../cdp.mjs';
import { slug } from '../../util/time.mjs';
import { pageGuard } from '../interact.mjs';
import { round } from '../thresholds.mjs';

export const mode = 'standalone';
export const openOptions = { bare: true };
export const criteria = ['A11Y-03', 'A11Y-04', 'A11Y-05', 'CMP-02'];
export const summary = 'Tab and Shift+Tab walk: reachability, traps, order, focus visibility diff, focus obscured, context change on focus; focus indicator quality (advisory)';

export const MAX_STOPS = 200;
const MARGIN = 8;
const CLICK_EVENTS = new Set(['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'dblclick']);

const label = (o) => (o.name ? `"${String(o.name).slice(0, 40)}"` : o.text ? `${o.tag || 'element'} "${String(o.text).slice(0, 40)}"` : String(o.selector || o.tag || 'element').slice(0, 60));
const keyOf = (s) => String(s.id);
const noHash = (u) => String(u || '').replace(/#.*$/, '');

async function shot(page, clip) {
  return page.screenshot({ clip, animations: 'disabled', caret: 'hide', scale: 'css' });
}

async function stopInfo(page, userOpened) {
  return page.evaluate((o) => window.__uieFocus.stop(o), { userOpened });
}

/** Restore focus after a blurred capture; popups and navigations started by the second focus are suppressed. */
async function refocus(pg, id) {
  return pg.page.evaluate((i) => window.__uieFocus.refocus(i), id).catch(() => false);
}

export async function run(ctx) {
  const stats = { stops: 0, unreachable: 0, traps: 0, invisible: 0, obscured: 0, order: 0, context_changes: 0, indicator_advisory: 0, incomplete: [], walks: 0, frames: 0 };
  const signatures = new Map();
  const guard = pageGuard(ctx);
  for await (const pg of ctx.pages(ctx.states({ widths: 'g2', themes: 'first' }))) {
    await guard(pg.ps, () => walkPage(ctx, pg, stats, signatures));
  }
  guard.finish();
  if (ctx.scope.themes.length > 1) await otherThemes(ctx, stats, signatures);
  ctx.note(`walks cap at ${MAX_STOPS} stops per direction; each stop: focused vs blurred crop (box + ${MARGIN} px, changes counted within box + 4 px) with pixelmatch threshold 0, caret hidden, transitions completed`);
  ctx.note('A11Y-03 order uses the clear-inversion heuristic: only a jump to a stop entirely above within the same column, or entirely before within the same row, counts; stops in fixed or sticky layers and dialogs are skipped (2.4.3 meaningful-sequence cases beyond this go to the auditor)');
  ctx.note('clickable set = native controls, tabindex ≥ 0, interactive ARIA roles, onclick attributes/properties, React or Vue click props, and own pointer cursor with a click listener (CDP); listeners delegated to a root are not attributable');
  ctx.note('activation of each stop with Enter/Space is not scripted here; keyboard operability of custom widgets is left to `uie probe` and the accessibility auditor');
  if (stats.frames) ctx.note(`${stats.frames} tab stop(s) were inside iframes: walked through, but not diffed or sampled (another document)`);
  ctx.record({
    stops: stats.stops,
    unreachable: stats.unreachable,
    traps: stats.traps,
    invisible: stats.invisible,
    obscured: stats.obscured,
    order_inversions: stats.order,
    context_changes: stats.context_changes,
    indicator_advisory: stats.indicator_advisory,
    walks: stats.walks,
    max_stops: MAX_STOPS,
    incomplete_walks: stats.incomplete.slice(0, 20),
  });
  return [];
}

async function walkPage(ctx, pg, stats, signatures) {
  const { ps, page } = pg;
  const userOpened = ((ps.stateCfg && ps.stateCfg.actions) || []).length > 0;
  await page.addStyleTag({ content: NO_SMOOTH_SCROLL_CSS }).catch(() => {});
  await ensureHelpers(page);
  await ensureFocusLib(page);
  const inv = await page.evaluate(() => window.__uieFocus.inventory());
  const byId = new Map(inv.items.map((i) => [i.id, i]));
  const hits = [];
  const evidenceBase = `keyboard/${ps.slug}/${slug(ps.state, 40) || 'default'}/${ps.width}-${ps.theme}`;
  let cdp = null;
  const getCdp = async () => {
    if (!cdp) cdp = await openCdp(page);
    return cdp;
  };

  // Context-change watchers (3.2.1): navigations (Navigation API) and window.open calls are attributed in-page to
  // the focused stop, navigations are cancelled where the browser allows, popups are closed, and a navigation that
  // could not be cancelled ends the walk.
  const events = { nav: [], popups: [] };
  const startUrl = page.url();
  const onNav = (f) => {
    if (f === page.mainFrame() && noHash(f.url()) !== noHash(startUrl)) events.nav.push(f.url());
  };
  const onPopup = (p) => {
    events.popups.push(p.url());
    p.close().catch(() => {});
  };
  page.on('framenavigated', onNav);
  page.on('popup', onPopup);
  await page.evaluate(() => {
    const F = window.__uieFocus;
    F.hookNav(true);
    F.drainNavs();
    F.walking = true;
  }).catch(() => {});
  const sig = signatures.get(`${ps.route}#${ps.state}`) || new Map();
  signatures.set(`${ps.route}#${ps.state}`, sig);

  const start = await stopInfo(page, userOpened);
  const startKey = start.body ? null : keyOf(start);
  const forward = new WalkTracker({ startKey, cap: MAX_STOPS });
  const forwardStops = [];
  const evaluated = new Set();
  let ended = null;
  let navigated = false;
  let trapped = false;
  let lastModals = start.modals || [];
  let lastUrl = noHash(start.url || startUrl);
  stats.walks += 1;

  const contextChange = (s) => {
    const wins = (s.navs || []).filter((n) => n.window);
    const navs = (s.navs || []).filter((n) => !n.window && noHash(n.url) !== noHash(s.url));
    const newModals = (s.modals || []).filter((m) => !lastModals.includes(m));
    lastModals = s.modals || [];
    const urlNow = noHash(s.url || '');
    const pushed = urlNow && urlNow !== lastUrl;
    lastUrl = urlNow || lastUrl;
    let what = null;
    if (navs.length) what = `started a navigation to ${navs[navs.length - 1].url}${navs[navs.length - 1].canceled ? ' (cancelled by the audit)' : ''}`;
    else if (pushed) what = `changed the URL to ${s.url}`;
    else if (wins.length) what = `opened a new window (${wins[0].url})`;
    else if (newModals.length && !s.body) what = 'opened a modal dialog';
    if (!what || s.body) return;
    stats.context_changes += 1;
    hits.push(ctx.hit({
      rule: 'A11Y-03',
      wcag: ['3.2.1'],
      title: `Focus alone changes context: ${label(s)}`,
      description: `Moving keyboard focus onto ${label(s)} (by Tab, without activating it) ${what}. A change of context must wait for an explicit action such as Enter or a click.`,
      location: ctx.loc(ps, { selector: s.selector, bbox: s.doc, snippet: s.snippet, source: s.source }),
      evidence: [{ type: 'measurement', value: { change: navs.length || pushed ? 'navigation' : wins.length ? 'new window' : 'modal' }, detail: `${what} on focus (Tab walk)` }],
      recommendation: 'Remove navigation, window or dialog opening from focus handlers; trigger it on activation (click, Enter) instead.',
    }));
  };

  // Forward walk: context change, focus visibility diff, obscuring.
  let pending = null;
  let leftDocument = false;
  for (;;) {
    let s = pending;
    pending = null;
    if (!s) {
      await page.keyboard.press('Tab');
      s = await stopInfo(page, userOpened).catch(() => null);
    }
    if (!s || events.nav.length) {
      // The document navigated away (a navigation the browser would not let us cancel).
      ended = { end: 'navigated' };
      navigated = true;
      break;
    }
    if (s.body) {
      if (forwardStops.length) leftDocument = true;
    } else {
      const key = keyOf(s);
      if (!evaluated.has(key) && !forward.seen.has(key)) {
        evaluated.add(key);
        contextChange(s);
        // The first stop after focus left the document starts the sequence again: no reading-order pair spans it.
        if (leftDocument) s.afterWrap = true;
        leftDocument = false;
        forwardStops.push(s);
        stats.stops += 1;
        await focusVisibility(ctx, pg, s, hits, stats, getCdp, evidenceBase, forwardStops.length);
        obscured(ctx, ps, s, 'Tab', hits, stats);
        if (s.fsig && s.selector) sig.set(s.selector, s.fsig);
      }
    }
    if (s.body) contextChange(s);
    let res = forward.push(s.body ? s : { ...s, key: keyOf(s) });
    if (!res) continue;
    // A "cycle" through every tabbable control of the page is the document's own Tab sequence going round (the
    // browser did not report focus leaving the page), not a trap.
    if (res.end === 'cycle' && coversPage(res.members, inv)) res = { end: 'wrapped' };
    if (res.end === 'stuck' || res.end === 'cycle') {
      const escaped = await tryEscape(page, userOpened, res, 'Tab');
      if (escaped) {
        ctx.note(`Escape released focus from a ${res.end === 'stuck' ? 'stuck stop' : 'focus cycle'} on ${ps.route} (${ps.state}); treated as a standard exit, not a trap`);
        pending = escaped;
        continue;
      }
      trapped = true;
      await trapHit(ctx, pg, res, forward, hits, stats, 'Tab');
    }
    if (res.end === 'cap') ctx.partial(`a walk reached the cap of ${MAX_STOPS} stops`);
    ended = res;
    break;
  }

  // Backward walk (Shift+Tab): obscuring when the page scrolls the other way, and traps in reverse.
  const backwardStops = [];
  if (!navigated && ended && ['wrapped', 'modal-cycle'].includes(ended.end)) {
    const cur = await stopInfo(page, userOpened);
    const back = new WalkTracker({ startKey: cur.body ? null : keyOf(cur), cap: MAX_STOPS });
    const seenBack = new Set();
    let pend = null;
    for (;;) {
      let s = pend;
      pend = null;
      if (!s) {
        await page.keyboard.press('Shift+Tab');
        s = await stopInfo(page, userOpened).catch(() => null);
      }
      if (!s || events.nav.length) break;
      if (!s.body) {
        const key = keyOf(s);
        if (!seenBack.has(key)) {
          seenBack.add(key);
          backwardStops.push(s);
          obscured(ctx, ps, s, 'Shift+Tab', hits, stats);
        }
      }
      const res = back.push(s.body ? s : { ...s, key: keyOf(s) });
      if (!res) continue;
      if ((res.end === 'stuck' || res.end === 'cycle') && !trapped) {
        const escaped = await tryEscape(page, userOpened, res, 'Shift+Tab');
        if (escaped) {
          pend = escaped;
          continue;
        }
        await trapHit(ctx, pg, res, back, hits, stats, 'Shift+Tab');
      }
      if (res.end === 'cap') stats.incomplete.push({ page: ps.key, direction: 'Shift+Tab', reason: `cap of ${MAX_STOPS} stops` });
      break;
    }
  } else if (!ended || ended.end !== 'empty') {
    const why = navigated ? 'the page navigated away during the walk' : ended ? ended.end : 'unknown';
    stats.incomplete.push({ page: ps.key, direction: 'Tab', reason: why });
    ctx.partial(`some walks did not complete (${why}); unreached tabbable controls were not judged there`);
  }
  await page.evaluate(() => {
    window.__uieFocus.walking = false;
  }).catch(() => {});

  if (!navigated) {
    const complete = ended && ['wrapped', 'modal-cycle'].includes(ended.end);
    await reachability(ctx, pg, inv, byId, [...forwardStops, ...backwardStops], complete, hits, stats, getCdp);
    order(ctx, ps, forwardStops, byId, hits, stats);
  }
  page.off('framenavigated', onNav);
  page.off('popup', onPopup);
  if (cdp) await cdp.detach().catch(() => {});
  if (!navigated) {
    await page.evaluate(() => {
      window.__uieFocus.blurActive();
      window.scrollTo(0, 0);
    }).catch(() => {});
    await ctx.cropHits(pg, hits.filter((h) => !h.locations[0]?.crop));
  }
  ctx.add(hits);
}

/** True when a cycle visits every visible tabbable control in the page inventory. */
function coversPage(members, inv) {
  const tabbable = (inv.items || []).filter((i) => i.tabbable).map((i) => i.id);
  if (!tabbable.length) return false;
  const ids = new Set((members || []).map((m) => m.id));
  return tabbable.every((id) => ids.has(id));
}

async function tryEscape(page, userOpened, res, key = 'Tab') {
  const members = new Set((res.members || []).map((m) => m.key));
  if (res.key) members.add(res.key);
  await page.keyboard.press('Escape');
  await page.keyboard.press(key);
  const s = await stopInfo(page, userOpened).catch(() => null);
  if (!s || s.body) return null;
  const k = keyOf(s);
  return members.has(k) ? null : s;
}

async function trapHit(ctx, pg, res, tracker, hits, stats, dir = 'Tab') {
  const ps = pg.ps;
  stats.traps += 1;
  if (res.end === 'stuck') {
    const s = tracker.stops[tracker.stops.length - 1] || {};
    hits.push(ctx.hit({
      rule: 'A11Y-03',
      wcag: ['2.1.2'],
      title: `Keyboard trap: focus stops moving at ${label(s)}`,
      description: `Pressing ${dir} repeatedly leaves focus on ${label(s)}, and Escape does not release it; keyboard users cannot move past this point.`,
      location: ctx.loc(ps, { selector: s.selector, bbox: s.doc, snippet: s.snippet, source: s.source }),
      evidence: [{ type: 'measurement', value: { presses: 3, escape: 'no release' }, detail: `focus unchanged after 3 × ${dir} and Escape + ${dir}` }],
      recommendation: 'Do not intercept Tab; if a widget must use Tab (an editor), document an exit key and honour Escape.',
    }));
    return;
  }
  const members = res.members || [];
  const region = await pg.page.evaluate((ids) => {
    const U = window.__uie;
    const els = ids.map((i) => U.el(i)).filter(Boolean);
    if (!els.length) return null;
    let anc = els[0];
    while (anc && !els.every((e) => anc.contains(e))) anc = anc.parentElement;
    if (!anc) return null;
    return { selector: U.selector(anc), bbox: U.docRect(anc), snippet: U.snippet(anc), source: U.sourceOf(anc) };
  }, members.map((m) => m.id)).catch(() => null);
  const s = members[0] || {};
  hits.push(ctx.hit({
    rule: 'A11Y-03',
    wcag: ['2.1.2'],
    title: `Keyboard trap: focus cycles inside ${region ? region.selector.slice(0, 60) : label(s)}`,
    description: `${dir} cycles through ${members.length} stop(s) (${members.slice(0, 4).map(label).join(', ')}${members.length > 4 ? ', …' : ''}) and returns to the first without reaching the rest of the page; the region is not a modal dialog, and Escape does not release focus.`,
    location: ctx.loc(ps, region ? { selector: region.selector, bbox: region.bbox, snippet: region.snippet, source: region.source } : { selector: s.selector, bbox: s.doc, snippet: s.snippet, source: s.source }),
    evidence: [{ type: 'measurement', value: { cycle_length: members.length }, detail: `cycle: ${members.slice(0, 6).map((m) => m.selector).join(' → ')}` }],
    recommendation: 'Only modal dialogs may contain focus; let Tab leave other widgets, and close popups on Escape.',
  }));
}

function obscured(ctx, ps, s, dir, hits, stats) {
  if (!s.sample || !s.visible || !s.sample.obscured) return;
  const by = s.sample.obscurers[0];
  stats.obscured += 1;
  hits.push(ctx.hit({
    rule: 'A11Y-05',
    title: `Focused element hidden behind ${by ? by.selector.slice(0, 50) : 'other content'}: ${label(s)}`,
    description: `When ${label(s)} receives focus (${dir}), none of nine sample points on its box reaches it: ${s.sample.obscurers.map((o) => `${o.selector} (${o.position})`).join(', ')} paints over it, so keyboard users cannot see where they are.`,
    location: ctx.loc(ps, { selector: s.selector, bbox: s.doc, snippet: s.snippet, source: s.source }),
    evidence: [{ type: 'measurement', value: { points_in_view: s.sample.inView, points_on_element: s.sample.self, direction: dir }, detail: `${dir}: 0 of ${s.sample.inView} in-view sample points on the element; obscured by ${by ? by.selector : '?'}` }],
    recommendation: 'Add scroll-padding-top / scroll-padding-bottom equal to the sticky bar height (technique C43), or keep floating layers out of the focus path.',
  }));
}

async function focusVisibility(ctx, pg, s, hits, stats, getCdp, evidenceBase, n) {
  const { ps, page } = pg;
  if (s.frame) {
    stats.frames += 1;
    return;
  }
  // An obscured stop is reported once, under A11Y-05: its indicator may exist under the covering layer.
  if (s.sample && s.sample.obscured) return;
  const region = s.visible ? s.rect : unionRects([s.rect, ...(s.labels || []), s.parent]);
  // Capture the element and its small container, so a :focus-within indicator on a card is seen too.
  const area = unionRects([region, s.container]) || region;
  const clip = region && clipAround(region, MARGIN, s.vw, s.vh) ? clipAround(area, MARGIN, s.vw, s.vh) : null;
  const where = (extra = {}) => ctx.loc(ps, { selector: s.selector, bbox: s.doc, snippet: s.snippet, source: s.source, extra });
  if (!clip) {
    stats.invisible += 1;
    hits.push(ctx.hit({
      rule: 'A11Y-04',
      title: `Focus lands on an element that is not on screen: ${label(s)}`,
      description: `${label(s)} receives keyboard focus but its box (${round(s.rect.x, 0)}, ${round(s.rect.y, 0)}, ${round(s.rect.w, 0)} × ${round(s.rect.h, 0)}) lies outside the viewport even after the browser scrolled to it, so the focus position is invisible.`,
      location: where(),
      evidence: [{ type: 'measurement', value: { changed_px: 0, on_screen: false }, detail: 'focused element entirely outside the viewport' }],
      recommendation: 'Remove off-screen controls from the Tab order (hidden menus: display none or inert), or bring them on screen when focused.',
    }));
    return;
  }
  // CMP-02 is measured only on fully visible, unobstructed stops whose box + 2 px lies inside the crop.
  const cmp02 = !!(s.visible && s.sample && s.sample.inView === 9 && s.sample.self === 9
    && clip.x <= s.rect.x - 2 && clip.y <= s.rect.y - 2 && clip.x + clip.width >= s.rect.x + s.rect.w + 2 && clip.y + clip.height >= s.rect.y + s.rect.h + 2);
  const sigKey = `${s.tag}|${String(s.selector).replace(/:nth-of-type\(\d+\)/g, '')}|${s.fsig || ''}`;
  pg._hoverCrops = pg._hoverCrops || new Map();
  const focused = await shot(page, clip);
  await page.evaluate(() => window.__uieFocus.blurActive());
  const blurred = await shot(page, clip);
  let hovered = null;
  if (cmp02 && !pg._hoverCrops.has(sigKey)) {
    // The hover state is captured unfocused (forced :hover through CDP), once per style signature.
    try {
      const c = await getCdp();
      const nodeId = await nodeIdFor(c, s.id);
      if (nodeId) {
        try {
          await forceState(c, nodeId, ['hover']);
          hovered = await shot(page, clip);
        } finally {
          await forceState(c, nodeId, []).catch(() => {});
        }
      }
    } catch {
      hovered = null;
    }
  }
  await refocus(pg, s.id);
  const box = [region.x - clip.x, region.y - clip.y, region.w, region.h];
  const m = focusChangeMetrics(ctx.deps, focused, blurred, box);
  let onContainer = false;
  if (m.changedInner === 0 && s.container) {
    const c = s.container;
    onContainer = focusChangeMetrics(ctx.deps, focused, blurred, [c.x - clip.x, c.y - clip.y, c.w, c.h]).changedInner > 0;
  }
  if (onContainer) return; // the indicator is drawn on the enclosing card or row (:focus-within): visible
  if (m.changedInner === 0) {
    stats.invisible += 1;
    const fRel = ctx.writeEvidence(`${evidenceBase}/stop-${n}-focused.png`, focused);
    const bRel = ctx.writeEvidence(`${evidenceBase}/stop-${n}-blurred.png`, blurred);
    hits.push(ctx.hit({
      rule: 'A11Y-04',
      title: `No visible focus indicator: ${label(s)}`,
      description: `Tab focus on ${label(s)} changes 0 pixels within its box + 4 px (focused vs blurred crop${s.visible ? '' : ', widened to its label and parent because the control itself is visually hidden'}), so keyboard users cannot see where focus is.`,
      location: where({ crop: fRel }),
      evidence: [
        { type: 'measurement', value: { changed_px: 0, crop: [clip.width, clip.height] }, detail: `focused vs blurred: 0 px changed within box + 4 px (${m.changed} px in the whole crop)` },
        { type: 'screenshot', ref: bRel, detail: 'blurred crop of the same area' },
      ],
      recommendation: 'Give every focusable element a :focus-visible indicator from the focus tokens (e.g. a 2 px outline with offset); never remove outline without a replacement.',
    }));
    return;
  }
  // CMP-02 (advisory until calibrated).
  if (!cmp02) return;
  const problems = indicatorProblems(m);
  // Distinct from hover: decided once per style signature (tag, classes, focus style).
  if (hovered) pg._hoverCrops.set(sigKey, changedPixels(ctx.deps, focused, hovered) === 0);
  const hoverSame = pg._hoverCrops.has(sigKey) ? pg._hoverCrops.get(sigKey) : null;
  if (hoverSame) problems.push('the focused state is pixel-identical to the hover state');
  if (!problems.length) return;
  stats.indicator_advisory += 1;
  hits.push(ctx.hit({
    rule: 'CMP-02',
    title: `Weak focus indicator: ${label(s)}`,
    description: `The focus indicator of ${label(s)} falls below the advisory CMP-02 metric [calibrating]: ${problems.join('; ')}.`,
    location: where(),
    evidence: [{ type: 'measurement', value: { qualifying_px: m.qualifying, perimeter_px: m.perimeterArea, changed_px: m.changed, band_px: m.band, same_as_hover: hoverSame }, detail: problems.join('; ') }],
    recommendation: 'Use a ≥ 2 px ring with ≥ 3:1 contrast against both the component and its surroundings, styled differently from hover (CMP-08).',
  }));
}

async function reachability(ctx, pg, inv, byId, stops, complete, hits, stats, getCdp) {
  const { ps, page } = pg;
  const reached = new Set(stops.map((s) => s.id));
  const closure = new Set(await page.evaluate((ids) => window.__uieFocus.reachedClosure(ids), [...reached]).catch(() => []));
  const reachedGroups = new Set();
  const reachedComposites = new Set();
  const reachedHrefs = new Set();
  const reachedNames = new Set();
  for (const id of reached) {
    const it = byId.get(id);
    const s = stops.find((x) => x.id === id);
    if (it && it.radioGroup) reachedGroups.add(it.radioGroup);
    if (it && it.composite !== null) reachedComposites.add(it.composite);
    if (it && it.href) reachedHrefs.add(it.href);
    const nm = (it ? it.name : s ? s.name : '').trim().toLowerCase();
    if (nm) reachedNames.add(nm);
  }
  for (const id of closure) if (byId.get(id)?.roleAttr && ['tablist', 'toolbar', 'radiogroup', 'menu', 'menubar', 'listbox', 'grid', 'tree', 'treegrid'].includes(byId.get(id).roleAttr)) reachedComposites.add(id);
  const modalOpen = inv.modals.length > 0;
  const vpArea = (ps.width || 1280) * (ps.height || 900);
  const out = [];
  const pointerOnly = [];
  for (const it of inv.items) {
    if (it.disabled || it.inert) continue;
    if (modalOpen && !it.inModal) continue; // background is inert behind an open modal
    if (it.tag === 'iframe' || it.tag === 'frame') continue;
    const managed = it.composite !== null && (reachedComposites.has(it.composite) || it.activedescendant);
    if (it.native || (it.tabindex !== null && it.tabindex >= 0)) {
      if (it.tabbable) {
        if (!complete || reached.has(it.id)) continue;
        if (it.radioGroup && reachedGroups.has(it.radioGroup)) continue;
        if (managed || (it.focusableAncestor !== null && reached.has(it.focusableAncestor))) continue;
        out.push({ it, why: 'is tabbable in the DOM, but a complete Tab walk never reached it', signal: 'skipped' });
      } else if (it.tabindex !== null && it.tabindex < 0 && it.native) {
        if (managed || it.ariaHidden || it.focusableAncestor !== null) continue;
        if (it.href && reachedHrefs.has(it.href)) continue;
        if (it.name && reachedNames.has(it.name.trim().toLowerCase())) continue;
        out.push({ it, why: 'is removed from the Tab order with tabindex="-1" and no reachable control does the same thing', signal: 'tabindex=-1' });
      }
      continue;
    }
    if (it.ariaHidden) continue;
    if (closure.has(it.id) || it.focusableAncestor !== null || managed || it.hasFocusableDescendant) continue;
    if (it.doc[2] * it.doc[3] >= 0.4 * vpArea) continue; // backdrops and other full-screen click-catchers are not controls
    if (it.interactiveRole) {
      if (it.tabindex !== null && it.tabindex < 0 && it.composite !== null) continue;
      out.push({ it, why: `has role="${it.roleAttr}" but cannot receive keyboard focus`, signal: `role=${it.roleAttr}` });
      continue;
    }
    if (it.hint) {
      out.push({ it, why: `responds to clicks (${it.hint}) but cannot receive keyboard focus`, signal: it.hint });
      continue;
    }
    if (it.pointer) pointerOnly.push(it);
  }
  // Pointer-cursor elements count as clickable only with a click listener of their own (CDP).
  if (pointerOnly.length) {
    try {
      const c = await getCdp();
      for (const it of pointerOnly.slice(0, 60)) {
        const { result } = await c.send('Runtime.evaluate', { expression: `window.__uie.el(${Number(it.id)})` });
        if (!result || !result.objectId) continue;
        const { listeners } = await c.send('DOMDebugger.getEventListeners', { objectId: result.objectId, depth: 0 });
        const types = [...new Set((listeners || []).map((l) => l.type).filter((t) => CLICK_EVENTS.has(t)))];
        if (types.length) out.push({ it, why: `shows a pointer cursor and has a ${types.join('/')} listener, but cannot receive keyboard focus`, signal: `pointer cursor + ${types[0]} listener` });
      }
      if (pointerOnly.length > 60) ctx.partial(`more than 60 pointer-cursor elements; only 60 were checked for click listeners on ${ps.route}`);
    } catch (err) {
      ctx.error(`${ps.key}: listener lookup failed: ${String(err.message || err).split('\n')[0]}`);
    }
  }
  for (const { it, why, signal } of out) {
    stats.unreachable += 1;
    hits.push(ctx.hit({
      rule: 'A11Y-03',
      wcag: ['2.1.1'],
      title: `Not reachable by keyboard: ${label(it)}`,
      description: `The ${it.roleAttr || it.tag} ${label(it)} ${why}. People who use a keyboard or switch cannot operate it.`,
      location: ctx.loc(ps, { selector: it.selector, bbox: it.doc, snippet: it.snippet, source: it.source }),
      evidence: [{ type: 'measurement', value: { reached: false, signal }, detail: `${signal}; not in the Tab sequence${complete ? ' (walk complete)' : ''}` }],
      recommendation: it.native ? 'Put the control back in the Tab order (remove tabindex="-1") or give its function a reachable equivalent.' : 'Use a native <button> or <a href> for the control (or add tabindex="0" with Enter/Space handling and a role).',
    }));
  }
}

function order(ctx, ps, stops, byId, hits, stats) {
  const seq = stops.map((s) => {
    const it = byId.get(s.id);
    const skip = s.fixed || (it && it.fixed) || s.modal !== null || s.frame;
    return { s, box: it ? it.first : s.first, full: it ? it.doc : s.doc, skip, rtl: s.dir === 'rtl' };
  });
  const inv = clearInversions(seq).filter((x) => !seq[x.index + 1].s.afterWrap);
  for (const x of inv.slice(0, 10)) {
    const a = seq[x.index].s;
    const b = seq[x.index + 1].s;
    stats.order += 1;
    hits.push(ctx.hit({
      rule: 'A11Y-03',
      wcag: ['2.4.3'],
      title: `Focus order jumps back: ${label(a)} → ${label(b)}`,
      description: `After ${label(a)}, Tab moves to ${label(b)}, which sits ${x.kind === 'upward' ? `${x.dy} px above it in the same column` : `${x.dx} px before it in the same row`}; the focus order does not follow the visual reading order (clear-inversion heuristic).`,
      location: ctx.loc(ps, { selector: b.selector, bbox: b.doc, snippet: b.snippet, source: b.source }),
      evidence: [{ type: 'measurement', value: { kind: x.kind, from: a.selector, to: b.selector }, detail: `${x.kind}: ${a.selector} → ${b.selector}` }],
      recommendation: 'Fix the order in the DOM (not with positive tabindex, CSS order, grid placement or absolute positioning).',
    }));
  }
  if (inv.length > 10) ctx.note(`more than 10 order inversions on ${ps.route}; only the first 10 were reported`);
}

/** Additional themes: compare focus styles with the first theme; where they differ, diff every focusable with forced :focus-visible. */
async function otherThemes(ctx, stats, signatures) {
  const first = ctx.scope.themes[0];
  for (const theme of ctx.scope.themes.slice(1)) {
    const specs = ctx.states({ widths: [1280], themes: [theme] });
    for (const spec of specs) {
      const base = signatures.get(`${spec.route}#${spec.state}`);
      const pg = await ctx.openPage(spec, openOptions);
      try {
        if (!pg.ok) continue;
        const { page, ps } = pg;
        await page.addStyleTag({ content: NO_SMOOTH_SCROLL_CSS }).catch(() => {});
        await ensureHelpers(page);
        await ensureFocusLib(page);
        const list = await page.evaluate(() => {
          const U = window.__uie;
          const out = [];
          const seen = new Set();
          for (const el of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]')) {
            if (out.length >= 60) break;
            if (!U.tabbable(el) || !U.isVisible(el)) continue;
            const sg = `${el.tagName}|${el.type || ''}|${[...el.classList].sort().join('.')}`;
            if (seen.has(sg)) continue;
            seen.add(sg);
            out.push({ id: U.id(el), selector: U.selector(el), name: U.accName(el).slice(0, 60), snippet: U.snippet(el), source: U.sourceOf(el), doc: U.docRect(el) });
          }
          return out;
        });
        const cdp = await openCdp(page);
        try {
          let differs = !base || !base.size;
          const forced = [];
          for (const f of list) {
            const nodeId = await nodeIdFor(cdp, f.id);
            if (!nodeId) continue;
            const rect = await page.evaluate((id) => {
              const el = window.__uie.el(id);
              el.scrollIntoView({ block: 'center', inline: 'nearest' });
              const r = el.getBoundingClientRect();
              return { x: r.left, y: r.top, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight };
            }, f.id);
            const clip = clipAround(rect, MARGIN, rect.vw, rect.vh);
            if (!clip) continue;
            const rest = await shot(page, clip);
            let foc;
            let fsig = null;
            try {
              await forceState(cdp, nodeId, ['focus', 'focus-visible']);
              foc = await shot(page, clip);
              fsig = await page.evaluate((id) => {
                const s = getComputedStyle(window.__uie.el(id));
                return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.outlineOffset, s.boxShadow, s.borderTopColor, s.borderBottomColor, s.backgroundColor, s.color, s.textDecorationLine].join('|');
              }, f.id);
            } finally {
              await forceState(cdp, nodeId, []).catch(() => {});
            }
            if (base && base.has(f.selector) && base.get(f.selector) !== fsig) differs = true;
            forced.push({ f, rect, clip, rest, foc });
          }
          if (!differs) {
            ctx.note(`${theme} theme: focus styles match the ${first} theme on ${spec.route} (${spec.state}); not re-walked`);
            continue;
          }
          ctx.note(`${theme} theme: focus styles differ from the ${first} theme on ${spec.route} (${spec.state}); focusables diffed with :focus-visible forced through CDP`);
          for (const x of forced) {
            const m = focusChangeMetrics(ctx.deps, x.foc, x.rest, [x.rect.x - x.clip.x, x.rect.y - x.clip.y, x.rect.w, x.rect.h]);
            if (m.changedInner > 0) continue;
            stats.invisible += 1;
            const hit = ctx.hit({
              rule: 'A11Y-04',
              title: `No visible focus indicator: ${label(x.f)}`,
              description: `In the ${theme} theme, forcing :focus-visible on ${label(x.f)} changes 0 pixels within its box + 4 px, so keyboard users cannot see where focus is.`,
              location: ctx.loc(ps, { selector: x.f.selector, bbox: x.f.doc, snippet: x.f.snippet, source: x.f.source }),
              evidence: [{ type: 'measurement', value: { changed_px: 0, method: 'forced :focus-visible (CDP)' }, detail: `${theme} theme: 0 px changed with :focus-visible forced` }],
              recommendation: 'Define the focus indicator colour per theme from the focus tokens so it stays visible on dark surfaces too.',
            });
            ctx.add(hit);
          }
        } finally {
          await cdp.detach().catch(() => {});
        }
      } finally {
        await pg.close();
      }
    }
  }
}
