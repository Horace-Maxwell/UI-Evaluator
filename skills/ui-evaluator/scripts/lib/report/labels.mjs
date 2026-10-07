// Labels for reports in the vocabulary of the CMU lecture (Evaluation: Analytical vs Empirical): Nielsen's ten
// heuristics, version 2, numbered H2-1…H2-10; the walkthrough's four questions asked at every step; the 0–4
// severity scale; and the white-box ease-of-fix scale (methods/severity-rating.md §3.9). IDs stay H1…H10 and
// CW-Q1…CW-Q4 in every file; only the printed labels change.

export const HEURISTICS = {
  H1: { lecture: 'H2-1', name: 'Visibility of system status' },
  H2: { lecture: 'H2-2', name: 'Match between system and the real world' },
  H3: { lecture: 'H2-3', name: 'User control and freedom' },
  H4: { lecture: 'H2-4', name: 'Consistency and standards' },
  H5: { lecture: 'H2-5', name: 'Error prevention' },
  H6: { lecture: 'H2-6', name: 'Recognition rather than recall' },
  H7: { lecture: 'H2-7', name: 'Flexibility and efficiency of use' },
  H8: { lecture: 'H2-8', name: 'Aesthetic and minimalist design' },
  H9: { lecture: 'H2-9', name: 'Help users recognize, diagnose and recover from errors' },
  H10: { lecture: 'H2-10', name: 'Help and documentation' },
};

/** The four walkthrough questions in the lecture's words, with the skill's longer form (cognitive-walkthrough.md). */
export const CW_QUESTIONS = {
  'CW-Q1': { lecture: 'Does the effect of the action match the user’s goal?', skill: 'Will the user try to achieve the right effect?' },
  'CW-Q2': { lecture: 'Is the action visible?', skill: 'Will the user notice that the correct action is available?' },
  'CW-Q3': { lecture: 'Will the user recognize the action as the correct one?', skill: 'Will the user associate the correct action with the effect?' },
  'CW-Q4': { lecture: 'Will the user understand the feedback?', skill: 'If the correct action is performed, will the user see that progress is being made?' },
};

export const SEVERITY_WORDS = ['not a usability problem', 'cosmetic', 'minor', 'major', 'catastrophe'];
export const EASE_WORDS = { 1: 'one value or token', 2: 'one component or file', 3: 'several components or one flow', 4: 'information architecture or architecture' };

/** "major" for a mean of 3.33; null when there is no number. */
export function severityWord(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return SEVERITY_WORDS[Math.max(0, Math.min(4, Math.round(n)))];
}

/**
 * The criterion as the lecture's report prints it: a number and a broad name.
 * @param {{kind?: string, id: string}} c
 * @param {{ rules?: Record<string, {title?: string}>, wcag?: Record<string, {name?: string}> }} names
 */
export function criterionLabel(c, { rules = {}, wcag = {} } = {}) {
  const id = String(c?.id || '');
  if (HEURISTICS[id]) return { number: HEURISTICS[id].lecture, name: HEURISTICS[id].name, kind: 'heuristic' };
  if (CW_QUESTIONS[id]) return { number: id, name: CW_QUESTIONS[id].lecture, kind: 'walkthrough' };
  if (/^\d+\.\d+\.\d+$/.test(id)) return { number: `WCAG ${id}`, name: wcag[id]?.name || 'WCAG 2.2 success criterion', kind: 'wcag' };
  if (rules[id]) return { number: id, name: shortTitle(rules[id].title), kind: 'rule' };
  return { number: id || '—', name: c?.name || '—', kind: c?.kind || 'other' };
}

function shortTitle(t) {
  const s = String(t || '').split(/[;:(]/)[0].trim();
  return s.length > 70 ? `${s.slice(0, 67)}…` : s;
}
