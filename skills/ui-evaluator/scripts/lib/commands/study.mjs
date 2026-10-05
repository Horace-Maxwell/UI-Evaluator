// uie study — study statistics (METHODS §9). Formulas live in lib/study/stats.mjs and lib/study/alpha.mjs.
import path from 'node:path';
import { readText, readJson, writeJson, ensureDir } from '../util/fs.mjs';
import { numOpt, intOpt, list, UsageError } from '../util/args.mjs';
import { parseCsv, hasHeader, toObjects } from '../util/csv.mjs';
import { paths } from '../project.mjs';
import { assertValid } from '../schema.mjs';
import { isoNow } from '../util/time.mjs';
import * as S from '../study/stats.mjs';
import { krippendorffAlpha } from '../study/alpha.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'positive', 'success-only'] };
export const help = `uie study <subcommand> [options] [--save <study-id> [--round <n>]]

Task outcomes
  outcomes --file <observation-sheet.csv> [--critical T1,T2] [--group-column <col>]
                         k of n unassisted successes per task from the sheet's outcome column (success, assisted,
                         failed, abandoned; "not reached" is excluded from n). A task with an intervention counts as assisted.
  ci --successes <x> --n <n> [--task <id>] [--critical]   adjusted-Wald interval for a completion rate
  ci --file <csv> [--column <name>]                        t-interval for a mean of a column of values
  time --file <csv> [--column <name>] [--task <id>] [--success-only]   geometric mean with a log-scale t-interval

Questionnaires
  seq --file <csv> [--column seq] [--task <id>]   single-ease ratings 1–7; mean with t-interval (benchmark ≈ 5.5)
  sus --file <csv> [--variant positive]           ten answers (1–5) per row in questionnaire order; score, CI, grade
  umux --file <csv>                               two UMUX-Lite answers (1–7) per row; SUS-equivalent with CI
  tlx --ratings a,b,c,d,e,f [--weights w1,…,w6]   NASA-TLX raw, or weighted (weights = tallies of 15 pair choices)
  desirability --k <k> --n <n> [--kind on-brand|off-brand]   share choosing ≥ 1 pre-registered word, with CI

Planning
  samplesize --margin 0.15 [--p 0.5]             n to estimate one rate to a margin of error
  discovery --p 0.31 [--n 5] [--target 0.85]     P(problem of rate p seen in n sessions); sessions needed
  ab --baseline 0.05 --delta 0.01 [--power 0.8]  n per variant (16σ²/Δ² rule and exact two-proportion n)
  ab --sd 12 --delta 3 [--power 0.9]             n per variant for a mean

Experiments, RITE and reliability
  srm --observed 50000,49000 [--ratios 1,1] [--threshold 0.001]   sample-ratio mismatch (exit 2 on mismatch)
  rite --p 0.3 --n 6 [--problem <id>] [--found N --fixed M --refixes R]
                         fix confidence 1 − (1 − p)^n (also at p = .10), impact ratio and re-fix ratio
  alpha --file <csv> [--level ordinal|interval|nominal|ratio]   Krippendorff's α; rows = units, columns = raters

CSV input: a header row is detected; pick a column with --column and filter rows with --task (task_id column).
Without a header each row's numbers are read in order. --save merges the result into
.ui-evaluator/studies/<id>/results.json (validated). Formative rounds find problems; they do not estimate rates:
never report SUS or NPS from one as a benchmark.`;

const fmt = (x, d = 2) => (Number.isFinite(x) ? Number(x).toFixed(d) : 'n/a');
const pct = (x) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : 'n/a');
const ci3 = (c) => ({ low: c.low, high: c.high, conf: c.conf });
const isNum = (s) => s !== '' && s !== undefined && s !== null && Number.isFinite(Number(s));

function loadCsv(file) {
  const rows = parseCsv(readText(path.resolve(String(file))));
  if (!rows.length) throw new UsageError(`${file} has no rows`);
  return { rows, header: hasHeader(rows) };
}

