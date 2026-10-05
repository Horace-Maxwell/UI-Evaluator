// Gate engine (QUALITY-BAR §2–§4; ARCHITECTURE §10.2).
// Computes every criterion state from run artifacts and project files, then gate states and the level.
// A criterion without the artifacts it needs is `not_run` — never `pass`.
import os from 'node:os';
import path from 'node:path';
import { readJson, readJsonl, exists, listDir, readText } from '../util/fs.mjs';
import { hoursSince } from '../util/time.mjs';
import { validate, loadSchema } from '../schema.mjs';
import { paths, loadConfig, readRegister, readWaivers, loadJourneys } from '../project.mjs';
import { readJudgedOutputs } from '../findings/merge.mjs';
import { primaryCriterion, isDeterministic } from '../findings/core.mjs';
import { GATES, loadTells } from './rules.mjs';
import { parseDesign, acceptedTells } from '../tokens/design.mjs';
import { checkTokens } from '../tokens/check.mjs';
import { checkProduct, productSurfaces, productLocales } from '../tokens/product.mjs';
import { ledgerVariety } from '../roll/ledger.mjs';
import { uieHome } from '../deps.mjs';
import { version } from '../cli.mjs';

const STATE_RANK = { fail: 5, not_run: 4, degraded: 3, waived: 2, pass: 1, not_applicable: 0 };
/** The design-panel rubric (QUALITY-BAR G6; ADR-035 added appeal). */
const RUBRIC = ['specificity', 'hierarchy', 'coherence', 'restraint', 'brand_fit', 'execution', 'appeal'];
const INACTIVE = new Set(['rejected', 'dismissed', 'verified', 'resolved', 'stale', 'candidate']);
const DECIDED_P1 = new Set(['verified', 'resolved', 'deferred', 'disputed', 'wont_fix', 'dismissed']);

function worst(states) {
  return states.reduce((w, s) => (STATE_RANK[s] > STATE_RANK[w] ? s : w), 'pass');
}

function st(state, detail, evidence = [], extra = {}) {
  return { state, detail, evidence, ...extra };
}

/**
 * The project's doctor record, or the machine-level one ($UIE_HOME/doctor.json) when that is newer and was written by
 * this skill version: a doctor run before `uie init` still counts. `source` says which file the evidence is.
 */
function newestDoctor(projectFile) {
  const own = readJson(projectFile, null);
  const homeFile = path.join(uieHome(), 'doctor.json');
  const machine = readJson(homeFile, null);
  const usable = machine && (machine.uie || machine.versions?.uie) === version();
  if (usable && (!own || Date.parse(machine.at) > Date.parse(own.at))) return { ...machine, source: homeFile };
  return own ? { ...own, source: '.ui-evaluator/doctor.json' } : null;
}

/** Load everything the engine needs from disk once. */
export function loadInputs(root, runDir) {
  const p = paths(root);
  const config = loadConfig(root);
  const manifest = readJson(path.join(runDir, 'manifest.json'), null);
  const checks = readJson(path.join(runDir, 'checks.json'), { checks: {} }).checks || {};
  const merged = readJson(path.join(runDir, 'merged.json'), null);
  const toolHits = exists(path.join(runDir, 'tool-findings.jsonl')) ? readJsonl(path.join(runDir, 'tool-findings.jsonl')) : [];
  const register = readRegister(root);
  const regById = new Map(register.findings.map((f) => [f.id, f]));
  // Findings for this run, with lifecycle decisions taken from the register (decisions are made after the audit).
  const runFindings = (merged ? merged.findings : toolHits.map((h, i) => ({ ...h, id: `T-${i + 1}`, status: 'confirmed', severity: { source: 'rule', mean: h.severity?.value ?? 2 } }))).map((f) => {
    const r = regById.get(f.id);
    return r ? { ...f, status: r.status, deferral: r.deferral, notes: r.notes, priority: r.priority || f.priority } : f;
  });
  // Judged findings from earlier runs that this run did not re-examine (a verify or fix run has no evaluators). They stay
  // open in the register until a fix review or a person closes them, so USE-05 and USE-06 still count them.
  const runIds = new Set(runFindings.map((f) => f.id));
  const carried = register.findings.filter((f) => !runIds.has(f.id) && !isDeterministic(f) && ['open', 'confirmed', 'in_progress', 'fixed', 'reopened', 'disputed', 'deferred'].includes(f.status));
  const design = exists(p.design) ? parseDesign(readText(p.design), { work: config.project?.work || 'existing' }) : null;
  const productText = exists(p.product) ? readText(p.product) : null;
  if (design) {
    // DEC-02 covers token values too: the same checks as `uie tokens check`, so the two never disagree.
    const locales = [...(config.locales?.list || []), ...(productText ? productLocales(productText) : [])];
    design.tokens = checkTokens(design, { surfaces: productText ? productSurfaces(productText) : [], cjk: locales.some((l) => /^(zh|ja|ko)\b/i.test(String(l))) });
  }
  return {
    root,
    runDir,
    p,
    config,
    manifest,
    checks,
    merged,
    runFindings,
    register,
    carried,
    waivers: readWaivers(root),
    design,
    accepted: design ? acceptedTells(design) : new Map(),
    productText,
    journeys: loadJourneys(root),
    doctor: newestDoctor(p.doctor),
    human: readJson(p.humanChecks, { wcag: {}, confirmations: {}, design_verdict: null }),
    reportLint: readJson(path.join(runDir, 'report-lint.json'), null),
    agreement: readJson(path.join(runDir, 'agreement.json'), null),
    verifier: readJson(path.join(runDir, 'verifier.json'), null),
    outputs: readJudgedOutputs(runDir),
    panels: listDir(path.join(runDir, 'panel'))
      .filter((n) => n.endsWith('.json') && !n.endsWith('verdict.json'))
      .map((n) => ({ file: n, doc: readJson(path.join(runDir, 'panel', n)) })),
    cwRecords: listDir(path.join(runDir, 'cw'))
      .filter((n) => n.endsWith('.json'))
      .map((n) => readJson(path.join(runDir, 'cw', n))),
    studies: listDir(p.studies).map((id) => ({
      id,
      dir: path.join(p.studies, id),
      plan: readText(path.join(p.studies, id, 'plan.md'), ''),
      results: readJson(path.join(p.studies, id, 'results.json'), null),
    })),
    ledger: readJson(p.ledger, { version: 1, entries: [] }),
    globalLedger: readJson(path.join(process.env.UIE_HOME || path.join(os.homedir(), '.ui-evaluator'), 'ledger.json'), null),
    directionsDir: p.directions,
  };
}

