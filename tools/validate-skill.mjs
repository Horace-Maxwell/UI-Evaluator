#!/usr/bin/env node
// Packaging and content checks for the skill and the plugin wrapper (ARCHITECTURE §14). Exit 1 on any error.
// Complements `skills-ref validate` and `claude plugin validate --strict`, which check the formats themselves.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills/ui-evaluator');
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const read = (p) => fs.readFileSync(p, 'utf8');
const rel = (p) => path.relative(ROOT, p);

function walk(dir, pred, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, pred, acc);
    else if (pred(p)) acc.push(p);
  }
  return acc;
}

function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const out = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      out[key] = kv[2].replace(/^["']|["']$/g, '');
    } else if (key && /^\s+/.test(line)) out[key] += `\n${line}`;
  }
  return { fields: out, body: text.slice(m[0].length) };
}

// 1. SKILL.md frontmatter and budget (Agent Skills specification).
const skillText = read(path.join(SKILL, 'SKILL.md'));
const fm = frontMatter(skillText);
if (!fm) err('SKILL.md: no YAML front matter');
else {
  const { name, description, compatibility } = fm.fields;
  if (name !== 'ui-evaluator') err(`SKILL.md: name "${name}" must equal the directory name "ui-evaluator"`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name || '') || (name || '').length > 64) err('SKILL.md: name must be lowercase letters, digits and single hyphens, ≤ 64 characters');
  if (!description || description.length > 1024) err(`SKILL.md: description must be 1–1024 characters (has ${description?.length ?? 0})`);
  if (/[<>]/.test(description || '')) err('SKILL.md: description may not contain angle brackets');
  if (compatibility && compatibility.length > 500) err('SKILL.md: compatibility must be ≤ 500 characters');
  const bodyLines = fm.body.split('\n').length;
  if (bodyLines > 500) err(`SKILL.md: body has ${bodyLines} lines (budget 500)`);
}

// 2. Relative links resolve, in the skill, the docs and the wrapper.
const mdFiles = [...walk(SKILL, (p) => p.endsWith('.md')), ...walk(path.join(ROOT, 'docs'), (p) => p.endsWith('.md')), ...walk(path.join(ROOT, 'commands'), (p) => p.endsWith('.md')), path.join(ROOT, 'README.md'), path.join(ROOT, 'README.zh-CN.md')].filter((p) => fs.existsSync(p));
const slug = (h) => h.trim().toLowerCase().replace(/[`*_~]/g, '').replace(/[^\p{Letter}\p{Number}\s-]/gu, '').replace(/\s/g, '-');
const anchorCache = new Map();
function anchorsOf(file) {
  if (!anchorCache.has(file)) {
    const set = new Set();
    for (const m of read(file).matchAll(/^#{1,6}\s+(.+)$/gm)) set.add(slug(m[1]));
    for (const m of read(file).matchAll(/<a (?:id|name)="([^"]+)"/g)) set.add(m[1]);
    anchorCache.set(file, set);
  }
  return anchorCache.get(file);
}
let links = 0;
for (const f of mdFiles) {
  const text = read(f).replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|#$)/.test(target)) continue;
    links += 1;
    const [p, anchor] = target.split('#');
    const abs = p ? path.resolve(path.dirname(f), decodeURIComponent(p)) : f;
    if (!fs.existsSync(abs)) {
      err(`${rel(f)}: broken link ${target}`);
      continue;
    }
    if (anchor && abs.endsWith('.md') && !anchorsOf(abs).has(anchor.toLowerCase())) warn(`${rel(f)}: anchor #${anchor} not found in ${rel(abs)}`);
  }
}

