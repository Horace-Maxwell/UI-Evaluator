// axe — A11Y-01 (0 violations of any impact) and the A11Y-02 queue (every `incomplete` item recorded for resolution).
// Tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa (wcag22aa is what enables target-size), over all in-scope
// states × {320, 1280} × shipped themes, on pages from a fresh browser context.
import { AXE_IMPACT_SEVERITY, axeTagToSc } from '../hits.mjs';

export const mode = 'shared';
export const criteria = ['A11Y-01', 'A11Y-02'];
export const summary = 'axe-core with WCAG A/AA tags per state × width × theme; collects incomplete items';
export const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export async function run(ctx) {
  const { AxeBuilder } = ctx.deps;
  if (!AxeBuilder) throw new Error('@axe-core/playwright is not installed (run `uie doctor --install`)');
  const hits = [];
  const incomplete = new Map();
  let engine = null;
  let violationsTotal = 0;
  for await (const pg of ctx.pages(ctx.states({ widths: 'g2', themes: 'all' }))) {
    const ps = pg.ps;
    let res;
    try {
      // options() replaces the whole options object, so it must come before withTags(): the other order drops
      // runOnly and lets best-practice rules (not WCAG) count as A11Y-01 violations.
      res = await new AxeBuilder({ page: pg.page }).options({ resultTypes: ['violations', 'incomplete'] }).withTags(TAGS).analyze();
    } catch (err) {
      ctx.error(`${ps.key}: axe failed: ${err.message.split('\n')[0]}`);
      ctx.partial('axe failed on some page states');
      continue;
    }
    engine = { name: 'axe-core', version: res.testEngine?.version || ctx.deps.axeVersion || 'unknown' };
    ctx.engine = engine;
    const targets = [];
    for (const v of res.violations) for (const n of v.nodes) targets.push(n.target);
    for (const v of res.incomplete) for (const n of v.nodes) targets.push(n.target);
    const geo = await locate(pg.page, targets);
    const rel = ctx.writeEvidence(`axe/${ps.slug}/${ps.state}/${ps.width}-${ps.theme}.json`, {
      url: pg.load.url,
      route: ps.route,
      state: ps.state,
      width: ps.width,
      theme: ps.theme,
      engine,
      tags: TAGS,
      violations: res.violations.map(trimRule),
      incomplete: res.incomplete.map(trimRule),
    });
    for (const v of res.violations) {
      const wcag = [...new Set(v.tags.map(axeTagToSc).filter(Boolean))];
      for (const n of v.nodes) {
        violationsTotal += 1;
        const sel = targetString(n.target);
        const g = geo[sel] || {};
        hits.push(ctx.hit({
          rule: 'A11Y-01',
          wcag,
          title: `axe ${v.id}: ${v.help}`,
          description: `${v.description} (${v.impact || 'unknown'} impact). ${String(n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 400)}`,
          location: ctx.loc(ps, { selector: sel, bbox: g.bbox, snippet: n.html, source: g.source }),
          evidence: [{ type: 'tool', value: v.id, detail: `${v.impact || ''}; ${v.helpUrl}`.slice(0, 300), ref: rel }],
          severity: AXE_IMPACT_SEVERITY[v.impact] || 2,
          recommendation: v.help,
          extra: { axe: { rule: v.id, impact: v.impact, tags: v.tags } },
        }));
      }
    }
    for (const v of res.incomplete) {
      for (const n of v.nodes) {
        const sel = targetString(n.target);
        const key = `${ps.route}|${ps.state}|${v.id}|${sel}`;
        if (!incomplete.has(key)) {
          incomplete.set(key, {
            id: `INC-${incomplete.size + 1}`,
            rule: v.id,
            impact: v.impact,
            help: v.help,
            route: ps.route,
            state: ps.state,
            selector: sel,
            bbox: geo[sel]?.bbox || null,
            html: String(n.html || '').slice(0, 300),
            message: String(n.failureSummary || n.any?.[0]?.message || '').replace(/\s+/g, ' ').slice(0, 300),
            data: n.any?.[0]?.data || null,
            seen_at: [],
            resolver: v.id === 'color-contrast' || v.id === 'color-contrast-enhanced' ? 'contrast' : 'auditor',
          });
        }
        incomplete.get(key).seen_at.push(`${ps.width}-${ps.theme}`);
      }
    }
  }
  const items = [...incomplete.values()];
  const rel = ctx.writeEvidence('axe/incomplete.json', { engine, items });
  ctx.record({
    tags: TAGS,
    violations: violationsTotal,
    incomplete: items.length,
    incomplete_items: rel,
    incomplete_by_resolver: {
      contrast: items.filter((i) => i.resolver === 'contrast').length,
      auditor: items.filter((i) => i.resolver === 'auditor').length,
    },
  });
  return hits;
}

function targetString(t) {
  if (!Array.isArray(t)) return String(t);
  return t.map((x) => (Array.isArray(x) ? x.join(' >>> ') : x)).join(' >>> ');
}

function trimRule(v) {
  return {
    id: v.id,
    impact: v.impact,
    tags: v.tags,
    help: v.help,
    helpUrl: v.helpUrl,
    nodes: v.nodes.slice(0, 50).map((n) => ({ target: n.target, html: String(n.html || '').slice(0, 300), failureSummary: n.failureSummary, data: n.any?.[0]?.data || null })),
    nodes_total: v.nodes.length,
  };
}

async function locate(page, targets) {
  const sels = [...new Set(targets.map(targetString))].filter((s) => !s.includes('>>>')).slice(0, 400);
  if (!sels.length) return {};
  return page.evaluate((list) => {
    const U = window.__uie;
    const out = {};
    for (const s of list) {
      try {
        const el = document.querySelector(s);
        if (el) out[s] = { bbox: U.docRect(el), source: U.sourceOf(el) };
      } catch {
        /* invalid selector */
      }
    }
    return out;
  }, sels).catch(() => ({}));
}
