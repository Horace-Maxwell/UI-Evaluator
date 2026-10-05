#!/usr/bin/env node
// Run a test suite with node:test: core (no dependencies), browser (needs the browser runtime) or all.
//   node tools/run-tests.mjs [core|lint|browser|all] [--allow-skip]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suite = process.argv[2] || 'core';
const dirs = suite === 'all' ? ['core', 'browser', 'lint'] : [suite];

function files(dir) {
  const abs = path.join(ROOT, 'tests', dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const p = path.join(abs, ent.name);
    if (ent.isDirectory()) out.push(...files(path.join(dir, ent.name)));
    else if (/\.test\.mjs$/.test(ent.name)) out.push(p);
  }
  return out.sort();
}

const list = dirs.flatMap(files);
if (!list.length) {
  console.log(`no tests in tests/${dirs.join(', tests/')}`);
  process.exit(0);
}
// Browser suites must not pass by skipping: they fail when the browser runtime is missing, unless --allow-skip.
const env = { ...process.env };
if (dirs.includes('browser') && !process.argv.includes('--allow-skip')) env.UIE_REQUIRE_BROWSER = '1';
const r = spawnSync(process.execPath, ['--test', ...list], { stdio: 'inherit', cwd: ROOT, env });
process.exit(r.status ?? 1);
