// Shared helpers for the build benchmark (tools/bench/*): repository paths, the round layout, seeded shuffles,
// assertion kinds and the person's verdict line from the judging page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const SKILL_DIR = path.join(ROOT, 'skills/ui-evaluator');
export const CONFIGS = ['with_skill', 'without_skill'];
export const QUESTIONS = ['more_beautiful', 'less_generic', 'better_overall'];

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 1)}\n`);
}

/** Command-line options: positional arguments plus `--name value` pairs; repeated names collect into arrays. */
export function parseArgs(argv, { repeat = [] } = {}) {
  const pos = [];
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      pos.push(a);
      continue;
    }
    const name = a.slice(2);
    const value = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[(i += 1)] : true;
    if (repeat.includes(name)) (opts[name] = opts[name] || []).push(value);
    else opts[name] = value;
  }
  return { pos, opts };
}

export function usage(text, ok = false) {
  (ok ? console.log : console.error)(text.trim());
  process.exit(ok ? 0 : 1);
}

/** mulberry32: a small seeded generator, so a round's A/B and X/Y assignments can be derived again from its seed. */
export function rng(seed) {
  let a = Number(seed) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(items, random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const loadEvals = () => readJson(path.join(ROOT, 'evals/evals.json')).evals;
export const evalDirName = (e) => `eval-${e.id}-${e.name}`;

/** The eval behind a round folder name such as `eval-17-build-en-food-bank-tool`. */
export function evalOfDir(dir, evals = loadEvals()) {
  const id = Number((/^eval-(\d+)-/.exec(dir) || [])[1]);
  return evals.find((e) => e.id === id) || null;
}

/** Every run folder in a round: <round>/<eval-dir>/<config>/run-<n>. */
export function listRuns(round) {
  const out = [];
  for (const ev of fs.existsSync(round) ? fs.readdirSync(round).sort() : []) {
    if (!ev.startsWith('eval-')) continue;
    for (const config of CONFIGS) {
      const base = path.join(round, ev, config);
      if (!fs.existsSync(base)) continue;
      for (const r of fs.readdirSync(base)) {
        const m = /^run-(\d+)$/.exec(r);
        if (m) out.push({ eval: ev, config, run: Number(m[1]), dir: path.join(base, r) });
      }
    }
  }
  return out.sort((a, b) => a.eval.localeCompare(b.eval) || a.config.localeCompare(b.config) || a.run - b.run);
}

/**
 * Assertions about the skill's own files (PRODUCT.md, DESIGN.md, the direction roll, the ledger, the self-check run).
 * A build without the skill cannot pass them, so comparisons between configurations use the output assertions only:
 * the checks on the shipped page and the reply, which are the same for both.
 */
const PROCESS = [/^PRODUCT\.md exists/, /^DESIGN\.md exists/, /^A seeded direction roll/, /^The project ledger/, /^A mechanical self-check run/, /^PRODUCT\.md records/];
export const assertionKind = (text) => (PROCESS.some((re) => re.test(text)) ? 'process' : 'output');

/** Passed and total for one kind of assertion in a grading.json (older files carry no `kind`; it is derived). */
export function scoreOf(grading, kind = 'output') {
  const list = (grading?.expectations || []).filter((e) => (e.kind || assertionKind(e.text)) === kind);
  return { passed: list.filter((e) => e.passed).length, total: list.length };
}

// The judging page's answer words, in both of its languages.
const QUESTION_WORDS = { 更美: 'more_beautiful', 更不像模板: 'less_generic', 会发布: 'better_overall', 'more beautiful': 'more_beautiful', 'less template-like': 'less_generic', 'would publish': 'better_overall' };
const ANSWER_WORDS = { 技能版: 'with_skill', 基线: 'without_skill', 差不多: 'tie', skill: 'with_skill', baseline: 'without_skill', tie: 'tie', 'About the same': 'tie', X: 'X', Y: 'Y' };
const NOTE = /[；;]\s*(?:意见：|note:\s*)([\s\S]*)$/;

/**
 * Read the line the judging page gives the person to copy, e.g.
 * `页面盲评 | p1(zh-calligraphy-signup#2) 更美=X；更不像模板=Y；会发布=差不多 | p2(…) …`,
 * and return one verdict per pair, with X and Y unblinded and the pair mapped to eval and run through the page's key.
 * Lines from earlier pages that named the configurations themselves (技能版, 基线) are read as well.
 */
export function parseVerdictLine(line, key) {
  const out = [];
  for (const part of String(line).split('|').map((s) => s.trim())) {
    const m = /^(p\d+)\([^)]*\)\s+([\s\S]+)$/.exec(part);
    if (!m) continue;
    const [, pid, body] = m;
    if (!key[pid]) throw new Error(`${pid} is not in the judging page's key`);
    const note = (NOTE.exec(body) || [])[1];
    const answers = body.replace(NOTE, '').split(/[；;]/).map((s) => s.trim()).filter(Boolean);
    const v = { pid, eval: key[pid].eval, run: key[pid].run };
    for (const a of answers) {
      const [q, ans] = a.split('=').map((s) => s.trim());
      if (!QUESTION_WORDS[q] || !ANSWER_WORDS[ans]) throw new Error(`cannot read "${a}" in ${pid}`);
      const word = ANSWER_WORDS[ans];
      v[QUESTION_WORDS[q]] = word === 'X' || word === 'Y' ? key[pid][word] : word;
    }
    for (const q of QUESTIONS) if (!v[q]) throw new Error(`${pid} has no answer for ${q}`);
    if (note) v.note = note.trim();
    out.push(v);
  }
  if (!out.length) throw new Error('no pair found in the verdict line');
  return out;
}

/** How often each configuration won each question. */
export function tally(verdicts, questions = QUESTIONS) {
  return Object.fromEntries(questions.map((q) => [q, Object.fromEntries(['with_skill', 'tie', 'without_skill'].map((k) => [k, verdicts.filter((v) => v[q] === k).length]))]));
}
