// Focus helpers for the interaction checks (keyboard, dialogs): an in-page library installed as window.__uieFocus
// (deep active element, stop records, nine-point obscuring samples, the reachability inventory, open modals) and
// pure Node helpers (walk tracking, visual-order inversions, focused-vs-blurred pixel metrics) that are unit-tested
// without a browser. Methods follow 08 §4.3 S3 and TOOL-05/06/07: Tab and Shift+Tab walks, a 0-px focused-vs-
// blurred diff for 2.4.7, nine elementFromPoint samples for 2.4.11, reachable set vs clickable set for 2.1.1.
import { contrastRatio } from '../util/color.mjs';
import { decodePng, diffImages } from './png.mjs';

/* eslint-disable no-restricted-globals */
function focusLib() {
  if (window.__uieFocus && window.__uieFocus.v === 3) return true;
  const U = window.__uie;
  const F = { v: 3 };
  const NATIVE = 'a[href],area[href],button,input:not([type=hidden]),select,textarea,summary,iframe,[contenteditable=""],[contenteditable=true],audio[controls],video[controls]';
  const COMPOSITE = new Set(['tablist', 'toolbar', 'radiogroup', 'menu', 'menubar', 'listbox', 'grid', 'tree', 'treegrid']);
  const POPUPISH = '[role=dialog],[role=alertdialog],dialog,[role=menu],[role=listbox],[role=tooltip],[popover],details[open]';

  /** The focused element, through open shadow roots. */
  F.deepActive = () => {
    let a = document.activeElement;
    for (let i = 0; a && a.shadowRoot && a.shadowRoot.activeElement && i < 20; i += 1) a = a.shadowRoot.activeElement;
    return a;
  };

  /** Composed parent (crosses shadow boundaries). */
  const up = (el) => el.parentElement || (el.getRootNode && el.getRootNode() !== document && el.getRootNode().host) || null;
  const composedContains = (anc, el) => {
    for (let a = el; a; a = up(a)) if (a === anc) return true;
    return false;
  };

  /** Nearest ancestor-or-self with position fixed or sticky (persistent page chrome). */
  F.fixedOf = (el) => {
    for (let a = el; a && a !== document.documentElement; a = up(a)) {
      const p = U.cs(a).position;
      if (p === 'fixed' || p === 'sticky') return a;
    }
    return null;
  };

  /** Visible modal dialogs: native :modal dialogs and visible [aria-modal=true] dialogs. */
  F.openModals = () => {
    const out = [];
    for (const d of document.querySelectorAll('dialog,[role=dialog],[role=alertdialog]')) {
      let modal = false;
      try {
        modal = d.matches(':modal');
      } catch {
        modal = false;
      }
      if (!modal && d.getAttribute('aria-modal') === 'true' && U.isVisible(d)) modal = true;
      if (modal) out.push(d);
    }
    return out;
  };
  F.modalOf = (el) => F.openModals().find((d) => composedContains(d, el)) || null;

  const docRectOf = (r) => [Math.round(r.left + scrollX), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)];
  /** First line box of an element (its reading start), document coordinates. */
  F.firstRect = (el) => {
    const rs = [...el.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
    return rs.length ? docRectOf(rs[0]) : docRectOf(el.getBoundingClientRect());
  };

  /** Does `t` (hit at a sample point) visibly paint over the point? Transparent click-catchers do not hide anything. */
  const paints = (t, stop) => {
    for (let a = t; a && a !== stop && a !== document.body && a !== document.documentElement; a = up(a)) {
      const s = U.cs(a);
      if (['IMG', 'VIDEO', 'CANVAS', 'PICTURE', 'IFRAME', 'svg', 'SVG'].includes(a.tagName)) return true;
      if (s.backgroundImage && s.backgroundImage !== 'none') return true;
      if (s.backdropFilter && s.backdropFilter !== 'none') return true;
      const m = String(s.backgroundColor).match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(/[,\s/]+/).filter(Boolean);
        const alpha = parts.length >= 4 ? parseFloat(parts[3]) : 1;
        if (alpha >= 0.5) return true;
      } else if (s.backgroundColor && s.backgroundColor !== 'transparent') return true;
      if (U.collapse(a.innerText || '').length && a === t) return true;
    }
    return false;
  };

  /** The element a sample point landed on, widened to the obscuring layer (fixed/sticky bar or a top-level block). */
  const coverOf = (t) => {
    const f = F.fixedOf(t);
    if (f) return f;
    let c = t;
    for (let a = t; a && a !== document.body && a !== document.documentElement; a = up(a)) {
      const p = U.cs(a).position;
      c = a;
      if (p === 'absolute') return a;
    }
    return c;
  };

  /**
   * Nine-point obscuring sample (TOOL-07): corners (inset ≤ 2 px), edge midpoints and centre of the focused box.
   * A point counts for the element when elementFromPoint returns it, a descendant, an ancestor (pointer-events:none
   * on the element) or one of its labels. Points outside the viewport are not counted.
   */
  F.nine = (el, { userOpened = false } = {}) => {
    const r = el.getBoundingClientRect();
    const ix = Math.min(2, r.width / 4);
    const iy = Math.min(2, r.height / 4);
    const xs = [r.left + ix, r.left + r.width / 2, r.right - ix];
    const ys = [r.top + iy, r.top + r.height / 2, r.bottom - iy];
    const root = el.getRootNode && el.getRootNode().elementFromPoint ? el.getRootNode() : document;
    const labels = el.labels ? [...el.labels] : [];
    let inView = 0;
    let self = 0;
    let transparent = 0;
    let excepted = 0;
    const covers = new Map();
    for (const y of ys) {
      for (const x of xs) {
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
        inView += 1;
        const t = root.elementFromPoint(x, y);
        if (!t) continue;
        if (t === el || composedContains(el, t) || composedContains(t, el) || labels.some((l) => l === t || l.contains(t))) {
          self += 1;
          continue;
        }
        const c = coverOf(t);
        if (!paints(t, c.parentElement)) {
          transparent += 1; // a transparent click-catcher does not hide the element visually
          continue;
        }
        const fixed = !!F.fixedOf(t);
        if (userOpened && (!fixed || t.closest(POPUPISH))) {
          excepted += 1; // content the user opened (state recipe) and can dismiss: the 2.4.11 exception
          continue;
        }
        covers.set(c, (covers.get(c) || 0) + 1);
      }
    }
    return {
      inView,
      self,
      transparent,
      excepted,
      obscured: inView > 0 && self === 0 && transparent === 0 && excepted === 0 && covers.size > 0,
      obscurers: [...covers.keys()].slice(0, 3).map((c) => ({ id: U.id(c), selector: U.selector(c), position: U.cs(c).position, snippet: U.snippet(c, 140) })),
    };
  };

  /** Describe the current focus stop. */
  F.stop = ({ userOpened = false } = {}) => {
    U.reset();
    const el = F.deepActive();
    if (!el || el === document.body || el === document.documentElement) return { body: true, url: location.href, modals: F.openModals().map((d) => U.id(d)), navs: F.drainNavs() };
    const tag = el.tagName.toLowerCase();
    let inner = null;
    if (tag === 'iframe' || tag === 'frame') {
      try {
        const d = el.contentDocument;
        const ia = d && d.activeElement;
        inner = ia && ia !== d.body ? `${ia.tagName.toLowerCase()}#${[...d.querySelectorAll('*')].indexOf(ia)}` : 'body';
      } catch {
        inner = 'cross-origin';
      }
    }
    const r = el.getBoundingClientRect();
    const visible = U.isVisible(el);
    const fixed = F.fixedOf(el);
    const modal = F.modalOf(el);
    const labels = (el.labels ? [...el.labels] : []).filter((l) => U.isVisible(l)).map((l) => {
      const lr = l.getBoundingClientRect();
      return { x: lr.left, y: lr.top, w: lr.width, h: lr.height };
    });
    const parent = up(el);
    const pr = parent && parent !== document.body ? parent.getBoundingClientRect() : null;
    // The largest small container (≤ 4 levels, ≤ 640 × 480 px) around the element: indicators drawn with
    // :focus-within on a card or row appear there rather than within the element's own box + 4 px.
    let container = null;
    for (let a = parent, d = 0; a && a !== document.body && a !== document.documentElement && d < 4; a = up(a), d += 1) {
      const ar = a.getBoundingClientRect();
      if (ar.width > 640 || ar.height > 480) break;
      if (ar.width * ar.height > r.width * r.height) container = { x: ar.left, y: ar.top, w: ar.width, h: ar.height };
    }
    const cs = getComputedStyle(el);
    return {
      fsig: [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.outlineOffset, cs.boxShadow, cs.borderTopColor, cs.borderBottomColor, cs.backgroundColor, cs.color, cs.textDecorationLine].join('|'),
      id: U.id(el),
      tag,
      role: U.role(el),
      name: U.accName(el).slice(0, 80),
      selector: U.selector(el),
      snippet: U.snippet(el),
      source: U.sourceOf(el),
      rect: { x: r.left, y: r.top, w: r.width, h: r.height },
      doc: docRectOf(r),
      first: F.firstRect(el),
      visible,
      fixed: !!fixed,
      modal: modal ? U.id(modal) : null,
      frame: tag === 'iframe' || tag === 'frame',
      inner,
      custom: tag.includes('-') && !el.shadowRoot,
      // Native date and time inputs take several Tab presses (one per segment and the picker button) on one element.
      segmented: tag === 'input' && /^(date|time|datetime-local|month|week)$/i.test(el.type || ''),
      sample: visible ? F.nine(el, { userOpened }) : null,
      modals: F.openModals().map((d) => U.id(d)),
      navs: F.drainNavs(),
      url: location.href,
      vw: innerWidth,
      vh: innerHeight,
      dir: getComputedStyle(el).direction,
      labels,
      parent: pr && pr.width * pr.height > 0 && pr.width <= 640 && pr.height <= 320 ? { x: pr.left, y: pr.top, w: pr.width, h: pr.height } : null,
      container,
    };
  };

  F.blurActive = () => {
    const a = F.deepActive();
    if (a && a.blur && a !== document.body) a.blur();
    return !!a;
  };

  /**
   * Put focus back on a stop after the blurred capture, without scrolling, so the next key press is dispatched to
   * it (key handlers of widgets see the right target). Navigations started by the re-focus are discarded.
   */
  F.refocus = (id) => {
    const el = U.el(id);
    if (!el || !el.isConnected || !el.focus) return false;
    const was = F.walking;
    const open = window.open;
    F.walking = true;
    window.open = () => null;
    try {
      el.focus({ preventScroll: true });
    } finally {
      window.open = open;
      F.drainNavs();
      F.walking = was;
    }
    return F.deepActive() === el;
  };

  /**
   * Record (and, where the browser allows, cancel) navigations started while a walk runs, through the Navigation
   * API's synchronous `navigate` event, so a navigation caused by focus alone is attributed to the focused stop.
   * Hash-only changes are not navigations of context.
   */
  F.navs = [];
  F.hookNav = (cancel = true) => {
    F.navCancel = cancel;
    if (!F.openHooked) {
      // New windows opened by script during the walk are recorded synchronously (attributed to the focused stop).
      F.openHooked = true;
      const open = window.open;
      window.open = function uieOpen(...args) {
        if (F.walking) F.navs.push({ url: String(args[0] || 'about:blank'), window: true });
        return open.apply(this, args);
      };
    }
    if (F.navHooked || !window.navigation) return !!window.navigation;
    F.navHooked = true;
    window.navigation.addEventListener('navigate', (e) => {
      if (!F.walking) return;
      const url = e.destination && e.destination.url ? e.destination.url : '';
      if (url.replace(/#.*$/, '') === location.href.replace(/#.*$/, '')) return;
      F.navs.push({ url, sameDocument: !!(e.destination && e.destination.sameDocument), canceled: !!(F.navCancel && e.cancelable) });
      if (F.navCancel && e.cancelable) e.preventDefault();
    });
    return true;
  };
  F.drainNavs = () => F.navs.splice(0, F.navs.length);

  const reactProps = (el) => {
    const k = Object.keys(el).find((x) => x.startsWith('__reactProps$'));
    return k ? el[k] : null;
  };
  const CLICKY = ['onClick', 'onMouseDown', 'onMouseUp', 'onPointerDown', 'onPointerUp', 'onTouchStart', 'onTouchEnd'];
  const handlerHint = (el) => {
    if (el.hasAttribute('onclick') || el.hasAttribute('onmousedown') || el.hasAttribute('onpointerdown')) return 'onclick attribute';
    if (typeof el.onclick === 'function' || typeof el.onmousedown === 'function') return 'onclick property';
    const rp = reactProps(el);
    if (rp && CLICKY.some((k) => typeof rp[k] === 'function')) return 'React click handler';
    const vei = el._vei;
    if (vei && Object.keys(vei).some((k) => /^on(click|mousedown|mouseup|pointerdown|pointerup|touchstart)/i.test(k))) return 'Vue click handler';
    return null;
  };

  /**
   * The reachability inventory at rest: every visible element that is natively focusable, has a tabindex, an
   * interactive role, a click handler (attribute, property, React or Vue props) or its own pointer cursor.
   * `cdpCandidates` lists pointer-cursor elements without a visible handler, for a CDP listener lookup.
   */
  F.inventory = () => {
    U.reset();
    const out = [];
    const modals = F.openModals();
    const all = document.body ? document.body.querySelectorAll('*') : [];
    for (const el of all) {
      if (out.length >= 1500) break;
      const tag = el.tagName;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'OPTION', 'OPTGROUP', 'LABEL', 'BR', 'HEAD', 'TITLE'].includes(tag)) continue;
      if (tag !== 'svg' && el.closest('svg')) continue;
      const native = el.matches(NATIVE);
      const tiAttr = el.getAttribute('tabindex');
      const ti = tiAttr === null || tiAttr.trim() === '' || !Number.isFinite(Number(tiAttr)) ? null : Number(tiAttr);
      const roleAttr = (el.getAttribute('role') || '').trim().split(/\s+/)[0];
      const interactiveRole = !!roleAttr && U.INTERACTIVE_ROLES.has(roleAttr);
      const hint = handlerHint(el);
      const s = U.cs(el);
      const ownPointer = s.cursor === 'pointer' && !(el.parentElement && U.cs(el.parentElement).cursor === 'pointer');
      if (!native && ti === null && !interactiveRole && !hint && !ownPointer) continue;
      if (!U.isVisible(el)) continue;
      if (el.closest('select,datalist')) continue;
      const focusableAnc = el.parentElement ? el.parentElement.closest(`${NATIVE},[tabindex]`) : null;
      let comp = null;
      for (let a = el.parentElement; a && !comp; a = a.parentElement) if (COMPOSITE.has((a.getAttribute('role') || '').trim())) comp = a;
      const r = el.getBoundingClientRect();
      out.push({
        id: U.id(el),
        tag: tag.toLowerCase(),
        type: (el.getAttribute('type') || '').toLowerCase(),
        role: U.role(el),
        roleAttr,
        name: U.accName(el).slice(0, 80),
        text: U.collapse(el.innerText || el.textContent || '').slice(0, 60),
        selector: U.selector(el),
        snippet: U.snippet(el),
        source: U.sourceOf(el),
        doc: docRectOf(r),
        first: F.firstRect(el),
        native,
        tabindex: ti,
        tabbable: U.tabbable(el),
        disabled: U.isDisabled(el) || !!el.disabled,
        inert: U.isInert(el),
        ariaHidden: !!el.closest('[aria-hidden="true"]'),
        interactiveRole,
        hint,
        pointer: ownPointer,
        focusableAncestor: focusableAnc ? U.id(focusableAnc) : null,
        composite: comp ? U.id(comp) : null,
        activedescendant: comp ? comp.hasAttribute('aria-activedescendant') : false,
        radioGroup: tag === 'INPUT' && el.type === 'radio' ? `${el.form ? U.id(el.form) : 'doc'}|${el.name || `#${U.id(el)}`}` : null,
        href: el.getAttribute('href') || null,
        fixed: !!F.fixedOf(el),
        inModal: modals.length ? !!modals.find((d) => composedContains(d, el)) : null,
        hasFocusableDescendant: !!el.querySelector(NATIVE),
      });
    }
    return { items: out, modals: modals.map((d) => U.id(d)) };
  };

  /** Ancestors (composed) of each reached element, so wrappers of reached controls count as reached. */
  F.reachedClosure = (ids) => {
    const set = new Set();
    for (const i of ids) {
      for (let a = U.el(i); a; a = up(a)) set.add(U.id(a));
    }
    return [...set];
  };

  /** Is any descendant of `id` in `ids`? */
  F.containsAny = (id, ids) => {
    const el = U.el(id);
    if (!el) return false;
    return ids.some((i) => {
      const x = U.el(i);
      return x && x !== el && composedContains(el, x);
    });
  };

  window.__uieFocus = F;
  return true;
}

