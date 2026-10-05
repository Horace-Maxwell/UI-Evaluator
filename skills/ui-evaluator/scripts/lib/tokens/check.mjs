// Token-level checks on a parsed DESIGN.md (DEC-02 plus the craft criteria a token file can already break).
// parseDesign() checks structure; this module checks values: role contrast in every shipped theme, dark-theme
// composition, ramps, type scale, spacing, elevation and motion budgets. Rendered checks still decide the gates.
import { parseColor, contrastRatio, toOklch, deltaEOK, luminance } from '../util/color.mjs';

const TEXT_PAIRS = [
  ['on-surface', 'surface'], ['on-surface', 'surface-container'], ['on-surface', 'surface-container-high'],
  ['on-surface-variant', 'surface'], ['on-surface-variant', 'surface-container'], ['on-surface-variant', 'surface-container-high'],
  ['on-primary', 'primary'], ['on-primary', 'primary-hover'], ['primary', 'surface'],
  ['on-error', 'error'], ['on-success', 'success'], ['on-warning', 'warning'], ['on-info', 'info'],
];
const NON_TEXT_PAIRS = [
  ['outline', 'surface'], ['outline', 'surface-container'], ['focus', 'surface'], ['focus', 'surface-container'],
];
const RAISED = ['surface', 'surface-container', 'surface-container-high'];
// COL-05: the role families a palette needs (canvas, ink, a surface level, secondary text, borders, action, focus,
// selection, status). Material role names, which the design.md linter knows, stand for them.
const REQUIRED_ROLES = ['surface', 'on-surface', 'surface-container', 'on-surface-variant', 'outline', 'outline-variant', 'primary', 'on-primary', 'focus', 'selection', 'error', 'success', 'warning', 'info'];
// COL-06 on 12-step ramps (Radix jobs): steps a role must not alias.
const STEP_MISUSE = [
  [/^on-surface(-variant)?$/, (n) => n <= 8, 'text roles belong on steps 11–12'],
  [/^surface(-container(-high)?)?$/, (n) => n >= 6, 'background roles belong on steps 1–3'],
  [/^outline(-variant)?$/, (n) => n <= 3 || n >= 11, 'border roles belong on steps 6–8'],
  [/^primary(-hover)?$/, (n) => n <= 5, 'solid fills belong on steps 9–10'],
];

/** CIE L* (Material's HCT tone) from relative luminance. */
export function lstar(c) {
  const y = luminance(c);
  const f = y > 216 / 24389 ? Math.cbrt(y) : (24389 / 27 * y + 16) / 116;
  return 116 * f - 16;
}

const num = (v) => (v === null || v === undefined || v === '' ? NaN : Number(String(v).replace(/ms$/, '')));

/** "1.25rem" | "20px" | 20 → px (rem/em at 16 px). */
export function toPx(v) {
  if (typeof v === 'number') return v;
  const m = String(v ?? '').trim().match(/^(-?[\d.]+)\s*(px|rem|em|pt)?$/);
  if (!m) return NaN;
  const n = Number(m[1]);
  return m[2] === 'rem' || m[2] === 'em' ? n * 16 : m[2] === 'pt' ? (n * 4) / 3 : n;
}

function rampStep(ramps, ref) {
  const m = String(ref || '').match(/^([\w-]+)\.(\d+)$/);
  if (!m) return null;
  const steps = ramps?.[m[1]];
  if (!Array.isArray(steps)) return null;
  return steps[Number(m[2]) - 1] ?? null;
}

/** Resolve role colours for one theme: explicit colours first, then role_steps into ramps. */
export function resolveRoles({ colors = {}, roleSteps = {}, ramps = {} }) {
  const out = {};
  const mismatches = [];
  const roles = new Set([...Object.keys(colors || {}), ...Object.keys(roleSteps || {})]);
  for (const role of roles) {
    const explicit = parseColor(colors?.[role]);
    const stepVal = roleSteps?.[role] ? rampStep(ramps, roleSteps[role]) : null;
    const fromStep = stepVal ? parseColor(stepVal) : null;
    if (explicit && fromStep && deltaEOK(explicit, fromStep) > 0.02) mismatches.push({ role, explicit: colors[role], step: roleSteps[role], stepValue: stepVal });
    const c = explicit || fromStep;
    if (c) out[role] = c;
  }
  return { roles: out, mismatches };
}

