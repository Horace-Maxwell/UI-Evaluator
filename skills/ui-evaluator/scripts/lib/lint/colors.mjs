// Colour tests used by the tell rules. Built on lib/util/color.mjs only (zero-dependency lint layer).
import { parseColor, toOklch, rgbToHsl, deltaEOK } from '../util/color.mjs';

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/**
 * CIE LCh chroma (D50, as CSS lch()) of an sRGB colour. SLP-08 compares it with 30.
 * sRGB → linear → XYZ (D65) → Bradford to D50 → Lab → C = sqrt(a² + b²).
 */
export function cieLchChroma(c) {
  const r = srgbToLinear(c.r);
  const g = srgbToLinear(c.g);
  const b = srgbToLinear(c.b);
  const x65 = 0.4123907992659595 * r + 0.357584339383878 * g + 0.1804807884018343 * b;
  const y65 = 0.21263900587151036 * r + 0.715168678767756 * g + 0.07219231536073371 * b;
  const z65 = 0.01933081871559185 * r + 0.11919477979462599 * g + 0.9505321522496606 * b;
  const x = 1.0479298208405488 * x65 + 0.022946793341019088 * y65 - 0.05019222954313557 * z65;
  const y = 0.029627815688159344 * x65 + 0.990434484573249 * y65 - 0.01707382502938514 * z65;
  const z = -0.009243058152591178 * x65 + 0.015055144896577895 * y65 + 0.7518742899580008 * z65;
  const eps = 216 / 24389;
  const kappa = 24389 / 27;
  const f = (t) => (t > eps ? Math.cbrt(t) : (kappa * t + 16) / 116);
  const fx = f(x / 0.96422);
  const fy = f(y);
  const fz = f(z / 0.82521);
  const a = 500 * (fx - fy);
  const bb = 200 * (fy - fz);
  return Math.sqrt(a * a + bb * bb);
}

/**
 * SLP-02 indigo-violet band: OKLCH hue in [h0, h1] with chroma ≥ cmin and lightness in [l0, l1], or HSL hue in
 * [h0, h1] with saturation > s and l0 < L < l1. Parameters come from tells.json (QUALITY-BAR values).
 */
export function inIndigoVioletBand(c, params) {
  if (!c || (c.alpha ?? 1) === 0) return false;
  const ok = params.oklch;
  const hs = params.hsl;
  const o = toOklch(c);
  if (o.h >= ok.hue_deg[0] && o.h <= ok.hue_deg[1] && o.c >= ok.chroma_min && o.l >= ok.lightness[0] && o.l <= ok.lightness[1]) return true;
  const h = rgbToHsl(c);
  return h.h >= hs.hue_deg[0] && h.h <= hs.hue_deg[1] && h.s > hs.saturation_gt && h.l > hs.lightness_gt && h.l < hs.lightness_lt;
}

/** OKLCH chroma ≥ 0.05 is "chromatic" in UI-Evaluator (the chromatic-surface threshold of COL-02). */
export const CHROMATIC_OKLCH = 0.05;

export function isChromatic(c, min = CHROMATIC_OKLCH) {
  if (!c) return false;
  return toOklch(c).c >= min;
}

export function sameColor(a, b) {
  return deltaEOK(a, b) < 0.02;
}

export { parseColor };
