// states — CMP-01, CMP-03, CMP-04 (QUALITY-BAR G3; ADR-032).
//   CMP-01  buttons, links and inputs show a visible difference for hover (where hover is supported: the non-touch
//           G2 width) and active states: forced pseudo-state diff > 0 through CDP CSS.forcePseudoState, pixel-identical
//           test on a crop of the box + 4 px, transitions completed. Forced states cannot repaint controls the browser
//           draws natively (default buttons, checkboxes, selects, text fields), so those are skipped and noted; links
//           always count. Text-entry fields are checked for hover only. A state defined on an ancestor (`li:hover a`)
//           is found by forcing the ancestors too. Controls are deduplicated by style signature.
//   CMP-03  disabled controls use ≥ 2 cues — reduced opacity or colour (vs the same control enabled), a not-allowed
//           cursor, the disabled / aria-disabled attribute, an explanation (aria-describedby or title) — and stay
//           perceivable: label text vs the control's fill (or the surface) or the outline vs the surface ≥ 2:1
//           [calibrating]. A primary submit disabled at rest does not fail CMP-03: it is written as a candidate
//           finding under H1 and H9 (ADR-032) to evidence/states/candidates.json, never to the tool hits.
//   CMP-04  response feedback, for controls that can be triggered safely: an acknowledgement within 0.1 s (the
//           pressed state counts, from the forced :active diff; otherwise the first visible change after pointerdown,
//           timed with performance.now() and a MutationObserver), and progress shown while an operation runs > 1 s
//           (an animated indicator, a progressbar or aria-busy; a static "Loading…" alone fails). The ≥ 10 s clause
//           needs a slow fixture and is not exercised within the 4 s observation window.
import { parseColor } from '../../util/color.mjs';
import { compositeChain, ratio, round } from '../thresholds.mjs';
import { isTouchWidth } from '../launch.mjs';
import { openCdp, nodeIdFor, forceState } from '../cdp.mjs';
import { changedPixels, clipAround } from '../focus.mjs';
import { ensureProbeLib, reloadState, waitSettled, clickId, isDestructive, isLocalPage, formFields, plausibleValue, fillFields, trackRequests, pageGuard } from '../interact.mjs';

export const mode = 'standalone';
// Measures timing (milliseconds to feedback or to paint): runs alone, after the parallel standalone checks.
export const timed = true;
export const openOptions = { bare: true };
export const criteria = ['CMP-01', 'CMP-03', 'CMP-04'];
export const summary = 'forced pseudo-state diffs (hover, active); disabled cues and the 2:1 floor, primary submits disabled at rest as H1/H9 candidates; response feedback timing';

const MAX_CONTROLS = 40;
const MAX_ACTIONS = 6;
const ACK_MS = 100;
const PROGRESS_AFTER_MS = 1000;

