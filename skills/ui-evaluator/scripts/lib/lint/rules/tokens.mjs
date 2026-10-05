// Token conformance rules (QUALITY-BAR G3).
// COL-01 ≥ 90% of colour declarations in component code reference tokens or variables; raw palette utilities and
//        literal values outside token files are drift unless listed in DESIGN.md exceptions [calibrating].
// LAY-01 ≥ 90% of margin, padding and gap values on the declared scale (default 0, 2 px or a multiple of 4 px; the
//        DESIGN.md or DTCG spacing scale when declared) [calibrating]. Zero, auto, percentages and viewport units are
//        not counted.
// TYP-05 ≤ 2 families per script (Latin and CJK counted separately; fallbacks not counted) plus an optional monospace,
//        unless DESIGN.md declares more with a reason.
// COL-01 and LAY-01 are shares: individual literals are reported only when the share over the scanned files is below
// 90%, because a few documented literals are allowed. Declared tokens come from DESIGN.md, W3C design-token (DTCG)
// files [TOOL-28] and CSS custom properties; each drift hit names the nearest declared token [LOOP-005].
import { colorsIn, splitWords, splitTopLevel, parseLength, lengthPx } from '../css.mjs';
import { colorUtility, spacingUtility, fontFamilyUtility, paletteHex } from '../tailwind.mjs';
import { cssRules, classGroups } from '../model.mjs';
import { matchBracket } from '../handlers.mjs';
import { normaliseFamily } from '../data.mjs';
import { parseColor, deltaEOK, toHex } from '../../util/color.mjs';

export const RULES = [
  { id: 'COL-01', level: 'gate', fast: true, title: 'Token conformance', fix: 'Replace each literal with the colour role token it stands for; add a token when one intent repeats three or more times.' },
  { id: 'LAY-01', level: 'gate', fast: true, title: 'Spacing scale conformance', fix: 'Snap the value to the nearest step of the declared scale in the shared component or layout primitive, or add the step to the scale.' },
  { id: 'TYP-05', level: 'gate', title: 'Type families', fix: 'Map stray families to the role tokens (make library fonts inherit), or declare the extra family in DESIGN.md with a reason.' },
];

export const SHARE_MIN = 0.9; // QUALITY-BAR COL-01 and LAY-01: ≥ 90%
// LOOP-005 hint bands (ΔE OK): at most 0.02 the literal is the token's value; up to 0.06 it is a near copy.
export const EQUALS_DE = 0.02;
export const NEAR_DE = 0.06;

