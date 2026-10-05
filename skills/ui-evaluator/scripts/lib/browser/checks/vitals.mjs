// vitals — FUN-07 (lab CLS over load + scripted interactions ≤ 0.1, gating) and FUN-08 (lab LCP ≤ 2.5 s and
// INP ≤ 200 ms, advisory: never fails the gate, reported with the noise caveat). QUALITY-BAR G1; TOOL-33.
// The web-vitals attribution IIFE (node_modules/web-vitals) is injected before the first byte, with reportAllChanges.
// Per page state: load → LCP read once stable → scroll through → state recipe → one safe click on a
// non-destructive control (for INP) → final CLS and INP. A raw layout-shift observer cross-checks CLS. A metric
// that cannot be measured is recorded with its reason and never passes silently.
import path from 'node:path';
import { ensureHelpers } from '../inpage.mjs';
import { scrollThrough } from '../capture.mjs';
import { runActions } from '../actions.mjs';
import { round } from '../thresholds.mjs';

export const mode = 'standalone';
// Measures timing (milliseconds to feedback or to paint): runs alone, after the parallel standalone checks.
export const timed = true;
export const criteria = ['FUN-07', 'FUN-08'];
export const summary = 'lab CLS, LCP and INP (web-vitals attribution build) with one safe interaction';

export const THRESHOLDS = { cls: 0.1, lcp_ms: 2500, inp_ms: 200 };
export const CAVEAT = 'Lab values from one local run on this machine; they vary between runs and are not field data. FUN-08 (LCP, INP) is advisory and never fails the gate.';

/** Registration that runs right after the IIFE in the same init script; stores serialisable values and node refs. */
function registerVitals(wv) {
  const S = { lcp: null, cls: null, inp: null, fcp: null, errors: [], shifts: [], lcpReports: 0 };
  const N = { lcp: null, cls: [], inp: null };
  window.__uieVitals = S;
  window.__uieVitalsNodes = N;
  if (!wv) S.errors.push('the web-vitals IIFE did not load');
  const num = (v) => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null);
  const pick = (o, keys) => {
    const out = {};
    for (const k of keys) {
      const v = o ? o[k] : undefined;
      if (v === undefined || v === null || typeof v === 'object') continue;
      out[k] = typeof v === 'number' ? num(v) : v;
    }
    return out;
  };
  const rect = (r) => (r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null);
  try {
    if (!wv) throw new Error('web-vitals unavailable');
    wv.onLCP(
      (m) => {
        S.lcpReports += 1;
        S.lcp = { value: num(m.value), rating: m.rating, attribution: pick(m.attribution, ['target', 'url', 'timeToFirstByte', 'resourceLoadDelay', 'resourceLoadDuration', 'elementRenderDelay']) };
        const entry = (m.attribution && m.attribution.lcpEntry) || (m.entries && m.entries[m.entries.length - 1]) || null;
        N.lcp = entry && entry.element ? entry.element : null;
      },
      { reportAllChanges: true },
    );
    wv.onCLS(
      (m) => {
        S.cls = { value: num(m.value), rating: m.rating, entries: m.entries.length, attribution: pick(m.attribution, ['largestShiftTarget', 'largestShiftTime', 'largestShiftValue', 'loadState']) };
        const src = [];
        for (const e of m.entries) for (const s of e.sources || []) if (s.node && s.node.nodeType === 1) src.push({ node: s.node, value: e.value, t: Math.round(e.startTime), prev: rect(s.previousRect), cur: rect(s.currentRect) });
        N.cls = src.sort((a, b) => b.value - a.value).slice(0, 5);
      },
      { reportAllChanges: true },
    );
    wv.onINP(
      (m) => {
        S.inp = { value: num(m.value), rating: m.rating, attribution: pick(m.attribution, ['interactionTarget', 'interactionType', 'interactionTime', 'inputDelay', 'processingDuration', 'presentationDelay', 'loadState']) };
        const e = m.entries && m.entries[0];
        N.inp = e && e.target && e.target.nodeType === 1 ? e.target : null;
      },
      { reportAllChanges: true, durationThreshold: 16 },
    );
    wv.onFCP((m) => {
      S.fcp = num(m.value);
    });
  } catch (err) {
    S.errors.push(String((err && err.message) || err));
  }
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (S.shifts.length < 300) S.shifts.push({ value: e.value, t: Math.round(e.startTime), input: e.hadRecentInput });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {
    S.errors.push('the layout-shift observer is unavailable');
  }
}

