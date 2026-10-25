// uie next — read a run's files and say where the audit stands and which command comes next. A lead runs about fifteen
// `uie` steps by hand per audit, and a step taken out of order (a merge before every output arrived, a rating before the
// verdicts) costs turns (review of 2026-10-24, S4).
import fs from 'node:fs';
import path from 'node:path';
import { readJson, exists } from '../util/fs.mjs';
import { resolveRun, readRegister, verifierFiles } from '../project.mjs';
import { SCRIPTS_DIR } from '../cli.mjs';
import { unverifiedCandidates } from '../findings/register.mjs';
import { arrived } from './wait.mjs';
import { readJudgedOutputs } from '../findings/merge.mjs';

export const argSpec = { boolean: ['json', 'quiet'] };
export const help = `uie next [--run <id>]

Reads the run (latest by default) and prints each audit step as done or not, then the next command to run, in the
form the sandbox accepts (an absolute path, no variables). It reads files only and changes nothing.`;

const INSPECTORS = new Set(['heuristic-evaluator', 'walkthrough-evaluator', 'design-critic', 'accessibility-auditor', 'code-reviewer']);
const mtime = (p) => (exists(p) ? fs.statSync(p).mtimeMs : 0);

/** The audit's steps for a run, each { step, done, detail, next }; `next` is the command that does the step. */
export function auditState(runDir, register) {
  const uie = (args) => `node "${path.join(SCRIPTS_DIR, 'uie.mjs')}" ${args}`;
  const manifest = readJson(path.join(runDir, 'manifest.json'), {});
  const checks = readJson(path.join(runDir, 'checks.json'), { checks: {} }).checks || {};
  const log = readJson(path.join(runDir, 'packets', '.log.json'), { packets: [] });
  const latest = new Map();
  for (const e of log.packets || []) latest.set(e.output, e);
  const built = [...latest.values()];
  const inspectorPackets = built.filter((e) => INSPECTORS.has(e.role));
  const missing = inspectorPackets.filter((e) => !arrived(e.output));
  const outputs = readJudgedOutputs(runDir).filter((o) => o.role !== 'feedback').length;
  const mergedPath = path.join(runDir, 'merged.json');
  const merged = readJson(mergedPath, null);
  const outputsNewer = inspectorPackets.some((e) => mtime(e.output) > mtime(mergedPath));
  const proposals = (merged?.proposals || []).filter((p) => !p.applied && !p.rejected);
  const verifierPackets = built.filter((e) => e.role === 'finding-verifier');
  const verifierMissing = verifierPackets.filter((e) => !arrived(e.output));
  const unchecked = merged ? unverifiedCandidates(merged.findings) : [];
  const toSplit = (merged?.findings || []).filter((f) => f.split_required && f.status !== 'split');
  const judged = (merged?.findings || []).filter((f) => f.severity?.source !== 'rule' && ['confirmed', 'open'].includes(f.status) && !f.design_note);
  const unrated = judged.filter((f) => f.severity?.source !== 'raters');
  const raterPackets = built.filter((e) => e.role === 'severity-rater');
  const ratersMissing = raterPackets.filter((e) => !arrived(e.output));
  const promoted = (register?.findings || []).some((f) => (f.runs || []).includes(path.basename(runDir)));
  const ran = Object.entries(checks).filter(([, c]) => c.state === 'ran').map(([k]) => k);
  const steps = [
    { step: 'capture', done: !!manifest.captures?.valid, detail: manifest.captures?.valid ? `${manifest.captures.valid} capture(s)` : 'no captures recorded', next: uie('capture') },
    { step: 'deterministic checks', done: ran.length > 1, detail: ran.length ? `ran: ${ran.join(', ')}` : 'no check has run', next: `${uie('audit')} (in the background; it takes minutes)` },
    { step: 'inspector packets', done: inspectorPackets.length > 0 || outputs > 0, detail: inspectorPackets.length ? `${inspectorPackets.length} packet(s)` : outputs ? `${outputs} output(s), no packets logged` : 'none built', next: uie('packet --role heuristic-evaluator') },
    { step: 'inspector outputs', done: (inspectorPackets.length > 0 || outputs > 0) && !missing.length, detail: missing.length ? `waiting for ${missing.map((e) => e.agent).join(', ')}` : `${outputs} arrived`, next: missing.length ? uie(`wait ${missing.map((e) => `"${e.output}"`).join(' ')}`) : null },
    { step: 'merge', done: !!merged && !outputsNewer, detail: merged ? (outputsNewer ? 'an output is newer than merged.json' : `${merged.findings.length} finding(s)`) : 'not merged', next: uie('findings merge') },
    { step: 'merge proposals', done: !proposals.length, detail: proposals.length ? `${proposals.length} to review (${proposals.slice(0, 5).map((p) => p.id).join(', ')})` : 'none open', next: uie('findings merge --accept <ids of true duplicates>') },
    { step: 'verification', done: !!merged && !unchecked.length && !verifierMissing.length, detail: verifierMissing.length ? `waiting for ${verifierMissing.map((e) => e.agent).join(', ')}` : unchecked.length ? `${unchecked.length} candidate(s) without a verdict` : 'every candidate has a verdict', next: verifierMissing.length ? uie(`wait ${verifierMissing.map((e) => `"${e.output}"`).join(' ')}`) : verifierFiles(runDir).length && verifierPackets.every((e) => arrived(e.output)) && unchecked.length && verifierPackets.length ? uie('findings apply-verdicts') : uie(`packet --role finding-verifier${unchecked.length > 30 ? ' --parts 3' : ''}`) },
    { step: 'splits', done: !toSplit.length, detail: toSplit.length ? `${toSplit.map((f) => f.id).join(', ')} marked split_required` : 'none pending', next: toSplit.length ? uie(`findings split ${toSplit[0].id} --from-verdict`) : null },
    { step: 'blind ratings', done: !unrated.length && !ratersMissing.length, detail: ratersMissing.length ? `waiting for ${ratersMissing.map((e) => e.agent).join(', ')}` : unrated.length ? `${unrated.length} confirmed finding(s) not rated` : 'rated', next: ratersMissing.length ? uie(`wait ${ratersMissing.map((e) => `"${e.output}"`).join(' ')}`) : raterPackets.length && raterPackets.every((e) => arrived(e.output)) ? uie('findings rate') : uie('packet --role severity-rater --n 3') },
    { step: 'promote', done: promoted, detail: promoted ? 'in the register' : 'not promoted', next: uie('findings promote') },
    { step: 'report', done: exists(path.join(runDir, 'report.md')), detail: exists(path.join(runDir, 'report.md')) ? 'written' : 'not written', next: uie('report') },
    { step: 'gates', done: exists(path.join(runDir, 'gates.json')) && mtime(path.join(runDir, 'gates.json')) >= mtime(mergedPath), detail: exists(path.join(runDir, 'gates.json')) ? 'computed' : 'not computed', next: uie('gates') },
  ];
  return steps;
}

export async function run(args, ctx) {
  const r = resolveRun(ctx.root, args.run);
  const steps = auditState(r.dir, readRegister(ctx.root));
  const next = steps.find((s) => !s.done && s.next);
  ctx.result({ run: r.id, steps, next: next ? { step: next.step, command: next.next } : null });
  for (const s of steps) ctx.print(`${s.done ? 'done' : '    '}  ${s.step.padEnd(22)} ${s.detail}`);
  ctx.print('', next ? `next: ${next.next}` : 'every step is done; write the reply.');
  return 0;
}

