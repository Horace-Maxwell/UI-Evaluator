// Living findings register (.ui-evaluator/findings.json): promotion from runs, dismissal ledger,
// stale detection and verdict application.
import { isoNow } from '../util/time.mjs';
import { normalizeSelector, normalizeSnippet } from '../util/text.mjs';
import { sha1 } from '../util/hash.mjs';
import { setStatus, applyPriorityPolicy, primaryCriterion, aggregateRatings, priorityFromMean, ACTIVE, isDeterministic, fingerprint } from './core.mjs';

/** Statuses that are copied into the register when a run is promoted. */
// A split finding is not promoted: its parts are (ADR-037).
const PROMOTABLE = new Set(['confirmed', 'open', 'in_progress', 'blocked', 'fixed', 'verified', 'reopened', 'deferred', 'disputed', 'wont_fix', 'dismissed', 'resolved', 'stale']);

/**
 * Copy a run's findings into the register. Matching fingerprints update the existing entry
 * (locations, evidence, severity, detection, last_seen_run); new ones are appended.
 */
export function promote(register, runFindings, runId) {
  const reg = { version: 1, next_id: 1, findings: [], ...register };
  const byId = new Map(reg.findings.map((f) => [f.id, f]));
  let added = 0;
  let updated = 0;
  for (const f of runFindings) {
    if (!PROMOTABLE.has(f.status)) continue;
    const existing = byId.get(f.id);
    if (!existing) {
      const copy = { ...f, first_seen_run: runId, last_seen_run: runId, runs: [runId] };
      if (copy.status === 'confirmed') setStatus(copy, 'open', { by: 'uie promote' });
      reg.findings.push(copy);
      byId.set(copy.id, copy);
      added += 1;
      continue;
    }
    // Keep lifecycle state from the register unless the run moved it forward.
    const keepStatus = existing.status;
    Object.assign(existing, {
      title: f.title,
      description: f.description,
      problem_type: f.problem_type,
      criteria: f.criteria,
      locations: f.locations,
      evidence: f.evidence,
      found_by: f.found_by,
      detection: f.detection,
      evidence_level: higherEvidence(existing.evidence_level, f.evidence_level),
      severity: f.severity || existing.severity,
      priority: f.priority || existing.priority,
      ease_of_fix: f.ease_of_fix ?? existing.ease_of_fix,
      criticality: f.criticality || existing.criticality,
      recommendation: f.recommendation || existing.recommendation,
      validity: f.validity || existing.validity,
      last_seen_run: runId,
      runs: [...new Set([...(existing.runs || []), runId])],
      updated_at: isoNow(),
    });
    if (['verified', 'resolved', 'dismissed', 'wont_fix'].includes(keepStatus) && ACTIVE.has(f.status)) {
      // A closed finding reappeared in a fresh run: reopen it, with the run as evidence.
      if (keepStatus === 'verified' || keepStatus === 'resolved') setStatus(existing, 'reopened', { by: 'uie promote', note: `reappeared in run ${runId}` });
    } else if (keepStatus === 'stale' && ACTIVE.has(f.status)) {
      setStatus(existing, 'open', { by: 'uie promote', note: `re-observed in run ${runId}`, force: true });
    }
    updated += 1;
  }
  const maxNum = reg.findings.reduce((m, f) => Math.max(m, Number(String(f.id).replace(/\D/g, '')) || 0), 0);
  reg.next_id = Math.max(reg.next_id || 1, maxNum + 1);
  return { register: reg, added, updated };
}

const EV_ORDER = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5'];
export function higherEvidence(a, b) {
  const ia = EV_ORDER.indexOf(a);
  const ib = EV_ORDER.indexOf(b);
  return (ia >= ib ? a : b) || a || b;
}

/** True when a candidate matches a dismissed finding (same element and mechanism, any criterion). */
export function matchesDismissal(f, dismissals) {
  const loc = (f.locations || [])[0] || {};
  const sel = normalizeSelector(loc.selector || '');
  return (dismissals.entries || []).find((d) => {
    if (d.fingerprint && d.fingerprint === f.fingerprint) return true;
    if (!sel || !d.selector) return false;
    return d.route === (loc.route || '') && normalizeSelector(d.selector) === sel && (!d.state || d.state === (loc.state || 'default'));
  });
}

export function addDismissal(dismissals, f, { reason, by }) {
  const loc = (f.locations || [])[0] || {};
  const entry = {
    finding: f.id,
    fingerprint: f.fingerprint,
    criterion: primaryCriterion(f).id,
    route: loc.route || '',
    state: loc.state || 'default',
    selector: loc.selector || '',
    title: f.title,
    reason,
    by,
    at: isoNow(),
  };
  return { version: 1, ...dismissals, entries: [...(dismissals.entries || []), entry] };
}

