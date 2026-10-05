// In-page collectors of the motion check (checks/motion.mjs). Each function passed to page.evaluate is
// self-contained: it sees only window.__uie (inpage.mjs) and window.__uieMotion (motion-recorder.mjs).

/** In-page collection. Self-contained: runs inside the page through page.evaluate. */
export function collectMotion({ maxEls, maxPseudo }) {
  const U = window.__uie;
  U.reset();
  const R = window.__uieMotion || null;
  const vw = innerWidth;
  const vh = innerHeight;
  const ms = (t) => {
    const v = parseFloat(t);
    if (!Number.isFinite(v)) return 0;
    return /ms\s*$/.test(String(t)) ? v : v * 1000;
  };
  const split = (v) => {
    const out = [];
    let depth = 0;
    let cur = '';
    for (const ch of String(v || '')) {
      if (ch === '(') depth += 1;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        out.push(cur.trim());
        cur = '';
      } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };
  const OVERLAY_SEL = 'dialog,[role=dialog],[role=alertdialog],[aria-modal="true"],[popover],[role=menu],[role=listbox],[role=tooltip]';
  const OVERLAY_RE = /(^|[\s_-])(modal|dialog|drawer|sheet|popover|popup|dropdown|tooltip|toast|snackbar|offcanvas|flyout|lightbox)([\s_-]|$)/i;
  const SCRIM_RE = /(^|[\s_-])(backdrop|scrim|overlay|curtain)([\s_-]|$)/i;
  const PROGRESS_RE = /(^|[\s_-])(spinner|spin|loader|loading|progress|progressbar|skeleton|shimmer|busy|throbber)([\s_-]|$)/i;
  const PAGE_SEL = 'html,body,main,#root,#app,#__next,#__nuxt,#___gatsby,#svelte,[data-page]';
  const nameOf = (el) => `${typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || ''} ${el.id || ''}`;
  const ancestorRe = (el, re, depth) => {
    for (let a = el, d = 0; a && a.nodeType === 1 && d < depth; a = a.parentElement, d += 1) if (re.test(nameOf(a))) return true;
    return false;
  };
  const sectionOf = (el) => {
    for (let a = el; a && a.nodeType === 1 && a !== document.body; a = a.parentElement) {
      if (a.matches('section,article,[class*="section" i],main > *')) return a;
      const r = a.getBoundingClientRect();
      if (r.height >= 120 && r.width >= vw * 0.5 && a.parentElement && (a.parentElement === document.body || a.parentElement.matches('main,#root,#app,#__next'))) return a;
    }
    return null;
  };
  const sigOf = (el) => {
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter((c) => c && !/^(is|has)-|[0-9a-f]{6,}|__[A-Za-z0-9]{5,}$/.test(c)).sort().slice(0, 3) : [];
    return `${el.tagName.toLowerCase()}${cls.map((c) => `.${c}`).join('')}`;
  };
  const descs = new Map();
  const desc = (el) => {
    const id = U.id(el);
    if (descs.has(id)) return id;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const fixed = s.position === 'fixed';
    const area = r.width * r.height;
    const overlay = !!el.closest(OVERLAY_SEL) || ancestorRe(el, OVERLAY_RE, 4) || ((s.position === 'fixed' || s.position === 'absolute') && !!el.closest('[role=status],[role=alert]'));
    const scrim = (fixed || s.position === 'absolute') && (SCRIM_RE.test(nameOf(el)) || (area >= vw * vh * 0.8 && /rgba?\([^)]*,\s*0?\.\d+\)|\/ 0?\.\d+\)/.test(s.backgroundColor)));
    const sec = sectionOf(el);
    descs.set(id, {
      id,
      selector: U.selector(el),
      sig: sigOf(el),
      tag: el.tagName.toLowerCase(),
      snippet: U.snippet(el),
      bbox: U.docRect(el),
      visible: U.isVisible(el),
      source: U.sourceOf(el),
      position: s.position,
      overlay,
      scrim,
      page: el.matches(PAGE_SEL),
      progress: !!el.closest('[role=progressbar],progress,[aria-busy="true"]') || ancestorRe(el, PROGRESS_RE, 3),
      draggable: el.getAttribute('draggable') === 'true',
      firstViewport: r.top + scrollY < vh && r.bottom + scrollY > 0,
      section: sec ? U.id(sec) : null,
      sectionSelector: sec ? U.selector(sec) : null,
    });
    return id;
  };

  // 1. Declared transitions and animations (computed style of elements and ::before/::after).
  const items = [];
  let pseudoBudget = maxPseudo;
  const scan = (el, s, pseudo) => {
    const tps = split(s.transitionProperty);
    const tds = split(s.transitionDuration).map(ms);
    const tdl = split(s.transitionDelay).map(ms);
    const tfs = split(s.transitionTimingFunction);
    tps.forEach((p, i) => {
      const d = tds[i % (tds.length || 1)] || 0;
      if (d <= 0 || p === 'none') return;
      items.push({ kind: 'transition', el: desc(el), pseudo, prop: p, dur: d, delay: tdl[i % (tdl.length || 1)] || 0, ease: tfs[i % (tfs.length || 1)] || 'ease' });
    });
    const ans = split(s.animationName);
    if (!ans.length || (ans.length === 1 && ans[0] === 'none')) return;
    const ads = split(s.animationDuration).map(ms);
    const aic = split(s.animationIterationCount);
    const atf = split(s.animationTimingFunction);
    const adl = split(s.animationDelay).map(ms);
    const atl = split(s.animationTimeline || 'auto');
    ans.forEach((n, i) => {
      if (n === 'none') return;
      const it = aic[i % (aic.length || 1)] || '1';
      items.push({
        kind: 'animation',
        el: desc(el),
        pseudo,
        name: n,
        dur: ads[i % (ads.length || 1)] || 0,
        iterations: it === 'infinite' ? 'infinite' : parseFloat(it) || 1,
        ease: atf[i % (atf.length || 1)] || 'ease',
        delay: adl[i % (adl.length || 1)] || 0,
        timeline: atl[i % (atl.length || 1)] || 'auto',
      });
    });
  };
  const all = [document.documentElement, document.body, ...document.body.querySelectorAll('*')].slice(0, maxEls);
  for (const el of all) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'META', 'LINK', 'TITLE', 'HEAD', 'BR'].includes(el.tagName)) continue;
    scan(el, getComputedStyle(el), '');
    if (pseudoBudget <= 0) continue;
    for (const pseudo of ['::before', '::after']) {
      const ps = getComputedStyle(el, pseudo);
      if (ps.content && ps.content !== 'none' && ps.content !== 'normal') {
        pseudoBudget -= 1;
        scan(el, ps, pseudo);
      }
    }
  }

  // 2. CSSOM: @keyframes under the current emulation, and transitions declared only in :hover/:focus/:active rules.
  const scaleOf = (props) => {
    let sx = 1;
    let sy = 1;
    const t = props.transform;
    if (t && t !== 'none') {
      try {
        const m = new DOMMatrixReadOnly(t);
        sx = Math.hypot(m.a, m.b);
        sy = Math.hypot(m.c, m.d);
      } catch {
        const mm = /scale(?:3d)?\(\s*(-?[\d.]+)(?:\s*,\s*(-?[\d.]+))?/.exec(t);
        if (mm) {
          sx = Math.abs(Number(mm[1]));
          sy = Math.abs(mm[2] !== undefined ? Number(mm[2]) : Number(mm[1]));
        }
      }
    }
    if (props.scale && props.scale !== 'none') {
      const v = props.scale.split(/\s+/).map((x) => (x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x)));
      if (Number.isFinite(v[0])) {
        sx *= Math.abs(v[0]);
        sy *= Math.abs(Number.isFinite(v[1]) ? v[1] : v[0]);
      }
    }
    return { sx, sy };
  };
  const keyframes = {};
  const hoverRules = [];
  let crossOrigin = 0;
  const frameList = (r) =>
    [...r.cssRules].map((k) => {
      const props = {};
      for (let i = 0; i < k.style.length; i += 1) props[k.style[i]] = k.style.getPropertyValue(k.style[i]);
      const offsets = String(k.keyText || '')
        .split(',')
        .map((x) => x.trim())
        .map((x) => (x === 'from' ? 0 : x === 'to' ? 1 : parseFloat(x) / 100));
      const sc = scaleOf(props);
      return { offsets, props, easing: k.style.getPropertyValue('animation-timing-function') || null, scale0: sc.sx <= 0.05 && sc.sy <= 0.05 };
    });
  const walk = (rules, ok) => {
    for (const r of rules) {
      try {
        if (r.type === 7) {
          if (ok) keyframes[r.name] = frameList(r);
        } else if (r.type === 4) walk(r.cssRules, ok && matchMedia(r.media.mediaText).matches);
        else if (r.type === 12) walk(r.cssRules, ok && CSS.supports(r.conditionText));
        else if (r.type === 1) {
          if (r.cssRules && r.cssRules.length) walk(r.cssRules, ok);
          if (ok && /:(hover|focus|focus-visible|focus-within|active)\b/.test(r.selectorText || '')) {
            const st = r.style;
            const tr = st.getPropertyValue('transition');
            const tp = st.getPropertyValue('transition-property');
            const td = st.getPropertyValue('transition-duration');
            const tf = st.getPropertyValue('transition-timing-function');
            if (tr || tp || td) {
              const base = r.selectorText.replace(/:(hover|focus-visible|focus-within|focus|active)\b/g, '');
              let match = null;
              try {
                match = document.querySelector(base);
              } catch {
                match = null;
              }
              if (match) hoverRules.push({ selector: r.selectorText.slice(0, 160), property: tp || null, duration: td || null, timing: tf || null, transition: tr || null, el: desc(match) });
            }
          }
        } else if (r.cssRules) walk(r.cssRules, ok);
      } catch {
        /* unreadable rule */
      }
    }
  };
  for (const sh of document.styleSheets) {
    let rules = null;
    try {
      rules = sh.cssRules;
    } catch {
      crossOrigin += 1;
      continue;
    }
    if (!rules) continue;
    let ok = true;
    try {
      ok = !sh.media || !sh.media.mediaText || matchMedia(sh.media.mediaText).matches;
    } catch {
      ok = true;
    }
    walk(rules, ok);
  }

  // 3. Animations running (or held by fill) now, with their keyframes.
  const running = [];
  for (const a of document.getAnimations()) {
    const eff = a.effect;
    const t = eff && eff.target;
    if (!t || running.length >= 400) continue;
    const timing = eff.getComputedTiming ? eff.getComputedTiming() : {};
    let kf = [];
    try {
      kf = eff.getKeyframes();
    } catch {
      kf = [];
    }
    const props = [...new Set(kf.flatMap((f) => Object.keys(f)).filter((k) => !['offset', 'computedOffset', 'easing', 'composite'].includes(k)))];
    const first = kf.find((f) => (f.computedOffset ?? f.offset) === 0) || kf[0] || null;
    let scale0 = false;
    if (first) {
      const sc = scaleOf({ transform: first.transform, scale: first.scale });
      scale0 = sc.sx <= 0.05 && sc.sy <= 0.05;
    }
    running.push({
      type: a.constructor ? a.constructor.name : 'Animation',
      el: desc(t),
      pseudo: eff.pseudoElement || '',
      name: a.animationName || a.transitionProperty || a.id || '',
      iterations: timing.iterations === Infinity ? 'infinite' : timing.iterations,
      duration: Number(timing.duration) || 0,
      easing: timing.easing || 'linear',
      frameEasings: kf.map((f) => f.easing).filter((e) => e && e !== 'linear'),
      playState: a.playState,
      props,
      timeline: a.timeline && a.timeline.constructor ? a.timeline.constructor.name : null,
      scale0,
    });
  }

  // 4. What the recorder logged since the first byte.
  let recorder = null;
  if (R) {
    const nodeDesc = (i) => {
      const el = R.nodes[i];
      return el && el.isConnected ? desc(el) : null;
    };
    recorder = {
      marks: R.marks,
      dropped: R.dropped,
      waapi: R.waapi,
      events: R.events.map((e) => ({ ...e, el: nodeDesc(e.node) })),
      tracks: R.tracks.map((t) => ({ el: nodeDesc(t.node), node: t.node, ctx: t.ctx, phase: t.phase, kinds: t.kinds, names: t.names, props: t.props, n: t.n, agg: t.agg ? { ...t.agg, first: undefined } : null, first: t.agg ? t.agg.first : null })),
    };
  }

  // 5. MOT-05: text that occupies space but is still hidden by a reveal after load and a full scroll.
  const REVEAL_ATTR = '[data-aos],[data-sal],[data-reveal],[data-animate],[data-scroll],[data-sr-id],.wow,.reveal,.fade-in,.fade-up,.animate-on-scroll';
  const collapsed = (el) => !!el.closest('[aria-hidden="true"],[inert],[hidden],details:not([open]),[role=tabpanel],[role=dialog],[role=alertdialog],[role=menu],[role=listbox],[role=tooltip],[aria-roledescription="slide"],[aria-roledescription="carousel"],dialog:not([open]),[popover]');
  const revealSignature = (el, s) => {
    const tp = split(s.transitionProperty);
    const td = split(s.transitionDuration).map(ms);
    const transitions = tp.some((p, i) => (td[i % (td.length || 1)] || 0) > 0 && /^(all|opacity|transform|translate|scale|rotate|visibility|clip-path|filter)$/.test(p));
    const anim = s.animationName && s.animationName !== 'none';
    const moved = (s.transform && s.transform !== 'none') || (s.translate && s.translate !== 'none') || (s.scale && s.scale !== 'none');
    let lib = false;
    try {
      lib = el.matches(REVEAL_ATTR);
    } catch {
      lib = false;
    }
    return transitions || anim || moved || lib;
  };
  const hiddenBy = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue && n.nodeValue.trim().length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  let textCount = 0;
  for (let n = walker.nextNode(); n && textCount < 4000; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TITLE', 'OPTION'].includes(el.tagName)) continue;
    textCount += 1;
    const r = el.getBoundingClientRect();
    if (r.width * r.height < 4 || !el.getClientRects().length) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.contentVisibility === 'hidden') continue;
    const op = U.effOpacity(el);
    const visHidden = s.visibility !== 'visible';
    let hider = null;
    let how = null;
    if (op < 0.05 || visHidden) {
      for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
        const as = getComputedStyle(a);
        if (parseFloat(as.opacity) < 0.05 || (visHidden && as.visibility !== 'visible' && (!a.parentElement || getComputedStyle(a.parentElement).visibility === 'visible'))) {
          hider = a;
          how = parseFloat(as.opacity) < 0.05 ? `opacity ${as.opacity}` : `visibility ${as.visibility}`;
          if (parseFloat(as.opacity) < 0.05) break;
        }
      }
    } else if (!U.clippedRect(el)) {
      // Fully clipped by an overflow-hidden ancestor: a line mask whose text has not slid in.
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        const as = getComputedStyle(a);
        if (as.overflowX === 'hidden' || as.overflowY === 'hidden' || as.overflowX === 'clip' || as.overflowY === 'clip') break;
        let m = null;
        try {
          m = as.transform && as.transform !== 'none' ? new DOMMatrixReadOnly(as.transform) : null;
        } catch {
          m = null;
        }
        const ar = a.getBoundingClientRect();
        if (m && Math.abs(m.e) < 1 && Math.abs(m.f) >= 0.5 * ar.height && ar.height > 0) {
          hider = a;
          how = `translated ${Math.round(m.f)} px out of a clipping box`;
          break;
        }
      }
    } else {
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        const cp = getComputedStyle(a).clipPath;
        if (cp && /^inset\(/.test(cp)) {
          hider = a;
          how = `clip-path ${cp}`;
          break;
        }
      }
    }
    if (!hider || collapsed(el) || collapsed(hider)) continue;
    const hs = getComputedStyle(hider);
    if (hs.position === 'absolute' || hs.position === 'fixed') continue;
    if (!revealSignature(hider, hs) && !(hider !== el && revealSignature(el, s))) continue;
    if (how && how.startsWith('clip-path')) {
      const hr = hider.getBoundingClientRect();
      const m = /inset\(([^)]*)\)/.exec(hs.clipPath);
      if (!m) continue;
      const parts = m[1].split(/\s+round\s+/)[0].trim().split(/\s+/).map((p) => (p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p)));
      const [t = 0, rr = t, b = t, l = rr] = parts.map((v, i) => (Number.isFinite(v) ? (v > 1.0001 ? v / (i % 2 === 0 ? hr.height || 1 : hr.width || 1) : v) : 0));
      if (t + b < 0.98 && l + rr < 0.98) continue;
    }
    const hid = U.id(hider);
    if (!hiddenBy.has(hid)) hiddenBy.set(hid, { el: desc(hider), how, text: U.collapse(n.nodeValue).slice(0, 80), chars: 0 });
    hiddenBy.get(hid).chars += U.collapse(n.nodeValue).length;
  }

  // 6. MOT-06 at rest: elements parked at scale(0) that transition their transform when shown.
  const scale0Rest = [];
  for (const it of items) {
    if (it.kind !== 'transition' || !/^(all|transform|scale)$/.test(it.prop) || it.pseudo) continue;
    const el = U.el(it.el);
    if (!el) continue;
    const s = getComputedStyle(el);
    const sc = scaleOf({ transform: s.transform, scale: s.scale });
    if (sc.sx <= 0.05 && sc.sy <= 0.05 && !scale0Rest.includes(it.el)) scale0Rest.push(it.el);
  }

  return {
    vw,
    vh,
    scrollHeight: document.documentElement.scrollHeight,
    items: items.slice(0, 6000),
    itemsTotal: items.length,
    keyframes,
    hoverRules: hoverRules.slice(0, 200),
    crossOrigin,
    running,
    recorder,
    hidden: [...hiddenBy.values()].slice(0, 40),
    scale0Rest,
    nodes: Object.fromEntries(descs),
    scanned: all.length,
  };
}

