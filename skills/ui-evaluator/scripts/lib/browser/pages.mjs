// Page states (route × state × width × theme × preference), the browser session that opens them, and the scheduler
// that shares one page load between all checks that only read the page.
import { newGuardedContext, resolveUrl, assertAllowedUrl } from './launch.mjs';
import { runActions } from './actions.mjs';
import { settlePage, FIXED_TIME } from './capture.mjs';
import { ensureHelpers } from './inpage.mjs';
import { slug } from '../util/time.mjs';

export const G2_WIDTHS = [320, 1280];

/**
 * Sign-in pages (LOOP-012): a final path like /login, /sign-in, /auth, /sso or /oauth (an extension such as
 * /login.html counts) that the requested route did not ask for. Such a page is never audited in place of the target.
 */
export const AUTH_WALL_RE = /\/(login|log-in|signin|sign-in|auth|sso|oauth)(\.[a-z0-9]+)?(\/|$|\?)/i;

export function authWallFor(requestedUrl, finalUrl) {
  try {
    const req = new URL(requestedUrl);
    const fin = new URL(finalUrl);
    if (AUTH_WALL_RE.test(fin.pathname) && !AUTH_WALL_RE.test(req.pathname)) return { requested: `${req.pathname}${req.search}`, final_url: fin.href, final_path: fin.pathname };
  } catch {
    /* not a URL */
  }
  return null;
}

export const AUTH_WALL_ADVICE = 'Add a state recipe or journey start_state that signs in with a test account, or audit a public route. UI-Evaluator never types real credentials.';

/**
 * Build one page-state spec. `reducedMotion` forces the emulation regardless of the preference (stills are taken
 * under 'reduce', ARCHITECTURE §9.1); it is part of the key, so such a state never shares a page with a default one.
 */
export function pageState({ routeCfg, stateCfg, width, height = 900, theme = 'light', preference = 'default', dsf = 1, touch, reducedMotion }) {
  const route = routeCfg.path;
  const state = stateCfg?.name || 'default';
  return {
    key: `${route}#${state}@${width}x${height}/${theme}/${preference}${reducedMotion ? `/rm-${reducedMotion}` : ''}`,
    route,
    state,
    width,
    height,
    theme,
    preference,
    dsf,
    touch,
    reducedMotion: reducedMotion || null,
    mode: routeCfg.mode || 'operate',
    surface: routeCfg.surface || null,
    routeCfg,
    stateCfg: stateCfg || { name: 'default', actions: [] },
    slug: slug(route === '/' ? 'root' : route, 60),
  };
}

/**
 * Expand a scope request into page states.
 * @param {object} scope { routes:[routeCfg], widths:[n], themes:[..], preferences:[..], height, dsf, states:'all'|'default' }
 */
export function expandScope(scope, { widths, themes, preferences = ['default'], states = 'all' } = {}) {
  const out = [];
  for (const routeCfg of scope.routes) {
    const sts = routeCfg.states && routeCfg.states.length ? routeCfg.states : [{ name: 'default', actions: [] }];
    const chosen = states === 'default' ? [sts.find((s) => s.name === 'default') || sts[0]] : sts;
    for (const stateCfg of chosen) {
      for (const width of widths || scope.widths) {
        for (const theme of themes || scope.themes) {
          for (const preference of preferences) {
            out.push(pageState({ routeCfg, stateCfg, width, height: scope.height, theme, preference, dsf: scope.dsf }));
          }
        }
      }
    }
  }
  return out;
}

const REFUSED = /ERR_CONNECTION_REFUSED|ECONNREFUSED|ERR_CONNECTION_RESET|ERR_EMPTY_RESPONSE/;

