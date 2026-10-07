// uie findings — the findings lifecycle (ARCHITECTURE §7.2, §8.3).
import path from 'node:path';
import { readJson, writeJson, exists, listDir, readJsonl, isDir } from '../util/fs.mjs';
import { list, intOpt, UsageError } from '../util/args.mjs';
import { validate, loadSchema, guessSchema } from '../schema.mjs';
import { paths, resolveRun, readRegister, writeRegister, readDismissals, appendIndex, updateManifest } from '../project.mjs';
import { mergeRun, acceptProposals, readJudgedOutputs } from '../findings/merge.mjs';
import { applyVerifierVerdicts, applyRatings, applyFixReview, promote, addDismissal } from '../findings/register.mjs';
import { setStatus, buildQueue, primaryCriterion, STATUSES, applyPriorityPolicy } from '../findings/core.mjs';
import { anyTwoAgreement, discoveryEstimate } from '../study/stats.mjs';
import { loadRules } from '../gates/rules.mjs';
import { truncate } from '../util/text.mjs';

export const argSpec = {
  boolean: ['json', 'quiet', 'divergent', 'fix-review', 'apply-locate', 'all', 'held', 'force'],
  multi: ['file', 'drop-criterion', 'add-criterion'],
};

export const help = `uie findings <subcommand> [options]

  validate <file...> [--schema <name>]   validate JSON files against their schema (guessed from shape)
  merge [--run <id>]                      merge tool findings and judged candidates → runs/<id>/merged.json
        [--accept P1,P3]                  apply merge proposals (true duplicates only)
        [--apply-locate]                  attach code-reviewer source locations and ease-of-fix estimates
  apply-verdicts [--run <id>]             apply runs/<id>/verifier.json to merged findings
        [--fix-review]                    apply runs/<id>/fix-review.json to the register instead
  rate [--run <id>] [--iteration <n>]     aggregate blind ratings from runs/<id>/ratings/*.json
  agreement [--run <id>]                  any-two agreement, detection counts, undiscovered-problem estimate
  promote [--run <id>]                    copy the run's findings into .ui-evaluator/findings.json
  queue                                   the fix queue from the register (priority → layer → ease → frequency)
  list [--status a,b] [--priority P0,P1] [--divergent] [--held] [--q text] [--run <id>]
  show <id> [--run <id>]
  set <id> [--status s] [--ease 1-4] [--criticality c] [--note text] [--by who] [--attempt] [--run <id>]
         [--add-criterion kind:id] [--drop-criterion id]   correct a mis-cited criterion (kept in criteria_history;
                                                             dropping a WCAG criterion needs --by human:<name>)
  dismiss <id> --reason <text> --by human:<name>
  link <id> --feedback FB-0001,FB-0002

Statuses: ${STATUSES.join(', ')}.
Only a human may set "resolved" (use --by human:<name>).`;

function mergedPath(runDir) {
  return path.join(runDir, 'merged.json');
}

function loadMerged(runDir) {
  const p = mergedPath(runDir);
  if (!exists(p)) throw new UsageError(`no merged.json in ${runDir}. Run \`uie findings merge\` first.`);
  return readJson(p);
}

function saveMerged(runDir, doc) {
  writeJson(mergedPath(runDir), doc);
}

function fmtFinding(f) {
  const sev = f.severity?.mean !== undefined && f.severity?.mean !== null ? ` sev ${f.severity.mean}${f.severity.divergent ? ' (divergent)' : ''}` : '';
  const pr = f.priority ? ` ${f.priority}` : '';
  return `${f.id}${pr} [${f.status}]${sev} ${primaryCriterion(f).id} — ${truncate(f.title, 90)}`;
}

