// Read feedback files (CSV, JSON, JSONL, text) and normalise records to the feedback schema.
import path from 'node:path';
import { readText } from '../util/fs.mjs';
import { parseCsv, toObjects, hasHeader } from '../util/csv.mjs';
import { severityPrior } from './scrub.mjs';

export const SOURCES = ['usability', 'survey', 'tickets', 'reviews', 'interviews', 'analytics', 'stakeholders', 'annotations', 'other'];

const DEFAULT_CHANNEL = {
  usability: 'usability session',
  survey: 'survey',
  tickets: 'support ticket',
  reviews: 'review',
  interviews: 'interview',
  analytics: 'analytics export',
  stakeholders: 'agree/disagree sheet',
  annotations: 'annotated screenshot',
  other: 'other',
};

/** Input column (lower-case, underscores) → schema field. The first present alias wins. */
const ALIASES = {
  quote: ['verbatim_quote', 'quote', 'verbatim', 'comment', 'message', 'body', 'review', 'review_text', 'feedback', 'answer', 'response', 'content', 'text', 'description'],
  text: ['observation', 'context', 'question', 'summary', 'title', 'subject'],
  participant: ['participant_code', 'participant', 'respondent', 'reporter', 'reviewer', 'author', 'user', 'customer', 'email', 'name', 'requester'],
  date: ['date', 'created', 'created_at', 'submitted', 'submitted_at', 'reviewed_at'],
  timestamp: ['timestamp', 'time', 'recording_time'],
  route: ['route', 'page', 'url', 'screen', 'path'],
  reporter_severity: ['reporter_severity', 'severity', 'priority', 'urgency', 'impact'],
  rating: ['rating', 'stars', 'star_rating', 'score'],
  reporter_scale: ['reporter_scale', 'scale', 'severity_scale'],
  tags: ['tags', 'labels', 'category', 'categories'],
  channel: ['channel', 'medium'],
  task: ['task_id', 'task'],
  step: ['step'],
  prompted: ['prompted'],
  outcome: ['outcome'],
  intervention: ['intervention'],
  classification: ['classification', 'class', 'type'],
  theme: ['theme'],
  links: ['linked_finding', 'linked_findings', 'finding_id', 'findings'],
  ui_version: ['ui_version', 'app_version', 'version', 'build'],
  source_ref: ['source_ref', 'ticket', 'ticket_id', 'review_id', 'response_id', 'session_id', 'id'],
  study: ['study_id', 'study'],
  verdict: ['verdict', 'agree'],
  role: ['role', 'reviewer_role'],
};

const CLASSES = new Map([
  ['problem', 'problem'], ['usability problem', 'problem'], ['issue', 'problem'],
  ['bug', 'bug'], ['defect', 'bug'], ['error', 'bug'],
  ['preference', 'preference'], ['opinion', 'preference'],
  ['feature request', 'feature_request'], ['feature_request', 'feature_request'], ['request', 'feature_request'], ['idea', 'feature_request'],
  ['praise', 'praise'], ['positive', 'praise'], ['compliment', 'praise'],
  ['question', 'question'],
]);

export function normClass(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return 'unclassified';
  return CLASSES.get(s) || 'unclassified';
}

function normOutcome(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return null;
  if (/^(success|succeeded|unassisted( success)?|completed|pass(ed)?)$/.test(s)) return 'success';
  if (/^(assisted|hint(ed)?|with help|helped)$/.test(s)) return 'assisted';
  if (/^(fail(ed|ure)?|wrong|incorrect)$/.test(s)) return 'failed';
  if (/^(abandon(ed)?|gave up|give up|quit)$/.test(s)) return 'abandoned';
  if (/^(not[ _-]?reached|skipped|not attempted|n\/a)$/.test(s)) return 'not_reached';
  return null;
}

const yesNo = (v) => {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return null;
  if (/^(yes|y|true|1|prompted)$/.test(s)) return true;
  if (/^(no|n|false|0|spontaneous|unprompted)$/.test(s)) return false;
  return null;
};

export function normVerdict(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return null;
  if (/^(agree|agreed|yes|y|✓|✔|同意|认同|是)$/.test(s)) return 'agree';
  if (/^(disagree|disagreed|no|n|✗|✘|不同意|反对|否)$/.test(s)) return 'disagree';
  if (/^(unsure|not sure|\?|maybe|don'?t know|不确定|不清楚)$/.test(s)) return 'unsure';
  return null;
}

/** A participant value that is already a code (P03, R-0112, S1-P4) is kept; anything else is an identity. */
export const isCode = (v) => /^[A-Za-z]{1,4}[-_]?\d{1,6}([-_][A-Za-z]{0,3}\d{1,6})?$/.test(String(v || '').trim());

export function normRoute(v) {
  const s = String(v || '').trim();
  if (!s) return null;
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      return u.pathname || '/';
    }
  } catch {
    // keep as written
  }
  return s.replace(/\?.*$/, '');
}

