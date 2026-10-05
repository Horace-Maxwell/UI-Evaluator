// uie diff <base> <run> [--visual] [--aria] [--findings] — what changed between two runs (ARCHITECTURE §7.2;
// verify workflow step 3; ADR-030, ADR-033). All three parts when none is named.
//   findings  identity-based set difference, never counts: deterministic findings are one rule on one route
//             (ADR-033), so a persisting one carries k-of-n instances cleared (partially fixed) and its introduced
//             instances; judged findings keep criterion + location + snippet. A cleared deterministic finding counts
//             only when its check re-ran, not partial, over the finding's routes, states, widths and themes;
//             otherwise it is "cleared (scope not re-checked)". Unless --no-apply, the living register is updated:
//             fixed + cleared (covered) → verified (the re-run is evidence the fixer did not produce, ADR-030);
//             fixed + still present → reopened. Judged findings are never verified here (fix review does that).
//   visual    pixelmatch per capture present in both runs: changed-pixel ratio, changed regions, collateral
//             regions outside the boxes of the findings that were fixed. Needs pngjs and pixelmatch, not Chromium.
//   aria      text diff of ARIA snapshots, flagging lost names, roles, landmarks and headings.
// Writes runs/<run>/diff/{findings.json, visual.json, aria.json, summary.md}.
import path from 'node:path';
import fs from 'node:fs';
import { readJson, readJsonl, writeJson, writeText, exists, ensureDir, isDir, listDir } from '../util/fs.mjs';
import { UsageError } from '../util/args.mjs';
import { isoNow } from '../util/time.mjs';
import { normalizeSelector, normalizeSnippet, truncate } from '../util/text.mjs';
import { resolveRun, readRegister, writeRegister, appendIndex } from '../project.mjs';
import { fingerprint, isDeterministic, primaryCriterion, setStatus } from '../findings/core.mjs';
import { readJudgedOutputs } from '../findings/merge.mjs';
import { loadImageDeps } from '../browser/command-kit.mjs';
import { decodePng, encodePng, diffImages, changedRegions } from '../browser/png.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'visual', 'aria', 'findings', 'no-apply'] };

export const help = `uie diff <base> <run> [--visual] [--aria] [--findings] [--no-apply] [--json]

Compares two runs (ids, or "latest"); all three parts when none is named.
  --findings  identity-based set difference: cleared, introduced, persisting. A deterministic finding is one rule
              on one route (ADR-033): when it persists with fewer instances it is partially fixed ("k of n
              instances cleared"), and new instances on that route are listed inside it. A cleared deterministic
              finding counts only when its check re-ran, not partial, over the same routes, states, widths and
              themes; otherwise it is reported as "cleared (scope not re-checked)".
              The living register (.ui-evaluator/findings.json) is updated: a deterministic finding marked fixed
              that is cleared under that coverage becomes verified (ADR-030); one still present becomes reopened.
              Judged findings are never verified here (\`uie findings apply-verdicts --fix-review\`).
  --no-apply  report only; do not change the register (dry run)
  --visual    pixel diff per capture present in both runs (pixelmatch): changed ratio, changed regions, and
              regions outside the fixed findings' boxes (possible collateral). Needs pngjs + pixelmatch.
  --aria      ARIA snapshot diff: lost names, roles, landmarks and headings are possible regressions.
Writes runs/<run>/diff/{findings.json, visual.json, aria.json, summary.md}.
Exit codes: 0 nothing introduced · 2 introduced findings or instances, ARIA losses, or a scope mismatch · 1 could not run.`;

// --- findings -------------------------------------------------------------------------------------------------

const GENERIC = new Set(['', 'html', 'body', ':root', 'document']);

/** One instance (location) of a finding; never line numbers, never viewport (a dedupe may keep any width). */
export function instanceKey(l = {}) {
  const sel = normalizeSelector(l.selector || '');
  const parts = [l.state || 'default', sel];
  if (GENERIC.has(sel)) parts.push(normalizeSnippet(l.snippet || '').slice(0, 120));
  if (!sel && l.source && l.source.file) parts.push(l.source.file);
  if (l.journey) parts.push(`journey:${l.journey}`);
  return parts.join('|');
}

export function identityOf(f) {
  return f.fingerprint || fingerprint(f);
}

function reportable(f) {
  if (['rejected', 'dismissed'].includes(f.status)) return false;
  if (f.status === 'candidate' && !isDeterministic(f)) return false;
  return true;
}

