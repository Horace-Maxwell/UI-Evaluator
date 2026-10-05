#!/usr/bin/env node
// Set up a build-benchmark round: a frozen copy of the skill, an empty project per run, and the prompt for every run.
//   node tools/bench/prepare-round.mjs <round-dir> --evals 1,2,17,18 [--runs 3] [--port 4501] [--configs with_skill,without_skill]
// Writes <round>/skill-snapshot/ui-evaluator (the skill as it is now, so later edits cannot reach running builds),
// <round>/<eval>/<config>/run-<n>/outputs/project (empty) and <round>/run-prompts.json. Give each prompt to a fresh agent;
// when it finishes, write the harness's token count and wall-clock time to <run>/timing.json
// ({"total_tokens": n, "duration_ms": n, "total_duration_seconds": n}). The prompts assume the runs are subagents, so
// isolated roles fall back to the skill's single-context mode; change that line if your runs can spawn agents.
import fs from 'node:fs';
import path from 'node:path';
import { CONFIGS, ROOT, SKILL_DIR, evalDirName, loadEvals, parseArgs, usage, writeJson } from './lib.mjs';

const { pos, opts } = parseArgs(process.argv.slice(2));
const round = pos[0] && path.resolve(pos[0]);
const ids = String(opts.evals || '').split(',').filter(Boolean).map(Number);
if (!round || !ids.length) usage('usage: node tools/bench/prepare-round.mjs <round-dir> --evals 1,2,17,18 [--runs 3] [--port 4501] [--configs with_skill,without_skill]', opts.help);
if (round.startsWith(`${ROOT}${path.sep}`)) usage('put the round outside the repository: the baseline runs must not be able to read it');
const runs = Number(opts.runs || 1);
const configs = typeof opts.configs === 'string' ? opts.configs.split(',') : CONFIGS;
if (configs.some((c) => !CONFIGS.includes(c))) usage(`--configs takes ${CONFIGS.join(' and ')}`);
const evals = loadEvals();
const chosen = ids.map((id) => evals.find((e) => e.id === id) || usage(`eval ${id} is not in evals/evals.json`));
const notBuild = chosen.filter((e) => !e.name.startsWith('build-'));
if (notBuild.length) usage(`these prompts are for build evals only; not a build: ${notBuild.map((e) => e.id).join(', ')}`);

const snapshot = path.join(round, 'skill-snapshot/ui-evaluator');
if (configs.includes('with_skill') && !fs.existsSync(snapshot)) {
  fs.cpSync(SKILL_DIR, snapshot, { recursive: true, filter: (src) => path.basename(src) !== '.DS_Store' });
}

const withSkill = ({ project, reply, port, request }) => `You are being evaluated on a real user request. Carry it out completely, as Claude Code would for this user.

Setup for this run:
- Use the UI-Evaluator skill at ${snapshot}. Read its SKILL.md first and follow it: its workflows, the files it points to, and its \`uie\` CLI. Everywhere the skill writes \`uie\`, run \`node ${path.join(snapshot, 'scripts/uie.mjs')}\`. Never modify anything under that skill directory, and never modify anything under ${ROOT}.
- Do not use the Skill tool or any other skill.
- Project directory: ${project}
  - It exists and is empty: a brand-new project.
  - Build everything there, including the skill's workspace files.
- The user cannot answer questions in this run. Wherever the skill would ask the user, take its non-interactive path: infer, label what you inferred, and proceed.
- Isolated subagents are not available. Where the skill wants isolated roles, use its degraded single-context mode exactly as SKILL.md describes.
- The browser runtime is installed, and \`uie doctor\` works.
- Other runs share this machine at the same time. If you serve the site locally, use port ${port} (base URL http://127.0.0.1:${port}), and stop only processes you started yourself.
- Scope:
  - Run the skill's workflows for this request up to and including the build workflow's mechanical self-check.
  - Then run one audit at quick depth, and at most one fix round for its deterministic findings.
  - Compute the gates and report the level actually reached.
- When you finish, write your final reply to the user (what you would say in chat) to ${reply}.

User request:
${request}

When done, reply in at most 10 lines: what you built (paths), the level reached, and anything you could not do.`;

const withoutSkill = ({ project, reply, port, request }) => `You are being evaluated on a real user request. Carry it out completely, as Claude Code would for this user.

Setup for this run:
- Do not use the Skill tool. Do not read anything under ${ROOT}, and do not read anything under ${round} except your own project directory.
- Project directory: ${project}
  - It exists and is empty: a brand-new project.
  - Build everything there.
- The user cannot answer questions in this run. Make reasonable assumptions, state them, and proceed.
- Other runs share this machine at the same time. If you serve anything locally, use port ${port}, and stop only processes you started yourself.
- When you finish, write your final reply to the user (what you would say in chat, in the user's language) to ${reply}.

User request:
${request}

When done, reply in at most 10 lines: what you built (paths) and any assumptions.`;

const prompts = [];
let port = Number(opts.port || 4501);
for (const e of chosen) {
  for (let n = 1; n <= runs; n += 1) {
    for (const config of configs) {
      const dir = path.join(round, evalDirName(e), config, `run-${n}`);
      const project = path.join(dir, 'outputs/project');
      if (fs.existsSync(project) && fs.readdirSync(project).length) {
        console.warn(`${path.relative(round, project)} is not empty; its prompt is written but the folder is left as it is`);
      }
      fs.mkdirSync(project, { recursive: true });
      const vars = { project, reply: path.join(dir, 'outputs/reply.md'), port, request: e.prompt };
      prompts.push({ run: path.relative(round, dir), description: `Build ${e.name}, ${config === 'with_skill' ? 'with the skill' : 'baseline'}, run ${n}`, port, prompt: config === 'with_skill' ? withSkill(vars) : withoutSkill(vars) });
      port += 1;
    }
  }
}
writeJson(path.join(round, 'run-prompts.json'), prompts);
console.log(`${prompts.length} run(s) prepared in ${round}; prompts in run-prompts.json${configs.includes('with_skill') ? '; skill frozen in skill-snapshot/ui-evaluator' : ''}`);
