// motion — MOT-01…07 (QUALITY-BAR G3; knowledge/motion.md Check lines; ADR-032 for MOT-04).
// Normal motion (preference "default"): computed transitions and animations of every element and ::before/::after,
// the CSSOM (@keyframes, :hover/:focus-only transitions) and the Web Animations running now, plus what the motion
// recorder logged since the first byte (lib/browser/motion-recorder.mjs): durations by class (MOT-02), animated
// properties (MOT-01), easing (MOT-03), scale-from-zero entrances (MOT-06), text still hidden by a reveal after load
// and a full scroll (MOT-05), and non-user-triggered sequences on load and on scroll per mode (MOT-07).
// Reduced motion (preference "reduced-motion", emulated `reduce`): infinite animations still running, animations
// whose measured travel crosses the ADR-032 limits, and scroll-linked movement (MOT-04); MOT-05 again.
// SLP-09 and SLP-11 belong to the tells check and are never emitted here.
import { parseTimes, splitTopLevel, isLayoutProperty, round } from '../thresholds.mjs';
import {
  overshootingEasings,
  isBounceName,
  transitionProblem,
  layoutProperties,
  largeDisplacement,
  trackRanges,
  motionClass,
  ceilingFor,
  sequenceAllowance,
  groupSequences,
  isSpatialProperty,
} from '../motion-rules.mjs';
import { collectMotion, settleAnimations, scrollLinkedProbe } from '../motion-collect.mjs';

export const mode = 'shared';
export const criteria = ['MOT-01', 'MOT-02', 'MOT-03', 'MOT-04', 'MOT-05', 'MOT-06', 'MOT-07'];
export const summary = 'transitions, animations and Web Animations: properties, durations, easing; reduced-motion re-render; content visible at rest; choreography per mode';

// --- Node side ---------------------------------------------------------------------------------------------------

const kebab = (p) => String(p || '').trim().replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const fmtMs = (v) => `${Math.round(v)} ms`;

function where(ctx, ps, d, extra = {}) {
  if (!d) return ctx.loc(ps, { selector: 'html', ...extra });
  return ctx.loc(ps, { selector: d.selector, bbox: d.bbox, snippet: d.snippet, source: d.source, ...extra });
}

/** Keyframe properties of a named @keyframes rule (CSSOM) or of a running animation. */
function keyframeProps(data, name) {
  const frames = data.keyframes[name];
  if (frames) return [...new Set(frames.flatMap((f) => Object.keys(f.props)).filter((k) => k !== 'animation-timing-function'))];
  const r = data.running.find((a) => a.name === name);
  return r ? r.props.map(kebab) : [];
}

function keyframeEasings(data, name) {
  const frames = data.keyframes[name] || [];
  return frames.map((f) => f.easing).filter(Boolean);
}

function startsAtScaleZero(data, name) {
  const frames = data.keyframes[name];
  if (frames) {
    const first = frames.find((f) => f.offsets.includes(0));
    return !!(first && first.scale0);
  }
  return false;
}

/** Group key for one declared motion: one hit per component signature and value, not per element. */
function groupKey(d, ...parts) {
  return [d ? d.sig : '?', ...parts].join('|');
}