export const FOCUS_LIB_SOURCE = `(${focusLib.toString()})()`;

/** Install window.__uie (by the caller) and window.__uieFocus. Idempotent. */
export async function ensureFocusLib(page) {
  await page.evaluate(FOCUS_LIB_SOURCE);
}

/** Make focus scrolling deterministic: smooth scrolling would move the page while we measure. */
export const NO_SMOOTH_SCROLL_CSS = 'html,body,*{scroll-behavior:auto !important}';

// --- walk tracking (2.1.2) ------------------------------------------------------------------------------------

/**
 * Tracks a Tab (or Shift+Tab) walk and decides when it ends. Stops are {key, id, modal, frame, custom} or
 * {body:true}. Ends: `wrapped` (back at the start), `modal-cycle` (cycle inside one modal dialog: expected),
 * `stuck` (focus did not move), `cycle` (returned to an earlier stop without wrapping: a trap), `cap`, `empty`.
 */
export class WalkTracker {
  constructor({ startKey = null, cap = 200 } = {}) {
    this.startKey = startKey;
    this.cap = cap;
    this.stops = [];
    this.seen = new Map();
    this.firstKey = null;
    this.bodyRun = 0;
    this.sameRun = 0;
    this.lastKey = null;
    this.presses = 0;
    // Focus left the document (Tab past the last stop goes to the browser) and came back: the walk went round.
    // The element focused at the start (e.g. an error summary with tabindex="-1") may not be in the Tab sequence.
    this.leftDocument = false;
    this.wrapIndex = null;
  }

