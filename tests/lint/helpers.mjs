// Shared helpers for the lint test suite: run `lint()` on fixture folders and read `expect:` markers.
//
// Marker syntax: a comment containing `expect: RULE-ID[, RULE-ID…]` on the line where a hit must be reported
// (`/* expect: SLP-01 */` in CSS, `// expect: …` in script code, `{/* expect: … */}` in JSX children and MDX,
// `<!-- expect: … -->` in HTML, Vue and Svelte templates). Every line hit by a rule under test carries a marker for
// it, and every marker is hit.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { discoverFiles, loadProjectContext } from '../../skills/ui-evaluator/scripts/lib/lint/files.mjs';
import { lint } from '../../skills/ui-evaluator/scripts/lib/lint/index.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '../..');
export const UIE = path.join(REPO, 'skills/ui-evaluator/scripts/uie.mjs');
export const FIXTURES = path.join(REPO, 'tests/fixtures/lint');

/** Expected level of every rule ID the lint layer emits (the contract under test). */
export const LEVEL = {
  'SLP-01': 'gate', 'SLP-02': 'gate', 'SLP-03': 'gate', 'SLP-04': 'gate', 'SLP-08': 'gate', 'SLP-09': 'gate',
  'SLP-10': 'gate', 'SLP-11': 'gate', 'SLP-12': 'gate', 'SLP-13': 'gate', 'SLP-14': 'gate', 'SLP-15': 'gate',
  'SLP-20': 'soft', 'SLP-23': 'soft', 'SLP-24': 'soft', 'SLP-26': 'soft', 'SLP-31': 'soft', 'SLP-34': 'soft',
  'SLP-35': 'soft', 'SLP-36': 'soft', 'SLP-37': 'soft', 'SLP-40': 'soft',
  'SLP-57': 'possible',
  'MOT-01': 'gate', 'MOT-03': 'gate', 'MOT-04': 'gate', 'MOT-06': 'gate',
  'COL-01': 'gate', 'LAY-01': 'gate', 'TYP-05': 'gate',
  'A11Y-17': 'gate', 'A11Y-14': 'gate', 'I18N-01': 'gate', 'I18N-03': 'gate', 'CPY-01': 'gate',
  'CMP-08': 'advisory', 'TYP-19': 'advisory', 'WCAG-2.4.3': 'advisory', 'WCAG-2.1.1': 'advisory', 'WCAG-1.1.1': 'advisory',
  'CMP-17': 'advisory', 'I18N-14': 'advisory', 'CPY-09': 'advisory', 'CPY-19': 'advisory', 'I18N-17': 'advisory', 'I18N-18': 'advisory',
};

/** Lint a folder as a project (its own PRODUCT.md, DESIGN.md and config), the way `uie lint` scans a root. */
export async function lintDir(dir, opts = {}) {
  const found = discoverFiles(dir, { paths: opts.paths || [], cwd: dir });
  const project = await loadProjectContext(dir);
  const res = lint({ root: dir, files: found.files, fonts: found.fonts, project, rules: opts.rules || null, fast: !!opts.fast, version: 'test' });
  return { ...res, found, project };
}

/** Lint in-memory sources: files = { 'path/name.ext': 'text' }. */
export async function lintSources(files, opts = {}) {
  const dir = opts.dir || tmpDir('uie-lint-src-');
  for (const [rel, text] of Object.entries(files)) write(path.join(dir, rel), text);
  const res = await lintDir(dir, opts);
  if (!opts.dir && !opts.keep) fs.rmSync(dir, { recursive: true, force: true });
  return res;
}

/** Hits as plain rows: { id, file, line, col, level, message, hit }. */
export function rows(res) {
  return res.hits.map((h, i) => ({
    id: res.raws[i].id,
    file: h.locations[0].source.file,
    line: h.locations[0].source.line,
    col: h.locations[0].source.col,
    level: h.level,
    requested: !!h.requested,
    message: res.raws[i].message,
    hit: h,
  }));
}

/** `expect:` markers in the files of a folder: Map('file:line' → Set(ids)). */
export function markers(dir) {
  const out = new Map();
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else {
        const rel = path.relative(dir, p).split(path.sep).join('/');
        const lines = fs.readFileSync(p, 'utf8').split('\n');
        lines.forEach((l, i) => {
          // `expect-file:` marks a hit on the file as a whole (no line), e.g. a bundled font file.
          const m = l.match(/expect(-file)?:\s*([A-Z0-9][A-Z0-9.,\s-]*[A-Z0-9])/);
          if (!m) return;
          const ids = m[2].split(/[\s,]+/).filter((x) => /^[A-Z0-9]+-[\d.]+$/.test(x));
          if (ids.length) out.set(m[1] ? `${rel}:file` : `${rel}:${i + 1}`, new Set(ids));
        });
      }
    }
  };
  walk(dir);
  return out;
}

export function tmpDir(prefix = 'uie-lint-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function write(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

/** Run the CLI: { code, out, err, json() }. */
export function uie(args, { cwd = REPO, input, env = {} } = {}) {
  const r = spawnSync(process.execPath, [UIE, ...args], { cwd, input, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, out: r.stdout, err: r.stderr, json: () => JSON.parse(r.stdout) };
}