export class BrowserSession {
  constructor({ deps, browser, baseUrl, allowRemote = false, actionTimeout = 10000, loadTimeout = 60000, locale = null, log = () => {}, app = null, fixedTime = null, remoteAssets = true }) {
    this.deps = deps;
    // The app handle from ensureApp: a refused load asks it to revive (restart an app uie started) before giving up.
    this.app = app;
    this.fixedTime = fixedTime || FIXED_TIME;
    this.browser = browser;
    this.baseUrl = baseUrl;
    this.allowRemote = allowRemote;
    this.actionTimeout = actionTimeout;
    this.loadTimeout = loadTimeout;
    this.locale = locale;
    this.log = log;
    this.blocked = [];
    // Remote hosts the pages' own assets (fonts, styles, images, scripts) were loaded from (launch.mjs).
    this.assetHosts = [];
    this.remoteAssets = remoteAssets;
    this.opened = 0;
    // Scripts installed in every page before any app script (e.g. the motion recorder), unless an open is `bare`.
    this.initScripts = [];
    // When true, window.__uieMotion.phase follows load → settle → recipe → check (motion check, MOT-04/07).
    this.markPhases = false;
    this.storageState = null;
    // Routes that redirected to a sign-in page: [{route, final_url}] (one per route).
    this.authWalls = [];
  }

  noteAuthWall(pg, wall) {
    pg.authWall = { route: pg.ps.route, ...wall };
    pg.load.ok = false;
    pg.load.error = `auth_wall: ${wall.requested} redirected to ${wall.final_path}`;
    if (!this.authWalls.some((w) => w.route === pg.ps.route)) this.authWalls.push({ route: pg.ps.route, final_url: wall.final_url });
  }

