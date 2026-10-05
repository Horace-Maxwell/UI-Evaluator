// Gate engine behaviour on synthetic inputs: soft-tell dispositions (ADR-031), the DEC-04 ledger (ADR-034),
// waivers, not_run never passing, and level computation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadInputs, evaluateGates } from '../../skills/ui-evaluator/scripts/lib/gates/evaluate.mjs';
import { loadRules } from '../../skills/ui-evaluator/scripts/lib/gates/rules.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UIE = path.resolve(HERE, '../../skills/ui-evaluator/scripts/uie.mjs');
// In-process evaluations read $UIE_HOME (machine ledger, machine doctor record): keep them off the real one.
const HERMETIC_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-gates-home-'));
process.env.UIE_HOME = HERMETIC_HOME;
process.on('exit', () => fs.rmSync(HERMETIC_HOME, { recursive: true, force: true }));

function workspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-gates-'));
  const env = { ...process.env, UIE_HOME: path.join(root, '.home') };
  execFileSync(process.execPath, [UIE, 'init', '--quiet'], { cwd: root, env });
  const out = execFileSync(process.execPath, [UIE, 'run', 'new', '--label', 't', '--json'], { cwd: root, env, encoding: 'utf8' });
  const runId = JSON.parse(out).run;
  return { root, runDir: path.join(root, '.ui-evaluator', 'runs', runId), env };
}

const tell = (id, status, route = '/') => ({
  id: `F-${id}-${route}`,
  status,
  criteria: [{ kind: 'rule', id, primary: true }],
  found_by: [{ role: 'tool', method: 'tool', check: 'tells' }],
  locations: [{ route }],
});

test('soft tells: no disposition fails; ≤ 1 deferred per page passes; 2 on one page fail (ADR-031)', (t) => {
  const { root, runDir } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rules = loadRules();
  const softIds = Object.values(rules).filter((r) => r.id.startsWith('SLP-') && r.class === 'soft').map((r) => r.id);
  assert.ok(softIds.length >= 2);
  const [a, b] = softIds;
  const run = (findings) => {
    const I = loadInputs(root, runDir);
    I.checks = { ...I.checks, tells: { state: 'ran' }, lint: { state: 'ran' }, copy: { state: 'ran' } };
    I.runFindings = findings;
    return evaluateGates(I, rules, { target: 'L1' }).criteria;
  };
  assert.equal(run([tell(a, 'open')])[a].state, 'fail');
  assert.equal(run([tell(a, 'deferred')])[a].state, 'pass');
  assert.equal(run([tell(a, 'deferred', '/'), tell(b, 'deferred', '/pricing')])[a].state, 'pass');
  const crowded = run([tell(a, 'deferred', '/'), tell(b, 'wont_fix', '/')]);
  assert.equal(crowded[a].state, 'fail');
  assert.equal(crowded[b].state, 'fail');
  assert.equal(run([tell(a, 'disputed'), tell(b, 'deferred')])[a].state, 'pass');
});

test('hard tells fail until fixed or accepted; SLP-12 can never be accepted', (t) => {
  const { root, runDir } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rules = loadRules();
  const I = loadInputs(root, runDir);
  I.checks = { ...I.checks, tells: { state: 'ran' }, lint: { state: 'ran' }, copy: { state: 'ran' } };
  I.runFindings = [tell('SLP-12', 'open')];
  I.accepted = new Map([['SLP-12', { id: 'SLP-12', reason: 'brief asks', decided_by: 'owner' }]]);
  const c = evaluateGates(I, rules, { target: 'L1' }).criteria;
  assert.equal(c['SLP-12'].state, 'fail');
});

test('not_run never counts as pass and blocks L1', (t) => {
  const { root, runDir } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const res = evaluateGates(loadInputs(root, runDir), loadRules(), { target: 'L1' });
  assert.equal(res.achieved, 'L0');
  assert.equal(res.achieved_label, 'none');
  assert.ok(res.blocking.some((b) => b.state === 'not_run'));
  assert.ok(['not_run', 'fail'].includes(res.gates.G1.state));
});

