// The audit runner (ARCHITECTURE §7.2, §8.6, §9): runs the selected checks over the run's scope, writes hits to
// tool-findings.jsonl and one entry per check to checks.json. A check that throws, or that never got a page, is
// recorded as `failed` with its errors, so the gate engine shows not_run rather than pass.
import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, readJson, writeJson, readJsonl, writeJsonl, exists } from '../util/fs.mjs';
import { isoNow } from '../util/time.mjs';
import { shortHash } from '../util/hash.mjs';
import { launchBrowser } from './launch.mjs';
import { BrowserSession, PageScheduler, expandScope, G2_WIDTHS } from './pages.mjs';
import { makeHit, loc, dedupeHits } from './hits.mjs';
import { CropWriter } from './crops.mjs';
import { captureStill, domInventory } from './capture.mjs';
import { normaliseSource, SourceSearcher } from './source.mjs';
import { loadDesignContext } from './design-context.mjs';
import { CHECKS, CHECK_NAMES, QUICK_CHECKS } from './checks/index.mjs';
import { preSettleProbe } from './prescroll.mjs';
import { MOTION_RECORDER_SOURCE } from './motion-recorder.mjs';

/** Resolve --checks / --quick into an ordered list of check names. */
export function selectChecks({ checks, quick } = {}) {
  if (quick) return CHECK_NAMES.filter((n) => QUICK_CHECKS.includes(n));
  if (!checks || !checks.length) return [...CHECK_NAMES];
  const unknown = checks.filter((c) => !CHECKS[c]);
  if (unknown.length) {
    const e = new Error(`unknown check(s): ${unknown.join(', ')}. Known: ${CHECK_NAMES.join(', ')}`);
    e.userMessage = e.message;
    e.isUsage = true;
    throw e;
  }
  return CHECK_NAMES.filter((n) => checks.includes(n));
}

/** The scope of an audit from the config (matrix and routes). */
export function buildScope(config, { routes: routeFilter } = {}) {
  let routes = config.routes || [];
  if (routeFilter && routeFilter.length) {
    routes = routes.filter((r) => routeFilter.includes(r.path) || routeFilter.includes(r.surface));
    if (!routes.length) {
      const e = new Error(`--route matched no configured route (have: ${(config.routes || []).map((r) => r.path).join(', ')})`);
      e.userMessage = e.message;
      throw e;
    }
  }
  const m = config.matrix || {};
  return {
    routes,
    widths: [...new Set(m.widths && m.widths.length ? m.widths : [320, 375, 768, 1024, 1280, 1440])].sort((a, b) => a - b),
    themes: m.themes && m.themes.length ? m.themes : ['light'],
    preferences: m.preferences || ['default'],
    g2Preferences: m.g2_preferences || [],
    height: m.height || 900,
    dsf: m.device_scale_factor || 1,
    locales: config.locales || {},
  };
}

class CheckContext {
  constructor(runner, name, mod) {
    this.runner = runner;
    this.name = name;
    this.mod = mod;
    this.config = runner.config;
    this.scope = runner.scope;
    this.deps = runner.deps;
    this.session = runner.session;
    this.design = runner.design;
    this.root = runner.root;
    this.runDir = runner.runDir;
    this.evidenceDir = runner.evidenceDir;
    this.log = runner.log;
    this.baseline = runner.baseline;
    this.hitsAdded = [];
    this.fields = {};
    this.notes = [];
    this.errors = [];
    this.isPartial = false;
    this.skipReason = null;
    this.cov = { routes: new Set(), states: new Set(), widths: new Set(), themes: new Set() };
    this.requested = new Set();
    this.served = new Set();
    this.loadFailures = [];
    this.client = null;
    this.engine = { name: `uie/${name}`, version: runner.engineVersion };
  }

