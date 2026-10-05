// `uie lint` through the CLI: exit codes 0/2/1, --json shape, --rules, --changed, and --record / --run into a run
// created with `uie init` and `uie run new` (tool-findings.jsonl and checks.json → lint). Every recorded hit
// validates against assets/schemas/finding.schema.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { validate, loadSchema } from '../../skills/ui-evaluator/scripts/lib/schema.mjs';
import { FIXTURES, LEVEL, tmpDir, uie, write } from './helpers.mjs';

const GOOD = path.join(FIXTURES, 'good', 'shadcn-app');
const BAD = path.join(FIXTURES, 'rules', 'SLP-01', 'bad');
const finding = loadSchema('finding');

function project(files = {}) {
  const root = tmpDir('uie-lint-cli-');
  write(path.join(root, 'package.json'), '{ "name": "cli-fixture", "private": true }\n');
  for (const [rel, text] of Object.entries(files)) write(path.join(root, rel), text);
  return root;
}

test('exit 0 on a clean project, 2 on gate-level hits, 1 on a bad path or an unknown rule', () => {
  const clean = uie(['lint'], { cwd: GOOD });
  assert.equal(clean.code, 0, clean.out + clean.err);
  assert.match(clean.out, /0 gate-level/);
  const dirty = uie(['lint', BAD]);
  assert.equal(dirty.code, 2, dirty.out + dirty.err);
  assert.match(dirty.out, /SLP-01 ×4/);
  const missing = uie(['lint', 'no/such/folder']);
  assert.equal(missing.code, 1);
  assert.match(missing.err, /path not found: no\/such\/folder/);
  const unknown = uie(['lint', BAD, '--rules', 'SLP-99']);
  assert.equal(unknown.code, 1);
  assert.match(unknown.err, /unknown rule or family: SLP-99/);
});

test('--json prints the result object; every hit is a finding-shaped tool hit', () => {
  const r = uie(['lint', BAD, '--json']);
  assert.equal(r.code, 2);
  const out = r.json();
  for (const k of ['root', 'files', 'skipped', 'summary', 'metrics', 'truncated', 'cjk_detected', 'families_by_type', 'errors', 'recorded', 'duration_ms', 'hits']) assert.ok(k in out, `json has ${k}`);
  assert.deepEqual(Object.keys(out.summary).sort(), ['advisory', 'by_rule', 'gate', 'possible', 'requested', 'soft']);
  assert.equal(out.summary.by_rule['SLP-01'], 4);
  assert.equal(out.recorded, null);
  for (const h of out.hits) {
    const v = validate(finding, h);
    assert.ok(v.valid, JSON.stringify(v.errors));
    assert.deepEqual(h.found_by, [{ role: 'tool', method: 'tool', check: 'lint', engine: { name: 'uie-lint', version: h.found_by[0].engine.version } }]);
    assert.equal(h.evidence_level, 'E1');
    assert.equal(h.severity.source, 'rule');
    assert.equal(h.locations[0].route, '');
    assert.equal(h.locations[0].source.method, 'lint');
    assert.equal(h.locations[0].source.confidence, 'high');
    assert.ok(Number.isInteger(h.locations[0].source.line));
    assert.equal(h.level, LEVEL[h.criteria[0].id] || 'gate');
  }
  const slp01 = out.hits.find((h) => h.criteria[0].id === 'SLP-01');
  assert.equal(slp01.gate, 'G4');
  assert.equal(slp01.severity.value, 2, 'severity is the rule-declared default (ADR-010)');
});

test('--rules filters by rule ID or family; --changed lints the named file', () => {
  const byId = uie(['lint', BAD, '--rules', 'COL-01', '--json']).json();
  assert.deepEqual([...new Set(byId.hits.map((h) => h.criteria[0].id))], ['COL-01']);
  const byFamily = uie(['lint', BAD, '--rules', 'tells', '--json']).json();
  assert.ok(byFamily.hits.length > 0);
  assert.ok(byFamily.hits.every((h) => h.tags.includes('tells')));
  const changed = uie(['lint', '--changed', path.join(BAD, 'Hero.tsx'), '--json']).json();
  assert.equal(changed.files, 1);
  assert.deepEqual([...new Set(changed.hits.map((h) => h.locations[0].source.file.split('/').pop()))], ['Hero.tsx']);
});

test('--help lists every rule by level, experimental tells as possible', () => {
  const r = uie(['lint', '--help']);
  assert.equal(r.code, 0);
  assert.match(r.out, /Possible \(experimental tells, never counted toward G4\): SLP-57/);
  for (const id of Object.keys(LEVEL)) assert.ok(r.out.includes(id), `help mentions ${id}`);
});

