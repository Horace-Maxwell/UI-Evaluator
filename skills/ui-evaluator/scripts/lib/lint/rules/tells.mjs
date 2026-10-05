// Source-detectable AI tells (anti-slop.md; QUALITY-BAR G4). Thresholds are read from tells.json detect.params, and
// each tell's level comes from its catalogue class (lint/index.mjs): hard → gate, active or rising soft → soft,
// experimental → possible (reported, never counted).
// Hard: SLP-01, 02, 03, 04, 08, 09, 10, 11 (the copy tells SLP-12…15 live in copy.mjs). DOM-only hard tells
// (SLP-05, 06, 07) are left to `uie audit --checks tells`.
// Soft (need a disposition): SLP-20, 23, 24, 26, 31, 34, 35, 36, 37, 40. Experimental: SLP-57.
import { parseColor, deltaEOK, toOklch } from '../../util/color.mjs';
import { hasGradient, gradientArgs, colorsIn, splitTopLevel, parseShadowLayer, splitWords, lengthPx, varRefs } from '../css.mjs';
import { colorUtility, isGradientUtility, borderWidthUtility, radiusUtility, animateUtility, transformUtility, sizePx, arbitrary, paletteHex, NEUTRAL_FAMILIES, isStateVariant } from '../tailwind.mjs';
import { cssRules, keyframesOf, classGroups, elTokens, isCta, isSectionLevel, copySegments, hasAncestor, cssImportsOf } from '../model.mjs';
import { attr, attrValue, ancestors } from '../markup.mjs';
import { cieLchChroma, inIndigoVioletBand, isChromatic } from '../colors.mjs';
import { tellParams, faceOnList, normaliseFamily } from '../data.mjs';

export const RULES = [
  { id: 'SLP-01', level: 'gate', fast: true, title: 'Gradient text', fix: 'Decide which lever the type system uses for emphasis (size, weight or a solid colour role) and use that token instead of a gradient fill.' },
  { id: 'SLP-02', level: 'gate', fast: true, title: 'Default indigo-violet accent', fix: 'Derive the accent from what the brand owns, give it one job, and change it at the accent token; or document the hue in DESIGN.md.' },
  { id: 'SLP-03', level: 'gate', fast: true, title: 'Emoji or Unicode glyphs as icons', fix: 'Decide whether the item needs an icon at all; if it does, use the one icon family DESIGN.md names, chosen for its meaning.' },
  { id: 'SLP-04', level: 'gate', fast: true, title: 'Decorative side stripe', fix: 'Name what the stripe signals: a state uses the state system\'s own cues, a grouping uses space; otherwise remove it.' },
  { id: 'SLP-08', level: 'gate', fast: true, title: 'Decorative glow', fix: 'Decide where light comes from in this product; otherwise express depth through the elevation system with an offset shadow.' },
  { id: 'SLP-09', level: 'gate', fast: true, title: 'Uniform entrance animation', fix: 'Keep at most the one authored moment the surface mode allows and let every other section be visible at rest.' },
  { id: 'SLP-10', level: 'gate', fast: true, title: 'Fake chrome', fix: 'Show the real thing (a real screenshot in a <figure>, a working component) or a labelled slot for the owner.' },
  { id: 'SLP-11', level: 'gate', fast: true, title: 'Simulated liveness', fix: 'Bind the indicator to genuinely live data and label it, or make it static.' },
  { id: 'SLP-20', level: 'soft', title: 'Saturated display or only face', fix: 'Record in DESIGN.md the job this face does that no other candidate does, or search for a face from the subject\'s voice words.' },
  { id: 'SLP-23', level: 'soft', title: 'Radius monotony', fix: 'Decide a radius scale by component role and size, with concentric nesting, and record it in DESIGN.md.' },
  { id: 'SLP-24', level: 'soft', title: 'Mixed icon libraries or default glyphs in default roles', fix: 'Decide one icon family with a reason; pick each glyph for its meaning and label AI features in words.' },
  { id: 'SLP-26', level: 'soft', title: 'Motion clichés', fix: 'Give feedback on the actionable container with one property, gated to hover-capable pointers.' },
  { id: 'SLP-31', level: 'soft', title: 'Framework default accent as the brand primary', fix: 'Derive the primary from the brand and record the value and its reason in DESIGN.md.' },
  { id: 'SLP-34', level: 'soft', title: 'Decorative glass', fix: 'Keep backdrop blur for overlays on imagery or maps, with a solid fallback; record the purpose of any glass surface.' },
  { id: 'SLP-35', level: 'soft', title: 'Blueprint and grain textures', fix: 'Keep texture only when the direction names it from the subject\'s world; otherwise remove it.' },
  { id: 'SLP-36', level: 'soft', title: 'Costume block shadow', fix: 'Use the declared elevation system, or record a committed neo-brutalist direction in DESIGN.md.' },
  { id: 'SLP-37', level: 'soft', title: 'Placeholder imagery', fix: 'Replace placeholder image hosts with real, art-directed images or a labelled slot.' },
  { id: 'SLP-40', level: 'soft', title: 'Generator leftovers', fix: 'Remove generator meta tags, tagger packages, built-with badges and default favicons from shipped UI.' },
  { id: 'SLP-57', level: 'possible', title: 'Stock effect components', fix: 'Check that the effect serves the direction and is configured for this product rather than shipped with demo defaults.' },
];

const pictoRe = /(?![©®™←-⇿⬅-⬇➡↔-↙])[\p{Extended_Pictographic}✓✔]/u;
export function hasIconGlyph(s) {
  return pictoRe.test(String(s || ''));
}

