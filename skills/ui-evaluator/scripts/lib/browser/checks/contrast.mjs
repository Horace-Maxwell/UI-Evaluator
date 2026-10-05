// contrast — A11Y-11 (text ≥ 4.5:1, large text ≥ 3:1, on the composited background; text over images or gradients
// pixel-sampled), A11Y-12 (non-text ≥ 3:1: control boundaries, meaningful icons, focus indicators) and COL-02
// (achromatic text, OKLCH chroma < 0.005, on a surface with chroma ≥ 0.05 [calibrating]), in every state and theme.
// CJK text of 18–24 px (not bold-large) with a ratio in [3, 4.5) is neither passed nor failed: it is listed as
// `needs_judgment` for the accessibility auditor and the entry carries `judged` (lead ADR; [calibrating]).
import { parseColor, contrastRatio } from '../../util/color.mjs';
import { compositeChain, ratio, textContrastMinimum, cjkReviewBand, isGreyOnColour, isLargeText, chroma, round } from '../thresholds.mjs';
import { decodePng } from '../png.mjs';
import { withCdp, nodeIdFor, forceState } from '../cdp.mjs';

export const mode = 'shared';
export const criteria = ['A11Y-11', 'A11Y-12', 'COL-02'];
export const summary = 'computed and pixel-sampled text and non-text contrast in every theme; grey on chromatic surfaces';

const MAX_PIXEL_SAMPLES = 40;

function collect() {
  const U = window.__uie;
  U.reset();
  const canvas = U.canvasColor();
  // Painted layers that may sit behind text without being its ancestor.
  const layers = [];
  for (const el of document.querySelectorAll('body *')) {
    if (layers.length >= 300) break;
    const s = U.cs(el);
    const media = ['IMG', 'VIDEO', 'CANVAS', 'PICTURE', 'IFRAME'].includes(el.tagName) || (el.tagName === 'svg' && el.getBoundingClientRect().width >= 40);
    const bgImg = s.backgroundImage && s.backgroundImage !== 'none';
    const positionedFill = (s.position === 'absolute' || s.position === 'fixed') && !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor);
    if (!media && !bgImg && !positionedFill) continue;
    if (!U.isVisible(el)) continue;
    const r = el.getBoundingClientRect();
    layers.push({ el, l: r.left + scrollX, t: r.top + scrollY, r: r.right + scrollX, b: r.bottom + scrollY });
  }
  const isInactive = (el) => {
    const ctl = el.closest('button,input,select,textarea,option,optgroup,fieldset,[aria-disabled="true"]');
    if (ctl && (ctl.disabled || ctl.getAttribute('aria-disabled') === 'true' || ctl.matches(':disabled'))) return true;
    const label = el.closest('label');
    if (label && label.control && label.control.disabled) return true;
    return false;
  };
  const items = [];
  for (const el of U.textElements(document.body, { limit: 1500 })) {
    const text = U.ownText(el);
    if (!text) continue;
    if (el.closest('[aria-hidden="true"]') && text.length <= 2) continue;
    if (isInactive(el)) continue;
    if (el.closest('[class*="logo" i],[id*="logo" i],[aria-label*="logo" i],[role=img]')) continue;
    const s = U.cs(el);
    const svgText = el.closest('svg') && ['text', 'tspan', 'textPath'].includes(el.tagName);
    const fill = s.webkitTextFillColor && s.webkitTextFillColor !== s.color ? s.webkitTextFillColor : null;
    const r = el.getBoundingClientRect();
    const box = { l: r.left + scrollX, t: r.top + scrollY, r: r.right + scrollX, b: r.bottom + scrollY };
    let foreign = null;
    for (const L of layers) {
      if (L.el === el || L.el.contains(el) || el.contains(L.el)) continue;
      if (L.r <= box.l || L.l >= box.r || L.b <= box.t || L.t >= box.b) continue;
      foreign = L.el.tagName.toLowerCase();
      break;
    }
    const sc = U.scripts(text);
    items.push({
      id: U.id(el),
      selector: U.selector(el),
      snippet: U.snippet(el),
      source: U.sourceOf(el),
      bbox: U.docRect(el),
      text: text.slice(0, 80),
      color: svgText ? s.fill : s.color,
      fill,
      px: parseFloat(s.fontSize),
      weight: Number(s.fontWeight) || 400,
      chain: U.bgChain(el),
      foreign,
      cjk: sc.letters ? sc.cjk / sc.letters >= 0.5 : false,
    });
  }
  // Placeholder text is text under 1.4.3.
  for (const el of document.querySelectorAll('input[placeholder],textarea[placeholder]')) {
    if (el.value || !U.isVisible(el) || el.disabled) continue;
    const ps = getComputedStyle(el, '::placeholder');
    items.push({
      id: U.id(el),
      selector: U.selector(el),
      snippet: U.snippet(el),
      source: U.sourceOf(el),
      bbox: U.docRect(el),
      text: el.placeholder.slice(0, 80),
      color: ps.color,
      px: parseFloat(ps.fontSize),
      weight: Number(ps.fontWeight) || 400,
      chain: U.bgChain(el),
      foreign: null,
      placeholder: true,
      cjk: false,
    });
  }
  return { canvas, items };
}

