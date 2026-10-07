// Consensus for an assertion-only packet: two graders' answer files → one consensus file when they agree on every
// assertion; otherwise exit 2 and list the splits for an adjudicator. (Mapping packets use tools/bench/agree-graders.mjs.)
//   node consensus.mjs <answers-a.json> <answers-b.json> <consensus-out.json>
import fs from 'node:fs';
const [a, b, out] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(a, 'utf8'));
const B = JSON.parse(fs.readFileSync(b, 'utf8'));
const answers = [];
const splits = [];
for (const x of A.answers) {
  const y = B.answers.find((z) => z.text === x.text);
  if (!y) {
    splits.push(`${x.text}: missing from B`);
    continue;
  }
  if (x.passed !== y.passed) splits.push(`${x.text}: A ${x.passed}, B ${y.passed}`);
  answers.push({ text: x.text, passed: x.passed && y.passed, evidence: `Both graders ${x.passed === y.passed ? 'agree' : 'SPLIT'} (${x.passed ? 'pass' : 'fail'} / ${y.passed ? 'pass' : 'fail'}). A: ${x.evidence} B: ${y.evidence}` });
}
if (splits.length) {
  console.log(`SPLIT on ${splits.length} assertion(s):\n${splits.join('\n')}`);
  process.exit(2);
}
fs.writeFileSync(out, JSON.stringify({ answers, graders: 2, agreement: `${answers.length} of ${answers.length} assertions agree` }, null, 2));
console.log(`consensus: ${answers.length} assertion(s), all agreed → ${out}`);
