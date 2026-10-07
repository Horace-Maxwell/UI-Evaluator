const fs = require("fs");
const path = require("path");
const dir = __dirname;
const a = JSON.parse(fs.readFileSync(path.join(dir, "answers-M3-a.json"), "utf8"));
const b = JSON.parse(fs.readFileSync(path.join(dir, "answers-M3-b.json"), "utf8"));

const reason =
  "F-0020 reports the berth cards on /berths.html: 'Each berth card says only \"Boats up to N metres\"', and " +
  "'the limit should name the measure it applies to'. D03 is a different element on another page: 'The " +
  "boat-details field is labelled only Length' on /boat.html, which also gives no unit. Naming the measure on " +
  "the cards would leave that field saying only 'Length' with no unit, so fixing what F-0020 describes does not " +
  "fix D03. Fixing the field would also leave the cards ambiguous; the review itself names two places to fix: " +
  "'say \"length overall (LOA)\" on the cards and the field'. The probe in which 'hull length 9.6 is accepted' " +
  "shows D03's field at work, which F-0029 already reports; it is not what F-0020 says is wrong. This matches the " +
  "agreed strict calls on F-0026, F-0034/F-0042 and F-0050, which share a theme with a seeded defect but concern " +
  "another element. It is still a genuine problem for these skippers: 'A persona whose boat is 10.4 m overall " +
  "but 9.6 m on the hull may read B14 (\"up to 10 metres\", and cheaper) as fitting', so a skipper with a " +
  "bowsprit can choose a berth that is too short.";

const settled = [];
const mapping = a.mapping.map((m) => {
  const other = b.mapping.find((x) => x.item === m.item);
  if (m.maps_to !== other.maps_to) {
    settled.push({ item: m.item, a: m.maps_to, b: other.maps_to, final: "real-unseeded", reason });
    return { item: m.item, title: m.title, maps_to: "real-unseeded", reason };
  }
  return { item: m.item, title: m.title, maps_to: m.maps_to, reason: m.reason };
});

const answers = a.answers.map((x, i) => {
  if (x.passed !== b.answers[i].passed) throw new Error("assertion split: " + x.text);
  return { text: x.text, passed: x.passed, evidence: x.evidence };
});
answers[0].evidence =
  "Of the 60 judged findings (tool findings F-0001 to F-0005 excluded), 28 map to seeded defects, 21 are real but " +
  "unseeded (F-0020 included, as settled) and 11 are not a problem (visual identity x3, widows, footer band, " +
  "tide-table header alignment x3, card highlight, content position, reuse-details feature), so precision = " +
  "49/60 = 0.82 and strict precision = 28/60 = 0.47. Recall by meaning is 10/11 = 0.91: every seeded defect is " +
  "found except D06 (prices only per metre per night, no totals), and D11 only partly, through F-0037's 'no gate " +
  "window' on the confirmation.";

fs.writeFileSync(path.join(dir, "consensus-M3.json"), JSON.stringify({ answers, mapping, settled }, null, 2) + "\n");

const tool = new Set(["F-0001", "F-0002", "F-0003", "F-0004", "F-0005"]);
const judged = mapping.filter((m) => !tool.has(m.item));
const isSeeded = (m) => m.maps_to.startsWith("journey-app-");
const seeded = judged.filter(isSeeded).length;
const real = judged.filter((m) => m.maps_to === "real-unseeded").length;
const nap = judged.filter((m) => m.maps_to === "not-a-problem").length;
const found = [...new Set(judged.filter(isSeeded).map((m) => m.maps_to))].sort();
console.log({
  items: mapping.length,
  judged: judged.length,
  seeded,
  real,
  nap,
  precision: ((seeded + real) / judged.length).toFixed(3),
  strict: (seeded / judged.length).toFixed(3),
  recall: found.length + "/11",
  found,
  settled: settled.map((s) => [s.item, s.a, s.b, s.final]),
  all65: {
    seeded: mapping.filter(isSeeded).length,
    real: mapping.filter((m) => m.maps_to === "real-unseeded").length,
    nap: mapping.filter((m) => m.maps_to === "not-a-problem").length,
  },
});
