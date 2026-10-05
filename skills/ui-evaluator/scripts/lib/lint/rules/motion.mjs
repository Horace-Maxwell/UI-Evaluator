// Motion rules from source (QUALITY-BAR G3 motion; motion.md).
// MOT-01 no `transition: all`, no transitions or animations on layout properties.
// MOT-03 no cubic-bezier with y1 or y2 outside [−0.1, 1.1], no bounce/elastic animations, unless DESIGN.md declares
//        a playful brand (ui-evaluator.motion.springs: playful) or the motion is gesture-driven.
// MOT-04 every keyframe animation and every spatial transition has a prefers-reduced-motion path (static part; the
//        DOM check measures what still moves under emulated reduce).
// MOT-06 no entrance starting at scale(0).
import { transitionProps, animationNames, cubicBeziers, splitTopLevel } from '../css.mjs';
import { transitionUtility, animateUtility, easeBezier, transformUtility, isStateVariant } from '../tailwind.mjs';
import { cssRules, keyframesOf, classGroups } from '../model.mjs';
import { matchBracket } from '../handlers.mjs';

export const RULES = [
  { id: 'MOT-01', level: 'gate', fast: true, title: 'Animated properties', fix: 'Name the properties that change (opacity, transform) in the transition token; move and resize with transform instead of layout properties.' },
  { id: 'MOT-03', level: 'gate', fast: true, title: 'No overshoot on UI state changes', fix: 'Use the declared enter, exit or move easing token; record a playful brand in DESIGN.md or tie the spring to a gesture if overshoot is wanted.' },
  { id: 'MOT-04', level: 'gate', fast: true, title: 'Reduced motion', fix: 'Add a prefers-reduced-motion path in the token layer (motion-reduce:/motion-safe: variants or a reduce media block): spatial motion goes, ≤ 150 ms opacity or colour feedback may stay.' },
  { id: 'MOT-06', level: 'gate', fast: true, title: 'No scale-from-zero entrances', fix: 'Start entrances from a scale token in the 0.9–0.97 range together with opacity 0, with the origin at the trigger.' },
];

export const MOT03_RANGE = [-0.1, 1.1];
const LAYOUT_PROP = /^(?:width|height|top|left|right|bottom|inset(?:-[\w-]+)?|inline-size|block-size|min-width|max-width|min-height|max-height|min-inline-size|max-inline-size|min-block-size|max-block-size|margin(?:-[\w-]+)?|padding(?:-[\w-]+)?)$/;
const LAYOUT_KEY = /\b(height|width|top|left|right|bottom|maxHeight|minHeight|maxWidth|minWidth|margin\w*|padding\w*)\s*:/;
const BOUNCY = /bounce|elastic|wobble|jiggle|spring/i;
const SPATIAL = new Set(['transform', 'translate', 'scale', 'rotate']);

function reduceMedia(media) {
  return media.some((m) => /prefers-reduced-motion\s*:\s*reduce/i.test(m));
}
function safeMedia(media) {
  return media.some((m) => /prefers-reduced-motion\s*:\s*no-preference/i.test(m) || /not\s*\(\s*prefers-reduced-motion\s*:\s*reduce/i.test(m));
}

/** Collect reduce-path facts from a document (selectors with a reduce rule; a universal reset). */
export function collectReduceInfo(doc, state) {
  state.reduceSelectors = state.reduceSelectors || new Set();
  for (const r of cssRules(doc)) {
    if (!reduceMedia(r.media)) continue;
    const sel = r.selector.replace(/\s+/g, ' ').trim();
    for (const part of splitTopLevel(sel, ',')) state.reduceSelectors.add(part.trim());
    const motionDecl = r.decls.some((d) => /^(?:animation|transition)(?:-[\w-]+)?$/.test(d.prop) || d.prop === 'scroll-behavior');
    if (motionDecl && /(?:^|[\s,>])\*(?:$|[\s,:])|^\s*\*|::?before|::?after/.test(r.selector)) state.globalReset = true;
  }
}

function covered(selector, state) {
  if (state.globalReset) return true;
  const sel = selector.replace(/\s+/g, ' ').trim();
  for (const part of splitTopLevel(sel, ',')) {
    const p = part.trim();
    if (state.reduceSelectors?.has(p)) return true;
    const base = p.replace(/:(?:hover|focus|focus-visible|active)\b/g, '').trim();
    if (state.reduceSelectors?.has(base)) return true;
    const cls = (p.match(/\.[\w-]+/g) || []).pop();
    if (cls && [...(state.reduceSelectors || [])].some((s) => s.split(/[\s>+~,]+/).some((x) => x.includes(cls)))) return true;
  }
  return false;
}

function short(s, n = 60) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

function overshoot(b) {
  return b[1] < MOT03_RANGE[0] || b[1] > MOT03_RANGE[1] || b[3] < MOT03_RANGE[0] || b[3] > MOT03_RANGE[1];
}

/** One level of var() resolution against the custom properties seen in the scan (fallbacks used when unknown). */
function resolveVars(value, props) {
  return String(value).replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (m, name, fb) => props.get(name) ?? (fb !== undefined ? fb : m));
}

