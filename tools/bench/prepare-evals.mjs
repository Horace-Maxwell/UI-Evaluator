#!/usr/bin/env node
// Set up an agent-level eval round for the non-build evals (audit, ingest, study, fix, verify, report):
// a frozen copy of the plugin, one workspace per run built from the eval's fixtures as evals/README.md describes,
// the eval's setup steps run against the frozen CLI, and one prompt per run for a top-level session.
//
//   node tools/bench/prepare-evals.mjs <round-dir> --evals 9,11,12,14,19 [--runs 1] [--port 4601] [--baseline [--no-browser]]
//
// Writes <round>/plugin-snapshot (the plugin as it is now: .claude-plugin, agents, commands, hooks, skills),
// <round>/<eval-dir>/with_skill/run-<n>/workspace and <round>/eval-prompts.json. The workspaces are git repositories
// with one commit, so fix evals can show patches without commits; .eval/source-hashes.json records every site file.
// Run the prompts with tools/bench/run-headless.mjs: each needs a top-level session, because the audit's isolated
// roles are subagents and subagents cannot start subagents of their own.
//
// --baseline prepares the control arm instead, in <eval-dir>/without_skill/: the same site, PRODUCT.md, DESIGN.md,
// attachments and journey files (in journeys/, as the user's own documents), no .ui-evaluator/, and the same prompt
// without the plugin lines. Only evals without setup steps have a baseline, since their setup runs the skill.
// --baseline --no-browser prepares a second control arm, without_skill_nobrowser: the same, run by run-headless.mjs
// with a PATH that holds only the system tools, so no Playwright, Node or npx is reachable (round 3 showed the control
// finding Python Playwright on the machine and driving the site with it).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, SKILL_DIR, evalDirName, loadEvals, parseArgs, usage, writeJson } from './lib.mjs';

const { pos, opts } = parseArgs(process.argv.slice(2));
const round = pos[0] && path.resolve(pos[0]);
const ids = String(opts.evals || '').split(',').filter(Boolean).map(Number);
if (!round || !ids.length) usage('usage: node tools/bench/prepare-evals.mjs <round-dir> --evals 9,11,12,14,19 [--runs 1] [--port 4601] [--baseline [--no-browser]]', opts.help);
if (round.startsWith(`${ROOT}${path.sep}`)) usage('put the round outside the repository, so runs cannot read the ground truth');
const runs = Number(opts.runs || 1);
const baseline = !!opts.baseline;
const noBrowser = baseline && !!opts['no-browser'];
const arm = baseline ? (noBrowser ? 'without_skill_nobrowser' : 'without_skill') : 'with_skill';
const evals = loadEvals();
const chosen = ids.map((id) => evals.find((e) => e.id === id) || usage(`eval ${id} is not in evals/evals.json`));
const builds = chosen.filter((e) => e.name.startsWith('build-'));
if (builds.length) usage(`build evals use tools/bench/prepare-round.mjs: ${builds.map((e) => e.id).join(', ')}`);
const withSetup = baseline ? chosen.filter((e) => e.setup?.length) : [];
if (withSetup.length) usage(`no baseline for evals whose setup runs the skill: ${withSetup.map((e) => e.id).join(', ')}`);

// The plugin as it is now. Later edits to the repository cannot reach running evals.
const snapshot = path.join(round, 'plugin-snapshot');
if (!fs.existsSync(snapshot)) {
  for (const part of ['.claude-plugin', 'agents', 'commands', 'hooks', 'skills', 'LICENSE', 'NOTICE.md']) {
    const src = path.join(ROOT, part);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(snapshot, part), { recursive: true, filter: (s) => !/(^|\/)(node_modules|\.DS_Store)$/.test(s) });
  }
  // The browser runtime is resolved from the skill's scripts/node_modules when present; link it rather than copy.
  const nm = path.join(SKILL_DIR, 'scripts/node_modules');
  if (fs.existsSync(nm)) fs.symlinkSync(nm, path.join(snapshot, 'skills/ui-evaluator/scripts/node_modules'));
}
const UIE = path.join(snapshot, 'skills/ui-evaluator/scripts/uie.mjs');
const { serveStatic } = await import(pathToFileURL(path.join(snapshot, 'skills/ui-evaluator/scripts/lib/browser/static-server.mjs')).href);

const META = new Set(['fixture.json', 'ground-truth.json', 'PRODUCT.md', 'DESIGN.md', 'journeys', 'labels.json']);
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function copySite(fixtureDir, dest) {
  const copied = [];
  for (const ent of fs.readdirSync(fixtureDir, { withFileTypes: true })) {
    if (META.has(ent.name) || ent.name === '.DS_Store') continue;
    fs.cpSync(path.join(fixtureDir, ent.name), path.join(dest, ent.name), { recursive: true });
    copied.push(ent.name);
  }
  return copied;
}

function listFiles(dir, base = dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) listFiles(p, base, out);
    else out.push(path.relative(base, p));
  }
  return out;
}