function findingsFor(I, id) {
  return I.runFindings.filter((f) => (f.criteria || []).some((c) => c.id === id) || primaryCriterion(f).id === id);
}

function activeFindingsFor(I, id) {
  return findingsFor(I, id).filter((f) => !INACTIVE.has(f.status) && !f.requested);
}

function waiverCovers(I, criterionId, f) {
  return (I.waivers.waivers || []).some(
    (w) => String(w.by || '').startsWith('human:') && w.criterion === criterionId && (!w.finding || w.finding === f.id),
  );
}

/** Mark findings whose tell was requested in DESIGN.md (not for SLP-12/13). */
function applyAccepted(I, rules) {
  for (const f of I.runFindings) {
    const id = primaryCriterion(f).id;
    if (!id.startsWith('SLP-')) continue;
    const rule = rules[id];
    if (rule && rule.acceptable_via_brief === false) continue;
    if (I.accepted.has(id)) f.requested = I.accepted.get(id);
  }
}

function checkState(I, names) {
  const arr = Array.isArray(names) ? names : [names];
  const found = arr.map((n) => I.checks[n]).filter(Boolean);
  if (!found.length) return { ran: false };
  const ran = found.filter((c) => c.state === 'ran');
  if (!ran.length) return { ran: false, errors: found.flatMap((c) => c.errors || []) };
  return { ran: true, partial: ran.some((c) => c.partial), checks: ran };
}

const routesOf = (f) => [...new Set((f.locations || []).map((l) => l.route || ''))];

/** Pages carrying more than one deferred soft tell (distinct tell ids), across all soft tells (ADR-031). */
function deferredSoftTellPages(I) {
  if (I._deferredSoftPages) return I._deferredSoftPages;
  const perPage = new Map();
  for (const f of I.runFindings) {
    const id = primaryCriterion(f).id;
    const rule = I.rules?.[id];
    if (!id.startsWith('SLP-') || f.requested || !rule || rule.class === 'hard' || rule.experimental) continue;
    if (!['deferred', 'wont_fix'].includes(f.status)) continue;
    for (const r of routesOf(f)) {
      if (!perPage.has(r)) perPage.set(r, new Set());
      perPage.get(r).add(id);
    }
  }
  I._deferredSoftPages = new Map([...perPage].filter(([, set]) => set.size > 1));
  return I._deferredSoftPages;
}

// Criteria whose thresholds apply to exercised behaviour ("in exercised error states", "in exercised actions"). A
// check that found nothing to exercise makes the criterion not_applicable; one that found something but could not
// exercise it makes it degraded. Neither is a silent pass.
const EXERCISED = {
  'CPY-04': { check: 'forms', what: 'form error state', scope: (c) => (c.forms_probed || 0) + (c.skipped?.length || 0), done: (c) => c.exercised_error_states },
  'A11Y-15': { check: 'live-regions', what: 'action that starts work', scope: (c) => (c.actions_probed || 0) + (c.actions_skipped || 0), done: (c) => c.actions_exercised },
  'A11Y-06': { check: 'dialogs', what: 'modal dialog', scope: (c) => (c.dialogs_probed || 0) + (c.untested?.length || 0), done: (c) => c.dialogs_probed },
  'CMP-04': { check: 'states', what: 'action with response feedback', scope: (c) => (c.feedback_actions || 0) + (c.feedback_skipped?.length || 0), done: (c) => c.feedback_actions },
};

function exercisedState(I, rule) {
  const ex = EXERCISED[rule.id];
  const c = ex && I.checks[ex.check];
  if (!c) return null;
  const scope = Number(ex.scope(c)) || 0;
  const done = Number(ex.done(c)) || 0;
  if (!scope) return st('not_applicable', `no ${ex.what} in scope (${ex.check} check found none to exercise)`);
  if (!done) return st('degraded', `no ${ex.what} could be exercised (${scope} found); the criterion is unverified, see checks.json ${ex.check}`);
  return null;
}

// The checks that can see a tell, from its catalogue detection layers: source code (lint), the rendered DOM and
// pixels (tells), and rendered or source copy (copy, lint). A tell is only as covered as the checks that ran.
const LAYER_CHECKS = { src: ['lint'], dom: ['tells'], pix: ['tells'], copy: ['copy', 'lint'] };

// Tells detected outside the tells, copy and lint checks.
const TELL_EXTRA_CHECKS = { 'SLP-45': ['cross-page'] };

function tellSources(id) {
  const t = loadTells()[id];
  const layers = t?.detect?.layers || (t?.detect?.layer ? [t.detect.layer] : []);
  const checks = [...new Set([...layers.flatMap((l) => LAYER_CHECKS[l] || []), ...(TELL_EXTRA_CHECKS[id] || [])])];
  return checks.length ? checks : ['tells', 'lint', 'copy'];
}