function collectNonText() {
  const U = window.__uie;
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:absolute;left:-9999px;top:0;width:300px;height:100px;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const fdoc = frame.contentDocument;
  const uaCache = new Map();
  const ua = (el) => {
    const key = `${el.tagName}|${el.type || ''}`;
    if (uaCache.has(key)) return uaCache.get(key);
    let v = null;
    try {
      const c = fdoc.createElement(el.tagName);
      if (el.type) c.setAttribute('type', el.type);
      fdoc.body.appendChild(c);
      const s = frame.contentWindow.getComputedStyle(c);
      v = { bc: s.borderTopColor, bw: s.borderTopWidth, bs: s.borderTopStyle, bg: s.backgroundColor, ap: s.appearance };
      c.remove();
    } catch {
      v = null;
    }
    uaCache.set(key, v);
    return v;
  };
  const controls = [];
  const sel = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]):not([type=range]):not([type=color]):not([type=file]),select,textarea,[role=checkbox],[role=radio],[role=switch],[role=textbox],[role=combobox],[role=searchbox],[role=spinbutton]';
  for (const el of document.querySelectorAll(sel)) {
    if (controls.length >= 150) break;
    if (U.isDisabled(el) || !U.isVisible(el)) continue;
    const s = U.cs(el);
    const d = ua(el);
    const isDefault = d && s.borderTopColor === d.bc && s.borderTopWidth === d.bw && s.borderTopStyle === d.bs && s.backgroundColor === d.bg && s.appearance === d.ap;
    if (isDefault) continue;
    if (['checkbox', 'radio'].includes(el.type) && s.appearance !== 'none') continue;
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map((k) => ({ side: k.toLowerCase(), w: parseFloat(s[`border${k}Width`]) || 0, style: s[`border${k}Style`], color: s[`border${k}Color`] }));
    controls.push({
      id: U.id(el),
      selector: U.selector(el),
      snippet: U.snippet(el),
      source: U.sourceOf(el),
      bbox: U.docRect(el),
      role: U.role(el),
      name: U.accName(el).slice(0, 60),
      sides,
      bg: s.backgroundColor,
      bgImg: s.backgroundImage !== 'none',
      op: s.opacity,
      outside: el.parentElement ? U.bgChain(el.parentElement) : [],
    });
  }
  frame.remove();
  const icons = [];
  for (const el of document.querySelectorAll('button,a[href],[role=button],[role=link],[role=tab],[role=menuitem]')) {
    if (icons.length >= 150) break;
    if (U.isDisabled(el) || !U.isVisible(el)) continue;
    if (U.collapse(el.innerText || '').replace(/[​\s]/g, '')) continue;
    const svg = el.querySelector('svg');
    let color = null;
    let kind = null;
    if (svg && U.isVisible(svg)) {
      const shape = [...svg.querySelectorAll('path,circle,rect,line,polyline,polygon,ellipse,use')].find((n) => {
        const ss = getComputedStyle(n);
        return (ss.fill && ss.fill !== 'none' && !/rgba\(0, 0, 0, 0\)/.test(ss.fill)) || (ss.stroke && ss.stroke !== 'none');
      });
      if (shape) {
        const ss = getComputedStyle(shape);
        color = ss.stroke && ss.stroke !== 'none' && parseFloat(ss.strokeWidth) > 0 ? ss.stroke : ss.fill;
        kind = 'svg';
      }
    } else {
      const glyph = [el, ...el.querySelectorAll('i,span')].find((n) => {
        const b = getComputedStyle(n, '::before').content;
        return b && b !== 'none' && b !== 'normal' && b !== '""';
      });
      if (glyph) {
        color = getComputedStyle(glyph, '::before').color;
        kind = 'icon font';
      }
    }
    if (!color) continue;
    icons.push({ id: U.id(el), selector: U.selector(el), snippet: U.snippet(el), source: U.sourceOf(el), bbox: U.docRect(el), name: U.accName(el).slice(0, 60), color, kind, chain: U.bgChain(svg || el) });
  }
  const focusables = [];
  const seenSig = new Set();
  for (const el of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])')) {
    if (focusables.length >= 40) break;
    if (!U.tabbable(el) || U.isDisabled(el) || !U.isVisible(el)) continue;
    const sig = `${el.tagName}|${el.type || ''}|${[...el.classList].sort().join('.')}|${el.closest('nav,header,footer,main,dialog,form')?.tagName || ''}`;
    if (seenSig.has(sig)) continue;
    seenSig.add(sig);
    focusables.push({ id: U.id(el), selector: U.selector(el), snippet: U.snippet(el), source: U.sourceOf(el), bbox: U.docRect(el), chain: U.bgChain(el), outside: el.parentElement ? U.bgChain(el.parentElement) : [] });
  }
  return { controls, icons, focusables };
}