  /**
   * Open a page state. Never throws for load or recipe failures: they are recorded on the result.
   * @returns {Promise<object>} pg { ps, page, context, load, recipe, ok, console, pageErrors, failedRequests, badResponses, close() }
   */
  async open(ps, { freezeClock = false, settle = true, initScripts = [], recipe = true, scroll = true, bare = false, storageState } = {}) {
    this.opened += 1;
    const context = await newGuardedContext(
      this.browser,
      { width: ps.width, height: ps.height, dsf: ps.dsf, theme: ps.theme, preference: ps.preference, touch: ps.touch, locale: this.locale, reducedMotion: ps.reducedMotion || undefined, storageState: storageState || this.storageState || undefined },
      { allowRemote: this.allowRemote, blocked: this.blocked, remoteAssets: this.remoteAssets, assetHosts: this.assetHosts },
    );
    const page = await context.newPage();
    page.setDefaultTimeout(this.actionTimeout);
    const pg = { ps, page, context, console: [], pageErrors: [], failedRequests: [], badResponses: [], load: {}, recipe: null, settle: null, phase: 'load', closed: false };
    page.on('console', (m) => {
      if (m.type() !== 'error' || pg.console.length >= 200) return;
      const l = m.location() || {};
      pg.console.push({ text: m.text().slice(0, 500), url: l.url || '', line: l.lineNumber ?? null, phase: pg.phase });
    });
    page.on('pageerror', (e) => {
      if (pg.pageErrors.length < 100) pg.pageErrors.push({ message: String(e.message || e).slice(0, 500), stack: String(e.stack || '').split('\n').slice(0, 5).join('\n'), phase: pg.phase });
    });
    page.on('requestfailed', (r) => {
      if (pg.failedRequests.length < 300) pg.failedRequests.push({ url: r.url(), resourceType: r.resourceType(), failure: r.failure()?.errorText || 'failed', phase: pg.phase });
    });
    page.on('response', (r) => {
      if (r.status() >= 400 && pg.badResponses.length < 300) pg.badResponses.push({ url: r.url(), status: r.status(), resourceType: r.request().resourceType(), phase: pg.phase });
    });
    for (const s of [...(bare ? [] : this.initScripts), ...initScripts]) await page.addInitScript(s);
    if (freezeClock) await page.clock.setFixedTime(this.fixedTime).catch(() => {});
    pg.marks = {};
    const mark = async (phase) => {
      pg.phase = phase;
      if (bare || !this.markPhases) return;
      pg.marks[phase] = await page
        .evaluate((p) => {
          const M = window.__uieMotion;
          if (M) {
            M.phase = p;
            M.marks[p] = performance.now();
          }
          return performance.now();
        }, phase)
        .catch(() => null);
    };
    const url = resolveUrl(this.baseUrl, ps.route);
    const t0 = Date.now();
    const go = async () => {
      try {
        assertAllowedUrl(url, this.allowRemote);
        const resp = await page.goto(url, { waitUntil: 'load', timeout: this.loadTimeout });
        const status = resp ? resp.status() : null;
        pg.load = { url, status, ms: Date.now() - t0, ok: status === null || (status >= 200 && status < 400) };
        if (!pg.load.ok) pg.load.error = `HTTP ${status}`;
      } catch (err) {
        pg.load = { url, status: null, ms: Date.now() - t0, ok: false, error: (err.userMessage || err.message || String(err)).split('\n')[0] };
      }
    };
    await go();
    if (!pg.load.ok && REFUSED.test(pg.load.error || '') && this.app?.revive) {
      // The server went away mid-run: restart it when uie started it, then try once more; otherwise say why.
      if (await this.app.revive().catch(() => false)) await go();
      if (!pg.load.ok && REFUSED.test(pg.load.error || '')) pg.load.error = `${pg.load.error} (${this.app.describe?.() || 'the app stopped answering'})`;
    }
    if (pg.load.ok) {
      await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
      const wall = authWallFor(url, page.url());
      if (wall) this.noteAuthWall(pg, wall);
    }
    if (pg.load.ok) {
      pg.load.timing = await page
        .evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          const fcp = performance.getEntriesByName('first-contentful-paint')[0];
          return { dcl: nav ? Math.round(nav.domContentLoadedEventEnd) : null, load: nav ? Math.round(nav.loadEventEnd) : null, fcp: fcp ? Math.round(fcp.startTime) : null };
        })
        .catch(() => null);
      if (this.preSettleProbe && !bare) {
        // State at rest before any scrolling: reveal-on-scroll content, count-up numbers (tells, motion).
        await ensureHelpers(page).catch(() => {});
        pg.preSettle = await page.evaluate(this.preSettleProbe).catch(() => null);
      }
      if (settle) {
        await mark('settle');
        pg.settle = await settlePage(page, { scroll }).catch((err) => ({ error: err.message }));
      }
      const actions = (recipe && ps.stateCfg && ps.stateCfg.actions) || [];
      if (actions.length) {
        await mark('recipe');
        pg.recipe = await runActions(page, actions, { baseUrl: this.baseUrl, allowRemote: this.allowRemote, timeout: this.actionTimeout });
        await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(150);
        const wall = authWallFor(url, page.url());
        if (wall) this.noteAuthWall(pg, wall);
      }
      await ensureHelpers(page).catch(() => {});
    }
    await mark('check');
    pg.ok = !!pg.load.ok && (!pg.recipe || pg.recipe.ok);
    pg.error = !pg.load.ok ? `could not load ${pg.load.url}: ${pg.load.error}` : pg.recipe && !pg.recipe.ok ? `state recipe "${ps.state}" failed: ${pg.recipe.error}` : null;
    pg.close = async () => {
      if (pg.closed) return;
      pg.closed = true;
      await context.close().catch(() => {});
    };
    return pg;
  }

  /** Put a shared page back in its resting state between consumers. */
  async restore(pg) {
    if (!pg || pg.closed || !pg.ok) return;
    await pg.page
      .evaluate(() => {
        window.scrollTo(0, 0);
        if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) document.activeElement.blur();
        if (window.__uie) window.__uie.reset();
      })
      .catch(() => {});
    await pg.page.mouse.move(0, 0).catch(() => {});
  }
}

/**
 * Lockstep scheduler: checks iterate `ctx.pages(specs)`; each page state is loaded once and handed to every check
 * that asked for it, one check at a time (read-only checks first). A check that declares `mutates` gets the page
 * last, and any later mutating check gets a fresh load.
 */