function toolCriterion(I, rule) {
  const sources = rule.id.startsWith('SLP-') ? tellSources(rule.id) : [rule.check];
  if (rule.scope === 'cjk' && !hasCjk(I)) return st('not_applicable', 'no CJK locale or CJK text in scope');
  const cs = checkState(I, sources);
  // A tell that the rendered page or the source could show is only partly covered when one of its checks is missing.
  if (cs.ran && rule.id.startsWith('SLP-') && sources.some((n) => !cs.checks.includes(I.checks[n]))) {
    cs.partial = true;
    cs.missing = sources.filter((n) => !cs.checks.includes(I.checks[n]));
  }
  const active = activeFindingsFor(I, rule.id);
  const requested = findingsFor(I, rule.id).filter((f) => f.requested);
  if (!cs.ran) {
    // Findings from evaluators can still prove a failure even when the tool did not run.
    if (active.length) return st('fail', `${active.length} finding(s); the ${sources.join('/')} check did not run`, active.map((f) => f.id));
    return st('not_run', `the ${sources.join('/')} check did not run`);
  }
  if (!active.length) {
    const na = cs.checks.filter((c) => c.not_applicable);
    if (na.length && na.length === cs.checks.length) return st('not_applicable', String(na[0].not_applicable));
    const unexercised = exercisedState(I, rule);
    if (unexercised) return unexercised;
    const note = requested.length ? `; ${requested.length} requested in DESIGN.md` : '';
    const partialWhy = cs.missing?.length ? ` (partial coverage: ${cs.missing.join(', ')} did not run)` : cs.partial ? ' (partial coverage)' : '';
    const catalogue = rule.catalogue ? ' (catalogue soft tell, ADR-031)' : '';
    return st(cs.partial ? 'degraded' : 'pass', `no findings${partialWhy}${note}${catalogue}`, requested.map((f) => f.id));
  }
  if (rule.waivable && active.every((f) => waiverCovers(I, rule.id, f))) return st('waived', `${active.length} finding(s) waived by the owner`, active.map((f) => f.id));
  if (rule.id.startsWith('SLP-') && rule.class !== 'hard') {
    // ADR-031: every soft tell needs a disposition (fixed, accepted in DESIGN.md, disputed, deferred), and no page
    // carries more than one deferred soft tell. A wont_fix tell not accepted in DESIGN.md counts as deferred.
    const ids = active.map((f) => f.id);
    const undisposed = active.filter((f) => !['disputed', 'deferred', 'wont_fix'].includes(f.status));
    if (undisposed.length) {
      return st('fail', `${undisposed.length} soft tell finding(s) without a disposition: fix, accept in DESIGN.md with a reason, dispute with evidence, or defer to debt.md`, ids);
    }
    const crowded = deferredSoftTellPages(I);
    const onCrowded = active.filter((f) => ['deferred', 'wont_fix'].includes(f.status) && routesOf(f).some((r) => crowded.has(r)));
    if (onCrowded.length) {
      const pages = [...new Set(onCrowded.flatMap(routesOf).filter((r) => crowded.has(r)))];
      return st('fail', `more than 1 deferred soft tell on ${pages.map((r) => `${r || '(no route)'} (${[...crowded.get(r)].join(', ')})`).join('; ')}`, ids);
    }
    const counts = {};
    for (const f of active) counts[f.status] = (counts[f.status] || 0) + 1;
    return st('pass', `${active.length} soft tell finding(s) dispositioned (${Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ')}); ≤ 1 deferred per page`, ids);
  }
  if (rule.id === 'SLP-09' || (rule.id === 'SLP-08' && active.every((f) => f.variant === 'dark-neon'))) {
    const decided = active.every((f) => ['disputed', 'wont_fix', 'deferred'].includes(f.status));
    if (decided) return st('pass', 'provisional hard tell dispositioned by the owner', active.map((f) => f.id));
  }
  return st('fail', `${active.length} finding(s)`, active.map((f) => f.id));
}

function hasCjk(I) {
  const loc = (I.config.locales?.list || []).some((l) => /^(zh|ja|ko)/i.test(l));
  return loc || !!I.checks.i18n?.cjk_detected || !!I.checks.lang?.cjk_detected || !!I.checks.lint?.cjk_detected;
}

// --- per-criterion evaluators -------------------------------------------------------------