/** Group raw tool hits like `uie findings merge` step 1: one finding per rule × route, locations aggregated. */
export function groupHits(hits) {
  const groups = new Map();
  for (const h of hits) {
    const c = primaryCriterion(h);
    const route = (h.locations || [])[0]?.route || '';
    const key = `${c.id}|${route}`;
    if (!groups.has(key)) groups.set(key, { ...h, locations: [...(h.locations || [])], status: h.status || 'confirmed' });
    else groups.get(key).locations.push(...(h.locations || []));
  }
  return [...groups.values()].map((f) => ({ ...f, fingerprint: fingerprint(f) }));
}

/**
 * The findings of a run: findings.json, else merged.json, else tool hits grouped per rule × route. `judged` says
 * whether judged roles evaluated this run at all (their outputs exist), so a merge of tool findings alone never
 * makes judged findings look cleared.
 */
export function loadRunFindings(runDir) {
  const judged = readJudgedOutputs(runDir).length > 0;
  const fj = readJson(path.join(runDir, 'findings.json'), null);
  if (fj && Array.isArray(fj.findings)) return { source: 'findings.json', findings: fj.findings, judged };
  const mj = readJson(path.join(runDir, 'merged.json'), null);
  if (mj && Array.isArray(mj.findings)) return { source: 'merged.json', findings: mj.findings, judged };
  const p = path.join(runDir, 'tool-findings.jsonl');
  if (exists(p)) return { source: 'tool-findings.jsonl', findings: groupHits(readJsonl(p)), judged: false };
  return { source: null, findings: [], judged: false };
}

function checkOf(f) {
  return (f.found_by || []).find((b) => b.method === 'tool' && b.check)?.check || null;
}

/**
 * Did the run re-check this deterministic finding's scope? The originating check ran (not failed, skipped or
 * partial) over every route, state, width and theme the finding's instances were found at.
 */
export function coverageFor(f, checks) {
  const check = checkOf(f);
  if (!check) return { covered: false, reason: 'the finding names no originating check' };
  const e = checks?.[check];
  if (!e) return { covered: false, check, reason: `the ${check} check did not run in this run` };
  if (e.state !== 'ran') return { covered: false, check, reason: `the ${check} check ${e.state} in this run` };
  // A check that covered less on its own terms (caps, unexercised parts) is not trusted; one that is partial only
  // because some page states did not load is trusted on the states that did (they are listed in `unevaluated`).
  if (e.partial && e.partial_scope !== 'load') return { covered: false, check, reason: `the ${check} check ran with partial coverage` };
  const unevaluated = Array.isArray(e.unevaluated) ? e.unevaluated : [];
  if (check === 'lint') return { covered: true, check };
  const cov = e.coverage || {};
  for (const l of f.locations || []) {
    const route = l.route || '';
    if (Array.isArray(cov.routes) && !cov.routes.includes(route)) return { covered: false, check, reason: `the ${check} check did not cover route ${route || '(none)'}` };
    if (l.state && Array.isArray(cov.states) && cov.states.length && !cov.states.includes(`${route}#${l.state}`)) return { covered: false, check, reason: `the ${check} check did not cover state "${l.state}" of ${route}` };
    const w = l.viewport?.width;
    if (w && Array.isArray(cov.widths) && cov.widths.length && !cov.widths.includes(w)) return { covered: false, check, reason: `the ${check} check did not run at ${w} px` };
    if (l.theme && Array.isArray(cov.themes) && cov.themes.length && !cov.themes.includes(l.theme)) return { covered: false, check, reason: `the ${check} check did not run in the ${l.theme} theme` };
    // Page-state keys are route#state@WxH/theme/preference: an instance whose own page state did not load is unchecked.
    const prefix = `${route}#${l.state || 'default'}@${w || ''}`;
    if (unevaluated.some((k) => k.startsWith(prefix) && (!w || k.startsWith(`${prefix}x`)) && (!l.theme || k.includes(`/${l.theme}/`)))) {
      return { covered: false, check, reason: `the ${check} check could not evaluate ${route} (${l.state || 'default'}${w ? `, ${w} px` : ''}) in this run` };
    }
  }
  return { covered: true, check };
}