  /** Page states for a slice of the scope. widths: 'all' | 'g2' | 'first' | number[]. */
  states({ widths = 'all', themes = 'all', preferences = ['default'], states = 'all', routes } = {}) {
    const sc = this.scope;
    const w = widths === 'all' ? sc.widths : widths === 'g2' ? G2_WIDTHS : widths === 'first' ? [sc.widths.includes(1280) ? 1280 : sc.widths[sc.widths.length - 1]] : widths;
    const t = themes === 'all' ? sc.themes : themes === 'first' ? [sc.themes[0]] : themes;
    return expandScope({ ...sc, routes: routes || sc.routes }, { widths: w, themes: t, preferences, states });
  }

  /** Iterate page states: shared through the scheduler in phase 1, or loaded one by one for standalone checks. */
  pages(specs) {
    for (const s of specs) this.requested.add(s.key);
    if (this.client) {
      const it = this.runner.scheduler.pages(this.client, specs);
      const self = this;
      return {
        [Symbol.asyncIterator]() {
          return this;
        },
        async next() {
          const r = await it.next();
          if (!r.done) self.markServed(r.value);
          return r;
        },
        return() {
          return it.return();
        },
      };
    }
    const self = this;
    const queue = [...specs];
    let current = null;
    return {
      [Symbol.asyncIterator]() {
        return this;
      },
      async next() {
        if (current) await current.close();
        current = null;
        while (queue.length) {
          const spec = queue.shift();
          const pg = await self.openPage(spec, self.mod.openOptions || {});
          if (!pg.ok && !self.mod.includeFailed) {
            await pg.close();
            continue;
          }
          current = pg;
          return { done: false, value: pg };
        }
        return { done: true, value: undefined };
      },
      async return() {
        if (current) await current.close();
        current = null;
        return { done: true, value: undefined };
      },
    };
  }

  markServed(pg) {
    this.served.add(pg.ps.key);
    if (pg.ok) this.covered(pg.ps);
  }

  /** Open a page state outside the shared pool (standalone work). Failures are recorded for coverage. */
  async openPage(spec, opts = {}) {
    this.requested.add(spec.key);
    const pg = await this.session.open(spec, opts);
    if (pg.ok) {
      this.served.add(spec.key);
      this.covered(spec);
    } else this.loadFailures.push({ key: spec.key, reason: pg.error });
    return pg;
  }

  covered(ps) {
    this.cov.routes.add(ps.route);
    this.cov.states.add(`${ps.route}#${ps.state}`);
    this.cov.widths.add(ps.width);
    this.cov.themes.add(ps.theme);
  }

  hit(o) {
    return makeHit({ check: this.name, engine: this.engine, ...o });
  }

  loc(ps, extra) {
    return loc(ps, extra);
  }

  /** Add hits incrementally (kept even when the check later throws). */
  add(...hits) {
    for (const h of hits.flat()) if (h) this.hitsAdded.push(h);
  }

  record(fields) {
    Object.assign(this.fields, fields);
  }

  note(msg) {
    if (!this.notes.includes(msg)) this.notes.push(msg);
  }

  error(msg) {
    if (this.errors.length < 50) this.errors.push(String(msg).slice(0, 500));
  }

  partial(reason) {
    this.isPartial = true;
    if (reason) this.note(reason);
  }

  skip(reason) {
    this.skipReason = reason;
  }

  evidencePath(...parts) {
    return path.join(this.evidenceDir, ...parts);
  }

  writeEvidence(rel, data) {
    const file = path.join(this.evidenceDir, rel);
    ensureDir(path.dirname(file));
    if (Buffer.isBuffer(data)) fs.writeFileSync(file, data);
    else if (typeof data === 'string') fs.writeFileSync(file, data);
    else writeJson(file, data);
    return path.relative(this.runDir, file).split(path.sep).join('/');
  }

  async cdp(page) {
    return page.context().newCDPSession(page);
  }

  /** Take a full-page screenshot now and attach crops to these hits (standalone pages). */
  async cropHits(pg, hits) {
    const withBox = hits.filter((h) => h.locations?.[0]?.bbox);
    if (!withBox.length || !pg.ok) return;
    try {
      const buf = await pg.page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
      const key = `${this.name}:${pg.ps.key}:${Date.now()}`;
      this.runner.crops.addScreenshot(key, buf, 1);
      for (const h of withBox) this.runner.crops.attach(h, key, `${this.name}/${shortHash(JSON.stringify([h.title, h.locations[0]]), 10)}`);
      this.runner.crops.images.delete(key);
    } catch {
      /* crops are optional evidence */
    }
  }
}

