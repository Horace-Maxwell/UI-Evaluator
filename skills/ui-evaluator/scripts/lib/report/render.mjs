// Render the run report (FRAMEWORK §13; templates/report.md) from run artifacts. Nothing is hand-typed here:
// every row traces to a file. Lead-written prose (strengths, divergent-item questions, next steps) comes from
// runs/<id>/debrief.md sections when present.
import path from 'node:path';
import { readJson, readText, exists } from '../util/fs.mjs';
import { sections, stripComments } from '../util/markdown.mjs';
import { primaryCriterion, PRIORITY_ORDER } from '../findings/core.mjs';
import { GATES, GATE_NAMES } from '../gates/rules.mjs';
import { truncate } from '../util/text.mjs';

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ');
const sev = (f) => {
  const s = f.severity;
  if (!s) return '—';
  if (s.source === 'rule') return `rule: ${s.value ?? s.mean}`;
  const vals = (s.ratings || []).map((r) => (r.value === null || r.value === undefined ? 'n/p' : r.value)).join(', ');
  const base = `${s.mean ?? '—'} (spread ${s.spread ?? 0}${vals ? `; ${vals}` : ''})`;
  return s.provisional ? `${base}, provisional (fewer than 3 raters)` : base;
};
const evid = (f) => {
  const lvl = f.evidence_level || 'E0';
  const words = { E0: 'predicted, not verified', E1: 'reproduced or measured', E2: 'confirmed by an expert', E3: 'observed with users', E4: 'measured with users', E5: 'causal' }[lvl];
  return `${lvl}, ${words}`;
};

function debriefSections(runDir) {
  const p = path.join(runDir, 'debrief.md');
  if (!exists(p)) return new Map();
  const map = new Map();
  for (const s of sections(readText(p), 2)) map.set(s.title.toLowerCase(), stripComments(s.content).trim());
  return map;
}

function findSection(map, ...names) {
  for (const [k, v] of map) if (names.some((n) => k.includes(n))) return v;
  return null;
}

/**
 * @returns {{ markdown: string, csvRows: string[][], proseForLint: {where:string,text:string}[] }}
 */
