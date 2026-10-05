// The app under test (ARCHITECTURE §8.5 `app {start, cwd, base_url, ready_url, timeout_ms, env}`): browser commands
// start nothing when the base URL answers. Otherwise, when `app.start` is set, they run it in `app.cwd` with
// `app.env`, wait until `ready_url` (or the base URL) answers 2xx within `timeout_ms`, and stop it afterwards.
import path from 'node:path';
import { spawn } from 'node:child_process';
import { UsageError } from '../util/args.mjs';
import { assertAllowedUrl } from './launch.mjs';

/** True when anything answers HTTP at `url` (any status). */
export async function reachable(url, timeoutMs = 2500) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    await res.body?.cancel().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/** HTTP status at `url`, or null when nothing answers. */
export async function statusOf(url, timeoutMs = 2500) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
    await res.body?.cancel().catch(() => {});
    return res.status;
  } catch {
    return null;
  }
}

function killTree(child, signal) {
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      /* already gone */
    }
  }
}

/**
 * Make sure the app answers at its base URL. Returns { started, url, stop(), revive(), describe() }; stop() is a no-op
 * when nothing was started. revive() is called when a page load is refused mid-run: it restarts an app that uie started
 * and that has exited, and reports whether the base URL answers again. Throws a UsageError when the app is down and
 * cannot be started.
 */
export async function ensureApp(config, root, { allowRemote = false, log = () => {} } = {}) {
  const app = config.app || {};
  const base = app.base_url;
  if (!base) throw new UsageError('config.app.base_url is not set');
  assertAllowedUrl(base, allowRemote);
  if (/^file:/i.test(base)) return { started: false, url: base, stop: async () => {}, revive: async () => true, describe: () => 'file URL' };
  if (await reachable(base)) {
    if (app.start) log(`something already answers at ${base}; using it. uie did not start it, so make sure it serves this project`);
    return { started: false, url: base, stop: async () => {}, revive: async () => reachable(base), describe: () => `the app at ${base} was already running when uie started; another process may have stopped it or may own the port` };
  }
  if (!app.start) {
    throw new UsageError(`the app does not answer at ${base} and config.app.start is not set. Start the app, or set app.start in .ui-evaluator/config.json`);
  }
  const ready = app.ready_url || base;
  assertAllowedUrl(ready, allowRemote);
  const cwd = path.resolve(root, app.cwd || '.');
  const timeout = Number(app.timeout_ms) || 60000;
  let proc = await startProcess({ start: app.start, cwd, env: app.env, ready, timeout, log });
  let restarts = 0;
  return {
    started: true,
    url: base,
    get pid() {
      return proc.child.pid;
    },
    stop: async () => proc.stop(),
    revive: async () => {
      if (await reachable(base)) return true;
      // A server that just died may not have reported its exit yet.
      const end = Date.now() + 3000;
      while (!proc.exited() && Date.now() < end) await new Promise((r) => setTimeout(r, 100));
      if (!proc.exited()) return false;
      if (restarts >= 2) return false;
      restarts += 1;
      log(`the app exited during the run (${describeExit(proc.exited())}); restarting it (${restarts}/2)`);
      try {
        proc = await startProcess({ start: app.start, cwd, env: app.env, ready, timeout, log });
        return true;
      } catch (err) {
        log(err.userMessage || err.message);
        return false;
      }
    },
    describe: () => (proc.exited() ? `the app process uie started exited (${describeExit(proc.exited())})${proc.tail().length ? `; last output: ${proc.tail().slice(-3).join(' | ')}` : ''}` : `the app uie started is running but ${base} refused the connection`),
  };
}

function describeExit(e) {
  return e ? e.error || (e.sig ? `signal ${e.sig}` : `code ${e.code}`) : 'running';
}

async function startProcess({ start, cwd, env, ready, timeout, log }) {
  log(`starting the app: \`${start}\` in ${cwd} (waiting up to ${Math.round(timeout / 1000)} s for ${ready})`);
  const child = spawn(start, { cwd, env: { ...process.env, ...(env || {}) }, shell: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
  const tail = [];
  const keep = (buf) => {
    for (const line of String(buf).split('\n')) if (line.trim()) tail.push(line.slice(0, 300));
    while (tail.length > 30) tail.shift();
  };
  child.stdout.on('data', keep);
  child.stderr.on('data', keep);
  let exited = null;
  child.on('exit', (code, sig) => {
    exited = { code, sig };
  });
  child.on('error', (err) => {
    exited = { code: null, sig: null, error: err.message };
  });
  const stop = async () => {
    if (exited) return;
    killTree(child, 'SIGTERM');
    const end = Date.now() + 3000;
    while (!exited && Date.now() < end) await new Promise((r) => setTimeout(r, 100));
    if (!exited) killTree(child, 'SIGKILL');
  };
  const end = Date.now() + timeout;
  for (;;) {
    if (exited) {
      throw new UsageError(`the app command \`${start}\` exited (${exited.error || `code ${exited.code}`}) before ${ready} answered.${tail.length ? `\nLast output:\n  ${tail.slice(-8).join('\n  ')}` : ''}`);
    }
    const st = await statusOf(ready, 2000);
    if (st !== null && st >= 200 && st < 300) {
      log(`the app answers at ${ready}`);
      return { child, stop, exited: () => exited, tail: () => tail };
    }
    if (Date.now() >= end) {
      await stop();
      throw new UsageError(`the app did not answer 2xx at ${ready} within ${Math.round(timeout / 1000)} s (last status ${st ?? 'none'}).${tail.length ? `\nLast output:\n  ${tail.slice(-8).join('\n  ')}` : ''}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
}
