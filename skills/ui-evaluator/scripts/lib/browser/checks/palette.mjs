// palette — COL-03 [calibrating]: the declared colour strategy is honoured, measured on screenshots with photos,
// video, canvas, iframes and illustrations masked. Restrained: accent-hue area ≤ 10% of any viewport-sized window;
// Committed: dominant hue 30–60% of the surface. Operate and Read surfaces without a declaration are Restrained
// (QUALITY-BAR §5); Persuade and Experience surfaces must declare one, otherwise COL-03 is not evaluated for them.
// Drenched is checked as advisory COL-17 (the declared hue's cluster must be the largest by area per viewport).
import { parseColor, toOklch, hueDistance } from '../../util/color.mjs';
import { decodePng } from '../png.mjs';
import { round } from '../thresholds.mjs';

export const mode = 'shared';
export const criteria = ['COL-03'];
export const summary = 'pixel colour-area measurement on screenshots with media masked';

const CHROMA_MIN = 0.06; // [calibrating] a pixel counts as chromatic from this OKLCH chroma
const HUE_WINDOW = 30; // [calibrating] ± degrees around the accent hue
const BINS = 36;

const LIN = new Float64Array(256);
for (let i = 0; i < 256; i += 1) {
  const v = i / 255;
  LIN[i] = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function oklchOf(r8, g8, b8) {
  const r = LIN[r8];
  const g = LIN[g8];
  const b = LIN[b8];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [C, H];
}

/** Per-row histograms of chromatic hue bins over unmasked pixels. */
export function analyse(img, masks, { step = 2 } = {}) {
  const rows = Math.ceil(img.height / step);
  const total = new Uint32Array(rows);
  const bins = new Uint32Array(rows * BINS);
  for (let y = 0, ry = 0; y < img.height; y += step, ry += 1) {
    const rowMasks = masks.filter((m) => y >= m[1] && y < m[1] + m[3]);
    for (let x = 0; x < img.width; x += step) {
      if (rowMasks.length && rowMasks.some((m) => x >= m[0] && x < m[0] + m[2])) continue;
      const i = (y * img.width + x) * 4;
      const r = img.data[i];
      const g = img.data[i + 1];
      const b = img.data[i + 2];
      if (r === 255 && g === 0 && b === 255) continue; // config masks are painted magenta
      total[ry] += 1;
      const [C, H] = oklchOf(r, g, b);
      if (C >= CHROMA_MIN) bins[ry * BINS + Math.min(BINS - 1, Math.floor(H / (360 / BINS)))] += 1;
    }
  }
  return { rows, total, bins, step };
}

/** Dominant chromatic hue (degrees) of an analysis, smoothed over ±2 bins. */
export function dominantHue(a) {
  const sum = new Float64Array(BINS);
  for (let r = 0; r < a.rows; r += 1) for (let k = 0; k < BINS; k += 1) sum[k] += a.bins[r * BINS + k];
  let best = -1;
  let bestK = 0;
  for (let k = 0; k < BINS; k += 1) {
    let s = 0;
    for (let d = -2; d <= 2; d += 1) s += sum[(k + d + BINS) % BINS];
    if (s > best) {
      best = s;
      bestK = k;
    }
  }
  return best > 0 ? (bestK + 0.5) * (360 / BINS) : null;
}

function hueCount(a, r0, r1, hue) {
  let n = 0;
  let t = 0;
  for (let r = r0; r < r1; r += 1) {
    t += a.total[r];
    for (let k = 0; k < BINS; k += 1) if (hueDistance((k + 0.5) * (360 / BINS), hue) <= HUE_WINDOW) n += a.bins[r * BINS + k];
  }
  return { n, t };
}

/** Accent share per viewport-sized window (max) and of the whole surface. */
export function shares(a, hue, windowRows) {
  const whole = hueCount(a, 0, a.rows, hue);
  let max = { share: 0, row: 0 };
  const stepRows = Math.max(1, Math.floor(windowRows / 4));
  for (let r0 = 0; r0 < Math.max(1, a.rows - windowRows + 1); r0 += stepRows) {
    const c = hueCount(a, r0, Math.min(a.rows, r0 + windowRows), hue);
    const share = c.t ? c.n / c.t : 0;
    if (share > max.share) max = { share, row: r0 };
  }
  return { surface: whole.t ? whole.n / whole.t : 0, maxWindow: max.share, windowTopRow: max.row };
}

function mediaRects() {
  const U = window.__uie;
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (out.length >= 300) break;
    const tag = el.tagName;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const s = getComputedStyle(el);
    const photo = /url\(/.test(s.backgroundImage);
    const media = ['IMG', 'VIDEO', 'CANVAS', 'PICTURE', 'IFRAME', 'OBJECT', 'EMBED'].includes(tag);
    const illustration = tag === 'svg' && r.width >= 64 && r.height >= 64;
    if (!(photo || media || illustration)) continue;
    if (!U.isVisible(el)) continue;
    out.push([r.left + scrollX, r.top + scrollY, r.width, r.height]);
  }
  return out;
}

function declaredAccent(design) {
  const fm = design.design?.fm || {};
  const cands = [fm.colors?.primary, fm.colors?.accent];
  const ramp = design.design?.uie?.ramps?.accent;
  if (Array.isArray(ramp) && ramp.length) cands.push(ramp[Math.min(ramp.length - 1, 8)]);
  for (const c of cands) {
    const p = parseColor(c);
    if (p && toOklch(p).c >= 0.04) return toOklch(p).h;
  }
  return null;
}

/** The drench colour's hue for Drenched surfaces: a ground role (drench, brand, surface, background, canvas), not the accent. */
function declaredDrench(design) {
  const colors = design.design?.fm?.colors || {};
  for (const key of ['drench', 'brand', 'surface', 'background', 'canvas', 'surface-container']) {
    const p = parseColor(colors[key]);
    if (p && toOklch(p).c >= 0.03) return toOklch(p).h;
  }
  return declaredAccent(design);
}

export async function run(ctx) {
  const hits = [];
  const notEvaluated = new Set();
  const measured = [];
  const accentHue = declaredAccent(ctx.design);
  const drenchHue = declaredDrench(ctx.design);
  for await (const pg of ctx.pages(ctx.states({ widths: 'all', themes: 'all' }))) {
    const ps = pg.ps;
    const strat = ctx.design.strategyFor(ps.surface, ps.mode);
    if (!strat.strategy) {
      notEvaluated.add(`${ps.route} (${ps.mode}, no declared colour strategy)`);
      continue;
    }
    if (strat.strategy === 'full-palette') {
      notEvaluated.add(`${ps.route} (full palette: advisory COL-17, not scripted)`);
      continue;
    }
    const masks = (await pg.page.evaluate(mediaRects)).map((m) => m.map((v) => Math.round(v * ps.dsf)));
    const buf = await pg.page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', mask: (ps.routeCfg.mask || []).map((s) => pg.page.locator(s)), maskColor: '#FF00FF' });
    const img = decodePng(ctx.deps.PNG, buf);
    const a = analyse(img, masks);
    const hue = accentHue ?? dominantHue(a);
    if (hue === null) {
      measured.push({ route: ps.route, width: ps.width, theme: ps.theme, strategy: strat.strategy, chromatic: 0 });
      continue;
    }
    const windowRows = Math.max(1, Math.round((ps.height * ps.dsf) / a.step));
    const s = shares(a, hue, windowRows);
    measured.push({ route: ps.route, state: ps.state, width: ps.width, theme: ps.theme, strategy: strat.strategy, declared: strat.declared, hue: round(hue, 0), max_window: round(s.maxWindow, 3), surface: round(s.surface, 3) });
    const where = ctx.loc(ps, { selector: 'body', bbox: [0, Math.round((s.windowTopRow * a.step) / ps.dsf), ps.width, ps.height] });
    if (strat.strategy === 'restrained' && s.maxWindow > 0.1 + 1e-9) {
      hits.push(ctx.hit({ rule: 'COL-03', title: `Accent covers more than 10% of a viewport (Restrained${strat.declared ? '' : ' by default'})`, description: `On ${ps.route} at ${ps.width} px (${ps.theme}), the accent hue (OKLCH ${round(hue, 0)}° ± ${HUE_WINDOW}°) covers ${Math.round(s.maxWindow * 100)}% of the worst viewport-sized window (photos, video and illustrations masked); a Restrained surface allows ≤ 10%.`, location: where, evidence: [{ type: 'measurement', value: round(s.maxWindow, 3), detail: `accent hue ${round(hue, 0)}°; worst window from y=${Math.round((s.windowTopRow * a.step) / ps.dsf)} px` }], problem_type: 'overall_structure' }));
    }
    if (strat.strategy === 'committed' && (s.surface < 0.3 - 1e-9 || s.surface > 0.6 + 1e-9)) {
      hits.push(ctx.hit({ rule: 'COL-03', title: `Committed colour covers ${Math.round(s.surface * 100)}% of the surface (needs 30–60%)`, description: `On ${ps.route} at ${ps.width} px (${ps.theme}), the dominant hue (OKLCH ${round(hue, 0)}°) covers ${Math.round(s.surface * 100)}% of the surface; a Committed strategy needs 30–60%.`, location: where, evidence: [{ type: 'measurement', value: round(s.surface, 3), detail: `dominant hue ${round(hue, 0)}°` }], problem_type: 'overall_structure' }));
    }
    if (strat.strategy === 'drenched') {
      const dom = dominantHue(a);
      if (drenchHue !== null && dom !== null && hueDistance(dom, drenchHue) > HUE_WINDOW) {
        hits.push(ctx.hit({ rule: 'COL-17', title: 'Drenched hue is not the largest colour cluster', description: `The declared drench hue (${round(drenchHue, 0)}°, from the ground role in DESIGN.md) is not the largest chromatic cluster (${round(dom, 0)}°) on ${ps.route} at ${ps.width} px.`, location: where, evidence: [{ type: 'measurement', value: round(dom, 0), detail: 'advisory COL-17' }], severity: 1, problem_type: 'overall_structure' }));
      }
    }
  }
  if (notEvaluated.size) ctx.partial(`COL-03 not evaluated for: ${[...notEvaluated].join('; ')}`);
  ctx.record({ accent_hue: accentHue === null ? 'inferred per page (dominant chromatic hue)' : round(accentHue, 0), chroma_min: CHROMA_MIN, hue_window: HUE_WINDOW, measured: measured.slice(0, 60), not_evaluated: [...notEvaluated] });
  return hits;
}