function controls() {
  const U = window.__uie;
  U.reset();
  // Pristine user-agent styles, to tell natively drawn controls from author-styled ones.
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:absolute;left:-9999px;top:0;width:300px;height:100px;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const fdoc = frame.contentDocument;
  const cache = new Map();
  const ua = (el) => {
    const key = `${el.tagName}|${el.type || ''}`;
    if (cache.has(key)) return cache.get(key);
    let v = null;
    try {
      const c = fdoc.createElement(el.tagName);
      if (el.type) c.setAttribute('type', el.type);
      fdoc.body.appendChild(c);
      const s = frame.contentWindow.getComputedStyle(c);
      v = { bg: s.backgroundColor, bc: s.borderTopColor, bw: s.borderTopWidth, bs: s.borderTopStyle, ap: s.appearance };
      c.remove();
    } catch {
      v = null;
    }
    cache.set(key, v);
    return v;
  };
  const TEXT = ['text', 'email', 'search', 'tel', 'url', 'password', 'number', 'date', 'time', 'datetime-local', 'month', 'week', ''];
  const out = [];
  const sigs = new Map();
  const sel = 'a[href],[role=link],button,[role=button],input:not([type=hidden]),select,textarea';
  for (const el of document.querySelectorAll(sel)) {
    if (!U.isVisible(el) || U.isDisabled(el) || U.isInert(el) || el.closest('[aria-hidden="true"]')) continue;
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') || '').toLowerCase();
    const role = U.role(el);
    const kind = role === 'link' ? 'link' : ['button'].includes(role) || ['submit', 'button', 'reset', 'image'].includes(type) ? 'button' : 'input';
    const textEntry = tag === 'textarea' || (tag === 'input' && TEXT.includes(type));
    const s = U.cs(el);
    let native = false;
    if (tag === 'select' || (tag === 'input' && ['checkbox', 'radio', 'range', 'color', 'file'].includes(type))) native = s.appearance !== 'none';
    else if (tag === 'button' || tag === 'input' || tag === 'textarea') {
      const d = ua(el);
      native = !!d && s.appearance !== 'none' && s.backgroundColor === d.bg && s.borderTopColor === d.bc && s.borderTopWidth === d.bw && s.borderTopStyle === d.bs;
    }
    const sig = `${tag}|${type}|${role}|${[...el.classList].sort().join('.')}|${el.closest('nav,header,footer,main,aside,dialog,form')?.tagName || ''}`;
    if (sigs.has(sig)) {
      sigs.get(sig).similar += 1;
      continue;
    }
    if (out.length >= 120) continue;
    const item = { id: U.id(el), selector: U.selector(el), snippet: U.snippet(el), source: U.sourceOf(el), bbox: U.docRect(el), name: U.accName(el).slice(0, 60), kind, tag, type, textEntry, native, sig, similar: 0 };
    sigs.set(sig, item);
    out.push(item);
  }
  frame.remove();
  return { items: out, hover: matchMedia('(hover: hover)').matches };
}

/** Disabled controls with everything CMP-03 needs, measured disabled and (briefly re-enabled) enabled. */
function disabledControls() {
  const U = window.__uie;
  U.reset();
  const look = (el) => {
    const s = getComputedStyle(el);
    return { color: s.color, bg: s.backgroundColor, bc: s.borderTopColor, op: s.opacity, filter: s.filter, deco: s.textDecorationLine, cursor: s.cursor };
  };
  const out = [];
  for (const el of document.querySelectorAll('button,input:not([type=hidden]),select,textarea,[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=menuitem],[aria-disabled="true"],a[href]')) {
    if (out.length >= 60) break;
    const nativeDisabled = !!el.disabled;
    const aria = el.getAttribute('aria-disabled') === 'true';
    const fsDisabled = !nativeDisabled && !!el.closest('fieldset[disabled]') && el.matches('button,input,select,textarea');
    if (!nativeDisabled && !aria && !fsDisabled) continue;
    if (!U.isVisible(el, { minOpacity: 0.01 })) continue;
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') || (tag === 'button' ? 'submit' : '')).toLowerCase();
    const form = el.form || el.closest('form');
    const submit = !!form && ((tag === 'button' && type === 'submit') || (tag === 'input' && ['submit', 'image'].includes(type)));
    const firstSubmit = submit && [...form.querySelectorAll('button:not([type]),button[type=submit],input[type=submit],input[type=image]')].filter((b) => U.isVisible(b, { minOpacity: 0.01 }))[0] === el;
    const dis = look(el);
    let en = null;
    if (nativeDisabled) {
      el.disabled = false;
      en = look(el);
      el.disabled = true;
    } else if (aria) {
      el.removeAttribute('aria-disabled');
      en = look(el);
      el.setAttribute('aria-disabled', 'true');
    }
    // The label: own text, else an icon (svg fill/stroke).
    const textEl = [el, ...el.querySelectorAll('*')].find((n) => U.ownText(n) && U.isVisible(n, { minOpacity: 0.01 })) || null;
    let icon = null;
    if (!textEl) {
      const shape = el.querySelector('svg path,svg circle,svg rect,svg line,svg polyline,svg polygon,svg use');
      if (shape) {
        const ss = getComputedStyle(shape);
        icon = ss.stroke && ss.stroke !== 'none' && parseFloat(ss.strokeWidth) > 0 ? ss.stroke : ss.fill;
      }
    }
    const value = tag === 'input' && ['submit', 'button', 'reset'].includes((el.type || '').toLowerCase()) ? el.value : null;
    const desc = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).map((i) => document.getElementById(i)).filter(Boolean).map((d) => U.collapse(d.textContent)).join(' ');
    const s = getComputedStyle(el);
    out.push({
      id: U.id(el),
      selector: U.selector(el),
      snippet: U.snippet(el),
      source: U.sourceOf(el),
      bbox: U.docRect(el),
      name: U.accName(el).slice(0, 60),
      tag,
      nativeDisabled,
      aria,
      fsDisabled,
      primarySubmit: !!firstSubmit,
      formSelector: form ? U.selector(form) : null,
      dis,
      en,
      explanation: !!(desc || (el.getAttribute('title') || '').trim()),
      label: textEl ? { color: textEl === el && value !== null ? s.color : getComputedStyle(textEl).color, chain: U.bgChain(textEl) } : icon ? { color: icon, chain: U.bgChain(el) } : value !== null ? { color: s.color, chain: U.bgChain(el) } : null,
      border: ['Top', 'Right', 'Bottom', 'Left'].map((k) => ({ w: parseFloat(s[`border${k}Width`]) || 0, style: s[`border${k}Style`], color: s[`border${k}Color`] })),
      ownBg: s.backgroundColor,
      outside: el.parentElement ? U.bgChain(el.parentElement) : [],
      selfChain: U.bgChain(el),
    });
  }
  return { items: out, canvas: U.canvasColor() };
}