/**
 * The init script: the attribution IIFE, then the registration. The IIFE's `var webVitals` is passed by name, so the
 * script works whether or not the browser wraps init scripts in a function scope.
 */
export function vitalsInitScript(iife) {
  return `${iife}\n;(${registerVitals.toString()})(typeof webVitals !== 'undefined' ? webVitals : window.webVitals);`;
}

/** CLS from raw layout-shift entries: the largest session window (gap < 1 s, span ≤ 5 s), excluding input-driven shifts. */
export function clsFromShifts(shifts) {
  const list = (shifts || []).filter((s) => !s.input).sort((a, b) => a.t - b.t);
  let best = 0;
  let cur = 0;
  let first = null;
  let prev = null;
  for (const s of list) {
    if (prev !== null && s.t - prev < 1000 && s.t - first < 5000) cur += s.value;
    else {
      cur = s.value;
      first = s.t;
    }
    prev = s.t;
    best = Math.max(best, cur);
  }
  return Math.round(best * 10000) / 10000;
}

/** Pick one safe control to click for INP: a disclosure, tab, toggle or plain button — never a link or a submit. */
function pickSafeControl() {
  const U = window.__uie;
  const DANGER = /\b(delete|remove|destroy|discard|erase|clear|reset|cancel|pay|buy|purchase|checkout|order|submit|send|sign ?(in|out|up)|log ?(in|out)|unsubscribe|confirm|publish|deploy|archive|transfer|withdraw|upload|download|print|share|close)\b|删除|移除|清空|支付|购买|下单|提交|发送|登录|退出|注销|确认|发布|上传|下载/i;
  const sensitiveForm = (el) => {
    const f = el.closest('form');
    return !!f && !!f.querySelector('input[type=password],input[autocomplete^="cc-"],input[autocomplete="one-time-code"]');
  };
  const rank = (el) => {
    const t = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    if (el.hasAttribute('aria-expanded') && (t === 'button' || role === 'button')) return 1;
    if (t === 'summary') return 2;
    if (role === 'tab') return 3;
    if (el.hasAttribute('aria-pressed') || role === 'switch') return 4;
    if (t === 'input' && ['checkbox', 'radio'].includes(el.type)) return 5;
    if (t === 'button' && (el.getAttribute('type') || '').toLowerCase() === 'button') return 6;
    if (t === 'button' && !el.form) return 7;
    return 0;
  };
  let best = null;
  for (const el of document.querySelectorAll('button,summary,[role=tab],[role=switch],[role=button],[aria-pressed],input[type=checkbox],input[type=radio]')) {
    const r = rank(el);
    if (!r || (best && best.rank <= r)) continue;
    if (!U.isVisible(el) || U.isDisabled(el) || el.closest('a[href]') || el.hasAttribute('formaction') || el.hasAttribute('download')) continue;
    if (sensitiveForm(el)) continue;
    const name = U.accName(el);
    if (DANGER.test(name) || DANGER.test(el.id || '')) continue;
    best = { rank: r, selector: U.selector(el), name: name.slice(0, 80), role: U.role(el), bbox: U.docRect(el) };
    if (r === 1) break;
  }
  return best;
}

/** Selectors, boxes and snippets for the attribution nodes. */
function describeNodes() {
  const U = window.__uie;
  const N = window.__uieVitalsNodes || {};
  const d = (el) => (el && el.isConnected ? { selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el) } : null);
  return { lcp: d(N.lcp), inp: d(N.inp), cls: (N.cls || []).map((s) => ({ ...d(s.node), value: Math.round(s.value * 10000) / 10000, t: s.t, prev: s.prev, cur: s.cur })).filter((s) => s.selector) };
}

const snapshot = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__uieVitals || null))).catch(() => null);

async function waitFor(page, fn, { timeout, interval = 100 }) {
  const end = Date.now() + timeout;
  let last = null;
  for (;;) {
    last = await snapshot(page);
    if (fn(last)) return last;
    if (Date.now() >= end) return last;
    await page.waitForTimeout(interval);
  }
}

/** LCP is read once it has been reported and has not changed for 400 ms (bounded). */
async function waitLcpStable(page, timeout = 3000) {
  const end = Date.now() + timeout;
  let lastValue = null;
  let stableSince = Date.now();
  let last = null;
  for (;;) {
    last = await snapshot(page);
    const v = last?.lcp?.value ?? null;
    if (v !== lastValue) {
      lastValue = v;
      stableSince = Date.now();
    }
    if (v !== null && Date.now() - stableSince >= 400) return last;
    if (Date.now() >= end) return last;
    await page.waitForTimeout(100);
  }
}

