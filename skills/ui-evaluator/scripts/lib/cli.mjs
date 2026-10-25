// Command dispatcher for `uie`.
import fs from 'node:fs';
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
  wait: { file: 'wait', summary: 'wait inside the turn until subagents\' output files arrive' },
  next: { file: 'next', summary: 'where the audit run stands, and the next command to run' },
  probe: { file: 'probe', summary: 'perform an interaction recipe and record evidence', browser: true },
  journey: { file: 'journey', summary: 'replay a journey and check its success condition', browser: true },
  findings: { file: 'findings', summary: 'validate|merge|split|apply-verdicts|rate|queue|set|dismiss|link|list|show|agreement|promote' },
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
  // An option the command does not know used to be ignored without a word: `--part 2` built one packet, `--levle L2`
  // checked L3 (review of 2026-10-24, L2). A near miss of a known option is an error; any other unknown option a warning.
  const known = knownOptions(spec, mod);
  const unknown = Object.keys(args).filter((k) => k !== '_' && !known.has(k));
  const typos = unknown.map((k) => [k, nearest(k, known)]).filter(([, near]) => near);
  if (typos.length) {
    for (const [k, near] of typos) process.stderr.write(`uie ${cmd}: unknown option --${k}; did you mean --${near}?\n`);
    return 1;
  }
  for (const k of unknown) process.stderr.write(`uie ${cmd}: --${k} is not an option of this command and may be ignored (see \`uie ${cmd} --help\`)\n`);
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

/** The options a command reads: those its help names, those its argSpec declares, those its source reads, the global ones. */
function knownOptions(spec, mod) {
  const known = new Set(['json', 'quiet', 'root', 'help', 'h']);
  for (const m of String(mod.help || '').matchAll(/--([a-z][a-z0-9-]*)/g)) known.add(m[1]);
  for (const k of [...(mod.argSpec?.boolean || []), ...(mod.argSpec?.multi || []), ...Object.values(mod.argSpec?.alias || {})]) known.add(k);
  try {
    const src = fs.readFileSync(path.join(HERE, 'commands', `${spec.file}.mjs`), 'utf8');
    // Helpers that take the parsed arguments as opts or options read them there.
    for (const m of src.matchAll(/\b(?:args|opts|options)\.([a-zA-Z_]\w*)|\b(?:args|opts|options)\[['"]([\w-]+)['"]\]/g)) known.add(m[1] || m[2]);
  } catch {
    /* the help and argSpec still apply */
  }
  return known;
}

/** The known option one or two edits away from an unknown one, if any (a typo, not a different option). */
function nearest(key, known) {
  let best = null;
  let bestD = 3;
  for (const k of known) {
    if (k.length < 3) continue;
    const d = editDistance(key, k);
    if (d > 0 && d < bestD) {
      best = k;
      bestD = d;
    }
  }
  return best;
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

export { UsageError };
