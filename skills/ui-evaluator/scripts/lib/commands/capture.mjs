// uie capture — deterministic stills, ARIA snapshots and DOM inventories over routes × states × widths × themes,
// plus forced-colours / increased-contrast stills (G2 widths) and colour-vision-deficiency stills (one width), by
// the capture recipe of ARCHITECTURE §9.1 (lib/browser/capture.mjs): fixed viewport and DPR, reduced motion
// emulated for every still, animations disabled, caret hidden, clock frozen, fonts loaded then document.fonts.ready,
// config masks, full page from the top, and the validity check (EVD-03) with automatic retakes, including a
// settle test (two consecutive captures must match). Paths follow §8.6; manifest.captures records every item.
import path from 'node:path';
import fs from 'node:fs';
import { ensureDir, writeJson, writeText } from '../util/fs.mjs';
import { list, UsageError } from '../util/args.mjs';
import { isoNow } from '../util/time.mjs';
import { resolveRun, loadConfig, readManifest, updateManifest, appendIndex } from '../project.mjs';
import { version } from '../cli.mjs';
import { buildScope } from '../browser/runner.mjs';
import { pageState, BrowserSession, G2_WIDTHS } from '../browser/pages.mjs';
import { launchBrowser, assertAllowedUrl } from '../browser/launch.mjs';
import { captureStill, ariaSnapshot, domInventory, runClock } from '../browser/capture.mjs';
import { decodePng, diffImages } from '../browser/png.mjs';
import { withCdp, emulateVision, VISION_DEFICIENCIES } from '../browser/cdp.mjs';
import { ensureApp } from '../browser/app.mjs';
import { AUTH_WALL_ADVICE } from '../browser/pages.mjs';
import { loadDeps, toolVersions, mergeCaptures, urlSlug, parseWidths, parseThemes } from '../browser/command-kit.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'allow-remote', 'no-cvd', 'no-g2'], multi: ['route'] };

export const help = `uie capture [--route <route>] [--url <url>] [--widths 320,1280] [--themes light,dark] [--run <id>]
            [--out <dir>] [--no-cvd] [--no-g2] [--allow-remote] [--json]

Deterministic captures by the recipe of ARCHITECTURE §9.1, for every route × state × width × theme of the scope
(config.json matrix; --widths/--themes override):
  evidence/screens/<route>/<state>/<width>-<theme>.png        full-page still (reduced motion emulated)
  evidence/screens/<route>/<state>/<width>-<theme>-<pref>.png forced-colors / more-contrast (matrix.g2_preferences, widths 320 and 1280)
  evidence/screens/<route>/<state>/<width>-<theme>-cvd-<type>.png  deuteranopia, protanopia, tritanopia, achromatopsia (1280 px)
  evidence/aria/<route>/<state>/<width>-<theme>.yml            ARIA snapshot
  evidence/dom/<route>/<state>/<width>-<theme>.json            interactive inventory (selector, role, name, box)
Invalid captures (blank, wrong size, fonts not loaded, not settled, not from the top) are retaken up to twice and
recorded as invalid in manifest.captures when they still fail (EVD-03: never evaluate an invalid capture).

  --url <url>   capture one page outside the configured routes (file:// or a local URL), e.g. a direction specimen:
                screens/<slug-of-url>/default/<width>-<theme>.png in the run, or under --out <dir> when given
Exit codes: 0 every capture valid · 2 some captures invalid · 1 could not run.`;

const RETAKES = 2;
const SETTLE_RATIO = 0.002;

/** Two consecutive captures must match (animations settled); returns the final still and the stability record. */
async function stableStill(page, deps, opts) {
  let still = await captureStill(page, opts);
  if (!still.valid) return { still, unstable: null };
  let changed = 1;
  for (let i = 0; i < 3; i += 1) {
    await page.waitForTimeout(i === 0 ? 250 : 700);
    const next = await captureStill(page, opts);
    if (!next.valid) return { still: next, unstable: null };
    try {
      const d = diffImages(deps.pixelmatch, decodePng(deps.PNG, still.buffer), decodePng(deps.PNG, next.buffer), { threshold: 0.1 });
      changed = d.ratio;
    } catch {
      changed = 0;
    }
    still = next;
    if (changed <= SETTLE_RATIO) return { still, unstable: null };
  }
  still.valid = false;
  still.reasons = [...still.reasons, `page did not settle: ${(changed * 100).toFixed(2)}% of pixels changed between consecutive captures`];
  return { still, unstable: changed };
}

function relTo(base, file) {
  return path.relative(base, file).split(path.sep).join('/');
}

