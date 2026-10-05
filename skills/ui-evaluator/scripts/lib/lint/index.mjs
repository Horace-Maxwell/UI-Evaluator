// `uie lint` engine: parse each file, collect project-wide facts, run every rule family, then turn raw reports into
// finding-shaped hits (ARCHITECTURE §8.6): found_by check "lint", evidence E1, rule-declared severity, locations with
// source {file, line, col, method: "lint", confidence: "high"} and route "". Levels: gate (fails a gate), soft (a soft
// tell that needs a disposition, ADR-031), advisory (never gates), possible (experimental tell, never counted).
// The project context (lint/files.mjs) carries PRODUCT.md facts, DESIGN.md and DTCG tokens and the config.
import path from 'node:path';
import { parseDocument } from './markup.mjs';
import { cssRules } from './model.mjs';
import { parseCss } from './css.mjs';
import { readText, exists } from '../util/fs.mjs';
import { isNonShippedFile } from './files.mjs';
import { tells as tellData, rules as ruleData } from './data.mjs';
import * as tellsFamily from './rules/tells.mjs';
import * as motionFamily from './rules/motion.mjs';
import * as tokensFamily from './rules/tokens.mjs';
import * as a11yFamily from './rules/a11y.mjs';
import * as i18nFamily from './rules/i18n.mjs';
import * as copyFamily from './rules/copy.mjs';

export const FAMILIES = { tells: tellsFamily, motion: motionFamily, tokens: tokensFamily, a11y: a11yFamily, i18n: i18nFamily, copy: copyFamily };

// A tell's level comes from the catalogue (tells.json, the twin of anti-slop.md), so lint cannot drift from it:
// hard → gate; soft with status active or rising → soft (needs a disposition, ADR-031); other soft → advisory;
// experimental (SLP-50+) → possible (reported, never counted).
const TELL_LEVEL = (t) => (t.class === 'hard' ? 'gate' : t.class === 'soft' ? (['active', 'rising'].includes(t.status) ? 'soft' : 'advisory') : 'possible');

function withCatalogue(rule) {
  if (!/^SLP-\d{2}$/.test(rule.id)) return rule;
  const t = tellData()[rule.id];
  if (!t) return rule;
  return { ...rule, level: TELL_LEVEL(t), title: t.title, class: t.class };
}

/** Every rule the lint layer implements: { id, family, level, fast, title, fix, wcag?, criterion? }. */
export const RULE_META = Object.fromEntries(
  Object.entries(FAMILIES).flatMap(([family, mod]) => mod.RULES.map((r) => [r.id, { ...withCatalogue(r), family }])),
);

/** Criteria the lint layer evaluates for gating (what a `checks.lint` entry covers). */
export const GATE_CRITERIA = Object.values(RULE_META).filter((r) => r.level === 'gate' || r.level === 'soft').map((r) => r.id).sort();

const LEVEL_ORDER = { gate: 0, soft: 1, advisory: 2, possible: 3 };
export const PER_RULE_CAP = 250;

// Global stylesheets checked by the single-file hook for a reduced-motion reset and a shared :focus-visible style.
const GLOBAL_STYLES = [
  'app/globals.css', 'src/app/globals.css', 'styles/globals.css', 'src/styles/globals.css', 'src/index.css', 'src/App.css', 'src/styles.css',
  'src/main.css', 'src/global.css', 'src/styles/global.css', 'src/styles/index.css', 'src/app.css', 'app.css', 'styles/main.css',
  'src/assets/main.css', 'src/assets/base.css', 'assets/css/main.css', 'app/assets/css/main.css', 'src/styles/main.css', 'styles.css', 'index.css',
];

/** Resolve a `--rules` filter (rule IDs or family names) into a predicate. */
export function ruleFilter(list) {
  if (!list || !list.length) return null;
  const want = new Set(list.map((x) => String(x).trim()).filter(Boolean));
  const unknown = [...want].filter((w) => !RULE_META[w] && !FAMILIES[w]);
  return { want, unknown };
}

function makeEnabled(filter, fast) {
  return (id) => {
    const meta = RULE_META[id];
    if (!meta) return false;
    if (fast && !(meta.fast || (meta.level === 'gate' && meta.family === 'tells'))) return false;
    if (filter && !(filter.want.has(id) || filter.want.has(meta.family))) return false;
    return true;
  };
}

/** Read and parse one file; never throws. `file.text` (from discovery) saves a second read. */
export function loadDoc(file) {
  const nonShipped = file.nonShipped ?? isNonShippedFile(file.rel || '');
  try {
    const text = typeof file.text === 'string' ? file.text : readText(file.abs, '');
    const doc = parseDocument(file.abs, text, { rel: file.rel });
    doc.nonShipped = nonShipped;
    return doc;
  } catch (err) {
    return { file: file.abs, rel: file.rel, ext: path.extname(file.abs), text: '', code: '', pos: () => ({ line: 1, col: 1 }), lineOf: () => 1, elements: [], texts: [], strings: [], imports: [], sheets: [], inlineStyles: [], classTokens: [], nonShipped, errors: [String(err.message || err)] };
  }
}