export async function run(args, ctx) {
  const [sub, ...rest] = args._;
  const p = paths(ctx.root);
  switch (sub) {
    case 'validate': {
      // A directory stands for the JSON files directly inside it (e.g. runs/<id>/panel/).
      const files = [...rest, ...(args.file || [])].flatMap((f) => {
        const full = path.resolve(f);
        if (!isDir(full)) return [f];
        return listDir(full).filter((n) => n.endsWith('.json')).sort().map((n) => path.join(f, n));
      });
      if (!files.length) throw new UsageError('give at least one file (or a directory of .json files) to validate');
      let bad = 0;
      const results = [];
      for (const f of files) {
        const full = path.resolve(f);
        const doc = readJson(full);
        const name = args.schema || guessSchema(doc, full);
        if (!name) {
          results.push({ file: f, ok: false, errors: [{ path: '$', message: 'could not tell which schema applies; pass --schema <name>' }] });
          bad += 1;
          continue;
        }
        const res = validate(loadSchema(name), doc);
        results.push({ file: f, schema: name, ok: res.valid, errors: res.errors });
        if (!res.valid) bad += 1;
      }
      ctx.result(results);
      for (const r of results) {
        ctx.print(`${r.ok ? 'ok ' : 'BAD'} ${r.file}${r.schema ? ` (${r.schema})` : ''}`);
        for (const e of (r.errors || []).slice(0, 15)) ctx.print(`    ${e.path}: ${e.message}`);
      }
      return bad ? 2 : 0;
    }

    case 'merge': {
      const r = resolveRun(ctx.root, args.run);
      if (args.accept) {
        const doc = loadMerged(r.dir);
        const { removed } = acceptProposals(doc, list(args.accept));
        saveMerged(r.dir, doc);
        ctx.result({ removed });
        ctx.print(`merged ${removed.length} duplicate(s) into their first member; ${doc.findings.length} findings remain.`);
        return 0;
      }
      if (args['apply-locate']) {
        const doc = loadMerged(r.dir);
        const n = applyLocate(r.dir, doc);
        saveMerged(r.dir, doc);
        ctx.result(n);
        ctx.print(`attached ${n.locations} source location(s) and ${n.ease} ease-of-fix estimate(s).`);
        return 0;
      }
      // Invalid judged output never enters the merge silently (EVD-01): fix it, or skip it explicitly with --force.
      const invalid = [];
      for (const o of readJudgedOutputs(r.dir)) {
        const name = guessSchema(o.doc, o.file);
        if (!name) continue;
        const v = validate(loadSchema(name), o.doc);
        if (!v.valid) invalid.push({ file: path.relative(ctx.root, o.file), schema: name, errors: v.errors.slice(0, 4).map((e) => `${e.path}: ${e.message}`) });
      }
      if (invalid.length) {
        for (const i of invalid) ctx.warn(`${i.file} does not match ${i.schema}: ${i.errors.join('; ')}`);
        if (!args.force) {
          ctx.print(`${invalid.length} output file(s) are invalid; fix them (uie findings validate <file>) or pass --force to merge without them.`);
          return 2;
        }
      }
      const rules = loadRules();
      const reg = readRegister(ctx.root);
      const previous = exists(mergedPath(r.dir)) ? readJson(mergedPath(r.dir)).findings || [] : [];
      const res = mergeRun(r.dir, { rules, register: reg, skip: new Set(invalid.map((i) => path.resolve(ctx.root, i.file))), previous });
      if (previous.some((f) => f.status !== 'candidate')) ctx.warn('re-merged: statuses start again from candidate; re-apply verifier verdicts and ratings (uie findings apply-verdicts, rate)');
      const doc = { schema: 'merged', run: r.id, created_at: new Date().toISOString(), inputs: res.inputs, findings: res.findings, proposals: res.proposals };
      applyLocate(r.dir, doc, { quiet: true });
      for (const f of doc.findings) delete f._tmp;
      saveMerged(r.dir, doc);
      // Reserve IDs in the register counter so later runs never reuse them.
      reg.next_id = Math.max(reg.next_id || 1, res.next_id);
      writeRegister(ctx.root, reg);
      // Record what each judged role reported about its own model and isolation (EVD-07).
      const outs = readJudgedOutputs(r.dir);
      const man = readJson(path.join(r.dir, 'manifest.json'), {});
      const ev = man.evaluators || [];
      for (const o of outs) {
        const i = ev.findIndex((e) => e.agent === o.agent);
        const patch = { role: o.role, agent: o.agent, ...(o.model ? { model: o.model } : {}), ...(o.isolation ? { isolation: o.isolation } : {}) };
        if (i >= 0) ev[i] = { ...ev[i], ...patch };
        else ev.push({ provider: 'unknown', model: o.model || 'unknown', isolation: o.isolation || 'unknown', ...patch });
      }
      updateManifest(r.dir, { evaluators: ev, merge: { at: doc.created_at, ...res.inputs, proposals: res.proposals.length } });
      ctx.result({ run: r.id, ...res.inputs, proposals: res.proposals.length });
      ctx.print(
        `merged run ${r.id}: ${res.inputs.tool_findings} deterministic finding(s) from ${res.inputs.tool_hits} hit(s); ` +
          `${res.inputs.merged_judged} judged candidate(s) from ${res.inputs.judged_candidates} across ${res.inputs.judged_outputs} output(s).`,
        `${res.proposals.length} merge proposal(s) to review in merged.json (accept true duplicates with --accept).`,
      );
      return 0;
    }

    case 'apply-verdicts': {
      const r = resolveRun(ctx.root, args.run);
      if (args['fix-review']) {
        const frPath = path.join(r.dir, 'fix-review.json');
        if (!exists(frPath)) throw new UsageError(`no fix-review.json in ${r.dir}`);
        const frDoc = readJson(frPath);
        const frCheck = validate(loadSchema('fix-review'), frDoc);
        if (!frCheck.valid) throw new UsageError(`fix-review.json is invalid: ${frCheck.errors.slice(0, 3).map((e) => `${e.path} ${e.message}`).join('; ')}`);
        const reg = readRegister(ctx.root);
        const out = applyFixReview(reg.findings, frDoc);
        recordSelfReport(r.dir, { role: 'fix-reviewer', agent: frDoc.agent, model: frDoc.model, isolation: frDoc.isolation });
        writeRegister(ctx.root, reg);
        appendIndex(ctx.root, `fix review applied from run ${r.id}: ${JSON.stringify(out.counts)}; disposition ${out.disposition}`);
        ctx.result(out);
        ctx.print(`fix review: ${Object.entries(out.counts).map(([k, v]) => `${k} ${v}`).join(', ')}; disposition: ${out.disposition}`);
        if (out.overridden) ctx.warn('the review said "ship" with partially fixed or unfixed items; disposition changed to "fix" (IMP-040)');
        if (out.held.length) {
          ctx.warn(`${out.held.length} confirmed_fixed verdict(s) left at "fixed", not verified (ADR-030):`);
          for (const h of out.held.slice(0, 20)) ctx.warn(`  ${h.id}: ${h.reason}`);
          if (!out.independent) ctx.warn('report this review under the DEGRADED: single-context banner');
        }
        if (out.regressions.length) ctx.print(`regressions: ${out.regressions.map((x) => x.title || x).join('; ')}`);
        return out.disposition === 'ship' ? 0 : 2;
      }
      const vPath = path.join(r.dir, 'verifier.json');
      if (!exists(vPath)) throw new UsageError(`no verifier.json in ${r.dir}`);
      const doc = loadMerged(r.dir);
      const blind = readJson(path.join(r.dir, 'packets', '.blind-map-verifier.json'), {});
      const vdoc = readJson(vPath);
      for (const v of vdoc.verdicts || []) {
        const key = v.candidate_id || v.finding_id || v.id;
        if (blind[key]) v.candidate_id = blind[key];
      }
      const counts = applyVerifierVerdicts(doc.findings, vdoc, { dismissals: readDismissals(ctx.root) });
      saveMerged(r.dir, doc);
      recordSelfReport(r.dir, { role: 'finding-verifier', agent: vdoc.agent, model: vdoc.model, isolation: vdoc.isolation });
      ctx.result(counts);
      ctx.print(`verifier verdicts applied: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
      return 0;
    }

    case 'rate': {
      const r = resolveRun(ctx.root, args.run);
      const doc = loadMerged(r.dir);
      const dir = path.join(r.dir, 'ratings');
      const docs = listDir(dir)
        .filter((n) => n.endsWith('.json'))
        .map((n) => readJson(path.join(dir, n)));
      // Each batch of raters has its own blind map. Earlier batches sit in ratings/batch-<n>/ with theirs (`uie packet`
      // moves them there before a new batch); a finding takes its ratings from the latest batch that rated it.
      const batches = listDir(dir)
        .filter((n) => /^batch-\d+$/.test(n) && isDir(path.join(dir, n)))
        .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))
        .map((n) => ({ map: readJson(path.join(dir, n, 'blind-map.json'), {}), docs: listDir(path.join(dir, n)).filter((f) => f.endsWith('.json') && f !== 'blind-map.json').map((f) => readJson(path.join(dir, n, f))) }));
      batches.push({ map: readJson(path.join(r.dir, 'packets', '.blind-map-raters.json'), {}), docs });
      if (!batches.some((b) => b.docs.length)) throw new UsageError(`no rating files in ${dir}`);
      const latest = new Map();
      batches.forEach((b, i) => b.docs.forEach((d) => (d.ratings || []).forEach((x) => latest.set(b.map[x.finding_id] || x.finding_id, i))));
      const decoded = batches.flatMap((b, i) => b.docs.map((d) => ({ ...d, ratings: (d.ratings || []).map((x) => ({ ...x, finding_id: b.map[x.finding_id] || x.finding_id })).filter((x) => latest.get(x.finding_id) === i) })));
      const iteration = args.iteration ? intOpt(args.iteration, 'iteration', { min: 1 }) : inferIteration(ctx.root);
      const { rated } = applyRatings(doc.findings, decoded, { iteration });
      for (const d of docs) recordSelfReport(r.dir, { role: 'severity-rater', agent: d.rater, model: d.model, isolation: d.isolation });
      // Deterministic findings keep rule severity; make sure their priority policy is applied.
      for (const f of doc.findings) if (f.severity?.source === 'rule') applyPriorityPolicy(f);
      saveMerged(r.dir, doc);
      const divergent = doc.findings.filter((f) => f.severity?.divergent).length;
      const held = doc.findings.filter((f) => f.held).length;
      ctx.result({ rated, raters: docs.length, divergent, held });
      ctx.print(`rated ${rated} finding(s) from ${docs.length} rater file(s); ${divergent} divergent, ${held} held (HCI-029).`);
      if (docs.length < 3) ctx.warn(`only ${docs.length} rater(s): severities are provisional (USE-04 needs ≥ 3).`);
      return 0;
    }

    case 'agreement': {
      const r = resolveRun(ctx.root, args.run);
      const doc = loadMerged(r.dir);
      const outputs = readJudgedOutputs(r.dir).filter((o) => o.role === 'heuristic-evaluator');
      const sets = outputs.map((o) => new Set(doc.findings.filter((f) => (f.found_by || []).some((b) => b.agent === o.agent)).map((f) => f.id)));
      const agree = anyTwoAgreement(sets);
      const judged = doc.findings.filter((f) => f.severity?.source !== 'rule' && f.status !== 'rejected');
      const heCounts = judged
        .map((f) => new Set((f.found_by || []).filter((b) => outputs.some((o) => o.agent === b.agent)).map((b) => b.agent)).size)
        .filter((k) => k > 0);
      const est = discoveryEstimate(heCounts, outputs.length);
      const out = { run: r.id, heuristic_passes: outputs.length, any_two_agreement: agree, discovery: est, detection: judged.map((f) => ({ id: f.id, k: f.detection?.k, n: f.detection?.n })) };
      writeJson(path.join(r.dir, 'agreement.json'), out);
      ctx.result(out);
      ctx.print(
        `heuristic passes: ${outputs.length}; any-two agreement ${Number.isFinite(agree.mean) ? `${Math.round(agree.mean * 100)}%` : 'n/a'} (human baseline 5–65%).`,
        Number.isFinite(est.estimated_total) ? `found ${est.found}; estimated total ≈ ${est.estimated_total.toFixed(1)} (${est.label}).` : 'not enough passes for a discovery estimate.',
      );
      return 0;
    }

    case 'promote': {
      const r = resolveRun(ctx.root, args.run);
      const doc = loadMerged(r.dir);
      const reg = readRegister(ctx.root);
      const out = promote(reg, doc.findings, r.id);
      writeRegister(ctx.root, out.register);
      writeJson(path.join(r.dir, 'findings.json'), { schema: 'run-findings', run: r.id, findings: doc.findings.filter((f) => f.status !== 'candidate') });
      appendIndex(ctx.root, `run ${r.id}: promoted ${out.added} new and ${out.updated} updated finding(s) into the register`);
      ctx.result({ added: out.added, updated: out.updated });
      ctx.print(`register: ${out.added} new, ${out.updated} updated (${out.register.findings.length} total).`);
      const pending = doc.findings.filter((f) => f.status === 'candidate').length;
      if (pending) ctx.warn(`${pending} candidate(s) were not verified and were left out of the register.`);
      return 0;
    }

    case 'queue': {
      const reg = readRegister(ctx.root);
      const q = buildQueue(reg.findings);
      ctx.result(q);
      if (!q.length) ctx.print(`the fix queue is empty. ${emptyQueueReason(ctx.root, reg)}`);
      for (const item of q) {
        ctx.print(`${item.fix_now ? 'now ' : 'debt'} ${item.id} ${item.priority} ${item.layer.padEnd(10)} ease ${item.ease_of_fix ?? '?'}  ${item.criterion}  ${truncate(item.title, 80)}`);
      }
      return 0;
    }

    case 'list': {
      const source = args.run ? loadMerged(resolveRun(ctx.root, args.run).dir).findings : readRegister(ctx.root).findings;
      const statuses = list(args.status);
      const prios = list(args.priority);
      const q = args.q ? String(args.q).toLowerCase() : null;
      const items = source.filter(
        (f) =>
          (!statuses.length || statuses.includes(f.status)) &&
          (!prios.length || prios.includes(f.priority)) &&
          (!args.divergent || f.severity?.divergent) &&
          (!args.held || f.held) &&
          (!q || `${f.title} ${f.description} ${primaryCriterion(f).id}`.toLowerCase().includes(q)),
      );
      ctx.result(items);
      for (const f of items) ctx.print(fmtFinding(f));
      if (!items.length) ctx.print('no findings match.');
      return 0;
    }

    case 'show': {
      const id = rest[0];
      if (!id) throw new UsageError('give a finding id');
      const source = args.run ? loadMerged(resolveRun(ctx.root, args.run).dir).findings : readRegister(ctx.root).findings;
      const f = source.find((x) => x.id === id);
      if (!f) throw new UsageError(`finding ${id} not found`);
      ctx.result(f);
      ctx.print(JSON.stringify(f, null, 2));
      return 0;
    }

    case 'set': {
      const id = rest[0];
      if (!id) throw new UsageError('give a finding id');
      const useRun = !!args.run;
      const container = useRun ? loadMerged(resolveRun(ctx.root, args.run).dir) : readRegister(ctx.root);
      const f = container.findings.find((x) => x.id === id);
      if (!f) throw new UsageError(`finding ${id} not found in ${useRun ? 'the run' : 'the register'}`);
      const by = args.by ? String(args.by) : 'lead';
      if (args.ease !== undefined) f.ease_of_fix = intOpt(args.ease, 'ease', { min: 1, max: 4 });
      if (args.criticality) {
        if (!['critical', 'core', 'peripheral'].includes(args.criticality)) throw new UsageError('--criticality must be critical, core or peripheral');
        f.criticality = args.criticality;
        applyPriorityPolicy(f);
      }
      if (args.note) f.notes = [...(f.notes || []), { at: new Date().toISOString(), by, note: String(args.note) }];
      if (args.attempt) f.attempts = (f.attempts || 0) + 1;
      // Correcting a mis-cited criterion. Dropping a WCAG criterion changes what G2 counts, so only a person may do it.
      for (const spec of list(args['drop-criterion'])) {
        const c = (f.criteria || []).find((x) => x.id === spec);
        if (!c) throw new UsageError(`${id} does not cite ${spec}`);
        if (c.kind === 'wcag' && !by.startsWith('human:')) throw new UsageError(`dropping a WCAG criterion changes G2: pass --by human:<name> and a --note with the reason`);
        if ((f.criteria || []).length === 1) throw new UsageError(`${spec} is ${id}'s only criterion; add the right one first (--add-criterion kind:id)`);
        f.criteria = f.criteria.filter((x) => x !== c);
        if (c.primary) f.criteria[0] = { ...f.criteria[0], primary: true };
        f.criteria_history = [...(f.criteria_history || []), { at: new Date().toISOString(), by, dropped: c, note: args.note ? String(args.note) : null }];
      }
      for (const spec of list(args['add-criterion'])) {
        const m = /^(heuristic|wcag|rule|cw):(.+)$/.exec(spec);
        if (!m) throw new UsageError(`--add-criterion takes kind:id, e.g. rule:CMP-01, wcag:1.3.1, heuristic:H5`);
        if (!(f.criteria || []).some((x) => x.kind === m[1] && x.id === m[2])) f.criteria = [...(f.criteria || []), { kind: m[1], id: m[2], primary: !(f.criteria || []).length }];
        f.criteria_history = [...(f.criteria_history || []), { at: new Date().toISOString(), by, added: { kind: m[1], id: m[2] } }];
      }
      if (args.status) {
        if (String(args.status) === 'verified' && !by.startsWith('human:')) {
          throw new UsageError('verified needs evidence the fixer did not produce (ADR-030): a fix reviewer\'s confirmed_fixed (uie findings apply-verdicts --fix-review), a clean re-run of the deterministic check (uie diff), or a human (--by human:<name>). Your own re-test moves a finding to fixed.');
        }
        try {
          setStatus(f, String(args.status), { by, note: args.note ? String(args.note) : undefined });
        } catch (e) {
          throw new UsageError(e.message);
        }
      }
      if (useRun) saveMerged(resolveRun(ctx.root, args.run).dir, container);
      else writeRegister(ctx.root, container);
      ctx.result(f);
      ctx.print(fmtFinding(f));
      return 0;
    }

    case 'dismiss': {
      const id = rest[0];
      if (!id || !args.reason) throw new UsageError('usage: uie findings dismiss <id> --reason <text> --by human:<name>');
      const by = String(args.by || '');
      if (!by.startsWith('human:')) throw new UsageError('dismissals are human decisions: pass --by human:<name>');
      const reg = readRegister(ctx.root);
      const f = reg.findings.find((x) => x.id === id);
      if (!f) throw new UsageError(`finding ${id} not found in the register`);
      setStatus(f, 'dismissed', { by, note: String(args.reason), force: true });
      writeRegister(ctx.root, reg);
      writeJson(p.dismissals, addDismissal(readDismissals(ctx.root), f, { reason: String(args.reason), by }));
      appendIndex(ctx.root, `${id} dismissed by ${by}: ${args.reason}`);
      ctx.print(`${id} dismissed and added to the dismissal ledger.`);
      return 0;
    }

    case 'link': {
      const id = rest[0];
      const fb = list(args.feedback);
      if (!id || !fb.length) throw new UsageError('usage: uie findings link <id> --feedback FB-0001,FB-0002');
      const reg = readRegister(ctx.root);
      const f = reg.findings.find((x) => x.id === id);
      if (!f) throw new UsageError(`finding ${id} not found in the register`);
      const items = exists(p.feedbackJsonl) ? readJsonl(p.feedbackJsonl) : [];
      const known = new Map(items.map((x) => [x.id, x]));
      const missing = fb.filter((x) => !known.has(x));
      if (missing.length) throw new UsageError(`unknown feedback id(s): ${missing.join(', ')}`);
      f.links = f.links || {};
      f.links.feedback = [...new Set([...(f.links.feedback || []), ...fb])];
      const people = new Set(f.links.feedback.map((x) => known.get(x)?.participant || x));
      // Denominator: distinct people in the same channels (source and study) as the linked items, not all feedback.
      const keys = new Set(f.links.feedback.map((x) => `${known.get(x)?.source}|${known.get(x)?.study || ''}`));
      const pool = items.filter((x) => keys.has(`${x.source}|${x.study || ''}`));
      const allPeople = new Set(pool.map((x) => x.participant || x.id));
      f.observed_frequency = { k: people.size, n: allPeople.size || null, sources: f.links.feedback.length, channels: [...keys].map((k) => k.replace(/\|$/, '')) };
      if (['E0', 'E1', 'E2'].includes(f.evidence_level || 'E0')) f.evidence_level = 'E3';
      f.evidence = [...(f.evidence || []), ...fb.map((x) => ({ type: 'quote', ref: `feedback:${x}`, detail: truncate(known.get(x)?.quote || known.get(x)?.text || '', 140) }))];
      f.needs_rerating = true;
      writeRegister(ctx.root, reg);
      // Mirror the link in the feedback file.
      for (const it of items) if (fb.includes(it.id)) it.links = [...new Set([...(it.links || []), id])];
      const { writeJsonl } = await import('../util/fs.mjs');
      writeJsonl(p.feedbackJsonl, items);
      ctx.print(`${id}: linked ${fb.length} feedback item(s); observed in ${f.observed_frequency.k}${f.observed_frequency.n ? ` of ${f.observed_frequency.n}` : ''} people; evidence level ${f.evidence_level}; flagged for re-rating.`);
      return 0;
    }

    default:
      throw new UsageError(`unknown subcommand "${sub || ''}".\n\n${help}`);
  }
}