function brief(f) {
  const c = primaryCriterion(f);
  const routes = [...new Set((f.locations || []).map((l) => l.route || ''))];
  return { id: f.id || null, identity: identityOf(f), criterion: c.id, deterministic: isDeterministic(f), title: truncate(f.title || '', 140), routes, status: f.status || null, check: checkOf(f), instances: (f.locations || []).length };
}

function locBrief(l) {
  return { route: l.route, state: l.state || 'default', selector: l.selector || null, viewport: l.viewport || null, theme: l.theme || null, snippet: l.snippet ? truncate(l.snippet, 100) : null, bbox: l.bbox || null };
}

/**
 * Identity-based set difference (verify step 3; ADR-033).
 * @returns {{cleared:object[], cleared_not_rechecked:object[], introduced:object[], persisting:object[], judged_not_rechecked:object[]}}
 */
export function diffFindings(baseList, runList, { runChecks = {}, runJudged = true } = {}) {
  const base = new Map();
  for (const f of baseList.filter(reportable)) base.set(identityOf(f), f);
  const cur = new Map();
  for (const f of runList.filter(reportable)) cur.set(identityOf(f), f);
  const out = { cleared: [], cleared_not_rechecked: [], introduced: [], persisting: [], judged_not_rechecked: [] };
  for (const [id, f] of base) {
    const det = isDeterministic(f);
    const now = cur.get(id);
    if (now) {
      const entry = { ...brief(f), run_id: now.id || null };
      if (det) {
        const bk = new Map((f.locations || []).map((l) => [instanceKey(l), l]));
        const ck = new Map((now.locations || []).map((l) => [instanceKey(l), l]));
        const cleared = [...bk.keys()].filter((k) => !ck.has(k));
        const introduced = [...ck.keys()].filter((k) => !bk.has(k));
        entry.base_instances = bk.size;
        entry.run_instances = ck.size;
        entry.cleared_instances = cleared.length;
        entry.cleared_locations = cleared.map((k) => locBrief(bk.get(k))).slice(0, 30);
        entry.introduced_instances = introduced.map((k) => locBrief(ck.get(k))).slice(0, 30);
        entry.partially_fixed = cleared.length > 0;
        entry.note = `${cleared.length} of ${bk.size} instance(s) cleared${introduced.length ? `; ${introduced.length} introduced instance(s)` : ''}`;
      }
      out.persisting.push(entry);
      continue;
    }
    if (!det && !runJudged) {
      out.judged_not_rechecked.push({ ...brief(f), reason: 'no judged role evaluated this run (no evaluators/, cw/ or panel/ outputs); judged findings are re-checked by the fix reviewer' });
      continue;
    }
    if (det) {
      const cov = coverageFor(f, runChecks);
      if (!cov.covered) {
        out.cleared_not_rechecked.push({ ...brief(f), reason: cov.reason, locations: (f.locations || []).map(locBrief).slice(0, 20) });
        continue;
      }
    }
    out.cleared.push({ ...brief(f), locations: (f.locations || []).map(locBrief).slice(0, 20) });
  }
  for (const [id, f] of cur) if (!base.has(id)) out.introduced.push({ ...brief(f), locations: (f.locations || []).map(locBrief).slice(0, 20) });
  return out;
}

/**
 * Register updates (verify step 3; ADR-030, ADR-033): a deterministic finding marked fixed whose identity is
 * cleared under covered scope → verified; one whose identity is still present → reopened. Mutates `register`.
 * @returns {{changes:object[], unchanged:object[]}}
 */
