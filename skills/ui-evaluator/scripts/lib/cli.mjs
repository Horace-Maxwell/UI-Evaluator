// Command dispatcher for `uie`.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, UsageError } from './util/args.mjs';
import { findRoot } from './project.mjs';
import { readJson } from './util/fs.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SKILL_DIR = path.resolve(HERE, '../..');
export const SCRIPTS_DIR = path.resolve(HERE, '..');

export const COMMANDS = {
  doctor: { file: 'doctor', summary: 'check Node, dependencies and Chromium; run the smoke test (--install to install)' },
  detect: { file: 'detect', summary: 'pre-flight scan of the project (framework, styling, tokens, routes, locales)' },
  init: { file: 'init', summary: 'scaffold .ui-evaluator/ (never overwrites)' },
  run: { file: 'run', summary: 'run new|list|show — open and inspect runs' },
  capture: { file: 'capture', summary: 'deterministic screenshots and ARIA snapshots over the scope matrix', browser: true },
  audit: { file: 'audit', summary: 'deterministic page audits (see --checks)', browser: true },
  lint: { file: 'lint', summary: 'static source scan for tells, motion, token drift and a11y source rules' },
  packet: { file: 'packet', summary: 'build the input packet for an isolated role' },
  probe: { file: 'probe', summary: 'perform an interaction recipe and record evidence', browser: true },
  journey: { file: 'journey', summary: 'replay a journey and check its success condition', browser: true },
  findings: { file: 'findings', summary: 'validate|merge|apply-verdicts|rate|queue|set|dismiss|link|list|show|agreement|promote' },
  diff: { file: 'diff', summary: 'identity-based set difference between runs (+ --visual, --aria)' },
  gates: { file: 'gates', summary: 'compute criterion and gate states and the assurance level' },
  report: { file: 'report', summary: 'render report.md / report.html / agree-disagree.csv and lint its language' },
  study: { file: 'study', summary: 'outcomes|ci|time|seq|sus|umux|tlx|desirability|samplesize|discovery|ab|srm|rite|alpha' },
  roll: { file: 'roll', summary: 'seeded direction deal with ledger-aware structural parameters' },
  ledger: { file: 'ledger', summary: 'add|list|check the direction ledger' },
  feedback: { file: 'feedback', summary: 'import|stats|set|themes|selftest — normalise, scrub, classify and theme user feedback' },
  tokens: { file: 'tokens', summary: 'check|extract DESIGN.md tokens' },
  hook: { file: 'hook', summary: 'Claude Code PostToolUse adapter (reads hook JSON on stdin)' },
};

export function version() {
  try {
    return readJson(path.join(SCRIPTS_DIR, 'package.json')).version;
  } catch {
    return 'unknown';
  }
}

function globalHelp() {
  const lines = [
    `uie ${version()} — UI-Evaluator command-line tool`,
    '',
    'Usage: uie <command> [options]',
    '',
    'Commands:',
    ...Object.entries(COMMANDS).map(([k, v]) => `  ${k.padEnd(10)} ${v.summary}${v.browser ? '  [browser]' : ''}`),
    '',
    'Global options:',
    '  --root <dir>   project root (default: nearest folder with .ui-evaluator/ or package.json)',
    '  --json         machine-readable output',
    '  --quiet        print only essential lines',
    '  --help         help for a command',
    '',
    'Exit codes: 0 ran and clean · 2 ran and found problems · 1 could not run.',
    'Commands marked [browser] need Playwright + Chromium (`uie doctor --install`).',
  ];
  return lines.join('\n');
}

export function makeContext(args) {
  const root = args.root ? path.resolve(String(args.root)) : findRoot(process.cwd());
  const json = !!args.json;
  const quiet = !!args.quiet;
  return {
    root,
    json,
    quiet,
    skillDir: SKILL_DIR,
    print(...lines) {
      if (json) return;
      for (const l of lines) process.stdout.write(`${l}\n`);
    },
    info(...lines) {
      if (json || quiet) return;
      for (const l of lines) process.stdout.write(`${l}\n`);
    },
    warn(...lines) {
      for (const l of lines) process.stderr.write(`uie: ${l}\n`);
    },
    result(obj) {
      if (json) process.stdout.write(`${JSON.stringify(obj, null, 2)}\n`);
    },
  };
}

export async function main(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    process.stdout.write(`${globalHelp()}\n`);
    return 0;
  }
  if (cmd === '--version' || cmd === 'version') {
    process.stdout.write(`${version()}\n`);
    return 0;
  }
  const spec = COMMANDS[cmd];
  if (!spec) {
    process.stderr.write(`uie: unknown command "${cmd}". Run \`uie --help\`.\n`);
    return 1;
  }
  const mod = await import(`./commands/${spec.file}.mjs`);
  const args = parseArgs(rest, mod.argSpec || {});
  if (args.help || args.h) {
    process.stdout.write(`${mod.help || spec.summary}\n`);
    return 0;
  }
  const ctx = makeContext(args);
  try {
    const code = await mod.run(args, ctx);
    return typeof code === 'number' ? code : 0;
  } catch (err) {
    if (err && (err.isUsage || err.userMessage)) {
      process.stderr.write(`uie ${cmd}: ${err.userMessage || err.message}\n`);
      return 1;
    }
    throw err;
  }
}

export { UsageError };
