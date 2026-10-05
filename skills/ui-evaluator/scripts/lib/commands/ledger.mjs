// uie ledger — direction ledger (DEC-04).
import path from 'node:path';
import os from 'node:os';
import { readJson, writeJson, exists, readText } from '../util/fs.mjs';
import { UsageError } from '../util/args.mjs';
import { paths, appendIndex } from '../project.mjs';
import { ledgerVariety, hueBucket, normalizeMacro, accentOf } from '../roll/ledger.mjs';
import { parseDesign } from '../tokens/design.mjs';
import { isoNow } from '../util/time.mjs';
import { sha1 } from '../util/hash.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'global', 'pinned'] };
export const help = `uie ledger add [--direction <dir or decision.md>] [--display-face <f>] [--body-face <f>] [--accent <colour>]
                  [--macrostructure "hero>proof>steps>footer"] [--fold-class <c>] [--strategy <s>] [--seed <s>]
                  [--pinned "<reason the brand pins face and structure>"] [--global]
uie ledger list [--global]
uie ledger check [--global]

Values not given as flags are read from DESIGN.md (type families, primary colour, ui-evaluator.direction) and from the
roll file next to the direction's decision.md. --global also appends to the opt-in cross-project ledger
~/.ui-evaluator/ledger.json (advisory).`;

const globalPath = () => path.join(process.env.UIE_HOME || path.join(os.homedir(), '.ui-evaluator'), 'ledger.json');

export async function run(args, ctx) {
  const [sub] = args._;
  const p = paths(ctx.root);
  const file = args.global && sub !== 'add' ? globalPath() : p.ledger;
  const ledger = readJson(file, { schema: 'ledger', version: 1, entries: [] });
  if (sub === 'list') {
    ctx.result(ledger);
    if (!ledger.entries.length) ctx.print('the ledger is empty.');
    for (const e of ledger.entries) ctx.print(`${e.id} ${e.date} ${e.display_face || '?'} | ${e.macrostructure || '?'} | ${e.accent_hue_bucket || '?'} | ${e.color_strategy || '?'}`);
    return 0;
  }
  if (sub === 'check') {
    const v = ledgerVariety(ledger);
    ctx.result(v);
    ctx.print(`${v.ok ? 'pass' : 'fail'}: ${v.detail}`);
    return v.ok ? 0 : 2;
  }
  if (sub === 'add') {
    const design = exists(p.design) ? parseDesign(readText(p.design)) : null;
    const typo = design?.fm?.typography || {};
    const displayFace = args['display-face'] || typo.display?.fontFamily || typo.headline?.fontFamily || null;
    const bodyFace = args['body-face'] || typo.body?.fontFamily || null;
    const accent = args.accent || accentOf(design?.fm?.colors || {}) || null;
    let roll = null;
    let decisionDir = null;
    if (args.direction) {
      const d = path.resolve(String(args.direction));
      decisionDir = d.endsWith('.md') ? path.dirname(d) : d;
      const seed = args.seed || design?.uie?.direction?.roll_seed;
      if (seed && exists(path.join(decisionDir, `roll-${seed}.json`))) roll = readJson(path.join(decisionDir, `roll-${seed}.json`));
    }
    const chosenId = design?.uie?.direction?.chosen;
    const chosen = roll?.dealt?.find((x) => x.candidate.id === chosenId) || null;
    const entry = {
      id: `L-${String((ledger.entries.length || 0) + 1).padStart(4, '0')}`,
      date: isoNow().slice(0, 10),
      project: path.basename(ctx.root),
      brief_hash: decisionDir && exists(path.join(decisionDir, 'brief.md')) ? sha1(readText(path.join(decisionDir, 'brief.md'))).slice(0, 12) : null,
      direction: chosen?.candidate?.thesis || chosenId || null,
      display_face: displayFace,
      body_face: bodyFace,
      accent_hue_bucket: accent ? hueBucket(accent) : null,
      color_strategy: args.strategy || chosen?.params?.color_strategy || design?.uie?.surface_choices?.[0]?.color_strategy || null,
      macrostructure: args.macrostructure ? normalizeMacro(args.macrostructure) : null,
      fold_class: args['fold-class'] || chosen?.params?.fold_class || null,
      layout_family: chosen?.params?.layout_family || null,
      type_pairing_class: chosen?.params?.type_pairing_class || null,
      density: chosen?.params?.density || null,
      motion_character: chosen?.params?.motion_character || null,
      seed: roll?.seed || args.seed || null,
      pinned: args.pinned ? String(args.pinned) : undefined,
    };
    if (!entry.display_face || /</.test(entry.display_face)) throw new UsageError('display face unknown: pass --display-face or fill DESIGN.md typography');
    if (!entry.macrostructure) throw new UsageError('pass --macrostructure "section>section>…" (the planned page structure, e.g. statement>evidence>steps>faq>footer)');
    ledger.entries.push(entry);
    writeJson(p.ledger, ledger);
    if (args.global) {
      const g = readJson(globalPath(), { schema: 'ledger', version: 1, entries: [] });
      g.entries.push({ ...entry, id: `G-${String(g.entries.length + 1).padStart(4, '0')}` });
      writeJson(globalPath(), g);
    }
    appendIndex(ctx.root, `ledger entry ${entry.id}: ${entry.display_face} | ${entry.macrostructure}`);
    const v = ledgerVariety(ledger);
    ctx.result({ entry, variety: v });
    ctx.print(`added ${entry.id}; DEC-04 ${v.ok ? 'pass' : 'fail'}: ${v.detail}`);
    return v.ok ? 0 : 2;
  }
  throw new UsageError(help);
}