async function colourParser(page, list) {
  const map = new Map();
  const unknown = [];
  for (const s of new Set(list.filter(Boolean))) {
    const c = parseColor(s);
    if (c) map.set(s, c);
    else unknown.push(s);
  }
  if (unknown.length) {
    const conv = await page.evaluate((arr) => {
      const cv = document.createElement('canvas');
      cv.width = 1;
      cv.height = 1;
      const g = cv.getContext('2d', { willReadFrequently: true });
      const out = {};
      for (const s of arr) {
        g.clearRect(0, 0, 1, 1);
        g.fillStyle = 'rgba(0,0,0,0)';
        g.fillStyle = s;
        g.fillRect(0, 0, 1, 1);
        const d = g.getImageData(0, 0, 1, 1).data;
        out[s] = [d[0], d[1], d[2], d[3] / 255];
      }
      return out;
    }, unknown).catch(() => ({}));
    for (const [s, v] of Object.entries(conv)) map.set(s, { r: v[0] / 255, g: v[1] / 255, b: v[2] / 255, alpha: v[3] });
  }
  return (s) => (s ? map.get(s) || null : null);
}

async function shot(page, clip) {
  return page.screenshot({ clip, animations: 'disabled', caret: 'hide', scale: 'css' });
}

export async function run(ctx) {
  const stats = { controls: 0, native_skipped: 0, hover_missing: 0, active_missing: 0, disabled: 0, candidates: [], actions: [], skipped_actions: [] };
  const activeOk = new Map(); // style signature → pressed/focus state visible (for CMP-04 acknowledgement)
  const guard = pageGuard(ctx);
  for await (const pg of ctx.pages(ctx.states({ widths: 'g2', themes: 'all' }))) {
    const { ps } = pg;
    await guard(ps, async () => {
      await ensureProbeLib(pg.page);
      await stateDiffs(ctx, pg, stats, activeOk);
      await disabledStates(ctx, pg, stats);
      if (ps.width === 1280 && ps.theme === ctx.scope.themes[0] && !((ps.stateCfg && ps.stateCfg.actions) || []).length) await feedback(ctx, pg, stats, activeOk);
    });
  }
  guard.finish();
  const candRel = stats.candidates.length ? ctx.writeEvidence('states/candidates.json', { schema: 'tool-candidates', check: 'states', note: 'Judged candidates (ADR-032): verify and rate like any judged finding; never deterministic CMP-03 failures.', candidates: stats.candidates }) : null;
  const actRel = ctx.writeEvidence('states/feedback.json', { actions: stats.actions, skipped: stats.skipped_actions });
  if (stats.native_skipped) ctx.note(`${stats.native_skipped} control style(s) drawn natively by the browser were not diffed for CMP-01 (forced pseudo-states do not repaint native controls)`);
  ctx.note('CMP-01 hover is judged only where hover is supported (the 1280 px non-touch viewport); text-entry fields are checked for hover only');
  ctx.note('CMP-04 observes each action for up to 4 s: the ≥ 10 s determinate-progress-and-cancel clause is not exercised (use a slow fixture with `uie probe`)');
  if (stats.candidates.length) ctx.note(`${stats.candidates.length} primary submit(s) disabled at rest written as H1/H9 candidates (not CMP-03 failures, ADR-032): ${candRel}`);
  ctx.record({
    controls_checked: stats.controls,
    hover_missing: stats.hover_missing,
    active_missing: stats.active_missing,
    native_skipped: stats.native_skipped,
    disabled_checked: stats.disabled,
    candidates: stats.candidates.length,
    candidates_file: candRel,
    feedback_actions: stats.actions.length,
    feedback_file: actRel,
    feedback_skipped: stats.skipped_actions.slice(0, 20),
  });
  return [];
}