function prePass(docs, ctx, { root, fast }) {
  const st = ctx.state;
  st.customProps = new Map();
  for (const doc of docs) {
    for (const r of cssRules(doc)) {
      for (const d of r.decls) {
        if (d.prop.startsWith('--') && !st.customProps.has(d.prop)) st.customProps.set(d.prop, d.value);
        if (d.prop === 'font-size' && /^(?:html|:root)$/.test(r.selector.trim())) {
          const m = d.value.match(/^(\d*\.?\d+)(px|%)$/);
          if (m) st.rootPx = m[2] === '%' ? (Number(m[1]) / 100) * 16 : Number(m[1]);
        }
      }
    }
    motionFamily.collectReduceInfo(doc, st);
    a11yFamily.collectFocusVisible(doc, st);
    i18nFamily.collectI18n(doc, st);
  }
  if (fast && root) {
    // The hook lints one file: read the usual global stylesheets for a reduce reset and a shared focus style.
    for (const rel of GLOBAL_STYLES) {
      const p = path.join(root, rel);
      if (!exists(p)) continue;
      try {
        const text = readText(p, '');
        const sheet = parseCss(text, { lang: 'css' });
        const fake = { sheets: [{ sheet, kind: 'stylesheet' }], inlineStyles: [], pos: () => ({ line: 1, col: 1 }) };
        motionFamily.collectReduceInfo(fake, st);
        a11yFamily.collectFocusVisible(fake, st);
        for (const r of sheet.rules) for (const d of r.decls) if (d.prop.startsWith('--') && !st.customProps.has(d.prop)) st.customProps.set(d.prop, d.value);
      } catch {
        // A global stylesheet that cannot be read only weakens the coverage check.
      }
    }
  }
}

function familiesByType(docs) {
  const out = {};
  for (const d of docs) {
    const t = d.ext || path.extname(d.file || '');
    const fams = new Set(out[t] || []);
    if (d.sheets.length || d.inlineStyles.length) ['tokens', 'motion', 'tells'].forEach((f) => fams.add(f));
    if (d.elements.length || d.classTokens.length) ['tells', 'tokens', 'motion', 'a11y'].forEach((f) => fams.add(f));
    if (d.texts.length || d.strings.length) ['copy'].forEach((f) => fams.add(f));
    if (d.code && d.code.trim()) ['a11y', 'motion'].forEach((f) => fams.add(f));
    fams.add('i18n');
    out[t] = [...fams].sort();
  }
  return out;
}

function shortTitle(meta, raw) {
  const t = `${raw.id} ${meta.title}: ${raw.message}`;
  return t.length > 200 ? `${t.slice(0, 199)}…` : t;
}

/**
 * Build a finding-shaped hit (ARCHITECTURE §8.6) from a raw report. Gate-level hits list their WCAG success criteria
 * as criteria. Advisory and possible hits never fail anything, so their WCAG references go in `tags` (`wcag:2.4.7`):
 * a `wcag` criterion on an active finding marks that success criterion failed in the coverage matrix.
 */
export function makeHit(raw, version) {
  const meta = RULE_META[raw.id];
  const rule = ruleData()[raw.id] || null;
  const tell = tellData()[raw.id] || null;
  const level = raw.level || meta.level;
  const gating = level === 'gate' || level === 'soft';
  const wcag = [...new Set([...(meta.wcag || []), ...(raw.wcag || []), ...((rule && rule.wcag && !meta.criterion) ? String(rule.wcag).split(/,\s*/).filter((x) => /^\d\.\d+\.\d+$/.test(x) && (!raw.wcag || raw.wcag.includes(x))) : [])])];
  const related = meta.criterion && meta.criterion.kind === 'wcag' ? [meta.criterion.id, ...wcag] : wcag;
  const primary = meta.criterion && gating ? { ...meta.criterion, primary: true } : { kind: 'rule', id: raw.id, primary: true };
  const criteria = [primary, ...(gating ? wcag.filter((w) => !(primary.kind === 'wcag' && primary.id === w)).map((id) => ({ kind: 'wcag', id })) : [])];
  const provisional = raw.id === 'SLP-09' ? ' Provisional hard tell (rated weak alone): the owner may disposition it with a reason, as for a soft tell.' : '';
  const description = `${raw.message}.${raw.detail ? ` ${raw.detail}.` : ''}${provisional} Found by the static source scan (uie lint)${level === 'advisory' ? '; advisory, never gates' : level === 'possible' ? '; experimental tell, reported as possible only and never counted' : ''}.`;
  const hit = {
    title: shortTitle(meta, raw),
    description: description.length >= 10 ? description : `${description} (lint)`,
    problem_type: raw.problemType || 'single_location',
    criteria,
    locations: [{ route: '', snippet: raw.snippet || '', source: { file: raw.file, line: raw.line ?? null, col: raw.col ?? null, method: 'lint', confidence: 'high' } }],
    evidence: [{ type: 'measurement', value: raw.value ?? null, detail: raw.detail || raw.message, ...(raw.nearest ? { nearest_token: raw.nearest } : {}) }],
    found_by: [{ role: 'tool', method: 'tool', check: 'lint', engine: { name: 'uie-lint', version } }],
    evidence_level: 'E1',
    severity: { source: 'rule', value: rule?.default_severity ?? tell?.default_severity ?? 1 },
    gate: gating ? rule?.gate || tell?.gate || null : null,
    level,
    recommendation: raw.fix || meta.fix,
    tags: ['lint', meta.family, ...(level === 'soft' ? ['soft-tell'] : []), ...(level === 'possible' ? ['possible'] : []), ...(raw.requested ? ['requested'] : []), ...(gating ? [] : related.map((w) => `wcag:${w}`))],
  };
  // Same flags as browser hits (browser/hits.mjs): advisory rules never gate; experimental tells are "possible".
  if (level === 'advisory' || level === 'possible') hit.advisory = true;
  if (level === 'possible') hit.possible = true;
  if (raw.requested) hit.requested = raw.requested;
  if (raw.variant) hit.variant = raw.variant;
  return hit;
}