/**
 * Apply verifier verdicts to the merged findings (by id).
 * confirmed → confirmed (E1); rejected → rejected; needs_human → candidate (validity needs_verification);
 * split_required → candidate flagged for manual split. ceiling_flag is stored for rating (HCI-029).
 */
export function applyVerifierVerdicts(findings, verifierDoc, { dismissals } = {}) {
  const byId = new Map(findings.map((f) => [f.id, f]));
  const counts = { confirmed: 0, rejected: 0, needs_human: 0, split_required: 0, unknown: 0 };
  for (const v of verifierDoc.verdicts || []) {
    const f = byId.get(v.candidate_id || v.finding_id || v.id);
    if (!f) {
      counts.unknown += 1;
      continue;
    }
    f.verification_check = { verdict: v.verdict, step: v.step || null, reason: v.reason || null, evidence: v.evidence || [], at: isoNow() };
    if (v.ceiling_flag) f.ceiling_flag = true;
    if (v.verdict === 'confirmed') {
      if (f.status === 'candidate') setStatus(f, 'confirmed', { by: 'finding-verifier', note: v.reason });
      f.evidence_level = higherEvidence(f.evidence_level || 'E0', 'E1');
      if (Array.isArray(v.evidence)) f.evidence = [...(f.evidence || []), ...v.evidence.map((e) => (typeof e === 'string' ? { type: 'probe', ref: e, detail: 'verifier reproduction' } : e))];
      counts.confirmed += 1;
    } else if (v.verdict === 'rejected') {
      if (f.status === 'candidate' || f.status === 'confirmed') setStatus(f, 'rejected', { by: 'finding-verifier', note: `${v.step || ''}: ${v.reason || ''}`.trim() });
      counts.rejected += 1;
    } else if (v.verdict === 'needs_human') {
      f.validity = 'needs_verification';
      f.needs_human = v.reason || true;
      counts.needs_human += 1;
    } else if (v.verdict === 'split_required') {
      f.split_required = v.split_into || v.reason || true;
      counts.split_required += 1;
    } else counts.unknown += 1;
  }
  // Dismissal-ledger safety net (the verifier checks too).
  if (dismissals) {
    for (const f of findings) {
      if (f.status !== 'confirmed' && f.status !== 'candidate') continue;
      const d = matchesDismissal(f, dismissals);
      if (d && !(f.evidence_level && ['E3', 'E4', 'E5'].includes(f.evidence_level))) {
        setStatus(f, 'rejected', { by: 'dismissal-ledger', note: `previously dismissed (${d.finding}): ${d.reason}` });
        counts.rejected += 1;
      }
    }
  }
  return counts;
}

/**
 * Apply blind ratings (rating files) to confirmed judged findings.
 * Ratings reference finding ids (or blinded ids mapped through `blindMap`).
 */
export function applyRatings(findings, ratingDocs, { blindMap = {}, iteration = 1 } = {}) {
  const byId = new Map(findings.map((f) => [f.id, f]));
  const perFinding = new Map();
  for (const doc of ratingDocs) {
    for (const r of doc.ratings || []) {
      const id = blindMap[r.finding_id] || r.finding_id;
      if (!byId.has(id)) continue;
      if (!perFinding.has(id)) perFinding.set(id, []);
      perFinding.get(id).push({
        rater: doc.rater || doc.agent || 'rater',
        model: doc.model || undefined,
        frequency: r.frequency,
        impact: r.impact,
        persistence: r.persistence,
        business: r.business,
        value: r.validity === 'not_a_problem' ? null : r.value,
        validity: r.validity || 'problem',
        note: r.note,
      });
    }
  }
  let rated = 0;
  for (const [id, ratings] of perFinding) {
    const f = byId.get(id);
    const agg = aggregateWithValidity(ratings);
    f.severity = agg;
    f.priority = priorityFromMean(agg.mean);
    applyPriorityPolicy(f);
    if (agg.majority_validity !== 'problem') {
      f.validity = agg.majority_validity;
      if (f.status !== 'disputed') setStatus(f, 'disputed', { by: 'uie rate', note: `majority of raters voted ${agg.majority_validity}`, force: true });
    } else if (agg.divergent) {
      f.validity = f.validity || 'confirmed';
      if (f.status !== 'disputed') setStatus(f, 'disputed', { by: 'uie rate', note: 'ratings diverge; route to user research', force: true });
    } else {
      f.validity = 'confirmed';
      if (f.status === 'confirmed') setStatus(f, 'open', { by: 'uie rate' });
    }
    if (iteration >= 2 && f.ceiling_flag && Number.isFinite(agg.mean) && agg.mean < 2.5) {
      f.held = 'HCI-029: single-pass finding in a later iteration; needs a second independent pass or human confirmation';
    }
    rated += 1;
  }
  return { rated };
}

