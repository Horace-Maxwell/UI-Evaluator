// Pure rules behind the motion check (QUALITY-BAR MOT-01…07; ADR-032 for the MOT-04 large-displacement limits).
// No DOM, no Playwright: unit-tested directly. Numbers repeat QUALITY-BAR; [calibrating] ones are marked.
import { durationCeiling, bezierOvershoot, BOUNCE_NAME, isLayoutProperty } from './thresholds.mjs';

const kebab = (p) => String(p || '').trim().replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Properties that move, resize or reshape what is on screen (MOT-04 "spatial"; MOT-07 choreography). */
const SPATIAL = /^(transform|translate|scale|rotate|perspective|transform-origin|offset(-[a-z]+)*|top|left|right|bottom|inset(-[a-z]+)*|margin(-[a-z]+)*|padding(-[a-z]+)*|width|height|(min|max)-(width|height)|inline-size|block-size|background-position(-[xy])?|background-size|clip-path|x|y|cx|cy|r|d|all)$/;

export function isSpatialProperty(p) {
  return SPATIAL.test(kebab(p));
}

/** Choreography moves or reveals: spatial properties plus opacity (a pure colour change is feedback, not choreography). */
export function isChoreographyProperty(p) {
  const k = kebab(p);
  return isSpatialProperty(k) || k === 'opacity' || k === 'visibility' || k === 'filter';
}

/** linear() easing values outside [−0.1, 1.1] overshoot (springs and bounces written as linear() stops). */
export function linearOvershoot(easing) {
  const out = [];
  const re = /linear\(([^()]*)\)/g;
  let m;
  while ((m = re.exec(String(easing || '')))) {
    const values = m[1]
      .split(',')
      .map((part) => parseFloat(part.trim().split(/\s+/)[0]))
      .filter(Number.isFinite);
    if (values.some((v) => v < -0.1 - 1e-9 || v > 1.1 + 1e-9)) out.push(m[0].length > 80 ? `${m[0].slice(0, 77)}…)` : m[0]);
  }
  return out;
}

/** MOT-03: every overshooting easing in a timing-function list (cubic-bezier y outside [−0.1, 1.1], or linear()). */
export function overshootingEasings(easing) {
  return [...bezierOvershoot(easing), ...linearOvershoot(easing)];
}

export function isBounceName(name) {
  return BOUNCE_NAME.test(String(name || ''));
}

/** MOT-01: a transition on `all` or on a layout property, with a non-zero duration. */
export function transitionProblem(prop, durationMs) {
  if (!(durationMs > 0)) return null;
  const p = kebab(prop);
  if (p === 'all') return 'all';
  if (isLayoutProperty(p)) return 'layout';
  return null;
}

export function layoutProperties(props) {
  return [...new Set((props || []).map(kebab).filter((p) => isLayoutProperty(p)))];
}

/**
 * MOT-04 large displacement (ADR-032; [calibrating]): translation ≥ min(200 CSS px, a third of the viewport along
 * that axis); a scale change ≥ 1.25× (or ≤ 0.8×) of an element whose box covers ≥ 25% of the viewport area; a rotation
 * ≥ 90°. Scroll-linked movement is judged separately (any amount).
 * @param {{dx:number, dy:number, scaleRatio:number, areaShare:number, rotation:number}} m measured ranges
 */
export function largeDisplacement(m, { vw, vh }) {
  const limitX = Math.min(200, vw / 3);
  const limitY = Math.min(200, vh / 3);
  const reasons = [];
  if (m.dx >= limitX - 1e-6) reasons.push(`translates ${Math.round(m.dx)} px horizontally (limit ${Math.round(limitX)} px)`);
  if (m.dy >= limitY - 1e-6) reasons.push(`translates ${Math.round(m.dy)} px vertically (limit ${Math.round(limitY)} px)`);
  if (m.scaleRatio >= 1.25 - 1e-6 && m.areaShare >= 0.25 - 1e-6) reasons.push(`scales by ${m.scaleRatio.toFixed(2)}× on a box covering ${Math.round(m.areaShare * 100)}% of the viewport`);
  if (m.rotation >= 90 - 1e-6) reasons.push(`rotates by ${Math.round(m.rotation)}°`);
  return { large: reasons.length > 0, reasons, limits: { x: Math.round(limitX), y: Math.round(limitY), scale: 1.25, area: 0.25, rotation: 90 } };
}

/**
 * Ranges measured by the recorder for one tracked element. Translation comes from the element's own transform
 * (translate included); its box position counts only when a layout property is animated, so that content pushed by
 * a layout shift is not mistaken for an animation.
 */
