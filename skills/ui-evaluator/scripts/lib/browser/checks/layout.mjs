// layout — FUN-05 (no horizontal page overflow at any width, except declared 2-D regions), FUN-06 (no clipped or
// overlapping text at rest), A11Y-07 (reflow at 320 px), A11Y-08 (text-spacing override), A11Y-09 (200 % text),
// and the interactive inventory compared across widths (LAY-08, advisory).
export const mode = 'shared';
export const mutates = true;
export const criteria = ['FUN-05', 'FUN-06', 'A11Y-07', 'A11Y-08', 'A11Y-09', 'LAY-08'];
export const summary = 'overflow, clipping and overlap at every width; reflow at 320; text-spacing; 200% text; inventory across widths';

export const TEXT_SPACING_CSS = '*,*::before,*::after{line-height:1.5 !important;letter-spacing:0.12em !important;word-spacing:0.16em !important}p{margin-bottom:2em !important}';
export const TEXT_200_CSS = 'html{font-size:200% !important}';

/** In-page measurement: overflow offenders, clipped text, overlapping text. */
function measure({ twoD, controls }) {
  const U = window.__uie;
  U.reset();
  const de = document.documentElement;
  const cw = de.clientWidth;
  const sw = de.scrollWidth;
  const rendered = (el) => !!el && el.getClientRects().length > 0 && U.cs(el).visibility === 'visible' && U.effOpacity(el) > 0.05;
  const inTwoD = (el) => twoD.some((sel) => {
    try {
      return !!el.closest(sel);
    } catch {
      return false;
    }
  });
  const scrollerAncestor = (el, stop) => {
    for (let a = el.parentElement; a && a !== stop && a !== document.body && a !== de; a = a.parentElement) {
      const s = U.cs(a);
      if (/(auto|scroll)/.test(s.overflowX) || /(auto|scroll)/.test(s.overflowY)) return a;
    }
    return null;
  };
  // 1. Horizontal page overflow.
  const overflow = { sw, cw, offenders: [], inTwoD: 0 };
  if (sw > cw + 1) {
    const cands = [];
    for (const el of document.body.querySelectorAll('*')) {
      const s = U.cs(el);
      if (s.position === 'fixed' || s.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const c = U.clippedRect(el);
      if (!c) continue;
      if (c.right + scrollX <= cw + 1 && c.left + scrollX >= -1) continue;
      if (scrollerAncestor(el)) continue;
      cands.push(el);
    }
    const set = new Set(cands);
    for (const el of cands) {
      if (set.has(el.parentElement)) continue;
      if (inTwoD(el)) {
        overflow.inTwoD += 1;
        continue;
      }
      const r = el.getBoundingClientRect();
      if (overflow.offenders.length < 12) overflow.offenders.push({ selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), by: Math.round(r.right + scrollX - cw), source: U.sourceOf(el) });
    }
  }
  // 2. Clipped text: overflow hidden/clip boxes whose descendant text extends past the padding box.
  const clipped = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (clipped.length >= 40) break;
    const s = U.cs(el);
    const clipX = s.overflowX === 'hidden' || s.overflowX === 'clip';
    const clipY = s.overflowY === 'hidden' || s.overflowY === 'clip';
    if (!clipX && !clipY) continue;
    if (!rendered(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (/rect\(\s*(0|1)/.test(s.clip || '') || /inset\(\s*50%/.test(s.clipPath || '')) continue;
    const overX = clipX && el.scrollWidth > el.clientWidth + 1;
    const overY = clipY && el.scrollHeight > el.clientHeight + 1;
    if (!overX && !overY) continue;
    const truncation = s.textOverflow === 'ellipsis' || (s.webkitLineClamp && s.webkitLineClamp !== 'none');
    if (truncation && (el.getAttribute('title') || el.closest('[title]') || el.getAttribute('aria-label'))) continue;
    const bl = U.px(s.borderLeftWidth);
    const bt = U.px(s.borderTopWidth);
    const box = { l: r.left + bl, t: r.top + bt, r: r.left + bl + el.clientWidth, b: r.top + bt + el.clientHeight };
    let sample = null;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let count = 0;
    for (let n = walker.nextNode(); n && count < 400 && !sample; n = walker.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      count += 1;
      const pe = n.parentElement;
      if (!rendered(pe)) continue;
      let nested = false;
      for (let a = pe; a && a !== el; a = a.parentElement) {
        const as = U.cs(a);
        if (/(hidden|clip|auto|scroll)/.test(`${as.overflowX} ${as.overflowY}`)) {
          nested = true;
          break;
        }
      }
      if (nested) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const rr of range.getClientRects()) {
        if (rr.width < 1 || rr.height < 1) continue;
        const tolY = Math.max(2, rr.height * 0.25);
        const outX = clipX && (rr.right > box.r + 2 || rr.left < box.l - 2);
        const outY = clipY && (rr.bottom - box.b > tolY || box.t - rr.top > tolY);
        if (outX || outY) {
          sample = n.nodeValue.trim().slice(0, 80);
          break;
        }
      }
    }
    if (sample) {
      clipped.push({
        selector: U.selector(el),
        bbox: U.docRect(el),
        snippet: U.snippet(el),
        axis: overX && overY ? 'both' : overX ? 'x' : 'y',
        scroll: [el.scrollWidth, el.scrollHeight],
        client: [el.clientWidth, el.clientHeight],
        text: sample,
        source: U.sourceOf(el),
      });
    }
  }
  // 3. Overlapping text boxes of different elements (≥ 4 px across and ≥ 40 % of the smaller line height).
  //    Text is first cut to the region its clipping and scrolling ancestors leave visible.
  const regions = new Map();
  const clipRegion = (el) => {
    if (regions.has(el)) return regions.get(el);
    const reg = { l: -Infinity, t: -Infinity, r: Infinity, b: Infinity };
    for (let a = el; a && a !== de && a !== document.body; a = a.parentElement) {
      const s = U.cs(a);
      const paint = /paint|strict|content/.test(s.contain || '');
      const cx = paint || s.overflowX !== 'visible';
      const cy = paint || s.overflowY !== 'visible';
      if (!cx && !cy) continue;
      const r = a.getBoundingClientRect();
      const pl = r.left + U.px(s.borderLeftWidth) + scrollX;
      const pt = r.top + U.px(s.borderTopWidth) + scrollY;
      if (cx) {
        reg.l = Math.max(reg.l, pl);
        reg.r = Math.min(reg.r, pl + a.clientWidth);
      }
      if (cy) {
        reg.t = Math.max(reg.t, pt);
        reg.b = Math.min(reg.b, pt + a.clientHeight);
      }
    }
    regions.set(el, reg);
    return reg;
  };
  const items = [];
  for (const el of U.textElements(document.body, { limit: 2500 })) {
    const rects = [];
    const reg = clipRegion(el);
    for (const c of el.childNodes) {
      if (c.nodeType !== 3 || !c.nodeValue.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(c);
      for (const q of range.getClientRects()) {
        const box = { l: Math.max(q.left + scrollX, reg.l), t: Math.max(q.top + scrollY, reg.t), r: Math.min(q.right + scrollX, reg.r), b: Math.min(q.bottom + scrollY, reg.b) };
        if (box.r - box.l > 1 && box.b - box.t > 1) rects.push(box);
      }
    }
    if (rects.length) items.push({ el, rects: rects.slice(0, 60) });
  }
  const all = [];
  items.forEach((it, i) => it.rects.forEach((q) => all.push({ ...q, i })));
  all.sort((a, b) => a.t - b.t);
  const pairs = new Map();
  for (let x = 0; x < all.length && pairs.size < 30; x += 1) {
    const a = all[x];
    for (let y = x + 1; y < all.length && all[y].t < a.b; y += 1) {
      const b = all[y];
      if (a.i === b.i) continue;
      const ix = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const iy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (ix < 4 || iy < 0.4 * Math.min(a.b - a.t, b.b - b.t)) continue;
      const k = a.i < b.i ? `${a.i}|${b.i}` : `${b.i}|${a.i}`;
      if (pairs.has(k)) continue;
      const ea = items[a.i].el;
      const eb = items[b.i].el;
      pairs.set(k, {
        selector: U.selector(ea),
        other: U.selector(eb),
        bbox: [Math.round(Math.max(a.l, b.l)), Math.round(Math.max(a.t, b.t)), Math.round(ix), Math.round(iy)],
        snippet: U.snippet(ea),
        texts: [U.ownText(ea).slice(0, 60), U.ownText(eb).slice(0, 60)],
        source: U.sourceOf(ea),
      });
    }
  }
  // 4. Controls covered or hidden (used under 200 % text).
  const covered = [];
  if (controls) {
    for (const el of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=link],[tabindex="0"]')) {
      if (covered.length >= 20) break;
      if (!U.tabbable(el) || U.isDisabled(el)) continue;
      if (!rendered(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const c = U.clippedRect(el);
      if (!c) {
        covered.push({ selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), why: 'clipped away by an overflow-hidden ancestor', source: U.sourceOf(el) });
        continue;
      }
      const cx = (c.left + c.right) / 2;
      const cy = (c.top + c.bottom) / 2;
      if (cy < 0 || cy >= innerHeight || cx < 0 || cx >= innerWidth) continue;
      const top = document.elementFromPoint(cx, cy);
      if (!top || top === el || el.contains(top) || top.contains(el) || (el.labels && [...el.labels].some((l) => l.contains(top)))) continue;
      const ts = U.cs(top);
      if (ts.pointerEvents === 'none') continue;
      covered.push({ selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), why: `covered by ${U.selector(top)}`, source: U.sourceOf(el) });
    }
  }
  return { overflow, clipped, overlaps: [...pairs.values()], covered };
}

async function measureAt(page, twoD, controls) {
  return page.evaluate(measure, { twoD, controls });
}

async function inject(page, css) {
  await page.evaluate((text) => {
    const s = document.createElement('style');
    s.setAttribute('data-uie-inject', '1');
    s.textContent = text;
    document.head.appendChild(s);
  }, css);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(120);
}

async function removeInjected(page) {
  await page.evaluate(() => document.querySelectorAll('style[data-uie-inject]').forEach((s) => s.remove()));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

export async function run(ctx) {
  const hits = [];
  const inventories = new Map();
  for await (const pg of ctx.pages(ctx.states({ widths: 'all', themes: 'first' }))) {
    const ps = pg.ps;
    const page = pg.page;
    const twoD = ps.routeCfg.two_d_regions || [];
    const rest = await measureAt(page, twoD, false);
    const where = (o) => ctx.loc(ps, { selector: o.selector, bbox: o.bbox, snippet: o.snippet, source: o.source });
    if (rest.overflow.sw > rest.overflow.cw + 1 && (rest.overflow.offenders.length || !rest.overflow.inTwoD)) {
      const offs = rest.overflow.offenders;
      const first = offs[0] || { selector: 'html' };
      const detail = `scrollWidth ${rest.overflow.sw} px > clientWidth ${rest.overflow.cw} px at ${ps.width} px`;
      for (const rule of ps.width === 320 ? ['FUN-05', 'A11Y-07'] : ['FUN-05']) {
        hits.push(ctx.hit({
          rule,
          title: rule === 'A11Y-07' ? `Content does not reflow at 320 px on ${ps.route}` : `Horizontal page overflow on ${ps.route}`,
          description: `${detail}. ${offs.length ? `Widest offender: ${first.selector} extends ${first.by} px past the viewport${offs.length > 1 ? `; ${offs.length - 1} more` : ''}.` : 'No single element was identified (check margins and pseudo-elements).'}${rest.overflow.inTwoD ? ` ${rest.overflow.inTwoD} offender(s) inside declared 2-D regions were ignored.` : ''}`,
          location: where(first),
          evidence: [{ type: 'measurement', value: { scrollWidth: rest.overflow.sw, clientWidth: rest.overflow.cw, offenders: offs.slice(0, 5).map((o) => ({ selector: o.selector, by: o.by })) }, detail }],
          recommendation: 'Constrain the element (max-width: 100%, min-width: 0 on flex and grid children, overflow-wrap: anywhere) or give genuinely 2-D content its own scroll region and declare it in two_d_regions.',
        }));
      }
    }
    for (const c of rest.clipped) {
      hits.push(ctx.hit({
        rule: 'FUN-06',
        title: `Clipped text in ${c.selector.slice(0, 60)}`,
        description: `Text ("${c.text}") overflows a box with overflow hidden at ${ps.width} px (scroll ${c.scroll.join('×')} vs client ${c.client.join('×')}, axis ${c.axis}).`,
        location: where(c),
        evidence: [{ type: 'measurement', value: { scroll: c.scroll, client: c.client }, detail: `clipped on ${c.axis}` }],
      }));
    }
    for (const o of rest.overlaps) {
      hits.push(ctx.hit({
        rule: 'FUN-06',
        title: `Overlapping text: ${o.selector.slice(0, 80)}`,
        description: `At ${ps.width} px, text of ${o.selector} ("${o.texts[0]}") overlaps text of ${o.other} ("${o.texts[1]}") by ${o.bbox[2]}×${o.bbox[3]} px.`,
        location: where(o),
        evidence: [{ type: 'measurement', value: { overlap: o.bbox.slice(2), other: o.other }, detail: 'intersecting text boxes' }],
      }));
    }
    const restKeys = new Set([...rest.clipped.map((c) => `c|${c.selector}`), ...rest.overlaps.map((o) => `o|${o.selector}|${o.other}`)]);
    // Text-spacing override (WCAG 1.4.12).
    await inject(page, TEXT_SPACING_CSS);
    const spaced = await measureAt(page, twoD, false);
    await removeInjected(page);
    for (const c of spaced.clipped.filter((x) => !restKeys.has(`c|${x.selector}`))) {
      hits.push(ctx.hit({
        rule: 'A11Y-08',
        title: `Text clips under the text-spacing override in ${c.selector.slice(0, 60)}`,
        description: `With line-height 1.5, paragraph spacing 2em, letter spacing 0.12em and word spacing 0.16em, text ("${c.text}") is cut off at ${ps.width} px (scroll ${c.scroll.join('×')} vs client ${c.client.join('×')}).`,
        location: where(c),
        evidence: [{ type: 'measurement', value: { scroll: c.scroll, client: c.client }, detail: 'text-spacing override' }],
        recommendation: 'Replace fixed heights on text containers with min-height or padding, and let text wrap.',
      }));
    }
    for (const o of spaced.overlaps.filter((x) => !restKeys.has(`o|${x.selector}|${x.other}`))) {
      hits.push(ctx.hit({
        rule: 'A11Y-08',
        title: `Text overlaps under the text-spacing override: ${o.selector.slice(0, 80)}`,
        description: `At ${ps.width} px with the WCAG 1.4.12 spacing override, ${o.selector} ("${o.texts[0]}") overlaps ${o.other} ("${o.texts[1]}").`,
        location: where(o),
        evidence: [{ type: 'measurement', value: { overlap: o.bbox.slice(2) }, detail: 'text-spacing override' }],
      }));
    }
    // 200 % text (WCAG 1.4.4).
    const restControls = await measureAt(page, twoD, true);
    const coveredBefore = new Set(restControls.covered.map((c) => c.selector));
    await inject(page, TEXT_200_CSS);
    const big = await measureAt(page, twoD, true);
    await removeInjected(page);
    for (const c of big.clipped.filter((x) => !restKeys.has(`c|${x.selector}`))) {
      hits.push(ctx.hit({
        rule: 'A11Y-09',
        title: `Text clips at 200 % text size in ${c.selector.slice(0, 60)}`,
        description: `With the root font size at 200 %, text ("${c.text}") is cut off at ${ps.width} px.`,
        location: where(c),
        evidence: [{ type: 'measurement', value: { scroll: c.scroll, client: c.client }, detail: 'root font-size 200%' }],
        recommendation: 'Size text and its containers in rem or em and avoid fixed heights.',
      }));
    }
    for (const o of big.overlaps.filter((x) => !restKeys.has(`o|${x.selector}|${x.other}`))) {
      hits.push(ctx.hit({
        rule: 'A11Y-09',
        title: `Text overlaps at 200 % text size: ${o.selector.slice(0, 80)}`,
        description: `At ${ps.width} px with the root font size at 200 %, ${o.selector} ("${o.texts[0]}") overlaps ${o.other} ("${o.texts[1]}").`,
        location: where(o),
        evidence: [{ type: 'measurement', value: { overlap: o.bbox.slice(2) }, detail: 'root font-size 200%' }],
      }));
    }
    for (const c of big.covered.filter((x) => !coveredBefore.has(x.selector))) {
      hits.push(ctx.hit({
        rule: 'A11Y-09',
        title: `Control not operable at 200 % text size: ${c.selector.slice(0, 60)}`,
        description: `With the root font size at 200 %, the control is ${c.why} at ${ps.width} px.`,
        location: where(c),
        evidence: [{ type: 'measurement', detail: c.why }],
      }));
    }
    // Inventory for LAY-08.
    const key = `${ps.route}#${ps.state}`;
    if (!inventories.has(key)) inventories.set(key, { ps, byWidth: new Map() });
    const inv = pg.inventory || [];
    inventories.get(key).byWidth.set(ps.width, new Set(inv.filter((c) => c.name).map((c) => `${c.role}|${c.name}`)));
  }
  for (const { ps, byWidth } of inventories.values()) {
    if (byWidth.size < 2) continue;
    const union = new Set();
    for (const s of byWidth.values()) for (const k of s) union.add(k);
    const missing = [];
    for (const k of union) {
      const absentAt = [...byWidth.entries()].filter(([, s]) => !s.has(k)).map(([w]) => w);
      if (absentAt.length) missing.push({ control: k.replace('|', ' "') + '"', widths: absentAt });
    }
    if (missing.length) {
      hits.push(ctx.hit({
        rule: 'LAY-08',
        title: `${missing.length} control(s) missing at some widths on ${ps.route}`,
        description: `Controls present at one width are absent at others (not visible or not in the page): ${missing.slice(0, 6).map((m) => `${m.control} at ${m.widths.join('/')} px`).join('; ')}. If they move into a menu, capture the menu-open state too.`,
        location: { route: ps.route, state: ps.state, selector: 'body' },
        evidence: [{ type: 'measurement', value: missing.slice(0, 30), detail: 'interactive inventory across widths' }],
        problem_type: 'multiple_locations',
        severity: 1,
      }));
    }
  }
  ctx.record({ text_spacing_css: TEXT_SPACING_CSS, text_resize_css: TEXT_200_CSS });
  return hits;
}