/** Severity aggregation that keeps "not a problem" votes out of the mean (ADR-029). */
export function aggregateWithValidity(ratings) {
  const valued = ratings.filter((r) => r.validity !== 'not_a_problem' && Number.isFinite(Number(r.value)));
  const base = aggregateRatings(valued.length ? valued : [{ value: NaN }]) || {};
  const notProblem = ratings.filter((r) => r.validity === 'not_a_problem').length;
  const tradeOff = ratings.filter((r) => r.validity === 'trade_off').length;
  const total = ratings.length;
  // ADR-029: a majority of raters who say "not a problem" or "a trade-off" (counted together) disputes the finding.
  let majority = 'problem';
  if (notProblem + tradeOff > total / 2) majority = tradeOff >= notProblem ? 'trade_off' : 'not_a_problem';
  const mean = valued.length ? base.mean : NaN;
  const spread = valued.length ? base.spread : 0;
  const divergent = spread >= 2 || (notProblem > 0 && Number.isFinite(mean) && mean >= 2.5);
  return {
    source: 'raters',
    ratings,
    mean: Number.isFinite(mean) ? mean : null,
    spread,
    divergent,
    provisional: total < 3,
    factors: base.factors || null,
    validity_votes: { problem: total - notProblem - tradeOff, trade_off: tradeOff, not_a_problem: notProblem, total },
    majority_validity: majority,
  };
}

/**
 * Apply a fix reviewer's verdicts (ADR-030). `confirmed_fixed` moves a judged finding to `verified` only when the review
 * ran isolated from the fixer (subagent or process). A single-context review is the fixer's own evidence, so judged
 * findings stay `fixed` until a human or an isolated reviewer confirms them. Deterministic findings are never verified
 * here: a re-run of their check that no longer reports them (`uie diff`) is their route. `held` lists both cases.
 * Negative verdicts reopen the finding whatever the isolation, because doubt is never self-serving.
 */
export function applyFixReview(findings, fixReviewDoc) {
  const byId = new Map(findings.map((f) => [f.id, f]));
  const independent = ['subagent', 'process'].includes(fixReviewDoc.isolation);
  const counts = { confirmed_fixed: 0, partially_fixed: 0, not_fixed: 0, recapture: 0, unknown: 0, held: 0 };
  const held = [];
  for (const item of fixReviewDoc.items || []) {
    const f = byId.get(item.finding_id);
    if (!f) {
      counts.unknown += 1;
      continue;
    }
    f.verification = {
      ...(f.verification || {}),
      reviewer_verdict: item.verdict,
      reviewer_evidence: item.evidence || [],
      review_run: fixReviewDoc.run || null,
      review_isolation: fixReviewDoc.isolation || 'unknown',
      at: isoNow(),
    };
    if (item.verdict === 'confirmed_fixed') {
      counts.confirmed_fixed += 1;
      const reason = isDeterministic(f)
        ? 'deterministic: verified by a re-run of its check (`uie diff` lists it as cleared)'
        : !independent
          ? `review not isolated from the fixer (${fixReviewDoc.isolation || 'isolation not recorded'}): needs a human or an isolated reviewer`
          : null;
      if (reason) {
        if (['open', 'reopened', 'in_progress'].includes(f.status)) setStatus(f, 'fixed', { by: 'fix-reviewer', note: reason });
        held.push({ id: f.id, status: f.status, reason });
        counts.held += 1;
        continue;
      }
      setStatus(f, 'verified', { by: 'fix-reviewer', force: !['fixed', 'open', 'reopened'].includes(f.status) });
    } else if (item.verdict === 'partially_fixed' || item.verdict === 'not_fixed') {
      setStatus(f, 'reopened', { by: 'fix-reviewer', note: item.note, force: true });
      counts[item.verdict] += 1;
    } else if (item.verdict === 'recapture') counts.recapture += 1;
    else counts.unknown += 1;
  }
  // IMP-040: partially_fixed or not_fixed can never lead to "ship", whatever the reviewer wrote.
  let disposition = fixReviewDoc.disposition || null;
  let overridden = null;
  if (disposition === 'ship' && counts.partially_fixed + counts.not_fixed > 0) {
    overridden = 'ship';
    disposition = 'fix';
  }
  return { counts, held, independent, disposition, overridden, regressions: fixReviewDoc.regressions || [] };
}