export function applyDiffToRegister(register, diff, { base, run }) {
  const cleared = new Map(diff.cleared.filter((e) => e.deterministic).map((e) => [e.identity, e]));
  const present = new Map([...diff.persisting, ...diff.introduced].filter((e) => e.deterministic).map((e) => [e.identity, e]));
  const uncovered = new Map(diff.cleared_not_rechecked.map((e) => [e.identity, e]));
  const changes = [];
  const unchanged = [];
  const at = isoNow();
  for (const f of register.findings || []) {
    if (!isDeterministic(f) || f.severity?.source !== 'rule' || f.status !== 'fixed') continue;
    const id = identityOf(f);
    const check = checkOf(f);
    if (cleared.has(id)) {
      setStatus(f, 'verified', { by: 'uie diff', note: `cleared in run ${run} under the baseline's scope (base ${base})` });
      f.verification = { ...(f.verification || {}), check, run, base, result: 'cleared', at };
      changes.push({ id: f.id, criterion: primaryCriterion(f).id, from: 'fixed', to: 'verified', reason: `${check} re-ran over the finding's scope and no instance is left` });
    } else if (present.has(id)) {
      const e = present.get(id);
      const note = e.base_instances !== undefined ? `${e.cleared_instances} of ${e.base_instances} instance(s) cleared; ${e.run_instances} remain in run ${run}` : `still reported in run ${run}`;
      setStatus(f, 'reopened', { by: 'uie diff', note });
      f.verification = { ...(f.verification || {}), check, run, base, result: e.base_instances !== undefined ? 'persisting' : 'present', instances: e.base_instances !== undefined ? { base: e.base_instances, run: e.run_instances, cleared: e.cleared_instances, introduced: e.introduced_instances.length } : undefined, at };
      changes.push({ id: f.id, criterion: primaryCriterion(f).id, from: 'fixed', to: 'reopened', reason: note });
    } else if (uncovered.has(id)) {
      unchanged.push({ id: f.id, criterion: primaryCriterion(f).id, status: 'fixed', reason: `cleared (scope not re-checked): ${uncovered.get(id).reason}` });
    }
  }
  return { changes, unchanged };
}

function scopeMismatch(baseMan, runMan) {
  const out = [];
  const bm = baseMan?.scope?.matrix || {};
  const rm = runMan?.scope?.matrix || {};
  for (const k of ['widths', 'themes', 'preferences', 'height', 'device_scale_factor']) {
    const a = JSON.stringify(bm[k] ?? null);
    const b = JSON.stringify(rm[k] ?? null);
    if (a !== b) out.push(`matrix.${k}: ${a} → ${b}`);
  }
  const br = (baseMan?.scope?.routes || []).map((r) => r.path || r).sort();
  const rr = (runMan?.scope?.routes || []).map((r) => r.path || r).sort();
  const lost = br.filter((r) => !rr.includes(r));
  const added = rr.filter((r) => !br.includes(r));
  if (lost.length) out.push(`routes not in the run: ${lost.join(', ')}`);
  if (added.length) out.push(`routes added in the run: ${added.join(', ')}`);
  return out;
}

// --- aria ---------------------------------------------------------------------------------------------------------

const LANDMARKS = new Set(['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'region', 'search', 'form']);
const NAMED_ROLES = new Set(['button', 'link', 'textbox', 'searchbox', 'checkbox', 'radio', 'combobox', 'listbox', 'tab', 'menuitem', 'switch', 'slider', 'spinbutton', 'img', 'dialog', 'option', 'treeitem']);

/** Parse Playwright ARIA snapshot lines into {role, name, level}. Property lines (/url, /placeholder) are skipped. */
export function parseAria(text) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    const m = /^\s*-\s+([a-z][a-z-]*)(?:\s+"((?:[^"\\]|\\.)*)")?(?:\s+\[([^\]]*)\])?(?::\s*(.*))?$/.exec(line);
    if (!m) continue;
    const attrs = m[3] || '';
    const level = (/level=(\d)/.exec(attrs) || [])[1];
    let name = m[2] !== undefined ? m[2].replace(/\\"/g, '"') : '';
    if (!name && m[4] && !['text', 'paragraph', 'listitem', 'cell', 'generic'].includes(m[1]) && !/^\s*$/.test(m[4])) name = m[4].replace(/^"|"$/g, '');
    out.push({ role: m[1], name: name.trim(), level: level ? Number(level) : null, line: line.trim() });
  }
  return out;
}

/** Losses between two ARIA snapshots: landmarks, headings, accessible names, role counts. */
export function ariaLosses(baseText, runText) {
  const a = parseAria(baseText);
  const b = parseAria(runText);
  const count = (list, key) => {
    const m = new Map();
    for (const x of list) m.set(key(x), (m.get(key(x)) || 0) + 1);
    return m;
  };
  const roleKey = (x) => x.role;
  const fullKey = (x) => `${x.role}|${x.name}|${x.level ?? ''}`;
  const ar = count(a, roleKey);
  const br = count(b, roleKey);
  const af = count(a, fullKey);
  const bf = count(b, fullKey);
  const lost = { landmarks: [], headings: [], names: [], roles: [] };
  for (const [k, n] of af) {
    const m = bf.get(k) || 0;
    if (m >= n) continue;
    const [role, name, level] = k.split('|');
    if (LANDMARKS.has(role)) lost.landmarks.push({ role, name, missing: n - m });
    else if (role === 'heading') lost.headings.push({ name, level: level ? Number(level) : null, missing: n - m });
    else if (NAMED_ROLES.has(role) && name) {
      const unnamedBefore = af.get(`${role}||`) || 0;
      const unnamedAfter = bf.get(`${role}||`) || 0;
      if (unnamedAfter > unnamedBefore) lost.names.push({ role, name, now: 'no accessible name' });
    }
  }
  for (const [role, n] of ar) {
    const m = br.get(role) || 0;
    if (m < n && (NAMED_ROLES.has(role) || LANDMARKS.has(role) || role === 'heading')) lost.roles.push({ role, before: n, after: m });
  }
  return lost;
}