/** One column of numbers: --column by name (header) or the single numeric column; filtered by --task. */
function readValues(args, { name = 'value', min = -Infinity, max = Infinity, preferColumns = [] } = {}) {
  if (!args.file) throw new UsageError('give --file <csv>');
  const { rows, header } = loadCsv(args.file);
  let values;
  if (header) {
    const { header: cols, records } = toObjects(rows);
    let recs = records;
    if (args.task) {
      const taskCol = cols.find((c) => /^(task|task_id)$/.test(c));
      if (!taskCol) throw new UsageError('--task needs a task_id column');
      recs = recs.filter((r) => r[taskCol] === String(args.task));
    }
    if (args['success-only']) {
      const oc = cols.find((c) => /^(outcome|success)$/.test(c));
      if (!oc) throw new UsageError('--success-only needs an outcome column');
      recs = recs.filter((r) => /^(success|1|true|yes|unassisted)/i.test(r[oc]));
    }
    // Never guess between columns: a wrong guess (a step number read as a rating) is silent and plausible.
    let col = args.column ? String(args.column).toLowerCase() : cols.find((c) => preferColumns.includes(c));
    if (!col && cols.length === 1) [col] = cols;
    if (!col) throw new UsageError(`pick the ${name} column with --column (columns: ${cols.join(', ')})`);
    if (!cols.includes(col)) throw new UsageError(`no column "${col}" (columns: ${cols.join(', ')})`);
    values = recs.map((r) => r[col]).filter(isNum).map(Number);
  } else {
    values = rows.flatMap((r) => r.filter(isNum).map(Number));
  }
  const bad = values.filter((v) => v < min || v > max);
  if (bad.length) throw new UsageError(`${bad.length} ${name} value(s) outside ${min}–${max}: ${bad.slice(0, 5).join(', ')}`);
  if (!values.length) throw new UsageError(`no ${name} values found`);
  return values;
}

/** Rows of k numbers per respondent (SUS: 10, UMUX-Lite: 2): named item columns, else the last k numbers per row. */
function readMatrix(args, k, { min, max, itemPattern }) {
  if (!args.file) throw new UsageError('give --file <csv>');
  const { rows, header } = loadCsv(args.file);
  let matrix;
  if (header) {
    const { header: cols, records } = toObjects(rows);
    const items = cols.filter((c) => itemPattern.test(c));
    matrix = items.length === k
      ? records.map((r) => items.map((c) => r[c]))
      : records.map((r) => Object.values(r).filter(isNum).slice(-k));
  } else matrix = rows.map((r) => r.filter(isNum).slice(-k));
  const complete = matrix.filter((r) => r.length === k && r.every(isNum)).map((r) => r.map(Number));
  const skipped = matrix.length - complete.length;
  for (const r of complete) {
    if (r.some((v) => v < min || v > max)) throw new UsageError(`answers must be ${min}–${max}; found row ${r.join(',')}`);
  }
  if (!complete.length) throw new UsageError(`no rows with ${k} answers`);
  return { matrix: complete, skipped };
}

// --- task outcomes from the observation sheet ------------------------------------------

const OUTCOME = [
  [/^(success|succeeded|unassisted( success)?|completed|pass(ed)?)$/i, 'success'],
  [/^(assisted|hint(ed)?|with help|helped)$/i, 'assisted'],
  [/^(fail(ed|ure)?|wrong|incorrect)$/i, 'failed'],
  [/^(abandon(ed)?|gave up|give up|quit)$/i, 'abandoned'],
  [/^(not[ _-]?reached|skipped|not attempted|n\/a)$/i, 'not_reached'],
];
const RANK = { failed: 0, abandoned: 0, assisted: 1, success: 2 };

function normOutcome(v) {
  const s = String(v || '').trim();
  if (!s) return null;
  for (const [re, out] of OUTCOME) if (re.test(s)) return out;
  return 'unknown';
}

