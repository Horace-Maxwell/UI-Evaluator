// uie lint — static source scan (ARCHITECTURE §7.2): hard tells, token drift, motion rules, a11y source rules,
// IME guard, CJK font stacks, restricted fonts and copy tells. Zero dependencies (Node standard library only).
import path from 'node:path';
import { list, UsageError } from '../util/args.mjs';
import { readJson, writeJson, readJsonl, writeJsonl, exists } from '../util/fs.mjs';
import { isoNow } from '../util/time.mjs';
import { resolveRun, updateManifest, readManifest } from '../project.mjs';
import { version } from '../cli.mjs';
import { discoverFiles, loadProjectContext } from '../lint/files.mjs';
import { lint, ruleFilter, RULE_META, FAMILIES, GATE_CRITERIA } from '../lint/index.mjs';

export const argSpec = {
  boolean: ['json', 'quiet', 'record', 'all'],
  multi: ['changed', 'rules'],
};

export const help = `uie lint [paths…] [--changed <file>] [--rules a,b] [--run <id> | --record] [--json] [--all]

Static source scan of UI files (${'.css .scss .less .html .jsx .tsx .js .ts .vue .svelte .astro .mdx'}).
With no paths it scans the project's UI files (build, dependency, test and story folders are skipped).

  paths…            files or folders to lint (default: the whole project)
  --changed <file>  lint one edited file with every rule (repeatable); use after each UI edit
  --rules a,b       only these rule IDs or families (${Object.keys(FAMILIES).join(', ')})
  --record          append the hits to the latest run's tool-findings.jsonl and record checks.lint
  --run <id>        record into this run instead of LATEST (implies --record)
  --all             list every location (default: 6 per rule)
  --json            machine-readable result

Rules: gate-level (fail a gate when present): ${Object.values(RULE_META).filter((r) => r.level === 'gate').map((r) => r.id).join(', ')}.
Soft tells (need a disposition): ${Object.values(RULE_META).filter((r) => r.level === 'soft').map((r) => r.id).join(', ')}.
Advisory (reported, never gating): ${Object.values(RULE_META).filter((r) => r.level === 'advisory').map((r) => r.id).join(', ')}.
Possible (experimental tells, never counted toward G4): ${Object.values(RULE_META).filter((r) => r.level === 'possible').map((r) => r.id).join(', ') || 'none'}.
COL-01 and LAY-01 are shares (≥ 90%): their literals are listed only when the share falls below 90%.
Tells listed in DESIGN.md ui-evaluator.accepted_tells are reported as requested (never SLP-12 or SLP-13).

Exit codes: 0 no gate-level hits · 2 gate-level hits found · 1 could not run (bad path, unknown rule, a rule crashed).`;

const LEVEL_TITLES = {
  gate: 'Gate-level (fix, or for G3/G4 criteria ask the owner for a waiver)',
  soft: 'Soft tells (each needs a disposition: fixed, accepted with a reason, or disputed)',
  advisory: 'Advisory (reported, never gating)',
  possible: 'Possible (experimental tells; never counted)',
};

/**
 * Resolve once everything written to stdout so far has reached the OS. uie.mjs calls process.exit() as soon as run()
 * returns, which drops output still queued on a pipe (a large --json result was cut at 64 KB).
 */
/** A reader that stops early (`uie lint | head`) closes the pipe: stop quietly with the verdict instead of crashing. */
function guardPipe() {
  if (process.stdout.listenerCount('error')) return;
  process.stdout.on('error', (err) => {
    if (err && err.code === 'EPIPE') process.exit(process.exitCode ?? 0);
  });
}

function flushStdout() {
  return new Promise((resolve) => {
    try {
      if (process.stdout.write('', () => resolve())) setImmediate(resolve);
    } catch {
      resolve();
    }
  });
}

function loc(h) {
  const s = h.locations[0].source;
  return `${s.file}${s.line ? `:${s.line}${s.col ? `:${s.col}` : ''}` : ''}`;
}

function recordRun(run, res, info) {
  const jsonl = path.join(run.dir, 'tool-findings.jsonl');
  const kept = exists(jsonl) ? readJsonl(jsonl).filter((h) => !(h.found_by || []).some((b) => b.check === 'lint')) : [];
  const fresh = res.hits.filter((h) => h.level !== 'possible');
  writeJsonl(jsonl, [...kept, ...fresh]);
  const checksPath = path.join(run.dir, 'checks.json');
  const doc = readJson(checksPath, { checks: {} });
  doc.checks = doc.checks || {};
  const crashed = res.errors.filter((e) => e.family);
  doc.checks.lint = {
    state: 'ran',
    at: isoNow(),
    partial: info.explicit || !!info.rules || crashed.length > 0,
    coverage: { files: res.files, routes: [], states: [], widths: [], themes: [] },
    engine: { name: 'uie-lint', version: info.version },
    hits: fresh.length,
    errors: res.errors.slice(0, 20).map((e) => `${e.file || ''}${e.family ? ` [${e.family}]` : ''}: ${e.error}`),
    criteria: info.rules ? GATE_CRITERIA.filter((id) => info.rules.want.has(id) || info.rules.want.has(RULE_META[id].family)) : GATE_CRITERIA,
    summary: res.summary,
    truncated: res.truncated,
    metrics: res.metrics,
    cjk_detected: res.cjk_detected,
    families_by_type: res.families_by_type,
    possible: res.hits.filter((h) => h.level === 'possible').map((h) => ({ id: h.criteria[0].id, at: loc(h), title: h.title })).slice(0, 50),
  };
  doc.updated_at = isoNow();
  writeJson(checksPath, doc);
  if (readManifest(run.dir)) updateManifest(run.dir, { tools: { 'uie-lint': info.version } });
  return { run: run.id, appended: fresh.length, replaced: true, tool_findings: jsonl, checks: checksPath };
}