export class AuditRunner {
  /**
   * @param {{root:string, config:object, runDir:string, runId?:string, deps:object, checks:string[], routes?:string[],
   *   allowRemote?:boolean, baseline?:object|null, log?:Function, designText?:string, productText?:string,
   *   engineVersion?:string, browser?:object}} o
   */
  constructor(o) {
    Object.assign(this, o);
    this.log = o.log || (() => {});
    this.scope = buildScope(o.config, { routes: o.routes });
    this.evidenceDir = ensureDir(path.join(o.runDir, 'evidence'));
    this.design = loadDesignContext(o.root, { designText: o.designText, productText: o.productText });
    this.results = {};
    this.allHits = [];
    this.stills = [];
  }

  async run() {
    const t0 = Date.now();
    const ownBrowser = !this.browser;
    this.browser = this.browser || (await launchBrowser(this.deps));
    this.browserVersion = this.browser.version();
    this.engineVersion = this.engineVersion || 'dev';
    this.engineVersion = `${this.engineVersion} (playwright ${this.deps.versions.playwright}, chromium ${this.browserVersion})`;
    this.session = new BrowserSession({
      deps: this.deps,
      browser: this.browser,
      baseUrl: this.config.app?.base_url || 'http://localhost:3000',
      allowRemote: !!this.allowRemote,
      loadTimeout: this.config.app?.timeout_ms || 60000,
      log: this.log,
      app: this.app || null,
      fixedTime: this.fixedTime || null,
      remoteAssets: this.config.audit?.remote_assets !== false,
    });
    if (this.checks.some((c) => ['tells', 'motion'].includes(c))) this.session.preSettleProbe = preSettleProbe;
    if (this.checks.includes('motion')) {
      // The motion check measures what ran since the first byte (MOT-04/06/07), so the recorder goes in first.
      this.session.initScripts.push(MOTION_RECORDER_SOURCE);
      this.session.markPhases = true;
    }
    this.crops = new CropWriter({ PNG: this.deps.PNG, dir: path.join(this.evidenceDir, 'crops'), relBase: this.runDir });
    this.scheduler = new PageScheduler(this.session, { onLoaded: (pg) => this.onSharedPage(pg) });
    try {
      const shared = this.checks.filter((n) => CHECKS[n].mode === 'shared');
      const standalone = this.checks.filter((n) => CHECKS[n].mode !== 'shared');
      // Phase 1: shared-page checks run together over one load per page state.
      const runs = new Map();
      const ctxs = new Map();
      for (const name of shared) {
        const mod = CHECKS[name];
        const ctx = new CheckContext(this, name, mod);
        ctx.client = this.scheduler.client(name, { mutates: !!mod.mutates, includeFailed: !!mod.includeFailed });
        ctx.t0 = Date.now();
        ctxs.set(name, ctx);
        runs.set(ctx.client, this.execute(ctx));
      }
      if (runs.size) await this.scheduler.drive(runs);
      await Promise.all(runs.values());
      // Phase 2: checks that drive their own pages. Each opens its own contexts, so the untimed ones share the browser
      // in parallel; checks that measure timing (response feedback, vitals) then run alone so contention cannot skew
      // their milliseconds.
      const timed = standalone.filter((n) => CHECKS[n].timed);
      const untimed = standalone.filter((n) => !CHECKS[n].timed);
      await Promise.all(untimed.map((name) => {
        const ctx = new CheckContext(this, name, CHECKS[name]);
        ctx.t0 = Date.now();
        return this.execute(ctx);
      }));
      for (const name of timed) {
        const ctx = new CheckContext(this, name, CHECKS[name]);
        ctx.t0 = Date.now();
        await this.execute(ctx);
      }
    } finally {
      if (ownBrowser) await this.browser.close().catch(() => {});
    }
    this.postProcess();
    return { results: this.results, hits: this.allHits, ms: Date.now() - t0, blocked: this.session.blocked, assetHosts: this.session.assetHosts, stills: this.stills };
  }

