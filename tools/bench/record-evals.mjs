#!/usr/bin/env node
// Store an agent-level eval round (prepare-evals → run-headless → grade-eval) under evals/results/.
//
//   node tools/bench/record-evals.mjs <round-dir> --date <YYYY-MM-DD> [--out evals/results/agent-evals-<date>] [--grading <dir>]
//
// For every graded run it keeps grading.json, timing.json, the final reply and the run's decision files (manifest,
// merged findings, verifier verdicts, ratings, walkthrough records, gates, coverage, report, report lint, diff, fix
// review, the register, feedback themes and the study results), but no screenshots, packets or transcripts. It
// writes summary.json and summary.md: assertions passed per eval and arm, metrics (with the adjusted-Wald intervals
// grade-eval.mjs computes), tokens, cost and time. Control-arm runs (without_skill) are stored beside the skill's.
// --grading copies the graders' folder (instructions, packets, answers, agreement, consensus) to grading/. Local
// absolute paths in every stored text file become <round>, <repo>, <tmp> or ~, so the record names no machine.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, parseArgs, readJson, usage, writeJson } from './lib.mjs';

const { pos, opts } = parseArgs(process.argv.slice(2));
const round = pos[0] && path.resolve(pos[0]);
if (!round || !opts.date) usage('usage: node tools/bench/record-evals.mjs <round-dir> --date <YYYY-MM-DD> [--out <dir>]', opts.help);
const out = path.resolve(String(opts.out || path.join(ROOT, 'evals/results', `agent-evals-${opts.date}`)));

const KEEP_RUN = ['manifest.json', 'merged.json', 'verifier.json', 'gates.json', 'coverage.json', 'report.md', 'report-lint.json', 'agreement.json', 'fix-review.json', 'debrief.md', 'checks.json'];
const KEEP_DIRS = ['ratings', 'cw', 'evaluators', 'panel', 'diff', 'patches'];
const KEEP_WS = ['.ui-evaluator/findings.json', '.ui-evaluator/human-checks.json', '.ui-evaluator/debt.md', '.ui-evaluator/feedback/themes.json', '.ui-evaluator/feedback/themes-report.md', '.eval/reply.md', '.eval/source-hashes.json', '.eval/setup-log.json'];

function copy(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, filter: (s) => !/\.(png|jpe?g|webp|zip|webm)$/i.test(s) && !/\/packets(\/|$)/.test(s) });
  return true;
}

// Every run folder of the round: <eval-dir>/<arm>/run-<n>, the skill's arm first.
const runDirs = [];
for (const evalDir of fs.readdirSync(round).filter((d) => d.startsWith('eval-')).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))) {
  for (const arm of ['with_skill', 'without_skill', 'without_skill_nobrowser']) {
    const base = path.join(round, evalDir, arm);
    if (!fs.existsSync(base)) continue;
    for (const runName of fs.readdirSync(base).filter((r) => /^run-\d+$/.test(r))) runDirs.push({ evalDir, arm, runName, runDir: path.join(base, runName) });
  }
}