const fmtRatio = (r) => `${r.toFixed(2)}:1`;

function hueSpread(hues) {
  if (hues.length < 2) return 0;
  const sorted = [...hues].sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    const next = i === sorted.length - 1 ? sorted[0] + 360 : sorted[i + 1];
    maxGap = Math.max(maxGap, next - sorted[i]);
  }
  return 360 - maxGap;
}

/**
 * @param {{ fm: object, uie: object }} d parsed DESIGN.md
 * @param {{ surfaces?: Array<{id: string, mode: string}>, cjk?: boolean }} ctx facts from PRODUCT.md
 * @returns {{ errors: string[], warnings: string[], pairs: object[] }}
 */
export function checkTokens(d, { surfaces = [], cjk = false } = {}) {
  const errors = [];
  const warnings = [];
  const pairs = [];
  const fm = d?.fm || {};
  const uie = d?.uie || {};
  if (!d?.fm || uie.status === 'template') return { errors, warnings, pairs };
  const exceptions = new Set((uie.declared_exceptions || []).map((e) => (typeof e === 'string' ? e : e?.id)).filter(Boolean));
  const modes = new Set(surfaces.map((s) => s.mode).filter(Boolean));
  const operateOnly = modes.size > 0 && [...modes].every((m) => m === 'operate');
  const hasOperate = modes.has('operate');

  // --- colour roles per shipped theme ---------------------------------------------------
  const themes = { light: resolveRoles({ colors: fm.colors, roleSteps: uie.role_steps, ramps: uie.ramps }) };
  const shipped = uie.themes?.shipped || ['light'];
  if (shipped.includes('dark')) {
    const dk = uie.themes?.dark || {};
    themes.dark = resolveRoles({ colors: dk.colors, roleSteps: dk.role_steps || uie.role_steps, ramps: dk.ramps || uie.ramps });
  }
  for (const m of themes.light.mismatches) warnings.push(`colors.${m.role} (${m.explicit}) and role_steps.${m.role} (${m.step} = ${m.stepValue}) disagree; keep them in step`);
  for (const [theme, { roles }] of Object.entries(themes)) {
    if (!shipped.includes(theme)) continue;
    for (const [list, min, gapMin, what] of [[TEXT_PAIRS, 4.5, 50, 'text needs ≥ 4.5:1, A11Y-11'], [NON_TEXT_PAIRS, 3, 40, 'control edges and focus need ≥ 3:1, A11Y-12']]) {
      for (const [fg, bg] of list) {
        if (!roles[fg] || !roles[bg]) continue;
        const r = contrastRatio(roles[fg], roles[bg]);
        const gap = Math.abs(lstar(roles[fg]) - lstar(roles[bg]));
        pairs.push({ theme, fg, bg, ratio: r, min, lstar_gap: Math.round(gap * 10) / 10 });
        if (r < min) errors.push(`${theme}: ${fg} ${list === TEXT_PAIRS ? 'on' : 'against'} ${bg} is ${fmtRatio(r)} (${what})`);
        else if (gap < gapMin) warnings.push(`${theme}: ${fg}/${bg} tone gap ${gap.toFixed(0)} < ${gapMin} (COL-07); it passes at ${fmtRatio(r)}, but sits close to the line`);
      }
    }
    if (theme === 'dark') {
      const L = RAISED.map((role) => (roles[role] ? toOklch(roles[role]).l : null));
      for (let i = 1; i < L.length; i += 1) {
        if (L[i] !== null && L[i - 1] !== null && L[i] < L[i - 1] - 0.005) errors.push(`dark: ${RAISED[i]} is darker than ${RAISED[i - 1]}; raised surfaces get lighter in dark themes (COL-04)`);
      }
    }
  }
  if (shipped.includes('dark') && !themes.dark?.roles?.surface) errors.push('dark ships but its surface colour does not resolve (themes.dark.colors or role_steps into ramps)');
  const missingRoles = REQUIRED_ROLES.filter((r) => !themes.light.roles[r]);
  if (missingRoles.length) warnings.push(`colour roles missing (COL-05): ${missingRoles.join(', ')}`);
  for (const [role, ref] of Object.entries(uie.role_steps || {})) {
    const m = String(ref).match(/^([\w-]+)\.(\d+)$/);
    if (!m || (uie.ramps?.[m[1]] || []).length !== 12) continue;
    const step = Number(m[2]);
    const misuse = STEP_MISUSE.find(([re, bad]) => re.test(role) && bad(step));
    if (misuse) warnings.push(`role_steps.${role} = ${ref}: ${misuse[2]} (COL-06)`);
  }

  // --- ramps -----------------------------------------------------------------------------
  for (const [name, steps] of Object.entries(uie.ramps || {})) {
    if (!Array.isArray(steps)) continue;
    const lch = steps.map((s) => parseColor(s)).filter(Boolean).map(toOklch);
    if (lch.length < 2) continue;
    for (let i = 1; i < lch.length; i += 1) {
      if (lch[i].l > lch[i - 1].l + 0.005) {
        errors.push(`ramps.${name}: step ${i + 1} is lighter than step ${i}; ramps run lightest first (COL-05)`);
        break;
      }
    }
    const maxC = Math.max(...lch.map((x) => x.c));
    if (maxC > 0.03) {
      const iMax = lch.findIndex((x) => x.c === maxC);
      if (iMax === 0 || iMax === lch.length - 1) warnings.push(`ramps.${name}: chroma peaks at an end step; chroma should fall toward both ends (COL-05)`);
    }
    // COL-06: on a 12-step ramp the text steps (11, 12) must read on the background steps (1, 2).
    if (steps.length === 12) {
      for (const t of [11, 12]) {
        for (const b of [1, 2]) {
          const fg = parseColor(steps[t - 1]);
          const bg = parseColor(steps[b - 1]);
          if (!fg || !bg) continue;
          const r = contrastRatio(fg, bg);
          pairs.push({ theme: `ramp ${name}`, fg: `${name}.${t}`, bg: `${name}.${b}`, ratio: r, min: 4.5 });
          if (r < 4.5) warnings.push(`ramps.${name}: text step ${t} on background step ${b} is ${fmtRatio(r)} (< 4.5:1, COL-06)`);
        }
      }
    }
    if (/neutral|gr[ae]y|base/i.test(name)) {
      const hues = lch.filter((x) => x.c > 0.005).map((x) => x.h);
      const spread = hueSpread(hues);
      if (spread > 30) warnings.push(`ramps.${name}: neutral hue spreads over ${spread.toFixed(0)}°; keep one temperature (COL-08)`);
    }
  }

  // --- typography ---------------------------------------------------------------------------
  const roles = Object.entries(fm.typography || {})
    .map(([name, t]) => ({ name, size: toPx(t?.fontSize), weight: num(t?.fontWeight || 400), lh: num(t?.lineHeight), family: String(t?.fontFamily || '').split(',')[0].replace(/["']/g, '').trim() }))
    .filter((r) => Number.isFinite(r.size));
  const body = roles.find((r) => r.name === 'body');
  if (body) {
    const minBody = operateOnly ? 14 : 16;
    if (body.size < minBody) errors.push(`typography.body is ${body.size} px; body text needs ≥ ${minBody} px for ${operateOnly ? 'Operate' : 'reading'} surfaces (TYP-02)`);
    if (Number.isFinite(body.lh) && body.lh < (cjk ? 1.5 : 1.4)) errors.push(`typography.body lineHeight ${body.lh} < ${cjk ? '1.5 (CJK)' : '1.4'} (TYP-03)`);
  } else if (roles.length) warnings.push('no "body" type role; name the reading text role body');
  for (const r of roles) {
    if (r.size < 12) errors.push(`typography.${r.name} is ${r.size} px; no text below 12 px (TYP-01)`);
    if (r.size < 24 && r.weight < 400) errors.push(`typography.${r.name}: weight ${r.weight} at ${r.size} px; no weight below 400 under 24 px (TYP-07)`);
    if (r.size > 96 && !exceptions.has('TYP-09')) errors.push(`typography.${r.name} is ${r.size} px (> 6rem) without a declared exception (TYP-09)`);
    if (r.name !== 'body' && Number.isFinite(r.lh) && r.size >= 24 && r.lh < 1.1) warnings.push(`typography.${r.name} lineHeight ${r.lh} < 1.1 for wrapping headings (TYP-03)`);
  }
  const bySize = [...roles].sort((a, b) => b.size - a.size);
  const step = operateOnly ? 1.125 : 1.25;
  if (bySize.length >= 3) {
    for (let i = 1; i < bySize.length; i += 1) {
      const a = bySize[i - 1];
      const b = bySize[i];
      if (a.size === b.size && a.weight === b.weight) {
        warnings.push(`typography.${a.name} and ${b.name} have the same size and weight`);
        continue;
      }
      const ratio = a.size / b.size;
      if (ratio < step - 0.005 && Math.abs(a.weight - b.weight) < 100) warnings.push(`typography.${a.name} → ${b.name} steps ${ratio.toFixed(3)} (< ${step}) with no weight contrast (TYP-06)`);
    }
  }
  const families = new Set(roles.map((r) => r.family).filter((f) => f && !/mono|code|<.*>/i.test(f)));
  if (families.size > 2 && !exceptions.has('TYP-05')) errors.push(`${families.size} type families (${[...families].join(', ')}); at most 2 per script without a declared reason (TYP-05)`);

  // --- spacing, radius, elevation -------------------------------------------------------------
  const base = Number(uie.layout?.spacing_base_px) || 4;
  const off = Object.entries(fm.spacing || {}).filter(([, v]) => {
    const px = toPx(v);
    return Number.isFinite(px) && !(px === 0 || px === 2 || px % base === 0);
  });
  if (off.length && !exceptions.has('LAY-01')) warnings.push(`spacing off the ${base} px scale: ${off.map(([k, v]) => `${k} ${v}`).join(', ')} (LAY-01)`);
  const shadows = Object.keys(uie.elevation?.shadows || {});
  if (shadows.length > 4) errors.push(`${shadows.length} shadow styles; at most 4 per theme (SHP-02)`);

  // --- motion ------------------------------------------------------------------------------------
  if (!uie.motion?.duration_ms || !uie.motion?.easing) warnings.push('motion tokens missing: ui-evaluator.motion needs duration_ms and easing (motion.md)');
  const md = uie.motion?.duration_ms || {};
  const stateCap = hasOperate ? 250 : 300;
  const caps = { feedback: stateCap, state: stateCap, overlay_enter: 500, overlay_exit: 500, scrim: 700, focal: 800, frequent: 150 };
  for (const [k, cap] of Object.entries(caps)) {
    const v = num(md[k]);
    if (Number.isFinite(v) && v > cap) errors.push(`motion.duration_ms.${k} is ${v} ms (> ${cap} ms${k === 'state' || k === 'feedback' ? hasOperate ? ' with Operate surfaces' : '' : ''}, MOT-02)`);
  }
  const playful = String(uie.motion?.springs || '').toLowerCase() === 'playful';
  for (const [k, v] of Object.entries(uie.motion?.easing || {})) {
    const m = String(v || '').match(/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
    if (!m) continue;
    const y1 = Number(m[2]);
    const y2 = Number(m[4]);
    if (!playful && (y1 < -0.1 || y1 > 1.1 || y2 < -0.1 || y2 > 1.1)) errors.push(`motion.easing.${k} overshoots (${v}); only a declared playful brand may (MOT-03)`);
  }

  // --- PRODUCT.md link ------------------------------------------------------------------------------
  if (surfaces.length) {
    const ids = new Set(surfaces.map((s) => s.id));
    const chosen = (uie.surface_choices || []).map((s) => s?.id).filter(Boolean);
    const unknown = chosen.filter((id) => !ids.has(id) && !/<.*>/.test(id));
    if (unknown.length) errors.push(`surface_choices name surface(s) not in PRODUCT.md: ${unknown.join(', ')}`);
    const missing = [...ids].filter((id) => !chosen.includes(id));
    if (missing.length) warnings.push(`PRODUCT.md surface(s) without a colour strategy and motion level: ${missing.join(', ')}`);
  }
  return { errors, warnings, pairs };
}
