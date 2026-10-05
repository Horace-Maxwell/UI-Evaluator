// uie hook — Claude Code PostToolUse adapter (ARCHITECTURE §10.1; ADR-021).
// Reads the hook JSON on stdin, takes tool_input.file_path and cwd, and stays silent (exit 0, no output) unless the
// file has a UI extension and its project contains .ui-evaluator/config.json. It lints only that file with the fast
// rule subset (hard tells, motion rules, outline removal, token drift, restricted fonts, IME guard) and prints
// {"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"…"}} (≤ 1,500 characters).
// Requested tells (DESIGN.md accepted_tells) stay quiet. Any internal error → exit 0 with no output. Budget < 300 ms.
// Hooks never write files.
import fs from 'node:fs';
import path from 'node:path';

export const argSpec = { boolean: ['json'] };

export const help = `uie hook — PostToolUse adapter for Claude Code (reads the hook JSON on stdin).

Silent unless the edited file has a UI extension (.css .scss .less .html .jsx .tsx .js .ts .vue .svelte .astro .mdx)
and the project contains .ui-evaluator/config.json. Then it lints that file with the fast rule subset and prints
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"…"}}. Always exits 0.
Set UIE_HOOK_DEBUG=1 to print timing and errors to stderr.`;

export const MAX_CONTEXT = 1500;
const STDIN_TIMEOUT_MS = 1000;
const MAX_FILE_BYTES = 512 * 1024;
const IGNORED_SEGMENTS = /(?:^|\/)(?:node_modules|\.git|dist|build|out|\.next|\.nuxt|\.svelte-kit|\.output|\.vercel|\.turbo|\.cache|coverage|\.ui-evaluator|vendors?|third[_-]party|bower_components|__generated__|storybook-static|\.astro)(?:\/|$)/;

function readStdin(timeoutMs) {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    let data = '';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(data);
    };
    const timer = setTimeout(finish, timeoutMs);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => {
      data += c;
      if (data.length > 4_000_000) finish();
    });
    process.stdin.on('end', finish);
    process.stdin.on('error', finish);
  });
}

/** Walk up from `dir` to the folder that holds .ui-evaluator/config.json, or null. */
export function optedInRoot(dir) {
  let d = path.resolve(dir);
  for (let i = 0; i < 64; i += 1) {
    try {
      if (fs.statSync(path.join(d, '.ui-evaluator', 'config.json')).isFile()) return d;
    } catch {
      // keep walking
    }
    const parent = path.dirname(d);
    if (parent === d) return null;
    d = parent;
  }
  return null;
}

function oneLine(s, n) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

/** Compose additionalContext from grouped hits, within MAX_CONTEXT characters. */
export function formatContext(rel, groups, metaOf) {
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  const head = `UI-Evaluator lint (fast rules) on ${rel}: ${total} problem${total === 1 ? '' : 's'} to fix now.`;
  const foot = `Fix by deciding, not by swapping defaults. Full check: uie lint --changed ${rel}. A tell the brief asks for goes in DESIGN.md ui-evaluator.accepted_tells with a reason.`;
  const lines = [];
  for (const g of groups) {
    const meta = metaOf(g.id);
    const lns = [...new Set(g.items.map((r) => r.line).filter((x) => x !== null && x !== undefined))];
    const where = lns.length ? `L${lns.slice(0, 6).join(',')}${lns.length > 6 ? ',…' : ''}` : '';
    const what = oneLine(g.items[0].message, 120);
    const level = meta.level === 'advisory' ? ' (advisory)' : '';
    lines.push(`- ${g.id}${level} ${where}: ${what}${g.items.length > 1 ? ` (+${g.items.length - 1})` : ''} → ${oneLine(meta.fix, 140)}`);
  }
  let body = [head, ...lines, foot].join('\n');
  if (body.length <= MAX_CONTEXT) return body;
  const keep = [];
  let len = head.length + foot.length + 2;
  for (let i = 0; i < lines.length; i += 1) {
    const more = `… ${lines.length - i} more rule(s); run the full check.`;
    if (len + lines[i].length + 1 + more.length + 1 > MAX_CONTEXT) {
      keep.push(more);
      break;
    }
    keep.push(lines[i]);
    len += lines[i].length + 1;
  }
  body = [head, ...keep, foot].join('\n');
  return body.length <= MAX_CONTEXT ? body : body.slice(0, MAX_CONTEXT - 1) + '…';
}