  /** Base evidence for every shared page: validity-checked full-page still (kept for crops) and the DOM inventory. */
  async onSharedPage(pg) {
    const ps = pg.ps;
    try {
      const still = await captureStill(pg.page, { PNG: this.deps.PNG, fullPage: true, masks: ps.routeCfg.mask || [], dsf: ps.dsf, fonts: pg.settle?.fonts || null });
      const rel = path.join('screens', ps.slug, ps.state, `${ps.width}-${ps.theme}${ps.preference !== 'default' ? `-${ps.preference}` : ''}-audit.png`);
      const file = path.join(this.evidenceDir, rel);
      ensureDir(path.dirname(file));
      fs.writeFileSync(file, still.buffer);
      this.stills.push({ kind: 'audit', file: path.relative(this.runDir, file).split(path.sep).join('/'), route: ps.route, state: ps.state, width: ps.width, theme: ps.theme, preference: ps.preference, valid: still.valid, reasons: still.reasons });
      if (!still.valid) {
        pg.ok = false;
        pg.error = `invalid capture (never evaluated): ${still.reasons.join('; ')}`;
        return;
      }
      this.crops.addScreenshot(ps.key, still.buffer, ps.dsf);
    } catch (err) {
      this.log(`capture failed for ${ps.key}: ${err.message}`);
    }
    try {
      const inv = await domInventory(pg.page);
      const rel = path.join('dom', ps.slug, ps.state, `${ps.width}-${ps.theme}${ps.preference !== 'default' ? `-${ps.preference}` : ''}.json`);
      const file = path.join(this.evidenceDir, rel);
      ensureDir(path.dirname(file));
      writeJson(file, { route: ps.route, state: ps.state, width: ps.width, theme: ps.theme, url: pg.load.url, at: isoNow(), controls: inv });
      pg.inventory = inv;
    } catch (err) {
      this.log(`inventory failed for ${ps.key}: ${err.message}`);
    }
  }

  async execute(ctx) {
    const mod = ctx.mod;
    let returned = [];
    let failure = null;
    try {
      returned = (await mod.run(ctx)) || [];
    } catch (err) {
      failure = err;
    } finally {
      if (ctx.client) {
        ctx.client.done = true;
        this.scheduler.poke();
      }
    }
    const seen = new Set();
    const hits = [];
    for (const h of [...ctx.hitsAdded, ...(Array.isArray(returned) ? returned : [])]) {
      if (!h || seen.has(h)) continue;
      seen.add(h);
      hits.push(h);
    }
    const deduped = mod.dedupe === false ? hits : dedupeHits(hits);
    // Coverage: requested page states that never reached the check make it partial; none at all make it failed.
    const skipped = ctx.client ? ctx.client.skipped : ctx.loadFailures;
    for (const s of skipped) ctx.error(s.reason);
    const servedAny = ctx.served.size > 0;
    let state = 'ran';
    if (failure) {
      state = 'failed';
      ctx.error(`check crashed: ${(failure.userMessage || failure.message || String(failure)).split('\n')[0]}`);
      if (process.env.UIE_DEBUG) ctx.error(String(failure.stack || '').slice(0, 800));
    } else if (ctx.skipReason) state = 'skipped';
    else if (ctx.requested.size && !servedAny) {
      state = 'failed';
      ctx.error('no page state could be evaluated');
    }
    // Partial because the check itself covered less (caps, unexercised parts) vs only because some page states did not
    // load (auth walls, failed routes): `uie diff` can still trust the states that did load in the second case.
    const checkPartial = ctx.isPartial;
    if (skipped.length && state === 'ran') ctx.partial(`${skipped.length} page state(s) could not be evaluated`);
    const entry = {
      state,
      at: isoNow(),
      partial: state === 'ran' ? ctx.isPartial : false,
      ...(state === 'ran' && ctx.isPartial ? { partial_scope: checkPartial ? 'check' : 'load', unevaluated: skipped.map((x) => x.key).slice(0, 200) } : {}),
      coverage: {
        routes: [...ctx.cov.routes],
        states: [...ctx.cov.states],
        widths: [...ctx.cov.widths].sort((a, b) => a - b),
        themes: [...ctx.cov.themes],
      },
      engine: ctx.engine,
      hits: deduped.length,
      errors: ctx.errors,
      notes: ctx.notes,
      duration_ms: Date.now() - (ctx.t0 || Date.now()),
      ...(ctx.skipReason ? { skip_reason: ctx.skipReason } : {}),
      ...ctx.fields,
    };
    this.results[ctx.name] = { entry, hits: deduped };
    this.allHits.push(...deduped);
    this.log(`${ctx.name}: ${state}${entry.partial ? ' (partial)' : ''}, ${deduped.length} hit(s)${ctx.errors.length ? `, ${ctx.errors.length} error(s)` : ''}`);
  }

