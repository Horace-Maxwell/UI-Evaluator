#!/usr/bin/env node
// Variety across briefs (EVALUATION-PLAN §4.2 and §6, CRAFT-029): do the pages built with the skill resemble each
// other less, across different briefs, than the pages built without it?
//   node tools/bench/variety.mjs <round> [<round> …] [--seed <n>] [--reps <n>] [--out <file>]
// Each run's landing page (`blind-site/` from grade-build.mjs, or the project's own server) is rendered at 1280 × 900
// with reduced motion, and its macrostructure read from the DOM: the page's top-level blocks in order, each typed by
// what it holds (h1, heading, form, cards, items, list, table, faq, deflist, quote, media, action, cols2/cols3, text).
// Two pages are compared by Jaccard similarity over the shingles of their block sequence (`sections`) and of their
// component sequence (`components`); `structure` is the mean of the two. For each configuration the tool reports the
// mean similarity over pairs of pages from different briefs, and the difference (without − with: above 0 means the
// skill's pages vary more) with a 95% interval from a bootstrap over briefs. The release bar needs ≥ 10 briefs and
// the interval above 0. Image-embedding similarity, the plan's second measure, needs a model and is not computed.
// Needs the browser runtime (`node skills/ui-evaluator/scripts/uie.mjs doctor --install`).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CONFIGS, SKILL_DIR, findServerApp, listRuns, parseArgs, rng, startServerApp, usage, writeJson } from './lib.mjs';

export const MIN_BRIEFS = 10;
const FEATURE_ORDER = ['h1', 'heading', 'cols2', 'cols3', 'form', 'cards', 'items', 'list', 'table', 'faq', 'deflist', 'quote', 'media', 'action', 'text'];

/**
 * Runs in the page: the macrostructure of the rendered document. Content waiting for a scroll entrance still counts
 * (opacity is ignored); only what is not rendered at all (display none, hidden, aria-hidden, zero size) is left out.
 */