  /** Feed one observation; returns null to continue or {end, ...} to stop. */
  push(stop) {
    this.presses += 1;
    if (stop.body) {
      this.bodyRun += 1;
      this.lastKey = null;
      this.sameRun = 0;
      if (this.stops.length) this.leftDocument = true;
      if (this.bodyRun >= 3) return { end: this.stops.length ? 'stuck-outside' : 'empty' };
      if (this.presses >= this.cap * 2) return { end: 'cap' };
      return null;
    }
    this.bodyRun = 0;
    const key = stop.key;
    if (key === this.lastKey) {
      this.sameRun += 1;
      const limit = stop.frame ? 60 : stop.custom ? 25 : stop.segmented ? 8 : 2;
      if (this.sameRun >= limit) return { end: 'stuck', key, index: this.stops.length - 1 };
      return null;
    }
    this.sameRun = 0;
    this.lastKey = key;
    if (this.firstKey === null) this.firstKey = key;
    const target = this.startKey ?? this.firstKey;
    if (this.seen.has(key)) {
      if (key === target || this.leftDocument) return { end: 'wrapped' };
      const from = this.seen.get(key);
      const members = this.stops.slice(from);
      const modals = new Set(members.map((s) => s.modal));
      if (modals.size === 1 && !modals.has(null) && !modals.has(undefined)) return { end: 'modal-cycle', from, members };
      return { end: 'cycle', from, members, key };
    }
    if (this.leftDocument && this.wrapIndex === null) this.wrapIndex = this.stops.length;
    this.seen.set(key, this.stops.length);
    this.stops.push(stop);
    if (this.startKey !== null && key === this.startKey && this.stops.length > 1) return { end: 'wrapped' };
    if (this.stops.length >= this.cap) return { end: 'cap' };
    return null;
  }
}

