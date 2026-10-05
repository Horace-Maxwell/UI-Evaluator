// WCAG 2.2 A/AA coverage matrix (A11Y-20): how each success criterion was covered, and its state.
import { primaryCriterion } from '../findings/core.mjs';

const CHECK_FOR = {
  // Engine and scripted checks that can settle (part of) a success criterion.
  auto: ['axe'],
  scripted: ['keyboard', 'dialogs', 'layout', 'targets', 'contrast', 'forms', 'live-regions', 'lang', 'cross-page', 'lint', 'motion', 'states'],
};

export function buildCoverage(I, wcag) {
  const active = I.runFindings.filter((f) => !['rejected', 'dismissed', 'verified', 'resolved', 'stale', 'candidate'].includes(f.status));
  const failingSc = new Map();
  for (const f of active) {
    for (const c of f.criteria || []) {
      if (c.kind === 'wcag') failingSc.set(c.id, [...(failingSc.get(c.id) || []), f.id]);
    }
  }
  const auditor = I.outputs.find((o) => o.role === 'accessibility-auditor');
  const labels = auditor?.doc?.coverage_labels || {};
  const ran = (names) => names.some((n) => I.checks[n]?.state === 'ran');
  const criteria = {};
  for (const sc of wcag.criteria || []) {
    let coverage = sc.coverage;
    let state;
    const fails = failingSc.get(sc.sc);
    if (fails) state = 'fail';
    else if (coverage === 'auto') state = ran(CHECK_FOR.auto) ? 'pass' : 'not_run';
    else if (coverage === 'scripted') state = ran(CHECK_FOR.scripted) ? 'pass' : 'not_run';
    else if (coverage === 'judged') {
      const l = labels[sc.sc];
      if (l === 'agent-judged-pass') state = 'pass';
      else if (l === 'agent-judged-fail') state = 'fail';
      else if (l === 'not-applicable') state = 'not_applicable';
      else if (l === 'needs-human') {
        coverage = 'needs-human';
        state = I.human?.wcag?.[sc.sc]?.done ? (I.human.wcag[sc.sc].result === 'fail' ? 'fail' : 'pass') : 'not_run';
      } else state = 'not_run';
    } else {
      coverage = 'needs-human';
      state = I.human?.wcag?.[sc.sc]?.done ? (I.human.wcag[sc.sc].result === 'fail' ? 'fail' : 'pass') : 'not_run';
    }
    criteria[sc.sc] = { level: sc.level, name: sc.name, coverage: coverage === 'judged' ? 'agent-judged' : coverage, state, findings: fails || [], gate_criteria: sc.criteria || [] };
  }
  const counts = {};
  for (const c of Object.values(criteria)) counts[`${c.coverage}:${c.state}`] = (counts[`${c.coverage}:${c.state}`] || 0) + 1;
  return { schema: 'coverage', total: Object.keys(criteria).length, counts, criteria, note: 'Coverage method per success criterion and its state. Automation covers a minority of WCAG; needs-human items are completed by a person at L3. Never read this as a conformance claim.' };
}

export function primaryOf(f) {
  return primaryCriterion(f).id;
}