test('DEC-04: first project direction is not_applicable; a repeat fails; the global ledger is advisory (ADR-034)', (t) => {
  const { root, runDir, env } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const cfgPath = path.join(root, '.ui-evaluator', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  cfg.project.work = 'new';
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  const ledgerPath = path.join(root, '.ui-evaluator', 'ledger.json');
  const entry = (id, face, macro) => ({ id, display_face: face, macrostructure: macro, at: '2026-10-01' });
  const rules = loadRules();
  const dec04 = () => {
    process.env.UIE_HOME = env.UIE_HOME;
    return evaluateGates(loadInputs(root, runDir), rules, { target: 'L1' }).criteria['DEC-04'];
  };
  fs.writeFileSync(ledgerPath, JSON.stringify({ version: 1, entries: [entry('D-1', 'Fraunces', 'split hero')] }));
  assert.equal(dec04().state, 'not_applicable');
  fs.writeFileSync(ledgerPath, JSON.stringify({ version: 1, entries: [entry('D-1', 'Fraunces', 'split hero'), entry('D-2', 'Fraunces', 'index list')] }));
  assert.equal(dec04().state, 'fail');
  fs.writeFileSync(ledgerPath, JSON.stringify({ version: 1, entries: [entry('D-1', 'Fraunces', 'split hero'), entry('D-2', 'Söhne', 'index list')] }));
  fs.mkdirSync(env.UIE_HOME, { recursive: true });
  fs.writeFileSync(path.join(env.UIE_HOME, 'ledger.json'), JSON.stringify({ version: 1, entries: [entry('X-9', 'Söhne', 'bento grid')] }));
  const r = dec04();
  assert.equal(r.state, 'pass');
  assert.match(r.detail, /advisory/);
  process.env.UIE_HOME = HERMETIC_HOME;
});

test('criteria about exercised behaviour never pass on an empty or unexercised scope', (t) => {
  const { root, runDir } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rules = loadRules();
  const run = (checks) => {
    const I = loadInputs(root, runDir);
    I.checks = { ...I.checks, ...checks };
    I.runFindings = [];
    return evaluateGates(I, rules, { target: 'L1' }).criteria;
  };
  const noForms = run({ forms: { state: 'ran', forms_probed: 0, skipped: [], exercised_error_states: 0 } });
  assert.equal(noForms['CPY-04'].state, 'not_applicable', 'no forms: nothing to judge');
  const noErrors = run({ forms: { state: 'ran', forms_probed: 2, skipped: [], exercised_error_states: 0 } });
  assert.equal(noErrors['CPY-04'].state, 'degraded', 'forms probed but no error state appeared: unverified, not pass');
  const exercised = run({ forms: { state: 'ran', forms_probed: 2, skipped: [], exercised_error_states: 3 } });
  assert.equal(exercised['CPY-04'].state, 'pass');
  const live = run({ 'live-regions': { state: 'ran', actions_probed: 4, actions_skipped: 1, actions_exercised: 0 } });
  assert.equal(live['A11Y-15'].state, 'degraded');
  const dialogs = run({ dialogs: { state: 'ran', dialogs_probed: 0, untested: [] } });
  assert.equal(dialogs['A11Y-06'].state, 'not_applicable');
  const notRun = run({});
  assert.equal(notRun['CPY-04'].state, 'not_run', 'a check that never ran stays not_run');
});

test('tells are covered only by the checks that can see them; catalogue soft tells count; n/a passes through', (t) => {
  const { root, runDir } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rules = loadRules();
  const run = (checks, findings = []) => {
    const I = loadInputs(root, runDir);
    I.checks = { ...I.checks, ...checks };
    I.runFindings = findings;
    return evaluateGates(I, rules, { target: 'L1' }).criteria;
  };
  const lintOnly = run({ lint: { state: 'ran' } });
  assert.equal(lintOnly['SLP-05'].state, 'not_run', 'a DOM-only tell is not covered by a lint-only run');
  assert.equal(lintOnly['SLP-01'].state, 'degraded', 'a source+DOM tell is partly covered by lint alone');
  const both = run({ lint: { state: 'ran' }, tells: { state: 'ran' }, copy: { state: 'ran' } });
  assert.equal(both['SLP-01'].state, 'pass');
  assert.equal(both['SLP-05'].state, 'pass');
  assert.ok(both['SLP-31'], 'catalogue soft tells beyond QUALITY-BAR are evaluated (ADR-031)');
  const undisposed = run({ lint: { state: 'ran' }, tells: { state: 'ran' }, copy: { state: 'ran' } }, [tell('SLP-31', 'open')]);
  assert.equal(undisposed['SLP-31'].state, 'fail', 'an undisposed catalogue soft tell fails G4');
  const onePage = run({ 'cross-page': { state: 'ran', not_applicable: 'only one route is in scope' } });
  assert.equal(onePage['A11Y-18'].state, 'not_applicable');
  assert.equal(onePage['FUN-03'].state, 'not_applicable', 'no critical journeys declared');
});

test('L1 lists the G2 rows waiting for the auditor; L2 requires them; a confirmed judged failure blocks L1', (t) => {
  const { root, runDir } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rules = loadRules();
  const base = () => {
    const I = loadInputs(root, runDir);
    I.checks = { ...I.checks, axe: { state: 'ran', incomplete: 2 } };
    return I;
  };
  const res = evaluateGates(base(), rules, { target: 'L2' });
  for (const id of ['A11Y-02', 'A11Y-19', 'A11Y-27']) {
    assert.equal(res.criteria[id].state, 'not_run', `${id} has no auditor yet`);
    assert.ok(res.gates.G2.judged_listed.includes(id), `${id} is listed for judgement`);
    assert.ok(!res.blocking.some((b) => b.level === 'L1' && b.criterion === id), `${id} does not block L1`);
    assert.ok(res.blocking.some((b) => b.level === 'L2' && b.criterion === id), `${id} blocks L2`);
  }
  const noAxe = evaluateGates(loadInputs(root, runDir), rules, { target: 'L1' });
  assert.ok(!noAxe.gates.G2.judged_listed.includes('A11Y-02'), 'A11Y-02 is scripted work while axe has not run');
  const I = base();
  I.runFindings = [{ id: 'F-1', status: 'open', criteria: [{ kind: 'rule', id: 'A11Y-19', primary: true }], found_by: [{ role: 'accessibility-auditor', method: 'A' }], locations: [{ route: '/' }] }];
  const failing = evaluateGates(I, rules, { target: 'L1' });
  assert.equal(failing.criteria['A11Y-19'].state, 'fail');
  assert.equal(failing.gates.G2.l1_state, 'fail');
  assert.ok(failing.blocking.some((b) => b.level === 'L1' && b.criterion === 'A11Y-19'));
});

test('EVD-02 reads the machine-level doctor record when it is newer and from this version', async (t) => {
  const { root, runDir } = workspace();
  const home = path.join(root, '.machine');
  process.env.UIE_HOME = home;
  t.after(() => {
    process.env.UIE_HOME = HERMETIC_HOME;
    fs.rmSync(root, { recursive: true, force: true });
  });
  const { version } = await import('../../skills/ui-evaluator/scripts/lib/cli.mjs');
  const rules = loadRules();
  const evd02 = () => evaluateGates(loadInputs(root, runDir), rules, { target: 'L1' }).criteria['EVD-02'];
  assert.equal(evd02().state, 'not_run');
  fs.mkdirSync(home, { recursive: true });
  const rec = (over) => fs.writeFileSync(path.join(home, 'doctor.json'), JSON.stringify({ at: new Date().toISOString(), uie: version(), passed: true, ...over }));
  rec({});
  assert.equal(evd02().state, 'pass');
  assert.ok(evd02().evidence[0].endsWith('doctor.json'));
  rec({ uie: '0.0.0-other' });
  assert.equal(evd02().state, 'not_run', 'another version\'s smoke test does not count');
  rec({ at: new Date(Date.now() - 30 * 3600e3).toISOString() });
  assert.equal(evd02().state, 'not_run', 'older than 24 h');
});

test('DES-07: a majority of appeal verdicts decides; no verdict is not_run; the rubric needs all seven criteria (ADR-035)', (t) => {
  const { root, runDir } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rules = loadRules();
  const dir = path.join(runDir, 'panel');
  fs.mkdirSync(dir, { recursive: true });
  const rubric = (keys) => Object.fromEntries(keys.map((k) => [k, { score: 3, evidence: ['screen'] }]));
  const ALL = ['specificity', 'hierarchy', 'coherence', 'restraint', 'brand_fit', 'execution', 'appeal'];
  const write = (appeals, keys = ALL) => {
    for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f));
    appeals.forEach((a, i) => {
      const agent = `critic-${i + 1}`;
      fs.writeFileSync(path.join(dir, `${agent}.json`), JSON.stringify({ agent, tests: {}, verdict: { value: 'specific' }, rubric: rubric(keys) }));
      fs.writeFileSync(path.join(dir, `${agent}.verdict.json`), JSON.stringify({ agent, value: 'specific', evidence: ['x'], ...(a ? { appeal: { value: a, unfinished: [], evidence: ['x'] } } : {}) }));
    });
  };
  const crit = (id) => evaluateGates(loadInputs(root, runDir), rules, { target: 'L2' }).criteria[id];
  write(['appealing', 'plain', 'appealing']);
  assert.equal(crit('DES-07').state, 'pass');
  write(['plain', 'plain', 'appealing']);
  assert.equal(crit('DES-07').state, 'fail');
  assert.match(crit('DES-07').detail, /1\/3/);
  write([null, null, null]);
  assert.equal(crit('DES-07').state, 'not_run', 'verdict files from before ADR-035 carry no appeal verdict');
  write(['appealing', 'appealing', 'appealing'], ALL.slice(0, 6));
  assert.equal(crit('DES-06').state, 'fail', 'a rubric without Appeal is incomplete');
  assert.equal(crit('DES-07').state, 'pass');
});