/**
 * Handle one hook payload. Returns the output object, or null for silence.
 * @param {unknown} payload parsed hook JSON
 */
export async function handleHook(payload, { now = Date.now } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const input = payload.tool_input;
  if (!input || typeof input !== 'object') return null;
  const file = input.file_path ?? input.path;
  if (typeof file !== 'string' || !file.trim()) return null;
  const cwd = typeof payload.cwd === 'string' && payload.cwd ? payload.cwd : process.cwd();
  const abs = path.isAbsolute(file) ? path.normalize(file) : path.resolve(cwd, file);
  const { UI_EXTS, isUiFile, isNonShippedPath, generatedReason } = await import('../lint/files.mjs');
  if (!UI_EXTS.has(path.extname(abs).toLowerCase()) || !isUiFile(abs)) return null;
  const root = optedInRoot(path.dirname(abs));
  if (!root) return null;
  const rel = path.relative(root, abs).split(path.sep).join('/');
  // Build output, dependencies, vendored code, tests, stories and mocks are not the project's shipped UI.
  if (!rel || rel.startsWith('..') || IGNORED_SEGMENTS.test(rel) || isNonShippedPath(rel)) return null;
  let stat;
  try {
    stat = fs.statSync(abs);
  } catch {
    return null;
  }
  if (!stat.isFile() || stat.size > MAX_FILE_BYTES) return null;
  let text;
  try {
    text = fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
  if (generatedReason(text)) return null;
  const [{ loadProjectContext }, { lint, RULE_META }, { version }] = await Promise.all([
    import('../lint/files.mjs'),
    import('../lint/index.mjs'),
    import('../cli.mjs'),
  ]);
  const project = await loadProjectContext(root, { fast: true });
  const res = lint({ root, files: [{ abs, rel, text, nonShipped: false }], fonts: [], project, fast: true, version: version() });
  const raws = res.raws.filter((r) => !r.requested && RULE_META[r.id] && RULE_META[r.id].level !== 'possible');
  if (!raws.length) return null;
  const groups = [];
  const byId = new Map();
  for (const r of raws) {
    if (!byId.has(r.id)) {
      const g = { id: r.id, items: [] };
      byId.set(r.id, g);
      groups.push(g);
    }
    byId.get(r.id).items.push(r);
  }
  // Gate-level first, advisory last.
  groups.sort((a, b) => (RULE_META[a.id].level === 'advisory') - (RULE_META[b.id].level === 'advisory'));
  const additionalContext = formatContext(rel, groups, (id) => RULE_META[id]);
  if (process.env.UIE_HOOK_DEBUG) process.stderr.write(`uie hook: ${rel} ${raws.length} hit(s) in ${now() - (handleHook.t0 || now())} ms\n`);
  return { hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext } };
}

export async function run() {
  const t0 = Date.now();
  handleHook.t0 = t0;
  // A closed stdout (the session went away) must not turn into an error report.
  process.stdout.on('error', () => process.exit(0));
  try {
    const raw = await readStdin(STDIN_TIMEOUT_MS);
    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      return 0;
    }
    const out = await handleHook(payload);
    // Wait for the write to reach the OS: uie.mjs exits as soon as run() returns.
    if (out) await new Promise((resolve) => process.stdout.write(`${JSON.stringify(out)}\n`, () => resolve()));
    if (process.env.UIE_HOOK_DEBUG) process.stderr.write(`uie hook: total ${Date.now() - t0} ms\n`);
  } catch (err) {
    if (process.env.UIE_HOOK_DEBUG) process.stderr.write(`uie hook: suppressed error ${err && err.stack}\n`);
  }
  return 0;
}