async function stateDiffs(ctx, pg, stats, activeOk) {
  const { page, ps } = pg;
  const inv = await page.evaluate(controls);
  const hoverSupported = inv.hover && !isTouchWidth(ps.width);
  const cdp = await openCdp(page);
  const deps = ctx.deps;
  try {
    let n = 0;
    for (const c of inv.items) {
      if (c.native && c.kind !== 'link') {
        stats.native_skipped += 1;
        if (ps.width === 1280 && ps.theme === ctx.scope.themes[0]) activeOk.set(c.sig, true); // the browser draws a pressed state
        continue;
      }
      if (n >= MAX_CONTROLS) {
        ctx.partial(`more than ${MAX_CONTROLS} control styles on ${ps.route}; the rest were not diffed`);
        break;
      }
      n += 1;
      stats.controls += 1;
      const rect = await page.evaluate((id) => {
        const el = window.__uie.el(id);
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight };
      }, c.id);
      const clip = clipAround(rect, 4, rect.vw, rect.vh);
      if (!clip) continue;
      const nodeId = await nodeIdFor(cdp, c.id);
      if (!nodeId) continue;
      const ancestors = await ancestorNodes(cdp, page, c.id, 3);
      // A state recipe that clicked this control leaves the pointer on it, so its rest crop would already show the
      // real :hover style and the forced hover would change nothing. Park the pointer outside the crop first.
      await page.mouse.move(clip.x > 8 ? 1 : Math.max(1, rect.vw - 2), clip.y > 8 ? 1 : Math.max(1, rect.vh - 2)).catch(() => {});
      const rest = await shot(page, clip);
      const diffFor = async (cls) => {
        let px = 0;
        try {
          await forceState(cdp, nodeId, cls);
          px = changedPixels(deps, rest, await shot(page, clip));
          if (px === 0 && ancestors.length) {
            for (const a of ancestors) await forceState(cdp, a, cls);
            px = changedPixels(deps, rest, await shot(page, clip));
          }
        } finally {
          await forceState(cdp, nodeId, []).catch(() => {});
          for (const a of ancestors) await forceState(cdp, a, []).catch(() => {});
        }
        return px;
      };
      const hoverPx = hoverSupported ? await diffFor(['hover']) : null;
      const activePx = c.textEntry ? null : await diffFor(['active']);
      if (ps.width === 1280 && ps.theme === ctx.scope.themes[0]) activeOk.set(c.sig, (activePx || 0) > 0);
      const missing = [hoverPx === 0 && 'hover', activePx === 0 && 'active (pressed)'].filter(Boolean);
      if (!missing.length) continue;
      if (hoverPx === 0) stats.hover_missing += 1;
      if (activePx === 0) stats.active_missing += 1;
      ctx.add(ctx.hit({
        rule: 'CMP-01',
        title: `No ${missing.join(' or ')} state: ${c.name ? `"${c.name.slice(0, 40)}"` : c.selector.slice(0, 50)}`,
        description: `Forcing ${missing.map((m) => `:${m.split(' ')[0]}`).join(' and ')} on this ${c.kind} changes 0 pixels of its box + 4 px in the ${ps.theme} theme at ${ps.width} px${c.similar ? ` (${c.similar} more control(s) share its style)` : ''}, so people get no visible response when they point at or press it.`,
        location: ctx.loc(ps, { selector: c.selector, bbox: c.bbox, snippet: c.snippet, source: c.source }),
        evidence: [{ type: 'measurement', value: { hover_px: hoverPx, active_px: activePx, similar: c.similar }, detail: `forced-state diff: hover ${hoverPx === null ? 'n/a' : `${hoverPx} px`}, active ${activePx === null ? 'n/a' : `${activePx} px`}` }],
        recommendation: 'Add hover and pressed states to the shared component from the state model in the tokens (CMP-07); make pressed at least as strong as hover.',
      }));
    }
  } finally {
    await cdp.detach().catch(() => {});
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  }
}