function widthsFor(scope) {
  const ws = scope.widths;
  const desktop = ws.includes(1280) ? 1280 : ws[ws.length - 1];
  return [...new Set([ws[0], desktop])];
}

export async function run(ctx) {
  const iife = ctx.deps.webVitalsIife;
  if (!iife) throw new Error('web-vitals is not installed: dist/web-vitals.attribution.iife.js was not found (run `uie doctor`)');
  const script = vitalsInitScript(iife);
  const metrics = [];
  let clsMeasured = 0;
  let clsMissing = 0;
  for (const spec of ctx.states({ widths: widthsFor(ctx.scope), themes: 'first' })) {
    const ps = spec;
    const row = { route: ps.route, state: ps.state, width: ps.width, theme: ps.theme, cls: null, lcp_ms: null, inp_ms: null, unavailable: {} };
    metrics.push(row);
    const pg = await ctx.openPage(spec, { initScripts: [script], settle: false, recipe: false, bare: true });
    try {
      if (!pg.ok) {
        row.unavailable.all = pg.error || 'the page did not load';
        clsMissing += 1;
        continue;
      }
      const page = pg.page;
      const load = await waitLcpStable(page);
      if (load?.errors?.length) row.errors = load.errors;
      await scrollThrough(page).catch(() => {});
      await page.waitForTimeout(250);
      const actions = ps.stateCfg?.actions || [];
      if (actions.length) {
        const res = await runActions(page, actions, { baseUrl: ctx.session.baseUrl, allowRemote: ctx.session.allowRemote, timeout: ctx.session.actionTimeout });
        row.recipe = { ok: res.ok, steps: res.steps.length, error: res.error || undefined };
        if (!res.ok) ctx.note(`${ps.route} (${ps.state}): the state recipe failed during the vitals run (${res.error}); CLS covers the steps that ran`);
      }
      await ensureHelpers(page).catch(() => {});
      const control = await page.evaluate(pickSafeControl).catch(() => null);
      const urlBefore = page.url();
      if (control) {
        try {
          await page.locator(control.selector).first().click({ timeout: 3000, noWaitAfter: true });
          row.interaction = { selector: control.selector, name: control.name, role: control.role };
          await waitFor(page, (s) => s && s.inp && s.inp.value !== null, { timeout: 2500 });
        } catch (err) {
          row.interaction = { selector: control.selector, name: control.name, role: control.role, error: err.message.split('\n')[0].slice(0, 160) };
        }
        if (page.url() !== urlBefore) row.interaction.navigated = page.url();
      }
      await page.waitForTimeout(300);
      const fin = (await snapshot(page)) || {};
      await ensureHelpers(page).catch(() => {});
      const nodes = (await page.evaluate(describeNodes).catch(() => null)) || { lcp: null, inp: null, cls: [] };
      // LCP: the last value reported before input finalised it.
      const lcp = fin.lcp || load?.lcp || null;
      if (lcp && lcp.value !== null) {
        row.lcp_ms = Math.round(lcp.value);
        row.lcp_element = nodes.lcp?.selector || lcp.attribution?.target || null;
        row.lcp_attribution = lcp.attribution;
      } else row.unavailable.lcp = fin.fcp === null || fin.fcp === undefined ? 'no first contentful paint: nothing was painted that LCP could measure' : 'no largest-contentful-paint entry was reported';
      // CLS: web-vitals session-window value; the raw observer is the cross-check and the fallback.
      const raw = clsFromShifts(fin.shifts);
      if (fin.cls && fin.cls.value !== null) {
        row.cls = round(fin.cls.value, 4);
        row.cls_method = 'web-vitals onCLS';
      } else if (Array.isArray(fin.shifts) && !(fin.errors || []).includes('the layout-shift observer is unavailable')) {
        row.cls = raw;
        row.cls_method = 'raw layout-shift observer (web-vitals did not report CLS)';
      } else row.unavailable.cls = 'layout shifts could not be observed (no first contentful paint, or the observer is unavailable)';
      row.cls_raw = raw;
      row.cls_sources = nodes.cls.slice(0, 5);
      if (row.cls !== null) clsMeasured += 1;
      else clsMissing += 1;
      // INP: needs the interaction.
      if (fin.inp && fin.inp.value !== null) {
        row.inp_ms = Math.round(fin.inp.value);
        row.inp_target = nodes.inp?.selector || fin.inp.attribution?.interactionTarget || null;
        row.inp_attribution = fin.inp.attribution;
      } else if (!control) row.unavailable.inp = 'no safe, non-destructive control to click (links, submits and destructive actions are never clicked)';
      else if (row.interaction?.error) row.unavailable.inp = `the click on ${control.selector} failed: ${row.interaction.error}`;
      else row.unavailable.inp = `the click on ${control.selector} produced no interaction entry within 2.5 s`;
      row.evidence = ctx.writeEvidence(path.join('vitals', ps.slug, ps.state, `${ps.width}-${ps.theme}.json`), { url: pg.load.url, ...row, raw: { shifts: (fin.shifts || []).slice(0, 100), fcp: fin.fcp ?? null, errors: fin.errors || [] }, thresholds: THRESHOLDS, caveat: CAVEAT });
      const at = (sel, extra = {}) => ctx.loc(ps, sel ? { selector: sel.selector, bbox: sel.bbox, snippet: sel.snippet, source: sel.source, ...extra } : { selector: 'html', ...extra });
      if (row.cls !== null && row.cls > THRESHOLDS.cls) {
        const top = nodes.cls[0] || null;
        ctx.add(ctx.hit({
          rule: 'FUN-07',
          title: `Layout shift above the 0.1 budget on ${ps.route}${ps.state !== 'default' ? ` (${ps.state})` : ''}`,
          description: `Lab CLS ${row.cls} at ${ps.width} px over load, a full scroll${actions.length ? ', the state recipe' : ''}${row.interaction && !row.interaction.error ? ' and one click' : ''} (budget ≤ 0.1). ${top ? `The largest shift moved ${top.selector} (${top.value}).` : 'No shift source element could be named.'} ${CAVEAT}`,
          location: at(top),
          evidence: [{ type: 'metric', value: { cls: row.cls, cls_raw: raw, sources: nodes.cls.slice(0, 3).map((s) => ({ selector: s.selector, value: s.value, from: s.prev, to: s.cur })) }, detail: `CLS ${row.cls} > 0.1`, ref: row.evidence }],
          recommendation: 'Reserve space for late content (width and height on media, min-height on injected regions); insert new content below the viewport or in response to input.',
        }));
      }
      if (row.lcp_ms !== null && row.lcp_ms > THRESHOLDS.lcp_ms) {
        ctx.add(ctx.hit({
          rule: 'FUN-08',
          title: `Lab LCP above 2.5 s on ${ps.route}`,
          description: `Lab LCP ${row.lcp_ms} ms at ${ps.width} px; the largest contentful paint was ${row.lcp_element || 'an unnamed element'}. Advisory (FUN-08). ${CAVEAT}`,
          location: at(nodes.lcp),
          evidence: [{ type: 'metric', value: { lcp_ms: row.lcp_ms, attribution: row.lcp_attribution }, detail: `LCP ${row.lcp_ms} ms > 2500 ms`, ref: row.evidence }],
        }));
      }
      if (row.inp_ms !== null && row.inp_ms > THRESHOLDS.inp_ms) {
        ctx.add(ctx.hit({
          rule: 'FUN-08',
          title: `Slow response to a click on ${ps.route}: INP above 200 ms`,
          description: `Clicking ${row.inp_target || control?.selector || 'a control'} ("${control?.name || ''}") took ${row.inp_ms} ms to the next paint (input delay ${row.inp_attribution?.inputDelay ?? '?'} ms, processing ${row.inp_attribution?.processingDuration ?? '?'} ms, presentation ${row.inp_attribution?.presentationDelay ?? '?'} ms). Advisory (FUN-08). ${CAVEAT}`,
          location: at(nodes.inp),
          evidence: [{ type: 'metric', value: { inp_ms: row.inp_ms, attribution: row.inp_attribution }, detail: `INP ${row.inp_ms} ms > 200 ms`, ref: row.evidence }],
        }));
      }
      for (const [k, why] of Object.entries(row.unavailable)) ctx.note(`${k.toUpperCase()} unavailable on ${ps.route} (${ps.state}) at ${ps.width} px: ${why}`);
    } finally {
      await pg.close();
    }
  }
  ctx.record({ thresholds: THRESHOLDS, caveat: CAVEAT, metrics, engine_note: `web-vitals ${ctx.deps.versions?.['web-vitals'] || '?'} attribution build, reportAllChanges` });
  if (!clsMeasured && metrics.length) throw new Error('CLS could not be measured on any page state; FUN-07 is not evaluated (see the notes)');
  if (clsMissing) ctx.partial(`CLS could not be measured on ${clsMissing} of ${metrics.length} page state(s)`);
  return [];
}
