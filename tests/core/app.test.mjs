// The app lifecycle shared by the browser commands (browser/app.mjs) and the run clock (browser/capture.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { ensureApp, reachable } from '../../skills/ui-evaluator/scripts/lib/browser/app.mjs';
import { runClock } from '../../skills/ui-evaluator/scripts/lib/browser/capture.mjs';

function freePort() {
  return new Promise((resolve) => {
    const srv = net.createServer().listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

const serverCmd = (port) => `"${process.execPath}" -e "require('http').createServer((q,s)=>s.end('ok')).listen(${port},'127.0.0.1')"`;

test('an app uie started is restarted when it exits mid-run; a server uie did not start is only described', async (t) => {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}/`;
  const logs = [];
  const app = await ensureApp({ app: { base_url: base, start: serverCmd(port), timeout_ms: 15000 } }, process.cwd(), { log: (m) => logs.push(m) });
  t.after(() => app.stop());
  assert.equal(app.started, true);
  assert.equal(await reachable(base), true);
  process.kill(-app.pid, 'SIGKILL');
  for (let i = 0; i < 50 && (await reachable(base, 300)); i += 1) await new Promise((r) => setTimeout(r, 100));
  assert.equal(await reachable(base, 500), false, 'the server is gone');
  assert.equal(await app.revive(), true, 'revive restarts it');
  assert.equal(await reachable(base), true);
  assert.ok(logs.some((l) => /exited during the run/.test(l)));

  const reused = await ensureApp({ app: { base_url: base, start: serverCmd(port) } }, process.cwd(), { log: (m) => logs.push(m) });
  assert.equal(reused.started, false);
  assert.ok(logs.some((l) => /uie did not start it/.test(l)), 'reusing a running server is said out loud');
  assert.match(reused.describe(), /already running/);
});

test('the frozen clock is the run day at 10:00 UTC, or the configured instant', () => {
  assert.equal(runClock({}, '2026-10-01T23:35:10.000Z').toISOString(), '2026-10-01T10:00:00.000Z');
  assert.equal(runClock({ capture: { clock: '2027-03-04T08:30:00Z' } }, '2026-10-01T23:35:10.000Z').toISOString(), '2027-03-04T08:30:00.000Z');
  assert.equal(runClock({ capture: { clock: 'not a date' } }, '2026-10-01T00:00:00Z').toISOString(), '2026-10-01T10:00:00.000Z');
  assert.equal(runClock({}, null).toISOString().slice(11), '10:00:00.000Z');
});