function analyseDefault(ctx, pg, data, acc) {
  const ps = pg.ps;
  const node = (id) => data.nodes[id] || null;
  const recorded = data.recorder ? data.recorder.events.filter((e) => e.el !== null) : [];
  const entranceNodes = new Set(recorded.filter((e) => (e.phase === 'load' || e.phase === 'settle') && !e.infinite).map((e) => e.el));
  const focalDeclared = Number.isFinite(ctx.design.focalMs);
  const playful = !!ctx.design.playful;
  const groups = { 'MOT-01': new Map(), 'MOT-02': new Map(), 'MOT-03': new Map(), 'MOT-06': new Map() };
  const put = (rule, key, entry) => {
    const g = groups[rule];
    if (!g.has(key)) g.set(key, { ...entry, count: 0, selectors: [] });
    const e = g.get(key);
    e.count += 1;
    const d = entry.d;
    if (d && e.selectors.length < 5 && !e.selectors.includes(d.selector)) e.selectors.push(d.selector);
    if (d && d.visible && !(e.d && e.d.visible)) e.d = d;
  };

  // MOT-01, MOT-02, MOT-03 over declared transitions and animations.
  for (const it of data.items) {
    const d = node(it.el);
    const label = `${d ? d.selector : '?'}${it.pseudo || ''}`;
    if (it.kind === 'transition') {
      const prob = transitionProblem(it.prop, it.dur);
      if (prob) put('MOT-01', groupKey(d, 'transition', kebab(it.prop)), { d, pseudo: it.pseudo, prop: kebab(it.prop), dur: it.dur, kind: prob, label });
    } else {
      const lay = layoutProperties(keyframeProps(data, it.name));
      if (lay.length) put('MOT-01', groupKey(d, 'animation', it.name), { d, pseudo: it.pseudo, name: it.name, lay, kind: 'keyframes', label });
    }
    const infinite = it.kind === 'animation' && it.iterations === 'infinite';
    const cls = motionClass({ infinite, progress: d?.progress, scrim: d?.scrim, overlay: d?.overlay, page: d?.page, entrance: entranceNodes.has(it.el) });
    const ceiling = ceilingFor(cls, ps.mode, { focalDeclared });
    const total = it.kind === 'animation' ? it.dur * (Number(it.iterations) || 1) : it.dur;
    if (ceiling && total > ceiling + 0.5) {
      put('MOT-02', groupKey(d, it.kind, it.prop || it.name, Math.round(total)), { d, pseudo: it.pseudo, what: it.kind === 'transition' ? `transition of ${kebab(it.prop)}` : `animation "${it.name}"`, total, ceiling, cls, label });
    }
    const easings = [it.ease, ...(it.kind === 'animation' ? keyframeEasings(data, it.name) : [])];
    const over = easings.flatMap((e) => overshootingEasings(e));
    const bounce = it.kind === 'animation' && isBounceName(it.name);
    if ((over.length || bounce) && !d?.draggable) {
      put('MOT-03', groupKey(d, it.kind, it.prop || it.name, over[0] || it.name), { d, pseudo: it.pseudo, over, bounce: bounce ? it.name : null, what: it.kind === 'transition' ? `transition of ${kebab(it.prop)}` : `animation "${it.name}"`, label });
    }
    if (it.kind === 'animation' && startsAtScaleZero(data, it.name)) put('MOT-06', groupKey(d, 'kf', it.name), { d, how: `@keyframes ${it.name} starts at scale(0)`, label });
  }
  // Transitions declared only in :hover/:focus/:active rules.
  for (const hr of data.hoverRules) {
    const d = node(hr.el);
    const props = hr.property ? splitTopLevel(hr.property) : null;
    const durs = hr.duration ? parseTimes(hr.duration) : null;
    let pairs = [];
    if (props && durs) pairs = props.map((p, i) => [p, durs[i % durs.length]]);
    else if (hr.transition) {
      pairs = splitTopLevel(hr.transition).map((part) => {
        const toks = part.split(/\s+/);
        const times = toks.filter((t) => /^-?[\d.]+m?s$/.test(t));
        const prop = toks.find((t) => !/^-?[\d.]+m?s$/.test(t) && !/^(ease|linear|step|cubic|ease-in|ease-out|ease-in-out|initial|inherit)/.test(t)) || 'all';
        return [prop, times.length ? parseTimes(times[0])[0] : 0];
      });
    }
    for (const [p, dur] of pairs) {
      const prob = transitionProblem(p, dur);
      if (prob) put('MOT-01', groupKey(d, 'hover', kebab(p), hr.selector), { d, prop: kebab(p), dur, kind: prob, label: hr.selector, rule: hr.selector });
      const ceiling = ceilingFor(motionClass({ overlay: d?.overlay, scrim: d?.scrim, page: d?.page }), ps.mode, { focalDeclared });
      if (ceiling && dur > ceiling + 0.5) put('MOT-02', groupKey(d, 'hover', p, Math.round(dur)), { d, what: `transition of ${kebab(p)} in ${hr.selector}`, total: dur, ceiling, cls: 'state', label: hr.selector });
    }
    const over = overshootingEasings(`${hr.timing || ''} ${hr.transition || ''}`);
    if (over.length && !d?.draggable) put('MOT-03', groupKey(d, 'hover', hr.selector, over[0]), { d, over, what: `transition in ${hr.selector}`, label: hr.selector });
  }
  // Web Animations and CSS animations running now (layout keyframes, overshoot, scale-from-zero).
  for (const a of data.running) {
    if (a.type === 'CSSTransition') continue;
    const d = node(a.el);
    if (a.type !== 'CSSAnimation') {
      const lay = layoutProperties(a.props);
      if (lay.length) put('MOT-01', groupKey(d, 'waapi', a.name, lay.join(',')), { d, name: a.name || 'Web Animation', lay, kind: 'keyframes', label: d?.selector });
      const over = [a.easing, ...a.frameEasings].flatMap((e) => overshootingEasings(e));
      if (over.length && !d?.draggable) put('MOT-03', groupKey(d, 'waapi', over[0]), { d, over, what: `Web Animation${a.name ? ` "${a.name}"` : ''}`, label: d?.selector });
    }
    if (a.scale0) put('MOT-06', groupKey(d, 'run', a.name), { d, how: `${a.type === 'CSSAnimation' ? `animation "${a.name}"` : 'a Web Animation'} starts at scale(0)`, label: d?.selector });
  }
  // Recorded entrances whose first sampled frame was at scale 0 (scripted entrances included).
  for (const t of data.recorder ? data.recorder.tracks : []) {
    if (t.el === null || !t.first || t.phase === 'check') continue;
    if (t.first.s <= 0.05 && t.agg && t.agg.maxS >= 0.5) put('MOT-06', groupKey(node(t.el), 'track'), { d: node(t.el), how: `entered from scale ${round(t.first.s, 2)} (measured)`, label: node(t.el)?.selector });
  }
  for (const id of data.scale0Rest) put('MOT-06', groupKey(node(id), 'rest'), { d: node(id), how: 'parked at scale(0) with a transform transition, so it enters from a point', label: node(id)?.selector });

  for (const e of groups['MOT-01'].values()) {
    const what = e.kind === 'all' ? '`transition: all`' : e.kind === 'layout' ? `a transition of the layout property ${e.prop}` : `@keyframes "${e.name}" animating ${e.lay.join(', ')}`;
    acc.add(ctx.hit({
      rule: 'MOT-01',
      title: e.kind === 'all' ? `transition: all on ${e.label}` : e.kind === 'layout' ? `Layout property ${e.prop} transitions on ${e.label}` : `Animation of layout properties (${e.lay.join(', ')}) on ${e.label}`,
      description: `${what} on ${e.count} element(s) (${e.selectors.join(', ')})${e.dur ? `, ${fmtMs(e.dur)}` : ''}. Animate transform and opacity instead; name the properties a transition may change.`,
      location: where(ctx, ps, e.d, e.pseudo ? { extra: { pseudo: e.pseudo } } : {}),
      evidence: [{ type: 'measurement', value: { kind: e.kind, property: e.prop || null, keyframes: e.name || null, layout_properties: e.lay || null, duration_ms: e.dur || null, elements: e.count }, detail: e.rule ? `rule ${e.rule}` : 'computed style' }],
      recommendation: 'List the animated properties (for example opacity, transform) in the shared transition token; replace size and position animation with transform or FLIP.',
    }));
  }
  for (const e of groups['MOT-02'].values()) {
    acc.add(ctx.hit({
      rule: 'MOT-02',
      title: `${e.what[0].toUpperCase()}${e.what.slice(1)} lasts ${fmtMs(e.total)} on ${e.label} (${e.cls} budget ${fmtMs(e.ceiling)})`,
      description: `The ${e.what} lasts ${fmtMs(e.total)} on ${e.count} element(s) (${e.selectors.join(', ')}); the ${e.cls === 'entrance' ? 'entrance (view transition' + (Number.isFinite(ctx.design.focalMs) ? ' or the declared focal entrance' : '') + ')' : e.cls} ceiling on a ${ps.mode} surface is ${fmtMs(e.ceiling)} (MOT-02).`,
      location: where(ctx, ps, e.d),
      evidence: [{ type: 'measurement', value: { duration_ms: Math.round(e.total), ceiling_ms: e.ceiling, class: e.cls, mode: ps.mode, elements: e.count }, detail: `${fmtMs(e.total)} > ${fmtMs(e.ceiling)}` }],
      recommendation: 'Point the component at the duration token for its class (state, overlay, scrim, focal) instead of a local value.',
    }));
  }
  if (playful) {
    if (groups['MOT-03'].size) ctx.note(`MOT-03: ${groups['MOT-03'].size} overshooting curve(s) allowed because DESIGN.md declares a playful brand (springs: playful)`);
    acc.fields.overshoot_allowed += groups['MOT-03'].size;
  } else {
    for (const e of groups['MOT-03'].values()) {
      acc.add(ctx.hit({
        rule: 'MOT-03',
        title: `${e.bounce ? `Bounce animation "${e.bounce}"` : 'Overshooting easing'} on ${e.label}`,
        description: `${e.what} on ${e.count} element(s) uses ${e.bounce ? `a bounce or elastic animation ("${e.bounce}")` : `an easing that overshoots (${e.over.slice(0, 2).join(', ')}; y outside [−0.1, 1.1])`}. Overshoot on UI state changes is allowed only for a playful brand declared in DESIGN.md or gesture-driven motion.`,
        location: where(ctx, ps, e.d),
        evidence: [{ type: 'measurement', value: { easing: e.over.slice(0, 3), animation: e.bounce, elements: e.count }, detail: e.over[0] || e.bounce }],
        recommendation: 'Use the declared enter, exit or move easing token.',
      }));
    }
  }
  for (const e of groups['MOT-06'].values()) {
    acc.add(ctx.hit({
      rule: 'MOT-06',
      title: `Entrance from scale(0) on ${e.label}`,
      description: `${e.d ? e.d.selector : 'An element'} ${e.how}. Start entrances near full size (0.9–0.97) with opacity 0.`,
      location: where(ctx, ps, e.d),
      evidence: [{ type: 'measurement', value: { elements: e.count }, detail: e.how }],
    }));
  }

  // MOT-07 on the default state only: non-user-triggered sequences on load and on scroll.
  if (ps.state === (ps.routeCfg.states?.[0]?.name || 'default') && data.recorder) {
    const events = recorded.map((e) => ({ ...e, node: e.el, props: e.kind === 'transition' ? [e.prop] : e.kind === 'animation' ? keyframeProps(data, e.name) : [] }));
    const { sequences, pageFades } = groupSequences(events, (id) => {
      const d = node(id);
      return d ? { page: d.page, progress: d.progress, firstViewport: d.firstViewport, section: d.section } : null;
    });
    const declared = ctx.design.motion?.experience_sequences_per_screen;
    const allowed = sequenceAllowance(ps.mode, declared);
    acc.fields.sequences.push({ route: ps.route, state: ps.state, mode: ps.mode, sequences: sequences.length, allowed, page_fades: pageFades });
    if (sequences.length > allowed) {
      const firstSeq = sequences[0];
      const d = node(firstSeq.events[0].node);
      const parts = sequences.slice(0, 6).map((s) => `${s.kind === 'load' ? 'on load' : `on scroll (${node(s.events[0].node)?.sectionSelector || node(s.events[0].node)?.selector || 'section'})`}: ${s.events.length} animation(s)`);
      acc.add(ctx.hit({
        rule: 'MOT-07',
        title: `${sequences.length} non-user-triggered sequence(s) on ${ps.route} (${ps.mode} allows ${allowed === 0 ? 'none beyond one page fade' : allowed})`,
        description: `Motion that starts without user input: ${parts.join('; ')}${sequences.length > 6 ? '; …' : ''}. ${ps.mode === 'operate' || ps.mode === 'read' ? 'Operate and Read surfaces allow no choreography beyond one page fade.' : `This ${ps.mode} surface allows ${allowed} orchestrated sequence(s) per screen.`}`,
        location: where(ctx, ps, d),
        evidence: [{ type: 'measurement', value: { sequences: sequences.map((s) => ({ kind: s.kind, animations: s.events.length, names: [...new Set(s.events.map((e) => e.name || e.prop))].slice(0, 4) })), allowed, mode: ps.mode }, detail: `${sequences.length} > ${allowed}` }],
        problem_type: 'overall_structure',
        recommendation: 'Keep one sequence on the first viewport (Persuade) or none (Operate, Read); delete section-by-section entrances.',
      }));
    }
  }
  return entranceNodes;
}

