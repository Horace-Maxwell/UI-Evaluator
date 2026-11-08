#!/usr/bin/env node
// Grade one run of a build benchmark with the same instrument for both configurations (with and without the skill):
//   node tools/bench/grade-build.mjs <run-dir> <eval-id>
// The run folder holds outputs/project (the build) and, if the agent wrote one, outputs/reply.md.
// 1. Find the built site in outputs/project and copy only its shipped files to a fresh scratch project (no workspace,
//    no PRODUCT.md or DESIGN.md: the measurement must not depend on which configuration made it).
// 2. Serve it, run `uie audit` (all checks, remote assets allowed) and `uie lint` over it, and `uie gates --target L1`.
// 3. Write <run-dir>/metrics.json (criteria failed per gate, tells, axe, achieved level), <run-dir>/screens/ (stills for
//    the blind comparison), <run-dir>/blind-site/ (the site without comments) and <run-dir>/grading.json (the eval's
//    assertions, checked by script; each is `output`, a check on the page or the reply, or `process`, a check on the
//    skill's own files, which only a run with the skill can pass).
// Needs the browser runtime (`node skills/ui-evaluator/scripts/uie.mjs doctor --install`).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { SKILL_DIR, assertionKind, findServerApp, findSiteRoot, scoreOf, startServerApp, usage, walkFiles as walk } from './lib.mjs';
import { chineseLang, cjkFonts, outputChecks } from './build-checks.mjs';
import { stripComments } from './strip-comments.mjs';

const UIE = path.join(SKILL_DIR, 'scripts/uie.mjs');
const lib = (p) => import(pathToFileURL(path.join(SKILL_DIR, 'scripts/lib', p)).href);
const [runDir, evalIdArg] = process.argv.slice(2);
if (!runDir || !evalIdArg || !fs.existsSync(path.join(runDir, 'outputs/project'))) usage('usage: node tools/bench/grade-build.mjs <run-dir> <eval-id>   (the run folder must contain outputs/project)', runDir === '--help');
const evalId = Number(evalIdArg);
const outputs = path.join(runDir, 'outputs');
const project = path.join(outputs, 'project');
const SITE_EXT = /\.(html?|css|js|mjs|svg|png|jpe?g|webp|gif|ico|woff2?|ttf|otf|json|webmanifest)$/i;

const uie = (cwd, ...a) => new Promise((resolve) => {
  const child = spawn(process.execPath, [UIE, ...a], { cwd, env: { ...process.env, UIE_HOME: path.join(cwd, '.home') } });
  let out = '';
  let err = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { err += d; });
  child.on('close', (code) => resolve({ code, out, err }));
});

