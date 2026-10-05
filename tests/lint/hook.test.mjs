// `uie hook`, the Claude Code PostToolUse adapter (ARCHITECTURE §10.1, ADR-021): silent outside opted-in projects
// and for non-UI files; the hookSpecificOutput JSON within 1,500 characters inside one; accepted tells suppressed
// except SLP-12 and SLP-13; exit 0 and silence on any bad input; under 300 ms on a 2,000-line stylesheet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { handleHook, formatContext, MAX_CONTEXT } from '../../skills/ui-evaluator/scripts/lib/commands/hook.mjs';
import { tmpDir, uie, write } from './helpers.mjs';

const BUDGET_MS = 300;

function optedIn(files = {}) {
  const root = tmpDir('uie-hook-');
  write(path.join(root, '.ui-evaluator', 'config.json'), '{ "schema_version": 1 }\n');
  write(path.join(root, 'package.json'), '{ "name": "hook-fixture", "private": true }\n');
  for (const [rel, text] of Object.entries(files)) write(path.join(root, rel), text);
  return root;
}

const payload = (root, rel, extra = {}) => JSON.stringify({ session_id: 's1', hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: path.join(root, rel) }, cwd: root, ...extra });
const hook = (input, cwd) => uie(['hook'], { input, cwd });

const BAD_CSS = '.hero-title {\n  background: linear-gradient(90deg, #0f766e, #22d3ee);\n  -webkit-background-clip: text;\n  transition: all 200ms;\n}\n';

test('silent outside an opted-in project (no .ui-evaluator/config.json)', (t) => {
  const root = tmpDir('uie-hook-out-');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(path.join(root, 'package.json'), '{}');
  write(path.join(root, 'src/a.css'), BAD_CSS);
  const r = hook(payload(root, 'src/a.css'), root);
  assert.equal(r.code, 0);
  assert.equal(r.out, '');
  assert.equal(r.err, '');
});