export function taskOutcomes(records, { critical = [], groupColumn } = {}) {
  const warnings = [];
  const per = new Map(); // task → participant → {outcome, intervention}
  for (const r of records) {
    const task = r.task_id || r.task;
    const who = r.participant_code || r.participant;
    if (!task || !who) continue;
    if (!per.has(task)) per.set(task, new Map());
    const m = per.get(task);
    const cur = m.get(who) || { outcomes: [], intervention: false, group: groupColumn ? r[groupColumn] : 'all' };
    const o = normOutcome(r.outcome);
    if (o) cur.outcomes.push(o);
    if (r.intervention && !/^(no|none|-|0|false)$/i.test(r.intervention)) cur.intervention = true;
    m.set(who, cur);
  }
  const tasks = [];
  const groups = {};
  for (const [task, m] of [...per.entries()].sort((a, b) => a[0].localeCompare(b[0], 'en', { numeric: true }))) {
    let n = 0;
    let successes = 0;
    const counts = { success: 0, assisted: 0, failed: 0, abandoned: 0, not_reached: 0, unrecorded: 0 };
    for (const [who, rec] of m) {
      const known = rec.outcomes.filter((o) => o !== 'unknown');
      if (rec.outcomes.includes('unknown')) warnings.push(`${task}/${who}: unrecognised outcome value (use success, assisted, failed, abandoned or not reached)`);
      if (!known.length) {
        counts.unrecorded += 1;
        continue;
      }
      if (known.every((o) => o === 'not_reached')) {
        counts.not_reached += 1;
        continue;
      }
      const attempted = known.filter((o) => o !== 'not_reached');
      if (new Set(attempted).size > 1) warnings.push(`${task}/${who}: conflicting outcomes (${[...new Set(attempted)].join(', ')}); the most conservative is used`);
      let o = attempted.sort((a, b) => RANK[a] - RANK[b])[0];
      if (o === 'success' && rec.intervention) {
        warnings.push(`${task}/${who}: marked success but an intervention is logged; counted as assisted (interventions are excluded from metrics)`);
        o = 'assisted';
      }
      counts[o] += 1;
      n += 1;
      if (o === 'success') successes += 1;
      groups[rec.group || 'all'] = groups[rec.group || 'all'] || new Set();
      groups[rec.group || 'all'].add(who);
    }
    const entry = { id: task, n, successes, counts };
    if (critical.includes(task)) entry.critical = true;
    if (n > 0) entry.success_ci = ci3(S.adjustedWald(successes, n));
    if (counts.unrecorded) warnings.push(`${task}: ${counts.unrecorded} participant(s) have rows but no outcome on the task's last row`);
    tasks.push(entry);
  }
  const participants_per_group = Object.fromEntries(Object.entries(groups).map(([g, s]) => [g, s.size]));
  return { tasks, participants_per_group, warnings };
}

// --- saving into studies/<id>/results.json ------------------------------------------------

function saveResults(ctx, args, mutate) {
  if (!args.save) return null;
  const id = String(args.save);
  if (!/^[A-Za-z0-9._-]+$/.test(id)) throw new UsageError('--save takes a study id (letters, digits, . _ -)');
  const dir = path.join(paths(ctx.root).studies, id);
  ensureDir(dir);
  const file = path.join(dir, 'results.json');
  const round = args.round ? intOpt(args.round, 'round', { min: 1 }) : undefined;
  const cur = readJson(file, null) || { study: id, round: round || 1 };
  if (round) cur.round = round;
  mutate(cur);
  cur._updated_at = isoNow();
  assertValid('results', cur, 'results.json');
  writeJson(file, cur);
  ctx.info(`saved to ${path.relative(ctx.root, file)}`);
  return file;
}

function upsertTask(results, id, patch) {
  results.tasks = results.tasks || [];
  const t = results.tasks.find((x) => x.id === id);
  if (t) Object.assign(t, patch);
  else results.tasks.push({ id, ...patch });
}