test('the detector section stays sealed until the verdict file holds the appeal verdict (ADR-035)', (t) => {
  const { root, runDir, env } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const uie = (...a) => execFileSync(process.execPath, [UIE, ...a], { cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  uie('packet', '--role', 'design-critic');
  const vfile = path.join(runDir, 'panel', 'critic-1.verdict.json');
  fs.mkdirSync(path.dirname(vfile), { recursive: true });
  fs.writeFileSync(vfile, JSON.stringify({ agent: 'critic-1', value: 'specific', evidence: ['first viewport'] }));
  assert.throws(() => uie('packet', '--role', 'design-critic', '--unseal', '--agent', 'critic-1'), (err) => /no appeal verdict/.test(String(err.stderr)));
  fs.writeFileSync(vfile, JSON.stringify({ agent: 'critic-1', value: 'specific', evidence: ['first viewport'], appeal: { value: 'plain', unfinished: ['placeholder boxes in the hero'], evidence: ['hero'] } }));
  assert.match(uie('packet', '--role', 'design-critic', '--unseal', '--agent', 'critic-1'), /unsealed detector output for critic-1/);
});

test('DES-01: a quick-depth critic is feedback, never a panel; critics without isolation degrade the panel', (t) => {
  const { root, runDir } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rules = loadRules();
  const dir = path.join(runDir, 'panel');
  fs.mkdirSync(dir, { recursive: true });
  const write = (n, isolation) => {
    for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f));
    for (let i = 1; i <= n; i += 1) {
      const agent = `critic-${i}`;
      fs.writeFileSync(path.join(dir, `${agent}.json`), JSON.stringify({ agent, isolation, tests: {}, verdict: { value: 'specific' }, rubric: {} }));
      fs.writeFileSync(path.join(dir, `${agent}.verdict.json`), JSON.stringify({ agent, value: 'specific', evidence: ['x'], appeal: { value: 'appealing', evidence: ['x'] } }));
    }
  };
  const des01 = (depth) => {
    const I = loadInputs(root, runDir);
    I.manifest = { ...(I.manifest || {}), depth };
    return evaluateGates(I, rules, { target: 'L2' }).criteria['DES-01'];
  };
  write(1, 'single-context');
  assert.equal(des01('quick').state, 'degraded');
  write(1, 'subagent');
  assert.equal(des01('quick').state, 'degraded', 'even an isolated single critic is not a panel');
  write(3, 'single-context');
  assert.equal(des01('standard').state, 'degraded');
  write(3, 'subagent');
  assert.equal(des01('standard').state, 'pass');
  write(2, 'subagent');
  assert.equal(des01('standard').state, 'fail');
});