test('silent for non-UI extensions, minified files, build output, dependencies, tests and stories', (t) => {
  const root = optedIn({
    'README.md': '# Supercharge your workflow\n',
    'data.json': '{"color": "#6366f1"}',
    'script.py': 'print("lorem ipsum")\n',
    'public/app.min.css': BAD_CSS,
    'dist/app.css': BAD_CSS,
    'node_modules/pkg/a.css': BAD_CSS,
    'src/__tests__/a.css': BAD_CSS,
    'src/Button.stories.tsx': 'export const S = () => <button className="transition-all">Get started</button>;\n',
    'tests/fixtures/a.css': BAD_CSS,
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const rel of ['README.md', 'data.json', 'script.py', 'public/app.min.css', 'dist/app.css', 'node_modules/pkg/a.css', 'src/__tests__/a.css', 'src/Button.stories.tsx', 'tests/fixtures/a.css', 'src/missing.css']) {
    const r = hook(payload(root, rel), root);
    assert.equal(r.code, 0, rel);
    assert.equal(r.out, '', `${rel} must be silent`);
  }
});

test('inside an opted-in project: hookSpecificOutput JSON with rule IDs, lines and one-line fixes', (t) => {
  const root = optedIn({ 'src/hero.css': BAD_CSS });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const before = fs.readdirSync(path.join(root, '.ui-evaluator'));
  const r = hook(payload(root, 'src/hero.css'), root);
  assert.equal(r.code, 0);
  assert.equal(r.err, '');
  const out = JSON.parse(r.out);
  assert.deepEqual(Object.keys(out), ['hookSpecificOutput']);
  assert.equal(out.hookSpecificOutput.hookEventName, 'PostToolUse');
  const ctx = out.hookSpecificOutput.additionalContext;
  assert.ok(ctx.length <= MAX_CONTEXT);
  assert.match(ctx, /^UI-Evaluator lint \(fast rules\) on src\/hero\.css/);
  assert.match(ctx, /- SLP-01 L3: .* → Decide which lever/);
  assert.match(ctx, /- MOT-01 L4: /);
  assert.deepEqual(fs.readdirSync(path.join(root, '.ui-evaluator')), before, 'the hook writes no files');
  // A relative file_path resolves against cwd.
  const rel = hook(JSON.stringify({ tool_input: { file_path: 'src/hero.css' }, cwd: root }), root);
  assert.match(JSON.parse(rel.out).hookSpecificOutput.additionalContext, /SLP-01/);
  // A clean file is silent.
  write(path.join(root, 'src/ok.css'), '.ok { transition: opacity 150ms; color: var(--ink); }\n@media (prefers-reduced-motion: reduce) { .ok { transition: none; } }\n');
  assert.equal(hook(payload(root, 'src/ok.css'), root).out, '');
});

test('the hook uses the fast subset: no TYP-05, I18N-01 or A11Y-17 from a single edit', async (t) => {
  const root = optedIn({
    'src/Board.tsx': "export function Board({ del }) {\n  return <button type=\"button\" onMouseDown={() => del('a')}>Delete</button>;\n}\n",
    'src/type.css': "body { font-family: Inter, sans-serif; }\nh1 { font-family: Fraunces, serif; }\n.q { font-family: Lora, serif; }\n",
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(await handleHook(JSON.parse(payload(root, 'src/Board.tsx'))), null);
  assert.equal(await handleHook(JSON.parse(payload(root, 'src/type.css'))), null);
});

test('accepted tells are suppressed, but SLP-12 and SLP-13 never are', async (t) => {
  const design = `---
version: alpha
name: Sunset festival
colors:
  primary: "#c2410c"
ui-evaluator:
  status: approved
  accepted_tells:
    - id: SLP-01
      scope: hero headline
      reason: "The brief asks for the festival's sunset gradient on the hero title."
      decided_by: owner
    - {id: SLP-12, reason: "launch numbers", decided_by: owner}
    - {id: SLP-13, reason: "demo names", decided_by: owner}
---

# Sunset festival
`;
  const root = optedIn({
    'DESIGN.md': design,
    'src/Hero.tsx': [
      'export function Hero() {',
      '  return (',
      '    <section>',
      '      <h1 className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">Sunset Sessions</h1>',
      '      <p>Trusted by 50,000+ festival-goers.</p>',
      '      <p>Hosted by Jane Doe.</p>',
      '    </section>',
      '  );',
      '}',
      '',
    ].join('\n'),
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const out = await handleHook(JSON.parse(payload(root, 'src/Hero.tsx')));
  const ctx = out.hookSpecificOutput.additionalContext;
  assert.doesNotMatch(ctx, /SLP-01/, 'the requested gradient text is quiet');
  assert.match(ctx, /- SLP-12 L5:/);
  assert.match(ctx, /- SLP-13 L6:/);
});

test('additionalContext stays within 1,500 characters when many rules fire', async (t) => {
  const lines = ['export function Page() {', '  return (', '    <main>'];
  const bad = [
    '<h1 className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">Supercharge your seamless workflow</h1>',
    '<button className="bg-indigo-600 transition-all hover:scale-110 animate-bounce">🚀 Get started</button>',
    '<div className="rounded-xl border-l-4 border-emerald-600 shadow-[0_0_30px_rgba(236,72,153,0.5)]">Card</div>',
    '<span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />',
    '<p>Trusted by 10,000+ teams. Jane Doe, Acme Inc.</p>',
    '<div className="scale-0 transition-transform data-[state=open]:scale-100 p-[13px]">Menu</div>',
    '<div className="outline-none text-[#123456]">Focus</div>',
  ];
  for (let i = 0; i < 6; i += 1) lines.push(...bad.map((b) => `      ${b}`));
  lines.push('    </main>', '  );', '}', '');
  const root = optedIn({ 'src/app/page.tsx': lines.join('\n') });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const out = await handleHook(JSON.parse(payload(root, 'src/app/page.tsx')));
  const ctx = out.hookSpecificOutput.additionalContext;
  assert.ok(ctx.length <= MAX_CONTEXT, `length ${ctx.length}`);
  assert.ok((ctx.match(/^- /gm) || []).length >= 5, 'several rule groups are listed');
  // formatContext alone: a long list is cut with a pointer to the full check, never past the limit.
  const groups = Array.from({ length: 40 }, (_, i) => ({ id: `SLP-${String(i).padStart(2, '0')}`, items: [{ line: i + 1, message: 'x'.repeat(200) }] }));
  const body = formatContext('src/very/long/path/to/a/component/file.tsx', groups, () => ({ level: 'gate', fix: 'y'.repeat(300) }));
  assert.ok(body.length <= MAX_CONTEXT);
  assert.match(body, /more rule\(s\); run the full check\./);
});

test('never throws and always exits 0: empty, garbage, wrong-shape and huge stdin', () => {
  const huge = JSON.stringify({ tool_input: { file_path: '/nowhere/a.css' }, cwd: '/nowhere', pad: 'a'.repeat(5_000_000) });
  for (const input of ['', 'not json', '[]', 'null', '42', '{"tool_input": 5}', '{"tool_input": {"file_path": 7}}', '{"tool_input": {"file_path": ""}}', '{"tool_input": {}}', '\u0000\u0001\u0002', huge, '{"tool_input": {"file_path": "/etc/passwd"}}']) {
    const r = hook(input, process.cwd());
    assert.equal(r.code, 0, `input ${input.slice(0, 40)}`);
    assert.equal(r.out, '', `input ${input.slice(0, 40)} must be silent`);
  }
});

test('declared tokens reach the hook: a DTCG file in tokens/ names the token and sets the spacing scale', async (t) => {
  const root = optedIn({
    'tokens/brand.tokens.json': JSON.stringify({ color: { $type: 'color', accent: { $value: '#3a80f5' } }, space: { $type: 'dimension', sm: { $value: '6px' }, md: { $value: '10px' } } }),
    'src/card.css': '.card {\n  color: #3a80f6;\n  padding: 6px 10px;\n  margin: 13px;\n}\n',
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const ctx = (await handleHook(JSON.parse(payload(root, 'src/card.css')))).hookSpecificOutput.additionalContext;
  assert.match(ctx, /COL-01 L2: literal #3a80f6 in color: equals \{color\.accent\} \(#3a80f5\): use the token/);
  assert.match(ctx, /LAY-01 L4: margin: 13px .*nearest \{space\.md\} \(10px\)/);
  assert.doesNotMatch(ctx, /L3/, '6px and 10px are on the declared scale');
});

test(`performance: under ${BUDGET_MS} ms end to end on a 2,000-line stylesheet`, (t) => {
  const css = [];
  for (let i = 1; css.length < 2000; i += 1) {
    css.push(`.c${i} {`, `  padding: ${(i % 7) * 4 + 1}px 8px;`, `  color: ${i % 9 === 0 ? '#6366f1' : 'var(--ink)'};`, `  background: var(--surface-${i % 5});`, '  border-radius: var(--radius);', `  transition: ${i % 50 === 0 ? 'all 200ms' : 'opacity 150ms'};`, '}', `.c${i}:hover { background: var(--surface-hover); }`, '');
  }
  const root = optedIn({ 'src/styles/big.css': `${css.slice(0, 2000).join('\n')}\n`, 'src/app/globals.css': ':root { --ink: #111; }\n' });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  // A large tree around the file: token discovery in the hook must not walk it.
  for (let i = 0; i < 300; i += 1) for (let j = 0; j < 10; j += 1) fs.mkdirSync(path.join(root, 'src', 'features', `f${i}`, `part${j}`), { recursive: true });
  const input = payload(root, 'src/styles/big.css');
  hook(input, root); // warm the file-system cache
  const times = [];
  for (let i = 0; i < 5; i += 1) {
    const t0 = process.hrtime.bigint();
    const r = hook(input, root);
    times.push(Number(process.hrtime.bigint() - t0) / 1e6);
    assert.equal(r.code, 0);
    assert.ok(JSON.parse(r.out).hookSpecificOutput.additionalContext.length <= MAX_CONTEXT);
  }
  const median = times.sort((a, b) => a - b)[2];
  t.diagnostic(`uie hook on 2,000 lines: median ${median.toFixed(0)} ms over 5 runs (process start included)`);
  assert.ok(median < BUDGET_MS, `median ${median.toFixed(0)} ms`);
});
