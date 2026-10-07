// Finding identity, severity, priority, lifecycle and fix-queue ordering (FRAMEWORK §4.3–4.5, §8; QUALITY-BAR §6).
import { sha1 } from '../util/hash.mjs';
import { normalizeSelector, normalizeSnippet } from '../util/text.mjs';
import { isoNow } from '../util/time.mjs';

export const STATUSES = [
  'candidate', 'rejected', 'confirmed', 'open', 'in_progress', 'blocked', 'fixed', 'verified', 'resolved',
  'reopened', 'deferred', 'disputed', 'dismissed', 'wont_fix', 'stale', 'split',
];

/** Statuses that count as "still a problem" for gating. A blocked finding waits on a decision and is still open (ADR-036). */
export const ACTIVE = new Set(['confirmed', 'open', 'in_progress', 'blocked', 'fixed', 'reopened', 'disputed']);
/** Statuses that are closed for the fix queue. A split finding lives on in its parts (ADR-037). */
export const CLOSED = new Set(['verified', 'resolved', 'dismissed', 'wont_fix', 'rejected', 'split']);

const TRANSITIONS = {
  candidate: ['confirmed', 'rejected', 'stale', 'disputed', 'open', 'split'],
  confirmed: ['open', 'rejected', 'stale', 'disputed', 'dismissed', 'deferred', 'wont_fix', 'blocked', 'split'],
  open: ['in_progress', 'fixed', 'verified', 'deferred', 'disputed', 'dismissed', 'wont_fix', 'stale', 'open', 'blocked'],
  in_progress: ['fixed', 'open', 'deferred', 'reopened', 'wont_fix', 'blocked'],
  // Leaves through the named person's answer (ADR-036).
  blocked: ['open', 'in_progress', 'deferred', 'wont_fix', 'dismissed', 'stale'],
  fixed: ['verified', 'reopened', 'stale', 'open'],
  verified: ['resolved', 'reopened', 'stale'],
  reopened: ['in_progress', 'open', 'fixed', 'deferred', 'disputed', 'wont_fix', 'dismissed', 'blocked'],
  deferred: ['open', 'dismissed', 'wont_fix', 'stale', 'in_progress'],
  disputed: ['open', 'dismissed', 'wont_fix', 'deferred'],
  dismissed: ['open'],
  wont_fix: ['open'],
  stale: ['candidate', 'confirmed', 'open', 'rejected', 'verified', 'fixed', 'reopened', 'blocked'],
  rejected: ['candidate', 'confirmed'],
  resolved: ['reopened'],
  split: [],
};

export function canTransition(from, to) {
  if (from === to) return true;
  return (TRANSITIONS[from] || []).includes(to);
}

/**
 * Change a finding's status with history. `by` is a role, agent id or "human:<name>".
 * Only humans may set `resolved` (ADR-020).
 */
export function setStatus(f, to, { by = 'lead', note, force = false } = {}) {
  if (!STATUSES.includes(to)) throw new Error(`unknown status "${to}"`);
  const from = f.status || 'candidate';
  if (to === 'resolved' && !String(by).startsWith('human:')) {
    throw new Error('only a human may mark a finding resolved (use --by human:<name>)');
  }
  if (!force && !canTransition(from, to)) throw new Error(`cannot move ${f.id || 'finding'} from ${from} to ${to}`);
  f.status = to;
  f.status_history = f.status_history || [];
  f.status_history.push({ status: to, at: isoNow(), by, ...(note ? { note } : {}) });
  f.updated_at = isoNow();
  return f;
}

export function primaryCriterion(f) {
  const cs = f.criteria || [];
  return cs.find((c) => c.primary) || cs[0] || { kind: 'unknown', id: '?' };
}

export function locationKey(loc = {}) {
  return [loc.route || '', loc.state || 'default', normalizeSelector(loc.selector || '')].join('|');
}

export function isDeterministic(f) {
  return (f.found_by || []).some((b) => b.method === 'tool') && (f.found_by || []).every((b) => b.method === 'tool');
}

/**
 * Identity fingerprint (FRAMEWORK §4.3): criterion + location + normalised snippet, never line numbers.
 * Deterministic findings are grouped per rule and route, so their identity is rule + routes.
 */
export function fingerprint(f) {
  const c = primaryCriterion(f);
  if (isDeterministic(f)) {
    const routes = [...new Set((f.locations || []).map((l) => l.route || ''))].sort();
    return `sha1:${sha1(['tool', c.kind, c.id, routes.join(',')].join('##'))}`;
  }
  const locs = (f.locations || []).map(locationKey).sort();
  const snippet = normalizeSnippet((f.locations || [])[0]?.snippet || '');
  const basis = [c.kind, c.id, f.problem_type || '', locs.join('||'), locs.some((l) => l.split('|')[2]) ? '' : normalizeSnippet(f.title || ''), snippet];
  return `sha1:${sha1(basis.join('##'))}`;
}

// --- severity ------------------------------------------------------------------------------

/** Suggested severity from a rater's own factors (METHODS §5): monotone in every factor. */
export function suggestedSeverity({ frequency, impact, persistence }) {
  const f = Number(frequency);
  const i = Number(impact);
  const p = Number(persistence);
  if (![f, i, p].every(Number.isInteger)) throw new Error('factors must be integers');
  if (f < 0 || f > 3 || i < 0 || i > 3 || p < 0 || p > 2) throw new Error('factor out of range');
  let s = i + Math.floor((f + p) / 2);
  if (s > 4) s = 4;
  if (i === 0) s = Math.min(s, 1);
  if (i === 3) s = Math.max(s, 3);
  return s;
}