export async function run(args, ctx) {
  const [sub] = args._;
  const done = (obj, lines, mutate) => {
    ctx.result(obj);
    for (const l of [].concat(lines)) if (l) ctx.print(l);
    if (mutate) saveResults(ctx, args, mutate);
    else if (args.save) ctx.warn(`--save is not used by "study ${sub}"`);
    return 0;
  };

  switch (sub) {
    case 'outcomes': {
      if (!args.file) throw new UsageError('give --file <observation-sheet.csv>');
      const { rows, header } = loadCsv(args.file);
      if (!header) throw new UsageError('the observation sheet needs its header row (see templates/observation-sheet.csv)');
      const { header: cols, records } = toObjects(rows);
      for (const need of ['participant_code', 'task_id', 'outcome']) {
        if (!cols.includes(need)) throw new UsageError(`missing column "${need}" (columns: ${cols.join(', ')})`);
      }
      const critical = list(args.critical === true ? undefined : args.critical);
      const groupColumn = args['group-column'] ? String(args['group-column']).toLowerCase() : undefined;
      if (groupColumn && !cols.includes(groupColumn)) throw new UsageError(`no column "${groupColumn}"`);
      const res = taskOutcomes(records, { critical, groupColumn });
      const channels = cols.includes('channel') ? [...new Set(records.map((r) => r.channel).filter(Boolean))] : [];
      const moderated = channels.length && channels.every((c) => /^moderated/i.test(c)) ? true : channels.length && channels.every((c) => /^unmoderated/i.test(c)) ? false : undefined;
      const lines = ['| Task | Unassisted success | 95% CI (adjusted Wald) | Assisted | Failed | Abandoned | Not reached |', '|---|---|---|---|---|---|---|'];
      for (const t of res.tasks) {
        lines.push(`| ${t.id}${t.critical ? ' (critical)' : ''} | ${t.successes} of ${t.n} | ${t.success_ci ? `${pct(t.success_ci.low)}–${pct(t.success_ci.high)}` : 'n/a'} | ${t.counts.assisted} | ${t.counts.failed} | ${t.counts.abandoned} | ${t.counts.not_reached} |`);
      }
      lines.push(`participants per group: ${Object.entries(res.participants_per_group).map(([g, n]) => `${g} ${n}`).join(', ') || 'none'}`);
      for (const w of res.warnings) ctx.warn(w);
      const missingCrit = critical.filter((c) => !res.tasks.some((t) => t.id === c));
      if (missingCrit.length) ctx.warn(`critical task(s) with no rows: ${missingCrit.join(', ')}`);
      return done({ ...res, moderated: moderated ?? null }, lines, (r) => {
        for (const t of res.tasks) {
          const { counts, ...rest } = t;
          upsertTask(r, t.id, { ...rest, outcome_counts: counts });
        }
        r.participants_per_group = res.participants_per_group;
        r.n_total = new Set(records.map((x) => x.participant_code).filter(Boolean)).size;
        if (moderated !== undefined) r.moderated = moderated;
      });
    }
    case 'ci': {
      if (args.file) {
        const vals = readValues(args, { name: 'value' });
        const c = S.meanCI(vals);
        return done(c, `mean ${fmt(c.mean)} (95% CI ${fmt(c.low)}–${fmt(c.high)}), n = ${c.n}`);
      }
      const x = intOpt(args.successes, 'successes', { min: 0 });
      const n = intOpt(args.n, 'n', { min: 1 });
      if (x > n) throw new UsageError('--successes cannot exceed --n');
      const res = S.adjustedWald(x, n, args.conf ? numOpt(args.conf, 'conf', { min: 0.5, max: 0.999 }) : 0.95);
      return done(res, `completion ${x} of ${n} = ${pct(res.p)} (adjusted-Wald ${Math.round(res.conf * 100)}% CI ${pct(res.low)}–${pct(res.high)}); the cross-study median is about 78%.`,
        args.task ? (r) => upsertTask(r, String(args.task), { n, successes: x, success_ci: ci3(res), ...(args.critical ? { critical: true } : {}) }) : null);
    }
    case 'time': {
      const t = readValues(args, { name: 'time', min: Number.MIN_VALUE, preferColumns: ['time_s', 'time', 'seconds', 'duration_s'] });
      const res = S.geometricMeanCI(t);
      const basis = args['success-only'] ? 'success-only' : 'all attempts';
      return done({ ...res, basis }, `time on task (${basis}): geometric mean ${fmt(res.geometric_mean, 1)} s (95% CI ${fmt(res.low, 1)}–${fmt(res.high, 1)}), n = ${res.n}. Report success-only and all-attempt times separately.`,
        args.task ? (r) => upsertTask(r, String(args.task), { time_geomean: res.geometric_mean, time_ci: ci3(res), time_basis: basis, time_n: res.n }) : null);
    }
    case 'seq': {
      const vals = readValues(args, { name: 'SEQ', min: 1, max: 7, preferColumns: ['seq'] });
      const c = S.meanCI(vals);
      const low = vals.filter((v) => v < 5).length;
      return done({ ...c, below_5: low }, `SEQ${args.task ? ` (${args.task})` : ''}: mean ${fmt(c.mean)} (95% CI ${fmt(c.low)}–${fmt(c.high)}), n = ${c.n}; benchmark ≈ 5.5. ${low} rating(s) below 5 — each needs its "why".`,
        args.task ? (r) => upsertTask(r, String(args.task), { seq_mean: c.mean, seq_ci: ci3(c), seq_n: c.n }) : null);
    }
    case 'sus': {
      const positive = args.variant === 'positive' || args.positive === true;
      const { matrix, skipped } = readMatrix(args, 10, { min: 1, max: 5, itemPattern: /^(q|item|sus)_?\d{1,2}$/ });
      const scores = matrix.map((r) => (positive ? r.reduce((a, v) => a + (v - 1), 0) * 2.5 : S.susScore(r)));
      const c = S.meanCI(scores);
      const variant = positive ? 'all-positive' : 'original';
      if (skipped) ctx.warn(`${skipped} incomplete row(s) skipped`);
      return done({ variant, n: c.n, mean: c.mean, ci: ci3(c), grade: S.susGrade(c.mean), scores },
        [`SUS (${variant} wording): mean ${fmt(c.mean, 1)} (95% CI ${fmt(c.low, 1)}–${fmt(c.high, 1)}), n = ${c.n}; Sauro–Lewis grade ${S.susGrade(c.mean)} (norm mean 68).`,
          c.n < 12 ? 'Small sample: the interval is the result. SUS is not a percentage and not diagnostic.' : 'SUS is not a percentage and not diagnostic.'],
        (r) => {
          r.questionnaires = r.questionnaires || {};
          r.questionnaires.sus = { variant, n: c.n, mean: c.mean, ci: ci3(c), grade: S.susGrade(c.mean) };
        });
    }
    case 'umux': {
      const { matrix, skipped } = readMatrix(args, 2, { min: 1, max: 7, itemPattern: /^(umux|item|q)_?\d$/ });
      const eq = matrix.map(([a, b]) => S.umuxLite(a, b).sus_equivalent);
      const c = S.meanCI(eq);
      if (skipped) ctx.warn(`${skipped} incomplete row(s) skipped`);
      return done({ n: c.n, sus_equivalent: c.mean, ci: ci3(c) }, `UMUX-Lite SUS-equivalent: ${fmt(c.mean, 1)} (95% CI ${fmt(c.low, 1)}–${fmt(c.high, 1)}), n = ${c.n}. It is a regression estimate, not a SUS score.`,
        (r) => {
          r.questionnaires = r.questionnaires || {};
          r.questionnaires.umux_lite = { n: c.n, sus_equivalent: c.mean, ci: ci3(c) };
        });
    }
    case 'tlx': {
      const ratings = list(args.ratings).map(Number);
      const weights = args.weights ? list(args.weights).map(Number) : undefined;
      let res;
      try {
        res = S.tlx(ratings, weights);
      } catch (e) {
        throw new UsageError(e.message);
      }
      const value = res.kind === 'raw' ? res.raw : res.weighted;
      return done(res, `NASA-TLX (${res.kind}): ${fmt(value, 1)}. Declare raw or weighted in the report.`, (r) => {
        r.questionnaires = r.questionnaires || {};
        r.questionnaires.tlx = r.questionnaires.tlx || [];
        r.questionnaires.tlx.push({ segment: args.task || null, ...res });
      });
    }
    case 'desirability': {
      const k = intOpt(args.k, 'k', { min: 0 });
      const n = intOpt(args.n, 'n', { min: 1 });
      if (k > n) throw new UsageError('--k cannot exceed --n');
      const kind = args.kind === 'off-brand' ? 'off_brand' : 'on_brand';
      const res = S.desirability(k, n);
      return done(res, `${k} of ${n} chose at least one ${kind === 'on_brand' ? 'on-brand' : 'off-brand'} word: ${pct(res.share)} (95% CI ${pct(res.low)}–${pct(res.high)}); exploratory at this n.`, (r) => {
        r.desirability = r.desirability || {};
        r.desirability[kind] = { k, n, share: res.share, ci: ci3(res) };
      });
    }
    case 'samplesize': {
      const E = numOpt(args.margin, 'margin', { min: 0.01, max: 0.5 });
      const p = args.p ? numOpt(args.p, 'p', { min: 0.01, max: 0.99 }) : 0.5;
      const plain = S.sampleSizeProportion(E, { p });
      const z = S.normalQuantile(0.975);
      const adjusted = Math.max(1, Math.ceil(plain - z * z));
      return done({ margin: E, p, plain, adjusted_wald: adjusted }, `n to estimate a rate to ±${pct(E)} at 95%: ${plain} (Wald formula), about ${adjusted} with the adjusted-Wald interval.`, (r) => {
        r.planning = { ...(r.planning || {}), samplesize: { margin: E, p, plain, adjusted_wald: adjusted } };
      });
    }
    case 'discovery': {
      const p = numOpt(args.p, 'p', { min: 0.001, max: 0.999 });
      if (!args.n && !args.target) throw new UsageError('give --n (sessions) and/or --target (probability)');
      const res = { p };
      const lines = [];
      if (args.n) {
        res.n = intOpt(args.n, 'n', { min: 1 });
        res.probability = S.discoveryProbability(p, res.n);
        lines.push(`P(a problem affecting ${pct(p)} of people is seen at least once in ${res.n} sessions) = ${pct(res.probability)}.`);
      }
      if (args.target) {
        res.target = numOpt(args.target, 'target', { min: 0.01, max: 0.999 });
        res.sessions_needed = S.sessionsNeeded(p, res.target);
        lines.push(`Sessions needed for ${pct(res.target)}: ${res.sessions_needed}.`);
      }
      lines.push('This is a planning figure; never claim a share of all problems found from a formative test.');
      return done(res, lines, (r) => {
        r.planning = { ...(r.planning || {}), discovery: res };
      });
    }
    case 'ab': {
      const delta = numOpt(args.delta, 'delta', { min: 1e-9 });
      const power = args.power ? numOpt(args.power, 'power', { min: 0.5, max: 0.99 }) : 0.8;
      let res;
      let line;
      if (args.baseline !== undefined) {
        const p1 = numOpt(args.baseline, 'baseline', { min: 0.0001, max: 0.9999 });
        if (p1 + delta >= 1) throw new UsageError('baseline + delta must be below 1');
        const rule = S.abSampleSize({ baseline: p1, delta, power });
        const p2 = p1 + delta;
        const pbar = (p1 + p2) / 2;
        const za = S.normalQuantile(0.975);
        const zb = S.normalQuantile(power);
        const exact = Math.ceil(((za * Math.sqrt(2 * pbar * (1 - pbar)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) / (delta * delta));
        res = { ...rule, exact_per_variant: exact, power, baseline: p1, delta };
        line = `n per variant: ${exact} (exact two-proportion, α .05, power ${power}); rule of thumb ${rule.multiplier}σ²/Δ² gives ${rule.per_variant}.`;
      } else {
        if (args.sd === undefined) throw new UsageError('give --baseline (a rate) or --sd (for a mean)');
        const sd = numOpt(args.sd, 'sd', { min: 1e-9 });
        res = { ...S.abSampleSize({ sd, delta, power }), power, sd, delta };
        line = `n per variant: ${res.per_variant} (${res.multiplier}σ²/Δ², power ${power}).`;
      }
      return done(res, [line, 'Pre-register the OEC and guardrails, check SRM, run whole weeks to a fixed horizon, and do not stop early on a peek.'], (r) => {
        r.experiment = { ...(r.experiment || {}), sample_size: res };
      });
    }
    case 'srm': {
      const obs = list(args.observed).map(Number);
      const ratios = args.ratios ? list(args.ratios).map(Number) : obs.map(() => 1);
      if (obs.some((x) => !Number.isInteger(x) || x < 0)) throw new UsageError('--observed takes whole counts');
      const res = S.srm(obs, ratios, args.threshold ? numOpt(args.threshold, 'threshold', { min: 1e-9, max: 0.5 }) : 0.001);
      ctx.result(res);
      ctx.print(`SRM: χ² = ${fmt(res.chi2, 3)}, df = ${res.df}, p = ${res.p.toExponential(2)} → ${res.mismatch ? 'MISMATCH: the experiment is invalid until the cause is found and explained' : 'no mismatch at the threshold'}.`);
      saveResults(ctx, args, (r) => {
        r.experiment = { ...(r.experiment || {}), srm: res, srm_passed: !res.mismatch };
      });
      return res.mismatch ? 2 : 0;
    }
    case 'rite': {
      const p = numOpt(args.p, 'p', { min: 0.001, max: 0.999 });
      const n = intOpt(args.n, 'n', { min: 0 });
      const res = { p, n, confidence: S.discoveryProbability(p, n), confidence_at_p10: S.discoveryProbability(0.1, n) };
      const lines = [`fix confidence after ${n} clean session(s): ${pct(res.confidence)} at p = ${p}; ${pct(res.confidence_at_p10)} at p = .10. A session is clean only if the participant reached the step and the problem did not recur.`];
      if (args.found !== undefined || args.fixed !== undefined) {
        const found = intOpt(args.found, 'found', { min: 1 });
        const fixed = intOpt(args.fixed, 'fixed', { min: 0 });
        const refixes = args.refixes !== undefined ? intOpt(args.refixes, 'refixes', { min: 0 }) : 0;
        res.impact_ratio = fixed / found;
        res.refix_ratio = fixed ? refixes / fixed : null;
        Object.assign(res, { found, fixed, refixes });
        lines.push(`impact ratio ${fixed}/${found} = ${pct(res.impact_ratio)}; re-fix ratio ${fixed ? `${refixes}/${fixed} = ${pct(res.refix_ratio)}` : 'n/a'}.`);
      }
      if (args.save && !args.problem && res.impact_ratio === undefined) {
        ctx.warn('--save stores fix confidence only with --problem <id> and the ratios only with --found/--fixed; nothing new was saved');
      }
      return done(res, lines, (r) => {
        if (args.problem) {
          r.observed_problems = r.observed_problems || [];
          const o = r.observed_problems.find((x) => x.id === String(args.problem));
          if (!o) throw new UsageError(`no observed problem "${args.problem}" in results.json; add it with its description, k and n first`);
          o.retest = { n, clean: n, p, confidence: res.confidence, confidence_at_p10: res.confidence_at_p10 };
        }
        if (res.impact_ratio !== undefined) r.rite = { found: res.found, fixed: res.fixed, refixes: res.refixes, impact_ratio: res.impact_ratio, refix_ratio: res.refix_ratio };
      });
    }
    case 'alpha': {
      if (!args.file) throw new UsageError('give --file <csv> (rows = units, columns = raters; blank = missing)');
      const { rows, header } = loadCsv(args.file);
      const body = header ? rows.slice(1) : rows;
      const data = body.map((r) => r.map((c) => (isNum(c) ? Number(c) : null)));
      const level = args.level ? String(args.level) : 'ordinal';
      let a;
      try {
        a = krippendorffAlpha(data, level);
      } catch (e) {
        throw new UsageError(e.message);
      }
      const pairable = data.filter((r) => r.filter((v) => v !== null).length >= 2).length;
      return done({ alpha: Number.isFinite(a) ? a : null, level, units: pairable },
        Number.isFinite(a)
          ? `Krippendorff's α (${level}) = ${fmt(a, 3)} over ${pairable} unit(s). Below .667 treat the round as calibration: compare assumptions and rate again.`
          : 'α is undefined: fewer than two pairable values, or every rating is identical.',
        args.save ? (r) => {
          r.reliability = { ...(r.reliability || {}), alpha: { value: Number.isFinite(a) ? a : null, level, units: pairable } };
        } : null);
    }
    default:
      throw new UsageError(help);
  }
}