/** Line diff (LCS) with "-"/"+" lines, capped. */
export function lineDiff(aText, bText, { max = 200 } = {}) {
  const a = String(aText || '').split('\n').slice(0, 3000);
  const b = String(bText || '').split('\n').slice(0, 3000);
  const n = a.length;
  const m = b.length;
  if (n * m > 4_000_000) return { truncated: true, lines: ['(snapshots too large for a line diff)'], added: Math.max(0, m - n), removed: Math.max(0, n - m) };
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) for (let j = m - 1; j >= 0; j -= 1) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const lines = [];
  let added = 0;
  let removed = 0;
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      i += 1;
      j += 1;
    } else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) {
      added += 1;
      if (lines.length < max) lines.push(`+ ${b[j]}`);
      j += 1;
    } else {
      removed += 1;
      if (lines.length < max) lines.push(`- ${a[i]}`);
      i += 1;
    }
  }
  return { truncated: added + removed > max, lines, added, removed };
}

function walkFilesRel(root, ext) {
  const out = [];
  const rec = (dir) => {
    for (const name of listDir(dir)) {
      const p = path.join(dir, name);
      if (isDir(p)) rec(p);
      else if (name.endsWith(ext)) out.push(path.relative(root, p).split(path.sep).join('/'));
    }
  };
  if (isDir(root)) rec(root);
  return out.sort();
}

function diffAria(baseDir, runDir) {
  const ab = walkFilesRel(path.join(baseDir, 'evidence', 'aria'), '.yml');
  const ar = walkFilesRel(path.join(runDir, 'evidence', 'aria'), '.yml');
  const files = [];
  for (const rel of ab.filter((x) => ar.includes(x))) {
    const a = fs.readFileSync(path.join(baseDir, 'evidence', 'aria', rel), 'utf8');
    const b = fs.readFileSync(path.join(runDir, 'evidence', 'aria', rel), 'utf8');
    if (a === b) {
      files.push({ file: rel, changed: false });
      continue;
    }
    const lost = ariaLosses(a, b);
    const d = lineDiff(a, b);
    const regression = lost.landmarks.length + lost.headings.length + lost.names.length > 0;
    files.push({ file: rel, changed: true, regression, lost, added: d.added, removed: d.removed, diff: d.lines });
  }
  return { compared: files.length, changed: files.filter((f) => f.changed).length, regressions: files.filter((f) => f.regression).length, files, only_in_base: ab.filter((x) => !ar.includes(x)), only_in_run: ar.filter((x) => !ab.includes(x)) };
}

// --- visual -------------------------------------------------------------------------------------------------------

function captureMeta(man, rel) {
  const item = (man?.captures?.items || []).find((i) => i.file === `evidence/screens/${rel}` || i.file === rel);
  if (item) return item;
  const m = /^([^/]+)\/([^/]+)\/(\d+)-(light|dark)(?:-(.+))?\.png$/.exec(rel);
  return m ? { route: null, slug: m[1], state: m[2], width: Number(m[3]), theme: m[4], preference: m[5] || 'default' } : {};
}

function intersects(a, b, margin = 24) {
  return a[0] < b[0] + b[2] + margin && b[0] < a[0] + a[2] + margin && a[1] < b[1] + b[3] + margin && b[1] < a[1] + a[3] + margin;
}