export class PageScheduler {
  constructor(session, { onLoaded = null, onFailed = null } = {}) {
    this.session = session;
    this.onLoaded = onLoaded;
    this.onFailed = onFailed;
    this.clients = [];
    this.specs = new Map();
    this.order = [];
    this.wake = null;
  }

  client(name, { mutates = false, includeFailed = false } = {}) {
    const c = { name, mutates, includeFailed, remaining: [], waiting: null, holding: false, onRelease: null, done: false, skipped: [], served: [] };
    this.clients.push(c);
    return c;
  }

  poke() {
    if (this.wake) {
      const w = this.wake;
      this.wake = null;
      w();
    }
  }

  /** Async iterator over page states for one client. */
  pages(c, specs) {
    for (const s of specs) {
      if (!this.specs.has(s.key)) {
        this.specs.set(s.key, s);
        this.order.push(s.key);
      }
      if (!c.remaining.includes(s.key)) c.remaining.push(s.key);
    }
    const self = this;
    let started = false;
    return {
      [Symbol.asyncIterator]() {
        return this;
      },
      next() {
        if (started) self.release(c);
        started = true;
        if (!c.remaining.length) {
          self.poke();
          return Promise.resolve({ done: true, value: undefined });
        }
        return new Promise((resolve) => {
          c.waiting = resolve;
          self.poke();
        });
      },
      return() {
        self.release(c);
        c.remaining = [];
        self.poke();
        return Promise.resolve({ done: true, value: undefined });
      },
    };
  }

  release(c) {
    if (c.holding) {
      c.holding = false;
      const r = c.onRelease;
      c.onRelease = null;
      if (r) r();
    }
  }

  async waitQuiescent() {
    for (;;) {
      if (this.clients.every((c) => c.done || c.waiting)) return;
      await new Promise((r) => {
        this.wake = r;
      });
    }
  }

  /**
   * Drive all clients until every one is done.
   * @param {Map<object, Promise<any>>} runs client → its running promise
   */
  async drive(runs) {
    for (const [c, p] of runs) {
      c.donePromise = p.then(
        () => {
          c.done = true;
          this.poke();
        },
        () => {
          c.done = true;
          this.poke();
        },
      );
    }
    for (;;) {
      await this.waitQuiescent();
      const active = this.clients.filter((c) => !c.done && c.waiting);
      for (const c of active) {
        if (!c.remaining.length) {
          const w = c.waiting;
          c.waiting = null;
          w({ done: true, value: undefined });
        }
      }
      const live = active.filter((c) => c.remaining.length);
      if (!live.length) {
        if (this.clients.every((c) => c.done)) return;
        await new Promise((r) => setTimeout(r, 0));
        continue;
      }
      const key = this.order.find((k) => live.some((c) => c.remaining.includes(k)));
      const spec = this.specs.get(key);
      const consumers = live.filter((c) => c.remaining.includes(key)).sort((a, b) => Number(a.mutates) - Number(b.mutates));
      let pg = null;
      let dirty = true;
      for (const c of consumers) {
        c.remaining = c.remaining.filter((k) => k !== key);
        if (dirty) {
          if (pg) await pg.close();
          pg = await this.session.open(spec);
          dirty = false;
          if (pg.ok && this.onLoaded) await this.onLoaded(pg).catch(() => {});
          if (!pg.ok && this.onFailed) await this.onFailed(pg).catch(() => {});
        }
        if (!pg.ok && !c.includeFailed) {
          c.skipped.push({ key, reason: pg.error });
          continue;
        }
        c.served.push(key);
        c.holding = true;
        const released = new Promise((r) => {
          c.onRelease = r;
        });
        const w = c.waiting;
        c.waiting = null;
        w({ done: false, value: pg });
        await Promise.race([released, c.donePromise]);
        c.holding = false;
        if (c.mutates) dirty = true;
        else await this.session.restore(pg);
      }
      if (pg) await pg.close();
    }
  }
}