function analyseHidden(ctx, pg, data, acc, reduced) {
  const ps = pg.ps;
  for (const h of data.hidden) {
    const d = data.nodes[h.el];
    acc.add(ctx.hit({
      rule: 'MOT-05',
      title: `Text hidden at rest${reduced ? ' under reduced motion' : ''}: ${d ? d.selector : 'element'}`,
      description: `After load and a full scroll${reduced ? ' with reduced motion emulated' : ''}, ${h.chars} character(s) of text ("${h.text}") stay hidden (${h.how}) by an entrance that never finished. Make the visible state the default and let script only enhance it.`,
      location: where(ctx, ps, d),
      evidence: [{ type: 'measurement', value: { how: h.how, characters: h.chars, preference: ps.preference }, detail: h.how }],
      recommendation: 'Render the content visible by default; add the entrance class only when the observer runs.',
    }));
  }
}

async function analyseReduced(ctx, pg, data, acc) {
  const ps = pg.ps;
  const node = (id) => data.nodes[id] || null;
  const vw = data.vw;
  const vh = data.vh;
  const flagged = new Set();
  // Infinite animations still running.
  const infinite = data.running.filter((a) => a.iterations === 'infinite' && a.playState === 'running' && a.type !== 'CSSTransition');
  for (const a of infinite) {
    const d = node(a.el);
    const props = a.props.map(kebab);
    const spatial = props.some(isSpatialProperty);
    if (d?.progress && !spatial) {
      acc.fields.reduced_motion.allowed_progress += 1;
      continue;
    }
    if (flagged.has(a.el)) continue;
    flagged.add(a.el);
    acc.fields.reduced_motion.infinite_running += 1;
    acc.add(ctx.hit({
      rule: 'MOT-04',
      title: `Infinite animation keeps running under reduced motion: ${d ? d.selector : a.name}`,
      description: `With prefers-reduced-motion: reduce emulated, ${a.type === 'CSSAnimation' ? `the animation "${a.name}"` : 'a Web Animation'} still loops forever on ${d ? d.selector : 'an element'} (animating ${props.join(', ') || 'unknown properties'}).${d?.progress ? ' Progress indicators may continue only in a subtle, non-spatial form (opacity or colour).' : ''}`,
      location: where(ctx, ps, d),
      evidence: [{ type: 'measurement', value: { animation: a.name, properties: props, iterations: 'infinite', progress_indicator: !!d?.progress }, detail: 'running under reduce' }],
      recommendation: 'Stop the loop under (prefers-reduced-motion: reduce), or switch an essential indicator to a slow opacity pulse.',
    }));
  }
  // Large displacement measured while the animation ran under reduce.
  for (const t of data.recorder ? data.recorder.tracks : []) {
    if (t.el === null || t.phase === 'check' || !t.agg || t.n < 2) continue;
    const d = node(t.el);
    const names = t.names || [];
    const props = [...(t.props || []), ...names.flatMap((n) => keyframeProps(data, n))].map(kebab);
    const layoutAnimated = props.some((p) => isLayoutProperty(p));
    const ranges = trackRanges(t.agg, { layoutAnimated, ctx: t.ctx, vw, vh });
    const verdict = largeDisplacement(ranges, { vw, vh });
    if (!verdict.large || flagged.has(t.el)) continue;
    flagged.add(t.el);
    acc.fields.reduced_motion.large_displacement += 1;
    acc.add(ctx.hit({
      rule: 'MOT-04',
      title: `Large-displacement motion under reduced motion: ${d ? d.selector : 'element'}`,
      description: `With prefers-reduced-motion: reduce emulated, ${names.length ? `"${names.join('", "')}"` : (t.props || []).length ? `a transition of ${t.props.join(', ')}` : 'an animation'} on ${d ? d.selector : 'an element'} (${t.phase === 'recipe' ? 'after the state recipe' : `during ${t.phase}`}) ${verdict.reasons.join('; ')} [calibrating limits, ADR-032].`,
      location: where(ctx, ps, d),
      evidence: [{ type: 'measurement', value: { dx: Math.round(ranges.dx), dy: Math.round(ranges.dy), scale_ratio: round(ranges.scaleRatio, 2), area_share: round(ranges.areaShare, 2), rotation_deg: Math.round(ranges.rotation), limits: verdict.limits, samples: t.n }, detail: verdict.reasons.join('; ') }],
      recommendation: 'Under reduce, replace the movement with a crossfade or an instant change (distance and scale tokens at rest values).',
    }));
  }
  // Scroll-linked movement.
  const sl = await pg.page.evaluate(scrollLinkedProbe).catch((err) => {
    ctx.error(`${ps.key}: scroll sampling failed: ${err.message.split('\n')[0]}`);
    return null;
  });
  if (sl) {
    for (const tl of sl.timelines) {
      if (!tl.props.map(kebab).some(isSpatialProperty) || flagged.has(tl.id)) continue;
      flagged.add(tl.id);
      acc.fields.reduced_motion.scroll_linked += 1;
      acc.add(ctx.hit({
        rule: 'MOT-04',
        title: `Scroll-driven animation remains under reduced motion: ${tl.selector}`,
        description: `With prefers-reduced-motion: reduce emulated, ${tl.name ? `"${tl.name}"` : 'an animation'} on ${tl.selector} is bound to a ${tl.timeline} and moves content (${tl.props.map(kebab).join(', ')}) in response to scroll; any scroll-linked movement counts under MOT-04.`,
        location: ctx.loc(ps, { selector: tl.selector, bbox: tl.bbox, snippet: tl.snippet, source: tl.source }),
        evidence: [{ type: 'measurement', value: { timeline: tl.timeline, properties: tl.props }, detail: 'scroll-linked under reduce' }],
      }));
    }
    for (const l of sl.linked) {
      if (flagged.has(l.id)) continue;
      flagged.add(l.id);
      acc.fields.reduced_motion.scroll_linked += 1;
      acc.add(ctx.hit({
        rule: 'MOT-04',
        title: `Scroll-linked transform under reduced motion: ${l.selector}`,
        description: `With prefers-reduced-motion: reduce emulated, the transform of ${l.selector} changes with the scroll position (${l.values.join(' → ')}): parallax or a scroll-linked effect still moves content.`,
        location: ctx.loc(ps, { selector: l.selector, bbox: l.bbox, snippet: l.snippet, source: l.source }),
        evidence: [{ type: 'measurement', value: { transforms: l.values }, detail: 'transform differs at three scroll positions' }],
        recommendation: 'Disable the scroll effect under (prefers-reduced-motion: reduce).',
      }));
    }
    if (!sl.scrollable) acc.fields.reduced_motion.not_scrollable += 1;
  }
}