export function trackRanges(agg, { layoutAnimated = false, ctx = 'flow', vw, vh } = {}) {
  if (!agg) return { dx: 0, dy: 0, scaleRatio: 1, areaShare: 0, rotation: 0 };
  let dx = agg.maxTx - agg.minTx;
  let dy = agg.maxTy - agg.minTy;
  if (layoutAnimated && ctx !== 'sticky') {
    dx = Math.max(dx, agg.maxCx - agg.minCx);
    dy = Math.max(dy, agg.maxCy - agg.minCy);
  }
  const s = agg.minS > 0.01 ? agg.maxS / agg.minS : agg.maxS > 0.05 ? Infinity : 1;
  let scaleRatio = Number.isFinite(s) ? s : 99;
  if (layoutAnimated && agg.minW > 1 && agg.minH > 1 && agg.rotMax < 5) scaleRatio = Math.max(scaleRatio, Math.max(agg.maxW / agg.minW, agg.maxH / agg.minH));
  const areaShare = vw && vh ? (agg.maxW * agg.maxH) / (vw * vh) : 0;
  return { dx, dy, scaleRatio, areaShare, rotation: agg.rotMax };
}

/** Motion class for MOT-02 (QUALITY-BAR: state, overlay, page or view, scrim, focal entrance; continuous out of scope). */
export function motionClass({ infinite, progress, scrim, overlay, page, entrance }) {
  if (infinite || progress) return 'continuous';
  if (scrim) return 'scrim';
  if (overlay) return 'overlay';
  if (page) return 'page';
  if (entrance) return 'entrance';
  return 'state';
}

/**
 * MOT-02 ceiling in ms. Entrances on load or scroll are view transitions (≤ 500 ms) unless DESIGN.md declares a
 * focal entrance, which may take ≤ 800 ms. "Frequent" (≤ 150 ms) needs element-level declarations and is not
 * applied by the DOM check.
 */
export function ceilingFor(cls, mode, { focalDeclared = false } = {}) {
  switch (cls) {
    case 'continuous':
      return null;
    case 'scrim':
      return durationCeiling('scrim', mode);
    case 'overlay':
      return durationCeiling('overlay', mode);
    case 'page':
      return durationCeiling('page', mode);
    case 'entrance':
      return focalDeclared ? durationCeiling('focal', mode) : durationCeiling('page', mode);
    default:
      return durationCeiling('state', mode);
  }
}

/**
 * MOT-07 allowance of non-user-triggered orchestrated sequences per screen, beyond one page fade.
 * Operate and Read: none; Persuade: 1; Experience: as declared in DESIGN.md, default 1.
 */
export function sequenceAllowance(mode, declared) {
  if (mode === 'operate' || mode === 'read') return 0;
  if (mode === 'experience') {
    const n = Number(declared);
    return Number.isInteger(n) && n >= 0 ? n : 1;
  }
  return 1;
}

/**
 * Group non-user-triggered motion into orchestrated sequences (MOT-07): everything that starts with the load (or in
 * the first viewport while the page settles) is one sequence; each section revealed while scrolling is another. A
 * single opacity-only animation of a page-level element is the allowed page fade.
 * @param {{node:number, phase:string, kind:string, props:string[], infinite:boolean}[]} events
 * @param {(node:number) => {page?:boolean, progress?:boolean, firstViewport?:boolean, section?:any}} nodeInfo
 */
export function groupSequences(events, nodeInfo) {
  const load = [];
  const scroll = new Map();
  let pageFades = 0;
  for (const e of events) {
    if (e.phase !== 'load' && e.phase !== 'settle') continue;
    if (e.infinite) continue;
    const n = nodeInfo(e.node) || {};
    if (n.progress) continue;
    const props = e.props || [];
    if (props.length && !props.some(isChoreographyProperty)) continue;
    if (n.page && props.length && props.every((p) => kebab(p) === 'opacity')) {
      pageFades += 1;
      if (pageFades === 1) continue;
    }
    if (e.phase === 'load' || n.firstViewport) load.push(e);
    else {
      const key = n.section ?? `node-${e.node}`;
      if (!scroll.has(key)) scroll.set(key, []);
      scroll.get(key).push(e);
    }
  }
  const sequences = [];
  if (load.length) sequences.push({ kind: 'load', events: load });
  for (const [key, list] of scroll) sequences.push({ kind: 'scroll', section: key, events: list });
  return { sequences, pageFades };
}
