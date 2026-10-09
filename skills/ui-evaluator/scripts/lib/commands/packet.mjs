// uie packet — build the input packet for an isolated role (ARCHITECTURE §8.4; ADR-017).
// A packet contains exactly what the role may see. Its hash is recorded so EVD-07 can prove what each role saw.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson, writeText, exists, listDir, readText, ensureDir, readJsonl, walkFiles } from '../util/fs.mjs';
import { rng } from '../roll/prng.mjs';
import { intOpt, list, UsageError } from '../util/args.mjs';
import { paths, resolveRun, loadConfig, loadJourneys, readRegister, readDismissals, updateManifest, readManifest } from '../project.mjs';
import { SKILL_DIR, SCRIPTS_DIR } from '../cli.mjs';
import { sha256, stableStringify } from '../util/hash.mjs';
import { isoNow } from '../util/time.mjs';
import { productSections } from '../tokens/product.mjs';
import { stripComments } from '../util/markdown.mjs';
import { primaryCriterion } from '../findings/core.mjs';
import { partitionCandidates } from '../findings/merge.mjs';
import { validate, loadSchema, SCHEMA_DIR } from '../schema.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'unseal', 'only-changed'] };
export const help = `uie packet --role <role> [--n <count>] [--run <id>] [options]

Roles: heuristic-evaluator, walkthrough-evaluator, design-critic, accessibility-auditor, code-reviewer,
       finding-verifier, severity-rater, fix-reviewer, direction-designer

Options:
  --n <count>                 number of packets for parallel agents (default: from depth; raters 3)
  --model <name>              record the model each agent will run on (default "inherit")
  --isolation subagent|process|single-context   how the role will run (default subagent)
  --journeys a,b              walkthrough: journeys to assign (default: all critical, then core)
  --baseline <run>            design-critic pairwise / fix-reviewer: the baseline run
  --phase review|locate       code-reviewer phase (default review)
  --only-changed              severity-rater: only findings flagged for re-rating
  --parts <n>                 finding-verifier: split the candidates into n packets (finding-verifier-1..n), one per
                              parallel verifier, each writing verifier-p<k>.json; apply-verdicts reads every part
  --directions <dir>          direction-designer: the directions/<dir-id> folder with a roll file
  --unseal --agent <critic-n> design-critic: unseal detector output once that critic's verdict file exists

Packets are written to runs/<id>/packets/<role>-<n>/ with a README naming the output path.`;

const LENSES = ['novice first-time user', 'expert frequent user', 'accessibility-minded (keyboard, screen reader, low vision)', 'mobile-first, one-handed', 'non-native reader of the interface language'];
const CONTEXT_SECTIONS = ['product summary', 'users and groups', 'top tasks', 'context of use', 'accessibility needs', 'platforms and locales', 'surfaces'];

function uieCommand() {
  return `node "${path.join(SCRIPTS_DIR, 'uie.mjs')}"`;
}

function contextMd(root) {
  const p = paths(root);
  if (!exists(p.product)) return '# Context\n\nPRODUCT.md is missing. Evaluate against the general audience implied by the UI, and say so in your notes.\n';
  const secs = productSections(readText(p.product));
  const parts = ['# Context (from PRODUCT.md)\n'];
  for (const name of CONTEXT_SECTIONS) {
    const s = secs.get(name);
    if (s) parts.push(`## ${s.title}\n\n${stripComments(s.content).trim()}\n`);
  }
  return parts.join('\n');
}

function evidenceIndex(runDir, kind) {
  const base = path.join(runDir, 'evidence', kind);
  if (!exists(base)) return [];
  return walkFiles(base, { exts: kind === 'screens' ? new Set(['.png', '.webp', '.jpg']) : new Set(['.yml', '.yaml', '.json']) }).map((f) => {
    const rel = path.relative(base, f).split(path.sep);
    return { route: rel[0], state: rel[1], variant: rel.slice(2).join('/').replace(/\.[a-z]+$/, ''), path: f };
  });
}