function readFocusStyle(id) {
  const el = window.__uie.el(id);
  const s = getComputedStyle(el);
  return { os: s.outlineStyle, ow: parseFloat(s.outlineWidth) || 0, oc: s.outlineColor, oo: parseFloat(s.outlineOffset) || 0, bs: s.boxShadow };
}

export async function run(ctx) {
  const hits = [];
  ctx.apca = [];
  const needsJudgment = [];
  const reviewNotes = new Set();
  let textChecked = 0;
  let pixelSampled = 0;
  for await (const pg of ctx.pages(ctx.states({ widths: 'g2', themes: 'all' }))) {
    const ps = pg.ps;
    const page = pg.page;
    const { canvas, items } = await page.evaluate(collect);
    const colorOf = await colourParser(page, [canvas, ...items.flatMap((i) => [i.color, i.fill, ...i.chain.map((c) => c.bg)])]);
    const canvasC = colorOf(canvas) || { r: 1, g: 1, b: 1, alpha: 1 };
    const pixelQueue = [];
    for (const it of items) {
      textChecked += 1;
      let fg = colorOf(it.fill || it.color);
      if (!fg) {
        reviewNotes.add('some text colours could not be parsed');
        continue;
      }
      if (fg.alpha === 0) {
        reviewNotes.add('text with a transparent fill (e.g. gradient text) is left to the auditor; axe lists it as incomplete');
        continue;
      }
      const chain = it.chain.map((c) => ({ bg: colorOf(c.bg), op: Number(c.op), img: c.img, filter: c.filter, blend: c.blend }));
      const opaqueIdx = chain.findIndex((c) => c.bg && c.bg.alpha >= 0.999 && !c.img);
      const upto = opaqueIdx < 0 ? chain.length : opaqueIdx + 1;
      const imageBehind = chain.slice(0, upto).some((c) => c.img) || (opaqueIdx < 0 && it.chain.some((c) => c.img));
      if (imageBehind || it.foreign || chain.slice(0, upto).some((c) => c.filter || c.blend)) {
        pixelQueue.push({ it, fg, chain });
        continue;
      }
      const { fg: f, bg } = compositeChain(chain, canvasC, fg);
      evaluateText(ctx, ps, it, f, bg, 'computed', hits, needsJudgment);
    }
    for (const q of pixelQueue.slice(0, MAX_PIXEL_SAMPLES)) {
      const res = await pixelSample(page, q.it.id, ctx.deps.PNG, ps.dsf);
      if (!res) continue;
      pixelSampled += 1;
      const op = q.chain.reduce((a, c) => a * (Number.isFinite(c.op) ? c.op : 1), 1);
      let worst = null;
      for (const bgPix of res.samples) {
        const a = (q.fg.alpha ?? 1) * op;
        const f = { r: q.fg.r * a + bgPix.r * (1 - a), g: q.fg.g * a + bgPix.g * (1 - a), b: q.fg.b * a + bgPix.b * (1 - a), alpha: 1 };
        const r = contrastRatio(f, bgPix);
        if (!worst || r < worst.r) worst = { r, f, bg: bgPix };
      }
      if (worst) evaluateText(ctx, ps, q.it, worst.f, worst.bg, 'pixel-sampled (worst point behind the text)', hits, needsJudgment);
    }
    if (pixelQueue.length > MAX_PIXEL_SAMPLES) ctx.partial(`${pixelQueue.length - MAX_PIXEL_SAMPLES} text element(s) over images or gradients were not pixel-sampled (cap ${MAX_PIXEL_SAMPLES} per page state)`);
    await nonText(ctx, pg, canvasC, hits);
  }
  if (reviewNotes.size) for (const n of reviewNotes) ctx.note(n);
  ctx.note('A11Y-12 state indicators and chart marks are judged by the accessibility auditor; boundaries, icons and focus rings are scripted');
  const judgedRel = needsJudgment.length ? ctx.writeEvidence('contrast/needs-judgment.json', { reason: 'CJK text 18–24 px with contrast in [3, 4.5): large-text equivalence for CJK is undefined in WCAG (accessibility.md §5)', items: needsJudgment }) : null;
  // COL-14 (advisory): pairs that pass WCAG but read weak by APCA, once per colour pair and route.
  const lowLc = ctx.apca.filter((a) => a.lc < APCA_FLOOR[a.role]);
  const seenPair = new Set();
  for (const a of lowLc) {
    const key = `${a.route}|${a.fg}|${a.bg}|${a.role}`;
    if (seenPair.has(key) || a.wcag < a.min - 0.005) continue; // WCAG failures are A11Y-11 hits already
    seenPair.add(key);
    hits.push(ctx.hit({
      rule: 'COL-14',
      title: `Weak by APCA, passes WCAG: "${a.text.slice(0, 40)}"`,
      description: `${a.role === 'body' ? 'Body' : a.role === 'large' ? 'Large' : 'Content'} text "${a.text}" passes WCAG at ${a.wcag}:1 but reads APCA-style Lc ${a.lc} (advisory floor ${APCA_FLOOR[a.role]}) in the ${a.theme} theme. Advisory only: consider moving the text token along its ramp.`,
      location: a.loc,
      evidence: [{ type: 'measurement', value: a.lc, detail: `APCA-style Lc ${a.lc} (advisory); WCAG ${a.wcag}:1; fg ${a.fg} on bg ${a.bg}` }],
    }));
    if (seenPair.size >= 30) break;
  }
  const apcaRel = ctx.apca.length ? ctx.writeEvidence('contrast/apca.json', { note: 'APCA-style Lc (advisory, COL-14); computed with colorjs.io, background first; never a pass or fail', floors: APCA_FLOOR, items: ctx.apca.map(({ loc, ...x }) => x).sort((x, y) => x.lc - y.lc).slice(0, 500) }) : null;
  if (!ctx.deps.Color) ctx.note('colorjs.io is not installed: the advisory APCA reading (COL-14) was not computed');
  ctx.record({
    apca: { measured: ctx.apca.length, below_advisory_floor: lowLc.length, file: apcaRel },
    text_checked: textChecked,
    pixel_sampled: pixelSampled,
    needs_judgment: needsJudgment.length,
    needs_judgment_items: judgedRel,
    judged: needsJudgment.length > 0,
    judged_criteria: needsJudgment.length ? ['A11Y-11'] : [],
    judged_wcag: needsJudgment.length ? ['1.4.3'] : [],
  });
  return hits;
}

