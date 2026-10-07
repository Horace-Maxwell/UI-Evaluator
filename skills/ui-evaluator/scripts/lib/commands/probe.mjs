// uie probe — perform an interaction recipe (ARCHITECTURE §8.5 probe actions) and record what happened:
// a screenshot after every step, the final full-page still and ARIA snapshot, console and network summaries and
// timing, in runs/<id>/probes/<n>/ (or --out). Used by evaluators and the verifier to exercise behaviour.
// Only local URLs are opened unless --allow-remote; on non-local hosts, submitting a payment or authentication form
// is refused (§13).
import path from 'node:path';
import { ensureDir, writeJson, writeText, readText } from '../util/fs.mjs';
import { UsageError, intOpt } from '../util/args.mjs';
import { isoNow } from '../util/time.mjs';
import { resolveRun, loadConfig, appendIndex } from '../project.mjs';
import { pageState, BrowserSession, AUTH_WALL_ADVICE } from '../browser/pages.mjs';
import { launchBrowser, assertAllowedUrl, resolveUrl, isLocalUrl } from '../browser/launch.mjs';
import { runActions, parseActionsArg, validateActions } from '../browser/actions.mjs';
import { ariaSnapshot, runClock } from '../browser/capture.mjs';
import { loadDeps, nextNumberedDir, toolVersions } from '../browser/command-kit.mjs';
import { ensureApp } from '../browser/app.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'allow-remote', 'no-step-shots', 'reduced-motion'] };

export const help = `uie probe --url <url|route> --actions <json|file> [--width 1280] [--height 900] [--theme light|dark]
           [--reduced-motion] [--out <dir>] [--run <id>] [--timeout <ms>] [--allow-remote] [--json]

Opens the URL (a route is resolved against config.app.base_url, and the app is started with config.app.start
when it does not answer), performs the actions in order and stops at the
first failing one. Actions (ARCHITECTURE §8.5): goto {url}; back; forward; reload; click|dblclick|hover|focus {target}; fill|select
{target, value}; check|uncheck {target}; press {key, target?}; tab {count?, shift?}; scroll {target? | y};
wait {ms | target, state?}; expect {text, target?} | {url} | {target, state}; screenshot {name, full_page?};
viewport {width, height?}; emulate {colorScheme?, reducedMotion?, forcedColors?}. Targets: role=button[name="Save"],
label=…, text=…, placeholder=…, testid=…, alt=…, or CSS. --actions takes JSON text or a JSON file (an array, or an
object with "actions" or "correct_actions"). Write each step as {"action": "goto", "url": "/"}; {"goto": {"url": "/"}}
is read the same way.

Writes runs/<id>/probes/<n>/ (default; --out overrides): probe.json (steps, console, network, timing),
step-NN.png after each step, final.png, aria.yml, and prints the paths.
Exit codes: 0 every step passed · 2 a step or an expectation failed, or the page did not load · 1 could not run.`;

function readActionsFile(p) {
  const text = readText(path.resolve(p), null);
  if (text === null) throw new UsageError(`--actions: cannot read ${p}`);
  return text;
}