export async function run(args, ctx) {
  const urlMode = args.url !== undefined;
  if (urlMode && (args.url === true || !String(args.url).trim())) throw new UsageError('--url needs a URL (file:// or a local http URL)');
  const config = loadConfig(ctx.root);
  if (!urlMode && config._missing) throw new UsageError('no .ui-evaluator/config.json; run `uie init` (or capture one page with --url)');
  const allowRemote = !!args['allow-remote'];
  let runDir = null;
  let runId = null;
  let baseDir;
  if (args.out) {
    baseDir = ensureDir(path.resolve(String(args.out)));
  } else {
    let r;
    try {
      r = resolveRun(ctx.root, args.run);
    } catch (err) {
      if (urlMode && !args.run) throw new UsageError(`${err.userMessage || err.message} Or capture into a folder with --out <dir> (for example the direction's folder).`);
      throw err;
    }
    runDir = r.dir;
    runId = r.id;
    baseDir = path.join(r.dir, 'evidence');
  }
  const routeFilter = list(args.route);
  const scope = urlMode ? buildScope({ ...config, routes: [{ path: String(args.url), surface: 'url', mode: 'operate', states: [{ name: 'default', actions: [] }] }] }) : buildScope(config, { routes: routeFilter });
  const widths = parseWidths(args.widths) || scope.widths;
  const themes = parseThemes(args.themes) || scope.themes;
  const g2 = args['no-g2'] ? [] : (scope.g2Preferences || []).filter((p) => ['forced-colors', 'more-contrast'].includes(p));
  const cvdWidth = args['no-cvd'] ? null : widths.includes(1280) ? 1280 : widths[widths.length - 1];
  const g2Widths = [...new Set(G2_WIDTHS.map((w) => (widths.includes(w) ? w : null)).filter(Boolean))];
  const g2W = g2Widths.length ? g2Widths : [widths[0], widths[widths.length - 1]].filter((v, i, a) => a.indexOf(v) === i);
  if (urlMode) assertAllowedUrl(String(args.url), allowRemote);
  const deps = await loadDeps(ctx.root);
  const app = urlMode ? { stop: async () => {} } : await ensureApp(config, ctx.root, { allowRemote, log: (m) => ctx.info(m) });
  const items = [];
  const t0 = Date.now();
  let browser = null;
  let walls = [];
  try {
    browser = await launchBrowser(deps);
    const clock = runClock(config, runDir ? readManifest(runDir)?.created_at : null);
    const session = new BrowserSession({ deps, browser, baseUrl: urlMode ? String(args.url) : config.app.base_url, allowRemote, loadTimeout: config.app?.timeout_ms || 60000, app: urlMode ? null : app, fixedTime: clock });
    const slugFor = (routeCfg) => (urlMode ? urlSlug(String(args.url)) : null);
    const shotPath = (ps, suffix) => path.join(baseDir, 'screens', slugFor(ps.routeCfg) || ps.slug, ps.state, `${ps.width}-${ps.theme}${suffix ? `-${suffix}` : ''}.png`);
    const record = (ps, kind, file, still, extra = {}) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (still) fs.writeFileSync(file, still.buffer);
      const item = {
        kind,
        file: relTo(runDir || baseDir, file),
        route: ps.route,
        state: ps.state,
        width: ps.width,
        theme: ps.theme,
        preference: extra.preference || 'default',
        valid: still ? still.valid : extra.valid !== false,
        reasons: still ? still.reasons : extra.reasons || [],
        ...(still ? { width_px: still.width, height_px: still.height, luminance_sd: still.stats?.luminanceSd ?? null } : {}),
        ...(extra.retakes ? { retakes: extra.retakes } : {}),
        at: isoNow(),
      };
      items.push(item);
      return item;
    };
    /** Open, run the recipe and settle; `fn` returns {done:false} to ask for a retake of an invalid capture. */
    const withPage = async (ps, fn) => {
      let last = null;
      for (let attempt = 0; attempt <= RETAKES; attempt += 1) {
        const pg = await session.open(ps, { freezeClock: true });
        try {
          if (!pg.ok) {
            last = { error: pg.error || 'the page did not load' };
            if (pg.authWall) return last;
            continue;
          }
          last = await fn(pg, attempt);
          if (last.done) return last;
        } finally {
          await pg.close();
        }
      }
      return last;
    };
    for (const routeCfg of scope.routes) {
      const states = routeCfg.states && routeCfg.states.length ? routeCfg.states : [{ name: 'default', actions: [] }];
      for (const stateCfg of states) {
        for (const theme of themes) {
          for (const width of widths) {
            const ps = pageState({ routeCfg, stateCfg, width, height: scope.height, theme, preference: 'default', dsf: scope.dsf, reducedMotion: 'reduce' });
            const res = await withPage(ps, async (pg, attempt) => {
              const opts = { PNG: deps.PNG, fullPage: true, masks: routeCfg.mask || [], dsf: ps.dsf, fonts: pg.settle?.fonts || null };
              const { still } = await stableStill(pg.page, deps, opts);
              if (!still.valid && attempt < RETAKES) return { done: false };
              record(ps, urlMode ? 'url' : 'still', shotPath(ps, ''), still, { retakes: attempt });
              // ARIA snapshot and DOM inventory of the same page state.
              const slugDir = slugFor(routeCfg) || ps.slug;
              try {
                const yml = await ariaSnapshot(pg.page);
                const f = path.join(baseDir, 'aria', slugDir, ps.state, `${ps.width}-${ps.theme}.yml`);
                ensureDir(path.dirname(f));
                writeText(f, `${yml}\n`);
                record(ps, 'aria', f, null);
              } catch (err) {
                record(ps, 'aria', path.join(baseDir, 'aria', slugDir, ps.state, `${ps.width}-${ps.theme}.yml`), null, { valid: false, reasons: [`ARIA snapshot failed: ${err.message.split('\n')[0]}`] });
              }
              try {
                const inv = await domInventory(pg.page);
                const f = path.join(baseDir, 'dom', slugDir, ps.state, `${ps.width}-${ps.theme}.json`);
                writeJson(f, { route: ps.route, state: ps.state, width: ps.width, theme: ps.theme, url: pg.load.url, at: isoNow(), controls: inv });
                record(ps, 'dom', f, null);
              } catch (err) {
                ctx.warn(`${ps.key}: DOM inventory failed: ${err.message.split('\n')[0]}`);
              }
              if (width === cvdWidth) {
                await withCdp(pg.page, async (cdp) => {
                  try {
                    for (const type of VISION_DEFICIENCIES) {
                      await emulateVision(cdp, type);
                      const s = await captureStill(pg.page, opts);
                      record(ps, 'cvd', shotPath(ps, `cvd-${type}`), s, { preference: `cvd-${type}` });
                    }
                  } finally {
                    await emulateVision(cdp, 'none').catch(() => {});
                  }
                }).catch((err) => ctx.warn(`${ps.key}: colour-vision captures failed: ${err.message.split('\n')[0]}`));
              }
              return { done: true };
            });
            if (res && res.error) record(ps, urlMode ? 'url' : 'still', shotPath(ps, ''), null, { valid: false, reasons: [res.error] });
          }
          for (const pref of g2) {
            for (const width of g2W) {
              const ps = pageState({ routeCfg, stateCfg, width, height: scope.height, theme, preference: pref, dsf: scope.dsf, reducedMotion: 'reduce' });
              const res = await withPage(ps, async (pg, attempt) => {
                const { still } = await stableStill(pg.page, deps, { PNG: deps.PNG, fullPage: true, masks: routeCfg.mask || [], dsf: ps.dsf, fonts: pg.settle?.fonts || null });
                if (!still.valid && attempt < RETAKES) return { done: false };
                record(ps, 'preference', shotPath(ps, pref), still, { preference: pref, retakes: attempt });
                return { done: true };
              });
              if (res && res.error) record(ps, 'preference', shotPath(ps, pref), null, { valid: false, reasons: [res.error], preference: pref });
            }
          }
        }
      }
    }
    walls = session.authWalls.map((w) => ({ route: w.route, final_url: w.final_url }));
  } finally {
    if (browser) await browser.close().catch(() => {});
    await app.stop();
  }
  const images = items.filter((i) => !['aria', 'dom'].includes(i.kind));
  const invalid = images.filter((i) => !i.valid);
  if (runDir) {
    const man = readManifest(runDir) || {};
    updateManifest(runDir, {
      ...(walls.length ? { scope: { ...(man.scope || {}), auth_walls: walls } } : {}),
      tools: { ...(man.tools || {}), node: process.version, uie: version(), ...toolVersions(deps, null) },
      captures: { ...mergeCaptures(man.captures, items), recipe: 'ARCHITECTURE §9.1: fixed viewport and DPR, reduced motion, animations disabled, caret hidden, clock frozen, fonts loaded, masks, full page from the top, validity and settle check', at: isoNow() },
    });
    appendIndex(ctx.root, `capture ${runId}: ${images.length - invalid.length} valid, ${invalid.length} invalid image(s)${urlMode ? ` of ${args.url}` : ''}`);
  }
  const shown = path.relative(ctx.root, baseDir) || '.';
  ctx.result({ run: runId, dir: shown, auth_walls: walls, images: images.length, valid: images.length - invalid.length, invalid: invalid.map((i) => ({ file: i.file, reasons: i.reasons })), aria: items.filter((i) => i.kind === 'aria' && i.valid).length, dom: items.filter((i) => i.kind === 'dom').length, duration_ms: Date.now() - t0 });
  ctx.print(`captured ${images.length} image(s) (${images.length - invalid.length} valid), ${items.filter((i) => i.kind === 'aria' && i.valid).length} ARIA snapshot(s), ${items.filter((i) => i.kind === 'dom').length} DOM inventor${items.filter((i) => i.kind === 'dom').length === 1 ? 'y' : 'ies'} → ${shown}`);
  for (const w of walls) ctx.print(`${w.route} redirected to a sign-in page. ${AUTH_WALL_ADVICE}`);
  for (const i of invalid.slice(0, 10)) ctx.print(`  invalid: ${i.file}: ${i.reasons.join('; ')}`);
  if (invalid.length > 10) ctx.print(`  … ${invalid.length - 10} more (manifest.captures.invalid_files)`);
  if (!images.length) throw new UsageError('nothing was captured');
  return invalid.length ? 2 : 0;
}