async function ancestorNodes(cdp, page, id, depth) {
  const ids = await page.evaluate(({ i, d }) => {
    const out = [];
    for (let a = window.__uie.el(i).parentElement, k = 0; a && a !== document.body && k < d; a = a.parentElement, k += 1) out.push(window.__uie.id(a));
    return out;
  }, { i: id, d: depth }).catch(() => []);
  const nodes = [];
  for (const a of ids) {
    const n = await nodeIdFor(cdp, a);
    if (n) nodes.push(n);
  }
  return nodes;
}

async function disabledStates(ctx, pg, stats) {
  const { page, ps } = pg;
  const { items, canvas } = await page.evaluate(disabledControls);
  if (!items.length) return;
  const colorOf = await colourParser(page, [canvas, ...items.flatMap((d) => [d.label?.color, ...(d.label?.chain || []).map((c) => c.bg), d.ownBg, ...d.border.map((b) => b.color), ...d.outside.map((o) => o.bg), ...d.selfChain.map((c) => c.bg)])]);
  const canvasC = colorOf(canvas) || { r: 1, g: 1, b: 1, alpha: 1 };
  const chainOf = (list) => list.map((c) => ({ bg: colorOf(c.bg), op: Number(c.op) }));
  const atRest = !((ps.stateCfg && ps.stateCfg.actions) || []).length;
  for (const d of items) {
    stats.disabled += 1;
    const where = ctx.loc(ps, { selector: d.selector, bbox: d.bbox, snippet: d.snippet, source: d.source });
    if (d.primarySubmit && d.nativeDisabled && atRest) {
      if (!stats.candidates.some((c) => c.locations[0].selector === d.selector && c.locations[0].route === ps.route)) {
        stats.candidates.push({
          title: `Primary submit is disabled at rest: ${d.name ? `"${d.name.slice(0, 40)}"` : d.selector.slice(0, 50)}`,
          description: `The form's submit button is disabled before the person has done anything. It cannot be reached with Tab and gives no reason, so people may not be able to tell what is missing (judged under H1 and H9; ADR-032: not a CMP-03 failure).`,
          problem_type: 'single_location',
          criteria: [{ kind: 'heuristic', id: 'H1', primary: true }, { kind: 'heuristic', id: 'H9' }],
          locations: [Object.fromEntries(Object.entries(where).filter(([, v]) => v !== null && v !== undefined && v !== ''))],
          evidence: [{ type: 'measurement', value: { disabled_at_rest: true, explanation: d.explanation }, detail: `disabled on first render${d.explanation ? '; has an explanation' : '; no explanation'}` }],
          found_by: [{ role: 'tool', method: 'tool', check: 'states', engine: ctx.engine }],
          evidence_level: 'E1',
          status: 'candidate',
          tags: ['states', 'CMP-03', 'disabled-at-rest'],
          recommendation: 'Keep the submit enabled and validate on submit (CMP-18), or say next to it what is missing.',
        });
      }
      continue;
    }
    // Cues.
    const cues = [];
    cues.push(d.nativeDisabled || d.fsDisabled ? 'disabled attribute' : 'aria-disabled attribute');
    const e = d.en;
    if (e && (e.color !== d.dis.color || e.bg !== d.dis.bg || e.bc !== d.dis.bc || e.op !== d.dis.op || e.filter !== d.dis.filter || e.deco !== d.dis.deco)) cues.push('reduced opacity or colour');
    if (d.dis.cursor === 'not-allowed') cues.push('not-allowed cursor');
    if (d.explanation) cues.push('explanation');
    if (!e && d.fsDisabled) cues.push('(no enabled reference)');
    const realCues = cues.filter((c) => !c.startsWith('('));
    if (realCues.length < 2 && e) {
      ctx.add(ctx.hit({
        rule: 'CMP-03',
        title: `Disabled control with fewer than two cues: ${d.name ? `"${d.name.slice(0, 40)}"` : d.selector.slice(0, 50)}`,
        description: `This disabled control signals its state only through ${realCues.join(' and ') || 'nothing'}: compared with the same control enabled, its colour and opacity do not change${d.dis.cursor === 'not-allowed' ? '' : ', the cursor stays the same'} and nothing explains why it is unavailable. [calibrating]`,
        location: where,
        evidence: [{ type: 'measurement', value: { cues: realCues, count: realCues.length }, detail: `cues: ${realCues.join(', ') || 'none'} (needs ≥ 2)` }],
        recommendation: 'Use the disabled token set (a reduced-contrast colour or opacity plus the not-allowed cursor), and say nearby what unlocks the control.',
      }));
    }
    // Perceivable: label vs fill (or surface), or outline vs surface, ≥ 2:1.
    const labelColor = d.label ? colorOf(d.label.color) : null;
    let labelRatio = null;
    if (labelColor) {
      const { fg, bg } = compositeChain(chainOf(d.label.chain), canvasC, labelColor);
      labelRatio = ratio(fg, bg);
    }
    const outside = compositeChain(chainOf(d.outside), canvasC).bg;
    let outlineRatio = null;
    for (const b of d.border) {
      const bc = colorOf(b.color);
      if (b.w < 1 || b.style === 'none' || b.style === 'hidden' || !bc || bc.alpha < 0.05) continue;
      const on = compositeChain([{ bg: bc, op: 1 }, ...chainOf(d.selfChain).slice(1)], canvasC).bg;
      const opacity = Number(d.dis.op);
      const seen = Number.isFinite(opacity) && opacity < 1 ? { r: on.r * opacity + outside.r * (1 - opacity), g: on.g * opacity + outside.g * (1 - opacity), b: on.b * opacity + outside.b * (1 - opacity), alpha: 1 } : on;
      const r = ratio(seen, outside);
      outlineRatio = outlineRatio === null ? r : Math.max(outlineRatio, r);
    }
    const fill = compositeChain(chainOf(d.selfChain), canvasC).bg;
    const fillRatio = ratio(fill, outside);
    const best = Math.max(labelRatio ?? 0, outlineRatio ?? 0, fillRatio > 1.05 ? fillRatio : 0);
    if (best < 2 - 0.005) {
      ctx.add(ctx.hit({
        rule: 'CMP-03',
        title: `Disabled control is barely perceivable: ${d.name ? `"${d.name.slice(0, 40)}"` : d.selector.slice(0, 50)}`,
        description: `Neither the label (${labelRatio === null ? 'none' : `${labelRatio}:1`} against the control's fill) nor the outline (${outlineRatio === null ? 'none' : `${outlineRatio}:1`}) of this disabled control reaches 2:1 against the adjacent background in the ${ps.theme} theme, so the control is barely perceivable. [calibrating]`,
        location: where,
        evidence: [{ type: 'measurement', value: { label_ratio: labelRatio, outline_ratio: outlineRatio, fill_ratio: round(fillRatio, 2) }, detail: `best ${round(best, 2)}:1 < 2:1` }],
        recommendation: 'Raise the disabled text and border roles to ≥ 2:1 (e.g. near-black at 38 % opacity on white, not 25 %).',
      }));
    }
  }
}

