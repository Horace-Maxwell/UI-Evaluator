import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UIE = path.resolve(HERE, '../../skills/ui-evaluator/scripts/uie.mjs');

const run = (args, cwd) => new Promise((resolve) => {
  const child = spawn(process.execPath, [UIE, ...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.on('exit', (code) => resolve({ code, out }));
});

test('a file has arrived when it is complete: not empty, and JSON that parses', async () => {
  const { arrived } = await import('../../skills/ui-evaluator/scripts/lib/commands/wait.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-wait-'));
  const f = (name, text) => { const p = path.join(dir, name); fs.writeFileSync(p, text); return p; };
  assert.equal(arrived(path.join(dir, 'missing.json')), false);
  assert.equal(arrived(f('empty.json', '')), false);
  assert.equal(arrived(f('half.json', '{"verdicts": [')), false, 'a subagent may still be writing it');
  assert.equal(arrived(f('whole.json', '{"verdicts": []}')), true);
  assert.equal(arrived(f('notes.md', '# Notes')), true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('uie wait returns when the outputs arrive, and exits 2 at the timeout with what is missing', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-wait-'));
  setTimeout(() => fs.writeFileSync(path.join(dir, 'he-1.json'), '{"candidates": []}'), 1200);
  const ok = await run(['wait', 'he-1.json', '--every', '1', '--timeout', '10', '--root', dir], dir);
  assert.equal(ok.code, 0);
  assert.match(ok.out, /all 1 arrived/);
  const started = Date.now();
  const late = await run(['wait', 'he-1.json', 'he-2.json', '--timeout', '1', '--root', dir], dir);
  assert.equal(late.code, 2);
  assert.match(late.out, /still waiting after \d+ s for: he-2\.json/);
  assert.ok(Date.now() - started < 4000, 'the timeout is kept, not rounded up to the poll interval');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('an output older than the packet that names it has not arrived', async () => {
  const { arrived } = await import('../../skills/ui-evaluator/scripts/lib/commands/wait.mjs');
  const run = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-wait-run-'));
  fs.mkdirSync(path.join(run, 'packets'));
  const out = path.join(run, 'verifier.json');
  fs.writeFileSync(out, '{"verdicts": []}');
  const old = new Date(Date.now() - 60_000);
  fs.utimesSync(out, old, old);
  fs.writeFileSync(path.join(run, 'packets', '.log.json'), JSON.stringify({ packets: [{ role: 'finding-verifier', output: out, at: new Date().toISOString() }] }));
  assert.equal(arrived(out), false, 'the earlier pass left this file');
  fs.writeFileSync(out, '{"verdicts": []}');
  assert.equal(arrived(out), true);
  fs.rmSync(run, { recursive: true, force: true });
});