export function renderReport({ I, gates, coverage, runId, agreement, diff, fixReview, register }) {
  const m = I.manifest || {};
  const deb = debriefSections(I.runDir);
  const lines = [];
  const prose = [];
  const push = (...l) => lines.push(...l);

  // Banners first (EVD-07).
  const degraded = Object.entries(gates.criteria).filter(([, c]) => c.state === 'degraded');
  const singleCtx = (m.evaluators || []).filter((e) => e.isolation === 'single-context');
  if (singleCtx.length) push(`DEGRADED: single-context (${singleCtx.map((e) => e.agent).join(', ')} ran without isolation)`, '');
  for (const [id, c] of degraded) if (!/single|isolat/i.test(c.detail)) push(`DEGRADED: ${id} (${c.detail})`, '');

  push(`# UI evaluation report: ${I.config.project?.name || path.basename(I.root)} · run ${runId}`, '');
  push('Contents: 1 Scope and method · 2 Verdict · 3 Strengths to preserve · 4 Findings · 5 Divergent and disputed findings · 6 WCAG coverage · 7 Not assessed · 8 Fixes and verification · 9 Next steps · 10 Limits', '');

  // 1. Scope and method
  const routes = m.scope?.routes || I.config.routes || [];
  const stateCount = routes.reduce((a, r) => a + ((r.states || []).length || 1), 0);
  const matrix = m.scope?.matrix || I.config.matrix || {};
  const browserRan = ['axe', 'layout', 'census', 'contrast', 'routes'].some((k) => I.checks[k]?.state === 'ran');
  const lintRan = I.checks.lint?.state === 'ran';
  const situation = browserRan && lintRan ? 'source and a runnable app' : browserRan ? 'live UI without source review' : lintRan ? 'source only (no browser checks ran)' : 'static or analytical only';
  push('## 1. Scope and method', '', '| Item | Value |', '|---|---|');
  push(`| Build | ${m.commit ? `git:${m.commit.slice(0, 10)}${m.dirty ? ' (uncommitted changes present)' : ''}` : 'no commit recorded'} · run opened ${m.created_at || '—'} |`);
  push(`| Input situation | ${situation} (FRAMEWORK §14) |`);
  push(`| Surfaces and modes | ${routes.map((r) => `${r.surface || r.path} (${r.mode})`).join(', ') || '—'} |`);
  push(`| Routes × states | ${routes.length} route(s) × ${stateCount} state(s) |`);
  push(`| Matrix | widths ${(matrix.widths || []).join(', ')} × ${(matrix.themes || []).join(', ')} × ${(matrix.preferences || []).join(', ')} |`);
  push(`| Depth | ${m.depth || I.config.depth} (iteration ${m.iteration || 1}) |`);
  push(`| Doctor smoke test | ${I.doctor ? `${I.doctor.passed ? 'passed' : 'FAILED'} ${I.doctor.at}` : 'not run'} (EVD-02) |`, '');
  const ev = m.evaluators || [];
  if (ev.length) {
    push('Evaluators (EVD-07):', '', '| Role | Agents | Isolation | Model | Packet hashes |', '|---|---|---|---|---|');
    const byRole = new Map();
    for (const e of ev) byRole.set(e.role, [...(byRole.get(e.role) || []), e]);
    for (const [role, es] of byRole) {
      push(`| ${role} | ${es.length} | ${[...new Set(es.map((e) => e.isolation))].join(', ')} | ${[...new Set(es.map((e) => e.model))].join(', ')} | ${es.map((e) => (e.packet_hash || '').slice(0, 8)).filter(Boolean).join(' ') || '—'} |`);
    }
    push('');
  }
  const cap = m.captures || {};
  const cov = I.outputs.filter((o) => o.role === 'heuristic-evaluator').map((o) => o.doc.coverage).filter((c) => c?.controls_total);
  const covPct = cov.length ? Math.round(Math.max(...cov.map((c) => c.controls_exercised / c.controls_total)) * 100) : null;
  push(`Coverage: ${cap.valid ?? 0} valid capture(s)${cap.invalid ? `, ${cap.invalid} invalid` : ''}${covPct !== null ? `; ${covPct}% of salient controls exercised (USE-09)` : ''}. A single inspection pass finds roughly a third of problems, and a single LLM pass about 35–45% of an expert set, so this report is not a complete list (METHODS §10).`, '');

  // 2. Verdict
  const blockNext = gates.blocking.filter((b) => b.level === nextLevel(gates.achieved)).slice(0, 6);
  push('## 2. Verdict', '');
  push(`**Target level:** ${gates.target} · **Achieved:** ${gates.achieved_label}${blockNext.length ? ` · **Blocking ${nextLevel(gates.achieved)}:** ${blockNext.map((b) => `${b.criterion} (${b.reason})`).join('; ')}` : ''}`, '');
  push('| Gate | State | Failing, degraded or waived criteria |', '|---|---|---|');
  for (const g of GATES) {
    const gs = gates.gates[g];
    const waived = Object.entries(gates.criteria).filter(([, c]) => c.gate === g && c.state === 'waived').map(([id]) => `${id} (waived)`);
    const list = [...gs.failing, ...gs.degraded.map((x) => `${x} (degraded)`), ...waived];
    push(`| ${g} ${GATE_NAMES[g]} | ${gs.state} | ${list.join(', ') || '—'} |`);
  }
  push('', 'States: pass · fail · not_run · not_applicable · degraded · waived. `not_run` never counts as a pass.', '');
  const waivers = (I.waivers.waivers || []).map((w) => `${w.criterion}${w.finding ? ` (${w.finding})` : ''} · ${w.by} · ${w.reason}`);
  push(`- Waivers (owner, .ui-evaluator/waivers.json): ${waivers.length ? waivers.join('; ') : 'none'}`);
  const accepted = [...I.accepted.entries()].map(([id, t]) => `${id} · ${t.scope || 'all'} · ${t.reason}`);
  push(`- Accepted tells, reported as requested: ${accepted.length ? accepted.join('; ') : 'none'}`);
  const overrides = (I.config.threshold_overrides || []).map((o) => `${o.criterion} ${o.parameter || ''} = ${o.value} (${o.reason})`);
  push(`- Threshold overrides (config.json): ${overrides.length ? overrides.join('; ') : 'none'}`, '');

  // 3. Strengths
  push('## 3. Strengths to preserve', '');
  const strengths = [];
  for (const o of I.outputs) for (const s of o.doc.strengths || []) strengths.push(s.title);
  const debStrengths = findSection(deb, 'strength');
  if (debStrengths) {
    push(debStrengths, '');
    prose.push({ where: 'debrief.strengths', text: debStrengths });
  }
  const uniq = [...new Set(strengths)].slice(0, 8);
  if (uniq.length) push(...uniq.map((s) => `- ${s}`), '');
  if (!debStrengths && !uniq.length) push('- None recorded. Evaluators list strengths with evidence; the debrief adds the ones to keep.', '');

  // 4. Findings
  push('## 4. Findings', '');
  const reported = I.runFindings.filter((f) => !['rejected', 'candidate', 'dismissed'].includes(f.status) && !f.held && f.priority && f.priority !== 'none');
  const agreeLine = agreement
    ? `Agreement: any-two agreement ${Number.isFinite(agreement.any_two_agreement?.mean) ? agreement.any_two_agreement.mean.toFixed(2) : 'n/a'} (mean Jaccard over ${agreement.heuristic_passes} passes); ${Number.isFinite(agreement.discovery?.estimated_total) ? `an estimated ${Math.max(0, agreement.discovery.estimated_total - agreement.discovery.found).toFixed(1)} more problem(s) undiscovered (discovery-rate estimate, optimistic with few passes)` : 'too few passes for a discovery estimate'}.`
    : 'Agreement statistics were not computed for this run.';
  push(agreeLine, '');
  for (const pr of PRIORITY_ORDER.filter((p) => p !== 'none')) {
    const items = reported.filter((f) => f.priority === pr).sort((a, b) => (b.severity?.mean ?? b.severity?.value ?? 0) - (a.severity?.mean ?? a.severity?.value ?? 0));
    if (!items.length) continue;
    push(`### ${pr}`, '');
    if (pr === 'P0' || pr === 'P1') {
      for (const f of items) {
        const c = primaryCriterion(f);
        const loc = (f.locations || [])[0] || {};
        push(`#### ${f.id} · ${esc(f.title)}`);
        push(`- Problem type: ${String(f.problem_type || '').replace('_', ' ')} · Criteria: ${(f.criteria || []).map((x) => `${x.id}${x.primary ? ' (primary)' : ''}`).join(', ') || c.id}${loc.route ? ` · Where: ${loc.route}${loc.state && loc.state !== 'default' ? ` [${loc.state}]` : ''}${(f.locations || []).length > 1 ? ` and ${(f.locations || []).length - 1} more location(s)` : ''}` : ''}`);
        push(`- What happens: ${esc(f.description)}`);
        if (f.impact) push(`- Impact: ${esc(f.impact)}`);
        const evRefs = [...new Set([...(f.locations || []).map((l) => l.crop).filter(Boolean), ...(f.evidence || []).map((e) => e.ref).filter(Boolean)])].slice(0, 4);
        push(`- Evidence: ${evid(f)}${evRefs.length ? ` · ${evRefs.join(', ')}` : ''}${f.detection?.n ? ` · detected by ${f.detection.k} of ${f.detection.n} pass(es)` : ''}`);
        push(`- Severity ${sev(f)} · Priority ${f.priority}${f.ease_of_fix ? ` · Ease of fix ${f.ease_of_fix}` : ''}`);
        if (f.recommendation) push(`- Recommendation (advisory): ${esc(f.recommendation)}`);
        push(`- Status: ${f.status}`, '');
      }
    } else {
      push('| ID | Title | Criterion | Evidence | Severity | Ease of fix | Status |', '|---|---|---|---|---|---|---|');
      for (const f of items) push(`| ${f.id} | ${esc(truncate(f.title, 90))} | ${primaryCriterion(f).id} | ${f.evidence_level || 'E0'} | ${sev(f)} | ${f.ease_of_fix ?? '—'} | ${f.status} |`);
      push('');
    }
  }
  // Verified judged findings that no rater has scored yet (quick depth has no raters): listed, never silently dropped.
  const unrated = I.runFindings.filter((f) => !['rejected', 'candidate', 'dismissed', 'stale'].includes(f.status) && !f.held && !f.priority && f.severity?.source !== 'rule');
  if (unrated.length) {
    push('### Not yet rated', '', 'Confirmed judged findings without a severity rating. They need blind raters (`uie packet --role severity-rater`, then `uie findings rate`) before they can be prioritised.', '');
    push('| ID | Title | Criterion | Evidence | Found by | Status |', '|---|---|---|---|---|---|');
    for (const f of unrated) push(`| ${f.id} | ${esc(truncate(f.title, 90))} | ${primaryCriterion(f).id} | ${f.evidence_level || 'E0'} | ${[...new Set((f.found_by || []).map((b) => b.role))].join(', ') || '—'} | ${f.status} |`);
    push('');
  }
  // Judged findings from earlier runs that this run did not re-examine and that are still open in the register.
  const carried = (I.carried || []).filter((f) => !['rejected', 'candidate', 'dismissed', 'stale'].includes(f.status));
  if (carried.length) {
    push('### Still open from earlier runs', '', 'Judged findings this run did not re-examine. They stay open until a fix review or a person closes them, and USE-05 and USE-06 count them.', '');
    push('| ID | Title | Priority | Criterion | Status |', '|---|---|---|---|---|');
    for (const f of carried) push(`| ${f.id} | ${esc(truncate(f.title, 90))} | ${f.priority || 'not rated'} | ${primaryCriterion(f).id} | ${f.status} |`);
    push('');
  }
  if (!reported.length && !unrated.length && !carried.length) push('No findings were reported in this run. That is not a claim that none exist (METHODS §10).', '');
  const held = I.runFindings.filter((f) => f.held);
  if (held.length) push(`Held for a second independent pass (HCI-029): ${held.map((f) => `${f.id} ${truncate(f.title, 60)}`).join('; ')}.`, '');

  // 5. Divergent and disputed
  push('## 5. Divergent and disputed findings: questions for user research', '');
  const div = I.runFindings.filter((f) => f.severity?.divergent || f.status === 'disputed');
  const debDiv = findSection(deb, 'divergent', 'disputed', 'question');
  if (debDiv) {
    push(debDiv, '');
    prose.push({ where: 'debrief.divergent', text: debDiv });
  }
  if (div.length) {
    push('| ID | Title | Ratings and validity votes | Status |', '|---|---|---|---|');
    for (const f of div) {
      const vv = f.severity?.validity_votes;
      push(`| ${f.id} | ${esc(truncate(f.title, 90))} | ${sev(f)}${vv ? `; not a problem ${vv.not_a_problem}, trade-off ${vv.trade_off}` : ''} | ${f.status} |`);
    }
    push('', 'Divergent findings are never settled by a vote (ADR-018). The study workflow turns them into tasks and measures.', '');
  } else if (!debDiv) push('None in this run.', '');

  // 6. WCAG coverage
  push('## 6. WCAG 2.2 AA coverage', '', '| SC | Level | Name | Coverage | State | Findings |', '|---|---|---|---|---|---|');
  const covEntries = Object.entries(coverage.criteria || {});
  for (const [sc, c] of covEntries) push(`| ${sc} | ${c.level} | ${esc(c.name)} | ${c.coverage} | ${c.state} | ${(c.findings || []).join(', ') || '—'} |`);
  if (!covEntries.length) push('| — | — | the WCAG data file is missing | — | not_run | — |');
  const tally = (key, val) => covEntries.filter(([, c]) => c[key] === val).length;
  push('', `Totals by coverage: auto ${tally('coverage', 'auto')} · scripted ${tally('coverage', 'scripted')} · agent-judged ${tally('coverage', 'agent-judged')} · needs-human ${tally('coverage', 'needs-human')}; by state: pass ${tally('state', 'pass')} · fail ${tally('state', 'fail')} · not_run ${tally('state', 'not_run')}. This matrix is not a conformance claim (QUALITY-BAR §8).`, '');

  // 7. Not assessed
  push('## 7. Not assessed', '');
  const notRun = Object.entries(gates.criteria).filter(([, c]) => ['not_run', 'not_applicable'].includes(c.state) && !c.required_for);
  const na = I.outputs.flatMap((o) => (o.doc.not_assessable || []).map((x) => `${x} (${o.agent})`));
  for (const [id, c] of notRun) push(`- ${id} ${c.title ? `${c.title}: ` : ''}${c.state} — ${c.detail}`);
  for (const x of [...new Set(na)]) push(`- ${x}`);
  if (!notRun.length && !na.length) push('- Nothing in the declared scope was left unassessed.');
  push('');

  // 8. Fixes and verification
  push('## 8. Fixes and verification', '');
  const fixed = (register?.findings || []).filter((f) => f.verification || ['fixed', 'verified', 'resolved', 'reopened'].includes(f.status));
  if (fixed.length) {
    push('| Finding | Status | Originating check | Fix review | Commit |', '|---|---|---|---|---|');
    for (const f of fixed) push(`| ${f.id} | ${f.status} | ${esc(f.verification?.originating_check || primaryCriterion(f).id)} | ${f.verification?.reviewer_verdict || '—'} | ${f.verification?.fix_commit || '—'} |`);
    push('');
  } else push('No fixes were made against this run yet.', '');
  if (diff) push(`Run diff against ${diff.base}: cleared ${diff.counts?.cleared ?? 0} · introduced ${diff.counts?.introduced ?? 0} · persisting ${diff.counts?.persisting ?? 0}.${(diff.counts?.introduced ?? 0) ? ' Every introduced finding must be explained before release.' : ''}`, '');
  if (fixReview) push(`Fix review disposition: **${fixReview.disposition}**${(fixReview.regressions || []).length ? `; regressions: ${fixReview.regressions.map((x) => x.title).join('; ')}` : ''}.`, '');

  // 9. Next steps
  push('## 9. Next steps', '');
  const debNext = findSection(deb, 'next step');
  if (debNext) {
    push(debNext, '');
    prose.push({ where: 'debrief.next-steps', text: debNext });
  } else {
    const steps = [];
    const queue = reported.filter((f) => ['P0', 'P1'].includes(f.priority) && ['open', 'reopened', 'confirmed'].includes(f.status));
    if (queue.length) steps.push(`Fix queue: ${queue.slice(0, 6).map((f) => f.id).join(', ')} (\`fix\` workflow, one finding per commit).`);
    for (const lvl of ['L1', 'L2', 'L3', 'L4']) {
      const b = gates.blocking.filter((x) => x.level === lvl);
      if (b.length) steps.push(`For ${lvl}: ${b.slice(0, 5).map((x) => `${x.criterion} (${x.reason})`).join('; ')}${b.length > 5 ? ' …' : ''}.`);
    }
    if (div.length) steps.push(`Plan a study for ${div.length} divergent or disputed finding(s) (\`study\` workflow).`);
    steps.push('The owner reviews agree-disagree.csv; it returns through `ingest --source stakeholders`.');
    push(...steps.map((s, i) => `${i + 1}. ${s}`), '');
  }

  // 10. Limits
  push('## 10. Limits', '');
  push('- Heuristic evaluation can report false problems and miss others; walkthrough failure points are hypotheses, and agent task completion is not predicted user success; design-panel scores are judged context only; automated accessibility checks cover a minority of WCAG criteria (METHODS §10).');
  const hasUsers = I.studies.some((s) => s.results);
  if (!hasUsers) push('- No real users took part in this run, so nothing here describes what users do.');
  push('- What passing does not mean: not beautiful to everyone, not free of usability problems, not WCAG conformant, not proof of who or what made the design, not a business outcome (QUALITY-BAR §8).', '');

  // Review sheet rows: every P0/P1 plus the design verdict.
  const csvRows = [['finding_id', 'title', 'priority', 'verdict', 'comment', 'reviewer', 'role', 'date']];
  for (const f of reported.filter((x) => ['P0', 'P1'].includes(x.priority))) csvRows.push([f.id, f.title, f.priority, '', '', '', '', '']);
  const specific = gates.criteria['DES-02'];
  if (specific && specific.state !== 'not_run') csvRows.push(['DES-02', `Design panel verdict: ${specific.detail}`, '', '', '', '', '', '']);

  return { markdown: `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`, csvRows, proseForLint: prose };
}

function nextLevel(l) {
  return { L0: 'L1', L1: 'L2', L2: 'L3', L3: 'L4', L4: 'L4' }[l] || 'L1';
}
