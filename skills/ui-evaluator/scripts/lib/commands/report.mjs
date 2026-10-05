// uie report — render report.md, report.html and agree-disagree.csv; lint the language (EVD-06).
import path from 'node:path';
import { readJson, writeJson, writeText, exists, readJsonl } from '../util/fs.mjs';
import { list } from '../util/args.mjs';
import { paths, resolveRun, readRegister, appendIndex } from '../project.mjs';
import { loadRules, loadData } from '../gates/rules.mjs';
import { loadInputs, evaluateGates } from '../gates/evaluate.mjs';
import { buildCoverage } from '../gates/coverage.mjs';
import { renderReport } from '../report/render.mjs';
import { renderHtml } from '../report/html.mjs';
import { lintReport } from '../report/lint.mjs';
import { isoNow } from '../util/time.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'feedback'] };
export const help = `uie report [--run <id>] [--format md,html,csv] [--lang en]
uie report --feedback

Renders the run report from the run's files (never hand-typed), lints its language against the evidence levels
(no "users …" below E3, no causal verbs below E5, no completeness or authorship claims, no metrics from simulations),
recomputes the gates with the lint result (EVD-06), and writes report.md, report.html and agree-disagree.csv.
Lead-written prose comes from runs/<id>/debrief.md sections (Strengths, Divergent, Next steps).
--feedback writes a theme summary from .ui-evaluator/feedback/themes.json instead.
Exit 2 when the language lint finds violations.`;

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function run(args, ctx) {
  if (args.feedback) return feedbackReport(ctx);
  const r = resolveRun(ctx.root, args.run);
  const formats = list(args.format).length ? list(args.format) : ['md', 'html', 'csv'];
  const rules = loadRules();
  const wcag = loadData('wcag22', { criteria: [] });
  const register = readRegister(ctx.root);
  const agreement = readJson(path.join(r.dir, 'agreement.json'), null);
  const diff = readJson(path.join(r.dir, 'diff', 'findings.json'), null);
  const fixReview = readJson(path.join(r.dir, 'fix-review.json'), null);

  // Pass 1: render with current gates, lint the prose and the findings.
  let I = loadInputs(ctx.root, r.dir);
  let coverage = buildCoverage(I, wcag);
  writeJson(path.join(r.dir, 'coverage.json'), coverage);
  let gates = evaluateGates(I, rules, { target: I.manifest?.target_level || I.config.target_level });
  const first = renderReport({ I, gates, coverage, runId: r.id, agreement, diff, fixReview, register });
  const reportedFindings = I.runFindings.filter((f) => !['rejected', 'candidate'].includes(f.status));
  const lint = lintReport({ findings: reportedFindings, texts: first.proseForLint });
  writeJson(path.join(r.dir, 'report-lint.json'), lint);

  // Pass 2: recompute gates now that EVD-06 has evidence, then render the final report.
  I = loadInputs(ctx.root, r.dir);
  coverage = buildCoverage(I, wcag);
  gates = evaluateGates(I, rules, { target: I.manifest?.target_level || I.config.target_level });
  writeJson(path.join(r.dir, 'gates.json'), { schema: 'gates', run: r.id, computed_at: isoNow(), ...gates });
  const final = renderReport({ I, gates, coverage, runId: r.id, agreement, diff, fixReview, register });
  const written = [];
  if (formats.includes('md')) {
    writeText(path.join(r.dir, 'report.md'), final.markdown);
    written.push('report.md');
  }
  if (formats.includes('html')) {
    const lang = args.lang || I.config.locales?.default || 'en';
    writeText(path.join(r.dir, 'report.html'), renderHtml(final.markdown, { title: `UI evaluation report · ${r.id}`, lang }));
    written.push('report.html');
  }
  if (formats.includes('csv')) {
    writeText(path.join(r.dir, 'agree-disagree.csv'), `${final.csvRows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`);
    written.push('agree-disagree.csv');
  }
  appendIndex(ctx.root, `report for ${r.id}: level ${gates.achieved_label}; language lint ${lint.violations.length ? `${lint.violations.length} violation(s)` : 'clean'}`);
  ctx.result({ run: r.id, written, achieved: gates.achieved_label, lint: lint.violations });
  ctx.print(`wrote ${written.map((w) => path.relative(ctx.root, path.join(r.dir, w))).join(', ')}`, `level ${gates.achieved_label} (target ${gates.target})`);
  if (lint.violations.length) {
    ctx.print(`language lint: ${lint.violations.length} violation(s) — fix the wording at its source (the finding or debrief.md) and re-run:`);
    for (const v of lint.violations.slice(0, 12)) ctx.print(`  ${v.where} [${v.rule}] "${v.text.slice(0, 90)}" → ${v.fix}`);
    return 2;
  }
  ctx.print('language lint: clean (EVD-06)');
  return 0;
}

