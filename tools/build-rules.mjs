#!/usr/bin/env node
// Build skills/ui-evaluator/assets/data/rules.json from docs/framework/QUALITY-BAR.md (the canonical
// statement of every gate criterion) plus the machine overlay below. Run after editing QUALITY-BAR.
// `node tools/build-rules.mjs --check` exits 1 when rules.json is out of date (used in tests/CI).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QB = path.join(ROOT, 'docs/framework/QUALITY-BAR.md');
const OUT = path.join(ROOT, 'skills/ui-evaluator/assets/data/rules.json');

// Machine-only fields: gate membership comes from the section; these add evaluation details.
// default_severity: rule-declared severity for deterministic findings (ADR-010) [calibrating].
// check: the uie audit check (or source) that produces evidence; eval: how the gate engine decides.
const OVERLAY = {
  'EVD-01': { eval: 'manifest' }, 'EVD-02': { eval: 'doctor' }, 'EVD-03': { eval: 'captures' }, 'EVD-04': { eval: 'meta' },
  'EVD-05': { eval: 'anchors' }, 'EVD-06': { eval: 'report-lint' }, 'EVD-07': { eval: 'independence' }, 'EVD-08': { eval: 'freshness' },
  'FUN-01': { check: 'routes', sev: 4 }, 'FUN-02': { check: 'console', sev: 3 }, 'FUN-03': { eval: 'journeys', check: 'journeys', sev: 4 },
  'FUN-04': { check: 'media', sev: 3 }, 'FUN-05': { check: 'layout', sev: 3 }, 'FUN-06': { check: 'layout', sev: 3 },
  'FUN-07': { check: 'vitals', sev: 2 }, 'FUN-08': { check: 'vitals', sev: 1, advisory: true },
  'A11Y-01': { check: 'axe', sev: 3 }, 'A11Y-02': { eval: 'axe-incomplete' }, 'A11Y-03': { check: 'keyboard', sev: 4 },
  'A11Y-04': { check: 'keyboard', sev: 3 }, 'A11Y-05': { check: 'keyboard', sev: 3 }, 'A11Y-06': { check: 'dialogs', sev: 3 },
  'A11Y-07': { check: 'layout', sev: 3 }, 'A11Y-08': { check: 'layout', sev: 2 }, 'A11Y-09': { check: 'layout', sev: 3 },
  'A11Y-10': { check: 'targets', sev: 2 }, 'A11Y-11': { check: 'contrast', sev: 3 }, 'A11Y-12': { check: 'contrast', sev: 2 },
  'A11Y-13': { check: 'forms', sev: 3 }, 'A11Y-14': { check: 'forms', sev: 3 }, 'A11Y-15': { check: 'live-regions', sev: 2 },
  'A11Y-16': { check: 'lang', sev: 2 }, 'A11Y-17': { check: 'lint', sev: 3 }, 'A11Y-18': { check: 'cross-page', sev: 2 },
  'A11Y-19': { eval: 'auditor', check: 'cvd', sev: 3 }, 'A11Y-20': { eval: 'coverage-matrix' }, 'A11Y-21': { eval: 'human-wcag', level: 'L3' }, 'A11Y-27': { eval: 'judged-wcag', sev: 3 },
  'TYP-01': { check: 'census', sev: 2 }, 'TYP-02': { check: 'census', sev: 2 }, 'TYP-03': { check: 'census', sev: 2 },
  'TYP-04': { check: 'census', sev: 2 }, 'TYP-05': { check: 'census', sev: 1 }, 'TYP-06': { check: 'census', sev: 2 },
  'TYP-07': { check: 'census', sev: 2 }, 'TYP-08': { check: 'census', sev: 1 }, 'TYP-09': { check: 'census', sev: 1 },
  'TYP-10': { check: 'census', sev: 1 },
  'COL-01': { check: 'lint', sev: 1 }, 'COL-02': { check: 'contrast', sev: 2 }, 'COL-03': { check: 'palette', sev: 1 }, 'COL-04': { check: 'census', sev: 2 },
  'LAY-01': { check: 'census', sev: 1 }, 'LAY-02': { check: 'census', sev: 1 }, 'LAY-03': { check: 'census', sev: 1 },
  'LAY-04': { check: 'census', sev: 1 }, 'LAY-05': { check: 'census', sev: 2 },
  'SHP-01': { check: 'census', sev: 1 }, 'SHP-02': { check: 'census', sev: 1 },
  'MOT-01': { check: 'motion', sev: 1 }, 'MOT-02': { check: 'motion', sev: 2 }, 'MOT-03': { check: 'motion', sev: 2 },
  'MOT-04': { check: 'motion', sev: 3 }, 'MOT-05': { check: 'motion', sev: 3 }, 'MOT-06': { check: 'motion', sev: 1 }, 'MOT-07': { check: 'motion', sev: 2 },
  'CMP-01': { check: 'states', sev: 2 }, 'CMP-02': { check: 'keyboard', sev: 2, advisory: true }, 'CMP-03': { check: 'states', sev: 2 },
  'CMP-04': { check: 'states', sev: 3 }, 'CMP-05': { eval: 'tool-or-judged', check: 'states', sev: 3 }, 'CMP-06': { check: 'targets', sev: 2 },
  'CPY-01': { check: 'copy', sev: 2 }, 'CPY-02': { check: 'copy', sev: 2, waivable: false }, 'CPY-03': { check: 'copy', sev: 1 }, 'CPY-04': { check: 'forms', sev: 3 },
  'I18N-01': { check: 'i18n', sev: 2, scope: 'cjk' }, 'I18N-02': { check: 'i18n', sev: 2, scope: 'cjk' }, 'I18N-03': { check: 'lint', sev: 2 },
  'DEC-01': { eval: 'product' }, 'DEC-02': { eval: 'design' }, 'DEC-03': { eval: 'direction' }, 'DEC-04': { eval: 'ledger' },
  'USE-01': { eval: 'he-protocol' }, 'USE-02': { eval: 'consolidation' }, 'USE-03': { eval: 'verification' }, 'USE-04': { eval: 'ratings' },
  'USE-05': { eval: 'no-open-p0' }, 'USE-06': { eval: 'p1-decisions' }, 'USE-07': { eval: 'cw' }, 'USE-08': { eval: 'task-suitability' },
  'USE-09': { eval: 'coverage' }, 'USE-10': { eval: 'cross-screen' }, 'USE-11': { eval: 'hax' },
  'DES-01': { eval: 'panel-protocol' }, 'DES-02': { eval: 'specificity' }, 'DES-03': { eval: 'design-findings' },
  'DES-04': { eval: 'brand-fit' }, 'DES-05': { eval: 'pairwise' }, 'DES-06': { eval: 'rubric' }, 'DES-07': { eval: 'appeal' },
  'EMP-01': { eval: 'study-plan' }, 'EMP-02': { eval: 'formative' }, 'EMP-03': { eval: 'observed-integrated' },
  'EMP-04': { eval: 'critical-tasks' }, 'EMP-05': { eval: 'retests' }, 'EMP-06': { eval: 'honest-metrics' },
  'EMP-07': { eval: 'desirability', optional: true }, 'EMP-08': { eval: 'experiment', optional: true },
};
const HARD_SEV = { 'SLP-01': 2, 'SLP-02': 2, 'SLP-03': 2, 'SLP-04': 1, 'SLP-05': 1, 'SLP-06': 2, 'SLP-07': 1, 'SLP-08': 2, 'SLP-09': 2, 'SLP-10': 2, 'SLP-11': 2, 'SLP-12': 3, 'SLP-13': 3, 'SLP-14': 2, 'SLP-15': 1 };

