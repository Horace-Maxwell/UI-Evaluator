// uie run new|list|show — open and inspect runs.
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readJson, exists } from '../util/fs.mjs';
import { UsageError } from '../util/args.mjs';
import { paths, loadConfig, newRun, resolveRun, listRuns, writeManifest, appendIndex } from '../project.mjs';
import { version } from '../cli.mjs';
import { isoNow } from '../util/time.mjs';

export const argSpec = { boolean: ['json', 'quiet'] };
export const help = `uie run new [--label <name>] [--depth quick|standard|rigorous] [--target L1|L2|L3|L4]
uie run list
uie run show [<id>]

"new" freezes the scope (routes, states, matrix) from .ui-evaluator/config.json into a run manifest and makes
the run the default (runs/LATEST) for later commands.`;

function gitInfo(root) {
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().length > 0;
    return { commit, dirty };
  } catch {
    return { commit: null, dirty: null };
  }
}

export async function run(args, ctx) {
  const [sub, id] = args._;
  if (sub === 'new') {
    const cfg = loadConfig(ctx.root, { required: true });
    const depth = args.depth || cfg.depth || 'standard';
    if (!['quick', 'standard', 'rigorous'].includes(depth)) throw new UsageError('--depth must be quick, standard or rigorous');
    const target = args.target || cfg.target_level || 'L3';
    const prior = listRuns(ctx.root).filter((r) => exists(path.join(paths(ctx.root).runs, r, 'merged.json'))).length;
    const r = newRun(ctx.root, { label: args.label || 'run' });
    const git = gitInfo(ctx.root);
    const manifest = {
      run: r.id,
      label: String(args.label || 'run'),
      created_at: isoNow(),
      project_root: ctx.root,
      commit: git.commit,
      dirty: git.dirty,
      content_hash: null,
      depth,
      target_level: target,
      iteration: prior + 1,
      scope: { base_url: cfg.app.base_url, routes: cfg.routes.map((x) => ({ path: x.path, surface: x.surface, mode: x.mode, states: (x.states || []).map((s) => s.name) })), matrix: cfg.matrix, locales: cfg.locales },
      tools: { node: process.version, uie: version() },
      evaluators: [],
      captures: { valid: 0, invalid: 0 },
    };
    writeManifest(r.dir, manifest);
    appendIndex(ctx.root, `run ${r.id} opened (${depth}, target ${target}${git.dirty ? ', working tree has uncommitted changes' : ''})`);
    ctx.result({ run: r.id, dir: r.dir });
    ctx.print(`run ${r.id} → ${path.relative(ctx.root, r.dir)} (depth ${depth}, target ${target}, iteration ${prior + 1})`);
    if (git.dirty) ctx.warn('the working tree has uncommitted changes; the run records the last commit only');
    return 0;
  }
  if (sub === 'list') {
    const runs = listRuns(ctx.root).map((rid) => {
      const dir = path.join(paths(ctx.root).runs, rid);
      const g = readJson(path.join(dir, 'gates.json'), null);
      const m = readJson(path.join(dir, 'manifest.json'), {});
      return { run: rid, label: m.label, depth: m.depth, achieved: g?.achieved_label || null, target: g?.target || m.target_level };
    });
    ctx.result(runs);
    for (const r of runs) ctx.print(`${r.run}  ${r.depth || ''}  ${r.achieved ? `level ${r.achieved}` : 'gates not computed'}  (target ${r.target || '?'})`);
    if (!runs.length) ctx.print('no runs yet.');
    return 0;
  }
  if (sub === 'show') {
    const r = resolveRun(ctx.root, id);
    const m = readJson(path.join(r.dir, 'manifest.json'), {});
    const g = readJson(path.join(r.dir, 'gates.json'), null);
    const checks = readJson(path.join(r.dir, 'checks.json'), { checks: {} }).checks;
    const out = { run: r.id, manifest: m, checks: Object.fromEntries(Object.entries(checks).map(([k, v]) => [k, v.state])), gates: g ? { achieved: g.achieved_label, gates: Object.fromEntries(Object.entries(g.gates).map(([k, v]) => [k, v.state])) } : null };
    ctx.result(out);
    ctx.print(`run ${r.id} (${m.depth}, target ${m.target_level})`, `checks: ${Object.entries(out.checks).map(([k, v]) => `${k}=${v}`).join(' ') || 'none'}`, g ? `gates: ${Object.entries(out.gates.gates).map(([k, v]) => `${k}=${v}`).join(' ')}; level ${out.gates.achieved}` : 'gates: not computed');
    return 0;
  }
  throw new UsageError(help);
}