// --- visual order (2.4.3) ------------------------------------------------------------------------------------

const overlap1d = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/**
 * Clear backward jumps between consecutive tab stops, judged on reading-start boxes ([x, y, w, h], document px):
 * `upward` — B lies entirely above A by more than `tol` px while the two overlap horizontally (moving up within a
 * column); `backward-in-row` — the two share a row (vertical overlap ≥ half the shorter height) and B lies entirely
 * before A in the writing direction by more than `tol` px. Moving up into another column, and stops inside fixed or
 * sticky layers or dialogs, never count. Each item: {box, full, skip?, rtl?}.
 */
export function clearInversions(stops, { tol = 8 } = {}) {
  const out = [];
  for (let i = 0; i + 1 < stops.length; i += 1) {
    const a = stops[i];
    const b = stops[i + 1];
    if (!a || !b || a.skip || b.skip || !a.box || !b.box) continue;
    const [ax, ay, aw, ah] = a.box;
    const [bx, by, bw, bh] = b.box;
    if (aw < 1 || ah < 1 || bw < 1 || bh < 1) continue;
    const fa = a.full || a.box;
    const fb = b.full || b.box;
    const hOverlap = overlap1d(fa[0], fa[0] + fa[2], fb[0], fb[0] + fb[2]);
    if (by + bh <= ay - tol + 0.5 && hOverlap >= 1) {
      out.push({ index: i, kind: 'upward', dy: Math.round(ay - (by + bh)) });
      continue;
    }
    const vOverlap = overlap1d(ay, ay + ah, by, by + bh);
    if (vOverlap >= 0.5 * Math.min(ah, bh)) {
      const rtl = !!(a.rtl && b.rtl);
      if (!rtl && bx + bw <= ax - tol + 0.5) out.push({ index: i, kind: 'backward-in-row', dx: Math.round(ax - (bx + bw)) });
      else if (rtl && bx >= ax + aw + tol - 0.5) out.push({ index: i, kind: 'backward-in-row', dx: Math.round(bx - (ax + aw)) });
    }
  }
  return out;
}