// COL-14: APCA-style Lc is an advisory reading next to the WCAG ratio, never a pass or fail (ADR-019). colorjs.io
// computes it background first, because the argument order changes the result. Advisory floors by text role.
const APCA_FLOOR = { body: 75, other: 60, large: 45 };

function apcaLc(Color, fg, bg) {
  if (!Color) return null;
  try {
    const lc = new Color('srgb', [bg.r, bg.g, bg.b]).contrast(new Color('srgb', [fg.r, fg.g, fg.b]), 'APCA');
    return Number.isFinite(lc) ? Math.round(Math.abs(lc) * 10) / 10 : null;
  } catch {
    return null;
  }
}

function apcaRole(it) {
  if (isLargeText(it.px, it.weight)) return 'large';
  return (it.text || '').length >= 40 ? 'body' : 'other';
}

function evaluateText(ctx, ps, it, fg, bg, method, hits, needsJudgment) {
  const r = ratio(fg, bg);
  const lc = apcaLc(ctx.deps.Color, fg, bg);
  if (lc !== null) ctx.apca.push({ route: ps.route, theme: ps.theme, width: ps.width, selector: it.selector, text: it.text.slice(0, 60), role: apcaRole(it), lc, wcag: r, min: textContrastMinimum(it.px, it.weight), fg: hex(fg), bg: hex(bg), loc: ctx.loc(ps, { selector: it.selector, bbox: it.bbox, snippet: it.snippet, source: it.source }) });
  const min = textContrastMinimum(it.px, it.weight);
  const where = ctx.loc(ps, { selector: it.selector, bbox: it.bbox, snippet: it.snippet, source: it.source });
  if (it.cjk && cjkReviewBand(it.px, it.weight, r)) {
    needsJudgment.push({ selector: it.selector, route: ps.route, state: ps.state, width: ps.width, theme: ps.theme, size_px: round(it.px, 2), weight: it.weight, ratio: r, text: it.text, bbox: it.bbox });
    return;
  }
  if (r < min - 0.005) {
    hits.push(ctx.hit({
      rule: 'A11Y-11',
      title: `${it.placeholder ? 'Placeholder' : 'Text'} contrast below ${min}:1: "${it.text.slice(0, 40)}"`,
      description: `${it.placeholder ? 'Placeholder text' : 'Text'} "${it.text}" (${round(it.px, 1)} px, weight ${it.weight}${isLargeText(it.px, it.weight) ? ', large' : ''}) has ${r}:1 against its ${method} background in the ${ps.theme} theme at ${ps.width} px; it needs ${min}:1.`,
      location: where,
      evidence: [{ type: 'measurement', value: r, detail: `fg ${hex(fg)} on bg ${hex(bg)}; ${method}; needs ${min}:1${lc !== null ? `; APCA-style Lc ${lc} (advisory)` : ''}` }],
      recommendation: 'Change the colour role token for this text (or add a solid backing behind text over media).',
    }));
  }
  if (method === 'computed' && isGreyOnColour(fg, bg)) {
    hits.push(ctx.hit({
      rule: 'COL-02',
      title: `Grey text on a coloured surface: "${it.text.slice(0, 40)}"`,
      description: `Achromatic text (OKLCH chroma ${round(chroma(fg), 4)}) sits on a chromatic surface (chroma ${round(chroma(bg), 3)}) in the ${ps.theme} theme; tint secondary text from the surface's own hue.`,
      location: where,
      evidence: [{ type: 'measurement', value: { text_chroma: round(chroma(fg), 4), surface_chroma: round(chroma(bg), 3) }, detail: `fg ${hex(fg)} on bg ${hex(bg)}` }],
    }));
  }
}