export function outlineInPage(featureOrder) {
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'LINK', 'META', 'BR', 'HR']);
  const rect = (el) => el.getBoundingClientRect();
  const shown = (el) => {
    if (SKIP.has(el.tagName) || el.closest('[aria-hidden="true"],[hidden],dialog:not([open])')) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = rect(el);
    // Off-screen skip links and visually hidden text are not part of the page's structure.
    return r.width >= 2 && r.height >= 2 && r.right > 0 && r.left < innerWidth && r.bottom > -scrollY;
  };
  const kids = (el) => [...el.children].filter(shown);
  const visible = (el, sel) => [...el.querySelectorAll(sel)].filter(shown);
  const role = (el) => (el.getAttribute('role') || '').toLowerCase();
  // A wrapper whose one rendered child carries everything is looked through.
  const unwrap = (el) => {
    let k = kids(el);
    while (k.length === 1 && kids(k[0]).length) k = kids(k[0]);
    return k;
  };
  const chromeOf = (el) => {
    const t = el.tagName;
    const r = role(el);
    // A tall page header that holds the hero is content: its parts are visited, and its navigation is chrome.
    if ((t === 'HEADER' && !el.closest('main,article,section')) || r === 'banner') return rect(el).height > innerHeight * 0.4 && visible(el, 'h1').length ? null : 'header';
    if ((t === 'FOOTER' && !el.closest('main,article,section')) || r === 'contentinfo') return 'footer';
    if (t === 'NAV' || r === 'navigation') return 'nav';
    // A short bar around the navigation (logo and links in a div) is the same chrome.
    if (rect(el).height < innerHeight * 0.25 && visible(el, 'nav,[role=navigation]').length && !visible(el, 'h1,h2,h3').length) return 'nav';
    return null;
  };
  const isMain = (el) => el.tagName === 'MAIN' || role(el) === 'main';
  const isHeroHeader = (el) => (el.tagName === 'HEADER' || role(el) === 'banner') && unwrap(el).length >= 2;
  const stacked = (list) => list.length >= 2 && list.every((c, i) => i === 0 || rect(c).top >= rect(list[i - 1]).bottom - 4);
  const BLOCK_TAGS = /^(SECTION|ARTICLE|FORM|ASIDE|TABLE|UL|OL|DL|FIGURE|DETAILS)$/;
  // A container whose children, stacked one under another, are sections of their own (the div soup of a page) is
  // expanded, not typed as one block. A child is a section when it is one, holds its own heading, or is tall.
  const sectionLike = (c) => /^(SECTION|ARTICLE)$/.test(c.tagName) || (!/^H[1-6]$/.test(c.tagName) && visible(c, 'h1,h2,h3,h4,[role=heading]').length > 0) || rect(c).height >= innerHeight * 0.4;
  const isWrapper = (el) => {
    if (BLOCK_TAGS.test(el.tagName)) return false;
    const k = unwrap(el);
    return stacked(k) && k.filter(sectionLike).length >= 2;
  };
  const blocks = [];
  const visit = (list, depth) => {
    for (const el of list) {
      const chrome = chromeOf(el);
      if (chrome) blocks.push({ el, chrome });
      else if (isMain(el) || (depth < 4 && (isWrapper(el) || isHeroHeader(el)))) visit(unwrap(el), depth + 1);
      else blocks.push({ el });
    }
  };
  visit(unwrap(document.body), 0);

  const sig = (el) => `${el.tagName}.${[...el.classList].sort().join('.')}`;
  const buttonLike = (a) => {
    const cs = getComputedStyle(a);
    const filled = cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
    const bordered = parseFloat(cs.borderTopWidth) >= 1 && parseFloat(cs.paddingLeft) >= 8;
    return filled || bordered;
  };
  const repeated = (root) => {
    // The largest run of three or more rendered siblings with the same tag and classes, each holding some text.
    let best = null;
    for (const parent of [root, ...visible(root, '*')]) {
      const groups = new Map();
      for (const c of kids(parent)) {
        if ((c.innerText || '').trim().length < 10) continue;
        const key = sig(c);
        groups.set(key, [...(groups.get(key) || []), c]);
      }
      for (const g of groups.values()) if (g.length >= 3 && (!best || g.length > best.length)) best = g;
    }
    if (!best) return null;
    const tops = best.map((c) => Math.round(rect(c).top));
    return new Set(tops).size < tops.length ? 'cards' : 'items';
  };
  const features = (el) => {
    const f = new Set();
    if (visible(el, 'h1').length || el.tagName === 'H1') f.add('h1');
    else if (visible(el, 'h2,h3,h4,[role=heading]').length || /^H[2-4]$/.test(el.tagName)) f.add('heading');
    const cols = unwrap(el).filter((c) => rect(c).width >= rect(el).width * 0.2);
    const firstRow = cols.filter((c) => cols.length && Math.abs(rect(c).top - rect(cols[0]).top) < 8);
    if (firstRow.length === 2) f.add('cols2');
    if (firstRow.length >= 3) f.add('cols3');
    if (el.tagName === 'FORM' || visible(el, 'form').length || visible(el, 'input:not([type=hidden]),select,textarea').length >= 2) f.add('form');
    const rep = repeated(el);
    if (rep) f.add(rep);
    else if (visible(el, 'ul,ol').some((l) => kids(l).length >= 3)) f.add('list');
    if (el.tagName === 'TABLE' || visible(el, 'table').length) f.add('table');
    if (el.tagName === 'DETAILS' || visible(el, 'details').length) f.add('faq');
    if (el.tagName === 'DL' || visible(el, 'dl').length) f.add('deflist');
    if (visible(el, 'blockquote').length) f.add('quote');
    if (visible(el, 'img,picture,video,canvas,iframe,svg').some((m) => rect(m).width >= 120 && rect(m).height >= 80)) f.add('media');
    if (visible(el, 'button,input[type=submit],input[type=button],[role=button]').length || visible(el, 'a[href]').some(buttonLike) || (el.tagName === 'BUTTON')) f.add('action');
    if (!f.size && (el.innerText || '').trim()) f.add('text');
    return featureOrder.filter((x) => f.has(x));
  };
  const out = blocks.map(({ el, chrome }) => {
    const feats = chrome ? [] : features(el);
    return { tag: el.tagName.toLowerCase(), token: chrome || feats.join('+') || 'empty', features: chrome ? [chrome] : feats };
  });
  return {
    sections: out.map((b) => b.token),
    components: out.flatMap((b) => b.features),
    blocks: out.map((b) => ({ tag: b.tag, token: b.token })),
  };
}

