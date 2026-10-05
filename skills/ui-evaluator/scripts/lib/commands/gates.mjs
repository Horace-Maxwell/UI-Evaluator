// uie gates — compute every criterion, gate and the assurance level (QUALITY-BAR §2–§4).
import path from 'node:path';
import { readJson, writeJson, exists } from '../util/fs.mjs';
import { UsageError } from '../util/args.mjs';
import { resolveRun, loadConfig, appendIndex, updateManifest } from '../project.mjs';
import { loadRules, loadData, GATES, GATE_NAMES } from '../gates/rules.mjs';
import { loadInputs, evaluateGates } from '../gates/evaluate.mjs';
import { buildCoverage } from '../gates/coverage.mjs';
import { isoNow } from '../util/time.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'verbose'] };
export const help = `uie gates [--run <id>] [--target L1|L2|L3|L4] [--verbose]

Computes every criterion state (pass, fail, not_run, not_applicable, degraded, waived) from the run's artifacts
and the project files, then each gate (G0–G7) and the assurance level reached. Writes runs/<id>/coverage.json
(the WCAG coverage matrix) and runs/<id>/gates.json. A criterion without its evidence is not_run — never pass.
Exit code 0 when the target level is reached, 2 when it is not.`;

export async function run(args, ctx) {
  const r = resolveRun(ctx.root, args.run);
  const cfg = loadConfig(ctx.root);
  const target = args.target || readJson(path.join(r.dir, 'manifest.json'), {}).target_level || cfg.target_level || 'L3';
  if (!['L1', 'L2', 'L3', 'L4'].includes(target)) throw new UsageError('--target must be L1, L2, L3 or L4');
  const rules = loadRules();
  if (!Object.keys(rules).length) throw new UsageError('assets/data/rules.json is missing or empty (run tools/build-rules.mjs)');
  const I = loadInputs(ctx.root, r.dir);
  // The coverage matrix is computed first, because A11Y-20/21 read it.
  const coverage = buildCoverage(I, loadData('wcag22', { criteria: [] }));
  writeJson(path.join(r.dir, 'coverage.json'), coverage);
  const res = evaluateGates(I, rules, { target });
  const out = { schema: 'gates', run: r.id, computed_at: isoNow(), ...res };
  writeJson(path.join(r.dir, 'gates.json'), out);
  updateManifest(r.dir, { coverage_matrix: { criteria: coverage.counts } });
  appendIndex(ctx.root, `gates for ${r.id}: level ${res.achieved_label} (target ${target})`);
  ctx.result(out);
  ctx.print(`run ${r.id}: level ${res.achieved_label} (target ${target})`);
  for (const g of GATES) {
    const gs = res.gates[g];
    const extra = gs.failing.length ? ` — ${gs.failing.slice(0, 6).join(', ')}${gs.failing.length > 6 ? ' …' : ''}` : '';
    ctx.print(`  ${g} ${GATE_NAMES[g].padEnd(30)} ${gs.state}${extra}`);
  }
  if (args.verbose) {
    for (const [id, c] of Object.entries(res.criteria)) ctx.print(`    ${id.padEnd(8)} ${c.state.padEnd(15)} ${c.detail}`);
  }
  if (res.blocking.length) {
    ctx.print(`blocking for ${target}:`);
    for (const b of res.blocking.slice(0, 15)) ctx.print(`  [${b.level}] ${b.criterion} ${b.state}: ${b.reason}`);
    if (res.blocking.length > 15) ctx.print(`  … ${res.blocking.length - 15} more (see gates.json)`);
  }
  const order = ['L0', 'L1', 'L2', 'L3', 'L4'];
  return order.indexOf(res.achieved) >= order.indexOf(target) ? 0 : 2;
}