async function nonText(ctx, pg, canvasC, hits) {
  const ps = pg.ps;
  const page = pg.page;
  const { controls, icons, focusables } = await page.evaluate(collectNonText);
  const colorOf = await colourParser(page, [
    ...controls.flatMap((c) => [c.bg, ...c.sides.map((s) => s.color), ...c.outside.map((o) => o.bg)]),
    ...icons.flatMap((i) => [i.color, ...i.chain.map((c) => c.bg)]),
    ...focusables.flatMap((f) => [...f.chain.map((c) => c.bg), ...f.outside.map((o) => o.bg)]),
  ]);
  const chainOf = (list) => list.map((c) => ({ bg: colorOf(c.bg), op: Number(c.op) }));
  for (const c of controls) {
    if (c.bgImg) continue;
    const outside = compositeChain(chainOf(c.outside), canvasC).bg;
    const fill = compositeChain([{ bg: colorOf(c.bg), op: 1 }, ...chainOf(c.outside)], canvasC).bg;
    const fillRatio = ratio(fill, outside);
    const borders = c.sides.filter((s) => s.w >= 1 && s.style !== 'none' && s.style !== 'hidden' && colorOf(s.color) && colorOf(s.color).alpha > 0.05);
    const borderRatios = borders.map((s) => ({ side: s.side, r: ratio(compositeChain([{ bg: colorOf(s.color), op: 1 }, ...chainOf(c.outside)], canvasC).bg, outside), color: s.color }));
    const hasFillBoundary = fillRatio > 1.05;
    if (!borders.length && !hasFillBoundary) continue;
    const best = Math.max(fillRatio, ...borderRatios.map((b) => b.r));
    if (best < 3 - 0.005) {
      hits.push(ctx.hit({
        rule: 'A11Y-12',
        title: `Control boundary contrast below 3:1: ${c.name ? `"${c.name}"` : c.selector.slice(0, 50)}`,
        description: `The ${c.role} is identified by its ${borders.length ? `border (${borderRatios.map((b) => `${b.side} ${b.r}:1`).join(', ')})` : ''}${borders.length && hasFillBoundary ? ' and ' : ''}${hasFillBoundary ? `fill (${fillRatio}:1)` : ''} against the surrounding surface in the ${ps.theme} theme; at least one boundary needs 3:1.`,
        location: ctx.loc(ps, { selector: c.selector, bbox: c.bbox, snippet: c.snippet, source: c.source }),
        evidence: [{ type: 'measurement', value: round(best, 2), detail: `best boundary ${round(best, 2)}:1 against ${hex(outside)}` }],
      }));
    }
  }
  for (const i of icons) {
    const fg = colorOf(i.color);
    if (!fg) continue;
    const { fg: f, bg } = compositeChain(chainOf(i.chain), canvasC, fg);
    const r = ratio(f, bg);
    if (r < 3 - 0.005) {
      hits.push(ctx.hit({
        rule: 'A11Y-12',
        title: `Icon contrast below 3:1: ${i.name ? `"${i.name}"` : i.selector.slice(0, 50)}`,
        description: `The ${i.kind} icon of an icon-only control has ${r}:1 against its background in the ${ps.theme} theme; meaningful icons need 3:1.`,
        location: ctx.loc(ps, { selector: i.selector, bbox: i.bbox, snippet: i.snippet, source: i.source }),
        evidence: [{ type: 'measurement', value: r, detail: `icon ${hex(f)} on ${hex(bg)}` }],
      }));
    }
  }
  if (!focusables.length) return;
  await withCdp(page, async (cdp) => {
    for (const f of focusables) {
      const nodeId = await nodeIdFor(cdp, f.id);
      if (!nodeId) continue;
      let st;
      try {
        await forceState(cdp, nodeId, ['focus', 'focus-visible']);
        st = await page.evaluate(readFocusStyle, f.id);
      } finally {
        await forceState(cdp, nodeId, []).catch(() => {});
      }
      if (!st) continue;
      let ringColor = null;
      let kind = null;
      if (st.os && st.os !== 'none' && st.ow >= 1) {
        ringColor = st.oc;
        kind = `outline ${st.ow}px`;
      } else if (st.bs && st.bs !== 'none') {
        const m = st.bs.match(/(rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\))\s+0px\s+0px\s+0px\s+(\d+(?:\.\d+)?)px/);
        if (m && Number(m[2]) >= 1) {
          ringColor = m[1];
          kind = `box-shadow ring ${m[2]}px`;
        }
      }
      if (!ringColor) continue;
      const rc = parseColor(ringColor) || (await colourParser(page, [ringColor]))(ringColor);
      if (!rc || rc.alpha < 0.05) continue;
      const against = st.oo < 0 ? f.chain : f.outside;
      const adj = compositeChain(chainOf(against), canvasC).bg;
      const ringOn = compositeChain([{ bg: rc, op: 1 }, ...chainOf(against)], canvasC).bg;
      const r = ratio(ringOn, adj);
      if (r < 3 - 0.005) {
        hits.push(ctx.hit({
          rule: 'A11Y-12',
          title: `Focus indicator contrast below 3:1: ${f.selector.slice(0, 60)}`,
          description: `Under :focus-visible the ${kind} (${hex(ringOn)}) has ${r}:1 against the adjacent colour ${hex(adj)} in the ${ps.theme} theme; focus indicators need 3:1.`,
          location: ctx.loc(ps, { selector: f.selector, bbox: f.bbox, snippet: f.snippet, source: f.source }),
          evidence: [{ type: 'measurement', value: r, detail: `${kind} ${hex(ringOn)} vs ${hex(adj)}` }],
        }));
      }
    }
  }).catch((err) => ctx.error(`${ps.key}: focus-ring contrast skipped: ${err.message.split('\n')[0]}`));
}

