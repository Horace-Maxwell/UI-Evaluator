#!/usr/bin/env node
// Trace checks for an agent-level eval round: what the transcripts and the skill's files show about how the agents
// used the skill (EVALUATION-PLAN §4.4, trace assertions).
//
//   node tools/bench/trace-check.mjs <round-dir> [--out <file.json>]
//
// For every with_skill run: subagents by role; black-box subagents that read the site's source; failed reads of
// schema, evidence and other files; probe steps rejected as "unknown action"; role-schema rejections; Back-button
// workarounds and hand-written browser scripts; hand-moved rating files; uses of `uie findings split` and of the
// `blocked` status; whether an empty fix queue explained itself; and, from the run files, heuristic packets that carry
// the walkthrough's answer key, archived rating batches, feedback outputs, blocked findings, recorded splits and the
// final report's language lint. Sandbox refusals are counted apart: they come from the harness, not the skill.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, readJson, usage, writeJson } from './lib.mjs';

const { pos, opts } = parseArgs(process.argv.slice(2));
const round = pos[0] && path.resolve(pos[0]);
if (!round) usage('usage: node tools/bench/trace-check.mjs <round-dir> [--out <file.json>]', opts.help);

const WHITE_BOX = new Set(['code-reviewer']);
const text = (c) => (typeof c === 'string' ? c : Array.isArray(c) ? c.map((x) => x.text || '').join('\n') : JSON.stringify(c || ''));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function list(dir, pred = () => true) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(pred) : [];
}