test('findings validate accepts a directory and checks every JSON file in it', (t) => {
  const { root, runDir, env } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(runDir, 'panel');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'critic-1.verdict.json'), JSON.stringify({ agent: 'critic-1', value: 'specific', evidence: ['x'] }));
  fs.writeFileSync(path.join(dir, 'critic-2.verdict.json'), JSON.stringify({ agent: 'critic-2', value: 'maybe', evidence: ['x'] }));
  let out = '';
  try {
    execFileSync(process.execPath, [UIE, 'findings', 'validate', dir], { cwd: root, env, encoding: 'utf8' });
  } catch (err) {
    out = String(err.stdout);
    assert.equal(err.status, 2);
  }
  assert.match(out, /ok\s+.*critic-1\.verdict\.json/);
  assert.match(out, /BAD .*critic-2\.verdict\.json/);
});

test('the ledger accent is the brand colour, not an ink-coloured primary button', async () => {
  const { accentOf, hueBucket } = await import('../../skills/ui-evaluator/scripts/lib/roll/ledger.mjs');
  const calligraphy = { surface: 'oklch(0.985 0 0)', primary: 'oklch(0.25 0 0)', 'on-primary': 'oklch(0.99 0 0)', signature: 'oklch(0.61 0.17 33)', error: 'oklch(0.50 0.19 27)' };
  assert.equal(accentOf(calligraphy), 'oklch(0.61 0.17 33)');
  assert.equal(hueBucket(accentOf(calligraphy)), 'h30-60');
  assert.equal(accentOf({ primary: 'oklch(0.55 0.15 250)', signature: 'oklch(0.61 0.17 33)' }), 'oklch(0.55 0.15 250)', 'a chromatic primary stays the accent');
  assert.equal(accentOf({ primary: 'oklch(0.25 0 0)', error: 'oklch(0.5 0.2 27)' }), 'oklch(0.25 0 0)', 'semantic colours never count; an all-neutral system stays neutral');
});