function feedbackReport(ctx) {
  const p = paths(ctx.root);
  const themes = readJson(p.themes, null);
  const items = exists(p.feedbackJsonl) ? readJsonl(p.feedbackJsonl) : [];
  if (!themes) {
    ctx.print('no themes yet: build them from feedback/feedback.jsonl (methods/feedback-analysis.md) and save feedback/themes.json; check them with uie feedback themes');
    return 1;
  }
  const reg = readRegister(ctx.root);
  const byId = new Map(reg.findings.map((f) => [f.id, f]));
  const itemById = new Map(items.map((i) => [i.id, i]));
  const people = new Set(items.map((i) => i.participant).filter(Boolean)).size;
  const cell = (t) => String(t ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
  const lines = ['# Feedback themes', '', `${items.length} item(s) from ${people || 'an unknown number of'} people; ${themes.themes.length} theme(s). Counts come from \`uie feedback stats\`; quotes are scrubbed and verbatim.`, ''];
  lines.push('| Theme | Prevalence | Linked findings (priority, status, severity) | Classification |', '|---|---|---|---|');
  for (const t of themes.themes) {
    const linked = (t.findings || []).map((id) => {
      const f = byId.get(id);
      return `${id} (${f?.priority || '—'}, ${f?.status || '—'}${f?.severity?.mean != null ? `, ${f.severity.mean}` : ''})`;
    });
    lines.push(`| ${cell(t.name)} | ${t.prevalence.k} of ${t.prevalence.n} | ${linked.join(', ') || 'none: candidate to reproduce'} | ${cell(t.classification || '—')} |`);
  }
  lines.push('', '## Extracts', '');
  for (const t of themes.themes) {
    lines.push(`**${cell(t.name)}**`, '');
    for (const e of (t.extracts || []).slice(0, 3)) {
      const it = itemById.get(e.feedback_id);
      const quote = e.quote || it?.quote || it?.text || '';
      lines.push(`- ${e.feedback_id} (${it?.participant || 'unknown'}, ${it?.source || '—'}): "${cell(quote).slice(0, 200)}"`);
    }
    lines.push('');
  }
  const praise = items.filter((i) => i.classification === 'praise');
  lines.push('## Praise to preserve', '', ...(praise.length ? praise.slice(0, 12).map((i) => `- ${i.id}: "${cell(i.quote || i.text).slice(0, 160)}"`) : ['- none recorded']), '');
  const unthemed = items.filter((i) => ['problem', 'bug'].includes(i.classification) && !i.theme && !(i.links || []).length);
  if (unthemed.length) lines.push('## Problem items not yet themed or linked', '', ...unthemed.slice(0, 20).map((i) => `- ${i.id} (${i.source}): "${cell(i.quote || i.text).slice(0, 140)}"`), '');
  const flagged = items.filter((i) => (i.flags || []).includes('instruction-like'));
  if (flagged.length) lines.push('## Items addressed to an AI', '', 'These were kept as data and not acted on (EVAL-044).', '', ...flagged.map((i) => `- ${i.id} (${i.source}): "${cell(i.quote || i.text).slice(0, 120)}"`), '');
  lines.push('Only a human or the original reporter marks a feedback-sourced finding resolved (ADR-020).', '');
  const lint = lintReport({ texts: themes.themes.map((t) => ({ text: `${t.name}. ${t.definition || ''}`, evidence: 'E3', where: `theme ${t.id}` })) });
  const out = path.join(p.feedback, 'themes-report.md');
  writeText(out, lines.join('\n'));
  ctx.result({ out: path.relative(ctx.root, out), themes: themes.themes.length, praise: praise.length, flagged: flagged.length, lint: lint.violations });
  ctx.print(`wrote ${path.relative(ctx.root, out)}`);
  for (const v of lint.violations) ctx.warn(`${v.where} [${v.rule}] ${v.fix}`);
  return lint.violations.length ? 2 : 0;
}
