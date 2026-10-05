#!/usr/bin/env node
// Unblind a round and store it in the repository:
//   node tools/bench/record-round.mjs <round-dir> --date <YYYY-MM-DD> [--out <dir>]
//        [--human "<the line from judge.html>" --judge "<who judged>"] [--caveat "<text>" …]
// Reads pairs.json and each pair's stage1.json (the model comparators, unblinded with the A/B keys) and, with --human,
// the person's line (unblinded with judge-key.json). Writes to evals/results/build-benchmark-<date>/ (or --out):
//   runs.json                     every graded run: output and process assertions kept apart, tells, failed criteria, cost
//   pairs.json, judge-key.json    the keys
//   <eval>/<config>/run-<n>/      grading.json, timing.json (when the harness gave one), screen-375.png, screen-1280.png
//   <eval>/stage1-pair-<n>.json   each comparator's verdict as written
//   human-judgement.json          with --human: the verdicts, the tally, the comparators' verdicts and the agreement
//   model-judgement.json          without --human: the comparators' verdicts and their tally
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, listRuns, parseArgs, parseVerdictLine, readJson, scoreOf, tally, usage, writeJson } from './lib.mjs';

const { pos, opts } = parseArgs(process.argv.slice(2), { repeat: ['caveat'] });
const round = pos[0] && path.resolve(pos[0]);
if (!round || !/^\d{4}-\d{2}-\d{2}$/.test(String(opts.date)) || !fs.existsSync(path.join(round, 'pairs.json'))) {
  usage('usage: node tools/bench/record-round.mjs <round-dir> --date <YYYY-MM-DD> [--out <dir>] [--human "<line>" --judge "<who>"] [--caveat "<text>" …]', opts.help);
}
if (opts.human === true) usage('--human needs the line the judging page produced, in quotes');
const out = path.resolve(typeof opts.out === 'string' ? opts.out : path.join(ROOT, 'evals/results', `build-benchmark-${opts.date}`));
const pairs = readJson(path.join(round, 'pairs.json'));
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};

// The comparators' verdicts, unblinded: A and B become configurations; a tie stays a tie.
const model = [];
for (const p of pairs.filter((x) => x.ready)) {
  const file = path.join(round, p.eval, 'pairs', `pair-${p.pair}`, 'stage1.json');
  if (!fs.existsSync(file)) {
    console.warn(`no comparator verdict for ${p.eval} pair ${p.pair}`);
    continue;
  }
  const s = readJson(file);
  const unblind = (winner) => p.key[winner] || winner;
  const byConfig = (field) => ({ [p.key.A]: s.scores?.A?.[field], [p.key.B]: s.scores?.B?.[field] });
  model.push({ eval: p.eval, pair: p.pair, more_beautiful: unblind(s.more_beautiful?.winner), less_generic: unblind(s.less_generic?.winner), visual: byConfig('visual'), distinct: byConfig('distinct') });
  copy(file, path.join(out, p.eval, `stage1-pair-${p.pair}.json`));
}

// Every graded run, with its stills.
const runs = [];
for (const r of listRuns(round)) {
  const grading = readJson(path.join(r.dir, 'grading.json'), null);
  if (!grading) {
    console.warn(`${r.eval}/${r.config}/run-${r.run} is not graded; left out`);
    continue;
  }
  const dst = path.join(out, r.eval, r.config, `run-${r.run}`);
  copy(path.join(r.dir, 'grading.json'), path.join(dst, 'grading.json'));
  const timing = readJson(path.join(r.dir, 'timing.json'), null);
  if (timing) copy(path.join(r.dir, 'timing.json'), path.join(dst, 'timing.json'));
  for (const w of [375, 1280]) {
    const still = path.join(r.dir, 'screens', `root_default_${w}-light-audit.png`);
    if (fs.existsSync(still)) copy(still, path.join(dst, `screen-${w}.png`));
  }
  runs.push({
    eval: r.eval,
    config: r.config,
    run: r.run,
    output: scoreOf(grading, 'output'),
    process: scoreOf(grading, 'process'),
    hard_tells: grading.metrics?.hard_tells || [],
    criteria_failed: grading.metrics?.counts || {},
    tokens: timing?.total_tokens ?? null,
    seconds: timing?.total_duration_seconds ?? null,
  });
}
writeJson(path.join(out, 'runs.json'), runs);
copy(path.join(round, 'pairs.json'), path.join(out, 'pairs.json'));
if (fs.existsSync(path.join(round, 'judge-key.json'))) copy(path.join(round, 'judge-key.json'), path.join(out, 'judge-key.json'));

const caveats = opts.caveat || [];
let human = null;
if (typeof opts.human === 'string') {
  const key = readJson(path.join(round, 'judge-key.json'));
  const verdicts = parseVerdictLine(opts.human, key).map(({ pid, ...v }) => v);
  const agreement = Object.fromEntries(['more_beautiful', 'less_generic'].map((q) => [q, verdicts.filter((v) => model.find((m) => m.eval === v.eval && m.pair === v.run)?.[q] === v[q]).length]));
  human = { tally: tally(verdicts), agreement };
  writeJson(path.join(out, 'human-judgement.json'), {
    schema: 'human-blind-judgement',
    date: opts.date,
    judge: typeof opts.judge === 'string' ? opts.judge : 'one person',
    caveats,
    judge_page_key: key,
    verdicts,
    tally: human.tally,
    llm_stage1: model,
    agreement_with_llm: agreement,
  });
} else if (model.length) {
  writeJson(path.join(out, 'model-judgement.json'), { schema: 'model-blind-judgement', date: opts.date, caveats, verdicts: model, tally: tally(model, ['more_beautiful', 'less_generic']) });
}

const range = (config) => {
  const rates = runs.filter((r) => r.config === config && r.output.total).map((r) => r.output.passed / r.output.total);
  return rates.length ? `${Math.round(Math.min(...rates) * 100)}–${Math.round(Math.max(...rates) * 100)}%` : 'no runs';
};
console.log(`stored ${runs.length} run(s) in ${out.startsWith(`${ROOT}${path.sep}`) ? path.relative(ROOT, out) : out}`);
console.log(`output assertions met: with the skill ${range('with_skill')}, without ${range('without_skill')}`);
if (model.length) console.log(`comparators: ${JSON.stringify(tally(model, ['more_beautiful', 'less_generic']))}`);
if (human) console.log(`person: ${JSON.stringify(human.tally)}; agreement with the comparators: ${JSON.stringify(human.agreement)}`);
