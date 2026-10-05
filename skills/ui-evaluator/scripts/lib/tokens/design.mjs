// DESIGN.md parsing and checks (DEC-02), accepted tells, token extraction helpers.
// Format: Google design.md (YAML front matter + fixed sections) with a `ui-evaluator:` extension key.
import { parseYaml, splitFrontMatter } from '../util/yaml.mjs';
import { sections, stripComments, placeholders } from '../util/markdown.mjs';
import { parseColor, contrastRatio } from '../util/color.mjs';

export const STANDARD_SECTIONS = [
  ['Overview', 'Brand & Style'],
  ['Colors'],
  ['Typography'],
  ['Layout', 'Layout & Spacing'],
  ['Elevation & Depth', 'Elevation'],
  ['Shapes'],
  ['Components'],
  ["Do's and Don'ts"],
];
export const UIE_SECTIONS = ['Motion', 'Voice and tone', 'Decisions log'];
const REQUIRED_KEYS = ['version', 'name', 'colors', 'typography', 'rounded', 'spacing', 'components'];
const NEVER_ACCEPTABLE = new Set(['SLP-12', 'SLP-13']);
const PLACEHOLDER = /<[^<>\n]{1,120}>/;

function walk(v, fn, p = []) {
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, fn, [...p, i]));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, fn, [...p, k]));
  else fn(v, p);
}

function resolveRef(fm, value) {
  const m = typeof value === 'string' && value.match(/^\{([a-z-]+)\.([\w-]+)\}$/i);
  if (!m) return { ok: true, value };
  const group = fm[m[1]];
  if (!group || group[m[2]] === undefined) return { ok: false, ref: value };
  return { ok: true, value: group[m[2]] };
}