// The schemas each role's output follows, named in its packet README so the agent need not search for them.
const OUTPUT_SCHEMAS = {
  'heuristic-evaluator': ['evaluator-output'],
  'walkthrough-evaluator': ['evaluator-output', 'cw-record'],
  'accessibility-auditor': ['evaluator-output'],
  'code-reviewer': ['evaluator-output'],
  'design-critic': ['panel', 'critic-verdict'],
  'finding-verifier': ['verifier'],
  'severity-rater': ['rating'],
  'fix-reviewer': ['fix-review'],
};

/**
 * An evidence reference as an absolute path when its file exists. Findings store refs relative to the run
 * (evidence/…, probes/…) or to the project (.ui-evaluator/runs/…), sometimes followed by ": detail"; an agent
 * reading a packet cannot tell which, so packets carry the resolved path.
 */
function absRef(ref, runDir, root) {
  if (typeof ref !== 'string' || !ref || path.isAbsolute(ref) || /^[a-z][a-z0-9+.-]*:\/\//i.test(ref)) return ref;
  const m = ref.match(/^([^\s:]+\.[A-Za-z0-9]+)(.*)$/);
  if (!m) return ref;
  for (const base of [runDir, root]) {
    const full = path.join(base, m[1]);
    if (exists(full)) return `${full}${m[2]}`;
  }
  return ref;
}
const absEvidence = (list, runDir, root) => (list || []).map((e) => ({ ...e, ...(e.ref ? { ref: absRef(e.ref, runDir, root) } : {}) }));
const absLocations = (list, runDir, root) => (list || []).map((l) => ({ ...l, ...(l.crop ? { crop: absRef(l.crop, runDir, root) } : {}) }));

function inventory(runDir) {
  const dir = path.join(runDir, 'evidence', 'dom');
  const out = {};
  for (const f of walkFiles(dir, { exts: new Set(['.json']) })) {
    const doc = readJson(f, null);
    if (!doc) continue;
    const key = path.relative(dir, path.dirname(f));
    out[key] = out[key] || new Map();
    for (const c of doc.controls || doc.inventory || []) out[key].set(c.selector || `${c.role}:${c.name}`, { selector: c.selector, role: c.role, name: c.name });
  }
  return Object.fromEntries(Object.entries(out).map(([k, m]) => [k, [...m.values()]]));
}

function writePacket(dir, files, readme) {
  ensureDir(dir);
  for (const [name, content] of Object.entries(files)) {
    const p = path.join(dir, name);
    if (typeof content === 'string') writeText(p, content);
    else writeJson(p, content);
  }
  const hash = sha256(stableStringify(files)).slice(0, 16);
  writeText(path.join(dir, 'README.md'), readme.replace('{{PACKET_HASH}}', hash));
  return hash;
}

function readmeFor({ role, agent, runId, iteration, output, extra = '', lens, phase, base }) {
  return `# Packet: ${role} (${agent})

- Run: ${runId} (iteration ${iteration})
- Your agent id: ${agent}${lens ? `\n- Your lens: ${lens} (shapes where you look harder; you still apply every heuristic)` : ''}${phase ? `\n- Phase: ${phase}` : ''}
- Skill directory: ${SKILL_DIR}
- Role instructions: ${path.join(SKILL_DIR, 'references', 'evaluators', `${role}.md`)}
- Run the CLI as: ${uieCommand()} <command>
- Write your output to: ${output}
- In your output set "agent": "${agent}", "model" (the model you run on), "isolation" ("subagent" if you run in your own context, otherwise "single-context") and "packet_hash": "{{PACKET_HASH}}".
- Validate before returning: ${uieCommand()} findings validate "${output}"
${(OUTPUT_SCHEMAS[role] || []).length ? `- Output schema${OUTPUT_SCHEMAS[role].length > 1 ? 's' : ''}: ${OUTPUT_SCHEMAS[role].map((n) => path.join(SCHEMA_DIR, `${n}.schema.json`)).join(', ')}\n` : ''}- Evidence paths in this packet are absolute when the file exists; screenshots are PNG files you can open directly.
${base ? `- App base URL for probes: ${base} (probe with: ${uieCommand()} probe --url <path> --actions '<json>' --width <px>)\n- Locator syntax: role=button[name="Save"], label=Email, text=…, placeholder=…, testid=…, or a CSS selector.\n` : ''}
## Independence

Read only the files in this folder and the files they point to, plus the role instructions and the knowledge or
method files those instructions name. Do not read project source code, other evaluators' outputs, detector output
(unless your role says otherwise) or any notes from whoever built the UI. If you come across them by accident,
say so in your output's notes. Return at most about ten lines; your full results go in the output file.
${extra}`;
}

export async function run(args, ctx) {
  const role = args.role ? String(args.role) : null;
  const r = resolveRun(ctx.root, args.run);
  const cfg = loadConfig(ctx.root);
  const manifest = readManifest(r.dir) || {};
  const iteration = manifest.iteration || 1;
  const depth = manifest.depth || cfg.depth || 'standard';
  const pdir = path.join(r.dir, 'packets');
  ensureDir(pdir);
  const log = readJson(path.join(pdir, '.log.json'), { packets: [] });
  const model = args.model ? String(args.model) : 'inherit (lead model)';
  const isolation = args.isolation ? String(args.isolation) : 'subagent';
  if (!['subagent', 'process', 'single-context'].includes(isolation)) throw new UsageError('--isolation must be subagent, process or single-context');
  const base = cfg.app.base_url;
  const screens = evidenceIndex(r.dir, 'screens');
  const aria = evidenceIndex(r.dir, 'aria');
  const made = [];
  const record = (entry) => {
    made.push(entry);
    log.packets.push({ ...entry, at: isoNow() });
  };

  if (args.unseal) {
    const agent = args.agent ? String(args.agent) : null;
    if (!agent) throw new UsageError('--unseal needs --agent <critic-n>');
    const verdictPath = path.join(r.dir, 'panel', `${agent}.verdict.json`);
    if (!exists(verdictPath)) throw new UsageError(`${agent} has not written ${path.relative(ctx.root, verdictPath)} yet; the detector output stays sealed until the specificity and appeal verdicts exist`);
    const v = validate(loadSchema('critic-verdict'), readJson(verdictPath));
    if (!v.valid) throw new UsageError(`the verdict file is invalid: ${v.errors.map((e) => `${e.path} ${e.message}`).join('; ')}`);
    if (!readJson(verdictPath).appeal) throw new UsageError(`${agent}'s verdict file has no appeal verdict; write "appeal": {"value": "appealing|plain|unappealing", "unfinished": [...], "evidence": [...]} before unsealing (ADR-035)`);
    const hits = exists(path.join(r.dir, 'tool-findings.jsonl')) ? readJsonl(path.join(r.dir, 'tool-findings.jsonl')) : [];
    const summary = hits.map((h) => ({ criterion: primaryCriterion(h).id, title: h.title, route: h.locations?.[0]?.route, selector: h.locations?.[0]?.selector, detail: h.evidence?.[0]?.detail }));
    const dest = path.join(pdir, `design-critic-${agent.replace(/^critic-/, '')}`, 'sealed');
    ensureDir(dest);
    writeJson(path.join(dest, 'detectors.json'), { unsealed_at: isoNow(), hits: summary });
    log.unsealed = { ...(log.unsealed || {}), [agent]: isoNow() };
    writeJson(path.join(pdir, '.log.json'), log);
    ctx.print(`unsealed detector output for ${agent}: ${path.relative(ctx.root, path.join(dest, 'detectors.json'))} (${summary.length} hit(s))`);
    return 0;
  }

  if (!role) throw new UsageError(help);
  const journeys = loadJourneys(ctx.root);
  const ctxMd = contextMd(ctx.root);
  const routesDoc = { base_url: base, routes: cfg.routes };

  switch (role) {
    case 'heuristic-evaluator': {
      const n = args.n ? intOpt(args.n, 'n', { min: 1, max: 9 }) : depth === 'rigorous' ? 5 : depth === 'quick' ? 1 : 3;
      for (let i = 1; i <= n; i += 1) {
        const agent = `he-${i}`;
        const out = path.join(r.dir, 'evaluators', `${agent}.json`);
        const files = {
          'context.md': ctxMd,
          'routes.json': routesDoc,
          'screens.json': screens,
          'aria.json': aria,
          'inventory.json': inventory(r.dir),
          // Journeys orient the inspection; their answer key (the correct path, the labels the scenario avoids and the
          // success test) is the walkthrough's alone, and would point a heuristic evaluator at the hidden control.
          'journeys.json': journeys.map(({ _file, correct_actions, avoided_hints, success_condition, ...j }) => j),
        };
        const hash = writePacket(path.join(pdir, `heuristic-evaluator-${i}`), files, readmeFor({ role, agent, runId: r.id, iteration, output: out, lens: LENSES[(i - 1) % LENSES.length], base }));
        record({ role, agent, packet: path.join(pdir, `heuristic-evaluator-${i}`), output: out, hash, model, isolation });
      }
      break;
    }
    case 'walkthrough-evaluator': {
      const chosen = args.journeys ? list(args.journeys) : journeys.filter((j) => j.criticality === 'critical').map((j) => j.id).concat(depth === 'rigorous' ? journeys.filter((j) => j.criticality !== 'critical').map((j) => j.id) : []);
      if (!chosen.length) throw new UsageError('no journeys to walk: declare critical journeys in .ui-evaluator/journeys/ or pass --journeys');
      const n = args.n ? intOpt(args.n, 'n', { min: 1, max: chosen.length }) : chosen.length;
      for (let i = 1; i <= n; i += 1) {
        const mine = chosen.filter((_, k) => k % n === i - 1);
        const agent = `cw-${i}`;
        const out = path.join(r.dir, 'evaluators', `${agent}.json`);
        const files = {
          'context.md': ctxMd,
          'routes.json': routesDoc,
          'screens.json': screens,
          'aria.json': aria,
          'journeys.json': journeys.filter((j) => mine.includes(j.id)).map(({ _file, ...j }) => j),
        };
        const extra = `\n## Your journeys\n\n${mine.map((id) => `- ${id}: write the walkthrough record to ${path.join(r.dir, 'cw', `${id}.json`)}`).join('\n')}\n`;
        const hash = writePacket(path.join(pdir, `walkthrough-evaluator-${i}`), files, readmeFor({ role, agent, runId: r.id, iteration, output: out, base, extra }));
        record({ role, agent, packet: path.join(pdir, `walkthrough-evaluator-${i}`), output: out, hash, model, isolation, journeys: mine });
      }
      break;
    }
    case 'design-critic': {
      const n = args.n ? intOpt(args.n, 'n', { min: 1, max: 9 }) : depth === 'rigorous' ? 5 : depth === 'quick' ? 1 : 3;
      const baseline = args.baseline ? resolveRun(ctx.root, args.baseline) : null;
      const design = exists(paths(ctx.root).design) ? readText(paths(ctx.root).design) : '# DESIGN.md is missing\n';
      for (let i = 1; i <= n; i += 1) {
        const agent = `critic-${i}`;
        const out = path.join(r.dir, 'panel', `${agent}.json`);
        const verdictOut = path.join(r.dir, 'panel', `${agent}.verdict.json`);
        const files = {
          'context.md': ctxMd,
          'design.md': design,
          'screens.json': screens,
          ...(baseline ? { 'baseline-screens.json': evidenceIndex(baseline.dir, 'screens') } : {}),
        };
        const extra = `\n## Sealed detector output\n\nWrite your specificity and appeal verdicts first, to ${verdictOut} (schema critic-verdict: agent, value, evidence, appeal {value, unfinished, evidence}, written_at).\nThen unseal: ${uieCommand()} packet --role design-critic --unseal --agent ${agent} --run ${r.id}\nThe detector summary then appears in ./sealed/detectors.json. Never open it before your verdict exists.\n${baseline ? `\n## Pairwise comparison\n\nBaseline run ${baseline.id}: compare current vs baseline in both orders (baseline-screens.json).\n` : ''}`;
        const hash = writePacket(path.join(pdir, `design-critic-${i}`), files, readmeFor({ role, agent, runId: r.id, iteration, output: out, extra }));
        ensureDir(path.join(pdir, `design-critic-${i}`, 'sealed'));
        record({ role, agent, packet: path.join(pdir, `design-critic-${i}`), output: out, hash, model, isolation });
      }
      break;
    }
    case 'accessibility-auditor': {
      const agent = 'a11y';
      const out = path.join(r.dir, 'evaluators', `${agent}.json`);
      const hits = exists(path.join(r.dir, 'tool-findings.jsonl')) ? readJsonl(path.join(r.dir, 'tool-findings.jsonl')) : [];
      const checks = readJson(path.join(r.dir, 'checks.json'), { checks: {} }).checks;
      const axeDir = path.join(r.dir, 'evidence', 'axe');
      const files = {
        'context.md': ctxMd,
        'routes.json': routesDoc,
        'tool-findings.json': hits.filter((h) => /^A11Y-|^CMP-0[46]$|^COL-02$/.test(primaryCriterion(h).id)),
        'checks.json': checks,
        'axe-files.json': listDir(axeDir).map((n) => path.join(axeDir, n)),
        'aria.json': aria,
        'screens.json': screens,
        'wcag22.json': readJson(path.join(SKILL_DIR, 'assets', 'data', 'wcag22.json'), { criteria: [] }),
      };
      const hash = writePacket(path.join(pdir, 'accessibility-auditor-1'), files, readmeFor({ role, agent, runId: r.id, iteration, output: out, base }));
      record({ role, agent, packet: path.join(pdir, 'accessibility-auditor-1'), output: out, hash, model, isolation });
      break;
    }
    case 'code-reviewer': {
      const phase = args.phase ? String(args.phase) : 'review';
      const agent = phase === 'locate' ? 'code-locate' : 'code';
      const out = path.join(r.dir, 'evaluators', `${agent}.json`);
      const hits = exists(path.join(r.dir, 'tool-findings.jsonl')) ? readJsonl(path.join(r.dir, 'tool-findings.jsonl')) : [];
      const merged = readJson(path.join(r.dir, 'merged.json'), { findings: [] });
      const confirmed = merged.findings.filter((f) => !['rejected', 'candidate'].includes(f.status));
      const files =
        phase === 'locate'
          ? {
              'needs-source.json': confirmed.filter((f) => (f.locations || []).some((l) => l.selector && !l.source)).map((f) => ({ finding_id: f.id, title: f.title, criterion: primaryCriterion(f).id, locations: f.locations })),
              'rate-ease.json': confirmed.filter((f) => !f.ease_of_fix).map((f) => ({ finding_id: f.id, title: f.title, description: f.description, criterion: primaryCriterion(f).id, locations: f.locations })),
              'design.md': exists(paths(ctx.root).design) ? readText(paths(ctx.root).design) : '',
            }
          : {
              'lint.json': hits.filter((h) => (h.found_by || []).some((b) => b.check === 'lint')),
              'census.json': readJson(path.join(r.dir, 'evidence', 'census.json'), {}),
              'design.md': exists(paths(ctx.root).design) ? readText(paths(ctx.root).design) : '',
            };
      const extra = `\n- Project root (you may read source): ${ctx.root}\n`;
      const hash = writePacket(path.join(pdir, `code-reviewer-${phase}`), files, readmeFor({ role, agent, runId: r.id, iteration, output: out, phase, extra }));
      record({ role, agent, packet: path.join(pdir, `code-reviewer-${phase}`), output: out, hash, model, isolation, phase });
      break;
    }
    case 'finding-verifier': {
      const merged = readJson(path.join(r.dir, 'merged.json'), null);
      if (!merged) throw new UsageError('run `uie findings merge` before building the verifier packet');
      // Advisory observations (tool hits of rules that gate nothing) are measurements, not candidates (ADR-038).
      const cands = merged.findings
        .filter((f) => f.status === 'candidate' && !(f.advisory && (f.found_by || []).every((b) => b.role === 'tool')))
        .map((f) => ({ candidate_id: f.id, title: f.title, description: f.description, problem_type: f.problem_type, criteria: f.criteria, impact: f.impact, locations: absLocations(f.locations, r.dir, ctx.root), evidence: absEvidence(f.evidence, r.dir, ctx.root), detection: { k: f.detection?.k, n: f.detection?.n }, factor_notes: f.factor_notes }));
      // With many candidates the lead splits them between parallel verifiers (--parts n); each part keeps a route's
      // candidates together and writes its own verdict file, which apply-verdicts reads with the others.
      const parts = args.parts ? intOpt(args.parts, 'parts', { min: 1, max: 9 }) : 1;
      const groups = parts > 1 ? partitionCandidates(cands, parts) : [cands];
      groups.forEach((group, i) => {
        const k = i + 1;
        const agent = parts > 1 ? `verifier-p${k}` : 'verifier';
        const out = path.join(r.dir, parts > 1 ? `verifier-p${k}.json` : 'verifier.json');
        const files = {
          'candidates.json': group,
          'dismissals.json': readDismissals(ctx.root),
          'scope.json': { routes: cfg.routes.map((x) => ({ path: x.path, states: (x.states || []).map((s) => s.name) })), matrix: cfg.matrix, iteration },
          'screens.json': screens,
          'aria.json': aria,
        };
        const hash = writePacket(path.join(pdir, `finding-verifier-${k}`), files, readmeFor({ role, agent, runId: r.id, iteration, output: out, base }));
        record({ role, agent, packet: path.join(pdir, `finding-verifier-${k}`), output: out, hash, model, isolation });
      });
      ctx.info(`${cands.length} candidate(s) to verify${parts > 1 ? ` in ${groups.length} packet(s) (${groups.map((g) => g.length).join(', ')})` : ''}`);
      break;
    }
    case 'severity-rater': {
      const n = args.n ? intOpt(args.n, 'n', { min: 1, max: 9 }) : 3;
      const merged = readJson(path.join(r.dir, 'merged.json'), null);
      if (!merged) throw new UsageError('run `uie findings merge` and `apply-verdicts` first');
      const reg = readRegister(ctx.root);
      const changed = new Set(reg.findings.filter((f) => f.needs_rerating).map((f) => f.id));
      const pool = (args['only-changed'] ? reg.findings.filter((f) => changed.has(f.id)) : merged.findings.filter((f) => f.status === 'confirmed' && f.severity?.source !== 'rule'));
      if (!pool.length) throw new UsageError('no findings to rate (confirmed judged findings, or --only-changed)');
      const blind = {};
      const items = pool.map((f, i) => {
        const bid = `B-${String(i + 1).padStart(3, '0')}`;
        blind[bid] = f.id;
        const reg2 = reg.findings.find((x) => x.id === f.id);
        return {
          finding_id: bid,
          title: f.title,
          description: f.description,
          problem_type: f.problem_type,
          criteria: f.criteria,
          impact: f.impact,
          scope: f.scope || null,
          locations: (f.locations || []).map((l) => ({ route: l.route, state: l.state, viewport: l.viewport, crop: absRef(l.crop, r.dir, ctx.root) })),
          evidence: (f.evidence || []).map((e) => ({ type: e.type, ref: absRef(e.ref, r.dir, ctx.root), detail: e.detail })),
          factor_notes: f.factor_notes || null,
          observed_frequency: reg2?.observed_frequency || f.observed_frequency || null,
          criticality: f.criticality || null,
        };
      });
      // A new batch gets a new blind map. Ratings from the batch before move to ratings/batch-<n>/ with the map that
      // decodes them, so `uie findings rate` never reads an earlier B-001 as this batch's B-001.
      const ratingsDir = ensureDir(path.join(r.dir, 'ratings'));
      const earlier = listDir(ratingsDir).filter((f) => f.endsWith('.json'));
      const oldMap = readJson(path.join(pdir, '.blind-map-raters.json'), null);
      if (earlier.length && oldMap) {
        const k = listDir(ratingsDir).filter((f) => /^batch-\d+$/.test(f)).length + 1;
        const bdir = ensureDir(path.join(ratingsDir, `batch-${k}`));
        for (const f of earlier) fs.renameSync(path.join(ratingsDir, f), path.join(bdir, f));
        writeJson(path.join(bdir, 'blind-map.json'), oldMap);
        ctx.info(`moved ${earlier.length} rating file(s) of the previous batch to ratings/batch-${k}/`);
      }
      writeJson(path.join(pdir, '.blind-map-raters.json'), blind);
      for (let i = 1; i <= n; i += 1) {
        const agent = `rater-${i}`;
        const out = path.join(r.dir, 'ratings', `${agent}.json`);
        // Each rater sees the findings in a different, reproducible order to spread order effects.
        const next = rng(`raters:${r.id}:${i}`);
        const order = items.map((x) => ({ x, k: next() })).sort((a, b) => a.k - b.k).map((o) => o.x);
        const files = { 'context.md': ctxMd, 'findings-to-rate.json': order };
        const extra = `\nWrite one entry per finding_id. Rating file fields: rater ("${agent}"), model, isolation, ratings[].\n`;
        const hash = writePacket(path.join(pdir, `severity-rater-${i}`), files, readmeFor({ role, agent, runId: r.id, iteration, output: out, extra }));
        record({ role, agent, packet: path.join(pdir, `severity-rater-${i}`), output: out, hash, model, isolation });
      }
      break;
    }
    case 'fix-reviewer': {
      const agent = 'fix-reviewer';
      const out = path.join(r.dir, 'fix-review.json');
      const reg = readRegister(ctx.root);
      const fixes = reg.findings.filter((f) => f.status === 'fixed');
      const baseline = args.baseline ? resolveRun(ctx.root, args.baseline) : null;
      const diffDoc = readJson(path.join(r.dir, 'diff', 'findings.json'), null);
      // When every fix was deterministic, the re-run has already verified them (ADR-030), but the round still needs an
      // independent look for collateral damage: the packet becomes a regression review with no items to score.
      const regressionOnly = !fixes.length;
      if (regressionOnly && !baseline && !diffDoc) throw new UsageError('no findings in status "fixed" to review, and nothing to compare for regressions: run `uie diff --baseline <run>` first or pass --baseline <run>');
      const reverified = reg.findings.filter((f) => (f.status_history || []).some((h) => h.by === 'uie diff' && h.status === 'verified' && String(h.note || '').includes(r.id)));
      const files = {
        'fixes.json': fixes.map((f) => {
          // Original evidence lives in the run where the finding was first seen.
          const firstDir = f.first_seen_run ? path.join(paths(ctx.root).runs, f.first_seen_run) : r.dir;
          return { finding_id: f.id, title: f.title, description: f.description, problem_type: f.problem_type, criterion: primaryCriterion(f).id, original_evidence: absEvidence(f.evidence, firstDir, ctx.root), locations: absLocations(f.locations, firstDir, ctx.root), first_seen_run: f.first_seen_run };
        }),
        'current-screens.json': screens,
        ...(baseline ? { 'baseline-screens.json': evidenceIndex(baseline.dir, 'screens') } : {}),
        'diff.json': diffDoc,
        ...(reverified.length ? { 'verified-by-rerun.json': reverified.map((f) => ({ finding_id: f.id, title: f.title, criterion: primaryCriterion(f).id, locations: f.locations })) } : {}),
      };
      const extra = `\nBaseline run: ${baseline ? baseline.id : 'see each finding\'s first_seen_run'}. Current run: ${r.id}.\n${regressionOnly ? '\nRegression review only: every fix in this round was deterministic and the re-run has verified it (verified-by-rerun.json). Score no items ("items": []); compare the current screens with the baseline for collateral damage, name up to three regressions, and give a disposition.\n' : ''}`;
      const hash = writePacket(path.join(pdir, 'fix-reviewer-1'), files, readmeFor({ role, agent, runId: r.id, iteration, output: out, base, extra }));
      record({ role, agent, packet: path.join(pdir, 'fix-reviewer-1'), output: out, hash, model, isolation });
      break;
    }
    case 'direction-designer': {
      if (!args.directions) throw new UsageError('pass --directions .ui-evaluator/directions/<dir-id>');
      const ddir = path.resolve(String(args.directions));
      const rolls = listDir(ddir).filter((n) => /^roll-.*\.json$/.test(n)).sort();
      if (!rolls.length) throw new UsageError(`no roll file in ${ddir}; run \`uie roll\` first`);
      const roll = readJson(path.join(ddir, rolls.at(-1)));
      const brief = readText(path.join(ddir, 'brief.md'), '');
      const refs = readText(path.join(ddir, 'references.md'), '');
      roll.dealt.forEach((d, i) => {
        const agent = `designer-${i + 1}`;
        const outDir = path.join(ddir, d.candidate.id);
        ensureDir(outDir);
        const files = {
          'brief.md': brief,
          'references.md': refs,
          'direction.json': d,
          'off-limits.md': `# Off-limits\n\n- Category default: ${roll.category_default || '(see brief)'}\n- Predictable opposite: ${roll.predictable_opposite || '(see brief)'}\n- Saturated looks: ${path.join(SKILL_DIR, 'references', 'knowledge', 'anti-slop.md')}\n`,
        };
        const extra = `\nWrite contract.md, tokens.md, tests.md and optionally specimen.html into ${outDir}.\n`;
        const hash = writePacket(path.join(ddir, 'packets', `direction-designer-${i + 1}`), files, readmeFor({ role, agent, runId: r.id, iteration, output: outDir, extra }));
        record({ role, agent, packet: path.join(ddir, 'packets', `direction-designer-${i + 1}`), output: outDir, hash, model, isolation });
      });
      break;
    }
    default:
      throw new UsageError(`unknown role "${role}".\n\n${help}`);
  }
  writeJson(path.join(pdir, '.log.json'), log);
  // Record evaluators in the manifest (EVD-07); merge later fills in the models agents report.
  const ev = manifest.evaluators || [];
  for (const m of made) {
    if (['direction-designer'].includes(m.role)) continue;
    const i = ev.findIndex((e) => e.agent === m.agent && e.role === m.role);
    const entry = { role: m.role, agent: m.agent, provider: 'unknown', model: m.model, isolation: m.isolation, packet_hash: m.hash };
    if (i >= 0) ev[i] = { ...ev[i], ...entry };
    else ev.push(entry);
  }
  updateManifest(r.dir, { evaluators: ev });
  ctx.result(made);
  for (const m of made) ctx.print(`${m.agent}: ${path.relative(ctx.root, m.packet)} → output ${path.relative(ctx.root, m.output)}`);
  if (isolation === 'single-context') ctx.warn('isolation single-context: affected outputs must start with "DEGRADED: single-context" and the gates will be degraded');
  return 0;
}
