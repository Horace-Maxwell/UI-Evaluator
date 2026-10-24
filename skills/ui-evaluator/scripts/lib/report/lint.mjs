// Report language lint (EVD-06; FRAMEWORK §13): wording must not exceed the evidence behind it.

const LEVELS = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5'];
const rank = (e) => Math.max(0, LEVELS.indexOf(e || 'E0'));

// "could not" states a fact, not a possibility, so it is no hedge.
const HEDGE = /\b(may|might|could(?!\s+not\b)|likely|possibly|potential(ly)?|predicted|would)\b/i;
// A claim about what people do, feel or cannot do. The subject is anyone the product serves (users, residents,
// members, every visitor, most people); the review of 2026-10-24 found "Residents cannot see the fee", "Keyboard users
// are unable to reach the menu" and "Users will abandon the form" passing the lint.
const PEOPLE = String.raw`(?:users?|people|customers|visitors?|participants?|residents?|members?|shoppers?|(?<!screen[- ])readers?|students?|patients?|clients?|applicants?|skippers?|everyone|everybody|nobody|no one|(?:every|each|any)\s+(?:user|visitor|resident|member|customer|one))`;
const CLAIM_VERB = String.raw`(?:struggle[sd]?|fail(?:ed|s)?|cannot|can't|can not|couldn't|could not|(?:are|is) (?:unable|not able) to|will|won't|will not|gets? (?:lost|confused)|are confused|abandon(?:ed|s)?|miss(?:ed|es)?|don't|do not|never|always|hate|love|prefer(?:red|s)?|notice[sd]?|ignore[sd]?|gives? up)`;
const USER_CLAIM = new RegExp(String.raw`\b${PEOPLE}\s+(?:(?:often|usually|quickly|simply|just|still|also|then)\s+)?${CLAIM_VERB}\b`, 'i');
const USER_CLAIM_ZH = /用户(会|都|无法|找不到|困惑|放弃|讨厌|喜欢)/;
const CAUSAL = /\b(caused|causes|increased|decreased|reduced|improved|boosted|lifted|drove|led to|resulted in)\b[^.]{0,60}\b(conversion|retention|engagement|sign-?ups?|revenue|completion|satisfaction|task success|churn)\b/i;
const COMPLETENESS = /\b(all (the )?(issues|problems|defects)|no (remaining |other |further |known |accessibility |usability |more )*(issues|problems|barriers)|fully accessible|accessible to (everyone|everybody|all( users)?)|(wcag|wcag 2\.2)[- ]?(aa )?compliant|compliant with wcag|conforms to wcag|(meets|passes|satisfies|complies with)\s+(all of\s+)?wcag(\s*2(\.\d)?)?(\s*(level\s*)?aa+)?\b(?!\s*\d+\.\d)|100% (accessible|beautiful|usable)|bug-?free|flawless)\b/i;
const COMPLETENESS_ZH = /(完全无障碍|完全符合\s*WCAG|符合\s*WCAG\s*2\.2|所有问题(都)?(已)?(修复|解决)|没有任何问题|100%\s*美观)/;
// An instruction ("Ensure the contrast … meets WCAG", axe's own rule text) claims nothing, and a sentence that says it
// is quoting the owner's documents is an attribution, not the reviewer's claim.
const IMPERATIVE = /^(ensure|make sure|check that|verify that|confirm that)\b/i;
const ATTRIBUTED = /\b(product\.md|context\.md|design\.md)\b|\bthe (brief|context|product brief|owner) (says|lists|states|notes)\b|\bcontext (says|lists|states)\b/i;
const AI_ACCUSATION = /\b((made|generated|written|built) by (an )?ai|ai-(made|generated) (design|ui|page))\b/i;
const SYNTHETIC_METRIC = /\b(simulated|synthetic|persona)\b[^.]{0,80}\b(sus|seq|nps|success rate|completion rate)\b|\b(sus|seq|nps|success rate|completion rate)\b[^.]{0,80}\b(simulated|synthetic|persona)\b/i;

function scanText(text, { evidence = 'E0', where }) {
  const out = [];
  const t = String(text || '');
  if (!t.trim()) return out;
  for (const sentence of t.split(/(?<=[.!?。！？])\s+|\n+/)) {
    const s = sentence.trim();
    if (!s) continue;
    if (rank(evidence) < 3 && (USER_CLAIM.test(s) || USER_CLAIM_ZH.test(s)) && !HEDGE.test(s) && !ATTRIBUTED.test(s)) {
      out.push({ rule: 'user-claim-below-E3', where, text: s.slice(0, 200), fix: 'say "may" or cite E3 evidence (k of n participants)' });
    }
    if (rank(evidence) < 5 && CAUSAL.test(s)) out.push({ rule: 'causal-below-E5', where, text: s.slice(0, 200), fix: 'use association wording, or cite a randomised experiment' });
    if ((COMPLETENESS.test(s) || COMPLETENESS_ZH.test(s)) && !IMPERATIVE.test(s)) out.push({ rule: 'completeness-claim', where, text: s.slice(0, 200), fix: 'state coverage and the assurance level instead' });
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