test('USE-05 and USE-06 count open judged findings carried in the register, even in a run that did not re-examine them', (t) => {
  const { root, runDir } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rules = loadRules();
  const reg = path.join(root, '.ui-evaluator', 'findings.json');
  const judged = (id, status, priority, mean) => ({ id, status, priority, title: `Judged ${id}`, severity: { mean }, criteria: [{ kind: 'heuristic', id: 'H5', primary: true }], found_by: [{ role: 'heuristic-evaluator', method: 'HE', agent: 'he-1' }], locations: [{ route: '/' }] });
  const tool = { id: 'F-9', status: 'open', priority: 'P0', severity: { source: 'rule', mean: 4 }, criteria: [{ kind: 'rule', id: 'A11Y-01', primary: true }], found_by: [{ role: 'tool', method: 'tool', check: 'axe' }], locations: [{ route: '/' }] };
  fs.writeFileSync(reg, JSON.stringify({ version: 1, next_id: 10, findings: [judged('F-1', 'open', 'P0', 3.7), judged('F-2', 'confirmed', 'P1', 3), judged('F-3', 'verified', 'P0', 3.8), tool] }));
  const res = evaluateGates(loadInputs(root, runDir), rules, { target: 'L2' });
  assert.equal(res.criteria['USE-05'].state, 'fail', 'the open judged P0 still blocks');
  assert.deepEqual(res.criteria['USE-05'].evidence, ['F-1'], 'verified findings and deterministic ones (re-measured by the run itself) are not carried');
  assert.equal(res.criteria['USE-06'].state, 'fail');
});

test('findings set corrects a mis-cited criterion; only a person may drop a WCAG citation; A11Y-27 counts carried judged findings', (t) => {
  const { root, runDir, env } = workspace();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const reg = path.join(root, '.ui-evaluator', 'findings.json');
  const f = { id: 'F-1', status: 'open', title: 'Labels are not tied to their fields', criteria: [{ kind: 'wcag', id: '1.3.1', primary: true }], found_by: [{ role: 'heuristic-evaluator', method: 'HE', agent: 'he-1' }], locations: [{ route: '/' }], severity: { mean: 2 } };
  fs.writeFileSync(reg, JSON.stringify({ version: 1, next_id: 2, findings: [f] }));
  const rules = loadRules();
  assert.equal(evaluateGates(loadInputs(root, runDir), rules, { target: 'L1' }).criteria['A11Y-27'].state, 'fail', 'a carried open judged WCAG finding fails A11Y-27');
  const uie = (...a) => execFileSync(process.execPath, [UIE, ...a], { cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  uie('findings', 'set', 'F-1', '--add-criterion', 'heuristic:H5');
  assert.throws(() => uie('findings', 'set', 'F-1', '--drop-criterion', '1.3.1'), (err) => /human/.test(String(err.stderr)));
  uie('findings', 'set', 'F-1', '--drop-criterion', '1.3.1', '--by', 'human:owner', '--note', 'not a 1.3.1 failure: the labels are programmatic');
  const after = JSON.parse(fs.readFileSync(reg, 'utf8')).findings[0];
  assert.deepEqual(after.criteria.map((c) => `${c.kind}:${c.id}:${!!c.primary}`), ['heuristic:H5:true']);
  assert.equal(after.criteria_history.length, 2);
  assert.equal(evaluateGates(loadInputs(root, runDir), rules, { target: 'L1' }).criteria['A11Y-27'].state === 'fail', false);
});