const E = {
  manifest(I) {
    if (!I.manifest) return st('not_run', 'no manifest.json');
    const res = validate(loadSchema('manifest'), I.manifest);
    return res.valid ? st('pass', 'manifest complete', ['manifest.json']) : st('fail', res.errors.slice(0, 3).map((e) => `${e.path} ${e.message}`).join('; '), ['manifest.json']);
  },
  doctor(I) {
    if (!I.doctor) return st('not_run', 'uie doctor has not run');
    const src = [I.doctor.source || '.ui-evaluator/doctor.json'];
    if (!I.doctor.passed) return st('fail', 'the last doctor smoke test failed', src);
    if (hoursSince(I.doctor.at) > 24) return st('not_run', 'doctor smoke test is older than 24 h; run `uie doctor`');
    return st('pass', `smoke test passed at ${I.doctor.at}`, src);
  },
  captures(I) {
    const c = I.manifest?.captures;
    if (!c || !c.valid) return st('not_run', 'no captures recorded');
    return c.invalid ? st('fail', `${c.invalid} invalid capture(s)`, ['manifest.json']) : st('pass', `${c.valid} valid capture(s)`, ['manifest.json']);
  },
  anchors(I) {
    const active = I.runFindings.filter((f) => !INACTIVE.has(f.status));
    const bad = active.filter((f) => !(f.locations || []).some((l) => l.selector || l.crop || l.bbox || l.source) && !(f.evidence || []).some((e) => e.ref));
    if (!active.length) return st('pass', 'no reported findings');
    return bad.length ? st('fail', `${bad.length} finding(s) without a resolvable anchor`, bad.map((f) => f.id)) : st('pass', `${active.length} finding(s) anchored`);
  },
  'report-lint'(I) {
    if (!I.reportLint) return st('not_run', 'report language lint has not run (`uie report`)');
    const n = (I.reportLint.violations || []).length;
    return n ? st('fail', `${n} language violation(s)`, ['report-lint.json']) : st('pass', 'report language matches evidence levels', ['report-lint.json']);
  },
  independence(I) {
    const ev = I.manifest?.evaluators || [];
    if (!ev.length && !I.outputs.length) return st('not_applicable', 'no judged roles ran');
    const missing = ev.filter((e) => !e.isolation || !e.model);
    if (missing.length) return st('fail', `${missing.length} evaluator(s) without recorded isolation or model`);
    if (ev.some((e) => e.isolation === 'single-context')) return st('degraded', 'some roles ran without isolation (DEGRADED banner required)');
    if (I.outputs.length && !ev.length) return st('fail', 'evaluator outputs exist but the manifest records no evaluators');
    return st('pass', `${ev.length} evaluator(s) recorded with isolation and model`);
  },
  freshness(I) {
    const stale = I.runFindings.filter((f) => f.status === 'stale');
    return stale.length ? st('fail', `${stale.length} stale finding(s) in the run`, stale.map((f) => f.id)) : st('pass', 'no stale findings reported');
  },
  journeys(I, rule) {
    const crit = I.journeys.filter((j) => j.criticality === 'critical');
    const cs = checkState(I, 'journeys');
    const active = activeFindingsFor(I, rule.id);
    if (!crit.length) return st('not_applicable', 'no critical journeys declared');
    if (active.length) return st('fail', `${active.length} journey failure(s)`, active.map((f) => f.id));
    if (!cs.ran) return st('not_run', 'journeys were not replayed (`uie journey`)');
    const per = I.checks.journeys?.journeys || {};
    const missing = crit.filter((j) => !per[j.id] || per[j.id].auth_wall).map((j) => j.id);
    if (missing.length) return st('not_run', `critical journey(s) not replayed in this run: ${missing.join(', ')} (\`uie journey --all\`)`);
    const failed = crit.filter((j) => per[j.id] && per[j.id].ok === false).map((j) => j.id);
    if (failed.length) return st('fail', `critical journey(s) failed: ${failed.join(', ')}`);
    return st('pass', `${crit.length} critical journey(s) replayed to their success condition`);
  },
  'axe-incomplete'(I) {
    const axe = I.checks.axe;
    if (!axe || axe.state !== 'ran') return st('not_run', 'axe did not run');
    const total = axe.incomplete || 0;
    if (!total) return st('pass', 'no axe incomplete results');
    const auditor = I.outputs.find((o) => o.role === 'accessibility-auditor');
    if (!auditor) return st('not_run', `${total} incomplete result(s); the accessibility auditor has not run`, [], { awaiting_judgement: true });
    const resolved = (auditor.doc.resolved_incompletes || []).length;
    return resolved >= total ? st('pass', `${resolved}/${total} incomplete results resolved`) : st('fail', `${total - resolved} incomplete result(s) unresolved`);
  },
  auditor(I, rule) {
    const auditor = I.outputs.find((o) => o.role === 'accessibility-auditor');
    const active = activeFindingsFor(I, rule.id);
    if (active.length) return st('fail', `${active.length} finding(s)`, active.map((f) => f.id));
    if (!auditor) return st('not_run', 'agent-judged: the accessibility auditor has not run', [], { awaiting_judgement: true });
    return st('pass', 'judged by the accessibility auditor');
  },
  'coverage-matrix'(I) {
    const cov = readJson(path.join(I.runDir, 'coverage.json'), null);
    if (!cov) return st('not_run', 'no WCAG coverage matrix (`uie gates` builds it after `uie audit`)');
    const n = Object.keys(cov.criteria || {}).length;
    return n >= 55 ? st('pass', `coverage matrix covers ${n} success criteria`, ['coverage.json']) : st('fail', `coverage matrix has ${n}/55 criteria`);
  },
  'human-wcag'(I) {
    const items = Object.values(I.human.wcag || {});
    const cov = readJson(path.join(I.runDir, 'coverage.json'), null);
    const needs = cov ? Object.entries(cov.criteria || {}).filter(([, v]) => v.coverage === 'needs-human').map(([k]) => k) : [];
    if (!needs.length && !items.length) return st('not_run', 'needs-human checklist not available');
    const done = needs.filter((sc) => I.human.wcag?.[sc]?.done);
    return done.length === needs.length ? st('pass', `${done.length} needs-human criteria checked by a person`) : st('not_run', `${needs.length - done.length} needs-human criteria not yet checked by a person`);
  },
  'judged-wcag'(I) {
    const judged = [...I.runFindings, ...(I.carried || [])].filter((f) => f.severity?.source !== 'rule' && !INACTIVE.has(f.status) && (f.criteria || []).some((c) => c.kind === 'wcag'));
    if (judged.length) return st('fail', `${judged.length} confirmed judged WCAG failure(s)`, judged.map((f) => f.id));
    const ran = I.outputs.some((o) => ['accessibility-auditor', 'heuristic-evaluator'].includes(o.role));
    return ran ? st('pass', 'no open confirmed judged WCAG failure') : st('not_run', 'no judged accessibility review ran', [], { awaiting_judgement: true });
  },
  'tool-or-judged'(I, rule) {
    const cs = checkState(I, rule.check);
    const reviewer = I.outputs.find((o) => o.role === 'code-reviewer');
    const active = activeFindingsFor(I, rule.id);
    if (active.length) return st('fail', `${active.length} finding(s)`, active.map((f) => f.id));
    if (!cs.ran && !reviewer) return st('not_run', 'neither the states check nor the code reviewer ran');
    return st('pass', 'data states demonstrated or confirmed');
  },
  product(I) {
    if (!I.productText) return st('fail', 'PRODUCT.md is missing');
    const res = checkProduct(I.productText);
    return res.ok ? st('pass', 'PRODUCT.md has every required field', ['PRODUCT.md']) : st('fail', `PRODUCT.md missing: ${res.missing.join(', ')}`, ['PRODUCT.md']);
  },
  design(I) {
    if (!I.design) return st('fail', 'DESIGN.md is missing');
    const problems = [...(I.design.problems || []), ...(I.design.tokens?.errors || [])];
    if (I.design.status === 'as-built' && !problems.length) problems.push('DESIGN.md is still as-built (extracted, not endorsed): complete it in the setup or direct workflow');
    return problems.length ? st('fail', `${problems.length} problem(s): ${problems.slice(0, 4).join('; ')}`, ['DESIGN.md']) : st('pass', 'DESIGN.md complete and valid (structure and token values)', ['DESIGN.md']);
  },
  direction(I) {
    const work = I.config.project?.work || 'existing';
    if (work === 'existing') return st('not_applicable', 'no new direction in scope (project.work = existing)');
    const dirs = listDir(I.directionsDir).filter((d) => exists(path.join(I.directionsDir, d, 'decision.md')));
    if (!dirs.length) return st('fail', 'no direction record (directions/<id>/decision.md)');
    const latest = dirs.sort().at(-1);
    const base = path.join(I.directionsDir, latest);
    const needs = ['candidates.json', 'decision.md'];
    const missing = needs.filter((n) => !exists(path.join(base, n)));
    const rolls = listDir(base).filter((n) => n.startsWith('roll-'));
    if (!rolls.length) missing.push('roll-<seed>.json');
    const decision = readText(path.join(base, 'decision.md'), '');
    if (!/swap/i.test(decision) || !/category/i.test(decision) || !/similar/i.test(decision)) missing.push('convergence tests in decision.md');
    return missing.length ? st('fail', `direction record incomplete: ${missing.join(', ')}`, [base]) : st('pass', `direction record ${latest} complete`, [base]);
  },
  ledger(I) {
    const work = I.config.project?.work || 'existing';
    if (work === 'existing') return st('not_applicable', 'no new direction in scope');
    if (!(I.ledger.entries || []).length) return st('fail', 'no ledger entry for the new direction (`uie ledger add`)');
    const v = ledgerVariety(I.ledger);
    // ADR-034: the opt-in cross-project ledger is advisory and never changes the state.
    let advisory = '';
    const latest = (I.ledger.entries || []).filter((e) => !e.superseded).at(-1);
    if (I.globalLedger && latest) {
      const others = (I.globalLedger.entries || []).filter((e) => !e.superseded && e.id !== latest.id);
      const g = ledgerVariety({ entries: [...others, latest] });
      if (!g.ok && !g.first) advisory = `; advisory (cross-project ledger): ${g.detail}`;
    }
    if (v.first) return st('not_applicable', `first direction in this project (${latest?.id}): nothing earlier to differ from; variety comes from the seeded roll${advisory}`, ['.ui-evaluator/ledger.json']);
    return v.ok ? st('pass', `${v.detail}${advisory}`, ['.ui-evaluator/ledger.json']) : st('fail', `${v.detail}${advisory}`, ['.ui-evaluator/ledger.json']);
  },
  'he-protocol'(I) {
    const he = I.outputs.filter((o) => o.role === 'heuristic-evaluator');
    const depth = I.manifest?.depth || I.config.depth || 'standard';
    const need = depth === 'rigorous' ? 5 : 3;
    if (!he.length) return st('not_run', 'no heuristic-evaluation outputs');
    const twoPass = he.every((o) => (o.doc.passes || []).length >= 2);
    const cited = he.every((o) => (o.items || []).every((c) => (c.criteria || []).length));
    const isolated = (I.manifest?.evaluators || []).filter((e) => e.role === 'heuristic-evaluator').every((e) => e.isolation && e.isolation !== 'single-context');
    if (depth === 'quick') return st('degraded', 'quick depth: single pass (ADR-024)');
    if (he.length < need) return st('fail', `${he.length} evaluator(s); ${depth} depth needs ${need}`);
    if (!twoPass) return st('fail', 'some evaluators did not record two passes');
    if (!cited) return st('fail', 'some candidates cite no principle');
    return isolated ? st('pass', `${he.length} isolated evaluators, two passes each`) : st('degraded', `${he.length} evaluators, not all isolated`);
  },
  consolidation(I) {
    if (!I.merged) return st('not_run', 'findings were not merged');
    if (!I.agreement) return st('not_run', 'agreement statistics missing (`uie findings agreement`)');
    return st('pass', 'merged on deterministic keys; agreement reported', ['merged.json', 'agreement.json']);
  },
  verification(I) {
    const judged = I.runFindings.filter((f) => f.severity?.source !== 'rule' && !['rejected', 'candidate'].includes(f.status));
    const pending = I.runFindings.filter((f) => f.status === 'candidate' && f.severity?.source !== 'rule');
    if (!I.verifier && (judged.length || pending.length)) return st('not_run', 'the verifier has not run');
    const unverified = judged.filter((f) => !f.verification_check && f.status !== 'disputed');
    if (unverified.length) return st('fail', `${unverified.length} reported finding(s) skipped verification`, unverified.map((f) => f.id));
    return st('pass', `${judged.length} judged finding(s) verified; ${pending.length} awaiting a human`);
  },
  ratings(I) {
    const depth = I.manifest?.depth || I.config.depth || 'standard';
    const judged = I.runFindings.filter((f) => f.severity?.source !== 'rule' && !['rejected', 'candidate'].includes(f.status));
    if (!judged.length) return st('pass', 'no judged findings to rate');
    const unrated = judged.filter((f) => !f.severity || f.severity.source !== 'raters');
    if (unrated.length) return st('not_run', `${unrated.length} confirmed finding(s) not rated`, unrated.map((f) => f.id));
    const few = judged.filter((f) => (f.severity.ratings || []).length < 3);
    if (few.length) return depth === 'quick' ? st('degraded', 'single-rater severities (provisional)') : st('fail', `${few.length} finding(s) with fewer than 3 ratings`, few.map((f) => f.id));
    return st('pass', `${judged.length} finding(s) rated by ≥ 3 blind raters`);
  },
  'no-open-p0'(I) {
    const bad = [...I.runFindings, ...(I.carried || [])].filter((f) => Number(f.severity?.mean ?? f.severity?.value) >= 3.5 && ['open', 'confirmed', 'in_progress', 'fixed', 'reopened', 'disputed', 'deferred'].includes(f.status));
    return bad.length ? st('fail', `${bad.length} open P0 finding(s)`, bad.map((f) => f.id)) : st('pass', 'no open P0');
  },
  'p1-decisions'(I) {
    const p1 = [...I.runFindings, ...(I.carried || [])].filter((f) => f.priority === 'P1' && !['rejected', 'candidate'].includes(f.status));
    const undecided = p1.filter((f) => {
      if (!DECIDED_P1.has(f.status)) return true;
      if (f.status === 'deferred') return !(f.deferral && f.deferral.reason && f.deferral.owner && f.deferral.trigger);
      return false;
    });
    return undecided.length ? st('fail', `${undecided.length} P1 finding(s) without a recorded decision`, undecided.map((f) => f.id)) : st('pass', `${p1.length} P1 finding(s), all decided`);
  },
  cw(I) {
    const crit = I.journeys.filter((j) => j.criticality === 'critical');
    if (!crit.length) return st('not_applicable', 'no critical journeys declared');
    const walked = new Set(I.cwRecords.map((r) => r.journey));
    const missing = crit.filter((j) => !walked.has(j.id));
    if (missing.length) return st(I.cwRecords.length ? 'fail' : 'not_run', `not walked: ${missing.map((j) => j.id).join(', ')}`);
    const cwFindings = I.runFindings.filter((f) => (f.criteria || []).some((c) => c.kind === 'cw' || /^CW-Q/.test(c.id)));
    const open = cwFindings.filter((f) => ['open', 'confirmed', 'in_progress', 'fixed', 'reopened'].includes(f.status) && f.criticality === 'critical');
    return open.length ? st('fail', `${open.length} failed step(s) on critical journeys without a decision`, open.map((f) => f.id)) : st('pass', `${crit.length} critical journey(s) walked`);
  },
  'task-suitability'(I) {
    const he = I.outputs.filter((o) => o.role === 'heuristic-evaluator');
    const ts = he.flatMap((o) => o.doc.task_suitability || []);
    if (!ts.length) return st('not_run', 'no task-suitability check recorded');
    const fails = ts.filter((t) => t.completable === false);
    return fails.length ? st('fail', `${fails.length} top task(s) not completable`, fails.map((t) => t.task)) : st('pass', `${new Set(ts.map((t) => t.task)).size} top task(s) completable`);
  },
  coverage(I) {
    const he = I.outputs.filter((o) => o.role === 'heuristic-evaluator');
    const ratios = he.map((o) => o.doc.coverage).filter((c) => c && c.controls_total).map((c) => c.controls_exercised / c.controls_total);
    if (!ratios.length) return st('not_run', 'no coverage recorded by evaluators');
    const best = Math.max(...ratios);
    return best >= 0.9 ? st('pass', `interaction coverage ${Math.round(best * 100)}%`) : st('fail', `interaction coverage ${Math.round(best * 100)}% < 90%`);
  },
  'cross-screen'(I) {
    const he = I.outputs.filter((o) => o.role === 'heuristic-evaluator');
    if (!he.length) return st('not_run', 'no heuristic-evaluation outputs');
    return he.some((o) => o.doc.cross_screen_pass) ? st('pass', 'cross-screen consistency pass done') : st('fail', 'no cross-screen consistency pass recorded');
  },
  hax(I) {
    if (!I.config.project?.ai_features) return st('not_applicable', 'no AI features declared (project.ai_features)');
    const audits = I.outputs.flatMap((o) => o.doc.hax_audit || []);
    if (!audits.length) return st('not_run', 'no HAX audit recorded');
    const covered = new Set(audits.map((a) => a.guideline));
    const need = ['HAX-G5', 'HAX-G6', 'HAX-G11'];
    const miss = need.filter((g) => !covered.has(g));
    return miss.length ? st('fail', `HAX audit lacks ${miss.join(', ')}`) : st('pass', `HAX audit covers ${covered.size} guideline(s)`);
  },
  'panel-protocol'(I) {
    const depth = I.manifest?.depth || I.config.depth || 'standard';
    const need = depth === 'rigorous' ? 5 : 3;
    if (!I.panels.length) return st('not_run', 'no design-panel outputs');
    const log = readJson(path.join(I.runDir, 'packets', '.log.json'), { unsealed: {} });
    const orderOk = I.panels.every((p) => {
      const agent = p.doc.agent;
      const verdict = readJson(path.join(I.runDir, 'panel', `${agent}.verdict.json`), null);
      if (!verdict) return false;
      const unsealed = log.unsealed?.[agent] || p.doc.unsealed_at;
      const written = verdict.written_at || p.doc.verdict_at;
      return !unsealed || !written || written <= unsealed;
    });
    if (!orderOk) return st('fail', 'a critic has no verdict file, or unsealed detector output before writing it');
    // Quick depth runs one critic as feedback for the builder; it is never a panel (DES-01 needs ≥ 3 isolated critics).
    if (depth === 'quick') return st('degraded', `${I.panels.length} critic(s) at quick depth: feedback for the builder, not a panel`);
    if (I.panels.length < need) return st('fail', `${I.panels.length} critic(s); ${depth} depth needs ${need}`);
    const isolationOf = (p) => p.doc.isolation || (I.manifest?.evaluators || []).find((e) => e.agent === p.doc.agent)?.isolation || 'unknown';
    const shared = I.panels.filter((p) => !['subagent', 'process'].includes(isolationOf(p)));
    if (shared.length) return st('degraded', `${shared.length} of ${I.panels.length} critic(s) ran without isolation (${[...new Set(shared.map(isolationOf))].join(', ')}): report G6 under the DEGRADED banner`);
    return st('pass', `${I.panels.length} isolated critics`);
  },
  specificity(I) {
    if (!I.panels.length) return st('not_run', 'no design-panel outputs');
    const v = I.panels.map((p) => p.doc.verdict?.value || p.doc.verdict);
    const specific = v.filter((x) => x === 'specific').length;
    return specific > I.panels.length / 2 ? st('pass', `${specific}/${I.panels.length} critics judged it specific`) : st('fail', `${specific}/${I.panels.length} critics judged it specific`);
  },
  'design-findings'(I) {
    const critics = new Set(I.panels.map((p) => p.doc.agent));
    const design = I.runFindings.filter((f) => (f.found_by || []).some((b) => b.role === 'design-critic' || critics.has(b.agent)));
    if (!I.panels.length) return st('not_run', 'no design-panel outputs');
    const severe = design.filter((f) => {
      const k = new Set((f.found_by || []).map((b) => b.agent)).size;
      const agreed = k >= 2 || f.verification_check?.verdict === 'confirmed';
      return agreed && Number(f.severity?.mean) >= 3 && ['open', 'confirmed', 'in_progress', 'fixed', 'reopened'].includes(f.status);
    });
    return severe.length ? st('fail', `${severe.length} agreed severe design finding(s) open`, severe.map((f) => f.id)) : st('pass', 'no agreed severe design findings open');
  },
  'brand-fit'(I) {
    if (!I.panels.length) return st('not_run', 'no design-panel outputs');
    const ok = I.panels.filter((p) => (p.doc.brand_fit?.overall || p.doc.brand_fit) === 'reflected').length;
    return ok > I.panels.length / 2 ? st('pass', `${ok}/${I.panels.length} critics: attributes reflected`) : st('fail', `${ok}/${I.panels.length} critics: attributes reflected`);
  },
  pairwise(I) {
    const withBaseline = I.panels.filter((p) => p.doc.pairwise);
    if (!withBaseline.length) return st('not_applicable', 'no baseline to compare (not a redesign)');
    const results = withBaseline.map((p) => {
      const pw = p.doc.pairwise;
      if (pw.first_order && pw.second_order && pw.first_order !== pw.second_order) return 'tie';
      return pw.result || pw.first_order || 'tie';
    });
    const worse = results.filter((r) => r === 'baseline').length;
    return worse > results.length / 2 ? st('fail', `${worse}/${results.length} critics prefer the baseline`) : st('pass', `${results.filter((r) => r === 'current').length} prefer the new version, ${results.filter((r) => r === 'tie').length} tie`);
  },
  rubric(I) {
    if (!I.panels.length) return st('not_run', 'no design-panel outputs');
    const ok = I.panels.every((p) => p.doc.rubric && RUBRIC.every((k) => p.doc.rubric[k]));
    return ok ? st('pass', 'rubric scores reported (judged; context only)') : st('fail', `some critics did not report all ${RUBRIC.length} rubric criteria (${RUBRIC.join(', ')})`);
  },
  /** DES-07 (ADR-035): the appeal verdict, written with the specificity verdict before unsealing; a majority must say appealing. */
  appeal(I) {
    if (!I.panels.length) return st('not_run', 'no design-panel outputs');
    const verdicts = I.panels.map((p) => {
      const file = readJson(path.join(I.runDir, 'panel', `${p.doc.agent}.verdict.json`), null);
      return file?.appeal?.value || p.doc.appeal?.value || null;
    });
    const recorded = verdicts.filter(Boolean);
    if (!recorded.length) return st('not_run', 'critics recorded no appeal verdict (re-run the panel with the current design-critic role)');
    const appealing = recorded.filter((v) => v === 'appealing').length;
    const detail = `${appealing}/${I.panels.length} critics judged it appealing${recorded.length < I.panels.length ? ` (${I.panels.length - recorded.length} recorded no appeal verdict)` : ''}`;
    return appealing > I.panels.length / 2 ? st('pass', detail) : st('fail', detail);
  },
  'study-plan'(I) {
    const plans = I.studies.filter((s) => s.plan);
    if (!plans.length) return st('not_run', 'no study plan');
    const need = [/objective/i, /question/i, /participant/i, /task/i, /measure|metric/i, /analys/i, /consent|ethic/i, /incentive/i];
    const ok = plans.some((s) => need.every((re) => re.test(s.plan)));
    return ok ? st('pass', 'study plan complete') : st('fail', 'study plan lacks required sections');
  },
  formative(I) {
    const r = latestResults(I);
    if (!r) return st('not_run', 'no study results');
    const groups = r.participants_per_group || {};
    const counts = Object.values(groups);
    if (!counts.length) return st('fail', 'results do not record participants per group');
    const minNeeded = counts.length === 1 ? 5 : counts.length === 2 ? 3 : 3;
    const okN = counts.every((n) => n >= minNeeded);
    const okMethod = r.moderated !== false && r.think_aloud !== false;
    return okN && okMethod ? st('pass', `formative round: ${counts.join('/')} participants per group`) : st('fail', 'formative round below the per-group minimum or not moderated');
  },
  'observed-integrated'(I) {
    const r = latestResults(I);
    if (!r) return st('not_run', 'no study results');
    const obs = r.observed_problems || [];
    const unlinked = obs.filter((o) => !o.finding);
    const needsRerate = I.register.findings.filter((f) => f.needs_rerating);
    if (unlinked.length) return st('fail', `${unlinked.length} observed problem(s) not linked to findings`);
    if (needsRerate.length) return st('fail', `${needsRerate.length} linked finding(s) not re-rated`);
    return st('pass', `${obs.length} observed problem(s) integrated`);
  },
  'critical-tasks'(I) {
    const r = latestResults(I);
    if (!r) return st('not_run', 'no study results');
    const crit = (r.tasks || []).filter((t) => t.critical);
    if (!crit.length) return st('fail', 'no critical tasks in the results');
    const low = crit.filter((t) => t.n && t.successes / t.n < 0.8);
    const sev4 = (r.observed_problems || []).filter((o) => Number(o.severity) >= 4 && o.status !== 'fixed');
    if (low.length || sev4.length) return st('fail', `${low.length} critical task(s) below 80%; ${sev4.length} open severity-4 observation(s)`);
    return st('pass', `${crit.length} critical task(s) ≥ 80% unassisted success`);
  },
  retests(I) {
    const r = latestResults(I);
    if (!r) return st('not_run', 'no study results');
    const sev3 = (r.observed_problems || []).filter((o) => Number(o.severity) >= 3);
    const notRetested = sev3.filter((o) => !o.retest || o.retest.confidence === undefined);
    return notRetested.length ? st('fail', `${notRetested.length} severe observed problem(s) not re-tested`) : st('pass', `${sev3.length} severe observed problem(s) re-tested`);
  },
  'honest-metrics'(I) {
    const r = latestResults(I);
    if (!r) return st('not_run', 'no study results');
    const tasks = r.tasks || [];
    const noCi = tasks.filter((t) => !t.success_ci);
    const badNps = r.nps && (r.n_total || 0) < 30;
    return noCi.length || badNps ? st('fail', `${noCi.length} task metric(s) without CI${badNps ? '; NPS from a small sample' : ''}`) : st('pass', 'metrics reported with intervals');
  },
  desirability(I) {
    const planned = I.studies.some((s) => /desirability|reaction card/i.test(s.plan));
    if (!planned) return st('not_applicable', 'no desirability study planned');
    const r = latestResults(I);
    return r?.desirability ? st('pass', 'desirability share reported') : st('not_run', 'desirability planned but not reported');
  },
  experiment(I) {
    const planned = I.studies.some((s) => /a\/b|experiment/i.test(s.plan));
    if (!planned) return st('not_applicable', 'no experiment planned');
    const r = latestResults(I);
    if (!r?.experiment) return st('not_run', 'experiment planned but not reported');
    const ex = r.experiment;
    return ex.preregistered && ex.srm_passed && ex.fixed_horizon !== false ? st('pass', 'experiment valid') : st('fail', 'experiment lacks pre-registration, SRM pass or a fixed horizon');
  },
};

