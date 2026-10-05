// Report language lint (EVD-06; FRAMEWORK §13): wording must not exceed the evidence behind it.

const LEVELS = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5'];
const rank = (e) => Math.max(0, LEVELS.indexOf(e || 'E0'));

const HEDGE = /\b(may|might|could|likely|possibly|potential(ly)?|predicted|would)\b/i;
const USER_CLAIM = /\b(users?|people|customers|visitors|participants)\s+(struggle[sd]?|fail(ed|s)?|cannot|can't|couldn't|get confused|are confused|abandon(ed|s)?|miss(ed|es)?|don't|do not|never|always|hate|love|prefer(red)?)\b/i;
const USER_CLAIM_ZH = /用户(会|都|无法|找不到|困惑|放弃|讨厌|喜欢)/;
const CAUSAL = /\b(caused|causes|increased|decreased|reduced|improved|boosted|lifted|drove|led to|resulted in)\b[^.]{0,60}\b(conversion|retention|engagement|sign-?ups?|revenue|completion|satisfaction|task success|churn)\b/i;
const COMPLETENESS = /\b(all (the )?(issues|problems|defects)|no (remaining |other )?(issues|problems)|fully accessible|(wcag|wcag 2\.2)[- ]?(aa )?compliant|compliant with wcag|conforms to wcag|100% (accessible|beautiful|usable)|bug-?free|flawless)\b/i;
const COMPLETENESS_ZH = /(完全无障碍|完全符合\s*WCAG|符合\s*WCAG\s*2\.2|所有问题(都)?(已)?(修复|解决)|没有任何问题|100%\s*美观)/;
const AI_ACCUSATION = /\b((made|generated|written|built) by (an )?ai|ai-(made|generated) (design|ui|page))\b/i;
const SYNTHETIC_METRIC = /\b(simulated|synthetic|persona)\b[^.]{0,80}\b(sus|seq|nps|success rate|completion rate)\b|\b(sus|seq|nps|success rate|completion rate)\b[^.]{0,80}\b(simulated|synthetic|persona)\b/i;

function scanText(text, { evidence = 'E0', where }) {
  const out = [];
  const t = String(text || '');
  if (!t.trim()) return out;
  for (const sentence of t.split(/(?<=[.!?。！？])\s+|\n+/)) {
    const s = sentence.trim();
    if (!s) continue;
    if (rank(evidence) < 3 && (USER_CLAIM.test(s) || USER_CLAIM_ZH.test(s)) && !HEDGE.test(s)) {
      out.push({ rule: 'user-claim-below-E3', where, text: s.slice(0, 200), fix: 'say "may" or cite E3 evidence (k of n participants)' });
    }
    if (rank(evidence) < 5 && CAUSAL.test(s)) out.push({ rule: 'causal-below-E5', where, text: s.slice(0, 200), fix: 'use association wording, or cite a randomised experiment' });
    if (COMPLETENESS.test(s) || COMPLETENESS_ZH.test(s)) out.push({ rule: 'completeness-claim', where, text: s.slice(0, 200), fix: 'state coverage and the assurance level instead' });
    if (AI_ACCUSATION.test(s)) out.push({ rule: 'authorship-claim', where, text: s.slice(0, 200), fix: 'describe the absence of decisions (tells), never authorship' });
    if (SYNTHETIC_METRIC.test(s)) out.push({ rule: 'synthetic-metric', where, text: s.slice(0, 200), fix: 'simulated users never produce metrics' });
  }
  return out;
}

/** Lint every finding's prose and any free text (debrief, next steps). */
export function lintReport({ findings = [], texts = [] }) {
  const violations = [];
  for (const f of findings) {
    const ev = f.evidence_level || 'E0';
    for (const field of ['title', 'description', 'impact', 'recommendation']) {
      violations.push(...scanText(f[field], { evidence: ev, where: `${f.id}.${field}` }));
    }
  }
  for (const t of texts) violations.push(...scanText(t.text, { evidence: t.evidence || 'E0', where: t.where }));
  return { violations, checked_at: new Date().toISOString() };
}