test('--record and --run append hits to tool-findings.jsonl and checks.lint; re-recording replaces lint hits only', (t) => {
  const root = project({
    'src/Hero.tsx': fs.readFileSync(path.join(BAD, 'Hero.tsx'), 'utf8'),
    'src/hero.css': fs.readFileSync(path.join(BAD, 'hero.css'), 'utf8'),
    'src/Effect.tsx': "import { Marquee } from '@/components/magicui/marquee';\nexport const E = () => <Marquee>Hi</Marquee>;\n",
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const env = { UIE_HOME: path.join(root, '.home') };
  assert.equal(uie(['init', '--quiet'], { cwd: root, env }).code, 0);
  const first = uie(['run', 'new', '--label', 'one', '--json'], { cwd: root, env }).json().run;
  const runDir = path.join(root, '.ui-evaluator', 'runs', first);
  // A hit from another check must survive a lint re-record.
  const other = { title: 'axe: colour contrast', description: 'Text contrast is 3.2:1 on the hero.', problem_type: 'single_location', criteria: [{ kind: 'rule', id: 'A11Y-01', primary: true }], found_by: [{ role: 'tool', method: 'tool', check: 'axe' }], locations: [{ route: '/' }] };
  fs.writeFileSync(path.join(runDir, 'tool-findings.jsonl'), `${JSON.stringify(other)}\n`);

  const rec = uie(['lint', '--record', '--json'], { cwd: root, env });
  assert.equal(rec.code, 2, rec.err);
  const out = rec.json();
  assert.equal(out.recorded.run, first);
  const lines = () => fs.readFileSync(path.join(runDir, 'tool-findings.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const recorded = lines();
  const lintHits = recorded.filter((h) => h.found_by.some((b) => b.check === 'lint'));
  assert.equal(lintHits.length, out.recorded.appended);
  assert.equal(recorded.length, lintHits.length + 1, 'the axe hit is kept');
  assert.ok(lintHits.length > 0);
  assert.ok(!lintHits.some((h) => h.level === 'possible'), 'experimental tells stay out of tool-findings.jsonl');
  for (const h of recorded) {
    const v = validate(finding, h);
    assert.ok(v.valid, `${h.title}: ${JSON.stringify(v.errors)}`);
  }
  const checks = JSON.parse(fs.readFileSync(path.join(runDir, 'checks.json'), 'utf8')).checks.lint;
  assert.equal(checks.state, 'ran');
  assert.equal(checks.partial, false, 'a whole-project scan is full coverage');
  assert.equal(checks.hits, lintHits.length);
  assert.equal(checks.engine.name, 'uie-lint');
  assert.ok(checks.criteria.includes('SLP-01') && checks.criteria.includes('A11Y-17'));
  assert.deepEqual(checks.possible.map((p) => p.id), ['SLP-57']);
  assert.equal(JSON.parse(fs.readFileSync(path.join(runDir, 'manifest.json'), 'utf8')).tools['uie-lint'], out.hits[0].found_by[0].engine.version);

  // Re-recording replaces the lint hits instead of appending duplicates.
  assert.equal(uie(['lint', '--record'], { cwd: root, env }).code, 2);
  assert.equal(lines().length, recorded.length);

  // --run <id> records into that run; a bare --run records into the latest. Explicit paths mark coverage partial.
  const second = uie(['run', 'new', '--label', 'two', '--json'], { cwd: root, env }).json().run;
  assert.equal(uie(['lint', 'src/hero.css', '--run', first], { cwd: root, env }).code, 2);
  const firstChecks = JSON.parse(fs.readFileSync(path.join(runDir, 'checks.json'), 'utf8')).checks.lint;
  assert.equal(firstChecks.partial, true);
  assert.equal(firstChecks.coverage.files, 1);
  assert.equal(fs.existsSync(path.join(root, '.ui-evaluator', 'runs', second, 'tool-findings.jsonl')), false);
  assert.equal(uie(['lint', '--run'], { cwd: root, env }).code, 2);
  assert.ok(fs.existsSync(path.join(root, '.ui-evaluator', 'runs', second, 'tool-findings.jsonl')));

  // `uie findings validate` accepts a recorded hit, and `uie findings merge` consumes the run.
  const one = path.join(root, 'hit.json');
  fs.writeFileSync(one, JSON.stringify(lintHits[0]));
  const val = uie(['findings', 'validate', one, '--schema', 'finding'], { cwd: root, env });
  assert.equal(val.code, 0, val.out);
  const merge = uie(['findings', 'merge', '--run', first], { cwd: root, env });
  assert.equal(merge.code, 0, merge.out + merge.err);
  const merged = JSON.parse(fs.readFileSync(path.join(runDir, 'merged.json'), 'utf8'));
  // One deterministic finding per rule and route (ADR-033). (merge currently keeps one location per route for
  // selector-less hits: findings/core.mjs locationKey ignores source.file/line — reported to the lead.)
  assert.equal(merged.findings.filter((f) => f.criteria[0].id === 'SLP-01').length, 1);
});

test('recording without a run is a usage error (exit 1)', (t) => {
  const root = project({ 'src/a.css': '.a { color: var(--ink); }\n' });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const r = uie(['lint', '--record'], { cwd: root });
  assert.equal(r.code, 1);
  assert.match(r.err, /no runs yet/);
});