function discoverActions() {
  const U = window.__uie;
  U.reset();
  const out = [];
  for (const el of document.querySelectorAll('button,[role=button],input[type=button],input[type=submit]')) {
    if (out.length >= 60) break;
    if (!U.isVisible(el) || U.isDisabled(el) || U.isInert(el) || el.closest('[aria-hidden="true"]') || el.closest('a[href]')) continue;
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') || (tag === 'button' ? 'submit' : '')).toLowerCase();
    const form = el.form || el.closest('form');
    const submit = !!form && ((tag === 'button' && type === 'submit') || (tag === 'input' && type === 'submit'));
    const sig = `${tag}|${(el.getAttribute('type') || '').toLowerCase()}|${U.role(el)}|${[...el.classList].sort().join('.')}|${el.closest('nav,header,footer,main,aside,dialog,form')?.tagName || ''}`;
    out.push({ selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el), name: U.accName(el).slice(0, 60), text: U.collapse(el.innerText || el.value || '').slice(0, 60), submit, form: form ? U.selector(form) : null, reset: type === 'reset', sig });
  }
  return out;
}

async function feedback(ctx, pg, stats, activeOk) {
  const { page, ps } = pg;
  trackRequests(page);
  const local = isLocalPage(page);
  const list = await page.evaluate(discoverActions);
  let n = 0;
  for (const a of list) {
    const label = a.name || a.text || a.selector;
    if (isDestructive(a.name, a.text) || a.reset) {
      stats.skipped_actions.push({ route: ps.route, action: label, reason: 'destructive-looking or reset control' });
      continue;
    }
    if (a.submit && !local) {
      stats.skipped_actions.push({ route: ps.route, action: label, reason: 'non-local host: forms are never submitted' });
      continue;
    }
    if (n >= MAX_ACTIONS) {
      stats.skipped_actions.push({ route: ps.route, action: label, reason: `cap of ${MAX_ACTIONS} actions per page state` });
      continue;
    }
    n += 1;
    const re = await reloadState(ctx, pg);
    if (!re.ok) {
      ctx.error(`${ps.key}: ${re.error}`);
      continue;
    }
    const id = await page.evaluate(({ selector, name }) => {
      const U = window.__uie;
      let els = [];
      try {
        els = [...document.querySelectorAll(selector)];
      } catch {
        return null;
      }
      if (els.length > 1 && name) els = els.filter((e) => U.accName(e).slice(0, 60) === name);
      return els.length ? U.id(els[0]) : null;
    }, a);
    if (id === null) continue;
    if (a.submit && a.form) {
      const formId = await page.evaluate((s) => {
        try {
          const el = document.querySelector(s);
          return el ? window.__uie.id(el) : null;
        } catch {
          return null;
        }
      }, a.form);
      if (formId !== null) await fillFields(page, (await page.evaluate(formFields, formId)) || [], plausibleValue);
    }
    const net = trackRequests(page);
    const started0 = net.started;
    await page.evaluate((t) => window.__uieProbe.arm({ triggerId: t }), id);
    const c = await clickId(page, id);
    if (!c.ok) {
      await page.evaluate(() => window.__uieProbe.disarm()).catch(() => {});
      continue;
    }
    const settled = await waitSettled(page, { maxMs: 4000, quietMs: 300 });
    const res = await page.evaluate(() => {
      const r = window.__uieProbe.result();
      window.__uieProbe.disarm();
      return r;
    }).catch(() => null);
    if (!res || res.urlChanged) {
      stats.actions.push({ route: ps.route, action: label, outcome: 'navigated' });
      continue;
    }
    const requests = net.started - started0;
    const duration = settled.settled ? res.lastVisible ?? 0 : Math.max(res.lastVisible ?? 0, settled.ms);
    const startedWork = requests > 0 || (res.lastVisible ?? 0) >= 150 || !settled.settled;
    const record = { route: ps.route, action: label, requests, first_change_ms: res.firstVisible, last_change_ms: res.lastVisible, settled: settled.settled, pressed_state: !!activeOk.get(a.sig) };
    stats.actions.push(record);
    if (!startedWork) {
      record.outcome = 'immediate response (no work started)';
      continue;
    }
    const ack = activeOk.get(a.sig) ? 0 : res.firstVisible;
    const where = ctx.loc(ps, { selector: a.selector, bbox: a.bbox, snippet: a.snippet, source: a.source });
    if (ack === null || ack > ACK_MS) {
      ctx.add(ctx.hit({
        rule: 'CMP-04',
        title: `No acknowledgement within 0.1 s: "${label.slice(0, 40)}"`,
        description: `Activating "${label}" starts work${requests ? ` (${requests} request(s))` : ''}, but the first visible change comes ${ack === null ? 'never within the 4 s window' : `after ${ack} ms`} and the control has no pressed state, so nothing on screen shows that the action registered.`,
        location: where,
        evidence: [{ type: 'probe', value: { ack_ms: ack, pressed_state: false, duration_ms: duration }, detail: `first visible change ${ack === null ? 'none' : `${ack} ms`} after pointerdown (limit ${ACK_MS} ms)` }],
        recommendation: 'Give the control a pressed state and change it immediately (a label like "Saving…" or an in-control spinner).',
      }));
    }
    if (duration > PROGRESS_AFTER_MS) {
      const during = (res.samples || []).filter((s) => s.t > ACK_MS && s.t < duration);
      const animated = during.some((s) => s.spin > 0 || s.progress > 0);
      const staticText = during.some((s) => s.loadingText > 0);
      if (!animated) {
        record.outcome = 'no progress';
        ctx.add(ctx.hit({
          rule: 'CMP-04',
          title: staticText ? `Only a static "Loading…" during a ${round(duration / 1000, 1)} s operation: "${label.slice(0, 40)}"` : `No progress shown during a ${round(duration / 1000, 1)} s operation: "${label.slice(0, 40)}"`,
          description: `"${label}" runs for about ${duration} ms; operations over 1 s must show progress, but ${staticText ? 'the only feedback is static loading text, which cannot tell a working system from a frozen one' : 'nothing animated, no progressbar and no aria-busy region appears while it runs'}.`,
          location: where,
          evidence: [{ type: 'probe', value: { duration_ms: duration, animated: false, static_text: staticText, samples: during.length }, detail: `${during.length} samples over ${duration} ms: no spinner, progressbar or aria-busy` }],
          recommendation: 'Show an animated indicator where the result will appear (or in the control) after about 1 s, with text saying what is happening (CMP-10).',
        }));
      }
    }
    if (!record.outcome) record.outcome = 'feedback ok';
  }
}
