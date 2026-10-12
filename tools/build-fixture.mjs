#!/usr/bin/env node
// Build a fixture that ships as a production bundle: evals/fixtures-src/<name>/src/app.js and styles.css are
// bundled and minified with esbuild into evals/fixtures/<name>/app.js and styles.css. The source stays outside the
// fixture folder on purpose: an eval workspace gets the fixture folder only, so a session under test sees what a
// council's web team would see from an agency's delivery, a built bundle, and not the readable source
// (EVALUATION-PLAN §3: a fixture whose problems cannot be read off the source).
//
//   node tools/build-fixture.mjs <name> [--check]
//
// --check builds to a temporary folder and fails when the committed bundle differs (used by `npm run validate`).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--'));
const check = args.includes('--check');
if (!name) {
  console.error('usage: node tools/build-fixture.mjs <name> [--check]');
  process.exit(2);
}
const src = path.join(ROOT, 'evals/fixtures-src', name, 'src');
const dest = path.join(ROOT, 'evals/fixtures', name);
if (!fs.existsSync(path.join(src, 'app.js'))) {
  console.error(`no source at ${src}`);
  process.exit(2);
}
const out = check ? fs.mkdtempSync(path.join(os.tmpdir(), `fixture-${name}-`)) : dest;
fs.mkdirSync(out, { recursive: true });
// One IIFE, every identifier mangled, no comments or source map: what an agency's build pipeline ships.
buildSync({ entryPoints: [path.join(src, 'app.js')], bundle: true, minify: true, format: 'iife', globalName: 'DR', target: ['es2018'], legalComments: 'none', outfile: path.join(out, 'app.js'), logLevel: 'error', charset: 'utf8' });
buildSync({ entryPoints: [path.join(src, 'styles.css')], bundle: true, minify: true, legalComments: 'none', outfile: path.join(out, 'styles.css'), logLevel: 'error', charset: 'utf8' });
if (check) {
  let differs = 0;
  for (const f of ['app.js', 'styles.css']) {
    const a = fs.existsSync(path.join(dest, f)) ? fs.readFileSync(path.join(dest, f), 'utf8') : '';
    const b = fs.readFileSync(path.join(out, f), 'utf8');
    if (a !== b) {
      differs += 1;
      console.error(`${name}/${f} is out of date: run node tools/build-fixture.mjs ${name}`);
    }
  }
  fs.rmSync(out, { recursive: true, force: true });
  process.exit(differs ? 1 : 0);
}
for (const f of ['app.js', 'styles.css']) console.log(`${path.relative(ROOT, path.join(out, f))}: ${fs.statSync(path.join(out, f)).size} bytes`);
