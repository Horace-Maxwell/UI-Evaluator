#!/usr/bin/env node
// Score the deterministic detectors (`uie audit`, `uie lint`, `uie journey`) against the seeded ground truth in
// evals/fixtures/*/ground-truth.json (EVALUATION-PLAN §3, §4.1, §6: claims C1 and C2).
//
//   node tools/score-fixtures.mjs [--fixtures a,b] [--quick] [--widths 320,768,1280] [--parallel 3] [--keep]
//                                 [--json] [--out <file>] [--strict]
//
// Each fixture is copied to a scratch project, served on 127.0.0.1, configured from fixture.json and audited
// through the CLI exactly as the skill would run it. A detection is one (criterion, route) pair, the identity of a
// deterministic finding (ADR-033). It matches a seeded defect with the same criterion (primary rule ID or one of
// the hit's WCAG success criteria) on the same route; lint hits on shared CSS or JS files match any route.
// Gate-level detections that match no seeded defect, judged or deterministic, are false positives. Advisory and
// experimental detections are listed but never scored. Exit 0 when every §6 threshold is met, 2 when one is not,
// 1 when the scorer could not run.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills/ui-evaluator');
const UIE = path.join(SKILL, 'scripts/uie.mjs');
const FIXTURES = path.join(ROOT, 'evals/fixtures');
const lib = (p) => import(pathToFileURL(path.join(SKILL, 'scripts/lib', p)).href);

const args = parseArgs(process.argv.slice(2));
const { serveStatic } = await lib('browser/static-server.mjs');
const RULES = JSON.parse(fs.readFileSync(path.join(SKILL, 'assets/data/rules.json'), 'utf8')).rules;
const TELLS = loadTells();

function parseArgs(argv) {
  const out = { fixtures: null, quick: false, widths: [320, 768, 1280], parallel: 1, keep: false, json: false, out: null, strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--fixtures') out.fixtures = argv[(i += 1)].split(',');
    else if (a === '--quick') out.quick = true;
    else if (a === '--widths') out.widths = argv[(i += 1)].split(',').map(Number);
    else if (a === '--parallel') out.parallel = Math.max(1, Number(argv[(i += 1)]) || 1);
    else if (a === '--keep') out.keep = true;
    else if (a === '--json') out.json = true;
    else if (a === '--out') out.out = argv[(i += 1)];
    else if (a === '--strict') out.strict = true;
    else if (a === '--help' || a === '-h') {
      console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 14).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
      process.exit(0);
    } else {
      console.error(`score-fixtures: unknown argument ${a}`);
      process.exit(1);
    }
  }
  return out;
}

function loadTells() {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(SKILL, 'assets/data/tells.json'), 'utf8'));
    const list = Array.isArray(d.tells) ? d.tells : Object.values(d.tells || {});
    return new Map(list.map((t) => [t.id, t]));
  } catch {
    return new Map();
  }
}

/** hard | soft | experimental for SLP IDs; gate | advisory for everything else. */
function levelOf(id, hit) {
  if (/^\d\.\d+\.\d+$/.test(id)) return 'wcag';
  if (/^SLP-\d+/.test(id)) {
    const t = TELLS.get(id);
    if (t?.class) return t.class;
    const n = Number(id.slice(4));
    return n <= 19 ? 'hard' : n <= 49 ? 'soft' : 'experimental';
  }
  if (hit?.advisory || RULES[id]?.level === 'advisory') return 'advisory';
  if (RULES[id]) return 'gate';
  return 'advisory';
}

function normRoute(r) {
  if (r === undefined || r === null || r === '') return '';
  let s = String(r).split('#')[0].split('?')[0];
  if (/^https?:/.test(s)) s = new URL(s).pathname;
  if (!s.startsWith('/')) s = `/${s}`;
  s = s.replace(/\/index\.html?$/, '/');
  return s;
}