function checkRun(runDir) {
  const ws = path.join(runDir, 'workspace');
  const file = path.join(runDir, 'transcript.jsonl');
  if (!fs.existsSync(file)) return null;
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const calls = new Map();
  const agents = new Map();
  const results = [];
  const says = [];
  for (const e of lines) {
    if (e.type === 'assistant') {
      for (const c of e.message?.content || []) {
        if (c.type === 'tool_use') {
          calls.set(c.id, { name: c.name, input: c.input || {}, parent: e.parent_tool_use_id || null });
          if (!e.parent_tool_use_id && ['Agent', 'Task'].includes(c.name)) agents.set(c.id, { role: String(c.input.subagent_type || '').replace(/^ui-evaluator:/, ''), label: c.input.description || '', reads: [] });
        }
        if (c.type === 'text' && !e.parent_tool_use_id && c.text.trim()) says.push(c.text);
      }
    }
    if (e.type === 'user') for (const c of e.message?.content || []) if (c.type === 'tool_result') results.push({ id: c.tool_use_id, error: !!c.is_error, text: text(c.content) });
  }
  const input = (c) => (c.name === 'Bash' ? c.input.command || '' : c.name === 'Write' ? `${c.input.file_path || ''}\n${c.input.content || ''}` : c.name === 'Edit' ? `${c.input.file_path || ''}\n${c.input.new_string || ''}` : c.input.file_path || '');
  const allCalls = [...calls.values()];
  const count = (re) => allCalls.filter((c) => re.test(input(c))).length;

  // Black-box roles must not read the site's own files.
  const SRC = new RegExp(`${esc(ws)}/(?!\\.ui-evaluator|\\.eval|\\.git)[^/\\s'"]+\\.(html|js|css)\\b`);
  // A bare file name counts only as the argument of a reading command; a probe URL such as /review.html?date=… does not.
  const BARE = /\b(?:cat|head|tail|sed|grep|rg|less|awk|more)\b[^|;&\n]*?(?:^|[\s'"(])(?:\.\/)?[\w-]+\.(?:html|js|css)\b/;
  for (const c of allCalls) {
    const a = c.parent && agents.get(c.parent);
    if (!a) continue;
    const s = c.name === 'Read' ? c.input.file_path || '' : c.name === 'Bash' ? (c.input.command || '').replace(/<<'?EOF'?[\s\S]*?\nEOF/g, '') : '';
    // A file name inside a quoted string is a pattern or a URL (grep -o 'confirmed.html…'), not a file being read.
    const unquoted = s.replace(/'[^']*'|"[^"]*"/g, '""');
    if (SRC.test(s) || (c.name === 'Bash' && BARE.test(unquoted))) a.reads.push(s.slice(0, 120));
  }
  const black = [...agents.values()].filter((a) => !WHITE_BOX.has(a.role));

  // Failed reads, by what the agent was looking for.
  // Failed reads by subagents, whose paths come from packets, apart from the lead's own guesses in its run folder.
  const failed = { schema: 0, evidence: 0, other: 0, lead_evidence: 0, lead_other: 0 };
  for (const r of results) {
    const c = calls.get(r.id);
    if (!c || c.name !== 'Read' || !r.error || !/does not exist|ENOENT|no such file/i.test(r.text)) continue;
    const p = c.input.file_path || '';
    const isEvidence = /\/(evidence|probes)\/|\.(png|webp|jpg|yml)$/.test(p);
    if (!c.parent) failed[isEvidence ? 'lead_evidence' : 'lead_other'] += 1;
    else if (/\.schema\.json$|\/schemas\//.test(p)) failed.schema += 1;
    else if (isEvidence) failed.evidence += 1;
    else failed.other += 1;
  }
  const resultsMatching = (re) => new Set(results.filter((r) => re.test(r.text)).map((r) => r.id)).size;
  // A long command output may reach the agent through a saved file it then reads, so look at every result.
  const queueRuns = results.filter((r) => /findings\s+queue/.test(input(calls.get(r.id) || { input: {} })));
  const queueEmpty = results.filter((r) => /fix queue is empty/.test(r.text));

  // Run files.
  const uieDir = path.join(ws, '.ui-evaluator');
  const runIds = list(path.join(uieDir, 'runs'), (d) => d !== 'LATEST');
  let hePackets = 0;
  let heLeaks = 0;
  let batches = 0;
  let feedbackOutputs = 0;
  let feedbackAsInspector = 0;
  let splits = 0;
  for (const id of runIds) {
    const rd = path.join(uieDir, 'runs', id);
    for (const pk of list(path.join(rd, 'packets'), (d) => /^heuristic-evaluator-\d+$/.test(d))) {
      hePackets += 1;
      const js = readJson(path.join(rd, 'packets', pk, 'journeys.json'), []);
      if ((Array.isArray(js) ? js : []).some((j) => 'correct_actions' in j || 'avoided_hints' in j || 'success_condition' in j)) heLeaks += 1;
    }
    batches += list(path.join(rd, 'ratings'), (d) => /^batch-\d+$/.test(d)).length;
    for (const f of list(path.join(rd, 'evaluators'), (n) => n.endsWith('.json'))) {
      const d = readJson(path.join(rd, 'evaluators', f), {});
      if (d.role === 'feedback') feedbackOutputs += 1;
      else if ((d.candidates || []).some((c) => (c.found_by || []).some((b) => b.method === 'feedback'))) feedbackAsInspector += 1;
    }
    splits += (readJson(path.join(rd, 'splits.json'), { splits: [] }).splits || []).length;
  }
  const register = readJson(path.join(uieDir, 'findings.json'), { findings: [] });
  const blocked = register.findings.filter((f) => f.status === 'blocked');
  const lintRuns = runIds.filter((id) => fs.existsSync(path.join(uieDir, 'runs', id, 'report-lint.json'))).sort();
  const lint = lintRuns.length ? readJson(path.join(uieDir, 'runs', lintRuns.at(-1), 'report-lint.json'), null) : null;

  return {
    subagents: Object.fromEntries([...agents.values()].reduce((m, a) => m.set(a.role, (m.get(a.role) || 0) + 1), new Map())),
    black_box: { subagents: black.length, read_source: black.filter((a) => a.reads.length).map((a) => `${a.label}: ${a.reads[0]}`) },
    failed_reads: failed,
    unknown_action_errors: resultsMatching(/unknown action \\?"undefined/),
    role_schema_errors: resultsMatching(/must be one of \\?"heuristic-evaluator/),
    sandbox_refusals: resultsMatching(/requires approval|can't be checked before it runs|Permission to use Bash has been denied|Brace expansion|expansion obfuscation|Multiple directory changes/),
    back_workarounds: count(/history\.back|Alt\+Arrow(Left|Right)|Alt\+Left/),
    browser_scripts: allCalls.filter((c) => (c.name === 'Write' || c.name === 'Bash') && /require\(['"]playwright|from ['"]playwright|chromium\.launch/.test(input(c))).length,
    rating_file_moves: count(/\bmv\b[^\n]*ratings\//),
    split_commands: count(/findings\s+split\b/),
    blocked_commands: count(/--status\s+blocked\b/),
    queue: { runs: queueRuns.length, empty: queueEmpty.length, explained: queueEmpty.filter((r) => /fix queue is empty\.\s*(The register|No audit has run)/.test(r.text)).length },
    lint_narration: says.filter((s) => /\b(report|language|wording)[- ]lint\b|\blint\b[^.]{0,80}\b(phrase|wording|tool-generated|finding'?s? (text|description))/i.test(s)).length,
    he_packets: { total: hePackets, with_answer_key: heLeaks },
    rating_batches_archived: batches,
    feedback_outputs: { role_feedback: feedbackOutputs, posing_as_inspector: feedbackAsInspector },
    blocked_findings: blocked.map((f) => ({ id: f.id, priority: f.priority, on: f.blocked?.on || null, question: !!f.blocked?.question })),
    splits_recorded: splits,
    report_lint_violations: lint ? lint.violations.length : null,
  };
}

const out = {};
for (const evalDir of list(round, (d) => d.startsWith('eval-')).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))) {
  for (const runName of list(path.join(round, evalDir, 'with_skill'), (r) => /^run-\d+$/.test(r))) {
    const r = checkRun(path.join(round, evalDir, 'with_skill', runName));
    if (r) out[`${evalDir}/${runName}`] = r;
  }
}
if (opts.out) writeJson(path.resolve(String(opts.out)), out);
const row = (k, r) => [k.replace(/^eval-(\d+)-[^/]*/, 'eval $1'), r.black_box.subagents ? `${r.black_box.subagents - r.black_box.read_source.length}/${r.black_box.subagents}` : '—', `${r.failed_reads.schema}/${r.failed_reads.evidence}/${r.failed_reads.other} (lead ${r.failed_reads.lead_evidence + r.failed_reads.lead_other})`, r.unknown_action_errors, r.role_schema_errors, r.back_workarounds, r.browser_scripts, r.rating_file_moves, `${r.he_packets.with_answer_key}/${r.he_packets.total}`, r.sandbox_refusals].join(' | ');
console.log('run | black-box clean | subagent failed reads schema/evidence/other (lead) | unknown action | role schema | back workarounds | browser scripts | rating mv | HE answer key | sandbox refusals');
for (const [k, r] of Object.entries(out)) console.log(row(k, r));
