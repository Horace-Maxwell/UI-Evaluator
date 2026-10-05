// Direction ledger (DEC-04, CRAFT-010): records what each direction used, so new work differs.
import { toOklch, parseColor } from '../util/color.mjs';

export function normalizeFace(face) {
  return String(face || '')
    .toLowerCase()
    .replace(/["']/g, '')
    .split(',')[0]
    .replace(/\b(variable|vf|display|text|pro)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeMacro(macro) {
  const parts = Array.isArray(macro) ? macro : String(macro || '').split(/\s*(?:>|→|,|\|)\s*/);
  return parts.map((p) => p.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')).filter(Boolean).join('>');
}

/** OKLCH hue bucket of a colour: "neutral" when chroma is tiny, else 30° buckets like "h240-270". */
export function hueBucket(color) {
  const c = typeof color === 'string' ? parseColor(color) : color;
  if (!c) return null;
  const { c: chroma, h } = toOklch(c);
  if (chroma < 0.02) return 'neutral';
  const lo = Math.floor(h / 30) * 30;
  return `h${lo}-${lo + 30}`;
}

/**
 * The colour that carries the brand, for the ledger's accent hue: `primary` unless it is neutral (an ink button), in
 * which case the most chromatic brand role (signature, accent, brand, secondary…), then any other chromatic role.
 * Semantic roles (error, warning, success, info, focus) and on-* text roles never count.
 */
export function accentOf(colors = {}) {
  const chroma = (v) => {
    const c = typeof v === 'string' ? parseColor(v) : null;
    return c ? toOklch(c).c : 0;
  };
  const primary = typeof colors.primary === 'string' ? colors.primary : null;
  if (primary && chroma(primary) >= 0.02) return primary;
  const roles = Object.entries(colors || {}).filter(([k, v]) => typeof v === 'string' && !/^on-/i.test(k) && !/^(error|warning|success|info|danger|critical|positive|negative|focus)/i.test(k) && chroma(v) >= 0.02);
  const byChroma = (list) => list.sort((a, b) => chroma(b[1]) - chroma(a[1]));
  const brand = byChroma(roles.filter(([k]) => /accent|signature|brand|secondary|tertiary|highlight/i.test(k)));
  if (brand.length) return brand[0][1];
  const any = byChroma(roles);
  return any.length ? any[0][1] : primary;
}

/**
 * DEC-04: the newest entry differs from each of the previous three in display face and macrostructure,
 * unless the entry says the brand pins them.
 */
export function ledgerVariety(ledger, { window = 3 } = {}) {
  const entries = (ledger.entries || []).filter((e) => !e.superseded);
  if (!entries.length) return { ok: false, detail: 'no ledger entries' };
  const latest = entries[entries.length - 1];
  const prev = entries.slice(-1 - window, -1);
  if (!prev.length) return { ok: true, first: true, detail: `first ledger entry (${latest.id})` };
  if (latest.pinned) return { ok: true, detail: `brand pins face and structure (${latest.pinned})` };
  const face = normalizeFace(latest.display_face);
  const macro = normalizeMacro(latest.macrostructure);
  const sameFace = prev.filter((e) => face && normalizeFace(e.display_face) === face);
  const sameMacro = prev.filter((e) => macro && normalizeMacro(e.macrostructure) === macro);
  if (!face || !macro) return { ok: false, detail: `entry ${latest.id} lacks display_face or macrostructure` };
  if (sameFace.length || sameMacro.length) {
    const why = [
      sameFace.length ? `display face repeats ${sameFace.map((e) => e.id).join(', ')}` : '',
      sameMacro.length ? `macrostructure repeats ${sameMacro.map((e) => e.id).join(', ')}` : '',
    ].filter(Boolean);
    return { ok: false, detail: why.join('; ') };
  }
  return { ok: true, detail: `differs from the last ${prev.length} entr${prev.length === 1 ? 'y' : 'ies'} in face and macrostructure` };
}

/** Values used recently for each structural parameter (for the roll's exclusion). */
export function recentValues(ledger, key, window = 3) {
  return new Set(
    (ledger.entries || [])
      .slice(-window)
      .map((e) => e[key])
      .filter(Boolean),
  );
}