/** Unigrams of the sequence plus its n-grams up to `n`, with start and end markers so order and ends count. */
export function shingles(seq, n = 2) {
  const s = ['^', ...seq, '$'];
  const out = new Set(seq);
  for (let k = 2; k <= n; k += 1) for (let i = 0; i + k <= s.length; i += 1) out.add(s.slice(i, i + k).join(' '));
  return out;
}

export function jaccard(a, b) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}

export function pageSimilarity(a, b) {
  const sections = jaccard(shingles(a.sections), shingles(b.sections));
  const components = jaccard(shingles(a.components), shingles(b.components));
  return { sections, components, structure: (sections + components) / 2 };
}

const MEASURES = ['structure', 'sections', 'components'];
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const round3 = (x) => (x === null ? null : Math.round(x * 1000) / 1000);

/**
 * Cross-brief similarity per configuration and the difference between them.
 * `pages`: [{ brief, config, outline }]. Pairs are taken within a configuration, between pages of different briefs.
 * The interval resamples briefs with replacement (the same draw for both configurations, as they share the briefs);
 * pairs between two draws of the same brief are left out, as they are not across briefs.
 */
export function crossBriefVariety(pages, { seed = 1, reps = 2000, measures = MEASURES } = {}) {
  const briefs = [...new Set(pages.map((p) => p.brief))].sort();
  const sim = new Map();
  const simOf = (i, j) => {
    const key = i < j ? `${i}|${j}` : `${j}|${i}`;
    if (!sim.has(key)) sim.set(key, pageSimilarity(pages[i].outline, pages[j].outline));
    return sim.get(key);
  };
  const byBrief = (config) => Object.fromEntries(briefs.map((b) => [b, pages.map((p, i) => (p.brief === b && p.config === config ? i : -1)).filter((i) => i >= 0)]));
  const idx = Object.fromEntries(CONFIGS.map((c) => [c, byBrief(c)]));
  const meanFor = (config, draw, measure) => {
    const xs = [];
    for (let p = 0; p < draw.length; p += 1) {
      for (let q = p + 1; q < draw.length; q += 1) {
        if (draw[p] === draw[q]) continue;
        for (const i of idx[config][draw[p]]) for (const j of idx[config][draw[q]]) xs.push(simOf(i, j)[measure]);
      }
    }
    return { mean: mean(xs), pairs: xs.length };
  };
  const random = rng(seed);
  const result = { briefs: briefs.length, page_counts: Object.fromEntries(CONFIGS.map((c) => [c, pages.filter((p) => p.config === c).length])), seed, reps, measures: {} };
  for (const m of measures) {
    const point = Object.fromEntries(CONFIGS.map((c) => [c, meanFor(c, briefs, m)]));
    const diffs = [];
    for (let r = 0; r < reps; r += 1) {
      const draw = briefs.map(() => briefs[Math.floor(random() * briefs.length)]);
      const w = meanFor('with_skill', draw, m).mean;
      const wo = meanFor('without_skill', draw, m).mean;
      if (w !== null && wo !== null) diffs.push(wo - w);
    }
    diffs.sort((a, b) => a - b);
    const q = (p) => (diffs.length ? diffs[Math.min(diffs.length - 1, Math.floor(p * diffs.length))] : null);
    const diff = point.with_skill.mean !== null && point.without_skill.mean !== null ? point.without_skill.mean - point.with_skill.mean : null;
    result.measures[m] = {
      with_skill: round3(point.with_skill.mean),
      without_skill: round3(point.without_skill.mean),
      pairs: { with_skill: point.with_skill.pairs, without_skill: point.without_skill.pairs },
      difference: round3(diff),
      ci95: diffs.length ? [round3(q(0.025)), round3(q(0.975))] : null,
      reps_used: diffs.length,
    };
  }
  const s = result.measures.structure;
  result.bar = {
    rule: `mean cross-brief structural similarity lower with the skill, the 95% interval of the difference above 0, over ≥ ${MIN_BRIEFS} briefs`,
    met: Boolean(s && briefs.length >= MIN_BRIEFS && s.ci95 && s.ci95[0] > 0),
    note: briefs.length < MIN_BRIEFS ? `pilot: ${briefs.length} briefs, below the ${MIN_BRIEFS} the bar needs` : null,
  };
  return result;
}