export async function run(ctx) {
  const acc = {
    hits: [],
    add(h) {
      this.hits.push(h);
      ctx.add(h);
    },
    fields: {
      inventory: { pages: 0, declared: 0, keyframes: 0, running: 0, recorded_events: 0, waapi_calls: 0, cross_origin_sheets: 0, recorder_dropped: 0 },
      classes: {},
      reduced_motion: { pages: 0, infinite_running: 0, large_displacement: 0, scroll_linked: 0, allowed_progress: 0, not_scrollable: 0 },
      sequences: [],
      overshoot_allowed: 0,
      no_reduce_path: [],
    },
  };
  const prefs = ['default', 'reduced-motion'];
  const recorderSeen = { default: 0, reduced: 0 };
  const defaultNames = new Map();
  for await (const pg of ctx.pages(ctx.states({ widths: 'first', themes: 'first', preferences: prefs }))) {
    const ps = pg.ps;
    const reduced = ps.preference === 'reduced-motion';
    await settleAnimations(pg.page);
    let data;
    try {
      data = await pg.page.evaluate(collectMotion, { maxEls: 5000, maxPseudo: 1500 });
    } catch (err) {
      ctx.error(`${ps.key}: motion collection failed: ${err.message.split('\n')[0]}`);
      ctx.partial('motion could not be collected on some page states');
      continue;
    }
    const inv = acc.fields.inventory;
    inv.pages += 1;
    inv.declared += data.itemsTotal;
    inv.keyframes = Math.max(inv.keyframes, Object.keys(data.keyframes).length);
    inv.running += data.running.length;
    inv.cross_origin_sheets = Math.max(inv.cross_origin_sheets, data.crossOrigin);
    if (data.recorder) {
      inv.recorded_events += data.recorder.events.length;
      inv.waapi_calls += data.recorder.waapi;
      inv.recorder_dropped += data.recorder.dropped;
      recorderSeen[reduced ? 'reduced' : 'default'] += 1;
    }
    if (data.crossOrigin) ctx.note(`${data.crossOrigin} cross-origin stylesheet(s) could not be read; their @keyframes and :hover-only transitions were not inspected`);
    if (data.items.length < data.itemsTotal) ctx.partial(`motion inventory capped at ${data.items.length} of ${data.itemsTotal} declarations on ${ps.route}`);
    if (reduced) {
      acc.fields.reduced_motion.pages += 1;
      await analyseReduced(ctx, pg, data, acc);
      for (const e of data.recorder ? data.recorder.events : []) {
        if (e.kind !== 'animation' || e.phase === 'check') continue;
        const k = `${ps.route}|${ps.state}|${e.name}`;
        const base = defaultNames.get(k);
        if (base !== undefined && base === e.dur && e.dur > 150 && acc.fields.no_reduce_path.length < 30 && !acc.fields.no_reduce_path.includes(e.name)) acc.fields.no_reduce_path.push(e.name);
      }
    } else {
      for (const it of data.items) {
        const d = data.nodes[it.el];
        const cls = motionClass({ infinite: it.iterations === 'infinite', progress: d?.progress, scrim: d?.scrim, overlay: d?.overlay, page: d?.page });
        acc.fields.classes[cls] = (acc.fields.classes[cls] || 0) + 1;
      }
      for (const e of data.recorder ? data.recorder.events : []) if (e.kind === 'animation') defaultNames.set(`${ps.route}|${ps.state}|${e.name}`, e.dur);
      analyseDefault(ctx, pg, data, acc);
    }
    analyseHidden(ctx, pg, data, acc, reduced);
  }
  if (!recorderSeen.default && acc.fields.inventory.pages) ctx.partial('the motion recorder was not installed on the default-motion pages; MOT-06 measured entrances and MOT-07 were not evaluated');
  if (!acc.fields.reduced_motion.pages && acc.fields.inventory.pages) ctx.partial('no page state could be rendered under reduced motion; MOT-04 was not evaluated');
  ctx.record({
    ...acc.fields,
    limits: { translate: 'min(200 px, viewport / 3) per axis', scale: '≥ 1.25× or ≤ 0.8× on boxes ≥ 25% of the viewport', rotate: '≥ 90°', scroll_linked: 'any movement', status: 'calibrating (ADR-032)' },
    not_measured: [
      'MOT-02 "frequent" class (≤ 150 ms) needs element-level declarations in DESIGN.md; the DOM check applies the state ceiling',
      'MOT-03 gesture-driven exception: only draggable="true" elements are exempted',
      'MOT-04 "every animation has a reduced-motion path" is a source rule (uie lint); no_reduce_path lists animations that ran unchanged under reduce',
    ],
  });
  return [];
}
