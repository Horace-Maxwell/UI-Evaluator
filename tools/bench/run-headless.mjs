#!/usr/bin/env node
// Run the prompts from prepare-evals.mjs as top-level, non-interactive Claude Code sessions with the frozen plugin.
//
//   node tools/bench/run-headless.mjs <round-dir> [--only 19,14] [--arm with_skill|without_skill] [--parallel 2]
//                                     [--model claude-opus-5-5] [--budget 60] [--claude <path to the claude binary>]
// The binary defaults to $CLAUDE_BIN, else `claude` on PATH; it must be new enough for the model.
//
// For each run: serves its workspace on the run's port, starts `claude -p` in the workspace with the snapshot as a
// plugin directory, and writes <run>/transcript.jsonl (stream-json: every message, subagents included), stderr.log
// and timing.json ({ total_tokens, duration_ms, total_duration_seconds, total_cost_usd, num_turns, subagent_messages }).
// Tools are limited to file tools, subagents, skills and a list of shell commands; web tools and MCP servers are off,
// and the browser layer only opens local hosts. A run that already has timing.json is skipped. Control-arm runs
// (prepare-evals.mjs --baseline) get the same tools and settings without the plugin.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseArgs, readJson, usage, writeJson } from './lib.mjs';

const { pos, opts } = parseArgs(process.argv.slice(2));
const round = pos[0] && path.resolve(pos[0]);
if (!round) usage('usage: node tools/bench/run-headless.mjs <round-dir> [--only 19,14] [--arm with_skill|without_skill] [--parallel 2] [--model claude-opus-5-5] [--budget 60] [--claude <bin>]', opts.help);
const CLAUDE = String(opts.claude || process.env.CLAUDE_BIN || 'claude');
const all = readJson(path.join(round, 'eval-prompts.json'));
const only = opts.only ? String(opts.only).split(',').map(Number) : null;
const arm = opts.arm ? String(opts.arm) : null;
const queue = all.filter((p) => (!only || only.includes(p.eval)) && (!arm || (p.arm || 'with_skill') === arm));
const snapshot = path.join(round, 'plugin-snapshot');
const { serveStatic } = await import(pathToFileURL(path.join(snapshot, 'skills/ui-evaluator/scripts/lib/browser/static-server.mjs')).href);

const SHELL = ['node', 'git', 'ls', 'cat', 'head', 'tail', 'wc', 'grep', 'rg', 'find', 'mkdir', 'cp', 'mv', 'diff', 'sort', 'uniq', 'echo', 'printf', 'cd', 'sed', 'awk', 'jq', 'python3', 'shasum', 'test', 'touch', 'date', 'tee', 'xargs', 'basename', 'dirname', 'realpath', 'stat', 'file', 'tr', 'cut', 'comm'];
const TOOLS = [...SHELL.map((c) => `Bash(${c}:*)`), 'Bash(pwd)', 'Read', 'Write', 'Edit', 'MultiEdit', 'Glob', 'Grep', 'Task', 'Agent', 'Skill', 'TodoWrite'];

/** Sum token usage over every assistant message, main thread and subagents, counting each message id once. */
function summarise(file) {
  const seen = new Set();
  const tok = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  let result = null;
  let sub = 0;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (ev.type === 'result') result = ev;
    if (ev.type !== 'assistant' || !ev.message?.usage) continue;
    const id = ev.message.id || `${seen.size}`;
    if (seen.has(id)) continue;
    seen.add(id);
    if (ev.parent_tool_use_id) sub += 1;
    for (const k of Object.keys(tok)) tok[k] += Number(ev.message.usage[k] || 0);
  }
  const total = Object.values(tok).reduce((a, b) => a + b, 0);
  return {
    total_tokens: total,
    tokens: tok,
    duration_ms: result?.duration_ms ?? null,
    total_duration_seconds: result?.duration_ms ? Math.round(result.duration_ms / 100) / 10 : null,
    total_cost_usd: result?.total_cost_usd ?? null,
    num_turns: result?.num_turns ?? null,
    is_error: result?.is_error ?? null,
    subtype: result?.subtype ?? null,
    subagent_messages: sub,
  };
}

async function runOne(p) {
  const dir = path.join(round, p.run);
  if (fs.existsSync(path.join(dir, 'timing.json'))) {
    console.log(`skip ${p.run}: timing.json exists`);
    return;
  }
  // A run another runner has started is left alone: its transcript exists and has no timing.json yet.
  if (fs.existsSync(path.join(dir, 'transcript.jsonl'))) {
    console.log(`skip ${p.run}: started by another runner (delete transcript.jsonl to run it again)`);
    return;
  }
  const srv = await serveStatic(p.workspace, { port: p.port });
  const started = Date.now();
  // The control arm runs without the plugin and cannot read the snapshot.
  const plugin = p.arm === 'without_skill' ? [] : ['--plugin-dir', snapshot, '--add-dir', snapshot];
  const args = ['-p', p.prompt, ...plugin, '--model', String(opts.model || 'claude-opus-5-5'),
    '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits', '--allowedTools', TOOLS.join(' '),
    '--disallowedTools', 'WebFetch WebSearch', '--setting-sources', 'project,local', '--strict-mcp-config',
    '--max-budget-usd', String(opts.budget || 60), '--no-session-persistence'];
  console.log(`start ${p.run} (eval ${p.eval}, ${p.arm || 'with_skill'}, port ${p.port})`);
  const out = fs.openSync(path.join(dir, 'transcript.jsonl'), 'w');
  const err = fs.openSync(path.join(dir, 'stderr.log'), 'w');
  const code = await new Promise((resolve) => {
    // Print mode stops waiting for background subagents after 600 s and ends the session; an audit's lead may wait
    // longer than that for a verifier it ran in the background, so the ceiling is lifted (round 3, 2026-10-08).
    const child = spawn(CLAUDE, args, { cwd: p.workspace, stdio: ['ignore', out, err], env: { ...process.env, CI: '1', CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0' } });
    child.on('exit', (c) => resolve(c));
    child.on('error', (e) => {
      fs.writeSync(err, `spawn failed: ${e.message}\n`);
      resolve(-1);
    });
  });
  fs.closeSync(out);
  fs.closeSync(err);
  await srv.close();
  const timing = { ...summarise(path.join(dir, 'transcript.jsonl')), exit_code: code, wall_ms: Date.now() - started };
  writeJson(path.join(dir, 'timing.json'), timing);
  console.log(`done  ${p.run}: exit ${code}, ${Math.round(timing.wall_ms / 60000)} min, ${timing.total_tokens} tokens, $${timing.total_cost_usd ?? '?'}`);
}

const parallel = Math.max(1, Number(opts.parallel || 1));
const pending = [...queue];
await Promise.all(Array.from({ length: Math.min(parallel, pending.length) }, async () => {
  while (pending.length) await runOne(pending.shift());
}));
console.log(`finished ${queue.length} run(s)`);
