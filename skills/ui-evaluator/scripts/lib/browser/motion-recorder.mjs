// The motion recorder: an init script installed before any app script when the motion check runs
// (BrowserSession.initScripts). It logs every CSS animation start, CSS transition run and Web Animations call with
// the phase it happened in (load → settle → recipe → check, set by the session), and samples the animated element's
// geometry every frame while it moves. The motion check reads window.__uieMotion afterwards, so MOT-02/04/06/07 are
// measured from what actually ran, without replaying anything. The page's own behaviour is unchanged: listeners are
// passive and Element.prototype.animate is wrapped transparently.

/* eslint-disable no-restricted-globals */
function motionRecorder() {
  if (window.__uieMotion) return;
  const MAX_EVENTS = 2500;
  const MAX_NODES = 2000;
  const MAX_TRACKS = 400;
  const TRACK_CAP_MS = 2600;
  const M = { v: 1, phase: 'load', marks: { load: 0 }, events: [], nodes: [], tracks: [], dropped: 0, waapi: 0 };
  window.__uieMotion = M;
  const index = new WeakMap();
  const live = new Map();

  const idOf = (el) => {
    let i = index.get(el);
    if (i !== undefined) return i;
    if (M.nodes.length >= MAX_NODES) return -1;
    i = M.nodes.length;
    M.nodes.push(el);
    index.set(el, i);
    return i;
  };
  const ms = (v) => {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return 0;
    return /ms\s*$/.test(String(v)) ? n : n * 1000;
  };
  const split = (v) => String(v || '').split(',').map((x) => x.trim());
  const contextOf = (el) => {
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const p = getComputedStyle(a).position;
      if (p === 'fixed') return 'fixed';
      if (p === 'sticky') return 'sticky';
    }
    return 'flow';
  };
  const angleUnit = (v) => {
    const m = /(-?[\d.]+)(deg|turn|rad|grad)?\s*$/.exec(String(v || '').trim());
    if (!m) return 0;
    const n = Number(m[1]);
    if (m[2] === 'turn') return n * 360;
    if (m[2] === 'rad') return (n * 180) / Math.PI;
    if (m[2] === 'grad') return n * 0.9;
    return n;
  };
  const lengthOf = (v, ref) => {
    const s = String(v || '').trim();
    if (!s) return 0;
    const n = parseFloat(s);
    if (!Number.isFinite(n)) return 0;
    return s.endsWith('%') ? (n / 100) * ref : n;
  };

  /** One geometry sample: rect centre and size, own transform translation, scale and rotation. */
  const measure = (tr) => {
    const el = M.nodes[tr.node];
    if (!el || !el.isConnected) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    let a = 1;
    let b = 0;
    let c = 0;
    let d = 1;
    let e = 0;
    let f = 0;
    if (s.transform && s.transform !== 'none') {
      try {
        const m = new DOMMatrixReadOnly(s.transform);
        ({ a, b, c, d, e, f } = m);
      } catch {
        /* unparsable transform: keep identity */
      }
    }
    let tx = e;
    let ty = f;
    if (s.translate && s.translate !== 'none') {
      const parts = s.translate.split(/\s+/);
      tx += lengthOf(parts[0], r.width);
      ty += lengthOf(parts[1] || '0', r.height);
    }
    let sx = Math.hypot(a, b);
    let sy = Math.hypot(c, d);
    if (s.scale && s.scale !== 'none') {
      const v = s.scale.split(/\s+/).map((x) => (String(x).endsWith('%') ? parseFloat(x) / 100 : parseFloat(x)));
      if (Number.isFinite(v[0])) {
        sx *= v[0];
        sy *= Number.isFinite(v[1]) ? v[1] : v[0];
      }
    }
    let angle = (Math.atan2(b, a) * 180) / Math.PI;
    if (s.rotate && s.rotate !== 'none') angle += angleUnit(s.rotate.split(/\s+/).pop());
    const off = tr.ctx === 'flow' ? { x: scrollX, y: scrollY } : { x: 0, y: 0 };
    return { cx: r.left + r.width / 2 + off.x, cy: r.top + r.height / 2 + off.y, w: r.width, h: r.height, tx, ty, s: Math.sqrt(Math.abs(sx * sy)), sx, sy, angle, op: parseFloat(s.opacity) };
  };

  const fold = (tr, g) => {
    if (!g) return;
    const A = tr.agg;
    if (!A) {
      tr.agg = { first: g, minCx: g.cx, maxCx: g.cx, minCy: g.cy, maxCy: g.cy, minW: g.w, maxW: g.w, minH: g.h, maxH: g.h, minTx: g.tx, maxTx: g.tx, minTy: g.ty, maxTy: g.ty, minS: g.s, maxS: g.s, rotCum: 0, rotMax: 0, prevAngle: g.angle, minOp: g.op, maxOp: g.op };
      tr.n = 1;
      return;
    }
    A.minCx = Math.min(A.minCx, g.cx);
    A.maxCx = Math.max(A.maxCx, g.cx);
    A.minCy = Math.min(A.minCy, g.cy);
    A.maxCy = Math.max(A.maxCy, g.cy);
    A.minW = Math.min(A.minW, g.w);
    A.maxW = Math.max(A.maxW, g.w);
    A.minH = Math.min(A.minH, g.h);
    A.maxH = Math.max(A.maxH, g.h);
    A.minTx = Math.min(A.minTx, g.tx);
    A.maxTx = Math.max(A.maxTx, g.tx);
    A.minTy = Math.min(A.minTy, g.ty);
    A.maxTy = Math.max(A.maxTy, g.ty);
    A.minS = Math.min(A.minS, g.s);
    A.maxS = Math.max(A.maxS, g.s);
    A.minOp = Math.min(A.minOp, g.op);
    A.maxOp = Math.max(A.maxOp, g.op);
    let delta = g.angle - A.prevAngle;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    A.rotCum += delta;
    A.rotMax = Math.max(A.rotMax, Math.abs(A.rotCum));
    A.prevAngle = g.angle;
    tr.n += 1;
  };

  let raf = 0;
  const loop = () => {
    raf = 0;
    const now = performance.now();
    let active = 0;
    for (const tr of M.tracks) {
      if (tr.done) continue;
      if (now > tr.until) {
        tr.done = true;
        continue;
      }
      try {
        fold(tr, measure(tr));
      } catch {
        tr.done = true;
      }
      active += 1;
    }
    if (active) raf = requestAnimationFrame(loop);
  };
  const ensureLoop = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const track = (el, id, kind, name, prop, durMs) => {
    const now = performance.now();
    const until = now + Math.min(TRACK_CAP_MS, Math.max(120, (Number.isFinite(durMs) ? durMs : TRACK_CAP_MS) + 150));
    let tr = live.get(id);
    if (tr && !tr.done) {
      tr.until = Math.max(tr.until, until);
    } else {
      if (M.tracks.length >= MAX_TRACKS) {
        M.dropped += 1;
        return;
      }
      tr = { node: id, ctx: contextOf(el), phase: M.phase, start: now, until, kinds: [], names: [], props: [], n: 0, agg: null, done: false };
      M.tracks.push(tr);
      live.set(id, tr);
      try {
        fold(tr, measure(tr));
      } catch {
        /* sampling is best effort */
      }
    }
    if (!tr.kinds.includes(kind)) tr.kinds.push(kind);
    if (name && !tr.names.includes(name) && tr.names.length < 8) tr.names.push(name);
    if (prop && !tr.props.includes(prop) && tr.props.length < 12) tr.props.push(prop);
    ensureLoop();
  };

  const record = (kind, el, name, prop, durMs, extra) => {
    if (!el || el.nodeType !== 1) return;
    const id = idOf(el);
    if (id < 0) return;
    if (M.events.length < MAX_EVENTS) {
      M.events.push({ kind, t: Math.round(performance.now()), node: id, name: name || '', prop: prop || '', dur: Number.isFinite(durMs) ? Math.round(durMs) : null, infinite: durMs === Infinity, phase: M.phase, sy: Math.round(scrollY), ...(extra || {}) });
    }
    track(el, id, kind, name, prop, durMs);
  };

  addEventListener(
    'transitionrun',
    (e) => {
      try {
        const el = e.target;
        const s = getComputedStyle(el, e.pseudoElement || null);
        const props = split(s.transitionProperty);
        let i = props.indexOf(e.propertyName);
        if (i < 0) i = props.indexOf('all');
        const durs = split(s.transitionDuration);
        const dels = split(s.transitionDelay);
        const k = i < 0 ? 0 : i;
        const dur = ms(durs[k % durs.length]);
        const delay = ms(dels[k % dels.length]);
        record('transition', el, '', e.propertyName, dur + Math.max(0, delay), { pseudo: e.pseudoElement || '', duration: Math.round(dur), delay: Math.round(delay) });
      } catch {
        /* never disturb the page */
      }
    },
    { capture: true, passive: true },
  );
  addEventListener(
    'animationstart',
    (e) => {
      try {
        const el = e.target;
        const s = getComputedStyle(el, e.pseudoElement || null);
        const names = split(s.animationName);
        const i = Math.max(0, names.indexOf(e.animationName));
        const durs = split(s.animationDuration);
        const its = split(s.animationIterationCount);
        const dur = ms(durs[i % durs.length]);
        const it = its[i % its.length];
        const total = it === 'infinite' ? Infinity : dur * (parseFloat(it) || 1);
        record('animation', el, e.animationName, '', total, { pseudo: e.pseudoElement || '', duration: Math.round(dur) });
      } catch {
        /* never disturb the page */
      }
    },
    { capture: true, passive: true },
  );
  const original = Element.prototype.animate;
  if (typeof original === 'function') {
    Element.prototype.animate = function animate(keyframes, options) {
      const anim = original.call(this, keyframes, options);
      try {
        M.waapi += 1;
        const t = anim.effect && anim.effect.getComputedTiming ? anim.effect.getComputedTiming() : {};
        const total = t.iterations === Infinity ? Infinity : Number(t.activeDuration) || 0;
        record('waapi', this, anim.id || '', '', total + (Number(t.delay) || 0), { duration: Math.round(Number(t.duration) || 0) });
      } catch {
        /* never disturb the page */
      }
      return anim;
    };
  }
}

/** Source text of the init script. */
export const MOTION_RECORDER_SOURCE = `(${motionRecorder.toString()})();`;