// Asynchronous on purpose: the fixture is served from this process, so a synchronous child would block the server.
const uie = (cwd, ...a) => new Promise((resolve) => {
  const child = spawn(process.execPath, [UIE, ...a], { cwd, env: { ...process.env, UIE_HOME: path.join(cwd, '.home') } });
  let out = '';
  let err = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { err += d; });
  const timer = setTimeout(() => child.kill('SIGKILL'), 15 * 60 * 1000);
  child.on('close', (code) => {
    clearTimeout(timer);
    resolve({ code, out, err });
  });
});

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function readJsonl(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

/** Route of a lint hit from its source file: pages map to their URL path, shared CSS/JS to '*'. */
function lintRoute(file, siteDir, root) {
  if (!file) return '*';
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  const relToSite = path.relative(siteDir, abs).split(path.sep).join('/');
  if (relToSite.startsWith('..')) return '*';
  if (/\.html?$/.test(relToSite)) return normRoute(`/${relToSite}`);
  return '*';
}

/** Detections from tool hits: one per (primary criterion, route), with every criterion ID the hit carries. */
function detectionsFrom(hits, siteDir, root) {
  const map = new Map();
  for (const h of hits) {
    const primary = (h.criteria || []).find((c) => c.primary) || (h.criteria || [])[0];
    if (!primary) continue;
    const check = h.found_by?.[0]?.check || '?';
    const routes = new Set();
    for (const l of h.locations || []) {
      if (check === 'lint' || (!l.route && l.source?.file)) routes.add(lintRoute(l.source?.file, siteDir, root));
      else routes.add(normRoute(l.route ?? h.scope?.route));
    }
    if (!routes.size) routes.add(normRoute(h.scope?.route));
    for (const route of routes) {
      const key = `${primary.id}|${route}`;
      const d = map.get(key) || { criterion: primary.id, route, ids: new Set(), checks: new Set(), level: levelOf(primary.id, h), titles: [] };
      for (const c of h.criteria || []) d.ids.add(c.id);
      d.checks.add(check);
      if (d.titles.length < 3) d.titles.push(h.title);
      map.set(key, d);
    }
  }
  return [...map.values()];
}

function routeMatches(detRoute, defRoute) {
  return detRoute === '*' || defRoute === '*' || detRoute === normRoute(defRoute);
}

async function scoreFixture(name) {
  const dir = path.join(FIXTURES, name);
  const fixture = JSON.parse(fs.readFileSync(path.join(dir, 'fixture.json'), 'utf8'));
  const truth = JSON.parse(fs.readFileSync(path.join(dir, 'ground-truth.json'), 'utf8'));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `uie-score-${name}-`));
  const siteDir = path.join(root, 'site');
  const meta = new Set(['fixture.json', 'ground-truth.json', 'PRODUCT.md', 'DESIGN.md', 'journeys']);
  fs.mkdirSync(siteDir, { recursive: true });
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (meta.has(ent.name)) continue;
    const s = path.join(dir, ent.name);
    if (ent.isDirectory()) copyDir(s, path.join(siteDir, ent.name));
    else fs.copyFileSync(s, path.join(siteDir, ent.name));
  }
  for (const f of ['PRODUCT.md', 'DESIGN.md']) if (fs.existsSync(path.join(dir, f))) fs.copyFileSync(path.join(dir, f), path.join(root, f));
  const srv = await serveStatic(siteDir);
  const problems = [];
  try {
    const init = await uie(root, 'init', '--quiet');
    if (init.code !== 0) throw new Error(`uie init failed: ${init.err || init.out}`);
    const cfgPath = path.join(root, '.ui-evaluator/config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    cfg.project = { ...(cfg.project || {}), name: fixture.product || name, work: 'existing' };
    cfg.app = { ...(cfg.app || {}), base_url: srv.url };
    delete cfg.app.start;
    cfg.routes = fixture.routes.map((r) => ({ path: r.path, surface: r.surface || r.path, mode: r.mode, states: r.states && r.states.length ? r.states : [{ name: 'default', actions: [] }] }));
    cfg.matrix = { ...(cfg.matrix || {}), widths: args.widths, themes: fixture.themes || ['light'] };
    if (fixture.locales) cfg.locales = fixture.locales;
    fs.writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`);
    if (fs.existsSync(path.join(dir, 'journeys'))) copyDir(path.join(dir, 'journeys'), path.join(root, '.ui-evaluator/journeys'));

    const runNew = await uie(root, 'run', 'new', '--label', `score-${name}`, '--json');
    if (runNew.code !== 0) throw new Error(`uie run new failed: ${runNew.err}`);
    const run = JSON.parse(runNew.out).run;
    const audit = await uie(root, 'audit', '--run', run, ...(args.quick ? ['--quick'] : []));
    if (audit.code === 1) problems.push(`audit could not run: ${(audit.err || audit.out).trim().split('\n').slice(-3).join(' | ')}`);
    const lint = await uie(root, 'lint', 'site', '--run', run);
    if (lint.code === 1) problems.push(`lint could not run: ${(lint.err || lint.out).trim().split('\n').slice(-3).join(' | ')}`);
    for (const j of fixture.journeys || []) {
      const jr = await uie(root, 'journey', j, '--run', run);
      if (jr.code === 1) problems.push(`journey ${j} could not run: ${(jr.err || jr.out).trim().split('\n').slice(-2).join(' | ')}`);
    }
    const runDir = path.join(root, '.ui-evaluator/runs', run);
    const hits = readJsonl(path.join(runDir, 'tool-findings.jsonl'));
    const checks = fs.existsSync(path.join(runDir, 'checks.json')) ? JSON.parse(fs.readFileSync(path.join(runDir, 'checks.json'), 'utf8')).checks || {} : {};
    for (const [n, c] of Object.entries(checks)) if (c.state === 'failed') problems.push(`check ${n} failed: ${(c.errors || []).slice(0, 2).join(' | ')}`);
    const detections = detectionsFrom(hits, siteDir, root);
    return { name, truth, detections, checks, problems, root };
  } finally {
    await srv.close();
    if (!args.keep) fs.rmSync(root, { recursive: true, force: true });
  }
}

function evaluate(results) {
  const perRule = new Map();
  const rule = (id) => {
    if (!perRule.has(id)) perRule.set(id, { id, level: levelOf(id), tp: 0, fn: 0, fp: 0, fpWhere: [], fnWhere: [] });
    return perRule.get(id);
  };
  const perFixture = [];
  for (const r of results) {
    const defects = r.truth.defects || [];
    const det = defects.filter((d) => d.kind === 'deterministic');
    const matched = new Set();
    let tp = 0;
    let fn = 0;
    for (const d of det) {
      // A defect can fail several criteria (a missing label is 3.3.2 and an axe rule at once): any of them counts.
      const ids = [d.criterion, ...(d.also_criteria || [])];
      const hit = r.detections.find((x) => ids.some((id) => x.ids.has(id)) && routeMatches(x.route, d.route));
      if (hit) {
        tp += 1;
        matched.add(hit);
        rule(d.criterion).tp += 1;
      } else {
        fn += 1;
        const rr = rule(d.criterion);
        rr.fn += 1;
        rr.fnWhere.push(`${r.name}:${d.id} ${d.route}`);
      }
    }
    let fp = 0;
    const extra = [];
    for (const x of r.detections) {
      if (matched.has(x)) continue;
      if (!['gate', 'hard', 'soft'].includes(x.level)) continue;
      const explained = defects.some((d) => [d.criterion, ...(d.also_criteria || [])].some((id) => x.ids.has(id)) && routeMatches(x.route, d.route));
      if (explained) continue;
      fp += 1;
      const rr = rule(x.criterion);
      rr.fp += 1;
      rr.fpWhere.push(`${r.name} ${x.route}: ${x.titles[0] || ''}`.slice(0, 160));
      extra.push(x);
    }
    perFixture.push({
      fixture: r.name,
      clean: !!r.truth.clean,
      deterministic_defects: det.length,
      judged_defects: defects.length - det.length,
      tp,
      fn,
      fp,
      precision: tp + fp ? tp / (tp + fp) : null,
      recall: det.length ? tp / det.length : null,
      problems: r.problems,
      false_positives: extra.map((x) => ({ criterion: x.criterion, route: x.route, check: [...x.checks].join(','), title: x.titles[0] })),
    });
  }
  const rules = [...perRule.values()].map((x) => ({
    ...x,
    precision: x.tp + x.fp ? x.tp / (x.tp + x.fp) : null,
    recall: x.tp + x.fn ? x.tp / (x.tp + x.fn) : null,
  })).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  return { perFixture, rules };
}

/** EVALUATION-PLAN §6 thresholds that deterministic scoring can check. */
function thresholds({ perFixture, rules }) {
  const out = [];
  for (const r of rules.filter((x) => x.level === 'hard')) {
    if (r.tp + r.fn === 0) continue;
    out.push({ area: 'hard-tell detector', id: r.id, ok: (r.precision ?? 1) >= 0.9 && (r.recall ?? 0) >= 0.8, detail: `precision ${fmt(r.precision)} recall ${fmt(r.recall)} [calibrating]` });
  }
  const a11y = rules.filter((x) => /^A11Y-/.test(x.id) || /^\d\.\d+\.\d+$/.test(x.id));
  const tp = a11y.reduce((s, x) => s + x.tp, 0);
  const fn = a11y.reduce((s, x) => s + x.fn, 0);
  if (tp + fn) out.push({ area: 'scripted accessibility recall', id: 'A11Y', ok: tp / (tp + fn) >= 0.9, detail: `recall ${fmt(tp / (tp + fn))} (${tp}/${tp + fn}); needs ≥ 0.9` });
  const clean = perFixture.filter((f) => f.clean);
  for (const f of clean) out.push({ area: 'clean-control false positives', id: f.fixture, ok: f.fp === 0 && !f.problems.length, detail: `${f.fp} false positive(s)${f.problems.length ? `; ${f.problems.length} run problem(s)` : ''}` });
  return out;
}

const fmt = (v) => (v === null || v === undefined ? '—' : v.toFixed(2));

async function main() {
  if (!fs.existsSync(FIXTURES)) {
    console.error('score-fixtures: evals/fixtures does not exist');
    return 1;
  }
  const names = (args.fixtures || fs.readdirSync(FIXTURES).filter((n) => fs.existsSync(path.join(FIXTURES, n, 'ground-truth.json')))).sort();
  if (!names.length) {
    console.error('score-fixtures: no fixtures with ground-truth.json');
    return 1;
  }
  // Each fixture runs its own server, project and browser, so several can be audited at once (--parallel).
  const results = new Array(names.length);
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next;
      next += 1;
      if (i >= names.length) return;
      const n = names[i];
      const t0 = Date.now();
      try {
        results[i] = await scoreFixture(n);
        if (!args.json) console.error(`  · ${n}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      } catch (e) {
        results[i] = { name: n, truth: { defects: [] }, detections: [], checks: {}, problems: [`could not score: ${e.message}`] };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(args.parallel, names.length) }, worker));
  const scored = evaluate(results);
  const th = thresholds(scored);
  const report = { at: new Date().toISOString(), widths: args.widths, quick: args.quick, ...scored, thresholds: th };
  if (args.out) {
    fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
    fs.writeFileSync(path.resolve(args.out), `${JSON.stringify(report, (k, v) => (v instanceof Set ? [...v] : v), 2)}\n`);
  }
  if (args.json) {
    console.log(JSON.stringify(report, (k, v) => (v instanceof Set ? [...v] : v), 2));
  } else {
    console.log('\nPer fixture (deterministic defects only; gate-level detections)');
    for (const f of scored.perFixture) {
      console.log(`  ${f.fixture.padEnd(15)} defects ${String(f.deterministic_defects).padStart(2)} (+${f.judged_defects} judged)  TP ${String(f.tp).padStart(2)}  FN ${String(f.fn).padStart(2)}  FP ${String(f.fp).padStart(2)}  precision ${fmt(f.precision)}  recall ${fmt(f.recall)}`);
      for (const p of f.problems) console.log(`      ! ${p}`);
      for (const x of f.false_positives.slice(0, 8)) console.log(`      FP ${x.criterion} ${x.route} [${x.check}] ${x.title || ''}`.slice(0, 180));
    }
    console.log('\nPer rule');
    for (const r of scored.rules) {
      console.log(`  ${r.id.padEnd(10)} ${r.level.padEnd(12)} TP ${r.tp}  FN ${r.fn}  FP ${r.fp}  precision ${fmt(r.precision)}  recall ${fmt(r.recall)}`);
      for (const w of r.fnWhere.slice(0, 4)) console.log(`      missed ${w}`);
    }
    console.log('\nEVALUATION-PLAN §6 (deterministic part)');
    for (const t of th) console.log(`  ${t.ok ? 'pass' : 'FAIL'}  ${t.area} ${t.id}: ${t.detail}`);
  }
  const failed = th.filter((t) => !t.ok).length;
  const runProblems = scored.perFixture.reduce((s, f) => s + f.problems.length, 0);
  if (runProblems && args.strict) return 1;
  return failed ? 2 : 0;
}

process.exitCode = await main();