/** Record what an isolated role reported about its own model and isolation in the manifest (EVD-07). */
function recordSelfReport(runDir, { role, agent, model, isolation }) {
  if (!agent && !role) return;
  const man = readJson(path.join(runDir, 'manifest.json'), {});
  const ev = man.evaluators || [];
  let i = ev.findIndex((e) => e.agent === agent);
  if (i < 0) {
    const sameRole = ev.map((e, j) => [e, j]).filter(([e]) => e.role === role);
    if (sameRole.length === 1) i = sameRole[0][1];
  }
  const patch = { role, ...(agent ? { agent } : {}), ...(model ? { model } : {}), ...(isolation ? { isolation } : {}) };
  if (i >= 0) ev[i] = { ...ev[i], ...patch };
  else ev.push({ provider: 'unknown', model: model || 'unknown', isolation: isolation || 'unknown', ...patch });
  updateManifest(runDir, { evaluators: ev });
}

/** Attach code-reviewer output (source locations, ease estimates) to merged findings. */
function applyLocate(runDir, doc, { quiet } = {}) {
  const byId = new Map(doc.findings.map((f) => [f.id, f]));
  const byTmp = new Map(doc.findings.flatMap((f) => (f.merged_from || []).map((t) => [t, f])));
  let locations = 0;
  let ease = 0;
  const dir = path.join(runDir, 'evaluators');
  for (const name of listDir(dir).filter((n) => n.startsWith('code') && n.endsWith('.json'))) {
    const out = readJson(path.join(dir, name));
    for (const loc of out.source_locations || []) {
      const f = byId.get(loc.finding_id) || byTmp.get(loc.finding_id);
      if (!f) continue;
      const target = (f.locations || []).find((l) => !loc.selector || l.selector === loc.selector) || (f.locations || [])[0];
      if (target) {
        target.source = { file: loc.file, line: loc.line, col: loc.col, method: loc.method || 'search', confidence: loc.confidence || 'low' };
        locations += 1;
      }
    }
    for (const est of out.ease_estimates || []) {
      const f = byId.get(est.finding_id) || byTmp.get(est.finding_id);
      if (!f) continue;
      const v = Number(est.ease ?? est.value);
      if (v >= 1 && v <= 4) {
        f.ease_of_fix = v;
        if (est.layer) f.fix_layer = est.layer;
        ease += 1;
      }
    }
  }
  return quiet ? undefined : { locations, ease };
}