/** Mark register findings stale when their anchors no longer resolve in a run's evidence (EVD-08). */
export function markStale(register, unresolvedIds, runId) {
  let n = 0;
  for (const f of register.findings || []) {
    if (!unresolvedIds.has(f.id)) continue;
    if (['verified', 'resolved', 'dismissed', 'wont_fix', 'rejected', 'stale'].includes(f.status)) continue;
    setStatus(f, 'stale', { by: 'uie', note: `anchor did not resolve in run ${runId}`, force: true });
    n += 1;
  }
  return n;
}

// --- splitting a finding (ADR-037) -----------------------------------------------------------------------------------

const idNum = (id) => Number(String(id).replace(/\D/g, '')) || 0;
const fmtId = (n) => `F-${String(n).padStart(4, '0')}`;

/**
 * Plan a split without changing anything: the parts a `candidate` or `confirmed` finding becomes. Each part gives a
 * title and a description; criteria, locations, evidence, scope, problem type, impact and recommendation default to the
 * original's. The parts keep the original's sources and start as candidates. `next` is the first free ID number.
 */
export function planSplit(doc, id, parts, { next, by = 'lead' } = {}) {
  const f = (doc.findings || []).find((x) => x.id === id);
  if (!f) throw new Error(`finding ${id} is not in this run's merged findings`);
  if (!['candidate', 'confirmed'].includes(f.status)) throw new Error(`only a candidate or a confirmed, unrated finding can be split (ADR-037); ${id} is ${f.status}`);
  if (!Array.isArray(parts) || parts.length < 2) throw new Error('a split needs at least two parts');
  const at = isoNow();
  let n = next;
  const built = parts.map((p, i) => {
    if (!p || typeof p !== 'object' || !p.title || !p.description) throw new Error(`part ${i + 1} needs a title and a description`);
    const part = {
      problem_type: f.problem_type,
      criteria: f.criteria,
      scope: f.scope,
      locations: f.locations,
      evidence: f.evidence,
      impact: f.impact,
      recommendation: f.recommendation,
      tags: f.tags,
      ...p,
      id: fmtId(n),
      status: 'candidate',
      evidence_level: p.evidence_level || 'E0',
      found_by: f.found_by,
      merged_from: f.merged_from,
      detection: f.detection,
      split_from: f.id,
      created_at: at,
      updated_at: at,
      status_history: [{ status: 'candidate', at, by, note: `split from ${f.id}` }],
    };
    n += 1;
    for (const k of Object.keys(part)) if (part[k] === undefined) delete part[k];
    // A part that keeps the original's criterion and location would share its fingerprint (criterion + location +
    // snippet), so a part's identity is the original's plus the part's own title.
    part.fingerprint = `sha1:${sha1(['split', f.fingerprint || fingerprint(f), normalizeSnippet(part.title)].join('##'))}`;
    return part;
  });
  return { original: f, parts: built, next: n, record: { original: f.id, fingerprint: f.fingerprint, at, by, parts: built.map((x) => JSON.parse(JSON.stringify(x))) } };
}

/** Apply a planned split: the original becomes `split` and its parts follow it in the list. */
export function applySplit(doc, plan, { by = 'lead' } = {}) {
  const f = plan.original;
  setStatus(f, 'split', { by, note: `split into ${plan.parts.map((x) => x.id).join(', ')}` });
  f.split_into = plan.parts.map((x) => x.id);
  delete f.split_required;
  const i = doc.findings.indexOf(f);
  doc.findings.splice(i + 1, 0, ...plan.parts);
}

/**
 * Re-apply recorded splits after a re-merge rebuilt the run's findings: the original, found by fingerprint, becomes
 * `split` again and its parts return with their IDs. A part whose ID is taken now gets the next free one.
 */
export function reapplySplits(doc, records, { by = 'uie findings merge' } = {}) {
  let applied = 0;
  let renumbered = false;
  let next = Math.max(...doc.findings.map((x) => idNum(x.id) + 1), ...records.flatMap((r) => r.parts.map((p) => idNum(p.id) + 1)), 1);
  for (const r of records) {
    const f = doc.findings.find((x) => x.fingerprint === r.fingerprint) || doc.findings.find((x) => x.id === r.original);
    if (!f || f.status === 'split') continue;
    const taken = new Set(doc.findings.map((x) => x.id));
    const parts = r.parts.map((p) => {
      const copy = JSON.parse(JSON.stringify(p));
      if (taken.has(copy.id)) {
        copy.id = fmtId(next);
        next += 1;
        p.id = copy.id;
        renumbered = true;
      }
      return copy;
    });
    setStatus(f, 'split', { by, note: `split recorded ${r.at}`, force: true });
    f.split_into = parts.map((x) => x.id);
    delete f.split_required;
    doc.findings.splice(doc.findings.indexOf(f) + 1, 0, ...parts);
    applied += 1;
  }
  return { applied, renumbered, next: Math.max(next, ...doc.findings.map((x) => idNum(x.id) + 1)) };
}
