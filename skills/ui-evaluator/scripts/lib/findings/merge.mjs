// Consolidation (METHODS §5 step 1): deterministic-key merge, proposals for likely duplicates,
// detection counts, and stable F-IDs from the project register.
import path from 'node:path';
import { readJson, readJsonl, listDir, exists } from '../util/fs.mjs';
import { normalizeSelector, words } from '../util/text.mjs';
import { isoNow } from '../util/time.mjs';
import { fingerprint, legacyFingerprint, primaryCriterion, locationKey, applyPriorityPolicy } from './core.mjs';

const JUDGED_DIRS = ['evaluators', 'cw', 'panel'];

/** Read every judged evaluator output in a run. Returns [{file, role, agent, model, items}] */
export function readJudgedOutputs(runDir) {
  const outs = [];
  for (const sub of JUDGED_DIRS) {
    const dir = path.join(runDir, sub);
    for (const name of listDir(dir).filter((n) => n.endsWith('.json'))) {
      const file = path.join(dir, name);
      const doc = readJson(file);
      if (name.endsWith('verdict.json')) continue;
      const items = Array.isArray(doc.candidates) ? doc.candidates : Array.isArray(doc.findings) ? doc.findings : [];
      if (!items.length && !doc.role && !doc.agent) continue;
      outs.push({
        file,
        role: doc.role || (sub === 'panel' ? 'design-critic' : sub === 'cw' ? 'walkthrough-evaluator' : 'evaluator'),
        agent: doc.agent || path.basename(name, '.json'),
        model: doc.model || null,
        isolation: doc.isolation || null,
        items,
        doc,
      });
    }
  }
  return outs;
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

/**
 * One instance per element, or per source position for hits without a selector (lint), at each width and theme.
 * Source lines distinguish instances inside a run; they are never part of a finding's identity (FRAMEWORK §4.3).
 */
function instanceKey(l) {
  const source = !l.selector && l.source && l.source.file ? `${l.source.file}:${l.source.line || ''}:${l.source.col || ''}` : '';
  return [locationKey(l), source, l.viewport ? `${l.viewport.width}` : '', l.theme || ''].join('#');
}

/**
 * Factor notes from several evaluators, combined per factor for the blind raters. Evaluator outputs hold an object
 * {frequency, impact, persistence}; older records hold a string, kept under `_notes`.
 */
export function mergeFactorNotes(a, b) {
  if (!a) return b;
  if (!b) return a;
  const asObject = (v) => (typeof v === 'string' ? { _notes: v } : Array.isArray(v) ? { _notes: v.filter(Boolean).join(' / ') } : { ...v });
  const out = asObject(a);
  for (const [k, v] of Object.entries(asObject(b))) {
    if (!v) continue;
    out[k] = out[k] && out[k] !== v ? `${out[k]} / ${v}` : v;
  }
  return out;
}

/** A design critic's harm counts when it says how users are harmed, and quotes the line for a broken requirement (ADR-040). */
export function namesHarm(h) {
  if (!h || typeof h !== 'object' || !['task', 'misread', 'trust', 'requirement'].includes(h.kind)) return false;
  if (String(h.statement || '').trim().length < 10) return false;
  return h.kind !== 'requirement' || String(h.requirement || '').trim().length >= 5;
}

// What each merged report said, so nothing is lost when two inspectors report different problems on one element under
// one criterion: the verifier sees every text and returns split_required when they differ (review 2026-10-24, H4).
const said = (f) => ({ agent: (f.found_by || [])[0]?.agent || null, title: f.title || '', description: f.description || '' });
const sameText = (a, b) => normalizeText(a.title) === normalizeText(b.title) && normalizeText(a.description) === normalizeText(b.description);
const normalizeText = (t) => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();

function mergeInto(target, src) {
  const texts = target.merged_texts || [said(target)];
  if (!texts.some((t) => sameText(t, said(src)))) target.merged_texts = [...texts, said(src)];
  const crit = [...(target.criteria || [])];
  for (const c of src.criteria || []) {
    if (!crit.some((x) => x.kind === c.kind && x.id === c.id)) crit.push({ ...c, primary: false });
  }
  target.criteria = crit;
  target.locations = uniqBy([...(target.locations || []), ...(src.locations || [])], instanceKey);
  target.evidence = uniqBy([...(target.evidence || []), ...(src.evidence || [])], (e) => `${e.type}|${e.ref || ''}|${e.detail || ''}`);
  target.found_by = uniqBy([...(target.found_by || []), ...(src.found_by || [])], (b) => `${b.role}|${b.agent || ''}|${b.method}|${b.check || ''}`);
  if (src.factor_notes) target.factor_notes = mergeFactorNotes(target.factor_notes, src.factor_notes);
  // A design note joined by anything that is not a note becomes a finding (ADR-040); a harm named by either is kept.
  if (target.design_note && !src.design_note) delete target.design_note;
  if (!target.harm && src.harm) target.harm = src.harm;
  if (!target.recommendation && src.recommendation) target.recommendation = src.recommendation;
  target.merged_from = [...(target.merged_from || []), ...(src.merged_from || [src._tmp])].filter(Boolean);
  if ((target.locations || []).length > 1 && target.problem_type === 'single_location') target.problem_type = 'multiple_locations';
  return target;
}

function judgedKey(f) {
  const c = primaryCriterion(f);
  const loc = (f.locations || [])[0] || {};
  const sel = normalizeSelector(loc.selector || '');
  if (!sel) return null; // structural and missing-element findings are never auto-merged
  return [loc.route || '', loc.state || 'default', sel, c.id].join('|');
}

/** Distinct evaluator agents behind a finding; tool and feedback sources are not inspectors and never count toward k of N. */
function evaluatorAgents(f) {
  return new Set((f.found_by || []).filter((b) => b.role !== 'tool' && b.role !== 'feedback').map((b) => b.agent));
}

function titleTokens(f) {
  return new Set(words(`${f.title || ''} ${f.description || ''}`.toLowerCase()).filter((w) => w.length > 3));
}

/** The page a route names, without its query or hash ("/index.html" is "/"): states reached by URL are one page. */
function pagePath(route) {
  if (!route) return '';
  const p = String(route).replace(/[?#].*$/, '') || '/';
  return p === '/index.html' ? '/' : p;
}

function pagesOf(f) {
  return new Set((f.locations || []).map((l) => pagePath(l.route)));
}

function jaccard(a, b) {
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 0;
}

/**
 * Merge a run's tool findings and judged candidates.
 * @param {string} runDir
 * @param {{ rules?: Record<string, any>, register?: {findings:any[], next_id:number}, judgedCount?: number }} opts
 */
export function mergeRun(runDir, { rules = {}, register, skip = new Set(), previous = [] } = {}) {
  const toolPath = path.join(runDir, 'tool-findings.jsonl');
  const toolHits = exists(toolPath) ? readJsonl(toolPath) : [];
  const outputs = readJudgedOutputs(runDir).filter((o) => !skip.has(o.file));

  // 1. Deterministic findings: one per rule × route (LOOP-023), locations aggregated.
  const toolGroups = new Map();
  for (const hit of toolHits) {
    const c = primaryCriterion(hit);
    const route = (hit.locations || [])[0]?.route || '';
    const key = `${c.id}|${route}`;
    if (!toolGroups.has(key)) {
      const ruleDef = rules[c.id] || {};
      // A hit of an advisory rule (one that gates nothing) is an observation, not a finding: it stays a candidate
      // flagged `advisory`, is listed in the report and is never counted or verified unless an inspector reports
      // the same problem (ADR-038).
      const advisory = hit.advisory === true || !(hit.gate || ruleDef.gate);
      toolGroups.set(key, {
        ...hit,
        problem_type: hit.problem_type || 'single_location',
        evidence_level: 'E1',
        status: advisory ? 'candidate' : 'confirmed',
        ...(advisory ? { advisory: true } : {}),
        gate: hit.gate || ruleDef.gate || null,
        severity: {
          source: 'rule',
          value: hit.severity?.value ?? ruleDef.default_severity ?? 2,
          mean: hit.severity?.value ?? ruleDef.default_severity ?? 2,
          provisional: false,
        },
        _tmp: `T-${toolGroups.size + 1}`,
      });
    } else {
      mergeInto(toolGroups.get(key), { ...hit, _tmp: undefined });
    }
  }

  // 2. Judged candidates.
  const judged = [];
  let n = 0;
  for (const out of outputs) {
    for (const item of out.items) {
      n += 1;
      const f = {
        ...item,
        status: 'candidate',
        evidence_level: item.evidence_level || 'E0',
        problem_type: item.problem_type || 'single_location',
        _tmp: `C-${out.agent}-${n}`,
      };
      // Candidates from user feedback (ingest) are verified like any judged candidate but are not an inspector's output.
      const feedback = out.role === 'feedback';
      f.found_by = (f.found_by && f.found_by.length && !feedback ? f.found_by : [{ role: out.role, agent: out.agent, method: out.role === 'design-critic' ? 'critic' : feedback ? 'feedback' : 'HE' }]).map(
        (b) => ({ ...b, agent: b.agent || out.agent, model: b.model || out.model || undefined }),
      );
      delete f.severity; // severity is never taken from the finder (EVAL C2)
      // `advisory` marks a deterministic observation against a rule that gates nothing (ADR-038). An inspector's
      // candidate is a finding to verify and rate whatever the inspector called it, so its own flag is dropped.
      delete f.advisory;
      // A design critic's remark that names no harm to the product's users, and no PRODUCT.md or DESIGN.md line it
      // breaks, is a design note: listed in the report, never verified, rated or counted (ADR-040).
      delete f.design_note;
      if (out.role === 'design-critic' && !namesHarm(f.harm)) f.design_note = true;
      judged.push(f);
    }
  }

  // 2b. Candidates a deterministic check emitted for judgement instead of failing a rule (e.g. a primary submit
  //     disabled at rest, ADR-032). They are verified and rated like any judged candidate, but they are not an
  //     evaluator's output: they never count toward detection k of N or toward EVD-07 independence.
  let toolCandidates = 0;
  const checksDoc = readJson(path.join(runDir, 'checks.json'), { checks: {} }) || { checks: {} };
  for (const [name, c] of Object.entries(checksDoc.checks || {})) {
    if (!c || !c.candidates_file) continue;
    const doc = readJson(path.join(runDir, c.candidates_file), null);
    for (const item of doc?.candidates || []) {
      n += 1;
      toolCandidates += 1;
      const f = {
        ...item,
        status: 'candidate',
        evidence_level: item.evidence_level || 'E1',
        problem_type: item.problem_type || 'single_location',
        _tmp: `C-tool-${name}-${n}`,
      };
      f.found_by = [{ role: 'tool', method: 'tool-candidate', check: name, agent: `tool:${name}` }];
      delete f.severity;
      judged.push(f);
    }
  }

  // 3. Auto-merge judged candidates on the deterministic key.
  const byKey = new Map();
  const unkeyed = [];
  for (const f of judged) {
    const k = judgedKey(f);
    if (!k) {
      unkeyed.push(f);
      continue;
    }
    if (!byKey.has(k)) byKey.set(k, { ...f, merged_from: [f._tmp] });
    else mergeInto(byKey.get(k), f);
  }
  const merged = [...byKey.values(), ...unkeyed.map((f) => ({ ...f, merged_from: [f._tmp] }))];

  // 4. Detection counts (k of N independent judged outputs; feedback outputs are not inspectors).
  // N counts inspectors, not files: a walkthrough's per-journey records and the code reviewer's locate pass are the same
  // agents again (review of 2026-10-24: they took n from 4 to 7).
  const N = new Set(outputs.filter((o) => o.role !== 'feedback' && o.doc?.phase !== 'locate' && !/-locate\.json$/.test(o.file)).map((o) => o.agent)).size;
  for (const f of merged) {
    f.detection = { k: evaluatorAgents(f).size, n: N };
  }

  // 6. Stable IDs from the register (fingerprint match → reuse; else new F-NNNN).
  const all = [...toolGroups.values(), ...merged];
  const reg = register || { next_id: 1, findings: [] };
  // A re-merge of the same run keeps the IDs it gave before; the register's IDs win for known findings.
  // Earlier fingerprints count too: a register written before the identity change of 2026-10-24 (legacy) or one that
  // recorded a finding's previous fingerprints still finds its IDs.
  const byFp = new Map([...(previous || []).map((f) => [f.fingerprint, f.id]), ...(reg.findings || []).flatMap((f) => [f.fingerprint, ...(f.previous_fingerprints || [])].map((fp) => [fp, f.id]))]);
  let next = Math.max(reg.next_id || 1, ...(previous || []).map((f) => Number(String(f.id).replace(/\D/g, '')) + 1 || 1));
  const used = new Set();
  for (const f of all) {
    f.fingerprint = fingerprint(f);
    const known = byFp.get(f.fingerprint) || byFp.get(legacyFingerprint(f));
    if (known && !used.has(known)) f.id = known;
    else {
      f.id = `F-${String(next).padStart(4, '0')}`;
      next += 1;
      if (!known) byFp.set(f.fingerprint, f.id);
    }
    used.add(f.id);
    f.created_at = f.created_at || isoNow();
    f.updated_at = isoNow();
    if (f.status === 'confirmed' && f.severity?.source === 'rule') {
      f.priority = undefined;
      applyPriorityPolicy(f);
    }
  }
  // 7. Proposals: the same element with different criteria, similar wording on the same page, or a shared criterion
  //    with related wording on the same page. Pages ignore query strings, so evaluators who reached a state by
  //    different URLs, or wrote no selector, still meet. Tool–judged pairs are proposed too (they show agreement
  //    between detectors and inspectors). The lead accepts or rejects each one.
  const proposals = [];
  for (let i = 0; i < all.length; i += 1) {
    for (let j = i + 1; j < all.length; j += 1) {
      const a = all[i];
      const b = all[j];
      if (a.severity?.source === 'rule' && b.severity?.source === 'rule') continue; // two tool findings are never one
      const pa = pagesOf(a);
      const pb = pagesOf(b);
      if (!(pa.size === 0 && pb.size === 0) && ![...pb].some((x) => pa.has(x))) continue;
      const la = (a.locations || [])[0] || {};
      const lb = (b.locations || [])[0] || {};
      const selsA = new Set((a.locations || []).map((l) => normalizeSelector(l.selector || '')).filter(Boolean));
      const selsB = (b.locations || []).map((l) => normalizeSelector(l.selector || '')).filter(Boolean);
      const sameEl = (la.route || '') === (lb.route || '') && selsB.some((x) => selsA.has(x));
      const sim = jaccard(titleTokens(a), titleTokens(b));
      const critA = new Set((a.criteria || []).map((c) => c.id));
      const shared = (b.criteria || []).some((c) => critA.has(c.id));
      if (sameEl || sim >= 0.5 || (shared && sim >= 0.2)) {
        proposals.push({
          id: `P${proposals.length + 1}`,
          members: [a.id, b.id],
          reason: sameEl ? 'same element, different criteria or sources' : sim >= 0.5 ? `similar wording (Jaccard ${sim.toFixed(2)})` : `same page, a shared criterion and related wording (Jaccard ${sim.toFixed(2)})`,
          kind: a.severity?.source === 'rule' || b.severity?.source === 'rule' ? 'tool+judged' : 'judged',
        });
      }
    }
  }


  return {
    findings: all,
    proposals,
    next_id: next,
    inputs: { tool_hits: toolHits.length, judged_outputs: N, judged_candidates: judged.length - toolCandidates, tool_candidates: toolCandidates, feedback_outputs: outputs.length - N, merged_judged: merged.length, tool_findings: toolGroups.size },
  };
}

/**
 * Apply accepted proposals: merge members into the first one. An entry may name part of a proposal, `S14:F-0008+F-0011`,
 * when the proposal groups more than one problem: those members (two or more) are merged and the others stay apart.
 * Returns the removed IDs and the entries that could not be applied, with the reason.
 */
export function acceptProposals(doc, ids) {
  const want = new Map();
  for (const raw of ids) {
    const [id, part] = String(raw).split(':');
    want.set(id.trim(), part ? part.split('+').map((m) => m.trim()).filter(Boolean) : null);
  }
  const byId = new Map(doc.findings.map((f) => [f.id, f]));
  const removed = new Set();
  const refused = [];
  const known = new Set((doc.proposals || []).map((p) => p.id));
  for (const id of want.keys()) if (!known.has(id)) refused.push({ id, reason: 'no such proposal' });
  for (const p of doc.proposals || []) {
    if (!want.has(p.id)) continue;
    if (p.applied) {
      refused.push({ id: p.id, reason: 'already applied' });
      continue;
    }
    const part = want.get(p.id);
    if (part) {
      const strangers = part.filter((m) => !p.members.includes(m));
      if (strangers.length || part.length < 2) {
        refused.push({ id: p.id, reason: strangers.length ? `${strangers.join(', ')} not in ${p.id} (${p.members.join(', ')})` : 'name two or more members' });
        continue;
      }
    }
    const chosen = part ? p.members.filter((m) => part.includes(m)) : p.members;
    const [first, ...rest] = chosen.map((m) => byId.get(m)).filter(Boolean);
    if (!first) continue;
    for (const r of rest) {
      if (removed.has(r.id) || r === first) continue;
      mergeInto(first, r);
      removed.add(r.id);
    }
    first.detection = { ...(first.detection || {}), k: evaluatorAgents(first).size };
    // An inspector who reports what an advisory check measured turns the observation into a finding (ADR-038).
    if (first.advisory && [first, ...rest].some((m) => !m.advisory)) delete first.advisory;
    p.applied = true;
    if (part) p.applied_members = chosen;
  }
  doc.findings = doc.findings.filter((f) => !removed.has(f.id));
  return { removed: [...removed], refused };
}

/**
 * Same-cause proposals (ADR-039): findings the code reviewer located at one source line (the same file, within three
 * lines) describe one cause from the angles of different checks and roles. They are proposed after `--apply-locate`
 * and the lead accepts the true ones before rating, so one cause is rated and reported once. Advisory observations,
 * design notes and closed findings are left out; a proposal that already exists (same members) is not repeated.
 */
export function sameCauseProposals(findings, existing = [], { minified = () => false } = {}) {
  const src = (f) => (f.locations || []).map((l) => l.source).find((s) => s && s.file && Number.isFinite(Number(s.line)));
  // In a minified file one line holds the whole program, so a line number says nothing about where a cause is: there
  // a location groups only by its column (within 120 characters of the last one), and one without a column not at all.
  // Columns are 1-based; a 0 is a reviewer's placeholder for "not known".
  const col = (s) => (Number.isFinite(Number(s.col)) && Number(s.col) > 0 ? Number(s.col) : null);
  const items = findings
    .filter((f) => !['rejected', 'dismissed', 'split', 'stale'].includes(f.status) && !f.advisory && !f.design_note && src(f))
    .map((f) => { const s = src(f); return { f, s, flat: !!minified(s.file, Number(s.line)) }; })
    .filter((it) => !it.flat || col(it.s) !== null)
    .sort((a, b) => a.s.file.localeCompare(b.s.file) || Number(a.s.line) - Number(b.s.line) || (col(a.s) ?? 0) - (col(b.s) ?? 0));
  const groups = [];
  for (const it of items) {
    const g = groups.at(-1);
    const near = g && g.file === it.s.file && (it.flat ? g.flat && Number(it.s.line) === g.last && col(it.s) - g.lastCol <= 120 : !g.flat && Number(it.s.line) - g.last <= 3);
    if (near) {
      g.members.push(it.f);
      g.last = Number(it.s.line);
      g.lastCol = col(it.s);
    } else groups.push({ file: it.s.file, line: Number(it.s.line), last: Number(it.s.line), col: col(it.s), lastCol: col(it.s), flat: it.flat, members: [it.f] });
  }
  const taken = new Set(existing.map((p) => [...p.members].sort().join('|')));
  let n = existing.filter((p) => /^S\d+$/.test(String(p.id))).length;
  const out = [];
  for (const g of groups) {
    if (g.members.length < 2) continue;
    const members = g.members.map((f) => f.id);
    if (taken.has([...members].sort().join('|'))) continue;
    n += 1;
    const at = g.flat ? `${g.file}:${g.line}, columns ${g.col}–${g.lastCol}` : `${g.file}:${g.line}${g.last !== g.line ? `–${g.last}` : ''}`;
    out.push({ id: `S${n}`, members, reason: `same cause: the code reviewer located them at ${at}`, kind: 'same-cause' });
  }
  return out;
}

// A check that has to wait for time to pass: a hold, a session or a sign-in that expires, lapses or times out, a
// message that comes later. Words that only look like it are left out: "timeout" in one word and the verb "holds"
// (round 5: the code's timer callbacks, a page that holds a form), and, from the review of 2026-10-24, holding a key
// or a press, a field that looks idle, an expiry-date field, a character countdown, a placeholder "held" in a label, "lapses"
// as a noun and "after a day is tapped".
const COUNT = '(?:a few|a couple of|several|\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|sixty|ninety)';
// A wait worth its own verifier is minutes long; seconds count from ten up.
const DURATION = String.raw`(?:${COUNT}\s*-?\s*(?:minutes?|mins?|hours?|hrs?|days?)|(?:\d{2,}|thirty|sixty|ninety)\s*-?\s*(?:seconds?|secs?))`;
const TIME_BOUND = new RegExp([
  String.raw`(?<!press and |press-and-)\bhold\b(?!\s+(?:shift|ctrl|control|alt|option|cmd|command|down|the|a|and)\b)`,
  String.raw`\b(?:slot|seat|booking|reservation|basket|cart|ticket|order|room|table|place)s?\s+(?:is|are|was|were|stays?)?\s*held\b`,
  String.raw`\bon hold\b`,
  String.raw`\bexpir(?:e|es|ed|ing|ation|y)\b(?!\s+(?:date|month|year|field)\b)`,
  String.raw`\blapsed\b|\b(?:hold|slot|session|booking|reservation|time)\s+lapses\b`, String.raw`\btimes? out\b`, String.raw`\btimed out\b`, String.raw`\btime[- ]limit(?:ed)?\b`,
  String.raw`\b(?:inactivity|no activity)\b`, String.raw`\bidle (?:time|timeout|for|session)\b`,
  String.raw`\bcountdown\b(?!\s+of\s+(?:remaining\s+)?characters)`,
  String.raw`\b(?:session|sign[- ]?in|login|log-in)\s+(?:ends|expires|is lost|lapses|times out)\b`,
  String.raw`\b(?:only )?valid for\s+${DURATION}`,
  String.raw`\b(?:after|for|within|once|in|wait(?:s|ing)?(?: for)?)\s+(?:${DURATION}|half an hour|an hour)\b`,
  String.raw`\b${DURATION}\s+(?:later|pass|of inactivity)\b`,
  String.raw`\b(?:a day later|the next day|overnight|at midnight)\b`,
].join('|'), 'i');
// A state named for a wait, matched on whole words of its name ("placeholder-shown" and "threshold" are not a hold).
const TIME_BOUND_STATE_WORDS = new Set(['expired', 'expiry', 'expires', 'timeout', 'timed', 'idle', 'lapsed', 'hold', 'held']);
const timeBoundState = (state) => String(state || '').toLowerCase().split(/[^a-z]+/).some((w) => TIME_BOUND_STATE_WORDS.has(w));

/** A candidate whose check may have to wait for time to pass, by its wording or the state it was seen in. */
export function timeBound(c) {
  if (c.time_bound === true) return true;
  return TIME_BOUND.test([c.title, c.description, c.harm].filter(Boolean).join(' ')) || (c.locations || []).some((l) => timeBoundState(l.state));
}

/**
 * Split verifier candidates into at most n packets of near-equal size. A page's candidates stay together (query
 * strings and /index.html aside, as in the duplicate proposals), so each verifier loads a page once; only a page with
 * more candidates than one packet holds is cut into packet-sized pieces.
 * Pieces are placed largest first on the packet that holds the fewest, and the order is deterministic.
 * Time-bound candidates come first. With two or more packets they get the first one to themselves, whatever their
 * page, so one verifier waits once: in round 5 they were spread over three verifiers, each of which waited out the
 * same five-minute hold, late in its work.
 */
export function partitionCandidates(cands, n) {
  const waiting = cands.filter(timeBound);
  const rest = cands.filter((c) => !timeBound(c));
  if (Number(n) <= 1 || !cands.length) return [[...waiting, ...rest]];
  if (waiting.length && rest.length) return [waiting, ...partitionCandidates(rest, Number(n) - 1)];
  const parts = Math.max(1, Math.min(Number(n) || 1, cands.length || 1));
  const size = Math.ceil(cands.length / parts);
  const byRoute = new Map();
  for (const c of [...cands].sort((a, b) => String(a.candidate_id || a.id).localeCompare(String(b.candidate_id || b.id)))) {
    const route = pagePath((c.locations || [])[0]?.route);
    if (!byRoute.has(route)) byRoute.set(route, []);
    byRoute.get(route).push(c);
  }
  const pieces = [];
  for (const group of byRoute.values()) for (let i = 0; i < group.length; i += size) pieces.push(group.slice(i, i + size));
  pieces.sort((a, b) => b.length - a.length);
  const out = Array.from({ length: parts }, () => []);
  for (const piece of pieces) out.reduce((least, p) => (p.length < least.length ? p : least), out[0]).push(...piece);
  return out.filter((g) => g.length);
}