const GATE_OF = (id) => {
  const pfx = id.split('-')[0];
  return { EVD: 'G0', FUN: 'G1', A11Y: 'G2', TYP: 'G3', COL: 'G3', LAY: 'G3', SHP: 'G3', MOT: 'G3', CMP: 'G3', CPY: 'G3', I18N: 'G3', DEC: 'G4', SLP: 'G4', USE: 'G5', DES: 'G6', EMP: 'G7' }[pfx];
};

function cells(line) {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const out = [];
  let cur = '';
  let code = false;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch === '`') code = !code;
    if (ch === '\\' && inner[i + 1] === '|') { cur += '|'; i += 1; continue; }
    if (ch === '|' && !code) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseQualityBar(text) {
  const lines = text.split('\n');
  const rules = [];
  let header = null;
  let section = '';
  for (let i = 0; i < lines.length; i += 1) {
    const l = lines[i];
    if (/^#{2,4} /.test(l)) section = l.replace(/^#+ /, '');
    if (!l.startsWith('|')) { header = null; continue; }
    const c = cells(l);
    if (/^-+$/.test(c[0].replace(/:/g, ''))) continue;
    if (c[0] === 'ID') { header = c.map((h) => h.toLowerCase()); continue; }
    if (!header) continue;
    const id = c[0];
    if (!/^(EVD|FUN|A11Y|TYP|COL|LAY|SHP|MOT|CMP|CPY|I18N|DEC|SLP|USE|DES|EMP)-\d{2}$/.test(id)) continue;
    const get = (name) => { const k = header.indexOf(name); return k >= 0 ? c[k] : undefined; };
    const rule = {
      id,
      gate: GATE_OF(id),
      title: get('criterion') || get('tell') || '',
      threshold: get('threshold') || get('detection summary') || null,
      verify: get('verify') || null,
      wcag: get('wcag') || null,
      sources: (get('src') || '').split(/,\s*/).filter(Boolean),
      section,
    };
    if (id.startsWith('SLP-')) {
      const n = Number(id.slice(4));
      rule.class = n <= 19 ? 'hard' : n <= 49 ? 'soft' : 'experimental';
    }
    rules.push(rule);
  }
  return rules;
}

function build() {
  const text = fs.readFileSync(QB, 'utf8');
  const parsed = parseQualityBar(text);
  const rules = {};
  for (const r of parsed) {
    const o = OVERLAY[r.id] || {};
    const advisory = !!o.advisory || /advisory/i.test(r.threshold || '') && /never fails|advisory until calibrated/i.test(r.threshold || '');
    rules[r.id] = {
      ...r,
      level: advisory ? 'advisory' : 'gate',
      calibrating: /\[calibrating\]/i.test(r.threshold || ''),
      waivable: o.waivable !== undefined ? o.waivable : !['G0', 'G1', 'G2'].includes(r.gate),
      acceptable_via_brief: r.id.startsWith('SLP-') ? !['SLP-12', 'SLP-13'].includes(r.id) : undefined,
      default_severity: o.sev ?? HARD_SEV[r.id] ?? (r.id.startsWith('SLP-') ? 1 : null),
      check: o.check || null,
      eval: o.eval || (o.check ? 'tool' : null),
      scope: o.scope || null,
      optional: !!o.optional,
      required_for: o.level || null,
    };
  }
  return { schema: 'rules', version: 1, source: 'docs/framework/QUALITY-BAR.md', count: Object.keys(rules).length, rules };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const data = build();
  const json = `${JSON.stringify(data, null, 2)}\n`;
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== json) {
      console.error('rules.json is out of date: run `node tools/build-rules.mjs`');
      process.exit(1);
    }
    console.log(`rules.json up to date (${data.count} criteria)`);
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, json);
    const missing = Object.keys(OVERLAY).filter((k) => !data.rules[k]);
    console.log(`wrote ${OUT} (${data.count} criteria)`);
    if (missing.length) console.log(`overlay ids not in QUALITY-BAR: ${missing.join(', ')}`);
  }
}
