// uie roll — seeded direction deal (METHODS §6; ADR-013).
import path from 'node:path';
import os from 'node:os';
import { readJson, writeJson, exists } from '../util/fs.mjs';
import { intOpt, list, UsageError } from '../util/args.mjs';
import { paths, loadConfig } from '../project.mjs';
import { rng, weightedPick } from '../roll/prng.mjs';
import { recentValues } from '../roll/ledger.mjs';
import { loadData } from '../gates/rules.mjs';
import { sha1 } from '../util/hash.mjs';
import { isoNow } from '../util/time.mjs';
import { validate, loadSchema } from '../schema.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'global'] };
export const help = `uie roll --candidates <file> [--deal 3] [--seed <s>] [--mode persuade|operate|read|experience] [--global]
uie roll --tiebreak <id,id,...> --seed <s>

Deals directions from a ranked candidate list (5–7 candidates from the audience's world, ≥ 3 material families):
  1. one candidate drawn with the seed from ranks 3…n (never the model's top two);
  2. the model's own top pick, with a familiarity-risk note;
  3. the conventional option (a candidate marked "conventional": true, or a synthesised category-standard slot).
Each dealt direction gets structural parameters drawn from pools not used in the last 3 ledger entries.
The roll file is written next to the candidates file as roll-<seed>.json. --global also avoids values from the
opt-in cross-project ledger at ~/.ui-evaluator/ledger.json.`;

function pickParam(next, poolDef, mode, avoid) {
  let values = poolDef.values;
  const allowed = poolDef.modes && mode ? poolDef.modes[mode] : null;
  if (allowed) values = values.filter((v) => allowed.some((a) => v.value.startsWith(a)));
  const fresh = values.filter((v) => !avoid.has(v.value));
  const pool = fresh.length ? fresh : values;
  return weightedPick(next, pool);
}

export async function run(args, ctx) {
  if (args.tiebreak) {
    const ids = list(args.tiebreak);
    if (ids.length < 2) throw new UsageError('--tiebreak needs at least two ids');
    if (!args.seed) throw new UsageError('--tiebreak needs --seed so the choice is reproducible');
    const next = rng(`tiebreak:${args.seed}:${ids.join(',')}`);
    const chosen = ids[Math.floor(next() * ids.length)];
    ctx.result({ chosen, ids, seed: args.seed });
    ctx.print(`tie-break with seed ${args.seed}: ${chosen}`);
    return 0;
  }
  if (!args.candidates) throw new UsageError('give --candidates <file>');
  const file = path.resolve(String(args.candidates));
  const doc = readJson(file);
  const v = validate(loadSchema('candidates'), doc);
  if (!v.valid) throw new UsageError(`candidates file is invalid:\n${v.errors.slice(0, 8).map((e) => `  ${e.path}: ${e.message}`).join('\n')}`);
  const cands = [...doc.candidates].sort((a, b) => a.rank - b.rank);
  const identityLock = cands.some((c) => c.axis);
  const minCount = identityLock ? 3 : 5;
  if (cands.length < minCount) throw new UsageError(`${cands.length} candidate(s); give at least ${minCount}${identityLock ? ' variants' : ' (5–7 from the audience’s world)'}`);
  if (!identityLock) {
    const families = new Set(cands.map((c) => c.material_family).filter(Boolean));
    if (families.size < 3) throw new UsageError(`candidates span ${families.size} material famil${families.size === 1 ? 'y' : 'ies'}; at least 3 are required`);
  }
  const deal = args.deal ? intOpt(args.deal, 'deal', { min: 2, max: 5 }) : 3;
  const cfg = loadConfig(ctx.root);
  const seed = args.seed ? String(args.seed) : sha1(`${cfg.project.name}|${isoNow().slice(0, 10)}|${sha1(JSON.stringify(cands))}`).slice(0, 10);
  const next = rng(`roll:${seed}`);
  const dealt = [];
  const used = new Set();
  // 1. Seeded draw from ranks 3..n.
  const lower = cands.filter((c) => c.rank >= 3);
  const draw = lower[Math.floor(next() * lower.length)];
  dealt.push({ slot: 'seeded', candidate: draw, note: `drawn with seed ${seed} from ranks 3–${cands.length}` });
  used.add(draw.id);
  // 2. The model's own pick.
  const top = cands[0];
  dealt.push({ slot: 'model-pick', candidate: top, note: 'the model’s first choice; familiarity risk: first choices converge across projects, so it must pass the convergence tests like any other' });
  used.add(top.id);
  // 3. The conventional option.
  const conv = cands.find((c) => c.conventional && !used.has(c.id));
  dealt.push(
    conv
      ? { slot: 'conventional', candidate: conv, note: 'the category-standard structure with this brand layer' }
      : { slot: 'conventional', candidate: { id: 'conventional', synthetic: true, thesis: 'The category-standard structure, with the brand layer applied (type, colour, imagery, voice, one signature moment).' }, note: 'synthesised: no candidate was marked conventional' },
  );
  // 4+. Extra seeded draws if --deal > 3.
  while (dealt.length < deal) {
    const rest = lower.filter((c) => !dealt.some((d) => d.candidate.id === c.id));
    if (!rest.length) break;
    const c = rest[Math.floor(next() * rest.length)];
    dealt.push({ slot: 'seeded', candidate: c, note: `extra seeded draw (seed ${seed})` });
  }
  // Structural parameters from ledger-unused pools.
  const ledger = readJson(paths(ctx.root).ledger, { entries: [] });
  const global = args.global ? readJson(path.join(os.homedir(), '.ui-evaluator', 'ledger.json'), { entries: [] }) : { entries: [] };
  const pools = loadData('direction-pools').pools;
  const mode = args.mode ? String(args.mode) : null;
  const keyMap = { fold_class: 'fold_class', layout_family: 'layout_family', color_strategy: 'color_strategy', type_pairing_class: 'type_pairing_class', density: 'density', motion_character: 'motion_character' };
  const takenThisRoll = Object.fromEntries(Object.keys(keyMap).map((k) => [k, new Set()]));
  for (const d of dealt) {
    d.params = {};
    for (const [pk, lk] of Object.entries(keyMap)) {
      const avoid = new Set([...recentValues(ledger, lk), ...recentValues(global, lk), ...takenThisRoll[pk]]);
      const val = pickParam(next, pools[pk], mode, avoid);
      d.params[pk] = val;
      takenThisRoll[pk].add(val);
    }
  }
  const out = {
    schema: 'roll',
    seed,
    at: isoNow(),
    candidates_file: path.relative(ctx.root, file),
    category_default: doc.category_default || null,
    predictable_opposite: doc.predictable_opposite || null,
    mode,
    dealt,
  };
  const outFile = path.join(path.dirname(file), `roll-${seed}.json`);
  if (exists(outFile)) ctx.warn(`overwriting ${outFile} (same seed)`);
  writeJson(outFile, out);
  ctx.result({ file: outFile, ...out });
  ctx.print(`roll ${seed} → ${path.relative(ctx.root, outFile)}`);
  for (const d of dealt) ctx.print(`  [${d.slot}] ${d.candidate.id}: ${d.candidate.thesis || ''}`.slice(0, 200), `      fold: ${d.params.fold_class}; colour: ${d.params.color_strategy}; type: ${d.params.type_pairing_class}; motion: ${d.params.motion_character}`);
  return 0;
}