function inferIteration(root) {
  // Count completed audit runs (with merged.json) as iterations.
  const dir = paths(root).runs;
  return listDir(dir).filter((n) => exists(path.join(dir, n, 'merged.json'))).length || 1;
}

/** Why the fix queue is empty, so it is never read as "nothing to fix" when an audit was simply left unfinished. */
function emptyQueueReason(root, reg) {
  if (reg.findings.length) {
    const by = {};
    for (const f of reg.findings) by[f.status] = (by[f.status] || 0) + 1;
    const unrated = reg.findings.filter((f) => ['open', 'reopened', 'confirmed'].includes(f.status) && (!f.priority || f.priority === 'none')).length;
    return `The register holds ${reg.findings.length} finding(s) (${Object.entries(by).map(([k, v]) => `${v} ${k}`).join(', ')}); none is open with a priority${unrated ? `, and ${unrated} open finding(s) have no priority yet: rate them with \`uie findings rate\`` : ''}.`;
  }
  let latest;
  try {
    latest = resolveRun(root);
  } catch {
    return 'No audit has run yet: start with `uie audit`.';
  }
  const merged = readJson(path.join(latest.dir, 'merged.json'), null);
  if (merged?.findings?.length) return `The register is empty, but run ${latest.id} has ${merged.findings.length} merged finding(s) that were never promoted: finish the audit (verify and rate the judged ones), then run \`uie findings promote\`.`;
  const hits = exists(path.join(latest.dir, 'tool-findings.jsonl')) ? readJsonl(path.join(latest.dir, 'tool-findings.jsonl')).length : 0;
  if (hits) return `The register is empty, but run ${latest.id} has ${hits} tool hit(s) that were never merged: run \`uie findings merge\`, finish the audit, then \`uie findings promote\`.`;
  return `The register is empty and run ${latest.id} has no findings yet.`;
}