const rows = [];
for (const { evalDir, arm, runName, runDir } of runDirs) {
  const grading = readJson(path.join(runDir, 'grading.json'), null);
  if (!grading) continue;
  const dest = path.join(out, evalDir, arm, runName);
  copy(path.join(runDir, 'grading.json'), path.join(dest, 'grading.json'));
  copy(path.join(runDir, 'timing.json'), path.join(dest, 'timing.json'));
  copy(path.join(runDir, 'grader-answers.json'), path.join(dest, 'grader-answers.json'));
  const ws = path.join(runDir, 'workspace');
  for (const f of KEEP_WS) copy(path.join(ws, f), path.join(dest, 'workspace', f));
  for (const f of grading.metrics?.documents_written || []) copy(path.join(ws, f), path.join(dest, 'workspace', f));
  const runs = path.join(ws, '.ui-evaluator/runs');
  for (const r of fs.existsSync(runs) ? fs.readdirSync(runs).filter((x) => x !== 'LATEST') : []) {
    for (const f of KEEP_RUN) copy(path.join(runs, r, f), path.join(dest, 'runs', r, f));
    for (const d of KEEP_DIRS) copy(path.join(runs, r, d), path.join(dest, 'runs', r, d));
  }
  const decided = grading.expectations.filter((e) => e.passed !== null);
  rows.push({
    eval: grading.eval,
    name: grading.name,
    arm,
    run: runName,
    passed: decided.filter((e) => e.passed).length,
    decided: decided.length,
    total: grading.expectations.length,
    failed: decided.filter((e) => !e.passed).map((e) => e.text),
    metrics: grading.metrics,
    tokens: grading.timing?.total_tokens ?? null,
    cost_usd: grading.timing?.total_cost_usd ?? null,
    minutes: grading.timing?.wall_ms ? Math.round(grading.timing.wall_ms / 6000) / 10 : null,
    subagent_messages: grading.timing?.subagent_messages ?? null,
  });
}
if (!rows.length) usage(`no graded runs in ${round}`);
writeJson(path.join(out, 'summary.json'), { recorded_at: new Date().toISOString(), date: opts.date, runs: rows });
const pct = (v) => `${Math.round(v * 100)}%`;
const rate = (m) => (m ? `${m.x}/${m.n} = ${pct(m.value)} [${pct(m.ci95[0])}–${pct(m.ci95[1])}]` : '—');
const md = [`# Agent-level evals, ${opts.date}`, '', '| Eval | Arm | Assertions passed | Failed | Tokens | Cost (USD) | Minutes |', '|---|---|---|---|---|---|---|'];
const mtok = (t) => (Number.isFinite(t) ? `${(t / 1e6).toFixed(1)} M` : '—');
const usd = (c) => (Number.isFinite(c) ? c.toFixed(2) : '—');
for (const r of rows) md.push(`| ${r.eval} ${r.name} (${r.run}) | ${r.arm} | ${r.passed} of ${r.decided}${r.total > r.decided ? ` (+${r.total - r.decided} pending)` : ''} | ${r.failed.join('; ') || '—'} | ${mtok(r.tokens)} | ${usd(r.cost_usd)} | ${r.minutes ?? '—'} |`);
const mapped = rows.filter((r) => r.metrics?.mapped_all);
if (mapped.length) {
  // A ground truth with found defects (seeded_from "found") gives recall against the seeded set and against all of it.
  const all = mapped.some((r) => r.metrics.mapped_all.recall_by_meaning_all);
  md.push('', 'Blind mapping of every reported problem to the ground truth (adjusted-Wald 95% intervals):', '', `| Eval | Arm | Problems reported | Recall by meaning${all ? ' (seeded) | Recall by meaning (all defects)' : ''} | Precision (in the ground truth or real) | Precision (in the ground truth only) |`, `|---|---|---|---|${all ? '---|' : ''}---|---|`);
  for (const r of mapped) {
    const m = r.metrics.mapped_all;
    md.push(`| ${r.eval} | ${r.arm} | ${m.items} | ${rate(m.recall_by_meaning)}${all ? ` | ${rate(m.recall_by_meaning_all)}` : ''} | ${rate(m.precision)} | ${rate(m.precision_strict)} |`);
  }
}
fs.writeFileSync(path.join(out, 'summary.md'), `${md.join('\n')}\n`);
if (opts.grading) copy(path.resolve(String(opts.grading)), path.join(out, 'grading'));

// Scrub local paths from every stored text file: longest prefixes first.
const swaps = [[round, '<round>'], [ROOT, '<repo>'], [os.homedir(), '~']].sort((a, b) => b[0].length - a[0].length);
const TMP = /\/(?:private\/)?tmp\/claude-\d+\/[^\s"'\\]*/g;
const scrub = (dir) => {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) scrub(p);
    else if (/\.(json|jsonl|md|csv|txt|cjs|mjs|yml|patch)$/i.test(ent.name)) {
      const before = fs.readFileSync(p, 'utf8');
      let after = before;
      for (const [from, to] of swaps) after = after.split(from).join(to);
      after = after.replace(TMP, '<tmp>');
      if (after !== before) fs.writeFileSync(p, after);
    }
  }
};
scrub(out);
console.log(`recorded ${rows.length} run(s) in ${path.relative(ROOT, out)}`);
for (const l of md.slice(2)) console.log(l);