/** Wait (bounded) for finite running animations and transitions to finish: "lets animations settle" (MOT-05). */
export async function settleAnimations(page, timeout = 1500) {
  await page
    .evaluate(async (ms) => {
      const finite = document.getAnimations().filter((a) => {
        const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {};
        return t.iterations !== Infinity && a.playState === 'running';
      });
      await Promise.race([Promise.all(finite.map((a) => a.finished.catch(() => null))), new Promise((r) => setTimeout(r, ms))]);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, timeout)
    .catch(() => {});
}

/**
 * Scroll-linked movement under reduced motion (MOT-04): transforms that take three different values at three scroll
 * positions, ignoring elements whose transform changes without scrolling (running animations) and two-state toggles
 * (hide-on-scroll headers), plus animations bound to a scroll or view timeline.
 */
export function scrollLinkedProbe() {
  const U = window.__uie;
  const H = document.documentElement.scrollHeight;
  const vh = innerHeight;
  const timelines = [];
  for (const a of document.getAnimations()) {
    const tl = a.timeline && a.timeline.constructor ? a.timeline.constructor.name : '';
    if (!/Scroll|View/.test(tl)) continue;
    const t = a.effect && a.effect.target;
    if (!t) continue;
    let kf = [];
    try {
      kf = a.effect.getKeyframes();
    } catch {
      kf = [];
    }
    const props = [...new Set(kf.flatMap((f) => Object.keys(f)).filter((k) => !['offset', 'computedOffset', 'easing', 'composite'].includes(k)))];
    timelines.push({ id: U.id(t), selector: U.selector(t), bbox: U.docRect(t), snippet: U.snippet(t), source: U.sourceOf(t), name: a.animationName || a.id || '', timeline: tl, props });
    if (timelines.length >= 20) break;
  }
  if (H <= vh + 40) return Promise.resolve({ scrollable: false, linked: [], timelines });
  const els = [...document.body.querySelectorAll('*')].filter((el) => el.getClientRects().length && !['SCRIPT', 'STYLE'].includes(el.tagName)).slice(0, 2500);
  const read = () =>
    els.map((el) => {
      const s = getComputedStyle(el);
      return `${s.transform}|${s.translate}|${s.scale}|${s.rotate}`;
    });
  const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  return (async () => {
    window.scrollTo(0, 0);
    await frames();
    await wait(50);
    const a0 = read();
    await wait(120);
    await frames();
    const a1 = read();
    const unstable = new Set();
    a0.forEach((v, i) => {
      if (v !== a1[i]) unstable.add(i);
    });
    const samples = [a1];
    for (const f of [0.33, 0.66]) {
      window.scrollTo(0, Math.round((H - vh) * f));
      await frames();
      await wait(80);
      samples.push(read());
    }
    window.scrollTo(0, 0);
    await frames();
    const linked = [];
    els.forEach((el, i) => {
      if (unstable.has(i) || linked.length >= 20) return;
      const values = new Set(samples.map((s) => s[i]));
      if (values.size >= 3) linked.push({ id: U.id(el), selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el), values: [...values].slice(0, 3).map((v) => v.slice(0, 80)) });
    });
    return { scrollable: true, linked, timelines, unstable: unstable.size };
  })();
}