/** Read a file into raw records: [{ fields: {col: value}, ref: 'row 3' }], plus the columns seen. */
export function readRecords(file) {
  const ext = path.extname(file).toLowerCase();
  const text = readText(file);
  if (ext === '.csv' || ext === '.tsv') {
    const rows = parseCsv(text, ext === '.tsv' ? { delimiter: '\t' } : {});
    if (!rows.length) return { records: [], columns: [] };
    if (!hasHeader(rows)) throw new Error(`${path.basename(file)}: a header row is required so that columns can be mapped`);
    const { header, records } = toObjects(rows);
    return { records: records.map((r, i) => ({ fields: r, ref: `row ${i + 2}` })), columns: header };
  }
  if (ext === '.json' || ext === '.jsonl' || ext === '.ndjson') {
    let arr;
    if (ext === '.json') {
      const doc = JSON.parse(text);
      arr = Array.isArray(doc) ? doc : doc.items || doc.data || doc.results || doc.reviews || doc.tickets || doc.responses;
      if (!Array.isArray(arr)) throw new Error(`${path.basename(file)}: expected an array, or an object with items/data/results`);
    } else arr = text.split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
    const columns = new Set();
    const records = arr.map((o, i) => {
      const fields = {};
      for (const [k, v] of Object.entries(flatten(o))) {
        const key = k.trim().toLowerCase().replace(/[\s.]+/g, '_');
        fields[key] = v === null || v === undefined ? '' : Array.isArray(v) ? v.join(';') : String(v);
        columns.add(key);
      }
      return { fields, ref: `item ${i + 1}` };
    });
    return { records, columns: [...columns] };
  }
  // Plain text or Markdown: one record per paragraph. The analyst still splits statements (§3.3).
  const paras = text.replace(/\r\n/g, '\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).filter((p) => !/^#{1,6}\s/.test(p) || p.split('\n').length > 1);
  return { records: paras.map((p, i) => ({ fields: { quote: p.replace(/^#{1,6}\s.*\n/, '').trim() }, ref: `paragraph ${i + 1}` })), columns: ['quote'] };
}

function flatten(o, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(o || {})) {
    const key = prefix ? `${prefix}_${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

/** Decide, once per file, which input column feeds which field. */
export function mapColumns(columns, source) {
  const used = new Set();
  const map = {};
  const order = Object.keys(ALIASES);
  // For observation sheets the observation is behaviour (text) and verbatim_quote is the quote.
  for (const field of order) {
    for (const alias of ALIASES[field]) {
      if (columns.includes(alias) && !used.has(alias)) {
        if (field === 'quote' && source === 'stakeholders' && alias !== 'comment') continue;
        // In an agree/disagree sheet "priority" is the finding's priority, not the reviewer's severity.
        if (field === 'reporter_severity' && source === 'stakeholders') continue;
        map[field] = alias;
        used.add(alias);
        break;
      }
    }
  }
  if (columns.includes('source')) used.add('source'); // per-row source (feedback-import.csv)
  const ignored = columns.filter((c) => !used.has(c));
  return { map, ignored };
}

/**
 * Normalise one raw record. Identities and free text are scrubbed by the caller-supplied functions.
 * @returns the item without id (assigned by the caller) or null for an empty record.
 */
export function normalizeRecord(rec, { map, ignored, source: defaultSource, study, channel, uiVersion, rawRef, scrub, codeFor }) {
  const f = rec.fields;
  const rowSource = String(f.source || '').trim().toLowerCase();
  const source = SOURCES.includes(rowSource) ? rowSource : defaultSource;
  const get = (field) => (map[field] ? String(f[map[field]] ?? '').trim() : '');
  const counts = {};
  const clean = (v) => {
    if (!v) return v || null;
    const r = scrub(v);
    for (const [k, n] of Object.entries(r.counts)) counts[k] = (counts[k] || 0) + n;
    return r.text;
  };
  const quote = clean(get('quote'));
  let text = clean(get('text'));
  const verdict = source === 'stakeholders' ? normVerdict(get('verdict')) : null;
  const findingId = source === 'stakeholders' ? get('links') || null : null;
  if (source === 'stakeholders' && !text) text = clean([findingId, get('text')].filter(Boolean).join(': ')) || null;
  if (!quote && !text && !verdict) return null;

  const who = get('participant');
  const participant = who ? (isCode(who) ? who : codeFor(who)) : null;
  const sevValue = get('reporter_severity');
  const rating = get('rating');
  const scale = get('reporter_scale') || (rating && !sevValue ? 'star rating' : '');
  const reporter_severity = sevValue || rating
    ? { value: sevValue || rating, scale: scale || null, prior: sevValue ? severityPrior(sevValue, scale) : null }
    : null;
  const extra = {};
  for (const c of ignored) {
    const v = String(f[c] ?? '').trim();
    if (v) extra[c] = clean(v);
  }
  const links = (get('links') || '').split(/[;,\s]+/).filter((x) => /^F-\d+$/.test(x));
  const item = {
    source,
    channel: get('channel') || channel || DEFAULT_CHANNEL[source],
    date: get('date') || null,
    timestamp: get('timestamp') || null,
    participant,
    study: study || get('study') || null,
    task: get('task') || null,
    step: get('step') || null,
    outcome: normOutcome(get('outcome')),
    intervention: map.intervention ? (get('intervention') ? !/^(no|none|-|0|false)$/i.test(get('intervention')) : false) : null,
    prompted: yesNo(get('prompted')),
    ui_version: get('ui_version') || uiVersion || null,
    route: normRoute(get('route')),
    quote,
    text,
    reporter_severity,
    classification: normClass(get('classification')),
    theme: get('theme') || null,
    links,
    tags: (get('tags') || '').split(/[;,]/).map((t) => t.trim()).filter(Boolean),
    source_ref: clean(get('source_ref')) || null,
    raw_ref: `${rawRef}#${rec.ref}`,
    scrubbed: true,
    flags: [],
    ...(Object.keys(extra).length ? { extra } : {}),
  };
  if (source === 'stakeholders') {
    item.verdict = verdict;
    item.role = clean(get('role')) || null;
    item.finding = findingId;
  }
  return { item, counts };
}
