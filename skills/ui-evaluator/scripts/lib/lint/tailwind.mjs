// Tailwind CSS utility classes mapped to the properties and values the lint rules need (v3 and v4 syntax).
// Only the families the rules read are mapped: colours, gradients, spacing, radius, border widths, transitions,
// animations, easing, transforms, shadows, outline, fonts. Unknown utilities map to null.
// Palette values: the Tailwind CSS v3.4 default palette (MIT), as hex. They feed the indigo-violet check (SLP-02) and
// the nearest-token hint of COL-01. v4-only families (mauve, olive, mist, taupe) have no entry.

export const PALETTE_FAMILIES = new Set([
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'mauve', 'olive', 'mist', 'taupe',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
]);
export const NEUTRAL_FAMILIES = new Set(['slate', 'gray', 'zinc', 'neutral', 'stone', 'mauve', 'olive', 'mist', 'taupe', 'black', 'white']);
export const SHADES = new Set(['50', '100', '150', '200', '250', '300', '350', '400', '450', '500', '550', '600', '650', '700', '750', '800', '850', '900', '950']);

const HEX = {
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
  gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712' },
  zinc: { 50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b' },
  neutral: { 50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4', 400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040', 800: '#262626', 900: '#171717', 950: '#0a0a0a' },
  stone: { 50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1', 400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c', 800: '#292524', 900: '#1c1917', 950: '#0c0a09' },
  red: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a' },
  orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407' },
  amber: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03' },
  yellow: { 50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e', 900: '#713f12', 950: '#422006' },
  lime: { 50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264', 400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f', 800: '#3f6212', 900: '#365314', 950: '#1a2e05' },
  green: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16' },
  emerald: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22' },
  teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e' },
  cyan: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63', 950: '#083344' },
  sky: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e', 950: '#082f49' },
  blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554' },
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b' },
  violet: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764' },
  fuchsia: { 50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf', 800: '#86198f', 900: '#701a75', 950: '#4a044e' },
  pink: { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843', 950: '#500724' },
  rose: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519' },
  black: { '': '#000000' },
  white: { '': '#ffffff' },
};

/** Hex value of a Tailwind default colour where the lint layer needs it, else null. */
export function paletteHex(family, shade) {
  return HEX[family]?.[shade ?? ''] || null;
}

/** Split a class token into variants (hover, md, motion-safe …) and the base utility; `!` marks important. */
export function splitClass(token) {
  const parts = [];
  let cur = '';
  let depth = 0;
  for (const ch of String(token)) {
    if (ch === '[' || ch === '(') depth += 1;
    else if ((ch === ']' || ch === ')') && depth > 0) depth -= 1;
    if (ch === ':' && depth === 0) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  let base = cur;
  let important = false;
  if (base.startsWith('!')) {
    important = true;
    base = base.slice(1);
  }
  if (base.endsWith('!')) {
    important = true;
    base = base.slice(0, -1);
  }
  return { variants: parts, base, important };
}

/** The arbitrary value inside `[...]`, with underscores read as spaces. */
export function arbitrary(s) {
  const m = String(s).match(/^\[(.*)\]$/);
  return m ? m[1].replace(/\\_/g, '\u0000').replace(/_/g, ' ').replace(/\u0000/g, '_') : null;
}

const COLOR_PREFIX = /^(bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|outline|decoration|divide|placeholder|caret|accent|fill|stroke|from|via|to|shadow|inset-shadow|inset-ring|drop-shadow)-(.+)$/;

const NON_COLOR = {
  text: /^(?:xs|sm|base|lg|[2-9]?xl|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|clip|ellipsis|\d.*|\[(?:\d|length:|calc|clamp|var\(--(?:text|font|size)).*\]|\((?:length:|--(?:text|font|size)).*\))$/,
  bg: /^(?:fixed|local|scroll|clip-.*|origin-.*|blend-.*|repeat.*|no-repeat|cover|contain|auto|center|top|bottom|left|right|left-top|left-bottom|right-top|right-bottom|gradient-to-.*|linear-.*|radial.*|conic.*|none|size-.*|position-.*|\[url\(.*|\[(?:length|size|position|image):.*\]|\[(?:\d|calc).*\])$/,
  border: /^(?:\d+|solid|dashed|dotted|double|hidden|none|collapse|separate|spacing.*|\[(?:\d|length:|calc).*\])$/,
  ring: /^(?:\d+|inset|\[(?:\d|length:).*\])$/,
  'ring-offset': /^(?:\d+|\[(?:\d|length:).*\])$/,
  outline: /^(?:none|hidden|\d+|offset-.*|dashed|dotted|double|solid|\[(?:\d|length:).*\])$/,
  decoration: /^(?:\d+|auto|from-font|solid|double|dotted|dashed|wavy|clone|slice|\[(?:\d|length:).*\])$/,
  divide: /^(?:x|y|x-.*|y-.*|reverse|solid|dashed|dotted|double|none)$/,
  fill: /^(?:none)$/,
  stroke: /^(?:\d+|none|\[(?:\d|length:).*\])$/,
  shadow: /^(?:2xs|xs|sm|md|lg|xl|2xl|inner|none|\[(?!color:).*\])$/,
  'inset-shadow': /^(?:2xs|xs|sm|none|\[(?!color:).*\])$/,
  'drop-shadow': /^(?:xs|sm|md|lg|xl|2xl|none|\[(?!color:).*\])$/,
  accent: /^(?:auto)$/,
  caret: /^$/,
  placeholder: /^(?:shown)$/,
  from: /^(?:\d+%|\[\d.*%\])$/,
  via: /^(?:\d+%|\[\d.*%\])$/,
  to: /^(?:\d+%|\[\d.*%\])$/,
};

const COLOR_KEYWORDS = new Set(['transparent', 'current', 'inherit', 'none', 'initial']);

/**
 * Colour utility classification.
 * @returns {null | {prefix:string, kind:'palette'|'keyword'|'literal'|'var'|'token', family?:string, shade?:string, value?:string}}
 */
export function colorUtility(base) {
  const m = String(base).replace(/^-/, '').match(COLOR_PREFIX);
  if (!m) return null;
  const prefix = m[1];
  let rest = m[2];
  const generic = prefix.replace(/-[xytrblse]$/, '');
  const nonColor = NON_COLOR[prefix] || NON_COLOR[generic];
  if (nonColor && nonColor.test(rest)) return null;
  // Opacity modifier.
  let alpha = null;
  const slash = rest.match(/^(.*?)\/(\d+|\[[^\]]+\]|\([^)]+\))$/);
  if (slash) {
    rest = slash[1];
    alpha = slash[2];
  }
  if (COLOR_KEYWORDS.has(rest)) return { prefix, kind: 'keyword', value: rest };
  if (rest === 'black' || rest === 'white') return { prefix, kind: 'palette', family: rest, shade: null, alpha };
  const pm = rest.match(/^([a-z]+)-(\d{2,3})$/);
  if (pm && PALETTE_FAMILIES.has(pm[1]) && SHADES.has(pm[2])) return { prefix, kind: 'palette', family: pm[1], shade: pm[2], alpha };
  const arb = arbitrary(rest);
  if (arb !== null) {
    const v = arb.replace(/^color:/, '');
    if (/^var\(|^--/.test(v) || /^theme\(/.test(v)) return { prefix, kind: 'var', value: v };
    if (/^(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\()/i.test(v)) return { prefix, kind: 'literal', value: v };
    return null;
  }
  if (/^\(.+\)$/.test(rest)) return { prefix, kind: 'var', value: rest.slice(1, -1).replace(/^color:/, '') };
  if (/^[a-z][a-z0-9-]*$/.test(rest)) return { prefix, kind: 'token', value: rest };
  return null;
}

/** Tailwind gradient background utilities (bg-gradient-to-*, v4 bg-linear-*, radial, conic, arbitrary gradients). */
export function isGradientUtility(base) {
  return /^bg-(?:gradient-to-|linear-|radial|conic)/.test(base) || /^bg-\[(?:repeating-)?(?:linear|radial|conic)-gradient/.test(base) || /^bg-\[image:(?:repeating-)?(?:linear|radial|conic)-gradient/.test(base);
}

const SPACING_PREFIX = /^-?(space-x|space-y|gap-x|gap-y|gap|px|py|pt|pr|pb|pl|ps|pe|p|mx|my|mt|mr|mb|ml|ms|me|m)-(.+)$/;

/**
 * Spacing utility: { prefix, px } for literal steps, { prefix, token:true } for theme or var references,
 * { prefix, skip:true } for 0, auto, percentages and viewport units (not counted by LAY-01), null otherwise.
 */
export function spacingUtility(base, rootPx = 16) {
  const m = String(base).match(SPACING_PREFIX);
  if (!m) return null;
  const prefix = m[1];
  const v = m[2];
  if (v === 'auto' || v === '0' || v === 'reverse') return { prefix, skip: true };
  if (v === 'px') return { prefix, px: 1 };
  if (/^\d+(?:\.\d+)?$/.test(v)) return { prefix, px: Number(v) * 4, step: v };
  if (/^\d+\/\d+$/.test(v) || v === 'full' || v === 'screen') return { prefix, skip: true };
  const arb = arbitrary(v);
  if (arb !== null) {
    const a = arb.trim();
    if (/^var\(|^calc\(|^theme\(|^--|^env\(|^clamp\(|^min\(|^max\(/.test(a)) return { prefix, token: true, value: a };
    const lm = a.match(/^(-?\d*\.?\d+)(px|rem)?$/);
    if (lm) return { prefix, px: lm[2] === 'rem' ? Number(lm[1]) * rootPx : Number(lm[1]), value: a, arbitrary: true };
    return { prefix, skip: true, value: a };
  }
  if (/^\(.+\)$/.test(v)) return { prefix, token: true, value: v };
  if (/^[a-z][a-z0-9-]*$/.test(v)) return { prefix, token: true, value: v };
  return null;
}

const RADIUS_PX = { none: 0, xs: 2, sm: 2, '': 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, '4xl': 32, full: 9999 };

/** Radius utility: { px } (9999 for full), { token:true }, or null. */
export function radiusUtility(base) {
  const m = String(base).match(/^rounded(?:-(?:t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?(?:-(.+))?$/);
  if (!m) return null;
  const v = m[1] ?? '';
  if (v in RADIUS_PX) return { px: RADIUS_PX[v], full: v === 'full' };
  const arb = arbitrary(v);
  if (arb !== null) {
    const lm = arb.match(/^(\d*\.?\d+)(px|rem)$/);
    if (lm) return { px: lm[2] === 'rem' ? Number(lm[1]) * 16 : Number(lm[1]) };
    if (/^50%$|^9999px$/.test(arb)) return { px: 9999, full: true };
    return { token: true };
  }
  return { token: true };
}

/** Border width utility: { side: 'all'|'x'|'y'|'t'|'r'|'b'|'l'|'s'|'e', px } or null (colours return null). */
export function borderWidthUtility(base) {
  const m = String(base).match(/^border(?:-([xytrblse]))?(?:-(\d+|\[[^\]]+\]))?$/);
  if (!m) return null;
  const side = m[1] || 'all';
  if (m[2] === undefined) return { side, px: 1 };
  if (/^\d+$/.test(m[2])) return { side, px: Number(m[2]) };
  const arb = arbitrary(m[2]);
  const lm = arb && arb.match(/^(\d*\.?\d+)(px|rem)$/);
  if (lm) return { side, px: lm[2] === 'rem' ? Number(lm[1]) * 16 : Number(lm[1]) };
  return null;
}

const TRANSITION_DEFAULT = ['color', 'background-color', 'border-color', 'outline-color', 'text-decoration-color', 'fill', 'stroke', 'opacity', 'box-shadow', 'transform', 'translate', 'scale', 'rotate', 'filter', 'backdrop-filter'];

/** Transition utility → properties it animates, or null. */
export function transitionUtility(base) {
  const b = String(base);
  if (b === 'transition') return { props: TRANSITION_DEFAULT, kind: 'default' };
  if (b === 'transition-all') return { props: ['all'], kind: 'all' };
  if (b === 'transition-colors') return { props: ['color', 'background-color', 'border-color', 'text-decoration-color', 'fill', 'stroke'], kind: 'colors' };
  if (b === 'transition-opacity') return { props: ['opacity'], kind: 'opacity' };
  if (b === 'transition-shadow') return { props: ['box-shadow'], kind: 'shadow' };
  if (b === 'transition-transform') return { props: ['transform', 'translate', 'scale', 'rotate'], kind: 'transform' };
  if (b === 'transition-none') return { props: [], kind: 'none' };
  const m = b.match(/^transition-(\[.+\]|\(.+\))$/);
  if (m) {
    const v = (arbitrary(m[1]) ?? m[1].slice(1, -1)).replace(/^property:/, '');
    return { props: v.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean), kind: 'arbitrary' };
  }
  return null;
}

/** animate-* utility → { name } (custom names and arbitrary values included), or null. */
export function animateUtility(base) {
  const m = String(base).match(/^animate-(.+)$/);
  if (!m) return null;
  const arb = arbitrary(m[1]);
  if (arb !== null) {
    const name = arb.split(/\s+/).find((w) => !/^\d|^(?:ease|linear|infinite|both|forwards|backwards|alternate|normal|reverse)/.test(w));
    return { name: name || arb, arbitrary: true, value: arb };
  }
  return { name: m[1] };
}

/** ease-[cubic-bezier(...)] → [x1,y1,x2,y2], or null. */
export function easeBezier(base) {
  const m = String(base).match(/^ease-\[cubic-bezier\(([^)]*)\)\]$/);
  if (!m) return null;
  const n = m[1].split(/[,_\s]+/).filter(Boolean).map(Number);
  return n.length === 4 && n.every(Number.isFinite) ? n : null;
}

/** Transform utility family: 'translate' | 'scale' | 'rotate' | 'skew' | null, with the raw value. */
export function transformUtility(base) {
  const m = String(base).replace(/^-/, '').match(/^(translate|scale|rotate|skew)(?:-([xyz]))?-(.+)$/);
  if (!m) return null;
  return { kind: m[1], axis: m[2] || null, value: m[3] };
}

/** font-sans / font-serif / font-mono / font-[...] / font-(family:--x) → family reference, or null for weights. */
export function fontFamilyUtility(base) {
  const m = String(base).match(/^font-(.+)$/);
  if (!m) return null;
  const v = m[1];
  if (/^(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\d+|\[\d+\]|stretch-.*|features-.*|variation-.*)$/.test(v)) return null;
  const arb = arbitrary(v);
  if (arb !== null) {
    if (/^\d+$/.test(arb) || /^(?:weight|number):/.test(arb)) return null;
    return { family: arb.replace(/^family-name:/, ''), arbitrary: true };
  }
  if (/^\(.+\)$/.test(v)) return { token: v.slice(1, -1).replace(/^family-name:/, '') };
  return { token: v };
}

/** Width/height/size utility in px (n × 4), or null. */
export function sizePx(base) {
  const m = String(base).match(/^(?:w|h|size|min-w|min-h)-(.+)$/);
  if (!m) return null;
  if (m[1] === 'px') return 1;
  if (/^\d+(?:\.\d+)?$/.test(m[1])) return Number(m[1]) * 4;
  const arb = arbitrary(m[1]);
  const lm = arb && arb.match(/^(\d*\.?\d+)(px|rem)$/);
  if (lm) return lm[2] === 'rem' ? Number(lm[1]) * 16 : Number(lm[1]);
  return null;
}

/** True for variants that mean a state the user triggers or a conditional style (hover:, data-[…]:, aria-…:). */
export function isStateVariant(v) {
  return /^(?:hover|focus|focus-visible|focus-within|active|visited|target|checked|selected|disabled|open|enabled|group-[\w-]+(?:\/[\w-]+)?|peer-[\w-]+(?:\/[\w-]+)?|data-.+|aria-.+|has-.+|in-.+|not-.+|group-.+|peer-.+|\[.+\])$/.test(v);
}

export function hasVariant(variants, re) {
  return variants.some((v) => re.test(v));
}