async function diffVisual(baseDir, runDir, runOutDir, img, { fixedBoxes, dsf = 1, runMan }) {
  const sb = walkFilesRel(path.join(baseDir, 'evidence', 'screens'), '.png');
  const sr = walkFilesRel(path.join(runDir, 'evidence', 'screens'), '.png');
  const common = sb.filter((x) => sr.includes(x));
  const captures = [];
  for (const rel of common) {
    let a;
    let b;
    try {
      a = decodePng(img.PNG, fs.readFileSync(path.join(baseDir, 'evidence', 'screens', rel)));
      b = decodePng(img.PNG, fs.readFileSync(path.join(runDir, 'evidence', 'screens', rel)));
    } catch (err) {
      captures.push({ file: rel, error: `could not decode: ${err.message}` });
      continue;
    }
    const d = diffImages(img.pixelmatch, a, b, { threshold: 0.1 });
    const entry = { file: rel, ratio: Math.round(d.ratio * 1e6) / 1e6, changed_px: d.changed, size: { base: [a.width, a.height], run: [b.width, b.height] } };
    if (d.changed) {
      const regions = changedRegions(d.mask, d.width, d.height).map((r) => r.map((v) => Math.round(v / dsf)));
      entry.regions = regions;
      const meta = captureMeta(runMan, rel);
      const boxes = fixedBoxes.filter((x) => (!meta.route || x.route === meta.route) && (!meta.state || x.state === meta.state) && (!meta.width || !x.width || x.width === meta.width) && (!meta.theme || !x.theme || x.theme === meta.theme));
      entry.collateral = regions.filter((r) => !boxes.some((x) => intersects(r, x.bbox)));
      // A diff image: the run capture dimmed, changed pixels in red.
      const out = { width: d.width, height: d.height, data: new Uint8Array(d.width * d.height * 4) };
      for (let y = 0; y < d.height; y += 1) {
        for (let x = 0; x < d.width; x += 1) {
          const o = (y * d.width + x) * 4;
          if (d.mask[y * d.width + x]) {
            out.data.set([230, 20, 20, 255], o);
          } else if (x < b.width && y < b.height) {
            const s = (y * b.width + x) * 4;
            const g = Math.round(0.3 * b.data[s] + 0.59 * b.data[s + 1] + 0.11 * b.data[s + 2]);
            const v = Math.round(255 - (255 - g) * 0.35);
            out.data.set([v, v, v, 255], o);
          } else out.data.set([255, 255, 255, 255], o);
        }
      }
      const file = path.join(runOutDir, 'visual', rel);
      ensureDir(path.dirname(file));
      fs.writeFileSync(file, encodePng(img.PNG, out));
      entry.diff_image = path.relative(runDir, file).split(path.sep).join('/');
    }
    captures.push(entry);
  }
  return { compared: captures.length, changed: captures.filter((c) => c.changed_px).length, with_collateral: captures.filter((c) => c.collateral && c.collateral.length).length, captures, only_in_base: sb.filter((x) => !sr.includes(x)), only_in_run: sr.filter((x) => !sb.includes(x)) };
}

// --- command ------------------------------------------------------------------------------------------------------