// --- focus visibility metrics (2.4.7; CMP-02 advisory) ---------------------------------------------------------

/**
 * Compare a focused crop with the blurred crop of the same area. `box` is the element's box inside the crop
 * ([x, y, w, h] in crop pixels, CSS px when the shots use scale 'css'). Returns:
 * - changedInner: changed pixels within the box + `inner` px (the A11Y-04 test: 0 means no visible focus change);
 * - changed: changed pixels in the whole crop;
 * - qualifying: changed pixels whose focused and unfocused colours differ by ≥ 3:1 (change contrast);
 * - perimeterArea: area of a 2 px perimeter of the box (4w + 4h − 16), the CMP-02 area floor;
 * - band: the thickest run of qualifying pixels crossing the box edge along its centre lines (indicator thickness).
 * CMP-02 (advisory, [calibrating]) passes when band ≥ 2 or qualifying ≥ perimeterArea.
 * pixelmatch runs with threshold 0 and anti-aliasing counted, so "0 changed" means pixel-identical.
 */
export function focusChangeMetrics({ PNG, pixelmatch }, focusedBuf, blurredBuf, box, { inner = 4 } = {}) {
  const a = focusedBuf && focusedBuf.data ? focusedBuf : decodePng(PNG, focusedBuf);
  const b = blurredBuf && blurredBuf.data ? blurredBuf : decodePng(PNG, blurredBuf);
  const d = diffImages(pixelmatch, a, b, { threshold: 0, includeAA: true });
  const [bx, by, bw, bh] = box;
  const x0 = Math.max(0, Math.floor(bx - inner));
  const y0 = Math.max(0, Math.floor(by - inner));
  const x1 = Math.min(d.width, Math.ceil(bx + bw + inner));
  const y1 = Math.min(d.height, Math.ceil(by + bh + inner));
  let changedInner = 0;
  let qualifying = 0;
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const q = new Uint8Array(d.width * d.height);
  for (let y = 0; y < d.height; y += 1) {
    for (let x = 0; x < d.width; x += 1) {
      if (!d.mask[y * d.width + x]) continue;
      if (x >= x0 && x < x1 && y >= y0 && y < y1) changedInner += 1;
      if (x < w && y < h) {
        const ia = (y * a.width + x) * 4;
        const ib = (y * b.width + x) * 4;
        const ca = { r: a.data[ia] / 255, g: a.data[ia + 1] / 255, b: a.data[ia + 2] / 255 };
        const cb = { r: b.data[ib] / 255, g: b.data[ib + 1] / 255, b: b.data[ib + 2] / 255 };
        if (contrastRatio(ca, cb) >= 3 - 1e-9) {
          qualifying += 1;
          q[y * d.width + x] = 1;
        }
      }
    }
  }
  const W = Math.max(0, Math.round(bw));
  const H = Math.max(0, Math.round(bh));
  const perimeterArea = W >= 4 && H >= 4 ? 4 * W + 4 * H - 16 : W * H;
  // Thickest qualifying run crossing each box edge along the horizontal and vertical centre lines.
  const scan = (pts) => {
    let best = 0;
    let cur = 0;
    for (const [x, y] of pts) {
      if (x >= 0 && y >= 0 && x < d.width && y < d.height && q[y * d.width + x]) {
        cur += 1;
        best = Math.max(best, cur);
      } else cur = 0;
    }
    return best;
  };
  const line = (n, f) => Array.from({ length: Math.max(0, n) }, (_, i) => f(i));
  const cy = Math.round(by + bh / 2);
  const cx = Math.round(bx + bw / 2);
  const edge = 3; // a run may start up to 3 px inside the box (inset rings, border changes)
  const runs = [];
  if (cy >= 0 && cy < d.height) {
    const left = Math.ceil(bx + edge);
    runs.push(scan(line(left + 1, (i) => [left - i, cy])));
    const right = Math.floor(bx + bw - edge);
    runs.push(scan(line(d.width - right, (i) => [right + i, cy])));
  }
  if (cx >= 0 && cx < d.width) {
    const top = Math.ceil(by + edge);
    runs.push(scan(line(top + 1, (i) => [cx, top - i])));
    const bottom = Math.floor(by + bh - edge);
    runs.push(scan(line(d.height - bottom, (i) => [cx, bottom + i])));
  }
  return { changedInner, changed: d.changed, qualifying, perimeterArea, band: runs.length ? Math.max(...runs) : 0, width: d.width, height: d.height };
}

