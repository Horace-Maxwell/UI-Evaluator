// Dependency-free colour parsing and maths used by the lint layer and gate logic.
// Formulas follow CSS Color 4 sample code and WCAG 2.2 (relative luminance with the 0.04045 threshold).
// The browser layer uses colorjs.io; tests check that both agree.

const NAMED = Object.fromEntries(
  ('aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc bisque ffe4c4 black 000000 ' +
    'blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 ' +
    'chocolate d2691e coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc crimson dc143c cyan 00ffff darkblue 00008b ' +
    'darkcyan 008b8b darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 darkkhaki bdb76b darkmagenta 8b008b ' +
    'darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 darksalmon e9967a darkseagreen 8fbc8f ' +
    'darkslateblue 483d8b darkslategray 2f4f4f darkslategrey 2f4f4f darkturquoise 00ced1 darkviolet 9400d3 deeppink ff1493 ' +
    'deepskyblue 00bfff dimgray 696969 dimgrey 696969 dodgerblue 1e90ff firebrick b22222 floralwhite fffaf0 forestgreen 228b22 ' +
    'fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff gold ffd700 goldenrod daa520 gray 808080 green 008000 greenyellow adff2f ' +
    'grey 808080 honeydew f0fff0 hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa ' +
    'lavenderblush fff0f5 lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 lightcyan e0ffff ' +
    'lightgoldenrodyellow fafad2 lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 lightsalmon ffa07a ' +
    'lightseagreen 20b2aa lightskyblue 87cefa lightslategray 778899 lightslategrey 778899 lightsteelblue b0c4de lightyellow ffffe0 ' +
    'lime 00ff00 limegreen 32cd32 linen faf0e6 magenta ff00ff maroon 800000 mediumaquamarine 66cdaa mediumblue 0000cd ' +
    'mediumorchid ba55d3 mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a ' +
    'mediumturquoise 48d1cc mediumvioletred c71585 midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 ' +
    'navajowhite ffdead navy 000080 oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 orchid da70d6 ' +
    'palegoldenrod eee8aa palegreen 98fb98 paleturquoise afeeee palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 ' +
    'peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 purple 800080 rebeccapurple 663399 red ff0000 rosybrown bc8f8f ' +
    'royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 seagreen 2e8b57 seashell fff5ee sienna a0522d ' +
    'silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 slategrey 708090 snow fffafa springgreen 00ff7f ' +
    'steelblue 4682b4 tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 violet ee82ee wheat f5deb3 ' +
    'white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32')
    .split(' ')
    .reduce((acc, v, i, arr) => (i % 2 === 0 ? [...acc, [v, arr[i + 1]]] : acc), []),
);

const clamp01 = (x) => Math.min(1, Math.max(0, x));

function num(token, { percentScale = 1, hue = false } = {}) {
  const t = String(token).trim().toLowerCase();
  if (t === 'none') return 0;
  if (t.endsWith('%')) return (parseFloat(t) / 100) * percentScale;
  if (hue) {
    if (t.endsWith('deg')) return parseFloat(t);
    if (t.endsWith('grad')) return parseFloat(t) * 0.9;
    if (t.endsWith('rad')) return (parseFloat(t) * 180) / Math.PI;
    if (t.endsWith('turn')) return parseFloat(t) * 360;
  }
  return parseFloat(t);
}

function splitArgs(inner) {
  // Supports "r, g, b, a", "r g b / a", "r g b"
  let alpha;
  let body = inner.trim();
  const slash = body.indexOf('/');
  if (slash >= 0) {
    alpha = body.slice(slash + 1).trim();
    body = body.slice(0, slash).trim();
  }
  const commas = body.includes(',');
  let parts = commas ? body.split(',').map((s) => s.trim()) : body.split(/\s+/);
  // Legacy comma syntax carries alpha as a fourth value: rgba(r, g, b, a). Space syntax needs "/ a".
  if (commas && parts.length === 4 && alpha === undefined) {
    alpha = parts[3];
    parts = parts.slice(0, 3);
  }
  return { parts, alpha };
}