/** Parse computed colours in Node; colours Node cannot parse are converted by the page (canvas round-trip). */
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

async function pixelSample(page, id, PNG, dsf = 1) {
  const info = await page.evaluate((elId) => {
    const U = window.__uie;
    const el = U.el(elId);
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    let st = document.getElementById('uie-hide-text-style');
    if (!st) {
      st = document.createElement('style');
      st.id = 'uie-hide-text-style';
      st.textContent = '[data-uie-hide-text],[data-uie-hide-text] *{color:transparent !important;-webkit-text-fill-color:transparent !important;text-shadow:none !important;caret-color:transparent !important}';
      document.head.appendChild(st);
    }
    el.setAttribute('data-uie-hide-text', '');
    const lines = U.lineBoxes(el).map((l) => ({ l: Math.max(0, l.left), t: Math.max(0, l.top), r: Math.min(innerWidth, l.right), b: Math.min(innerHeight, l.bottom) })).filter((l) => l.r - l.l > 1 && l.b - l.t > 1);
    return { lines };
  }, id);
  if (!info || !info.lines.length) {
    await page.evaluate((elId) => window.__uie.el(elId)?.removeAttribute('data-uie-hide-text'), id).catch(() => {});
    return null;
  }
  const x = Math.min(...info.lines.map((l) => l.l));
  const y = Math.min(...info.lines.map((l) => l.t));
  const w = Math.max(...info.lines.map((l) => l.r)) - x;
  const h = Math.max(...info.lines.map((l) => l.b)) - y;
  let buf;
  try {
    buf = await page.screenshot({ clip: { x, y, width: Math.max(1, w), height: Math.max(1, h) }, animations: 'disabled', caret: 'hide' });
  } finally {
    await page.evaluate((elId) => window.__uie.el(elId)?.removeAttribute('data-uie-hide-text'), id).catch(() => {});
  }
  const img = decodePng(PNG, buf);
  const samples = [];
  const step = 3;
  for (const l of info.lines) {
    for (let yy = l.t + 1; yy < l.b - 1; yy += step) {
      for (let xx = l.l + 1; xx < l.r - 1; xx += step) {
        const px = Math.round((xx - x) * dsf);
        const py = Math.round((yy - y) * dsf);
        if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue;
        const i = (py * img.width + px) * 4;
        samples.push({ r: img.data[i] / 255, g: img.data[i + 1] / 255, b: img.data[i + 2] / 255, alpha: 1 });
      }
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  return samples.length ? { samples } : null;
}

function hex(c) {
  const h = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}