export async function run(args, ctx) {
  const root = ctx.root;
  const changed = list(args.changed);
  const given = [...args._.map(String), ...changed];
  const rulesList = list(args.rules);
  const filter = ruleFilter(rulesList);
  if (filter && filter.unknown.length) throw new UsageError(`unknown rule or family: ${filter.unknown.join(', ')}. Known families: ${Object.keys(FAMILIES).join(', ')}; rules: ${Object.keys(RULE_META).join(', ')}`);
  const found = discoverFiles(root, { paths: given, cwd: process.cwd() });
  if (found.missing.length) throw new UsageError(`path not found: ${found.missing.join(', ')}`);
  const project = await loadProjectContext(root);
  const v = version();
  const res = lint({ root, files: found.files, fonts: found.fonts, project, rules: filter, version: v });

  let recorded = null;
  if (args.record || args.run) {
    // `--run <id>` implies --record; a bare `--run` records into the latest run.
    const r = resolveRun(root, args.run && args.run !== true ? String(args.run) : 'latest');
    recorded = recordRun(r, res, { explicit: found.explicit, rules: filter, version: v });
  }

  const crashed = res.errors.filter((e) => e.family);
  const gate = res.summary.gate;
  process.exitCode = crashed.length ? 1 : gate ? 2 : 0;
  guardPipe();
  const out = {
    root,
    files: res.files,
    skipped: found.skipped,
    summary: res.summary,
    metrics: res.metrics,
    truncated: res.truncated,
    cjk_detected: res.cjk_detected,
    families_by_type: res.families_by_type,
    errors: res.errors,
    recorded,
    duration_ms: res.duration_ms,
    hits: res.hits,
  };
  ctx.result(out);
  if (!ctx.json) {
    const s = res.summary;
    ctx.print(`uie lint: ${res.files} UI file${res.files === 1 ? '' : 's'} — ${s.gate} gate-level, ${s.soft} soft tell${s.soft === 1 ? '' : 's'}, ${s.advisory} advisory, ${s.possible} possible${s.requested ? `, ${s.requested} requested in DESIGN.md` : ''} (${res.duration_ms} ms)`);
    for (const id of ['COL-01', 'LAY-01']) {
      const m = res.metrics[id];
      if (m) ctx.print(`  ${id} share: ${m.conforming}/${m.total} = ${Math.round(m.share * 100)}% (threshold 90%)${m.share >= 0.9 ? ' — passes' : ' — below threshold'}`);
    }
    if (!res.files) ctx.print('  no UI files found; nothing to lint.');
    const groups = new Map();
    res.hits.forEach((h, i) => {
      const id = res.raws[i].id;
      const level = h.requested ? 'requested' : h.level;
      const key = `${level}|${id}`;
      if (!groups.has(key)) groups.set(key, { level, id, hits: [] });
      groups.get(key).hits.push({ h, raw: res.raws[i] });
    });
    const max = args.all ? Infinity : 6;
    for (const level of ['gate', 'soft', 'advisory', 'possible']) {
      const gs = [...groups.values()].filter((g) => g.level === level);
      if (!gs.length) continue;
      ctx.print('', LEVEL_TITLES[level]);
      for (const g of gs) {
        const meta = RULE_META[g.id];
        ctx.print(`  ${g.id} ×${g.hits.length}${res.truncated[g.id] ? ` (+${res.truncated[g.id]} more)` : ''}  ${meta.title} → ${meta.fix}`);
        for (const { h, raw } of g.hits.slice(0, max)) ctx.print(`    ${loc(h)}  ${raw.message}`);
        if (g.hits.length > max) ctx.print(`    … ${g.hits.length - max} more (--all, or --json)`);
      }
    }
    const req = [...groups.values()].filter((g) => g.level === 'requested');
    if (req.length) ctx.print('', 'Requested in DESIGN.md accepted_tells (reported, not failures)', ...req.map((g) => `  ${g.id} ×${g.hits.length}  ${g.hits[0].h.requested.reason}`));
    if (found.skipped.length && !ctx.quiet) ctx.print('', `Skipped ${found.skipped.length} file(s): ${found.skipped.slice(0, 5).map((x) => `${x.path} (${x.reason})`).join('; ')}${found.skipped.length > 5 ? ' …' : ''}`);
    if (res.errors.length) ctx.print('', `${res.errors.length} parse or rule error(s); coverage is partial:`, ...res.errors.slice(0, 5).map((e) => `  ${e.file || ''}${e.family ? ` [${e.family}]` : ''}: ${String(e.error).slice(0, 160)}`));
    if (recorded) ctx.print('', `Recorded ${recorded.appended} hit(s) into run ${recorded.run} (tool-findings.jsonl, checks.json → lint).`);
    if (crashed.length) ctx.print('', `Exit 1: ${crashed.length} rule famil${crashed.length === 1 ? 'y' : 'ies'} crashed, so the scan is incomplete; the hits above are partial.`);
    else if (gate) ctx.print('', 'Exit 2: gate-level hits. Fix each by deciding (see the hint), then re-run `uie lint --changed <file>`.');
  }
  await flushStdout();
  // A crashed rule family means the scan is incomplete: report "could not run" rather than a verdict.
  if (crashed.length) return 1;
  if (gate) return 2;
  return 0;
}