/** CMP-02 indicator metric [calibrating]: ≥ 2 px thick or ≥ a 2 px perimeter, counting only ≥ 3:1 changes. */
export function indicatorProblems(m) {
  if (m.band >= 2 || m.qualifying >= m.perimeterArea) return [];
  return [`thickest ≥ 3:1 change is ${m.band} px (< 2 px) and its area is ${m.qualifying} px (< ${m.perimeterArea} px, a 2 px perimeter)`];
}

/** Pixel-identical test of two PNG buffers of the same clip (CMP-02 "distinct from hover"; CMP-01 state diffs). */
export function changedPixels({ PNG, pixelmatch }, bufA, bufB) {
  const a = bufA && bufA.data ? bufA : decodePng(PNG, bufA);
  const b = bufB && bufB.data ? bufB : decodePng(PNG, bufB);
  return diffImages(pixelmatch, a, b, { threshold: 0, includeAA: true }).changed;
}

/** A screenshot clip around a viewport rect, clamped to the viewport; null when nothing of it is on screen. */
export function clipAround(rect, margin, vw, vh) {
  const x0 = Math.max(0, Math.floor(rect.x - margin));
  const y0 = Math.max(0, Math.floor(rect.y - margin));
  const x1 = Math.min(vw, Math.ceil(rect.x + rect.w + margin));
  const y1 = Math.min(vh, Math.ceil(rect.y + rect.h + margin));
  if (x1 - x0 < 1 || y1 - y0 < 1) return null;
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/** Union of viewport rects {x, y, w, h}. */
export function unionRects(rects) {
  const rs = rects.filter((r) => r && r.w > 0 && r.h > 0);
  if (!rs.length) return null;
  const x0 = Math.min(...rs.map((r) => r.x));
  const y0 = Math.min(...rs.map((r) => r.y));
  const x1 = Math.max(...rs.map((r) => r.x + r.w));
  const y1 = Math.max(...rs.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