export const PRIORITY_ORDER = ['P0', 'P1', 'P2', 'P3', 'none'];

export function priorityFromMean(mean) {
  if (!Number.isFinite(mean)) return 'none';
  if (mean >= 3.5) return 'P0';
  if (mean >= 2.5) return 'P1';
  if (mean >= 1.5) return 'P2';
  if (mean >= 0.5) return 'P3';
  return 'none';
}

const prioRank = (p) => {
  const i = PRIORITY_ORDER.indexOf(p);
  return i < 0 ? PRIORITY_ORDER.length : i;
};

export function maxPriority(a, b) {
  return prioRank(a) <= prioRank(b) ? a : b;
}

/**
 * Apply the gating policy (QUALITY-BAR §6): peripheral journeys capped at P2, then the G1/G2 floor at P1, which
 * wins over the cap (a functional or WCAG failure is never deprioritised by where it occurs).
 */
export function applyPriorityPolicy(f) {
  let p = f.priority || priorityFromMean(f.severity?.mean);
  if (f.criticality === 'peripheral' && prioRank(p) < prioRank('P2')) p = 'P2';
  if ((f.gate === 'G1' || f.gate === 'G2') && prioRank(p) > prioRank('P1')) p = 'P1';
  f.priority = p;
  return f;
}

/**
 * Aggregate blind ratings into the finding's severity block.
 * @param {{rater:string,value:number,frequency?:number,impact?:number,persistence?:number,validity?:string,note?:string}[]} ratings
 */
export function aggregateRatings(ratings) {
  const vals = ratings.map((r) => Number(r.value)).filter((v) => Number.isFinite(v));
  if (!vals.length) return null;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const spread = Math.max(...vals) - Math.min(...vals);
  const notProblem = ratings.filter((r) => r.validity === 'not_a_problem' || r.validity === 'trade_off').length;
  const avgFactor = (k) => {
    const xs = ratings.map((r) => r[k]).filter((v) => Number.isFinite(v));
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  return {
    source: 'raters',
    ratings,
    mean: Math.round(mean * 100) / 100,
    spread,
    divergent: spread >= 2,
    provisional: vals.length < 3,
    factors: { frequency: avgFactor('frequency'), impact: avgFactor('impact'), persistence: avgFactor('persistence') },
    validity_votes: { not_a_problem_or_trade_off: notProblem, total: ratings.length },
  };
}

// --- fix queue ----------------------------------------------------------------------------

/** Dependency layer for queue ordering (FRAMEWORK §10 step 2). Lower runs first. */
export function layerOf(f) {
  const id = primaryCriterion(f).id || '';
  if (/^(COL-01|LAY-01)$/.test(id)) return 0; // token conformance
  if (/^(LAY|SHP|FUN-05|FUN-06|A11Y-07|A11Y-08|A11Y-09)/.test(id)) return 1; // layout and spacing
  if (/^(TYP|I18N)/.test(id)) return 2; // typography
  if (/^(COL|A11Y-11|A11Y-12|A11Y-19)/.test(id)) return 3; // colour
  if (/^MOT/.test(id)) return 5; // motion
  if (/^(CPY|SLP-1[2-5])/.test(id)) return 6; // copy and content
  return 4; // components, states, behaviour, heuristics
}

export const LAYER_NAMES = ['tokens', 'layout', 'typography', 'colour', 'components', 'motion', 'copy'];

function frequencyOf(f) {
  const fr = f.severity?.factors?.frequency;
  if (Number.isFinite(fr)) return fr;
  return f.detection?.k || 0;
}

/**
 * Build the fix queue: active findings sorted by priority → layer → ease → frequency. Blocked findings come first, as
 * waiting on the person named with the question, and are never items to fix now (ADR-036).
 */
export function buildQueue(findings) {
  const waiting = findings
    .filter((f) => f.status === 'blocked')
    .sort((a, b) => prioRank(a.priority) - prioRank(b.priority) || String(a.id).localeCompare(String(b.id)))
    .map((f) => ({
      id: f.id,
      title: f.title,
      priority: f.priority || null,
      layer: LAYER_NAMES[layerOf(f)],
      ease_of_fix: f.ease_of_fix ?? null,
      criterion: primaryCriterion(f).id,
      divergent: !!f.severity?.divergent,
      fix_now: false,
      waiting: { on: f.blocked?.on || null, question: f.blocked?.question || null, since: f.blocked?.since || null },
    }));
  const items = findings.filter((f) => ['open', 'reopened', 'confirmed'].includes(f.status) && f.priority && f.priority !== 'none');
  items.sort(
    (a, b) =>
      prioRank(a.priority) - prioRank(b.priority) ||
      layerOf(a) - layerOf(b) ||
      (a.ease_of_fix ?? 2.5) - (b.ease_of_fix ?? 2.5) ||
      frequencyOf(b) - frequencyOf(a) ||
      String(a.id).localeCompare(String(b.id)),
  );
  return [...waiting, ...items.map((f) => ({
    id: f.id,
    title: f.title,
    priority: f.priority,
    layer: LAYER_NAMES[layerOf(f)],
    ease_of_fix: f.ease_of_fix ?? null,
    criterion: primaryCriterion(f).id,
    divergent: !!f.severity?.divergent,
    fix_now: !f.severity?.divergent && (f.priority === 'P0' || f.priority === 'P1' || (f.priority === 'P2' && f.ease_of_fix === 1)),
  }))];
}