function latestResults(I) {
  const withResults = I.studies.filter((s) => s.results).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return withResults.length ? withResults.at(-1).results : null;
}

/**
 * Evaluate all criteria, gates and the assurance level.
 * @returns {{criteria:Record<string,any>, gates:Record<string,any>, achieved:string, achieved_label:string, target:string, blocking:any[]}}
 */
/**
 * Gate criteria plus the catalogue soft tells that QUALITY-BAR does not list one by one: every soft tell with status
 * active or rising counts toward G4 and needs a disposition (ADR-031). Experimental tells never count.
 */
export function withCatalogueTells(rules) {
  const all = { ...rules };
  for (const t of Object.values(loadTells())) {
    if (all[t.id] || t.class !== 'soft' || t.counts_toward_g4 === false) continue;
    if (!['active', 'rising'].includes(String(t.status || '').toLowerCase())) continue;
    all[t.id] = {
      id: t.id,
      gate: 'G4',
      title: t.title,
      class: 'soft',
      level: 'gate',
      eval: 'tool',
      check: null,
      waivable: true,
      acceptable_via_brief: t.acceptable_via_brief !== false,
      default_severity: t.default_severity || 1,
      catalogue: true,
    };
  }
  return all;
}

export function evaluateGates(I, baseRules, { target = 'L3' } = {}) {
  const rules = withCatalogueTells(baseRules);
  I.rules = rules;
  I._deferredSoftPages = null;
  applyAccepted(I, rules);
  const criteria = {};
  for (const rule of Object.values(rules)) {
    let res;
    if (rule.eval && rule.eval !== 'tool' && E[rule.eval]) res = E[rule.eval](I, rule);
    else if (rule.check || rule.id.startsWith('SLP-')) res = toolCriterion(I, rule);
    else res = st('not_run', 'no evaluator for this criterion');
    if (res.state === 'fail' && rule.waivable === false) res.waivable = false;
    criteria[rule.id] = { ...res, gate: rule.gate, title: rule.title, advisory: rule.level === 'advisory', required_for: rule.required_for || null, optional: !!rule.optional };
  }
  // EVD-04 is meta: every criterion has a state backed by evidence or an explicit reason.
  const unexplained = Object.entries(criteria).filter(([, c]) => !c.state || !c.detail);
  criteria['EVD-04'] = { ...(criteria['EVD-04'] || {}), ...(unexplained.length ? st('fail', `${unexplained.length} criteria without explicit state`) : st('pass', 'every criterion has an explicit state with a reason')), gate: 'G0', title: rules['EVD-04']?.title || 'State integrity' };

  const gates = {};
  for (const g of GATES) {
    const members = Object.entries(criteria).filter(([, c]) => c.gate === g && !c.advisory && !c.required_for && c.state !== 'not_applicable');
    const state = members.length ? worst(members.map(([, c]) => c.state)) : 'not_applicable';
    gates[g] = { state, failing: members.filter(([, c]) => ['fail', 'not_run'].includes(c.state)).map(([id]) => id), degraded: members.filter(([, c]) => c.state === 'degraded').map(([id]) => id) };
  }

  const okState = (state) => ['pass', 'waived', 'degraded', 'not_applicable'].includes(state);
  const ok = (g) => okState(gates[g].state);
  const deg = (gs) => gs.some((g) => gates[g].state === 'degraded');
  const humanOk = humanConfirmed(I, criteria);
  // L1 needs G2's automatable and scripted parts (QUALITY-BAR §3). A G2 criterion that is only waiting for the
  // accessibility auditor (A11Y-02's leftover incompletes, A11Y-19, A11Y-27) is listed for judgement, never claimed.
  // A judged criterion that has failed still blocks L1, because a known WCAG failure is a failure.
  const awaiting = (c) => c.gate === 'G2' && c.awaiting_judgement === true;
  const g2ForL1 = Object.entries(criteria).filter(([, c]) => c.gate === 'G2' && !c.advisory && !c.required_for && c.state !== 'not_applicable' && !awaiting(c));
  const g2L1State = g2ForL1.length ? worst(g2ForL1.map(([, c]) => c.state)) : 'not_applicable';
  gates.G2.l1_state = g2L1State;
  gates.G2.judged_listed = Object.entries(criteria).filter(([, c]) => awaiting(c)).map(([id]) => id);
  const l1Ok = ['G0', 'G1', 'G3', 'G4'].every(ok) && okState(g2L1State);
  const levels = [
    { id: 'L1', ok: l1Ok, gates: ['G0', 'G1', 'G2', 'G3', 'G4'] },
    { id: 'L2', ok: ['G2', 'G5', 'G6'].every(ok), gates: ['G2', 'G5', 'G6'] }, // G2 again: now with the judged rows
    { id: 'L3', ok: humanOk.ok, gates: [] },
    { id: 'L4', ok: ok('G7') && gates.G7.state !== 'not_applicable', gates: ['G7'] },
  ];
  let achieved = 'L0';
  const used = [];
  for (const lv of levels) {
    if (!lv.ok) break;
    achieved = lv.id;
    used.push(...lv.gates);
  }
  const achieved_label = achieved === 'L0' ? 'none' : `${achieved}${deg(used) ? ' (degraded)' : ''}`;
  const order = ['L0', 'L1', 'L2', 'L3', 'L4'];
  const blocking = [];
  for (const lv of levels) {
    if (order.indexOf(lv.id) <= order.indexOf(achieved)) continue;
    if (order.indexOf(lv.id) > order.indexOf(target)) break;
    for (const g of lv.gates) {
      for (const id of gates[g].failing) {
        if (lv.id === 'L1' && awaiting(criteria[id])) continue; // listed for judgement, not required at L1
        if (lv.id === 'L2' && g === 'G2' && !awaiting(criteria[id])) continue; // already listed under L1
        blocking.push({ level: lv.id, criterion: id, state: criteria[id].state, reason: criteria[id].detail });
      }
    }
    if (lv.id === 'L3' && !humanOk.ok) for (const r of humanOk.reasons) blocking.push({ level: 'L3', criterion: 'human', state: 'not_run', reason: r });
  }
  return { criteria, gates, achieved, achieved_label, target, blocking };
}

function humanConfirmed(I, criteria) {
  const reasons = [];
  if (criteria['A11Y-21']?.state !== 'pass') reasons.push('needs-human WCAG criteria not completed (A11Y-21)');
  const severe = I.runFindings.filter((f) => ['P0', 'P1'].includes(f.priority) && !['rejected', 'candidate'].includes(f.status));
  const unconfirmed = severe.filter((f) => !I.human.confirmations?.[f.id]);
  if (unconfirmed.length) reasons.push(`${unconfirmed.length} P0/P1 finding(s) not confirmed or overruled by a human`);
  if (!I.human.design_verdict) reasons.push('the design verdict has not been confirmed by a human');
  return { ok: reasons.length === 0, reasons };
}