function summaryMd({ base, run, parts, fd, reg, vis, aria, mismatch, applied }) {
  const L = [`# Diff ${base} → ${run}`, '', `Computed ${isoNow()}. Parts: ${parts.join(', ')}.`, ''];
  if (mismatch.length) L.push('## Scope differences', '', 'The runs do not share one scope; clears outside the run\'s scope are not evidence of a fix.', '', ...mismatch.map((m) => `- ${m}`), '');
  if (fd) {
    L.push('## Findings (identity-based)', '', `Sources: base ${fd.sources.base || 'none'}, run ${fd.sources.run || 'none'}.`, '');
    L.push(`- cleared: ${fd.cleared.length}`, `- cleared (scope not re-checked): ${fd.cleared_not_rechecked.length}`, `- introduced: ${fd.introduced.length}`, `- persisting: ${fd.persisting.length} (${fd.persisting.filter((p) => p.partially_fixed).length} partially fixed)`, `- judged, not re-checked in this run: ${fd.judged_not_rechecked.length}`, '');
    const row = (e, extra = '') => `- ${e.id || '(new)'} ${e.criterion} ${e.routes.join(', ') || '(no route)'} — ${e.title}${extra}`;
    if (fd.introduced.length) L.push('### Introduced (each blocks until explained)', '', ...fd.introduced.map((e) => row(e)), '');
    const inst = fd.persisting.filter((p) => p.introduced_instances && p.introduced_instances.length);
    if (inst.length) L.push('### Introduced instances inside persisting findings', '', ...inst.map((e) => row(e, `: ${e.introduced_instances.length} new instance(s), e.g. ${e.introduced_instances[0].selector || e.introduced_instances[0].snippet || ''}`)), '');
    if (fd.cleared.length) L.push('### Cleared', '', ...fd.cleared.map((e) => row(e)), '');
    if (fd.cleared_not_rechecked.length) L.push('### Cleared (scope not re-checked)', '', ...fd.cleared_not_rechecked.map((e) => row(e, ` (${e.reason})`)), '');
    if (fd.persisting.length) L.push('### Persisting', '', ...fd.persisting.map((e) => row(e, e.note ? ` (${e.note})` : '')), '');
    if (reg) {
      L.push(`### Register ${applied ? 'updates' : 'updates (dry run, not applied)'}`, '', ...(reg.changes.length ? reg.changes.map((c) => `- ${c.id} ${c.criterion}: ${c.from} → ${c.to} (${c.reason})`) : ['- none']), ...reg.unchanged.map((u) => `- ${u.id} ${u.criterion} stays fixed: ${u.reason}`), '');
    }
  }
  if (vis) {
    L.push('## Visual', '');
    if (vis.skipped) L.push(`Not run: ${vis.skipped}`, '');
    else {
      L.push(`${vis.compared} capture(s) compared, ${vis.changed} changed, ${vis.with_collateral} with changes outside the fixed findings' areas (possible collateral).`, '');
      for (const c of vis.captures.filter((x) => x.changed_px).slice(0, 30)) L.push(`- ${c.file}: ${(c.ratio * 100).toFixed(3)}% changed, ${c.regions.length} region(s)${c.collateral.length ? `, ${c.collateral.length} possible collateral` : ''} → ${c.diff_image}`);
      L.push('');
    }
  }
  if (aria) {
    L.push('## ARIA snapshots', '', `${aria.compared} snapshot(s) compared, ${aria.changed} changed, ${aria.regressions} with lost landmarks, headings or names.`, '');
    for (const f of aria.files.filter((x) => x.regression).slice(0, 20)) {
      const parts2 = [...f.lost.landmarks.map((x) => `landmark ${x.role}${x.name ? ` "${x.name}"` : ''}`), ...f.lost.headings.map((x) => `heading "${x.name}"`), ...f.lost.names.map((x) => `${x.role} "${x.name}" lost its name`)];
      L.push(`- ${f.file}: ${parts2.slice(0, 6).join('; ')}`);
    }
    L.push('');
  }
  return `${L.join('\n')}\n`;
}