// 3. Paths named in SKILL.md and the workflows exist.
const pathRefs = new Set();
for (const f of [path.join(SKILL, 'SKILL.md'), ...walk(path.join(SKILL, 'references/workflows'), (p) => p.endsWith('.md'))]) {
  for (const m of read(f).matchAll(/(?:<skill-dir>\/|`)((?:references|scripts|assets)\/[\w./-]+\.(?:md|mjs|json|csv))/g)) pathRefs.add(m[1]);
}
for (const p of pathRefs) if (!fs.existsSync(path.join(SKILL, p))) err(`referenced path does not exist: skills/ui-evaluator/${p}`);

// 4. Long reference files carry a table of contents (progressive disclosure).
for (const f of walk(path.join(SKILL, 'references'), (p) => p.endsWith('.md'))) {
  const lines = read(f).split('\n');
  if (lines.length > 300 && !/^(Contents|## Contents|\d+\. \[)/m.test(lines.slice(0, 40).join('\n'))) warn(`${rel(f)}: ${lines.length} lines and no table of contents near the top`);
}

// 5. Every `uie <command>` named in guidance exists.
const cli = read(path.join(SKILL, 'scripts/lib/cli.mjs'));
const commands = new Set([...cli.matchAll(/^\s{2}([a-z]+): \{ file:/gm)].map((m) => m[1]));
for (const f of [path.join(SKILL, 'SKILL.md'), ...walk(path.join(SKILL, 'references'), (p) => p.endsWith('.md'))]) {
  for (const m of read(f).matchAll(/`uie ([a-z]+)\b/g)) if (!commands.has(m[1])) err(`${rel(f)}: \`uie ${m[1]}\` is not a CLI command`);
}

// 5b. Every invocation in guidance (inline code or code blocks) names a command whose module exists, a known
// subcommand, and flags the command's module handles. Guidance that names a missing flag is an instruction the
// agent cannot follow.
const cmdSpec = {};
for (const m of cli.matchAll(/^\s{2}'?([a-z-]+)'?: \{ file: '([a-z-]+)', summary: '([^']*)'/gm)) {
  const subs = (m[3].match(/(?:^|\s)((?:[a-z-]+\|)+[a-z-]+)/) || [])[1];
  cmdSpec[m[1]] = { file: m[2], subs: subs ? new Set(subs.split('|')) : null };
}
const GLOBAL_FLAGS = new Set(['root', 'json', 'quiet', 'help']);
const checkIndex = path.join(SKILL, 'scripts/lib/browser/checks/index.mjs');
const CHECK_NAMES = new Set(fs.existsSync(checkIndex) ? [...read(checkIndex).matchAll(/from '\.\/([a-z-]+)\.mjs'/g)].map((m) => m[1]) : []);
const invocationProblems = new Set();
const guidance = [path.join(SKILL, 'SKILL.md'), ...walk(path.join(SKILL, 'references'), (p) => p.endsWith('.md')), ...walk(path.join(ROOT, 'commands'), (p) => p.endsWith('.md'))];
for (const f of guidance) {
  const t = read(f);
  const invs = [...t.matchAll(/`(uie [^`\n]+)`/g)].map((m) => m[1]);
  for (const blk of t.matchAll(/```[a-z]*\n([\s\S]*?)```/g)) {
    for (const line of blk[1].split('\n')) {
      const i = line.indexOf('uie ');
      if (i >= 0 && (i === 0 || /[\s$(]/.test(line[i - 1]))) invs.push(line.slice(i));
    }
  }
  for (const inv of invs) {
    const toks = inv.split(/\s+/);
    const spec = cmdSpec[toks[1]];
    if (!spec) continue; // reported by check 5
    const mod = path.join(SKILL, 'scripts/lib/commands', `${spec.file}.mjs`);
    if (!fs.existsSync(mod)) {
      invocationProblems.add(`\`uie ${toks[1]}\` has no module (scripts/lib/commands/${spec.file}.mjs)`);
      continue;
    }
    const src = read(mod);
    const pos = toks.slice(2).find((x) => !x.startsWith('-'));
    if (spec.subs && pos && /^[a-z][a-z-]*$/.test(pos) && !spec.subs.has(pos)) invocationProblems.add(`${rel(f)}: \`uie ${toks[1]} ${pos}\` is not a known subcommand`);
    for (const m of inv.matchAll(/--([a-z][a-z0-9-]*)/g)) {
      if (GLOBAL_FLAGS.has(m[1]) || src.includes(`--${m[1]}`) || src.includes(`'${m[1]}'`)) continue;
      invocationProblems.add(`${rel(f)}: \`uie ${toks[1]}\` does not handle --${m[1]}`);
    }
    if (toks[1] === 'audit' && CHECK_NAMES.size) {
      for (const m of inv.matchAll(/--checks[ =]([a-z][a-z,-]*)/g)) {
        for (const name of m[1].split(',').filter(Boolean)) if (!CHECK_NAMES.has(name)) invocationProblems.add(`${rel(f)}: \`uie audit --checks ${name}\` is not a check name (ARCHITECTURE §7.2)`);
      }
    }
  }
}
for (const pr of invocationProblems) err(pr);

// 5c. Eval fixture products never appear in the skill, so the skill cannot teach to the test (EVALUATION-PLAN §8).
const fixturesDir = path.join(ROOT, 'evals/fixtures');
if (fs.existsSync(fixturesDir)) {
  const skillFiles = walk(SKILL, (p) => /\.(md|json|mjs|yaml)$/.test(p)).map((p) => [p, read(p).toLowerCase()]);
  for (const name of fs.readdirSync(fixturesDir)) {
    const fj = path.join(fixturesDir, name, 'fixture.json');
    if (!fs.existsSync(fj)) continue;
    let product = '';
    try {
      product = String(JSON.parse(read(fj)).product || '').trim().toLowerCase();
    } catch {
      err(`${rel(fj)}: not valid JSON`);
      continue;
    }
    if (product.length < 6) continue;
    for (const [p, text] of skillFiles) if (text.includes(product)) err(`${rel(p)}: names the eval fixture product "${product}" (${name}); keep fixtures out of the skill`);
  }
}

