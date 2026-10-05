#!/usr/bin/env node
// Pair run n with the skill and run n without it, for every eval in a round, and hide which is which:
//   node tools/bench/make-pairs.mjs <round-dir> --seed <n>
// Each pair gets A and B at random (seeded) for the model comparators. The graded stills and the comment-free site
// (screens/ and blind-site/ from grade-build.mjs) are copied to <eval>/pairs/pair-<n>/{A,B}/{screens,site}, and the keys
// go to <round>/pairs.json. A pair is `ready` when both sides have been graded.
import fs from 'node:fs';
import path from 'node:path';
import { listRuns, parseArgs, rng, shuffle, usage, writeJson } from './lib.mjs';

const { pos, opts } = parseArgs(process.argv.slice(2));
const round = pos[0];
if (!round || opts.seed === undefined || opts.seed === true || !fs.existsSync(round)) usage('usage: node tools/bench/make-pairs.mjs <round-dir> --seed <n>', opts.help);
const random = rng(Number(opts.seed));
const runs = listRuns(round);
const pairs = [];
for (const ev of [...new Set(runs.map((r) => r.eval))]) {
  const numbers = (config) => new Set(runs.filter((r) => r.eval === ev && r.config === config).map((r) => r.run));
  const without = numbers('without_skill');
  for (const n of [...numbers('with_skill')].filter((x) => without.has(x)).sort((a, b) => a - b)) {
    const [A, B] = shuffle(['with_skill', 'without_skill'], random);
    const key = { A, B };
    const dir = path.join(round, ev, 'pairs', `pair-${n}`);
    // A new seed means a new key: never leave copies from an earlier one behind.
    fs.rmSync(dir, { recursive: true, force: true });
    let ready = true;
    for (const [label, config] of Object.entries(key)) {
      const run = path.join(round, ev, config, `run-${n}`);
      if (!fs.existsSync(path.join(run, 'screens')) || !fs.existsSync(path.join(run, 'blind-site'))) {
        ready = false;
        continue;
      }
      fs.cpSync(path.join(run, 'screens'), path.join(dir, label, 'screens'), { recursive: true });
      fs.cpSync(path.join(run, 'blind-site'), path.join(dir, label, 'site'), { recursive: true });
    }
    pairs.push({ eval: ev, pair: n, key, ready });
  }
}
writeJson(path.join(round, 'pairs.json'), pairs);
console.log(`${pairs.length} pair(s), ${pairs.filter((p) => p.ready).length} ready; keys in ${path.join(round, 'pairs.json')}`);
