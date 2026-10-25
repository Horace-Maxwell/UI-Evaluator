// The positive path: a clean, fully checked project reaches L2 through the CLI. Every agent-level round so far
// computed level "none", so the passing paths of the gates were never exercised end to end, and a gate that could not
// pass (USE-03 with parallel verifiers) shipped unnoticed (review of 2026-10-24, M9).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const UIE = path.join(REPO, 'skills/ui-evaluator/scripts/uie.mjs');
const { loadRules } = await import(path.join(REPO, 'skills/ui-evaluator/scripts/lib/gates/rules.mjs'));

test('a clean, fully checked project, verified in parallel parts and rated blind, reaches L2', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-clean-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const env = { ...process.env, UIE_HOME: path.join(root, '.home') };
  const uie = (...a) => { const r = spawnSync(process.execPath, [UIE, ...a], { cwd: root, env, encoding: 'utf8' }); return { code: r.status, out: r.stdout, err: r.stderr }; };
  const write = (p, d) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof d === 'string' ? d : JSON.stringify(d, null, 2)); };
  uie('init', '--quiet');
  for (const f of ['PRODUCT.md', 'DESIGN.md']) fs.copyFileSync(path.join(REPO, 'evals/fixtures/slot-booking', f), path.join(root, f));
  const now = new Date().toISOString();
  write(path.join(root, '.ui-evaluator/doctor.json'), { at: now, passed: true, uie: 'test' });
  const runId = JSON.parse(uie('run', 'new', '--label', 'audit', '--depth', 'standard', '--json').out).run;
  const rd = path.join(root, '.ui-evaluator/runs', runId);
  const man = JSON.parse(fs.readFileSync(path.join(rd, 'manifest.json'), 'utf8'));
  man.captures = { valid: 12, invalid: 0 };
  write(path.join(rd, 'manifest.json'), man);
  const rules = loadRules();
  const names = new Set(['tells', 'lint', 'copy']);
  for (const r of Object.values(rules.criteria || rules)) for (const c of [].concat(r.checks || r.check || [])) names.add(c);
  write(path.join(rd, 'checks.json'), { checks: Object.fromEntries([...names].map((c) => [c, { state: 'ran', at: now, coverage: {} }])) });
  const common = { model: 'test-model', isolation: 'subagent', packet_hash: 'x' };
  const minor = (title, route, sel) => ({ title, description: `${title}, seen at 375 px.`, problem_type: 'single_location', criteria: [{ kind: 'heuristic', id: 'H8', primary: true }], locations: [{ route, state: 'default', selector: sel }], evidence: [{ type: 'screenshot', ref: 'evidence/x.png' }], impact: 'A small visual inconsistency.' });
  const found = { 'he-1': [minor('Footer link underline is faint', '/', 'footer a')], 'he-2': [minor('Done page heading sits close to the reference', '/done.html', 'h1')], 'he-3': [] };
  for (const a of ['he-1', 'he-2', 'he-3']) write(path.join(rd, `evaluators/${a}.json`), { schema: 'evaluator-output', role: 'heuristic-evaluator', agent: a, ...common, passes: [{ pass: 1 }, { pass: 2 }], strengths: [], candidates: found[a], task_suitability: [{ task: 'book a slot', completable: true }], coverage: { controls_total: 20, controls_exercised: 20 }, cross_screen_pass: true });
  write(path.join(rd, 'evaluators/a11y.json'), { schema: 'evaluator-output', role: 'accessibility-auditor', agent: 'a11y', ...common, candidates: [] });
  for (const i of [1, 2, 3]) {
    const agent = `critic-${i}`;
    write(path.join(rd, `panel/${agent}.verdict.json`), { agent, value: 'specific', evidence: ['first viewport'], written_at: now, appeal: { value: 'appealing', unfinished: [], evidence: ['hero'] } });
    const score = (n) => ({ score: n, evidence: ['the slot grid at 375 px'] });
    write(path.join(rd, `panel/${agent}.json`), { agent, ...common, verdict: { value: 'specific' }, tests: { swap: { result: 'pass' }, category_guess: { result: 'pass' }, similar_prompt: { result: 'pass' } }, brand_fit: { overall: 'reflected' }, appeal: { value: 'appealing', evidence: ['hero'] }, rubric: Object.fromEntries(['specificity', 'hierarchy', 'coherence', 'restraint', 'brand_fit', 'execution', 'appeal'].map((k) => [k, score(3)])), candidates: [] });
  }
  const step = (...a) => { const r = uie(...a); assert.equal(r.code, 0, `${a.join(' ')}: ${r.err || r.out}`); return r; };
  step('findings', 'merge'); step('findings', 'agreement');
  const next = () => JSON.parse(uie('next', '--json').out).next;
  assert.equal(next().step, 'verification', 'after the merge, uie next points at the verifier');
  step('packet', '--role', 'finding-verifier', '--parts', '2');
  assert.match(next().command, /uie\.mjs" wait ".*verifier-p1\.json" ".*verifier-p2\.json"/, 'then at waiting for both parts');
  const ids = JSON.parse(fs.readFileSync(path.join(rd, 'merged.json'), 'utf8')).findings.filter((f) => f.status === 'candidate').map((f) => f.id);
  const parts = fs.readdirSync(path.join(rd, 'packets')).filter((n) => /^finding-verifier-\d+$/.test(n)).sort();
  parts.forEach((n, i) => { const c = JSON.parse(fs.readFileSync(path.join(rd, 'packets', n, 'candidates.json'), 'utf8')); write(path.join(rd, `verifier-p${i + 1}.json`), { agent: `verifier-p${i + 1}`, ...common, verdicts: c.map((x) => ({ candidate_id: x.candidate_id, verdict: 'confirmed', step: 'none', reason: 'reproduced', evidence: [] })) }); });
  assert.deepEqual(fs.readdirSync(rd).filter((n) => /^verifier/.test(n)).sort(), ['verifier-p1.json', 'verifier-p2.json'], 'verified in parallel parts only');
  step('findings', 'apply-verdicts');
  step('packet', '--role', 'severity-rater', '--n', '3');
  const map = JSON.parse(fs.readFileSync(path.join(rd, 'packets/.blind-map-raters.json'), 'utf8'));
  for (const i of [1, 2, 3]) write(path.join(rd, `ratings/rater-${i}.json`), { rater: `rater-${i}`, ...common, ratings: Object.keys(map).map((b) => ({ finding_id: b, frequency: 1, impact: 1, persistence: 0, value: 1, validity: 'problem', note: 'minor' })) });
  step('findings', 'rate'); step('findings', 'promote'); step('report');
  const g = JSON.parse(uie('gates', '--json', '--target', 'L2').out);
  assert.equal(next(), null, 'every step is done');
  assert.equal(g.achieved, 'L2', `blocking: ${(g.blocking || []).map((b) => `${b.criterion} ${g.criteria[b.criterion]?.detail}`).join('; ')}`);
  assert.equal(g.criteria['USE-03'].state, 'pass');
  assert.equal(g.criteria['EVD-07'].state, 'pass');
});