// 6. Plugin wrapper: manifest, marketplace, commands, hooks, agents.
const json = (p) => {
  try {
    return JSON.parse(read(path.join(ROOT, p)));
  } catch (e) {
    err(`${p}: ${e.message}`);
    return null;
  }
};
const plugin = json('.claude-plugin/plugin.json');
const market = json('.claude-plugin/marketplace.json');
const pkg = json('skills/ui-evaluator/scripts/package.json');
const skillVersion = (skillText.match(/version:\s*"?([\d.]+)"?/) || [])[1];
const versions = { 'plugin.json': plugin?.version, 'SKILL.md metadata': skillVersion, 'scripts/package.json': pkg?.version };
if (new Set(Object.values(versions)).size !== 1) err(`versions disagree: ${JSON.stringify(versions)}`);
if (market && !(market.plugins || []).some((pl) => pl.name === plugin?.name)) err('marketplace.json does not list the plugin by its name');
for (const f of walk(path.join(ROOT, 'commands'), (p) => p.endsWith('.md'))) {
  const c = frontMatter(read(f));
  if (!c?.fields.description) err(`${rel(f)}: missing description in front matter`);
  for (const m of read(f).matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([\w./-]+\.md)/g)) if (!fs.existsSync(path.join(ROOT, m[1]))) err(`${rel(f)}: points to missing ${m[1]}`);
}
const hooks = json('hooks/hooks.json');
for (const h of hooks?.hooks?.PostToolUse || []) {
  for (const x of h.hooks || []) {
    const m = (x.command || '').match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([\w./-]+\.mjs)/);
    if (!m || !fs.existsSync(path.join(ROOT, m[1]))) err(`hooks.json: command does not point to an existing script: ${x.command}`);
  }
}
const sync = spawnSync(process.execPath, [path.join(ROOT, 'tools/sync-agents.mjs'), '--check'], { encoding: 'utf8' });
if (sync.status !== 0) err(sync.stderr.trim() || 'agents/ out of date');
const rules = spawnSync(process.execPath, [path.join(ROOT, 'tools/build-rules.mjs'), '--check'], { encoding: 'utf8' });
if (rules.status !== 0) err(`rules.json out of date with QUALITY-BAR: ${(rules.stderr || rules.stdout).trim().split('\n')[0]}`);

// 7. Schemas and data parse; no user-specific absolute paths or oversized files ship.
for (const f of walk(path.join(SKILL, 'assets'), (p) => p.endsWith('.json'))) {
  try {
    const doc = JSON.parse(read(f));
    if (f.includes('/schemas/') && doc.$id !== path.basename(f)) err(`${rel(f)}: $id ${doc.$id} does not match the file name`);
  } catch (e) {
    err(`${rel(f)}: ${e.message}`);
  }
}
const shipped = [SKILL, path.join(ROOT, 'agents'), path.join(ROOT, 'commands'), path.join(ROOT, 'hooks'), path.join(ROOT, '.claude-plugin')];
for (const dir of shipped) {
  for (const f of walk(dir, (p) => /\.(md|mjs|json|csv|html)$/.test(p))) {
    const t = read(f);
    if (/(^|[\s"'`(=])(\/Users\/[A-Za-z]|[A-Z]:\\Users\\|\/home\/[a-z]+\/)/m.test(t)) err(`${rel(f)}: contains a user-specific absolute path`);
    if (fs.statSync(f).size > 1024 * 1024) err(`${rel(f)}: larger than 1 MB`);
  }
}

// 8. Claude Code's own validators, when the claude CLI is installed (marketplace; manifest with commands, agents, hooks).
for (const target of ['.', '.claude-plugin/plugin.json']) {
  const r = spawnSync('claude', ['plugin', 'validate', target], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
  if (r.error) {
    warn('claude CLI not found: skipped `claude plugin validate`');
    break;
  }
  if (r.status !== 0) err(`claude plugin validate ${target}: ${(r.stdout + r.stderr).split('\n').filter((l) => /❯|error/i.test(l)).slice(0, 4).join(' | ') || 'failed'}`);
}

// 9. The CLI starts and lists its commands.
const help = spawnSync(process.execPath, [path.join(SKILL, 'scripts/uie.mjs'), '--help'], { encoding: 'utf8' });
if (help.status !== 0 || !/doctor/.test(help.stdout)) err('uie --help failed');

for (const w of warnings) console.log(`warning ${w}`);
for (const e of errors) console.error(`error   ${e}`);
console.log(`validate-skill: ${errors.length} error(s), ${warnings.length} warning(s); ${links} relative link(s), ${pathRefs.size} referenced path(s), ${commands.size} CLI command(s) checked`);
process.exitCode = errors.length ? 1 : 0;