const COLOR_PROP = /^(?:color|background|background-color|background-image|border|border-color|border-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?(?:-color)?|outline|outline-color|fill|stroke|box-shadow|text-shadow|caret-color|accent-color|text-decoration|text-decoration-color|column-rule|column-rule-color|stop-color|flood-color|lighting-color|scrollbar-color|-webkit-text-fill-color|-webkit-text-stroke|-webkit-text-stroke-color|text-emphasis-color)$/;
const TOKEN_FILE = /(?:^|\/)(?:[\w-]*[-_.])?(?:tokens?|theme|themes|palette|colou?rs?|variables|vars|design-tokens)(?:[-_.][\w-]*)?\.(?:css|scss|less|js|ts|mjs|cjs|json)$|tailwind\.config\.[cm]?[jt]s$/i;
const TOKEN_LAYER_SELECTOR = /^(?::root|html|@theme|:host|\[data-(?:theme|mode|color-scheme)[^\]]*\]|\.(?:dark|light)|html\.(?:dark|light)|html\[data-[^\]]+\])(?:\s*,\s*(?::root|html|@theme|:host|\[data-(?:theme|mode|color-scheme)[^\]]*\]|\.(?:dark|light)))*$/;
const SPACING_PROP = /^(?:margin|padding)(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?$|^(?:gap|row-gap|column-gap|grid-gap|grid-row-gap|grid-column-gap)$/;
const SPACING_VAR = /^--(?:space|spacing|spacer|gap|gutter|inset|stack|padding|margin)(?:[-_]|$)/i;

export function isTokenFile(rel) {
  return TOKEN_FILE.test(rel);
}

function short(s, n = 60) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

// ---- declared tokens and nearest-token hints (LOOP-005) ---------------------------------------------------

const HSL_CHANNELS = /^(-?\d+(?:\.\d+)?)(?:deg)?\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%(?:\s*\/\s*([\d.]+%?))?$/;

/** A colour from a token value: a CSS colour, or shadcn-style bare HSL channels ("161 41% 31%"). */
export function tokenColor(value) {
  const v = String(value ?? '').trim();
  const c = parseColor(v);
  if (c) return c;
  const m = v.match(HSL_CHANNELS);
  return m ? parseColor(`hsl(${m[1]} ${m[2]}% ${m[3]}%${m[4] ? ` / ${m[4]}` : ''})`) : null;
}

/** Declared colour tokens: DESIGN.md, DTCG files, then CSS custom properties whose value is one colour. */
export function colourTokens(ctx) {
  if (ctx.state._colourTokens) return ctx.state._colourTokens;
  const out = [...(ctx.project.tokens?.colors || [])];
  for (const [name, value] of ctx.state.customProps || []) {
    if (!String(name).startsWith('--')) continue;
    const c = tokenColor(value);
    if (c) out.push({ name, color: c, css: String(value), source: 'css' });
  }
  ctx.state._colourTokens = out;
  return out;
}

/** The declared colour token closest to `color` by ΔE OK, when within NEAR_DE: { name, value, delta_e, relation }. */
export function nearestColourToken(tokens, color) {
  let best = null;
  for (const t of tokens) {
    if (Math.abs((t.color.alpha ?? 1) - (color.alpha ?? 1)) > 0.05) continue;
    const d = deltaEOK(t.color, color);
    if (!best || d < best.d - 1e-9) best = { t, d };
  }
  if (!best || best.d > NEAR_DE) return null;
  return { name: best.t.name, value: toHex(best.t.color), delta_e: Math.round(best.d * 1000) / 1000, relation: best.d <= EQUALS_DE ? 'equals' : 'near', source: best.t.source };
}

export function colourHint(n) {
  return n.relation === 'equals' ? `equals ${n.name} (${n.value}): use the token` : `near ${n.name} (ΔE ${n.delta_e.toFixed(2)}): use the token or add a role`;
}

/** Spacing steps to suggest: the declared scale tokens; with no declared scale, spacing custom properties on the default scale. */
function spacingTokens(ctx) {
  if (ctx.state._spacingTokens) return ctx.state._spacingTokens;
  let out = [...(ctx.project.tokens?.spacing || [])];
  if (!out.length) {
    const rootPx = ctx.state.rootPx || 16;
    for (const [name, value] of ctx.state.customProps || []) {
      if (!SPACING_VAR.test(name)) continue;
      const px = lengthPx(String(value).trim(), rootPx);
      if (px !== null && px > 0 && onDefaultScale(px)) out.push({ name, px, source: 'css' });
    }
  }
  out = out.filter((t) => t.px > 0);
  ctx.state._spacingTokens = out;
  return out;
}

/** The nearest scale step for an off-scale value: a named token when one exists, else the default 4 px grid step. */
export function nearestSpacing(tokens, px, { declared = false } = {}) {
  const v = Math.abs(px);
  if (tokens.length) {
    let best = null;
    for (const t of tokens) {
      const d = Math.abs(t.px - v);
      if (!best || d < best.d || (d === best.d && t.px < best.t.px)) best = { t, d };
    }
    return { name: best.t.name, value: `${+best.t.px.toFixed(2)}px`, delta_px: +(best.t.px - v).toFixed(2), relation: 'nearest', source: best.t.source };
  }
  if (declared) return null;
  const step = v < 3 ? 2 : Math.max(4, Math.round(v / 4) * 4);
  return { name: null, value: `${step}px`, delta_px: +(step - v).toFixed(2), relation: 'nearest step', source: 'default scale' };
}

function spacingHint(n) {
  return n.name ? `nearest ${n.name} (${n.value})` : `nearest step ${n.value}`;
}

/** Normalised segments of a token name: "{color.teal.700}" → ['color', 'teal', '700']. */
function segments(name) {
  return String(name).replace(/[{}]/g, '').replace(/^--/, '').toLowerCase().split(/[.\-_/]+/).filter(Boolean);
}

/** Colour families the project defines itself: tailwind.config `colors` keys, @theme `--color-<family>-*` properties, token paths. */
function projectFamilies(ctx) {
  const fams = ctx.state.col01Families || new Set();
  for (const [name] of ctx.state.customProps || []) {
    const m = String(name).match(/^--colou?r-([a-z]+)(?:-\d{2,3})?$/i);
    if (m) fams.add(m[1].toLowerCase());
  }
  return fams;
}

/** A palette utility is generated from the declared token set when a token names its family and shade. */
function declaredPaletteToken(ctx, family, shade) {
  if (projectFamilies(ctx).has(family)) return true;
  for (const t of ctx.project.tokens?.colors || []) {
    const s = segments(t.name);
    const i = s.lastIndexOf(family);
    if (i >= 0 && (shade === null ? i === s.length - 1 : s[i + 1] === shade)) return true;
  }
  return false;
}

/** Top-level keys of the object literal at `open` (the `{`). */
function objectKeys(code, open) {
  const close = matchBracket(code, open);
  const end = close > 0 ? close - 1 : code.length;
  const keys = [];
  let depth = 0;
  for (let i = open + 1; i < end; i += 1) {
    const c = code[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      const start = i;
      i += 1;
      while (i < end && code[i] !== q) i += code[i] === '\\' ? 2 : 1;
      if (depth === 0 && /^\s*:/.test(code.slice(i + 1, i + 40))) keys.push(code.slice(start + 1, i));
      continue;
    }
    if (c === '{' || c === '[' || c === '(') depth += 1;
    else if (c === '}' || c === ']' || c === ')') depth -= 1;
    else if (depth === 0 && /[A-Za-z_$]/.test(c) && /[\s{,]/.test(code[i - 1])) {
      const m = /^([A-Za-z_$][\w$-]*)\s*:/.exec(code.slice(i, i + 60));
      if (m) {
        keys.push(m[1]);
        i += m[1].length - 1;
      }
    }
  }
  return keys;
}

// ---- COL-01 ----------------------------------------------------------------------------------------------

function collectConfigFamilies(doc, ctx) {
  if (!/tailwind\.config/.test(doc.rel)) return;
  const fams = (ctx.state.col01Families = ctx.state.col01Families || new Set());
  const re = /\bcolors\s*:\s*\{/g;
  let m;
  while ((m = re.exec(doc.code))) for (const k of objectKeys(doc.code, m.index + m[0].length - 1)) fams.add(k.toLowerCase());
}

function col01Collect(doc, ctx) {
  if (isTokenFile(doc.rel)) {
    collectConfigFamilies(doc, ctx);
    return;
  }
  const st = (ctx.state.col01 = ctx.state.col01 || { total: 0, conform: 0, drift: [] });
  const exc = ctx.project.design.exceptions.get('COL-01');
  const excepted = (text) => !!exc && exc.values.has(String(text).toLowerCase());
  for (const r of cssRules(doc)) {
    if (TOKEN_LAYER_SELECTOR.test(r.selector.trim()) || r.selector === '@font-face') continue;
    for (const d of r.decls) {
      if (!COLOR_PROP.test(d.prop)) continue;
      const lits = colorsIn(d.value).filter((c) => !excepted(c.text));
      const refs = /var\(|\$[\w-]|@[\w-]|theme\(/.test(d.value);
      if (!lits.length && !refs) continue;
      st.total += 1;
      if (lits.length) st.drift.push({ doc, offset: d.offset, message: `literal ${lits.map((c) => c.text).join(', ')} in ${d.prop}`, value: `${d.prop}: ${short(d.value)}`, colors: lits.map((c) => c.color) });
      else st.conform += 1;
    }
  }
  const visit = (tokens) => {
    for (const t of tokens) {
      const c = colorUtility(t.base);
      if (!c || c.kind === 'keyword') continue;
      st.total += 1;
      const exempt = excepted(t.value) || excepted(t.base) || (c.kind === 'literal' && excepted(c.value));
      if (c.kind === 'palette' && !exempt) {
        let color = parseColor(paletteHex(c.family, c.shade) || '');
        if (color && c.alpha && /^\d+$/.test(c.alpha)) color = { ...color, alpha: Number(c.alpha) / 100 };
        st.drift.push({ doc, offset: t.offset, message: `raw palette utility ${t.value}`, value: t.value, colors: color ? [color] : [], family: c.family, shade: c.shade });
      } else if (c.kind === 'literal' && !exempt) {
        const color = parseColor(c.value);
        st.drift.push({ doc, offset: t.offset, message: `literal colour ${t.value}`, value: t.value, colors: color ? [color] : [] });
      } else st.conform += 1;
    }
  };
  const { byEl, loose } = classGroups(doc);
  for (const toks of byEl.values()) visit(toks);
  for (const g of loose) visit(g.tokens);
}

// ---- LAY-01 ----------------------------------------------------------------------------------------------

export function onDefaultScale(px) {
  const v = Math.abs(px);
  return v === 0 || Math.abs(v - 2) < 0.01 || Math.abs(v / 4 - Math.round(v / 4)) < 0.001;
}

function lay01Collect(doc, ctx) {
  if (isTokenFile(doc.rel)) return;
  const st = (ctx.state.lay01 = ctx.state.lay01 || { total: 0, conform: 0, drift: [] });
  const scale = ctx.project.tokens?.spacingScalePx ?? ctx.project.design.spacingScalePx ?? null;
  const exc = ctx.project.design.exceptions.get('LAY-01');
  const rootPx = ctx.state.rootPx || 16;
  const onScale = (px) => (scale ? [...scale].some((s) => Math.abs(s - Math.abs(px)) < 0.01) : onDefaultScale(px));
  const scaleText = scale ? `the declared scale (${[...scale].sort((a, b) => a - b).join(', ')} px)` : 'the default scale (0, 2 px, multiples of 4 px)';
  for (const r of cssRules(doc)) {
    if (TOKEN_LAYER_SELECTOR.test(r.selector.trim())) continue;
    for (const d of r.decls) {
      if (!SPACING_PROP.test(d.prop)) continue;
      for (const w of splitWords(d.value)) {
        if (/^(?:var|calc|clamp|min|max|env|theme)\(|^\$|^@/.test(w)) {
          if (/^var\(|^\$|^@|^theme\(/.test(w)) {
            st.total += 1;
            st.conform += 1;
          }
          continue;
        }
        const l = parseLength(w);
        if (!l || l.n === 0) continue;
        let px = null;
        if (l.unit === 'px') px = l.n;
        else if (l.unit === 'rem') px = l.n * rootPx;
        else continue; // %, viewport units, em: layout decisions or relative, not counted
        st.total += 1;
        if (onScale(px) || (exc && exc.values.has(w.toLowerCase()))) st.conform += 1;
        else st.drift.push({ doc, offset: d.offset, message: `${d.prop}: ${w} (${+px.toFixed(2)} px) is off ${scaleText}`, value: `${d.prop}: ${d.value}`, px, declared: !!scale });
      }
    }
  }
  const visit = (tokens) => {
    for (const t of tokens) {
      const s = spacingUtility(t.base, rootPx);
      if (!s || s.skip) continue;
      st.total += 1;
      if (s.token) {
        st.conform += 1;
        continue;
      }
      if (onScale(s.px) || (exc && (exc.values.has(t.value.toLowerCase()) || exc.values.has(t.base.toLowerCase())))) st.conform += 1;
      else st.drift.push({ doc, offset: t.offset, message: `${t.value} (${+s.px.toFixed(2)} px) is off ${scaleText}`, value: t.value, px: s.px, declared: !!scale });
    }
  };
  const { byEl, loose } = classGroups(doc);
  for (const toks of byEl.values()) visit(toks);
  for (const g of loose) visit(g.tokens);
}

// ---- TYP-05 ----------------------------------------------------------------------------------------------

const GENERIC = /^(?:serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|math|emoji|fangsong|inherit|initial|unset|revert|-apple-system|blinkmacsystemfont|apple color emoji|segoe ui emoji|segoe ui symbol|noto color emoji|android emoji|twemoji mozilla)$/i;
const SYSTEM_FIRST = /^(?:system-ui|-apple-system|blinkmacsystemfont|ui-sans-serif|ui-serif)$/i;
export const CJK_FAMILY = /pingfang|hiragino|microsoft ?yahei|microsoft ?jhenghei|simsun|simhei|nsimsun|songti|heiti|kaiti|fangsong|stheiti|stsong|stkaiti|stxihei|stfangsong|noto (?:sans|serif) (?:cjk|sc|tc|hk|jp|kr)|noto sans mono cjk|source han|思源|微软雅黑|苹方|宋体|黑体|yu gothic|yu mincho|meiryo|ms gothic|ms mincho|malgun|apple sd gothic|nanum|harmonyos sans (?:sc|tc)|misans|lxgw|wenkai|wenquanyi|sarasa|droid sans fallback|biz ud|ipa(?:ex)?gothic|ipamincho|m plus|zen (?:kaku|maru)|kosugi|sawarabi|spoqa|pretendard|gothic a1|alibaba[- ]?puhuiti|puhuiti|oppo ?sans|smiley ?sans|dingtalk|zcool|ma shan zheng|zhi mang xing|long cang|liu jian mao cao|han ?(?:serif|sans)|hanyi|\bfz[a-z]{4,}|lantinghei|huawen|tencent sans|honor sans|vivo sans/i;
const MONO = /mono|code|consolas|menlo|courier|monaco|jetbrains|fira code|cascadia|sf mono|inconsolata|hack\b|iosevka/i;

export function isCjkFamily(name) {
  return CJK_FAMILY.test(name) || /[぀-ヿ㐀-鿿가-힯]/.test(name);
}

/** Primary families of a stack: { latin, cjk, mono } (fallbacks are not counted). */
export function stackPrimaries(value) {
  const parts = splitTopLevel(value, ',').map((p) => p.replace(/["']/g, '').trim()).filter(Boolean);
  if (!parts.length || /^var\(/.test(parts[0])) return { latin: null, cjk: null, mono: null };
  const genericMono = parts.some((p) => /^(?:monospace|ui-monospace)$/i.test(p));
  if (SYSTEM_FIRST.test(parts[0])) return { latin: 'system-ui', cjk: parts.find((p) => isCjkFamily(p)) || null, mono: null };
  const named = parts.filter((p) => !GENERIC.test(p) && !/^var\(/.test(p));
  const latin = named.find((p) => !isCjkFamily(p)) || null;
  const cjk = named.find((p) => isCjkFamily(p)) || null;
  if (latin && (genericMono || MONO.test(latin))) return { latin: null, cjk, mono: latin };
  return { latin, cjk, mono: null };
}

// Icon fonts are glyph sets, not type families.
const ICON_FONT = /icon|symbols?\b|material (?:symbols|icons)|font ?awesome|glyph|codicon|remixicon|ionicons|feather|dashicons|fontello|icomoon|bootstrap-icons|lucide/i;

/** One key per family: quotes, case, a next/font hash and variable-font suffixes ignored ("Inter Variable" = "Inter"). */
export function familyKey(name) {
  return normaliseFamily(String(name).replace(/["']/g, '').replace(/([a-z])(?:Variable|VF)\b/g, '$1').replace(/\b(?:VF|var)\b/g, ''));
}

function typ05State(ctx) {
  ctx.state.typ05 = ctx.state.typ05 || { latin: new Map(), cjk: new Map(), mono: new Map() };
  return ctx.state.typ05;
}

function addFamily(st, kind, name, at) {
  if (!name || ICON_FONT.test(name)) return;
  const key = familyKey(name) || name.toLowerCase();
  if (!st[kind].has(key)) st[kind].set(key, { name, ...at });
}

function typ05Collect(doc, ctx) {
  const st = typ05State(ctx);
  const addStack = (value, offset) => {
    const p = stackPrimaries(value);
    addFamily(st, 'latin', p.latin, { doc, offset });
    addFamily(st, 'cjk', p.cjk, { doc, offset });
    addFamily(st, 'mono', p.mono, { doc, offset });
  };
  for (const r of cssRules(doc)) {
    if (r.selector === '@font-face') continue;
    for (const d of r.decls) {
      if (d.prop === 'font-family') addStack(d.value, d.offset);
      else if (d.prop === 'font') {
        const m = d.value.match(/(?:^|\s)(?:[\d.]+(?:px|rem|em|%|pt|vw|vh)|small|medium|large|x-large|xx-large)(?:\s*\/\s*[\w.%-]+)?\s+(.+)$/i);
        if (m) addStack(m[1], d.offset);
      } else if (/^--(?:font|font-family)-[\w-]+$|^--default-(?:mono-)?font-family$/.test(d.prop) && !/^--font-(?:weight|size|feature|variation)/.test(d.prop)) addStack(d.value, d.offset);
    }
  }
  for (const imp of doc.imports) {
    if (!/^next\/font\/google$/.test(imp.source)) continue;
    for (const n of imp.names) {
      const name = n.replace(/_/g, ' ');
      if (MONO.test(name)) addFamily(st, 'mono', name, { doc, offset: imp.offset });
      else if (isCjkFamily(name)) addFamily(st, 'cjk', name, { doc, offset: imp.offset });
      else addFamily(st, 'latin', name, { doc, offset: imp.offset });
    }
  }
  for (const [, toks] of classGroups(doc).byEl) {
    for (const t of toks) {
      const f = fontFamilyUtility(t.base);
      if (f && f.arbitrary) addStack(f.family, t.offset);
    }
  }
  // Tailwind v3 config: fontFamily: { sans: ['Inter', …], display: 'Fraunces, serif' }.
  if (/tailwind\.config/.test(doc.rel)) {
    const code = doc.code;
    const m = /fontFamily\s*:\s*\{/.exec(code);
    if (m) {
      const open = m.index + m[0].length - 1;
      const close = matchBracket(code, open);
      const body = code.slice(open, close > 0 ? close : code.length);
      const re = /(['"]?)([\w-]+)\1\s*:\s*(?:\[\s*(['"`])([^'"`]+)\3|(['"`])([^'"`]+)\5)/g;
      let e;
      while ((e = re.exec(body))) addStack(e[4] || e[6], open + e.index);
    }
  }
}

/** Families declared as tokens (DESIGN.md typography, DTCG fontFamily) are families of the system: count them too. */
function addTokenFamilies(ctx) {
  const st = typ05State(ctx);
  for (const t of ctx.project.tokens?.families || []) {
    const p = stackPrimaries(t.stack || t.family);
    const at = { doc: { rel: t.source === 'DESIGN.md' ? 'DESIGN.md' : t.source, pos: () => ({ line: null, col: null }) }, offset: null, token: t.name };
    addFamily(st, 'latin', p.latin, at);
    addFamily(st, 'cjk', p.cjk, at);
    addFamily(st, 'mono', p.mono, at);
  }
}

// ---- entry points --------------------------------------------------------------------------------------

export function checkFile(doc, ctx) {
  if (ctx.enabled('COL-01')) col01Collect(doc, ctx);
  if (ctx.enabled('LAY-01')) lay01Collect(doc, ctx);
  if (ctx.enabled('TYP-05')) typ05Collect(doc, ctx);
}

export function checkProject(docs, ctx, report) {
  for (const id of ['COL-01', 'LAY-01']) {
    if (!ctx.enabled(id)) continue;
    const st = ctx.state[id === 'COL-01' ? 'col01' : 'lay01'];
    if (!st || !st.total) continue;
    // Palette utilities whose family the project defines itself (tailwind.config colours, @theme, token files) are
    // utilities generated from the declared token set: they conform.
    if (id === 'COL-01') {
      const own = st.drift.filter((d) => d.family && declaredPaletteToken(ctx, d.family, d.shade));
      if (own.length) {
        st.drift = st.drift.filter((d) => !own.includes(d));
        st.conform += own.length;
      }
    }
    const share = st.conform / st.total;
    ctx.metrics[id] = { share: Math.round(share * 1000) / 1000, conforming: st.conform, total: st.total, threshold: SHARE_MIN };
    if (share >= SHARE_MIN) continue;
    const what = id === 'COL-01' ? 'colour declarations reference tokens or variables' : 'spacing values are on the scale';
    const summary = `${st.conform} of ${st.total} ${what} (${Math.round(share * 100)}% < 90%)`;
    const colours = id === 'COL-01' ? colourTokens(ctx) : null;
    const steps = id === 'LAY-01' ? spacingTokens(ctx) : null;
    for (const d of st.drift) {
      let nearest = null;
      let hint = '';
      if (id === 'COL-01') {
        for (const c of d.colors || []) {
          nearest = nearestColourToken(colours, c);
          if (nearest) break;
        }
        if (nearest) hint = `: ${colourHint(nearest)}`;
      } else {
        nearest = nearestSpacing(steps, d.px, { declared: d.declared });
        if (nearest) hint = `; ${spacingHint(nearest)}`;
      }
      report(id, d.doc, d.offset, { message: `${d.message}${hint}`, value: d.value, detail: summary, nearest });
    }
  }
  if (ctx.enabled('TYP-05')) {
    if (!ctx.state.typ05 && !(ctx.project.tokens?.families || []).length) return;
    addTokenFamilies(ctx);
    const st = ctx.state.typ05;
    const exc = ctx.project.design.exceptions.get('TYP-05');
    // A family DESIGN.md declares with a reason (declared_exceptions, TYP-05) is not counted; a criterion-wide
    // declaration switches the count off.
    const declared = (f) => !!exc && [...exc.values].some((v) => familyKey(v) === familyKey(f.name));
    const latin = [...st.latin.values()].filter((f) => !declared(f));
    const monos = [...st.mono.values()].filter((f) => !declared(f));
    // One monospace is allowed for code or data; further monospace faces count as text faces.
    const latinAll = [...latin, ...monos.slice(1)];
    ctx.metrics['TYP-05'] = { latin: latinAll.map((f) => f.name), cjk: [...st.cjk.values()].map((f) => f.name), mono: monos.slice(0, 1).map((f) => f.name) };
    if (exc && exc.criterionWide) return;
    const tokenKeys = new Set((ctx.project.tokens?.families || []).map((t) => familyKey(stackPrimaries(t.stack || t.family).latin || stackPrimaries(t.stack || t.family).cjk || t.family)));
    const stray = (list) => (tokenKeys.size ? list.filter((f) => !f.token && !tokenKeys.has(familyKey(f.name))) : []);
    // Report at the first family not in the declared tokens; with no tokens, at the family that goes over the limit.
    const where = (list) => (tokenKeys.size && list.find((f) => !f.token && !tokenKeys.has(familyKey(f.name)))) || (list[2].token ? list.find((f) => !f.token) || list[2] : list[2]);
    if (latinAll.length > 2) {
      const at = where(latinAll);
      const s = stray(latinAll);
      report('TYP-05', at.doc, at.offset, { message: `${latinAll.length} Latin families (${latinAll.map((f) => f.name).join(', ')}); the limit is 2 plus one monospace${s.length ? `; not in the declared tokens: ${s.map((f) => f.name).join(', ')}` : ''}`, value: latinAll.length, problemType: 'overall_structure' });
    }
    const cjk = [...st.cjk.values()].filter((f) => !declared(f));
    if (cjk.length > 2) {
      const at = where(cjk);
      const s = stray(cjk);
      report('TYP-05', at.doc, at.offset, { message: `${cjk.length} CJK families (${cjk.map((f) => f.name).join(', ')}); the limit is 2${s.length ? `; not in the declared tokens: ${s.map((f) => f.name).join(', ')}` : ''}`, value: cjk.length, problemType: 'overall_structure' });
    }
  }
}