/**
 * Lint a set of files.
 * @param {{ root:string, files:{abs:string, rel:string}[], fonts?:{abs:string, rel:string}[], project:object, rules?:string[]|null,
 *           fast?:boolean, version?:string, cap?:number }} opts
 */
export function lint(opts) {
  const t0 = Date.now();
  const { root, files, fonts = [], project, fast = false, version = 'dev' } = opts;
  const filter = Array.isArray(opts.rules) ? ruleFilter(opts.rules) : opts.rules || null;
  const enabled = makeEnabled(filter, fast);
  const docs = files.map(loadDoc);
  const ctx = { root, project, enabled, fast, state: {}, metrics: {}, fonts };
  prePass(docs, ctx, { root, fast });
  const raws = [];
  const errors = [];
  const report = (id, doc, offset, info = {}) => {
    if (!RULE_META[id] || !enabled(id)) return;
    let line = info.line ?? null;
    let col = info.col ?? null;
    if (offset !== null && offset !== undefined && doc.pos) {
      const p = doc.pos(offset);
      line = p.line;
      col = p.col;
    }
    let snippet = info.snippet;
    if (snippet === undefined && doc.text && offset !== null && offset !== undefined) {
      const a = doc.text.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
      let b = doc.text.indexOf('\n', offset);
      if (b < 0) b = doc.text.length;
      snippet = doc.text.slice(a, b).trim().slice(0, 200);
    }
    raws.push({ id, file: doc.rel, line, col, offset, snippet: snippet || '', ...info });
  };
  for (const doc of docs) {
    for (const e of doc.errors || []) errors.push({ file: doc.rel, error: e });
    for (const [name, fam] of Object.entries(FAMILIES)) {
      try {
        fam.checkFile(doc, ctx, report);
      } catch (err) {
        errors.push({ file: doc.rel, family: name, error: String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ') });
      }
    }
  }
  for (const [name, fam] of Object.entries(FAMILIES)) {
    if (!fam.checkProject) continue;
    try {
      fam.checkProject(docs, ctx, report);
    } catch (err) {
      errors.push({ family: name, error: String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ') });
    }
  }
  // De-duplicate, mark requested tells, cap per rule, sort.
  const accepted = project.design?.acceptedIds || new Set();
  const seen = new Set();
  const counts = {};
  const truncated = {};
  const kept = [];
  for (const r of raws) {
    const key = `${r.id}|${r.file}|${r.line}|${r.col}|${r.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const tell = tellData()[r.id];
    if (accepted.has(r.id) && !(tell && tell.acceptable_via_brief === false)) r.requested = { reason: project.design.accepted.get(r.id)?.reason || 'accepted in DESIGN.md' };
    counts[r.id] = (counts[r.id] || 0) + 1;
    if (counts[r.id] > (opts.cap ?? PER_RULE_CAP)) {
      truncated[r.id] = (truncated[r.id] || 0) + 1;
      continue;
    }
    kept.push(r);
  }
  kept.sort((a, b) => {
    const la = LEVEL_ORDER[RULE_META[a.id].level] ?? 9;
    const lb = LEVEL_ORDER[RULE_META[b.id].level] ?? 9;
    return la - lb || a.id.localeCompare(b.id, 'en', { numeric: true }) || String(a.file).localeCompare(String(b.file)) || (a.line ?? 0) - (b.line ?? 0) || (a.col ?? 0) - (b.col ?? 0);
  });
  const hits = kept.map((r) => makeHit(r, version));
  const summary = { gate: 0, soft: 0, advisory: 0, possible: 0, requested: 0, by_rule: {} };
  hits.forEach((h, i) => {
    const id = kept[i].id;
    summary.by_rule[id] = (summary.by_rule[id] || 0) + 1;
    if (h.requested) summary.requested += 1;
    else summary[h.level] += 1;
  });
  return {
    hits,
    raws: kept,
    summary,
    truncated,
    metrics: ctx.metrics,
    cjk_detected: i18nFamily.cjkInScope(ctx),
    families_by_type: familiesByType(docs),
    files: docs.length,
    errors,
    unknown_rules: filter ? filter.unknown : [],
    duration_ms: Date.now() - t0,
  };
}