function parseAlpha(a) {
  if (a === undefined) return 1;
  const v = num(a, { percentScale: 1 });
  return Number.isFinite(v) ? clamp01(v) : 1;
}

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function mul3(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

const XYZD65_TO_LIN_SRGB = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
];
const D50_TO_D65 = [
  [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
  [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
  [0.012314001688319899, -0.020507696433477912, 1.3303659366080753],
];
const LIN_P3_TO_XYZD65 = [
  [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
  [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
  [0, 0.04511338185890264, 1.043944368900976],
];

export function linearSrgbToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToLinearSrgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function labD50ToLinearSrgb([L, a, b]) {
  const eps = 216 / 24389;
  const kappa = 24389 / 27;
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const xr = fx ** 3 > eps ? fx ** 3 : (116 * fx - 16) / kappa;
  const yr = L > kappa * eps ? ((L + 16) / 116) ** 3 : L / kappa;
  const zr = fz ** 3 > eps ? fz ** 3 : (116 * fz - 16) / kappa;
  const xyzD50 = [xr * 0.96422, yr, zr * 0.82521];
  return mul3(XYZD65_TO_LIN_SRGB, mul3(D50_TO_D65, xyzD50));
}

function fromLinear(lin, alpha) {
  const [r, g, b] = lin.map((c) => linearToSrgb(c));
  const inGamut = [r, g, b].every((c) => c >= -0.0005 && c <= 1.0005);
  return { r: clamp01(r), g: clamp01(g), b: clamp01(b), alpha, inGamut };
}

/**
 * Parse a CSS colour string into sRGB components in 0..1 plus alpha.
 * Returns null for keywords that are not colours (currentcolor, inherit, var(...)) or unsupported spaces.
 */
export function parseColor(input) {
  if (input === undefined || input === null) return null;
  const s = String(input).trim().toLowerCase();
  if (!s) return null;
  if (s === 'transparent') return { r: 0, g: 0, b: 0, alpha: 0, inGamut: true };
  if (NAMED[s]) return parseColor(`#${NAMED[s]}`);
  if (s.startsWith('#')) {
    const h = s.slice(1);
    if (!/^[0-9a-f]+$/.test(h)) return null;
    let r;
    let g;
    let b;
    let a = 1;
    if (h.length === 3 || h.length === 4) {
      r = parseInt(h[0] + h[0], 16);
      g = parseInt(h[1] + h[1], 16);
      b = parseInt(h[2] + h[2], 16);
      if (h.length === 4) a = parseInt(h[3] + h[3], 16) / 255;
    } else if (h.length === 6 || h.length === 8) {
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
      if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
    } else return null;
    return { r: r / 255, g: g / 255, b: b / 255, alpha: a, inGamut: true };
  }
  const m = s.match(/^([a-z-]+)\((.*)\)$/);
  if (!m) return null;
  const fn = m[1];
  const { parts, alpha } = splitArgs(m[2]);
  const A = parseAlpha(alpha);
  try {
    if (fn === 'rgb' || fn === 'rgba') {
      const [r, g, b] = parts.map((p) => (p.endsWith('%') ? num(p) : num(p) / 255));
      if (![r, g, b].every(Number.isFinite)) return null;
      return { r: clamp01(r), g: clamp01(g), b: clamp01(b), alpha: A, inGamut: true };
    }
    if (fn === 'hsl' || fn === 'hsla') {
      const h = num(parts[0], { hue: true });
      const sat = num(parts[1].endsWith('%') ? parts[1] : `${parts[1]}%`);
      const lig = num(parts[2].endsWith('%') ? parts[2] : `${parts[2]}%`);
      const [r, g, b] = hslToRgb(h, sat, lig);
      return { r, g, b, alpha: A, inGamut: true };
    }
    if (fn === 'oklab') {
      const L = num(parts[0], { percentScale: 1 });
      const a = num(parts[1], { percentScale: 0.4 });
      const b = num(parts[2], { percentScale: 0.4 });
      return fromLinear(oklabToLinearSrgb([L, a, b]), A);
    }
    if (fn === 'oklch') {
      const L = num(parts[0], { percentScale: 1 });
      const C = num(parts[1], { percentScale: 0.4 });
      const H = (num(parts[2], { hue: true }) * Math.PI) / 180;
      return fromLinear(oklabToLinearSrgb([L, C * Math.cos(H), C * Math.sin(H)]), A);
    }
    if (fn === 'lab') {
      const L = num(parts[0], { percentScale: 100 });
      const a = num(parts[1], { percentScale: 125 });
      const b = num(parts[2], { percentScale: 125 });
      return fromLinear(labD50ToLinearSrgb([L, a, b]), A);
    }
    if (fn === 'lch') {
      const L = num(parts[0], { percentScale: 100 });
      const C = num(parts[1], { percentScale: 150 });
      const H = (num(parts[2], { hue: true }) * Math.PI) / 180;
      return fromLinear(labD50ToLinearSrgb([L, C * Math.cos(H), C * Math.sin(H)]), A);
    }
    if (fn === 'color') {
      const space = parts[0];
      const vals = parts.slice(1, 4).map((p) => num(p));
      if (space === 'srgb') return { r: clamp01(vals[0]), g: clamp01(vals[1]), b: clamp01(vals[2]), alpha: A, inGamut: true };
      if (space === 'srgb-linear') return fromLinear(vals, A);
      if (!vals.every(Number.isFinite)) return null;
      if (space === 'display-p3') {
        const lin = vals.map(srgbToLinear);
        return fromLinear(mul3(XYZD65_TO_LIN_SRGB, mul3(LIN_P3_TO_XYZD65, lin)), A);
      }
      if (space === 'xyz' || space === 'xyz-d65') return fromLinear(mul3(XYZD65_TO_LIN_SRGB, vals), A);
      if (space === 'xyz-d50') return fromLinear(mul3(XYZD65_TO_LIN_SRGB, mul3(D50_TO_D65, vals)), A);
      return null;
    }
  } catch {
    return null;
  }
  return null;
}

export function hslToRgb(h, s, l) {
  const hh = ((h % 360) + 360) % 360;
  const f = (n) => {
    const k = (n + hh / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  return [clamp01(f(0)), clamp01(f(8)), clamp01(f(4))];
}

/** sRGB (0..1) → HSL with h in degrees and s, l in 0..1. */
export function rgbToHsl({ r, g, b }) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d > 1e-9) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h, s, l };
}

/** Composite a (possibly translucent) colour over an opaque background, in gamma-encoded sRGB as browsers do. */
export function composite(fg, bg) {
  const a = fg.alpha ?? 1;
  const base = bg.alpha !== undefined && bg.alpha < 1 ? composite(bg, { r: 1, g: 1, b: 1, alpha: 1 }) : bg;
  return {
    r: fg.r * a + base.r * (1 - a),
    g: fg.g * a + base.g * (1 - a),
    b: fg.b * a + base.b * (1 - a),
    alpha: 1,
    inGamut: true,
  };
}

/** WCAG 2.x relative luminance. */
export function luminance({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** WCAG contrast ratio between a foreground and a background (alpha composited). */
export function contrastRatio(fg, bg) {
  const B = bg.alpha !== undefined && bg.alpha < 1 ? composite(bg, { r: 1, g: 1, b: 1, alpha: 1 }) : bg;
  const F = fg.alpha !== undefined && fg.alpha < 1 ? composite(fg, B) : fg;
  const l1 = luminance(F);
  const l2 = luminance(B);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

export function toOklab(c) {
  return linearSrgbToOklab([srgbToLinear(c.r), srgbToLinear(c.g), srgbToLinear(c.b)]);
}

/** OKLCH: { l: 0..1, c: chroma, h: degrees } */
export function toOklch(c) {
  const [L, a, b] = toOklab(c);
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { l: L, c: C, h: C < 1e-4 ? 0 : H };
}

/** Euclidean ΔE in OKLab. Values below 0.02 are treated as the same colour in the style census. */
export function deltaEOK(c1, c2) {
  const [l1, a1, b1] = toOklab(c1);
  const [l2, a2, b2] = toOklab(c2);
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

export function toHex({ r, g, b, alpha = 1 }) {
  const h = (x) => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}${alpha < 1 ? h(alpha) : ''}`;
}

/** Smallest angular distance between two hues in degrees. */
export function hueDistance(h1, h2) {
  const d = Math.abs((((h1 - h2) % 360) + 360) % 360);
  return Math.min(d, 360 - d);
}

/** Extract every colour literal (hex, functions, a few named) from a CSS value string. */
export function extractColors(value) {
  const out = [];
  const s = String(value || '');
  const re = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)/g;
  let m;
  while ((m = re.exec(s))) {
    const c = parseColor(m[0]);
    if (c) out.push({ text: m[0], color: c, index: m.index });
  }
  return out;
}