  /** Normalise sources, fall back to text search, and cut crops from the shared stills. */
  postProcess() {
    const searcher = this.root && exists(this.root) && !this.noSourceSearch ? new SourceSearcher(this.root) : null;
    let searched = 0;
    for (const h of this.allHits) {
      for (const l of h.locations || []) {
        if (l.source && !l.source.method) l.source = null;
        if (l.source && l.source.raw !== undefined) l.source = normaliseSource(l.source, this.root);
        else if (l.source && l.source.method && !l.source.confidence) l.source = normaliseSource(l.source, this.root);
        if (!l.source && searcher && l.snippet && searched < 300) {
          searched += 1;
          const s = searcher.find(l.snippet);
          if (s) l.source = s;
        }
        if (!l.source) delete l.source;
      }
      const l0 = h.locations?.[0];
      if (l0 && !l0.crop && l0.bbox && l0.route) {
        const key = this.keyFor(l0);
        if (key) this.crops.attach(h, key, `${h.found_by[0].check}/${shortHash(JSON.stringify([h.title, l0.selector, l0.viewport, l0.theme, l0.state]), 10)}`);
      }
    }
  }

  keyFor(l) {
    const w = l.viewport?.width;
    const h = l.viewport?.height || this.scope.height;
    const pref = l.preference || 'default';
    const key = `${l.route}#${l.state || 'default'}@${w}x${h}/${l.theme || this.scope.themes[0]}/${pref}`;
    return this.crops.images.has(key) ? key : null;
  }
}

/**
 * Write the audit outputs into the run: hits replace earlier hits of the same checks in tool-findings.jsonl, and
 * checks.json entries are replaced per check. The manifest (scope, tools, captures) is updated by `uie audit`.
 */
export function writeAuditOutputs(runDir, { results, stills = [], blocked = [], assetHosts = [], scope, config, deps, browserVersion, uieVersion }) {
  const jsonl = path.join(runDir, 'tool-findings.jsonl');
  const ran = new Set(Object.keys(results));
  const kept = exists(jsonl) ? readJsonl(jsonl).filter((h) => !ran.has(h.found_by?.[0]?.check)) : [];
  const fresh = Object.values(results).flatMap((r) => r.hits);
  writeJsonl(jsonl, [...kept, ...fresh]);
  const checksPath = path.join(runDir, 'checks.json');
  const doc = readJson(checksPath, { checks: {} });
  doc.checks = doc.checks || {};
  for (const [name, r] of Object.entries(results)) doc.checks[name] = r.entry;
  doc.updated_at = isoNow();
  if (blocked.length) doc.blocked_remote_requests = blocked.slice(0, 100);
  if (assetHosts.length) doc.remote_asset_hosts = assetHosts.slice(0, 50);
  writeJson(checksPath, doc);
  return { jsonl, checksPath, hits: fresh.length, kept: kept.length };
}

export { G2_WIDTHS };
