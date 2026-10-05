// Tool hits in the finding shape (ARCHITECTURE §8.3, §8.6): method "tool", evidence level E1, severity from
// rules.json (or the axe impact mapping), gate from rules.json, the primary criterion plus WCAG success criteria.
import { loadRules, loadTells } from '../gates/rules.mjs';
import { sha1 } from '../util/hash.mjs';
import { truncate } from '../util/text.mjs';

export const AXE_IMPACT_SEVERITY = { critical: 4, serious: 3, moderate: 2, minor: 1 };

let rulesCache = null;
export function rules() {
  if (!rulesCache) rulesCache = loadRules();
  return rulesCache;
}

/** WCAG success criteria declared for a rule in rules.json ("2.1.1, 2.4.3" → ['2.1.1','2.4.3']). */
export function ruleWcag(id) {
  const w = rules()[id]?.wcag;
  if (!w || typeof w !== 'string') return [];
  return (w.match(/\b\d\.\d{1,2}\.\d{1,2}\b/g) || []);
}

/** axe tag "wcag143" → "1.4.3"; "wcag2411" → "2.4.11". */
export function axeTagToSc(tag) {
  const m = /^wcag(\d)(\d)(\d{1,2})$/.exec(tag);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : null;
}

export function defaultSeverity(id) {
  const v = rules()[id]?.default_severity;
  return Number.isFinite(v) ? v : 1;
}

/**
 * Build one hit.
 * @param {{check:string, engine:{name:string,version:string}, rule:string, wcag?:string[], title:string,
 *   description:string, location?:object, locations?:object[], evidence?:object[], severity?:number,
 *   problem_type?:string, recommendation?:string, tags?:string[], extra?:object}} o
 */
export function makeHit(o) {
  const rule = rules()[o.rule] || {};
  const wcag = [...new Set([...(o.wcag || ruleWcag(o.rule))])];
  const locations = (o.locations || (o.location ? [o.location] : [])).map(cleanLocation);
  const first = locations[0] || {};
  const hit = {
    title: truncate(o.title, 200),
    description: o.description.length >= 10 ? o.description : `${o.description} (detected by ${o.check})`,
    problem_type: o.problem_type || (locations.length > 1 ? 'multiple_locations' : 'single_location'),
    criteria: [{ kind: 'rule', id: o.rule, primary: true }, ...wcag.map((id) => ({ kind: 'wcag', id }))],
    scope: {
      route: first.route,
      state: first.state,
      viewport: first.viewport,
      theme: first.theme,
    },
    locations,
    evidence: (o.evidence || []).map((e) => ({ type: e.type || 'measurement', ...e })),
    found_by: [{ role: 'tool', method: 'tool', check: o.check, engine: o.engine }],
    evidence_level: 'E1',
    severity: { source: 'rule', value: Number.isFinite(o.severity) ? o.severity : defaultSeverity(o.rule) },
    gate: rule.gate || null,
    status: 'confirmed',
    tags: [...new Set([o.check, ...(o.tags || [])])],
  };
  // Gate criteria come from QUALITY-BAR (rules.json); catalogue tells count by their class (ADR-031). Any other ID is
  // an advisory rule from a knowledge file (e.g. LAY-08, COL-17) and never gates; experimental tells are "possible".
  const known = rules()[o.rule];
  const tellClass = /^SLP-\d+$/.test(o.rule) ? loadTells()[o.rule]?.class : null;
  if (rule.level === 'advisory' || (!known && tellClass !== 'hard' && tellClass !== 'soft')) hit.advisory = true;
  if (!known && tellClass === 'experimental') hit.possible = true;
  if (!known && (tellClass === 'hard' || tellClass === 'soft')) hit.gate = 'G4';
  if (o.recommendation) hit.recommendation = o.recommendation;
  if (o.extra) Object.assign(hit, o.extra);
  return hit;
}

function cleanLocation(l) {
  const out = {};
  for (const [k, v] of Object.entries(l || {})) {
    if (v === undefined || v === null || v === '') continue;
    if (k === 'bbox') {
      if (Array.isArray(v) && v.length === 4 && v.every(Number.isFinite)) out.bbox = v.map((x) => Math.round(x));
      continue;
    }
    if (k === 'snippet') {
      out.snippet = truncate(v, 300);
      continue;
    }
    out[k] = v;
  }
  return out;
}

/** Location object for a page state. */
export function loc(ps, { selector, bbox, snippet, source, extra } = {}) {
  return {
    route: ps.route,
    state: ps.state,
    viewport: { width: ps.width, height: ps.height },
    theme: ps.theme,
    ...(ps.preference && ps.preference !== 'default' ? { preference: ps.preference } : {}),
    selector,
    bbox,
    snippet,
    source,
    ...(extra || {}),
  };
}

/**
 * Merge hits that describe the same defect at several widths/themes: same rule, route, state, selector and key.
 * The first hit keeps its location; the others are recorded as `also_at` in its first evidence entry.
 */
export function dedupeHits(hits, keyFn = defaultKey) {
  const byKey = new Map();
  const out = [];
  for (const h of hits) {
    const k = keyFn(h);
    if (!k) {
      out.push(h);
      continue;
    }
    const prev = byKey.get(k);
    if (!prev) {
      byKey.set(k, h);
      out.push(h);
      continue;
    }
    const l = h.locations[0] || {};
    const tag = `${l.viewport?.width || '?'}${l.theme ? `-${l.theme}` : ''}`;
    prev._also = prev._also || new Set();
    prev._also.add(tag);
  }
  for (const h of out) {
    if (h._also) {
      const l = h.locations[0] || {};
      const own = `${l.viewport?.width || '?'}${l.theme ? `-${l.theme}` : ''}`;
      const others = [...h._also].filter((t) => t !== own);
      if (others.length) {
        if (!h.evidence.length) h.evidence.push({ type: 'measurement', detail: '' });
        h.evidence[0].also_at = others;
        h.evidence[0].detail = `${h.evidence[0].detail || ''}${h.evidence[0].detail ? '; ' : ''}also at ${others.join(', ')}`.slice(0, 500);
      }
      delete h._also;
    }
  }
  return out;
}

function defaultKey(h) {
  const l = h.locations[0];
  if (!l || !l.selector) return null;
  const c = h.criteria[0].id;
  const ev = h.evidence[0] || {};
  const evKey = typeof ev.value === 'string' ? ev.value : '';
  return sha1([c, l.route, l.state, l.selector, h.title, l.snippet || '', evKey].join('|'));
}