export async function run(args, ctx) {
  if (!args.url || args.url === true) throw new UsageError('--url is required (a URL, or a route resolved against config.app.base_url)');
  if (args.actions === undefined || args.actions === true) throw new UsageError('--actions is required: JSON text or a JSON file, e.g. --actions \'[{"action":"click","target":"role=button[name=\\"Save\\"]"}]\'');
  const actions = parseActionsArg(args.actions, readActionsFile);
  const problems = validateActions(actions);
  if (problems.length) throw new UsageError(`invalid --actions:\n${problems.map((p) => `  step ${p.step}: ${p.message}`).join('\n')}`);
  const config = loadConfig(ctx.root);
  const raw = String(args.url);
  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  if (!isAbsolute && config._missing) throw new UsageError(`--url "${raw}" is a route, but there is no .ui-evaluator/config.json with app.base_url; pass a full URL`);
  const url = isAbsolute ? raw : resolveUrl(config.app.base_url, raw);
  const allowRemote = !!args['allow-remote'];
  assertAllowedUrl(url, allowRemote);
  const width = args.width ? intOpt(args.width, 'width', { min: 200, max: 4000 }) : 1280;
  const height = args.height ? intOpt(args.height, 'height', { min: 200, max: 4000 }) : config.matrix?.height || 900;
  const theme = args.theme || 'light';
  if (!['light', 'dark'].includes(theme)) throw new UsageError('--theme must be light or dark');
  const timeout = args.timeout ? intOpt(args.timeout, 'timeout', { min: 500, max: 60000 }) : 10000;
  let outDir;
  let runId = null;
  if (args.out) outDir = ensureDir(path.resolve(String(args.out)));
  else {
    const r = resolveRun(ctx.root, args.run);
    runId = r.id;
    outDir = ensureDir(nextNumberedDir(ensureDir(path.join(r.dir, 'probes'))));
  }
  const deps = await loadDeps(ctx.root);
  // A route of the configured app: start it like the other browser commands when it does not answer.
  const app = !isAbsolute || (!config._missing && url.startsWith(config.app.base_url)) ? await ensureApp(config, ctx.root, { allowRemote, log: (m) => ctx.info(m) }) : { stop: async () => {} };
  const t0 = Date.now();
  const browser = await launchBrowser(deps).catch(async (err) => {
    await app.stop();
    throw err;
  });
  const record = { schema: 'probe', run: runId, url, at: isoNow(), viewport: { width, height }, theme, reduced_motion: !!args['reduced-motion'], actions, steps: [], ok: false };
  const shots = [];
  let pg = null;
  try {
    const session = new BrowserSession({ deps, browser, baseUrl: isAbsolute ? url : config.app.base_url, allowRemote, actionTimeout: timeout, loadTimeout: config.app?.timeout_ms || 60000, app: app.revive ? app : null, fixedTime: runClock(config, null) });
    const routeCfg = { path: url, mode: 'operate', states: [{ name: 'probe', actions: [] }] };
    const ps = pageState({ routeCfg, stateCfg: routeCfg.states[0], width, height, theme, preference: 'default', reducedMotion: args['reduced-motion'] ? 'reduce' : null });
    pg = await session.open(ps, { settle: false, recipe: false });
    record.load = { status: pg.load.status, ms: pg.load.ms, ok: !!pg.load.ok, error: pg.load.error || null, timing: pg.load.timing || null };
    if (!pg.load.ok) {
      record.error = pg.error || `could not load ${url}`;
      if (pg.authWall) record.auth_wall = { route: pg.authWall.route, final_url: pg.authWall.final_url, advice: AUTH_WALL_ADVICE };
    } else {
      const stepShot = async (step) => {
        if (args['no-step-shots']) return;
        const file = path.join(outDir, `step-${String(step.step).padStart(2, '0')}.png`);
        try {
          await pg.page.screenshot({ path: file, animations: 'disabled', caret: 'hide' });
          step.screenshot = path.basename(file);
          shots.push(file);
        } catch {
          /* a navigation can close the page mid-shot */
        }
      };
      const res = await runActions(pg.page, actions, { baseUrl: isAbsolute ? new URL(url).origin : config.app.base_url, allowRemote, timeout, outDir, screenshots: shots, onStep: stepShot });
      record.steps = res.steps;
      record.ok = res.ok;
      if (!res.ok) record.error = res.error;
      try {
        await pg.page.screenshot({ path: path.join(outDir, 'final.png'), fullPage: true, animations: 'disabled', caret: 'hide' });
        record.final = 'final.png';
      } catch (err) {
        record.final_error = err.message.split('\n')[0];
      }
      try {
        writeText(path.join(outDir, 'aria.yml'), `${await ariaSnapshot(pg.page)}\n`);
        record.aria = 'aria.yml';
      } catch (err) {
        record.aria_error = err.message.split('\n')[0];
      }
      record.final_url = pg.page.url();
    }
    record.console = {
      errors: pg.console.map((c) => ({ text: c.text, where: c.url ? `${c.url}${c.line != null ? `:${c.line + 1}` : ''}` : '', phase: c.phase })).slice(0, 50),
      page_errors: pg.pageErrors.slice(0, 20),
    };
    record.network = {
      failed: pg.failedRequests.slice(0, 50),
      bad_responses: pg.badResponses.slice(0, 50),
      blocked_remote: session.blocked.slice(0, 50),
    };
    record.timing = { load_ms: pg.load.ms, total_ms: Date.now() - t0, steps_ms: record.steps.reduce((a, s) => a + (s.ms || 0), 0) };
    record.tools = toolVersions(deps, browser.version());
  } finally {
    if (pg) await pg.close();
    await browser.close().catch(() => {});
    await app.stop();
  }
  writeJson(path.join(outDir, 'probe.json'), record);
  if (runId) appendIndex(ctx.root, `probe ${path.relative(ctx.root, outDir)}: ${record.ok ? 'passed' : `failed — ${String(record.error || '').slice(0, 120)}`}`);
  const rel = (p) => path.relative(ctx.root, p) || '.';
  ctx.result({ ok: record.ok, dir: rel(outDir), probe: rel(path.join(outDir, 'probe.json')), screenshots: shots.map(rel), final: record.final ? rel(path.join(outDir, 'final.png')) : null, aria: record.aria ? rel(path.join(outDir, 'aria.yml')) : null, error: record.error || null });
  ctx.print(`probe ${record.ok ? 'passed' : 'FAILED'}: ${url}${record.error ? `\n  ${record.error}` : ''}`);
  for (const s of record.steps) ctx.print(`  ${s.ok ? 'ok ' : 'BAD'} step ${s.step} ${s.action}${s.target ? ` ${s.target}` : ''} (${s.ms} ms)${s.error ? ` — ${s.error}` : ''}`);
  ctx.print(`console: ${record.console.errors.length} error(s), ${record.console.page_errors.length} uncaught exception(s); network: ${record.network.failed.length} failed, ${record.network.bad_responses.length} 4xx/5xx${record.network.blocked_remote.length ? `, ${record.network.blocked_remote.length} remote blocked` : ''}`);
  ctx.print(`files: ${rel(path.join(outDir, 'probe.json'))}${record.final ? `, ${rel(path.join(outDir, 'final.png'))}` : ''}${record.aria ? `, ${rel(path.join(outDir, 'aria.yml'))}` : ''}${shots.length ? `, ${shots.length} step screenshot(s)` : ''}`);
  if (record.auth_wall) ctx.print(`${record.auth_wall.route} redirected to a sign-in page. ${AUTH_WALL_ADVICE}`);
  if (!isLocalUrl(url)) ctx.warn('remote URL probed with --allow-remote; payment and authentication submissions were refused');
  return record.ok ? 0 : 2;
}