export async function run(args, ctx) {
  const [baseId, runId] = args._;
  if (!baseId || !runId) throw new UsageError('usage: uie diff <base> <run> [--visual] [--aria] [--findings]');
  const b = resolveRun(ctx.root, baseId);
  const r = resolveRun(ctx.root, runId);
  if (b.id === r.id) throw new UsageError('base and run are the same run');
  const explicit = ['findings', 'visual', 'aria'].filter((k) => args[k]);
  const parts = explicit.length ? explicit : ['findings', 'visual', 'aria'];
  const outDir = ensureDir(path.join(r.dir, 'diff'));
  const baseMan = readJson(path.join(b.dir, 'manifest.json'), null);
  const runMan = readJson(path.join(r.dir, 'manifest.json'), null);
  const mismatch = scopeMismatch(baseMan, runMan);
  const apply = !args['no-apply'];
  let fd = null;
  let reg = null;
  let vis = null;
  let aria = null;
  if (parts.includes('findings')) {
    const bf = loadRunFindings(b.dir);
    const rf = loadRunFindings(r.dir);
    if (!bf.source) throw new UsageError(`base run ${b.id} has no findings (no findings.json, merged.json or tool-findings.jsonl)`);
    const runChecks = readJson(path.join(r.dir, 'checks.json'), { checks: {} }).checks || {};
    const d = diffFindings(bf.findings, rf.findings, { runChecks, runJudged: rf.judged });
    fd = { schema: 'diff-findings', base: b.id, run: r.id, at: isoNow(), sources: { base: bf.source, run: rf.source }, scope_mismatch: mismatch, counts: Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.length])), ...d };
    const register = readRegister(ctx.root);
    reg = applyDiffToRegister(apply ? register : JSON.parse(JSON.stringify(register)), d, { base: b.id, run: r.id });
    fd.register = { applied: apply, ...reg };
    if (apply && reg.changes.length) {
      writeRegister(ctx.root, register);
      appendIndex(ctx.root, `diff ${b.id} → ${r.id}: ${reg.changes.map((c) => `${c.id} ${c.to}`).join(', ')}`);
    }
    writeJson(path.join(outDir, 'findings.json'), fd);
  }
  if (parts.includes('visual')) {
    const img = await loadImageDeps(ctx.root);
    if (!img) {
      if (explicit.includes('visual')) throw new UsageError('--visual needs pngjs and pixelmatch: run `uie doctor` (`uie doctor --install` after the owner agrees)');
      vis = { skipped: 'pngjs and pixelmatch are not installed (`uie doctor --install`)' };
      ctx.warn(`visual diff not run: ${vis.skipped}`);
    } else {
      const fixedBoxes = [];
      for (const e of [...(fd?.cleared || []), ...(fd?.persisting || [])]) for (const l of [...(e.locations || []), ...(e.cleared_locations || [])]) if (Array.isArray(l.bbox)) fixedBoxes.push({ route: l.route, state: l.state, width: l.viewport?.width, theme: l.theme, bbox: l.bbox });
      vis = await diffVisual(b.dir, r.dir, outDir, img, { fixedBoxes, dsf: runMan?.scope?.matrix?.device_scale_factor || 1, runMan });
    }
    writeJson(path.join(outDir, 'visual.json'), { schema: 'diff-visual', base: b.id, run: r.id, at: isoNow(), threshold: 0.1, ...vis });
  }
  if (parts.includes('aria')) {
    aria = diffAria(b.dir, r.dir);
    writeJson(path.join(outDir, 'aria.json'), { schema: 'diff-aria', base: b.id, run: r.id, at: isoNow(), ...aria });
  }
  writeText(path.join(outDir, 'summary.md'), summaryMd({ base: b.id, run: r.id, parts, fd, reg, vis, aria, mismatch, applied: apply }));
  const introducedInstances = fd ? fd.persisting.reduce((a, p) => a + (p.introduced_instances?.length || 0), 0) : 0;
  const problems = (fd ? fd.introduced.length + introducedInstances : 0) + (aria ? aria.regressions : 0) + mismatch.length;
  ctx.result({ base: b.id, run: r.id, parts, dir: path.relative(ctx.root, outDir), scope_mismatch: mismatch, findings: fd ? { ...fd.counts, partially_fixed: fd.persisting.filter((p) => p.partially_fixed).length, introduced_instances: introducedInstances, register: fd.register } : null, visual: vis ? { compared: vis.compared, changed: vis.changed, with_collateral: vis.with_collateral, skipped: vis.skipped || null } : null, aria: aria ? { compared: aria.compared, changed: aria.changed, regressions: aria.regressions } : null });
  ctx.print(`diff ${b.id} → ${r.id}`);
  if (mismatch.length) ctx.print(`  scope differs: ${mismatch.join('; ')}`);
  if (fd) {
    ctx.print(`  findings (${fd.sources.base} → ${fd.sources.run}): ${fd.cleared.length} cleared, ${fd.cleared_not_rechecked.length} cleared (scope not re-checked), ${fd.introduced.length} introduced, ${fd.persisting.length} persisting (${fd.persisting.filter((p) => p.partially_fixed).length} partially fixed, ${introducedInstances} introduced instance(s))${fd.judged_not_rechecked.length ? `, ${fd.judged_not_rechecked.length} judged not re-checked` : ''}`);
    for (const c of reg.changes) ctx.print(`  register${apply ? '' : ' (dry run)'}: ${c.id} ${c.criterion} ${c.from} → ${c.to} — ${c.reason}`);
    for (const u of reg.unchanged) ctx.print(`  register: ${u.id} ${u.criterion} stays fixed — ${u.reason}`);
  }
  if (vis) ctx.print(vis.skipped ? `  visual: not run (${vis.skipped})` : `  visual: ${vis.compared} capture(s) compared, ${vis.changed} changed, ${vis.with_collateral} with possible collateral`);
  if (aria) ctx.print(`  aria: ${aria.compared} snapshot(s) compared, ${aria.changed} changed, ${aria.regressions} with lost landmarks, headings or names`);
  ctx.print(`  → ${path.relative(ctx.root, outDir)}/summary.md`);
  return problems ? 2 : 0;
}