async function main() {
  // An app with a start script is served by its own server (its forms post to it); otherwise the static files.
  const serverApp = findServerApp(project);
  let siteRoot = serverApp ? null : findSiteRoot(project);
  const metrics = { run: runDir, site_root: siteRoot ? path.relative(project, siteRoot) || '.' : serverApp ? `server: node ${serverApp.args.join(' ')}` : null, problems: [] };
  if (serverApp) siteRoot = project;
  if (!siteRoot) {
    metrics.problems.push('no HTML page found in outputs/project');
    fs.writeFileSync(path.join(runDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
    return metrics;
  }
  const files = walk(siteRoot).filter((f) => SITE_EXT.test(f) && !/(PRODUCT|DESIGN)\.md$/.test(f) && !(serverApp && /(^|\/)(test|tests|data)\//.test(path.relative(siteRoot, f))));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-grade-'));
  const site = path.join(tmp, 'site');
  const blind = path.join(runDir, 'blind-site');
  fs.rmSync(blind, { recursive: true, force: true });
  for (const f of files) {
    const rel = path.relative(siteRoot, f);
    for (const base of /\.(json|webmanifest)$/i.test(f) ? [site] : [site, blind]) {
      fs.mkdirSync(path.dirname(path.join(base, rel)), { recursive: true });
      if (/\.(html?|css|m?js)$/i.test(f) && base === blind) fs.writeFileSync(path.join(base, rel), stripComments(f, fs.readFileSync(f, 'utf8')));
      else fs.copyFileSync(f, path.join(base, rel));
    }
  }
  const pages = serverApp ? ['/'] : files.filter((f) => /\.html?$/i.test(f)).map((f) => `/${path.relative(siteRoot, f).split(path.sep).join('/')}`.replace(/\/index\.html?$/i, '/'));
  const cssText = files.filter((f) => /\.(css|html?)$/i.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const themes = /prefers-color-scheme:\s*dark/.test(cssText) ? ['light', 'dark'] : ['light'];
  const { serveStatic } = await lib('browser/static-server.mjs');
  const srv = serverApp ? await startServerApp(project, serverApp) : await serveStatic(site);
  try {
    await uie(tmp, 'init', '--quiet');
    const cfgPath = path.join(tmp, '.ui-evaluator/config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    cfg.project = { ...(cfg.project || {}), name: 'graded-site', work: 'new' };
    cfg.app = { ...(cfg.app || {}), base_url: srv.url };
    delete cfg.app.start;
    cfg.routes = pages.map((p) => ({ path: p, surface: p, mode: 'operate', states: [{ name: 'default', actions: [] }] }));
    cfg.matrix = { ...(cfg.matrix || {}), widths: [320, 375, 1280], themes };
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
    const run = JSON.parse((await uie(tmp, 'run', 'new', '--label', 'grade', '--json')).out).run;
    // --allow-remote: render pages as visitors see them, web fonts and CDN assets included (same for both configurations).
    const audit = await uie(tmp, 'audit', '--run', run, '--allow-remote');
    if (audit.code === 1) metrics.problems.push(`audit could not run: ${(audit.err || audit.out).trim().split('\n').slice(-2).join(' | ')}`);
    const lint = await uie(tmp, 'lint', 'site', '--run', run, '--json');
    let lintJson = null;
    try {
      lintJson = JSON.parse(lint.out);
    } catch {
      metrics.problems.push('lint output was not JSON');
    }
    // The rendered document (server apps have no .html file to read).
    try {
      metrics.rendered_html = (await (await fetch(srv.url)).text()).slice(0, 200000);
    } catch {
      metrics.rendered_html = null;
    }
    const gates = await uie(tmp, 'gates', '--run', run, '--target', 'L1', '--json');
    let gatesJson = null;
    try {
      gatesJson = JSON.parse(gates.out);
    } catch {
      gatesJson = null;
    }
    const rd = path.join(tmp, '.ui-evaluator/runs', run);
    const hits = fs.readFileSync(path.join(rd, 'tool-findings.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const tells = JSON.parse(fs.readFileSync(path.join(SKILL_DIR, 'assets/data/tells.json'), 'utf8')).tells;
    const rules = JSON.parse(fs.readFileSync(path.join(SKILL_DIR, 'assets/data/rules.json'), 'utf8')).rules;
    const byGate = {};
    const tellIds = { hard: new Set(), soft: new Set() };
    for (const h of hits) {
      if (h.advisory || h.possible || ['advisory', 'possible'].includes(h.level)) continue;
      const id = h.criteria[0].id;
      const cls = tells[id]?.class;
      if (cls === 'hard' || cls === 'soft') tellIds[cls].add(id);
      const g = h.gate || rules[id]?.gate || 'other';
      (byGate[g] = byGate[g] || new Set()).add(id);
    }
    metrics.pages = pages;
    metrics.themes = themes;
    metrics.criteria_failed = Object.fromEntries(Object.entries(byGate).map(([g, s]) => [g, [...s].sort()]));
    metrics.counts = Object.fromEntries(Object.entries(byGate).map(([g, s]) => [g, s.size]));
    metrics.hard_tells = [...tellIds.hard].sort();
    metrics.soft_tells = [...tellIds.soft].sort();
    metrics.axe_violations = hits.filter((h) => h.criteria[0].id === 'A11Y-01').length;
    metrics.lint_summary = lintJson?.summary || null;
    metrics.gates = gatesJson ? { achieved: gatesJson.achieved_label || gatesJson.achieved, gate_states: Object.fromEntries(Object.entries(gatesJson.gates || {}).map(([g, v]) => [g, v.state])) } : null;
    metrics.hits = hits.filter((h) => !h.advisory && !h.possible && !['advisory', 'possible'].includes(h.level)).map((h) => ({ id: h.criteria[0].id, title: h.title, route: h.locations?.[0]?.route }));
    // Stills for the blind comparison: 375 and 1280, light, every page.
    const screens = path.join(runDir, 'screens');
    fs.rmSync(screens, { recursive: true, force: true });
    fs.mkdirSync(screens, { recursive: true });
    const shotDir = path.join(rd, 'evidence/screens');
    for (const f of walk(shotDir).filter((x) => /(375|1280)-light(-audit)?\.png$/.test(x))) {
      const rel = path.relative(shotDir, f).split(path.sep).join('_');
      fs.copyFileSync(f, path.join(screens, rel));
    }
    metrics.lint_hits = (lintJson?.hits || []).filter((h) => !h.advisory).map((h) => h.criteria?.[0]?.id).filter(Boolean);
  } finally {
    await srv.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  fs.writeFileSync(path.join(runDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
  return metrics;
}

// --- assertions (scripted where possible) --------------------------------------------------------------------
async function assertions(metrics) {
  const exp = [];
  const add = (text, passed, evidence) => exp.push({ text, kind: assertionKind(text), passed: !!passed, evidence });
  const ws = path.join(project, '.ui-evaluator');
  const prodPath = path.join(project, 'PRODUCT.md');
  const reply = fs.existsSync(path.join(outputs, 'reply.md')) ? fs.readFileSync(path.join(outputs, 'reply.md'), 'utf8') : '';
  const serverMode = String(metrics.site_root || '').startsWith('server:');
  const siteRoot = serverMode ? project : metrics.site_root ? path.join(project, metrics.site_root === '.' ? '' : metrics.site_root) : null;
  const siteAll = siteRoot ? walk(siteRoot) : [];
  const siteFiles = siteRoot && !serverMode ? siteAll.filter((f) => /\.(html?|js)$/i.test(f)) : [];
  // A server-rendered app has no page file: judge the copy on the document it serves.
  const siteText = serverMode ? metrics.rendered_html || '' : siteFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const lintIds = new Set(metrics.lint_hits || []);
  const htmlTexts = siteFiles.filter((f) => /\.html?$/i.test(f)).map((f) => fs.readFileSync(f, 'utf8'));
  if (!htmlTexts.length && metrics.rendered_html) htmlTexts.push(metrics.rendered_html);
  if (evalId === 1) {
    const { checkProduct } = await lib('tokens/product.mjs');
    const prod = fs.existsSync(prodPath) ? checkProduct(fs.readFileSync(prodPath, 'utf8')) : null;
    add('PRODUCT.md exists at the project root and passes DEC-01', prod?.ok, prod ? (prod.ok ? 'checkProduct ok' : prod.missing.slice(0, 3).join('; ')) : 'no PRODUCT.md');
    const tok = fs.existsSync(path.join(project, 'DESIGN.md')) ? await uie(project, 'tokens', 'check', '--no-official') : null;
    add('DESIGN.md exists and its tokens validate', tok && tok.code === 0, tok ? `uie tokens check exit ${tok.code}` : 'no DESIGN.md');
    const dirs = fs.existsSync(path.join(ws, 'directions')) ? fs.readdirSync(path.join(ws, 'directions')) : [];
    const roll = dirs.some((d) => fs.existsSync(path.join(ws, 'directions', d)) && fs.readdirSync(path.join(ws, 'directions', d)).some((f) => /^roll-.*\.json$/.test(f)));
    const decision = dirs.some((d) => fs.existsSync(path.join(ws, 'directions', d, 'decision.md')));
    add('A seeded direction roll and a decision record exist', roll && decision, `roll ${roll}, decision ${decision}`);
    let ledger = null;
    try {
      ledger = JSON.parse(fs.readFileSync(path.join(ws, 'ledger.json'), 'utf8'));
    } catch {
      ledger = null;
    }
    add('The project ledger has an entry for this direction', (ledger?.entries || []).length >= 1, `${(ledger?.entries || []).length} entries`);
    add('Static lint of the built files has no gate-level hit', metrics.lint_summary && metrics.lint_summary.gate === 0, `lint summary ${JSON.stringify(metrics.lint_summary)}`);
    const runs = fs.existsSync(path.join(ws, 'runs')) ? fs.readdirSync(path.join(ws, 'runs')).filter((r) => r !== 'LATEST') : [];
    const selfCheck = runs.some((r) => {
      try {
        const m = JSON.parse(fs.readFileSync(path.join(ws, 'runs', r, 'manifest.json'), 'utf8'));
        return m.depth === 'quick' && fs.existsSync(path.join(ws, 'runs', r, 'gates.json'));
      } catch {
        return false;
      }
    });
    add('A mechanical self-check run exists and its gates were computed', selfCheck, `${runs.length} run(s)`);
    add('No invented proof: no usage figures, ratings, testimonials or partner logos absent from PRODUCT.md Facts', !lintIds.has('SLP-12') && !lintIds.has('SLP-13') && !(metrics.criteria_failed?.G4 || []).some((x) => x === 'SLP-12' || x === 'SLP-13'), `SLP-12/13 in lint or audit: ${[...lintIds].filter((x) => /SLP-1[23]/.test(x)).join(', ') || 'none'}`);
  }
  if (evalId === 2) {
    add(...chineseLang(htmlTexts));
    add(...cjkFonts(lintIds, metrics));
    const textOnly = siteText.replace(/<script[\s\S]*?<\/script>/gi, (m) => m.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, ''));
    const nin = /您/.test(textOnly);
    const ni = /你/.test(textOnly.replace(/您/g, ''));
    add('One form of address in the shipped copy', !(nin && ni), `您 ${nin}, 你 ${ni}`);
    const prod = fs.existsSync(prodPath) ? fs.readFileSync(prodPath, 'utf8') : '';
    const sec = (prod.split(/^## /m).find((s) => /^Platforms and locales/i.test(s)) || '');
    add('PRODUCT.md records the zh-CN form-of-address decision', /zh-CN/.test(sec) && /您|你/.test(sec) && /\[(confirmed|inferred):/.test(sec), prod ? 'Platforms and locales section checked' : 'no PRODUCT.md');
    const g2 = metrics.hits || [];
    add('Name and phone fields carry autocomplete tokens', !g2.some((h) => h.id === 'A11Y-13' && /autocomplete/i.test(h.title)), g2.filter((h) => /autocomplete/i.test(h.title)).map((h) => h.title).join('; ') || 'no autocomplete hit');
    add('Touch targets and CJK minimum sizes hold at 320 and 375 px', !g2.some((h) => ['CMP-06', 'TYP-01', 'TYP-02'].includes(h.id)), g2.filter((h) => ['CMP-06', 'TYP-01', 'TYP-02'].includes(h.id)).map((h) => `${h.id} ${h.title}`).slice(0, 4).join('; ') || 'none');
    const han = (reply.match(/\p{Script=Han}/gu) || []).length;
    const latin = (reply.match(/[A-Za-z]/g) || []).length;
    add('The reply to the user is in Chinese', han > latin, `${han} Han vs ${latin} Latin letters`);
  }
  // The briefs whose assertions are all about the page and the reply (tools/bench/build-checks.mjs).
  const jsTexts = siteFiles.filter((f) => /\.m?js$/i.test(f)).map((f) => fs.readFileSync(f, 'utf8'));
  const cssTexts = siteRoot && !serverMode ? siteAll.filter((f) => /\.css$/i.test(f)).map((f) => fs.readFileSync(f, 'utf8')) : [];
  const files = siteRoot ? siteAll.map((f) => path.relative(siteRoot, f).split(path.sep).join('/')) : [];
  for (const [text, passed, evidence] of outputChecks(evalId, { siteText, htmlTexts, jsTexts, cssTexts, files, reply, lintIds, metrics })) add(text, passed, evidence);
  // Output quality, the same for both configurations (the project's own bar, measured on the shipped files).
  add('[quality] 0 hard AI tells in the shipped page', !(metrics.hard_tells || []).length, (metrics.hard_tells || []).join(', ') || 'none');
  add('[quality] 0 WCAG (G2) criteria failed by the deterministic checks', !(metrics.criteria_failed?.G2 || []).length, (metrics.criteria_failed?.G2 || []).join(', ') || 'none');
  add('[quality] 0 craft-floor (G3) criteria failed', !(metrics.criteria_failed?.G3 || []).length, (metrics.criteria_failed?.G3 || []).join(', ') || 'none');
  add('[quality] 0 functional (G1) criteria failed', !(metrics.criteria_failed?.G1 || []).length, (metrics.criteria_failed?.G1 || []).join(', ') || 'none');
  const passed = exp.filter((e) => e.passed).length;
  const grading = { expectations: exp, summary: { passed, failed: exp.length - passed, total: exp.length, pass_rate: exp.length ? Math.round((passed / exp.length) * 100) / 100 : 0, output: scoreOf({ expectations: exp }) }, metrics: { counts: metrics.counts, hard_tells: metrics.hard_tells, soft_tells: metrics.soft_tells, achieved: metrics.gates?.achieved } };
  fs.writeFileSync(path.join(runDir, 'grading.json'), JSON.stringify(grading, null, 2));
  return grading;
}

const m = await main();
const g = await assertions(m);
console.log(JSON.stringify({ site_root: m.site_root, pages: m.pages, counts: m.counts, hard: m.hard_tells, soft: m.soft_tells, achieved: m.gates?.achieved, pass: g.summary, problems: m.problems }, null, 1));
