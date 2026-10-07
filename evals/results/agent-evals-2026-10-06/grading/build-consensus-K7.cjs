const fs = require('fs');
const dir = '<tmp>';
const A = JSON.parse(fs.readFileSync(dir + 'answers-K7-a.json', 'utf8'));
const B = JSON.parse(fs.readFileSync(dir + 'answers-K7-b.json', 'utf8'));
const AG = JSON.parse(fs.readFileSync(dir + 'agreement-K7.json', 'utf8'));

const settled = [
  {
    item: 'R1',
    final: 'not-a-problem',
    reason: `The review itself frames this as a back-end question, not a usability or accessibility problem in the flow: it hedges with 'Assumption: there's a backend that isn't in this folder. If not, this is the first thing to fix', later sets it apart as 'the backend question in fix 1', and asks the team to 'Confirm that bookings actually reach the office'. Whether this static front end is wired to a booking system is integration work the review cannot see, so the harm it describes ('The office has no record and nobody to call') is conditional, not shown in the flow.`,
  },
  {
    item: 'R2',
    final: 'not-a-problem',
    reason: `'The reference (SQ-1017-C3, app.js:237) is built only from the date and berth. Two boats booking the same berth for the same date would get the same reference.' A clash needs the same berth booked twice for one date, which only a back end could allow or prevent, and the review files it under fix 1, which it calls 'the backend question'. Nothing it describes in the interface misleads or blocks a skipper.`,
  },
  {
    item: 'R3',
    final: 'not-a-problem',
    reason: `'The flow never checks whether a berth is actually free' concerns live availability, which a static front end cannot hold. The review files it under fix 1 ('the backend question') and points to no screen that shows skippers wrong availability, so like R1 and R2 it is an integration matter, not a usability problem in the flow.`,
  },
  {
    item: 'R4',
    final: 'journey-app-D04',
    reason: `The review presents the dead end as a result of this ordering ('a skipper can reasonably pick Pontoon B, berth 14 (up to 10 m)... They enter 10.4: the form disappears and they get "Booking stopped..."') and says its fix removes it: 'Ask for length overall first and show only the berths that fit (fix 2). That also gets rid of the "Booking stopped" dead end.' Fixing what the review describes would fix D04, so this broader statement maps there alongside R6. Its other outcome ('They enter 9.6: the booking goes through for a berth the boat is too long for') comes from the length ambiguity already mapped to D03 through R5, so the review describes no further harm outside the seeded defects.`,
  },
  {
    item: 'R16',
    final: 'not-a-problem',
    reason: `The review raises the check only in passing, inside an argument that the field should not be collected: 'MMSI is required but shouldn't be... It isn't on your "collect only what we need" list. There's also no hint about what it is and no check that it's 9 digits. Make it optional with a hint, or remove it.' It names no effect of the missing check and its fix adds none; by its own account the harbour's list of what it needs leaves the MMSI out, so a mistyped number costs a skipper nothing. The genuine problem here, a required and unexplained MMSI, is R15, mapped to D10.`,
  },
];

const byA = Object.fromEntries(A.mapping.map((m) => [m.item, m]));
const byB = Object.fromEntries(B.mapping.map((m) => [m.item, m]));
const bySettled = Object.fromEntries(settled.map((s) => [s.item, s]));

// Item lists must match.
const itemsA = A.mapping.map((m) => m.item).join(',');
const itemsB = B.mapping.map((m) => m.item).join(',');
if (itemsA !== itemsB) throw new Error('item lists differ: ' + itemsA + ' vs ' + itemsB);

// Settled items must be exactly the listed disagreements, with matching a/b values.
const dis = AG.item_level.disagreements;
const disItems = dis.map((d) => d.item).sort().join(',');
const setItems = settled.map((s) => s.item).sort().join(',');
if (disItems !== setItems) throw new Error('settled set ' + setItems + ' != disagreements ' + disItems);
for (const d of dis) {
  if (byA[d.item].maps_to !== d.a || byB[d.item].maps_to !== d.b) throw new Error('a/b mismatch for ' + d.item);
}

const mapping = A.mapping.map((m) => {
  const s = bySettled[m.item];
  if (s) return { item: m.item, title: m.title, maps_to: s.final, reason: s.reason };
  if (m.maps_to !== byB[m.item].maps_to) throw new Error('unsettled disagreement: ' + m.item);
  return { item: m.item, title: m.title, maps_to: m.maps_to, reason: m.reason };
});

// Assertions: keep the agreed answers; fail if any split.
if (A.answers.length !== B.answers.length) throw new Error('answer counts differ');
const answers = A.answers.map((a, i) => {
  const b = B.answers[i];
  if (a.text !== b.text) throw new Error('assertion text differs at ' + i);
  if (a.passed !== b.passed) throw new Error('assertion split at ' + i + ' needs settling');
  return { text: a.text, passed: a.passed, evidence: a.evidence };
});

const settledOut = settled.map((s) => ({
  item: s.item,
  a: byA[s.item].maps_to,
  b: byB[s.item].maps_to,
  final: s.final,
  reason: s.reason,
}));

fs.writeFileSync(dir + 'consensus-K7.json', JSON.stringify({ answers, mapping, settled: settledOut }, null, 2) + '\n');

const counts = {};
for (const m of mapping) {
  const k = m.maps_to.startsWith('journey-app-') ? 'seeded' : m.maps_to;
  counts[k] = (counts[k] || 0) + 1;
}
const defects = [...new Set(mapping.filter((m) => m.maps_to.startsWith('journey-app-')).map((m) => m.maps_to))].sort();
console.log(JSON.stringify({ items: mapping.length, counts, distinctDefects: defects.length, defects, settled: settledOut.map((s) => s.item + ':' + s.final) }, null, 1));