const CTA_SELECTOR = /(?:^|[\s>+~,(])(?:button|input\[type=["']?(?:submit|button))|[.#][\w-]*(?:btn|button|cta)\b|\[role=["']?button/i;

function customProps(doc, ctx) {
  // Custom property definitions in this document and, for the hook, nothing more: one level of var() resolution.
  const map = new Map(ctx.state.customProps || []);
  for (const r of cssRules(doc)) for (const d of r.decls) if (d.prop.startsWith('--')) map.set(d.prop, d.value);
  return map;
}

function resolveVars(value, props) {
  return String(value).replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (m, name, fb) => props.get(name) ?? fb ?? m);
}

// ---- SLP-01 --------------------------------------------------------------------------------------------

function slp01(doc, ctx, report) {
  const props = customProps(doc, ctx);
  const rules = cssRules(doc);
  for (const r of rules) {
    const clip = r.decls.find((d) => /^(?:-webkit-)?background-clip$/.test(d.prop) && /\btext\b/i.test(d.value));
    if (!clip) continue;
    const sameSelector = rules.filter((x) => x.selector === r.selector);
    const grad = sameSelector.flatMap((x) => x.decls).find((d) => /^background(?:-image)?$/.test(d.prop) && hasGradient(resolveVars(d.value, props)));
    if (grad) report('SLP-01', doc, clip.offset, { message: `background-clip: text over a gradient (${grad.prop}: ${short(grad.value)})`, value: `${clip.prop}: ${clip.value}` });
  }
  const check = (tokens, at) => {
    const clipTok = tokens.find((t) => t.base === 'bg-clip-text');
    if (!clipTok) return;
    const gradTok = tokens.find((t) => isGradientUtility(t.base));
    if (gradTok) report('SLP-01', doc, at ?? clipTok.offset, { message: `bg-clip-text with ${gradTok.base}`, value: `${clipTok.value} ${gradTok.value}` });
  };
  const { byEl, loose } = classGroups(doc);
  for (const toks of byEl.values()) check(toks);
  for (const g of loose) check(g.tokens);
}

// ---- SLP-02 --------------------------------------------------------------------------------------------

/** OKLCH hue distance in degrees (0–180). */
function hueGap(a, b) {
  const d = Math.abs(toOklch(a).h - toOklch(b).h) % 360;
  return d > 180 ? 360 - d : d;
}

export const BRAND_HUE_TOLERANCE_DEG = 15;

function slp02(doc, ctx, report) {
  const P = tellParams('SLP-02');
  if (!P.oklch) return;
  // "When the hue is not in the documented brand palette": a band colour is owned when DESIGN.md documents the same
  // colour, or a chromatic brand colour in the band within 15° of OKLCH hue [calibrating].
  const brandBand = (ctx.project.design.palette || []).filter((p) => isChromatic(p) && inIndigoVioletBand(p, P));
  const owned = (c) => (ctx.project.design.palette || []).some((p) => deltaEOK(p, c) < 0.02) || brandBand.some((p) => hueGap(p, c) <= BRAND_HUE_TOLERANCE_DEG);
  const props = customProps(doc, ctx);
  const band = (c) => inIndigoVioletBand(c, P) && !owned(c);
  for (const r of cssRules(doc)) {
    const cta = CTA_SELECTOR.test(r.selector) || (r.inline && r.el && isCta(doc, r.el));
    for (const d of r.decls) {
      const value = d.prop.startsWith('--') ? d.value : resolveVars(d.value, props);
      if (hasGradient(value)) {
        for (const g of gradientArgs(value)) {
          const hit = colorsIn(g.args).find((x) => band(x.color));
          if (hit) {
            report('SLP-02', doc, d.offset, { message: `gradient stop ${hit.text} is in the indigo-violet band`, value: hit.text });
            break;
          }
        }
        continue;
      }
      if (cta && /^background(?:-color)?$/.test(d.prop)) {
        const hit = colorsIn(value).find((x) => band(x.color));
        if (hit) report('SLP-02', doc, d.offset, { message: `call-to-action fill ${hit.text} is in the indigo-violet band`, value: hit.text });
      }
    }
  }
  const families = new Set(P.tailwind_families || ['purple', 'violet', 'indigo']);
  const check = (tokens, ctaContext) => {
    for (const t of tokens) {
      const c = colorUtility(t.base);
      if (!c) continue;
      if (c.prefix === 'from' || c.prefix === 'via' || c.prefix === 'to') {
        let color = null;
        if (c.kind === 'palette') color = parseColor(paletteHex(c.family, c.shade) || '');
        else if (c.kind === 'literal') color = parseColor(c.value);
        const named = c.kind === 'palette' && families.has(c.family);
        if ((color && band(color)) || (named && !color)) {
          report('SLP-02', doc, t.offset, { message: `gradient stop ${t.value} is in the indigo-violet band`, value: t.value });
          return;
        }
        if (named && ctaContext) {
          report('SLP-02', doc, t.offset, { message: `${t.value} on a call to action`, value: t.value });
          return;
        }
        continue;
      }
      if (c.prefix === 'bg' && ctaContext) {
        if (c.kind === 'palette' && families.has(c.family)) {
          report('SLP-02', doc, t.offset, { message: `${t.value} on a call to action`, value: t.value });
          return;
        }
        if (c.kind === 'literal') {
          const color = parseColor(c.value);
          if (color && band(color)) {
            report('SLP-02', doc, t.offset, { message: `call-to-action fill ${t.value} is in the indigo-violet band`, value: t.value });
            return;
          }
        }
      }
    }
  };
  const { byEl, loose } = classGroups(doc);
  for (const [el, toks] of byEl) check(toks, isCta(doc, el));
  for (const g of loose) check(g.tokens, /button|btn|cta/i.test(g.owner || '') || (g.apply && CTA_SELECTOR.test(g.apply.selector)));
}

// ---- SLP-03 --------------------------------------------------------------------------------------------

const USER_CONTENT_PATH = /chat|message|comment|emoji|reaction|conversation|inbox|social|feed|post/i;
const USER_CONTENT_COMPONENT = /Chat|Message|Comment|Emoji|Reaction|Conversation|Post|Feed/;

function iconContext(doc, el) {
  let e = el;
  for (let depth = 0; e && depth < 5; depth += 1, e = e.parent) {
    if (/^h[1-6]$/.test(e.lower)) return 'heading';
    if (e.lower === 'li') return 'list item';
    if (e.lower === 'button' || isCta(doc, e)) return 'button';
    if (e.lower === 'nav') return 'navigation';
    if (e.lower === 'a' && hasAncestor(e, (a) => a.lower === 'nav' || a.lower === 'header' || a.lower === 'aside')) return 'navigation';
    if (e.lower === 'summary') return 'button';
  }
  return null;
}

function slp03(doc, ctx, report) {
  if (USER_CONTENT_PATH.test(doc.rel)) return;
  for (const seg of copySegments(doc)) {
    if (seg.code || !hasIconGlyph(seg.text)) continue;
    if (seg.el && (seg.el.isComponent && USER_CONTENT_COMPONENT.test(seg.el.tag) || hasAncestor(seg.el, (a) => a.isComponent && USER_CONTENT_COMPONENT.test(a.tag)))) continue;
    let where = null;
    if (seg.kind === 'md') {
      if (seg.md === 'heading') where = 'heading';
      else if (seg.md === 'list' && hasIconGlyph(seg.text.replace(/^(?:[-*+]|\d+\.)\s+/, '').slice(0, 3))) where = 'list marker';
    } else if (seg.kind === 'text' || (seg.kind === 'string' && !seg.key)) {
      const c = seg.el ? iconContext(doc, seg.el) : null;
      if (c === 'list item') {
        // Only a glyph used as the bullet: at the start of the item's text.
        if (hasIconGlyph([...seg.text].slice(0, 2).join(''))) where = 'list marker';
      } else if (c) where = c;
    }
    if (!where) continue;
    const glyph = [...seg.text].find((ch) => hasIconGlyph(ch));
    report('SLP-03', doc, seg.offset, { message: `${glyph} used as an icon in a ${where}`, value: glyph });
  }
  // Data that feeds icon slots: { icon: "🚀" }.
  for (const s of doc.strings) {
    if (!s.key || !/^(?:icon|emoji|symbol|glyph|bullet|prefix)$/i.test(s.key)) continue;
    if (hasIconGlyph(s.value) && [...s.value.trim()].length <= 4) report('SLP-03', doc, s.offset, { message: `${s.value.trim()} in an \`${s.key}\` field feeds an icon slot`, value: s.value.trim() });
  }
  // CSS generated content and list markers.
  for (const r of cssRules(doc)) {
    for (const d of r.decls) {
      if ((d.prop === 'content' && /::?(?:before|after|marker)/.test(r.selector)) || d.prop === 'list-style' || d.prop === 'list-style-type') {
        if (hasIconGlyph(d.value)) report('SLP-03', doc, d.offset, { message: `glyph in ${d.prop} used as a ${d.prop === 'content' ? 'bullet or prefix' : 'list marker'}`, value: d.value });
      }
    }
  }
}

// ---- SLP-04 --------------------------------------------------------------------------------------------

const SEMANTIC_SELECTOR = /blockquote|\balert\b|\[role=["']?(?:alert|status)|callout[-_](?:warning|danger|error|info|success|note|tip|caution|important)|(?:^|[-_.\s])(?:warning|danger|error|success|info|note|tip|caution|notice|destructive|important|invalid)(?:$|[-_\s.:\[])/i;
const STATE_SELECTOR = /:(?:hover|focus|focus-visible|focus-within|active|checked|target)|\.(?:active|current|selected|is-active|is-current|is-selected|open)\b|\[(?:aria-current|aria-selected|aria-expanded|data-state|data-active|data-selected|open)/i;
const OUT_OF_SCOPE_LAST = /(?:^|[\s>+~])(?:a|input|textarea|select|td|th|button|blockquote)(?:[.#:[]|$)/i;
const ACCENT_VAR = /(?:accent|primary|brand|highlight|secondary)/i;
const SEMANTIC_TOKEN = /(?:destructive|danger|error|warning|success|info|alert|caution|invalid)/i;
const SEMANTIC_KIND = /^(?:note|tip|info|information|warning|warn|caution|danger|error|success|important|destructive|alert|critical|positive|negative|neutral)$/i;

function sideInfo(decls) {
  const sides = { left: {}, right: {}, top: {}, bottom: {}, 'inline-start': {}, 'inline-end': {} };
  let radius = 0;
  const widthOf = (w) => {
    const px = lengthPx(w);
    if (px !== null) return px;
    if (/^thin$/i.test(w)) return 1;
    if (/^medium$/i.test(w)) return 3;
    if (/^thick$/i.test(w)) return 5;
    return null;
  };
  const parseShorthand = (value) => {
    const out = {};
    for (const w of splitWords(value)) {
      const px = widthOf(w);
      if (px !== null && out.width === undefined) out.width = px;
      else if (/^(?:none|hidden)$/i.test(w)) out.none = true;
      else if (/^(?:solid|dashed|dotted|double|groove|ridge|inset|outset)$/i.test(w)) out.style = w;
      else out.color = out.color ? `${out.color} ${w}` : w;
    }
    return out;
  };
  for (const d of decls) {
    const p = d.prop;
    if (p === 'border') {
      const s = parseShorthand(d.value);
      for (const k of Object.keys(sides)) sides[k] = { ...sides[k], ...s, decl: sides[k].decl };
    } else if (p === 'border-width') {
      const ws = splitWords(d.value).map(widthOf);
      const [t, r = t, b = t, l = r] = ws;
      sides.top.width = t; sides.right.width = r; sides.bottom.width = b; sides.left.width = l;
    } else if (p === 'border-color') {
      sides.top.color = sides.right.color = sides.bottom.color = sides.left.color = d.value;
    } else if (p === 'border-radius' || /^border-(?:top|bottom|start|end)-(?:left|right|start|end)-radius$/.test(p)) {
      const px = lengthPx(splitWords(d.value)[0]);
      if (px !== null && px > 0) radius = Math.max(radius, px);
      else if (/%|var\(/.test(d.value)) radius = Math.max(radius, 1);
    } else {
      const m = p.match(/^border-(left|right|top|bottom|inline-start|inline-end)(?:-(width|color|style))?$/);
      if (!m) continue;
      const side = sides[m[1]];
      if (!m[2]) Object.assign(side, parseShorthand(d.value), { decl: d });
      else if (m[2] === 'width') Object.assign(side, { width: widthOf(d.value), decl: side.decl || d });
      else if (m[2] === 'color') Object.assign(side, { color: d.value, decl: side.decl || d });
      else if (/none|hidden/i.test(d.value)) side.none = true;
    }
  }
  return { sides, radius };
}

function colorIsAccent(value) {
  if (!value) return false;
  const lits = colorsIn(value);
  if (lits.length) return lits.some((c) => isChromatic(c.color));
  const vars = varRefs(value);
  return vars.some((v) => ACCENT_VAR.test(v) && !SEMANTIC_TOKEN.test(v));
}

function slp04(doc, ctx, report) {
  const P = tellParams('SLP-04');
  for (const r of cssRules(doc)) {
    if (r.inline) {
      if (r.el && (['a', 'input', 'textarea', 'select', 'td', 'th', 'button', 'blockquote'].includes(r.el.lower) || attrValue(r.el, 'role') === 'alert')) continue;
    } else if (SEMANTIC_SELECTOR.test(r.selector) || STATE_SELECTOR.test(r.selector) || splitTopLevel(r.selector, ',').every((s) => OUT_OF_SCOPE_LAST.test(s.split(/\s+/).pop()))) continue;
    const { sides, radius } = sideInfo(r.decls);
    const others = (k) => Object.entries(sides).filter(([n]) => n !== k && !(['left', 'inline-start'].includes(n) && ['left', 'inline-start'].includes(k)) && !(['right', 'inline-end'].includes(n) && ['right', 'inline-end'].includes(k))).map(([, s]) => (s.none ? 0 : s.width ?? 0));
    for (const [k, s] of Object.entries(sides)) {
      if (!s.decl || s.none || !s.width) continue;
      const vertical = k === 'top' || k === 'bottom';
      const maxOther = Math.max(0, ...others(k));
      let stripe;
      if (vertical) stripe = radius > 0 && s.width >= P.top_bottom_min_px_rounded_card;
      else stripe = s.width >= (radius > 0 ? P.side_min_px_rounded : P.side_min_px) || (maxOther > 0 && s.width >= P.ratio_to_other_sides * maxOther && s.width >= 2);
      if (!stripe || !colorIsAccent(s.color)) continue;
      report('SLP-04', doc, s.decl.offset, { message: `${s.width}px coloured ${k} border${radius ? ' on a rounded box' : ''} (${short(s.color)})`, value: `border-${k}: ${s.width}px ${s.color || ''}`.trim() });
    }
  }
  const OUT = new Set(['a', 'input', 'textarea', 'select', 'td', 'th', 'button', 'blockquote', 'tr', 'table']);
  const check = (tokens, el, owner, key) => {
    if (el && (OUT.has(el.lower) || /^(?:alert|status|note)$/.test(String(attrValue(el, 'role') || '')) || attr(el, 'aria-current'))) return;
    if (el && el.isComponent && /Alert|Callout|Toast|Banner|Notice|Blockquote|Quote|Admonition/.test(el.tag)) return;
    if (owner && /alert|callout|toast|banner|notice|quote|admonition/i.test(owner)) return;
    // A class string stored under a semantic kind ({ warning: 'border-l-4 …' }) colours a state, not decoration.
    if (key && SEMANTIC_KIND.test(key)) return;
    if (tokens.some((t) => SEMANTIC_TOKEN.test(t.base) && /^(?:border|bg|text)-/.test(t.base))) return;
    const rounded = tokens.some((t) => !t.variants.length && t.base.startsWith('rounded') && radiusUtility(t.base) && (radiusUtility(t.base).px ?? 1) > 0);
    for (const t of tokens) {
      const bw = borderWidthUtility(t.base);
      if (!bw || bw.side === 'all' || bw.side === 'x' || bw.side === 'y') continue;
      // A stripe applied under a state (hover:, aria-current:, or `isActive && '…'`) is a state cue.
      if (t.variants.some(isStateVariant) || t.cond) continue;
      const vertical = bw.side === 't' || bw.side === 'b';
      const min = vertical ? 3 : rounded ? tellParams('SLP-04').tailwind_side_min_rounded : tellParams('SLP-04').tailwind_side_min;
      if (bw.px < min || (vertical && !rounded)) continue;
      const colorTok = tokens.find((x) => {
        if (x.variants.some(isStateVariant)) return false;
        const c = colorUtility(x.base);
        if (!c || !(c.prefix === 'border' || c.prefix === `border-${bw.side}`)) return false;
        if (c.kind === 'palette') return !NEUTRAL_FAMILIES.has(c.family);
        if (c.kind === 'literal') return isChromatic(parseColor(c.value));
        if (c.kind === 'var') return ACCENT_VAR.test(c.value) && !SEMANTIC_TOKEN.test(c.value);
        if (c.kind === 'token') return ACCENT_VAR.test(c.value) && !SEMANTIC_TOKEN.test(c.value);
        return false;
      });
      if (!colorTok) continue;
      report('SLP-04', doc, t.offset, { message: `${t.value} with ${colorTok.value}${rounded ? ' on a rounded box' : ''}`, value: `${t.value} ${colorTok.value}` });
      return;
    }
  };
  const { byEl, loose } = classGroups(doc);
  for (const [el, toks] of byEl) check(toks, el, null, null);
  for (const g of loose) check(g.tokens, null, g.owner || (g.apply ? g.apply.selector : ''), g.key);
}

// ---- SLP-08 / SLP-36 -----------------------------------------------------------------------------------

function shadowLayers(prop, value) {
  if (prop === 'filter' || prop === '-webkit-filter') {
    return [...String(value).matchAll(/drop-shadow\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gi)].map((m) => m[1]);
  }
  return splitTopLevel(value, ',');
}

function checkShadows(doc, offset, prop, value, report, where) {
  const P8 = tellParams('SLP-08');
  for (const layer of shadowLayers(prop, value)) {
    const s = parseShadowLayer(layer);
    if (!s || !s.color) continue;
    const lit = colorsIn(s.color)[0];
    if (!lit || (lit.color.alpha ?? 1) === 0) continue;
    if (s.x === 0 && s.y === 0 && s.blur > P8.blur_gt_px && cieLchChroma(lit.color) >= P8.cie_lch_chroma_min) {
      report('SLP-08', doc, offset, { message: `zero-offset chromatic ${where} glow (${short(layer)}; CIE LCh chroma ${cieLchChroma(lit.color).toFixed(0)})`, value: layer.trim() });
      return;
    }
    if (prop === 'box-shadow' && !s.inset && s.blur === 0 && s.x > 0 && s.y > 0) {
      report('SLP-36', doc, offset, { message: `hard block shadow ${short(layer)} (zero blur, positive offsets)`, value: layer.trim() });
      return;
    }
  }
}

function slp08_36(doc, ctx, report) {
  for (const r of cssRules(doc)) {
    for (const d of r.decls) {
      if (/^(?:box-shadow|text-shadow|filter|-webkit-filter)$/.test(d.prop)) checkShadows(doc, d.offset, d.prop, d.value, report, d.prop === 'text-shadow' ? 'text' : 'shadow');
      else if (/^--[\w-]*(?:shadow|glow)[\w-]*$/i.test(d.prop)) checkShadows(doc, d.offset, 'box-shadow', d.value, report, 'shadow token');
    }
  }
  const { byEl, loose } = classGroups(doc);
  const check = (tokens) => {
    for (const t of tokens) {
      const m = t.base.match(/^(shadow|drop-shadow|text-shadow)-(\[.+\])$/);
      if (!m) continue;
      const v = arbitrary(m[2]);
      if (!v || /^color:|^var\(/.test(v)) continue;
      checkShadows(doc, t.offset, m[1] === 'drop-shadow' ? 'filter' : m[1] === 'text-shadow' ? 'text-shadow' : 'box-shadow', m[1] === 'drop-shadow' ? `drop-shadow(${v})` : v, report, 'shadow');
    }
  };
  for (const toks of byEl.values()) check(toks);
  for (const g of loose) check(g.tokens);
}

// ---- SLP-09 --------------------------------------------------------------------------------------------

const ENTRANCE_ANIM = /(?:fade|slide|rise|reveal|appear|enter|zoom|blur-in|in-up|up\b|in\b)/i;
const REVEAL_CLASS = /^(?:reveal|fade-up|fade-in|fade-in-up|fade-up-in|animate-on-scroll|js-reveal|scroll-reveal|aos-init|wow|animate__\w+|in-view|on-scroll|sr-only-reveal)$/;
const WRAPPER = /^(?:FadeIn|FadeUp|FadeInUp|Reveal|ScrollReveal|AnimateIn|AnimateOnScroll|AnimatedSection|MotionSection|Appear|SlideIn|SlideUp|InView|BlurFade|BlurIn|Animate|Animated)$/;

function entranceSignature(doc, el) {
  const sig = [];
  for (const t of elTokens(doc, el)) {
    const a = animateUtility(t.base);
    if (a && ENTRANCE_ANIM.test(a.name)) sig.push(`animate:${a.name}`);
    if (REVEAL_CLASS.test(t.base)) sig.push(`class:${t.base}`);
  }
  for (const a of el.attrs) {
    if (/^data-(?:aos|animate|sal|reveal|scroll)$/.test(a.lower)) sig.push(`${a.lower}=${a.value}`);
  }
  const initial = el.attrs.find((a) => a.name === 'initial');
  const inView = el.attrs.find((a) => a.name === 'whileInView' || a.name === 'animate');
  if (initial && inView) sig.push(`motion:${String(initial.value).replace(/\s+/g, '')}>${String(inView.value).replace(/\s+/g, '')}`);
  const variants = el.attrs.find((a) => a.name === 'variants');
  if (variants && (attr(el, 'whileInView') || attr(el, 'initial'))) sig.push(`variants:${String(variants.value).trim()}`);
  return sig.sort().join('|');
}

function slp09(doc, ctx, report) {
  const P = tellParams('SLP-09');
  const groups = new Map();
  for (const el of doc.elements) {
    let key = null;
    if (isSectionLevel(el)) key = entranceSignature(doc, el);
    else if (el.isComponent && WRAPPER.test(el.tag.split('.').pop())) {
      const props = el.attrs.filter((a) => !/^(?:key|className|class|id|delay|transition)$/.test(a.name)).map((a) => `${a.name}=${String(a.value).replace(/\s+/g, '')}`).sort().join(',');
      key = `wrapper:${el.tag}(${props})`;
    }
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(el);
  }
  for (const [key, els] of groups) {
    if (els.length < P.min_sections) continue;
    const at = els[P.min_sections - 1];
    report('SLP-09', doc, at.offset, { message: `the same entrance (${short(key, 70)}) on ${els.length} sections (lines ${els.map((e) => e.line).join(', ')})`, value: els.length, detail: `entrance signature ${key}` });
  }
}

// ---- SLP-10 --------------------------------------------------------------------------------------------

const TRAFFIC = [/^(?:red|rose)$/, /^(?:yellow|amber)$/, /^(?:green|emerald|lime)$/];
const MAC_HEX = [['#ff5f57', '#ff5f56', '#fe5f57', '#ec6a5e'], ['#febc2e', '#ffbd2e', '#fdbc40', '#f4bf4f'], ['#28c840', '#27c93f', '#28ca41', '#61c554']];

function dotColor(doc, el) {
  const toks = elTokens(doc, el);
  if (!toks.some((t) => t.base === 'rounded-full')) return null;
  const sizes = toks.map((t) => sizePx(t.base)).filter((x) => x !== null);
  if (sizes.length && Math.max(...sizes) > 16) return null;
  for (const t of toks) {
    const c = colorUtility(t.base);
    if (c && c.prefix === 'bg' && c.kind === 'palette') {
      const i = TRAFFIC.findIndex((re) => re.test(c.family));
      if (i >= 0) return i;
    }
    if (c && c.prefix === 'bg' && c.kind === 'literal') {
      const i = MAC_HEX.findIndex((set) => set.includes(String(c.value).toLowerCase()));
      if (i >= 0) return i;
    }
  }
  return null;
}

function slp10(doc, ctx, report) {
  for (const el of doc.elements) {
    const kids = el.children;
    for (let i = 0; i + 2 < kids.length; i += 1) {
      if (dotColor(doc, kids[i]) === 0 && dotColor(doc, kids[i + 1]) === 1 && dotColor(doc, kids[i + 2]) === 2) {
        report('SLP-10', doc, kids[i].offset, { message: 'three red, yellow and green dots: a fake window title bar', value: 'traffic lights' });
        return;
      }
    }
  }
  const text = doc.text.toLowerCase();
  const found = MAC_HEX.map((set) => set.map((h) => text.indexOf(h)).filter((x) => x >= 0).sort((a, b) => a - b)[0]);
  if (found.every((x) => x !== undefined)) report('SLP-10', doc, Math.min(...found), { message: 'macOS traffic-light colours (red, yellow, green) drawn in code: a fake window title bar', value: 'traffic-light hex values' });
}

// ---- SLP-11 --------------------------------------------------------------------------------------------

const MARQUEE_NAME = /marquee|ticker|infinite-scroll|scroll-(?:x|left|right|loop)|loop-scroll|slide-infinite|logo-scroll|carousel-scroll/i;
const BLINK_NAME = /blink|caret|cursor/i;
const COUNTER_PKGS = /^(?:react-countup|countup\.js|use-count-up|react-count-up|vue3-autocounter|vue-countup-v3|odometer|react-odometerjs|svelte-countup)$/;

function conditionalRender(doc, el) {
  const before = doc.text.slice(Math.max(0, el.offset - 120), el.offset);
  return /(?:&&|\?|v-if=|\{#if)[^<>]*$/.test(before) || el.attrs.some((a) => /^(?:v-if|v-show)$/.test(a.name));
}

function slp11(doc, ctx, report) {
  for (const el of doc.elements) {
    if (el.lower === 'marquee') {
      report('SLP-11', doc, el.offset, { message: '<marquee> scrolling content', value: 'marquee' });
      continue;
    }
    const toks = elTokens(doc, el);
    if (!toks.length) continue;
    for (const t of toks) {
      const a = animateUtility(t.base);
      if (!a) continue;
      if (MARQUEE_NAME.test(a.name)) {
        report('SLP-11', doc, t.offset, { message: `${t.value}: a marquee or ticker animation`, value: t.value });
        break;
      }
      if (BLINK_NAME.test(a.name) && el.lower !== 'input' && el.lower !== 'textarea') {
        report('SLP-11', doc, t.offset, { message: `${t.value}: a blinking cursor outside an input`, value: t.value });
        break;
      }
      if ((a.name === 'ping' || a.name === 'pulse') && toks.some((x) => x.base === 'rounded-full')) {
        const sizes = toks.map((x) => sizePx(x.base)).filter((x) => x !== null);
        if (sizes.length && Math.max(...sizes) <= 16 && !conditionalRender(doc, el) && !/(?:live|online|status|connected|recording|presence)/i.test(el.attrs.map((x) => `${x.name}=${x.value}`).join(' '))) {
          report('SLP-11', doc, t.offset, { message: `${t.value} on a small round element: a pulsing status dot`, value: t.value });
          break;
        }
      }
    }
  }
  // CSS keyframes used as marquee or blinking cursor.
  const kfs = keyframesOf(doc);
  for (const r of cssRules(doc)) {
    for (const d of r.decls) {
      if (d.prop !== 'animation' && d.prop !== 'animation-name') continue;
      const names = d.value.split(/[\s,]+/);
      const infinite = /\binfinite\b/i.test(d.value) || r.decls.some((x) => x.prop === 'animation-iteration-count' && /infinite/i.test(x.value));
      if (!infinite) continue;
      const kfName = names.find((n) => kfs.some((k) => k.name === n)) || names.find((n) => MARQUEE_NAME.test(n) || BLINK_NAME.test(n));
      if (!kfName) continue;
      const kf = kfs.find((k) => k.name === kfName);
      const translates = kf && kf.frames.some((f) => f.decls.some((x) => /translatex\(\s*-(?:50|100)%|translate3d\(\s*-(?:50|100)%/i.test(x.value)));
      if (MARQUEE_NAME.test(kfName) || translates) report('SLP-11', doc, d.offset, { message: `infinite ${kfName} animation: a marquee or ticker`, value: d.value });
      else if (BLINK_NAME.test(kfName) && !/input|textarea/.test(r.selector)) report('SLP-11', doc, d.offset, { message: `infinite ${kfName} animation: a blinking cursor outside an input`, value: d.value });
    }
  }
  // Count-up numbers.
  for (const imp of doc.imports) {
    if (!COUNTER_PKGS.test(imp.source)) continue;
    const usage = /<CountUp\b[^>]*\bend=\{?\s*["']?\d/.exec(doc.text) || /useCountUp\(\s*\{[^}]*\bend\s*:\s*\d/.exec(doc.code) || /new\s+CountUp\(\s*[^,]+,\s*\d/.exec(doc.code);
    if (usage) report('SLP-11', doc, usage.index, { message: `count-up animation of a fixed number (${imp.source})`, value: imp.source });
  }
  const anim = /\b(?:animateValue|animateCount|countUp|animateNumber)\s*\(\s*[^,()]+,\s*\d[\d_.]*\s*,\s*\d[\d_.]*/.exec(doc.code);
  if (anim) report('SLP-11', doc, anim.index, { message: 'count-up script animating fixed numbers', value: anim[0].slice(0, 40) });
}

// ---- soft tells ----------------------------------------------------------------------------------------

const HEADING_SELECTOR = /(?:^|[\s,>])h[1-3]\b|display|hero|heading|headline|title/i;
const ROOT_SELECTOR = /^(?::root|html|body|\*|@theme)$/;

function firstFamily(value) {
  const first = splitTopLevel(value, ',')[0] || '';
  return first.replace(/["']/g, '').trim();
}

/** The family list of a `font` shorthand: everything after the size (and optional /line-height). */
export function fontShorthandFamilies(value) {
  const m = String(value).match(/(?:^|\s)(?:[\d.]+(?:px|rem|em|%|pt|vw|vh|ch)|xx-small|x-small|small|medium|large|x-large|xx-large|larger|smaller)(?:\s*\/\s*[\w.%-]+)?\s+(.+)$/i);
  return m ? m[1] : '';
}

// SLP-20 targets the display voice or the only face (anti-slop.md §6.2). A listed face in a display role (heading
// selectors, display tokens, a next/font face bound to a display variable) is reported per file. A listed body,
// root or loaded face is a candidate, reported in the project pass only when it is the only text face.
const DISPLAY_ROLE = /display|heading|headline|title|hero|brand/i;

function slp20State(ctx) {
  ctx.state.slp20 = ctx.state.slp20 || { candidates: [], families: new Set(), displayed: new Set() };
  return ctx.state.slp20;
}

/** The CSS variable a next/font face is bound to: `const x = Fraunces({ variable: '--font-display' })`. */
function nextFontVariable(doc, name) {
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) return null;
  const m = new RegExp(`\\b${name}\\s*\\(\\s*\\{([^}]*)\\}`).exec(doc.code);
  const v = m && m[1].match(/variable\s*:\s*['"`](--[\w-]+)['"`]/);
  return v ? v[1] : null;
}

function slp20(doc, ctx, report) {
  const st = slp20State(ctx);
  const props = customProps(doc, ctx);
  const addFamily = (fam) => {
    // A family given through a custom property is that property's face; an unresolved var() is no face of its own
    // (normaliseFamily would read "var(--font-sans)" as a family called "(--font-sans)").
    if (/var\(/i.test(String(fam || ''))) return;
    const k = normaliseFamily(fam);
    // Generic and keyword families are not faces of their own (system-ui is: it renders the platform face).
    if (k && !MONO_FACE.test(k) && !/^(?:inherit|initial|unset|revert|serif|sans-serif|monospace|ui-monospace|ui-sans-serif|ui-serif|ui-rounded|cursive|fantasy|math|emoji|fangsong|var\(.*)$/.test(k)) st.families.add(k);
  };
  const display = (family, offset, where) => {
    const f = faceOnList(family);
    if (!f || st.displayed.has(`${doc.rel}|${f.name}`)) return;
    st.displayed.add(`${doc.rel}|${f.name}`);
    report('SLP-20', doc, offset, { message: `${f.name} (${f.group}, as of 2026-10) as ${where} with no recorded reason`, value: f.name });
  };
  const candidate = (family, offset, where) => {
    const f = faceOnList(family);
    if (f) st.candidates.push({ f, doc, offset, where });
  };
  for (const r of cssRules(doc)) {
    for (const d of r.decls) {
      if (d.prop === 'font-family' || d.prop === 'font') {
        const fam = firstFamily(resolveVars(d.prop === 'font' ? fontShorthandFamilies(d.value) : d.value, props));
        addFamily(fam);
        if (HEADING_SELECTOR.test(r.selector)) display(fam, d.offset, 'the display face');
        else if (ROOT_SELECTOR.test(r.selector.trim())) candidate(fam, d.offset, 'the body face');
      } else if (/^--(?:font|font-family)-[\w-]+$/.test(d.prop) || d.prop === '--default-font-family') {
        if (/^--font-(?:weight|size|feature|variation|mono|code)/.test(d.prop)) continue;
        const fam = firstFamily(resolveVars(d.value, props));
        addFamily(fam);
        if (DISPLAY_ROLE.test(d.prop)) display(fam, d.offset, 'the display face');
        else if (/^--(?:font|font-family)-(?:sans|body|base|default|text|ui|serif)$/.test(d.prop) || d.prop === '--default-font-family') candidate(fam, d.offset, 'the body face');
      }
    }
  }
  // Loaded faces (next/font, @fontsource, Google Fonts URLs). A monospace face loaded beside a text face serves code
  // and data, so it is neither the display voice nor the only face.
  const loaded = [];
  for (const imp of doc.imports) {
    if (/^next\/font\/google$/.test(imp.source)) for (const n of imp.names) loaded.push({ family: n.replace(/_/g, ' '), offset: imp.offset, where: 'a next/font face', variable: nextFontVariable(doc, n) });
    const fs = imp.source.match(/^@fontsource(?:-variable)?\/([\w-]+)/);
    if (fs) loaded.push({ family: fs[1].replace(/-/g, ' '), offset: imp.offset, where: 'an imported face' });
  }
  const gf = /fonts\.googleapis\.com\/css2?\?([^"'\s)>]+)/g;
  let m;
  while ((m = gf.exec(doc.text))) {
    for (const fm of m[1].matchAll(/family=([^&:;"']+)/g)) loaded.push({ family: decodeURIComponent(fm[1]).replace(/\+/g, ' '), offset: m.index, where: 'a Google Fonts face' });
  }
  const isMono = (f) => MONO_FACE.test(f);
  const textFaces = loaded.filter((l) => !isMono(l.family));
  for (const l of loaded) {
    if (isMono(l.family) && textFaces.length) continue;
    addFamily(l.family);
    if (l.variable && DISPLAY_ROLE.test(l.variable)) display(l.family, l.offset, `${l.where} bound to ${l.variable}`);
    else candidate(l.family, l.offset, l.where);
  }
}

/** Project pass: a listed body or loaded face is reported when it is the only text face in the project. */
function slp20Project(ctx, report) {
  const st = ctx.state.slp20;
  if (!st) return;
  for (const t of ctx.project.tokens?.families || []) {
    const k = normaliseFamily(t.family);
    if (k && !MONO_FACE.test(k)) st.families.add(k);
  }
  const seen = new Set();
  for (const c of st.candidates) {
    const key = normaliseFamily(c.f.name);
    const others = [...st.families].filter((k) => k !== key && !c.f.match.includes(k));
    if (others.length || seen.has(key)) continue;
    seen.add(key);
    report('SLP-20', c.doc, c.offset, { message: `${c.f.name} (${c.f.group}, as of 2026-10) as the only face (${c.where}) with no recorded reason`, value: c.f.name });
  }
}

const MONO_FACE = /\bmono\b|\bcode\b|consolas|menlo|courier|monaco|inconsolata|iosevka|\bhack\b/i;

function collectRadii(doc, ctx) {
  const st = (ctx.state.radii = ctx.state.radii || []);
  for (const r of cssRules(doc)) {
    for (const d of r.decls) {
      if (d.prop !== 'border-radius') continue;
      const px = lengthPx(splitWords(d.value)[0]);
      if (px === null || px === 0 || px >= 999) continue;
      st.push({ px, doc, offset: d.offset });
    }
  }
  for (const t of [...classGroups(doc).byEl.values()].flat().concat(classGroups(doc).loose.flatMap((g) => g.tokens))) {
    if (t.variants.length) continue;
    const r = radiusUtility(t.base);
    if (!r || r.token || r.full || !r.px) continue;
    st.push({ px: r.px, doc, offset: t.offset });
  }
}

const ICON_PKG = [
  [/^lucide(?:-[\w]+)?$/, 'lucide'], [/^@heroicons\//, 'heroicons'], [/^react-icons\/(\w+)/, 'react-icons/$1'], [/^@tabler\/icons/, 'tabler'],
  [/^(?:@phosphor-icons\/|phosphor-react$)/, 'phosphor'], [/^@radix-ui\/react-icons$/, 'radix-icons'], [/^@mui\/icons-material/, 'material-icons'],
  [/^@fortawesome\//, 'fontawesome'], [/^(?:react-feather|feather-icons)$/, 'feather'], [/^(?:react-bootstrap-icons|bootstrap-icons)$/, 'bootstrap-icons'],
  [/^(?:@remixicon\/|remixicon)/, 'remixicon'], [/^@carbon\/icons/, 'carbon-icons'], [/^@ant-design\/icons/, 'ant-icons'], [/^@primer\/octicons/, 'octicons'],
  [/^iconoir/, 'iconoir'], [/^@hugeicons\//, 'hugeicons'], [/^ionicons/, 'ionicons'], [/^@material-symbols\//, 'material-symbols'],
];

function iconLibrary(source) {
  for (const [re, name] of ICON_PKG) {
    const m = source.match(re);
    if (m) return name.replace('$1', m[1] || '');
  }
  return null;
}

function slp24Collect(doc, ctx, report) {
  const libs = (ctx.state.iconLibs = ctx.state.iconLibs || new Map());
  for (const imp of doc.imports) {
    const lib = iconLibrary(imp.source);
    if (!lib) continue;
    if (!libs.has(lib)) libs.set(lib, { doc, offset: imp.offset, source: imp.source });
    const sparkle = imp.names.find((n) => /^(?:Sparkles?|SparklesIcon|Hi(?:Outline)?Sparkles|BsStars|IconSparkles|LuSparkles|Wand(?:Sparkles)?|MagicWand)$/.test(n));
    if (sparkle) report('SLP-24', doc, imp.offset, { message: `${sparkle} imported from ${imp.source}: the stock AI glyph (none of 107 NN/g participants read it as AI)`, value: sparkle });
    const bolt = imp.names.find((n) => /^(?:Zap|ZapIcon|Bolt|BoltIcon|IconBolt|Hi(?:Outline)?Bolt|BsLightning(?:Fill)?)$/.test(n));
    if (bolt) report('SLP-24', doc, imp.offset, { message: `${bolt} imported from ${imp.source}: the stock speed glyph`, value: bolt });
  }
}

function slp26(doc, ctx, report) {
  const IMAGE_SEL = /(?:^|[\s>+~])(?:img|picture|video)\b|[.#][\w-]*(?:img|image|photo|thumb|thumbnail|cover|picture|media)[\w-]*/i;
  for (const r of cssRules(doc)) {
    if (!/:hover/.test(r.selector)) continue;
    const after = r.selector.split(/:hover/).pop();
    const scales = r.decls.some((d) => (d.prop === 'transform' && /scale/i.test(d.value)) || d.prop === 'scale');
    if (scales && IMAGE_SEL.test(after)) report('SLP-26', doc, r.offset, { message: `hover zoom on an image (${short(r.selector)})`, value: r.selector });
    const kinds = new Set();
    for (const d of r.decls) {
      if (d.prop === 'transform' || d.prop === 'translate' || d.prop === 'scale' || d.prop === 'rotate') kinds.add(/scale/.test(`${d.prop} ${d.value}`) ? 'scale' : /rotate/.test(`${d.prop} ${d.value}`) ? 'rotate' : 'translate');
      if (d.prop === 'box-shadow') kinds.add('shadow');
      if (d.prop === 'filter') kinds.add('filter');
    }
    if (kinds.size > tellParams('SLP-26').hover_property_changes_gt) report('SLP-26', doc, r.offset, { message: `${kinds.size} motion properties change together on hover (${[...kinds].join(', ')})`, value: [...kinds].join(',') });
  }
  for (const [el, toks] of classGroups(doc).byEl) {
    const hoverToks = toks.filter((t) => t.variants.some((v) => /^(?:hover|group-hover(?:\/\w+)?)$/.test(v)));
    if (!hoverToks.length) continue;
    const isImg = el.lower === 'img' || el.lower === 'picture' || el.lower === 'video' || (el.isComponent && /^(?:Image|NextImage|Img|Picture)$/.test(el.tag));
    const scale = hoverToks.find((t) => {
      const tf = transformUtility(t.base);
      return tf && tf.kind === 'scale' && Number(tf.value) > 100;
    });
    if (isImg && scale) report('SLP-26', doc, scale.offset, { message: `${scale.value} on an image: hover zoom`, value: scale.value });
    const kinds = new Set();
    for (const t of hoverToks) {
      const tf = transformUtility(t.base);
      if (tf) kinds.add(tf.kind);
      if (/^shadow(?:-|$)/.test(t.base) && !colorUtility(t.base)) kinds.add('shadow');
      if (/^(?:brightness|blur|saturate|contrast)-/.test(t.base)) kinds.add('filter');
    }
    if (kinds.size > tellParams('SLP-26').hover_property_changes_gt) report('SLP-26', doc, hoverToks[0].offset, { message: `${kinds.size} motion properties change together on hover (${[...kinds].join(', ')})`, value: hoverToks.map((t) => t.value).join(' ') });
  }
}

const TW_DEFAULT_PRIMARIES = ['#6366f1', '#4f46e5', '#7c3aed', '#2563eb', 'oklch(58.5% 0.233 277.117)', 'oklch(51.1% 0.262 276.966)', 'oklch(54.1% 0.281 293.009)', 'oklch(54.6% 0.245 262.881)'];

function slp31(doc, ctx, report) {
  const P = tellParams('SLP-31');
  const defaults = [...new Set([...(P.tailwind_defaults || []).map((x) => x.toLowerCase()), ...TW_DEFAULT_PRIMARIES])];
  const owned = (ctx.project.design.palette || []);
  const check = (name, value, offset) => {
    let v = String(value).trim().replace(/["']/g, '').toLowerCase();
    const ch = v.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
    if (ch) v = `hsl(${ch[1]} ${ch[2]}% ${ch[3]}%)`;
    const c = parseColor(v);
    if (!c) return;
    const match = defaults.find((d) => d === v || (parseColor(d) && deltaEOK(parseColor(d), c) < 0.002));
    if (!match) return;
    if (owned.some((p) => deltaEOK(p, c) < 0.002)) return;
    report('SLP-31', doc, offset, { message: `${name} is the Tailwind default ${match}`, value: v });
  };
  for (const r of cssRules(doc)) {
    for (const d of r.decls) {
      if (/^(?:--(?:color-)?(?:primary|accent|brand)(?:-(?:color|500|600|default))?|\$(?:primary|accent|brand)(?:-color)?)$/i.test(d.prop)) check(d.prop, d.value, d.offset);
    }
  }
  for (const s of doc.strings) {
    if (s.key && /^(?:primary|accent|brand)$/.test(s.key)) check(s.key, s.value, s.offset);
    else if (s.key === 'DEFAULT' && /tailwind\.config/.test(doc.rel)) check(s.key, s.value, s.offset);
  }
}

function slp34(doc, ctx, report) {
  const P = tellParams('SLP-34');
  const glass = [];
  for (const r of cssRules(doc)) for (const d of r.decls) if (/^(?:-webkit-)?backdrop-filter$/.test(d.prop) && /blur\(/i.test(d.value)) glass.push(d.offset);
  for (const t of classTokens2(doc)) if (/^backdrop-blur(?:-|$)/.test(t.base)) glass.push(t.offset);
  if (glass.length > P.glass_containers_gt) report('SLP-34', doc, glass.sort((a, b) => a - b)[1], { message: `backdrop blur on ${glass.length} containers in one file`, value: glass.length });
}

function classTokens2(doc) {
  const { byEl, loose } = classGroups(doc);
  return [...[...byEl.values()].flat(), ...loose.flatMap((g) => g.tokens)].filter((t) => !t.variants.length || t.variants.every((v) => /^(?:sm|md|lg|xl|2xl|dark|supports-.*)$/.test(v)));
}

// Texture is legitimate on real measurement surfaces: charts, plots, maps, figures and their hatching.
const DATA_SURFACE = /chart|graph|plot|figure|diagram|\bmaps?\b|axis|axes|legend|heatmap|hatch|viz|visuali[sz]ation|sparkline|canvas/i;

function slp35(doc, ctx, report) {
  if (DATA_SURFACE.test(doc.rel.split('/').pop())) return;
  const turb = /feTurbulence/.exec(doc.text);
  if (turb) report('SLP-35', doc, turb.index, { message: 'SVG feTurbulence noise texture', value: 'feTurbulence' });
  for (const r of cssRules(doc)) {
    if (DATA_SURFACE.test(r.selector)) continue;
    for (const d of r.decls) {
      if (/repeating-(?:linear|radial)-gradient/i.test(d.value)) report('SLP-35', doc, d.offset, { message: 'repeating-gradient stripes', value: short(d.value) });
      else if (/^background(?:-image)?$/.test(d.prop)) {
        const layers = gradientArgs(d.value);
        const hair = layers.filter((g) => /\b1px\b/.test(g.args));
        const size = r.decls.find((x) => x.prop === 'background-size' && /\d+px/.test(x.value)) || /\/\s*\d+px\s+\d+px/.test(d.value);
        if (hair.length >= 2 && size) report('SLP-35', doc, d.offset, { message: 'tiled hairline gradients on a fixed cell: a blueprint grid', value: short(d.value) });
      }
    }
  }
  for (const t of classTokens2(doc)) {
    const v = arbitrary(t.base.replace(/^bg-/, '')) || '';
    if (/^bg-\[/.test(t.base) && /repeating-(?:linear|radial)-gradient/.test(v)) report('SLP-35', doc, t.offset, { message: 'repeating-gradient stripes', value: t.value });
  }
}

const PLACEHOLDER_IMG = /\b(?:via\.placeholder\.com|placehold\.(?:co|it)|placekitten\.com|picsum\.photos|dummyimage\.com|placeimg\.com|loremflickr\.com|fakeimg\.pl|placebeard\.it|source\.unsplash\.com|lorempixel\.com|placecage\.com|fillmurray\.com|placebear\.com|i\.pravatar\.cc|randomuser\.me\/api\/portraits|ui-avatars\.com)\b/i;

function slp37(doc, ctx, report) {
  const re = new RegExp(PLACEHOLDER_IMG.source, 'gi');
  let m;
  const seen = new Set();
  while ((m = re.exec(doc.text))) {
    const line = doc.lineOf(m.index);
    if (seen.has(line)) continue;
    seen.add(line);
    report('SLP-37', doc, m.index, { message: `placeholder image host ${m[0]} in shipped UI`, value: m[0] });
  }
}

function slp40(doc, ctx, report) {
  for (const el of doc.elements) {
    if (el.lower === 'meta' && /generator/i.test(String(attrValue(el, 'name') || '')) && /lovable|v0|bolt|gpt-engineer|create\.xyz|same\.dev|tempo/i.test(String(attrValue(el, 'content') || ''))) {
      report('SLP-40', doc, el.offset, { message: `generator meta tag (${attrValue(el, 'content')})`, value: String(attrValue(el, 'content')) });
    }
    if (el.lower === 'link' && /icon/i.test(String(attrValue(el, 'rel') || '')) && /\/vite\.svg$/i.test(String(attrValue(el, 'href') || ''))) {
      report('SLP-40', doc, el.offset, { message: 'the framework\'s default favicon (vite.svg)', value: 'vite.svg' });
    }
    if ((el.lower === 'img' || el.tag === 'Image') && /\/(?:next|vercel)\.svg$/i.test(String(attrValue(el, 'src') || ''))) {
      report('SLP-40', doc, el.offset, { message: `the starter template's ${attrValue(el, 'src')} image`, value: String(attrValue(el, 'src')) });
    }
  }
  for (const imp of doc.imports) if (/^lovable-tagger$/.test(imp.source)) report('SLP-40', doc, imp.offset, { message: 'generator tagger package imported', value: imp.source });
  for (const seg of copySegments(doc)) {
    if (/\b(?:edit|built|made|created)\s+with\s+(?:lovable|v0|bolt(?:\.new)?)\b/i.test(seg.text)) report('SLP-40', doc, seg.offset, { message: `built-with badge "${short(seg.text, 40)}"`, value: seg.text });
  }
}

const EFFECT_LIB = /(?:^|\/)(?:magicui|magic-ui|aceternity(?:-ui)?|react-bits|reactbits|animata|cult-ui|motion-primitives|eldoraui|indie-ui)(?:\/|$)/i;

function slp57(doc, ctx, report) {
  for (const imp of doc.imports) if (EFFECT_LIB.test(imp.source)) report('SLP-57', doc, imp.offset, { message: `effect component imported from ${imp.source}`, value: imp.source });
}

function short(s, n = 60) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

// ---- entry points --------------------------------------------------------------------------------------

export function checkFile(doc, ctx, report) {
  const on = (id) => ctx.enabled(id);
  if (on('SLP-01')) slp01(doc, ctx, report);
  if (on('SLP-02')) slp02(doc, ctx, report);
  if (on('SLP-03')) slp03(doc, ctx, report);
  if (on('SLP-04')) slp04(doc, ctx, report);
  if (on('SLP-08') || on('SLP-36')) slp08_36(doc, ctx, report);
  if (on('SLP-09')) slp09(doc, ctx, report);
  if (on('SLP-10')) slp10(doc, ctx, report);
  if (on('SLP-11')) slp11(doc, ctx, report);
  if (on('SLP-20')) slp20(doc, ctx, report);
  if (on('SLP-23')) collectRadii(doc, ctx);
  if (on('SLP-24')) slp24Collect(doc, ctx, report);
  if (on('SLP-26')) slp26(doc, ctx, report);
  if (on('SLP-31')) slp31(doc, ctx, report);
  if (on('SLP-34')) slp34(doc, ctx, report);
  if (on('SLP-35')) slp35(doc, ctx, report);
  if (on('SLP-37')) slp37(doc, ctx, report);
  if (on('SLP-40')) slp40(doc, ctx, report);
  if (on('SLP-57')) slp57(doc, ctx, report);
}

export function checkProject(docs, ctx, report) {
  if (ctx.enabled('SLP-20')) slp20Project(ctx, report);
  if (ctx.enabled('SLP-23') && !ctx.project.design.radiusDocumented) {
    const P = tellParams('SLP-23');
    const radii = ctx.state.radii || [];
    // A share needs a sample; LAY-02's minimum of 10 declarations is borrowed [calibrating].
    if (radii.length >= 10) {
      const counts = new Map();
      for (const r of radii) counts.set(r.px, (counts.get(r.px) || 0) + 1);
      const [px, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      if (px >= P.radius_min_px && n / radii.length > P.share_gt) {
        const first = radii.find((r) => r.px === px);
        report('SLP-23', first.doc, first.offset, { message: `${Math.round((n / radii.length) * 100)}% of ${radii.length} non-zero radii are ${px}px`, value: n / radii.length, problemType: 'overall_structure' });
      }
    }
  }
  if (ctx.enabled('SLP-24')) {
    const libs = ctx.state.iconLibs || new Map();
    if (libs.size > tellParams('SLP-24').mixed_packages_gt) {
      const list = [...libs.entries()];
      const second = list[1][1];
      report('SLP-24', second.doc, second.offset, { message: `${libs.size} icon libraries in one product (${list.map(([k]) => k).join(', ')})`, value: libs.size, problemType: 'multiple_locations' });
    }
  }
}