/** Run a shell step without blocking the event loop: the site is served from this same process meanwhile. */
function shAsync(cmd, cwd) {
  return new Promise((resolve) => {
    const child = spawn('/bin/sh', ['-c', cmd], { cwd });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('exit', (code) => resolve({ status: code, stdout: out, stderr: err }));
  });
}

function sh(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' };
}

/**
 * One workspace: the site fixture at the root, PRODUCT.md, a configured .ui-evaluator/, journeys, attachments.
 * The control arm gets the same files with the journeys in journeys/ and no .ui-evaluator/.
 */
async function prepareWorkspace(e, ws, port) {
  const fixtures = (e.files || []).map((f) => path.join(ROOT, f));
  const siteFixture = fixtures.find((d) => fs.existsSync(path.join(d, 'fixture.json')));
  if (!siteFixture) throw new Error(`eval ${e.id} names no site fixture`);
  fs.mkdirSync(ws, { recursive: true });
  const fixture = JSON.parse(fs.readFileSync(path.join(siteFixture, 'fixture.json'), 'utf8'));
  copySite(siteFixture, ws);
  for (const f of ['PRODUCT.md', 'DESIGN.md']) if (fs.existsSync(path.join(siteFixture, f))) fs.copyFileSync(path.join(siteFixture, f), path.join(ws, f));
  if (baseline && fs.existsSync(path.join(siteFixture, 'journeys'))) fs.cpSync(path.join(siteFixture, 'journeys'), path.join(ws, 'journeys'), { recursive: true });
  // The site's files plus PRODUCT.md and DESIGN.md: the skill may propose changes to those two but never overwrite them.
  const siteFiles = listFiles(ws);

  // Attachments: data fixtures (no fixture.json) go to inputs/, without their labels.
  const attachments = [];
  for (const d of fixtures.filter((x) => x !== siteFixture)) {
    for (const f of fs.readdirSync(d)) {
      if (META.has(f) || f.startsWith('.')) continue;
      fs.mkdirSync(path.join(ws, 'inputs'), { recursive: true });
      fs.copyFileSync(path.join(d, f), path.join(ws, 'inputs', f));
      attachments.push(`inputs/${f}`);
    }
  }

  if (!baseline) {
    const init = sh(process.execPath, [UIE, 'init', '--quiet'], ws);
    if (init.code !== 0) throw new Error(`uie init failed in ${ws}: ${init.err}`);
    const cfgPath = path.join(ws, '.ui-evaluator/config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    cfg.project = { ...(cfg.project || {}), name: fixture.product || fixture.name, work: 'existing' };
    cfg.app = { ...(cfg.app || {}), cwd: '.', base_url: `http://127.0.0.1:${port}` };
    delete cfg.app.start;
    cfg.routes = fixture.routes.map((r) => ({ path: r.path, surface: r.surface || r.path, mode: r.mode, states: r.states?.length ? r.states : [{ name: 'default', actions: [] }] }));
    cfg.matrix = { ...(cfg.matrix || {}), themes: fixture.themes || ['light'] };
    if (fixture.locales) cfg.locales = fixture.locales;
    fs.writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`);
    if (fs.existsSync(path.join(siteFixture, 'journeys'))) fs.cpSync(path.join(siteFixture, 'journeys'), path.join(ws, '.ui-evaluator/journeys'), { recursive: true });
  }

  // The eval's setup steps, served the way the run will be served.
  const setupLog = [];
  if (e.setup?.length) {
    const srv = await serveStatic(ws, { port });
    try {
      for (const step of e.setup) {
        const cmd = step.startsWith('uie ') ? `"${process.execPath}" "${UIE}" ${step.slice(4)}` : step;
        const r = await shAsync(cmd, ws);
        setupLog.push({ step, code: r.status, tail: `${r.stdout}${r.stderr}`.trim().split('\n').slice(-3).join(' | ') });
        if (r.status === 1) throw new Error(`setup step failed in ${ws}: ${step}\n${r.stderr || r.stdout}`);
      }
    } finally {
      await srv.close();
    }
  }

  // Hashes of the site files as they stand after setup (eval 12's setup edits styles.css on purpose).
  const hashes = Object.fromEntries(siteFiles.map((f) => [f, sha(path.join(ws, f))]));
  writeJson(path.join(ws, '.eval/source-hashes.json'), hashes);
  writeJson(path.join(ws, '.eval/setup-log.json'), setupLog);
  writeJson(path.join(ws, '.eval/run.json'), { arm, port, base: `http://127.0.0.1:${port}`, attachments });
  fs.writeFileSync(path.join(ws, '.gitignore'), '.eval/\n');
  for (const args of [['init', '-q'], ['add', '-A'], ['-c', 'user.name=eval-harness', '-c', 'user.email=eval@localhost', 'commit', '-q', '-m', 'eval baseline']]) {
    const r = sh('git', args, ws);
    if (r.code !== 0) throw new Error(`git ${args[0]} failed in ${ws}: ${r.err}`);
  }
  return { attachments, base: `http://127.0.0.1:${port}` };
}

const prompt = ({ ws, base, attachments, reply, request }) => `You are being evaluated on a real user request. Carry it out completely, as Claude Code would for this user.

Setup for this run:
- The UI-Evaluator plugin is loaded in this session: the ui-evaluator skill, its agents (ui-evaluator:<role>) and its commands. Use it for this request. Do not use any other skill or plugin.
- Everywhere the skill writes \`uie\`, run \`node ${UIE}\`. Never modify anything under ${snapshot}. Never read or modify anything under ${ROOT}, and nothing in ${path.dirname(path.dirname(path.dirname(path.dirname(ws))))} outside your project directory and the plugin.
- Your project directory is ${ws}, the current directory. The site's files are in it, and the site is already served at ${base} for the whole run: do not start or stop servers. .ui-evaluator/config.json is set up for this site.${attachments.length ? `\n- The user attached: ${attachments.join(', ')}.` : ''}
- The user cannot answer questions in this run. Wherever the skill would ask the user, take its non-interactive path: infer, label what you inferred, and proceed.
- Isolated subagents are available: spawn the plugin's agents as the skill describes.
- The browser runtime is installed, and \`uie doctor\` works.
- When you finish, write your final reply to the user (what you would say in chat, in the user's language) to ${reply}.

User request:
${request}`;

// The control arm's prompt: the same lines, less the ones about the plugin.
const baselinePrompt = ({ ws, base, attachments, reply, request }) => `You are being evaluated on a real user request. Carry it out completely, as Claude Code would for this user.

Setup for this run:
- No skill or plugin is loaded in this session. Do not use any skill or plugin; work with your own tools.
- Never read or modify anything under ${ROOT}, and nothing in ${path.dirname(path.dirname(path.dirname(path.dirname(ws))))} outside your project directory.
- Your project directory is ${ws}, the current directory. The site's files are in it, and the site is already served at ${base} for the whole run: do not start or stop servers.${attachments.length ? `\n- The user attached: ${attachments.join(', ')}.` : ''}
- The user cannot answer questions in this run. Wherever you would ask the user, infer, label what you inferred, and proceed.
- Subagents are available.
- When you finish, write your final reply to the user (what you would say in chat, in the user's language) to ${reply}.

User request:
${request}`;

// Prompts already written for this round are kept; runs prepared now replace their own entries.
const promptsFile = path.join(round, 'eval-prompts.json');
const byRun = new Map((fs.existsSync(promptsFile) ? JSON.parse(fs.readFileSync(promptsFile, 'utf8')) : []).map((p) => [p.run, p]));
let port = Number(opts.port || 4601);
for (const e of chosen) {
  for (let n = 1; n <= runs; n += 1) {
    const dir = path.join(round, evalDirName(e), arm, `run-${n}`);
    const ws = path.join(dir, 'workspace');
    const complete = fs.existsSync(path.join(ws, '.git')) && fs.existsSync(path.join(ws, '.eval/source-hashes.json'));
    let info;
    if (complete) {
      const saved = fs.existsSync(path.join(ws, '.eval/run.json')) ? JSON.parse(fs.readFileSync(path.join(ws, '.eval/run.json'), 'utf8')) : null;
      const base = saved?.base || JSON.parse(fs.readFileSync(path.join(ws, '.ui-evaluator/config.json'), 'utf8')).app.base_url;
      port = Number(new URL(base).port);
      const inputs = fs.existsSync(path.join(ws, 'inputs')) ? fs.readdirSync(path.join(ws, 'inputs')).map((f) => `inputs/${f}`) : [];
      info = { attachments: inputs, base };
      console.log(`reused ${ws} on port ${port}`);
    } else {
      if (fs.existsSync(ws)) usage(`${ws} is incomplete (an earlier preparation failed); delete it and run again`);
      info = await prepareWorkspace(e, ws, port);
      console.log(`prepared ${ws} on port ${port}`);
    }
    const reply = path.join(ws, '.eval/reply.md');
    const run = path.relative(round, dir);
    const write = baseline ? baselinePrompt : prompt;
    byRun.set(run, { run, eval: e.id, name: e.name, arm, no_browser: noBrowser || undefined, workspace: ws, port, prompt: write({ ws, base: info.base, attachments: info.attachments, reply, request: e.prompt }) });
    port += 1;
  }
}
const prompts = [...byRun.values()].sort((a, b) => a.run.localeCompare(b.run));
const ports = prompts.map((p) => p.port);
if (new Set(ports).size !== ports.length) usage(`two runs share a port: ${ports.join(', ')}; prepare with a different --port`);
writeJson(promptsFile, prompts);
console.log(`${prompts.length} run(s) in ${promptsFile}; plugin frozen in ${snapshot}`);