const lib = (p) => import(pathToFileURL(path.join(SKILL_DIR, 'scripts/lib', p)).href);

/** Serve one run's landing page: its blind copy when it is static, the project's own server when it has one. */
async function serveRun(dir, serveStatic) {
  const blind = path.join(dir, 'blind-site');
  const project = path.join(dir, 'outputs/project');
  if (fs.existsSync(path.join(blind, 'index.html'))) return serveStatic(blind);
  const app = fs.existsSync(project) ? findServerApp(project) : null;
  if (app) return startServerApp(project, app);
  return null;
}

async function main() {
  const { pos, opts } = parseArgs(process.argv.slice(2));
  if (!pos.length || opts.help) usage('usage: node tools/bench/variety.mjs <round> [<round> …] [--seed <n>] [--reps <n>] [--out <file>]', Boolean(opts.help));
  const { loadBrowserDeps } = await lib('deps.mjs');
  const { launchBrowser, newGuardedContext } = await lib('browser/launch.mjs');
  const { serveStatic } = await lib('browser/static-server.mjs');
  const deps = await loadBrowserDeps();
  const browser = await launchBrowser(deps);
  const pages = [];
  const problems = [];
  try {
    for (const round of pos) {
      for (const run of listRuns(path.resolve(round))) {
        const brief = run.eval.replace(/^eval-\d+-/, '');
        const srv = await serveRun(run.dir, serveStatic);
        if (!srv) {
          problems.push(`${run.eval}/${run.config}/run-${run.run}: no blind-site/index.html and no server (run grade-build.mjs first)`);
          continue;
        }
        const context = await newGuardedContext(browser, { width: 1280, height: 900, reducedMotion: 'reduce' });
        try {
          const page = await context.newPage();
          await page.goto(srv.url, { waitUntil: 'load', timeout: 20000 });
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
          // Walk down the page once, so content that renders on scroll is in the DOM, then return to the top.
          await page.evaluate(async () => {
            for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
              window.scrollTo(0, y);
              await new Promise((r) => setTimeout(r, 60));
            }
            window.scrollTo(0, 0);
          });
          const outline = await page.evaluate(outlineInPage, FEATURE_ORDER);
          pages.push({ round: path.basename(round), brief, eval: run.eval, config: run.config, run: run.run, outline });
        } catch (err) {
          problems.push(`${run.eval}/${run.config}/run-${run.run}: ${String(err.message || err).split('\n')[0]}`);
        } finally {
          await context.close();
          await srv.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  const variety = crossBriefVariety(pages, { seed: Number(opts.seed || 1), reps: Number(opts.reps || 2000) });
  const out = {
    measured: new Date().toISOString().slice(0, 10),
    rounds: pos.map((r) => path.basename(r)),
    method: 'landing page at 1280 × 900, reduced motion; Jaccard over 1- and 2-gram shingles of the block sequence (sections) and component sequence (components); structure = their mean; bootstrap over briefs',
    ...variety,
    problems,
    pages: pages.map((p) => ({ round: p.round, eval: p.eval, config: p.config, run: p.run, macrostructure: p.outline.sections.join(' > '), components: p.outline.components.join(' ') })),
  };
  if (opts.out) writeJson(path.resolve(String(opts.out)), out);
  const s = out.measures.structure;
  console.log(JSON.stringify({ briefs: out.briefs, page_counts: out.page_counts, structure: s, bar: out.bar, problems }, null, 1));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) await main();