/** Parse DESIGN.md and run the DEC-02 checks. */
export function parseDesign(text, { work = 'existing' } = {}) {
  const problems = [];
  const warnings = [];
  const { frontMatter, body } = splitFrontMatter(text);
  let fm = null;
  if (frontMatter === null) problems.push('no YAML front matter (DESIGN.md must start with ---)');
  else {
    try {
      fm = parseYaml(frontMatter) || {};
    } catch (e) {
      problems.push(`front matter does not parse: ${e.message}`);
    }
  }
  const uie = fm?.['ui-evaluator'] || null;
  if (fm) {
    for (const k of REQUIRED_KEYS) if (fm[k] === undefined) problems.push(`missing front-matter key "${k}"`);
    let ph = 0;
    walk(fm, (v) => {
      if (typeof v === 'string' && PLACEHOLDER.test(v)) ph += 1;
    });
    if (ph) problems.push(`${ph} template placeholder value(s) remain in the front matter`);
    if (!uie) problems.push('missing the `ui-evaluator:` key (brand attributes, colour strategy, motion budget, accepted tells)');
    else if (uie.status === 'template') problems.push('ui-evaluator.status is still "template"');
    // Colours parse.
    for (const [name, value] of Object.entries(fm.colors || {})) {
      if (!parseColor(value)) problems.push(`colors.${name} is not a valid colour: ${value}`);
    }
    // References resolve; component text/background pairs reach 4.5:1 (as the design.md linter checks).
    for (const [cname, comp] of Object.entries(fm.components || {})) {
      if (!comp || typeof comp !== 'object') continue;
      for (const [prop, val] of Object.entries(comp)) {
        const r = resolveRef(fm, val);
        if (!r.ok) problems.push(`components.${cname}.${prop} references missing token ${r.ref}`);
      }
      const bg = parseColor(resolveRef(fm, comp.backgroundColor).value);
      const fg = parseColor(resolveRef(fm, comp.textColor).value);
      if (bg && fg) {
        const cr = contrastRatio(fg, bg);
        if (cr < 4.5) problems.push(`components.${cname}: text/background contrast ${cr.toFixed(2)}:1 < 4.5:1`);
      }
    }
    if (uie && uie.status !== 'template') {
      const attrs = Array.isArray(uie.brand_attributes) ? uie.brand_attributes : [];
      const realAttrs = attrs.filter((a) => a && a.is && a.not && !PLACEHOLDER.test(`${a.is}${a.not}`));
      if (realAttrs.length < 3 || realAttrs.length > 5) problems.push(`brand_attributes: ${realAttrs.length} "X, not Y" pair(s); 3–5 required`);
      if (!Array.isArray(uie.surface_choices) || !uie.surface_choices.length) problems.push('surface_choices is empty (colour strategy and motion level per surface)');
      const shipped = uie.themes?.shipped || [];
      if (!shipped.length) problems.push('themes.shipped is empty');
      if (shipped.includes('dark')) {
        const dark = uie.themes?.dark || {};
        if (!dark.colors && !dark.role_steps) problems.push('dark theme ships but themes.dark defines no colours or role steps');
        for (const [name, value] of Object.entries(dark.colors || {})) if (!parseColor(value)) problems.push(`themes.dark.colors.${name} is not a valid colour`);
      }
      for (const [rname, steps] of Object.entries(uie.ramps || {})) {
        if (Array.isArray(steps)) {
          if (steps.length < 10) warnings.push(`ramps.${rname} has ${steps.length} steps (COL-05 asks for ≥ 10)`);
          steps.forEach((c, i) => {
            if (!parseColor(c)) problems.push(`ramps.${rname}[${i}] is not a valid colour`);
          });
        }
      }
      const md = uie.motion?.duration_ms || {};
      for (const [k, v] of Object.entries(md)) if (v !== 'none' && v !== null && !PLACEHOLDER.test(String(v)) && !Number.isFinite(Number(v))) problems.push(`motion.duration_ms.${k} is not a number`);
      if (!uie.copy?.case) problems.push('copy.case (case convention per element type) is missing');
      for (const t of uie.accepted_tells || []) {
        if (!t || !t.id) continue;
        if (NEVER_ACCEPTABLE.has(t.id)) problems.push(`${t.id} cannot be accepted: honesty outranks the brief`);
        else if (!t.reason || !t.decided_by) problems.push(`accepted tell ${t.id} needs a reason and who decided`);
      }
    }
  }
  // Sections: order of the standard ones, no duplicates, UI-Evaluator sections present, no placeholders left.
  const secs = sections(body, 2);
  const titles = secs.map((s) => s.title);
  const seen = new Set();
  for (const t of titles) {
    if (seen.has(t)) problems.push(`duplicate section "${t}"`);
    seen.add(t);
  }
  const positions = STANDARD_SECTIONS.map((names) => titles.findIndex((t) => names.includes(t)));
  STANDARD_SECTIONS.forEach((names, i) => {
    if (positions[i] < 0) problems.push(`missing section "${names[0]}"`);
  });
  const present = positions.filter((p) => p >= 0);
  if (present.some((p, i) => i && p < present[i - 1])) problems.push('standard sections are out of order (Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do\'s and Don\'ts)');
  for (const name of UIE_SECTIONS) if (!titles.includes(name)) problems.push(`missing section "${name}"`);
  if ((work === 'new' || work === 'redesign') && !titles.includes('Direction contract')) problems.push('missing section "Direction contract"');
  const ph = placeholders(body);
  if (ph.length) problems.push(`${ph.length} template placeholder(s) remain in the prose, e.g. ${ph[0]}`);
  for (const s of secs) {
    if (!stripComments(s.content).trim()) problems.push(`section "${s.title}" is empty`);
  }
  return { fm, uie, sections: titles, problems, warnings, status: uie?.status || null };
}

/** Accepted tells declared in DESIGN.md → Map(id → entry). SLP-12/13 are never accepted. */
export function acceptedTells(design) {
  const map = new Map();
  for (const t of design?.uie?.accepted_tells || []) {
    if (!t || !t.id || NEVER_ACCEPTABLE.has(t.id) || !t.reason) continue;
    map.set(t.id, t);
  }
  return map;
}

/** Brand palette hues (OKLCH) from DESIGN.md colours and ramps, used to exempt SLP-02 for documented brand hues. */
export function brandHues(design) {
  const out = [];
  const push = (v) => {
    const c = parseColor(v);
    if (c) out.push(c);
  };
  Object.values(design?.fm?.colors || {}).forEach(push);
  for (const steps of Object.values(design?.uie?.ramps || {})) if (Array.isArray(steps)) steps.forEach(push);
  return out;
}