function mot01(doc, ctx, report) {
  const vars = new Map(ctx.state.customProps || []);
  for (const r of cssRules(doc)) {
    // A reduced-motion block that sets `transition: all 0.01ms` (or similar) switches motion off; it is not motion.
    if (reduceMedia(r.media)) continue;
    for (const d of r.decls) {
      if (d.prop === 'transition' || d.prop === 'transition-property') {
        const resolved = resolveVars(d.value, vars);
        const props = transitionProps(d.prop, resolved);
        if (props.includes('all')) report('MOT-01', doc, d.offset, { message: `${d.prop}: ${short(d.value)}${resolved !== d.value ? ` (= ${short(resolved, 40)})` : ''} animates every property (${d.prop === 'transition' && !/\ball\b/i.test(resolved) ? 'no property named means all' : 'all'})`, value: d.value });
        const layout = props.filter((p) => LAYOUT_PROP.test(p));
        if (layout.length) report('MOT-01', doc, d.offset, { message: `transition on layout propert${layout.length > 1 ? 'ies' : 'y'} ${layout.join(', ')}`, value: d.value });
      }
    }
  }
  for (const kf of keyframesOf(doc)) {
    for (const f of kf.frames) {
      const d = f.decls.find((x) => LAYOUT_PROP.test(x.prop));
      if (d) {
        report('MOT-01', doc, d.offset, { message: `@keyframes ${kf.name} animates layout property ${d.prop}`, value: `${d.prop}: ${d.value}` });
        break;
      }
    }
  }
  const check = (tokens) => {
    for (const t of tokens) {
      const tr = transitionUtility(t.base);
      if (!tr || t.variants.includes('motion-reduce')) continue;
      if (tr.kind === 'all') report('MOT-01', doc, t.offset, { message: `${t.value} animates every property`, value: t.value });
      else if (tr.kind === 'arbitrary') {
        const bad = tr.props.filter((p) => p === 'all' || LAYOUT_PROP.test(p));
        if (bad.length) report('MOT-01', doc, t.offset, { message: `${t.value} animates ${bad.join(', ')}`, value: t.value });
      }
    }
  };
  const { byEl, loose } = classGroups(doc);
  for (const toks of byEl.values()) check(toks);
  for (const g of loose) check(g.tokens);
  // Animation libraries: layout keys in motion props.
  for (const el of doc.elements) {
    for (const a of el.attrs) {
      if (!/^(?:animate|initial|exit|whileHover|whileTap|whileInView|whileFocus|whileDrag)$/.test(a.name) || a.kind !== 'expr') continue;
      const m = String(a.value).match(LAYOUT_KEY);
      if (m && /^\s*\{/.test(a.value)) report('MOT-01', doc, a.offset, { message: `${a.name} animates layout property ${m[1]}`, value: short(a.value) });
    }
  }
}

function mot03(doc, ctx, report) {
  if (String(ctx.project.design.springs || '').toLowerCase() === 'playful') return;
  const props = ctx.state.customProps || new Map();
  for (const r of cssRules(doc)) {
    for (const d of r.decls) {
      if (/^(?:transition|transition-timing-function|animation|animation-timing-function)$/.test(d.prop)) {
        let value = d.value;
        value = value.replace(/var\(\s*(--[\w-]+)[^)]*\)/g, (m, n) => props.get(n) ?? m);
        const b = cubicBeziers(value).find(overshoot);
        if (b) report('MOT-03', doc, d.offset, { message: `cubic-bezier(${b.join(', ')}) overshoots (y1 or y2 outside [−0.1, 1.1])`, value: `cubic-bezier(${b.join(', ')})` });
        if (/^animation/.test(d.prop)) {
          const name = animationNames(d.prop === 'animation' ? 'animation' : 'animation-name', d.value).find((n) => BOUNCY.test(n));
          if (name) report('MOT-03', doc, d.offset, { message: `${name} animation on a UI element`, value: name });
        }
      }
    }
  }
  const check = (tokens) => {
    for (const t of tokens) {
      const a = animateUtility(t.base);
      if (a && BOUNCY.test(a.name)) report('MOT-03', doc, t.offset, { message: `${t.value}: bounce or elastic animation`, value: t.value });
      const b = easeBezier(t.base);
      if (b && overshoot(b)) report('MOT-03', doc, t.offset, { message: `${t.value} overshoots (y1 or y2 outside [−0.1, 1.1])`, value: t.value });
    }
  };
  const { byEl, loose } = classGroups(doc);
  for (const toks of byEl.values()) check(toks);
  for (const g of loose) check(g.tokens);
  // Spring configs with visible bounce outside gesture handlers.
  const code = doc.code;
  const re = /\btype\s*:\s*['"]spring['"]/g;
  let m;
  while ((m = re.exec(code))) {
    let open = code.lastIndexOf('{', m.index);
    if (open < 0) continue;
    const close = matchBracket(code, open);
    const obj = code.slice(open, close > 0 ? close : m.index + 200);
    const bm = obj.match(/\bbounce\s*:\s*(\d*\.?\d+)/);
    if (!bm || Number(bm[1]) <= 0) continue;
    const before = code.slice(Math.max(0, open - 160), open);
    if (/drag|gesture|pan|swipe|fling|pull|onDragEnd|dragTransition/i.test(before)) continue;
    report('MOT-03', doc, m.index, { message: `spring with bounce ${bm[1]} on a state change (not gesture-driven)`, value: `bounce: ${bm[1]}` });
  }
  const wobbly = /\bconfig\.(?:wobbly)\b/.exec(code);
  if (wobbly && !/drag|gesture/i.test(code.slice(Math.max(0, wobbly.index - 200), wobbly.index))) report('MOT-03', doc, wobbly.index, { message: 'react-spring config.wobbly overshoots on a state change', value: 'config.wobbly' });
}

const SKELETON = /skeleton|loading|shimmer|placeholder|loader/i;

function mot04(doc, ctx, report) {
  const st = ctx.state;
  for (const r of cssRules(doc)) {
    if (reduceMedia(r.media) || safeMedia(r.media)) continue;
    for (const d of r.decls) {
      if (d.prop === 'animation' || d.prop === 'animation-name') {
        const names = animationNames(d.prop, d.value);
        if (!names.length || covered(r.selector, st)) continue;
        if (r.inline && r.el && st.globalReset) continue;
        report('MOT-04', doc, d.offset, { message: `animation ${names.join(', ')} has no prefers-reduced-motion path`, value: d.value });
      } else if (d.prop === 'transition' || d.prop === 'transition-property') {
        const spatial = transitionProps(d.prop, d.value).filter((p) => SPATIAL.has(p));
        if (!spatial.length || covered(r.selector, st)) continue;
        report('MOT-04', doc, d.offset, { message: `transition of ${spatial.join(', ')} has no prefers-reduced-motion path`, value: d.value });
      }
    }
  }
  if (st.globalReset) return;
  const check = (tokens, el) => {
    const reduceAnim = tokens.some((t) => t.variants.includes('motion-reduce') && /^(?:animate-|hidden$|transition-none$|transform-none$|motion-reduce)/.test(t.base));
    for (const t of tokens) {
      const a = animateUtility(t.base);
      if (!a || a.name === 'none' || t.variants.includes('motion-safe') || t.variants.includes('motion-reduce') || reduceAnim) continue;
      if (a.name === 'pulse') {
        const skeletonish = SKELETON.test(tokens.map((x) => x.value).join(' ')) || (el && (SKELETON.test(el.tag) || !el.texts.length)) || tokens.some((x) => /^bg-(?:muted|accent|secondary|(?:gray|slate|zinc|neutral|stone)-(?:50|100|200|300|700|800))/.test(x.base));
        if (skeletonish) continue; // an essential progress indicator in a non-spatial form
      }
      report('MOT-04', doc, t.offset, { message: `${t.value} has no motion-reduce or motion-safe path`, value: t.value });
      return;
    }
    const trans = tokens.find((t) => {
      const tr = transitionUtility(t.base);
      return tr && (tr.kind === 'default' || tr.kind === 'transform' || tr.kind === 'all') && !t.variants.includes('motion-safe');
    });
    if (!trans) return;
    const reduced = tokens.some((t) => t.variants.includes('motion-reduce') && /^(?:transition-none|transform-none|translate-[xy]?-?0|scale-100)$/.test(t.base));
    if (reduced) return;
    const moving = tokens.find((t) => t.variants.some(isStateVariant) && !t.variants.includes('motion-safe') && transformUtility(t.base) && !/^(?:0|100)$/.test(transformUtility(t.base).value));
    if (moving) report('MOT-04', doc, moving.offset, { message: `${moving.value} with ${trans.value} has no motion-reduce or motion-safe path`, value: `${trans.value} ${moving.value}` });
  };
  const { byEl, loose } = classGroups(doc);
  for (const [el, toks] of byEl) check(toks, el);
  for (const g of loose) check(g.tokens, null);
}

const SCALE0 = /scale\(\s*0(?:\.0+)?\s*(?:,\s*0(?:\.0+)?\s*)?\)|scale3d\(\s*0\s*,\s*0\s*,/i;

function mot06(doc, ctx, report) {
  for (const kf of keyframesOf(doc)) {
    const first = kf.frames.find((f) => /(?:^|,)\s*(?:from|0%)\s*(?:,|$)/.test(f.selector));
    if (!first) continue;
    const d = first.decls.find((x) => (x.prop === 'transform' && SCALE0.test(x.value)) || (x.prop === 'scale' && /^0(?:\.0+)?(?:\s+0(?:\.0+)?)?$/.test(x.value.trim())));
    if (d) report('MOT-06', doc, d.offset, { message: `@keyframes ${kf.name} enters from ${d.prop}: ${d.value}`, value: d.value });
  }
  for (const r of cssRules(doc)) {
    const d = r.decls.find((x) => (x.prop === 'transform' && SCALE0.test(x.value)) || (x.prop === 'scale' && /^0(?:\.0+)?$/.test(x.value.trim())));
    if (!d) continue;
    // The resting state an entrance starts from: @starting-style, an enter/from or closed-state selector, or a rule
    // that also transitions the transform. A static scale(0) with none of these hides something; it is not an entrance.
    const entrance = r.starting || /(?:enter-from|-enter\b|\.enter\b|-from\b|\[data-state=["']?closed|\[data-closed|:not\(\[open\]\)|\.(?:closed|hidden|is-hidden|out)(?![\w-]))/i.test(r.selector) || r.decls.some((x) => /^transition/.test(x.prop) && /transform|scale|all|^\s*[\d.]+m?s/i.test(x.value));
    if (entrance && !/leave-to|exit|-to\b/i.test(r.selector)) report('MOT-06', doc, d.offset, { message: `entrance starts at ${d.prop}: ${d.value}${r.starting ? ' (@starting-style)' : ''}`, value: d.value });
  }
  const check = (tokens) => {
    const zero = tokens.find((t) => (t.base === 'scale-0' || t.base === 'zoom-in-0') && (!t.variants.length || t.variants.every((v) => /^(?:starting|data-\[state=closed\]|data-closed|closed)$/.test(v))));
    if (!zero) return;
    const restores = tokens.some((t) => /^scale-(?:100|95|90|105)$/.test(t.base) && t.variants.some((v) => isStateVariant(v) || v === 'open'));
    const moves = tokens.some((t) => /^(?:transition|transition-all|transition-transform|duration-\d+|animate-)/.test(t.base));
    if (zero.variants.includes('starting') || (restores && moves)) report('MOT-06', doc, zero.offset, { message: `${zero.value} entrance grows from nothing`, value: zero.value });
  };
  const { byEl, loose } = classGroups(doc);
  for (const toks of byEl.values()) check(toks);
  for (const g of loose) check(g.tokens);
  for (const el of doc.elements) {
    const init = el.attrs.find((a) => a.name === 'initial' && a.kind === 'expr');
    if (init && /\bscale\s*:\s*0(?![.\d])/.test(String(init.value))) report('MOT-06', doc, init.offset, { message: 'initial={{ scale: 0 }}: entrance grows from nothing', value: short(init.value) });
  }
  const variant = /\b(?:hidden|initial|enter|closed|from|offscreen)\s*:\s*\{[^{}]*\bscale\s*:\s*0(?![.\d])/g;
  let m;
  while ((m = variant.exec(doc.code))) report('MOT-06', doc, m.index, { message: `entrance variant ${m[0].split(':')[0].trim()} starts at scale 0`, value: short(m[0]) });
  const gsap = /\bgsap\.(?:from|fromTo)\s*\([^,]+,\s*\{[^{}]*\bscale\s*:\s*0(?![.\d])/g;
  while ((m = gsap.exec(doc.code))) report('MOT-06', doc, m.index, { message: 'GSAP entrance from scale 0', value: short(m[0]) });
}

export function checkFile(doc, ctx, report) {
  if (ctx.enabled('MOT-01')) mot01(doc, ctx, report);
  if (ctx.enabled('MOT-03')) mot03(doc, ctx, report);
  if (ctx.enabled('MOT-04')) mot04(doc, ctx, report);
  if (ctx.enabled('MOT-06')) mot06(doc, ctx, report);
}
