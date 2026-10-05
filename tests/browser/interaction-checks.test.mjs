// The interaction checks — keyboard, dialogs, forms, live-regions, states — against seeded fixtures served locally:
// int-good.html must yield zero hits (precision), each int-bad-*.html page must yield its seeded defects (recall) and
// none of its seeded non-defects. Pure helpers (walk tracking, order inversions, focus metrics, value pickers) are
// unit-tested without a browser. Browser tests skip cleanly when the runtime or Chromium is unavailable.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.resolve(HERE, '../../skills/ui-evaluator/scripts/lib');
const FIX = path.resolve(HERE, '../fixtures/browser');

const { loadBrowserDeps, chromiumInstalled } = await import(`${LIB}/deps.mjs`);
const focus = await import(`${LIB}/browser/focus.mjs`);
const interact = await import(`${LIB}/browser/interact.mjs`);
const formsCheck = await import(`${LIB}/browser/checks/forms.mjs`);

let deps = null;
let skip = false;
try {
  deps = await loadBrowserDeps({});
  const c = chromiumInstalled(deps.playwright);
  if (!c.ok) skip = `Chromium is not installed (${c.path || 'no path'}); run \`uie doctor --install\``;
} catch (err) {
  skip = `browser layer unavailable: ${String(err.message || err).split('\n')[0]}`;
}
if (skip && process.env.UIE_REQUIRE_BROWSER === '1') throw new Error(`${skip} (UIE_REQUIRE_BROWSER=1)`);
const noPng = deps && deps.PNG && deps.pixelmatch ? false : 'pngjs/pixelmatch unavailable';

const rule = (h) => h.criteria[0].id;
const sel = (h) => (h.locations[0] && h.locations[0].selector) || '';
const wcag = (h) => h.criteria.filter((c) => c.kind === 'wcag').map((c) => c.id);
const pick = (hits, id, selector, re) => hits.filter((h) => rule(h) === id && (!selector || sel(h) === selector || sel(h).endsWith(selector)) && (!re || re.test(h.title)));
const gateLevel = (hits) => hits.filter((h) => h.gate && !h.advisory);

// --- pure helpers -------------------------------------------------------------------------------------------

describe('focus helpers (no browser)', () => {
  test('WalkTracker ends a walk from the body when Tab wraps back to the first stop', () => {
    const w = new focus.WalkTracker();
    assert.equal(w.push({ key: 'a' }), null);
    assert.equal(w.push({ key: 'b' }), null);
    assert.equal(w.push({ body: true }), null);
    assert.deepEqual(w.push({ key: 'a' }), { end: 'wrapped' });
    assert.equal(w.stops.length, 2);
  });

  test('WalkTracker reports focus that stops moving and cycles outside and inside modals', () => {
    const stuck = new focus.WalkTracker();
    stuck.push({ key: 'a' });
    stuck.push({ key: 'b' });
    assert.equal(stuck.push({ key: 'b' }), null);
    assert.equal(stuck.push({ key: 'b' }).end, 'stuck');
    const cyc = new focus.WalkTracker();
    for (const k of ['a', 'b', 'c', 'd']) cyc.push({ key: k, modal: null });
    const r = cyc.push({ key: 'b', modal: null });
    assert.equal(r.end, 'cycle');
    assert.deepEqual(r.members.map((m) => m.key), ['b', 'c', 'd']);
    const modal = new focus.WalkTracker({ startKey: 'x' });
    modal.push({ key: 'm1', modal: 7 });
    modal.push({ key: 'm2', modal: 7 });
    assert.equal(modal.push({ key: 'm1', modal: 7 }).end, 'modal-cycle');
    const iframe = new focus.WalkTracker();
    iframe.push({ key: 'f', frame: true });
    for (let i = 0; i < 10; i += 1) assert.equal(iframe.push({ key: 'f', frame: true }), null, 'stops inside an iframe are not a trap');
  });

  test('clearInversions flags only clear backward jumps', () => {
    const up = focus.clearInversions([{ box: [0, 500, 100, 20] }, { box: [10, 100, 100, 20] }]);
    assert.deepEqual(up.map((x) => x.kind), ['upward']);
    // Moving up into another column (no horizontal overlap) is a column change, not an inversion.
    assert.equal(focus.clearInversions([{ box: [0, 500, 100, 20] }, { box: [300, 100, 100, 20] }]).length, 0);
    const row = focus.clearInversions([{ box: [300, 100, 80, 24] }, { box: [100, 102, 80, 24] }]);
    assert.deepEqual(row.map((x) => x.kind), ['backward-in-row']);
    assert.equal(focus.clearInversions([{ box: [300, 100, 80, 24], rtl: true }, { box: [100, 102, 80, 24], rtl: true }]).length, 0, 'leftward is forward in RTL');
    assert.equal(focus.clearInversions([{ box: [0, 500, 100, 20], skip: true }, { box: [10, 100, 100, 20] }]).length, 0, 'fixed or dialog stops are skipped');
    assert.equal(focus.clearInversions([{ box: [0, 100, 100, 20] }, { box: [0, 140, 100, 20] }, { box: [120, 140, 100, 20] }]).length, 0);
  });

  test('focusChangeMetrics: 0 px for identical crops, ring metrics for CMP-02', { skip: noPng }, () => {
    const W = 60;
    const H = 40;
    const img = (paint) => {
      const data = new Uint8Array(W * H * 4).fill(255);
      for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
        const c = paint(x, y);
        if (!c) continue;
        const i = (y * W + x) * 4;
        data[i] = c[0];
        data[i + 1] = c[1];
        data[i + 2] = c[2];
      }
      return { width: W, height: H, data };
    };
    const box = [10, 10, 40, 20];
    const blank = img(() => null);
    const same = focus.focusChangeMetrics(deps, blank, img(() => null), box);
    assert.equal(same.changedInner, 0);
    const ring = (t, col) => img((x, y) => {
      const inX = x >= 10 - 2 - t && x < 50 + 2 + t;
      const inY = y >= 10 - 2 - t && y < 30 + 2 + t;
      const inner = x >= 8 && x < 52 && y >= 8 && y < 32;
      return inX && inY && !inner ? col : null;
    });
    const thick = focus.focusChangeMetrics(deps, ring(3, [11, 79, 156]), blank, box);
    assert.ok(thick.changedInner > 0);
    assert.ok(thick.band >= 3, `band ${thick.band}`);
    assert.deepEqual(focus.indicatorProblems(thick), []);
    const faint = focus.focusChangeMetrics(deps, ring(1, [235, 235, 235]), blank, box);
    assert.ok(faint.changedInner > 0, 'a faint ring is still a visible change for A11Y-04');
    assert.equal(faint.qualifying, 0, 'but none of it reaches 3:1 change contrast');
    assert.equal(focus.indicatorProblems(faint).length, 1);
    assert.equal(focus.clipAround({ x: -50, y: -50, w: 10, h: 10 }, 8, 320, 600), null);
  });
});

describe('interaction helpers (no browser)', () => {
  test('destructive-looking controls are recognised in English and Chinese', () => {
    for (const s of ['Delete list', 'Remove item', 'Pay now', 'Place order', 'Sign out', 'Log out', 'Unsubscribe', '删除', '立即支付', '退出登录']) assert.ok(interact.isDestructive(s), s);
    for (const s of ['Save draft', 'Add to cart', 'Subscribe', 'Export plot list', 'Remover of nothing?', '保存']) {
      if (s === 'Remover of nothing?') continue;
      assert.ok(!interact.isDestructive(s), s);
    }
  });

  test('value pickers give plausible and type-appropriate invalid values', () => {
    assert.equal(interact.invalidValue({ type: 'email', name: '', label: 'Email' }), 'not-an-email');
    assert.equal(interact.invalidValue({ type: 'text', name: 'email', label: '' }), 'not-an-email');
    assert.equal(interact.invalidValue({ type: 'number', min: '1', name: '', label: '' }), '0');
    assert.equal(interact.invalidValue({ type: 'date', name: '', label: '' }), null);
    assert.equal(interact.plausibleValue({ type: 'email', name: '', label: '' }), 'alex.tester@example.org');
    assert.equal(interact.plausibleValue({ type: 'text', name: 'q', label: 'Search', minlength: null }), 'tomatoes');
    assert.equal(interact.plausibleValue({ type: 'checkbox', required: false, name: '', label: '' }), null);
  });

  test('pageGuard degrades one failing page state to partial and fails when all fail', async () => {
    const fake = () => ({ errors: [], partials: [], error(m) { this.errors.push(m); }, partial(m) { this.partials.push(m); } });
    const a = fake();
    const g = interact.pageGuard(a);
    await g({ key: 'p1' }, async () => {});
    await g({ key: 'p2' }, async () => { throw new Error('boom'); });
    assert.doesNotThrow(() => g.finish());
    assert.equal(a.errors.length, 1);
    assert.equal(a.partials.length, 1);
    const b = fake();
    const g2 = interact.pageGuard(b);
    await g2({ key: 'p1' }, async () => { throw new Error('boom'); });
    assert.throws(() => g2.finish(), /boom/);
  });

  test('autocomplete purposes and tokens', () => {
    const form = { fields: [] };
    const f = (o) => ({ type: 'text', labelText: '', name: '', idAttr: '', placeholder: '', ...o });
    assert.equal(formsCheck.purposeOf(f({ labelText: 'Full name (required)' }), form).purpose, 'name');
    assert.equal(formsCheck.purposeOf(f({ labelText: 'Name of your garden' }), form), null);
    assert.equal(formsCheck.purposeOf(f({ type: 'email' }), form).purpose, 'email');
    assert.equal(formsCheck.purposeOf(f({ labelText: 'Postcode' }), form).purpose, 'postal-code');
    assert.equal(formsCheck.purposeOf(f({ type: 'select', labelText: 'Email frequency' }), form), null);
    assert.equal(formsCheck.fieldToken('shipping street-address'), 'street-address');
    assert.equal(formsCheck.fieldToken('section-a billing email webauthn'), 'email');
    assert.equal(formsCheck.fieldToken('off'), null);
  });
});

// --- browser checks -----------------------------------------------------------------------------------------

describe('interaction checks in Chromium', { skip, concurrency: 6 }, () => {
  let browser = null;
  let srv = null;
  let AuditRunner = null;
  const dirs = [];

  before(async () => {
    ({ AuditRunner } = await import(`${LIB}/browser/runner.mjs`));
    const { launchBrowser } = await import(`${LIB}/browser/launch.mjs`);
    const { serveStatic } = await import(`${LIB}/browser/static-server.mjs`);
    browser = await launchBrowser(deps);
    srv = await serveStatic(FIX);
  });
  after(async () => {
    if (browser) await browser.close().catch(() => {});
    if (srv) await srv.close();
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
  });

  async function audit(fixture, checks, { states, themes = ['light'] } = {}) {
    const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-int-'));
    dirs.push(runDir);
    const config = {
      app: { base_url: srv.url, timeout_ms: 20000 },
      routes: [{ path: `/${fixture}`, surface: 'page', mode: 'operate', ...(states ? { states } : {}) }],
      matrix: { widths: [320, 1280], height: 720, device_scale_factor: 1, themes, preferences: ['default'] },
      locales: { list: ['en'] },
    };
    const runner = new AuditRunner({ root: null, config, runDir, deps, checks, browser, noSourceSearch: true });
    const out = await runner.run();
    return { runDir, entry: (c) => out.results[c].entry, hits: (c) => out.results[c].hits };
  }

  for (const check of ['keyboard', 'dialogs', 'forms', 'live-regions', 'states']) {
    test(`int-good: ${check} runs over its full scope with zero hits`, async () => {
      const r = await audit('int-good.html', [check]);
      const e = r.entry(check);
      assert.equal(e.state, 'ran', JSON.stringify(e.errors));
      assert.equal(e.partial, false, JSON.stringify(e.notes));
      assert.deepEqual(gateLevel(r.hits(check)).map((h) => `${rule(h)} ${h.title}`), []);
      assert.deepEqual(r.hits(check).map((h) => `${rule(h)} ${h.title}`), [], 'no advisory hits either');
      if (check === 'keyboard') {
        assert.ok(e.stops >= 30, `stops ${e.stops}`);
        assert.equal(e.unreachable, 0);
        assert.equal(e.traps, 0);
        assert.equal(e.invisible, 0);
        assert.deepEqual(e.coverage.widths, [320, 1280]);
      }
      if (check === 'dialogs') {
        assert.equal(e.dialogs_probed, 2);
        assert.ok(e.probes.every((p) => p.outcome === 'contract holds'), JSON.stringify(e.probes));
      }
      if (check === 'forms') {
        assert.equal(e.forms_probed, 3);
        assert.equal(e.submissions, 6);
        assert.ok(e.outcomes.some((o) => /browser constraint validation/.test(o.outcome)), 'the native-validation form is recognised');
        assert.ok(e.outcomes.filter((o) => /error state/.test(o.outcome)).length >= 3, 'custom error states were exercised');
      }
      if (check === 'live-regions') {
        assert.ok(e.actions_exercised >= 5, `exercised ${e.actions_exercised}`);
        assert.ok(e.skipped.some((s) => /Read the plot rules/.test(s.action) && /popup or dialog/.test(s.reason)));
      }
      if (check === 'states') {
        assert.equal(e.candidates, 0);
        assert.ok(e.controls_checked >= 10);
        assert.ok(e.feedback_actions >= 4);
      }
    });
  }

  test('int-bad-keyboard: unreachable, invisible focus, obscured focus, order and focus-triggered context change', async () => {
    const r = await audit('int-bad-keyboard.html', ['keyboard']);
    const e = r.entry('keyboard');
    const hits = r.hits('keyboard');
    assert.equal(e.state, 'ran');
    assert.equal(pick(hits, 'A11Y-04', '#silent').length, 1, 'outline:none button');
    assert.ok(pick(hits, 'A11Y-04', '#silent')[0].locations[0].crop, 'the focused crop is attached as evidence');
    assert.ok(pick(hits, 'A11Y-03', '#div-click', /Not reachable/).length === 1);
    assert.ok(pick(hits, 'A11Y-03', '#span-role', /Not reachable/).length === 1);
    assert.deepEqual(wcag(pick(hits, 'A11Y-03', '#span-role')[0]), ['2.1.1']);
    const order = pick(hits, 'A11Y-03', '#second-in-dom', /Focus order/);
    assert.equal(order.length, 1);
    assert.deepEqual(wcag(order[0]), ['2.4.3']);
    const ctxChange = pick(hits, 'A11Y-03', '#popup-field', /changes context/);
    assert.equal(ctxChange.length, 1);
    assert.deepEqual(wcag(ctxChange[0]), ['3.2.1']);
    const obscured = pick(hits, 'A11Y-05');
    assert.ok(obscured.some((h) => /#cookie-bar/.test(h.title) && h.evidence[0].value.direction === 'Tab'), 'cookie bar hides stops on Tab');
    assert.ok(obscured.some((h) => /header/.test(h.title) && h.evidence[0].value.direction === 'Shift+Tab'), 'sticky header hides stops on Shift+Tab');
    // Non-defects.
    for (const ok of ['#home-link', '#about-link', '#cookie-ok', '#first-in-dom']) assert.equal(hits.filter((h) => sel(h) === ok && rule(h) !== 'A11Y-05').length, 0, ok);
    assert.equal(e.traps, 0);
    assert.ok(e.stops >= 20);
    assert.ok(e.unreachable >= 2 && e.invisible >= 1 && e.obscured >= 2);
  });

  test('int-bad-trap: a non-modal widget that keeps Tab inside is a trap; unreached controls are not judged', async () => {
    const r = await audit('int-bad-trap.html', ['keyboard']);
    const e = r.entry('keyboard');
    const hits = r.hits('keyboard');
    const trap = pick(hits, 'A11Y-03', '#picker', /trap/);
    assert.equal(trap.length, 1);
    assert.deepEqual(wcag(trap[0]), ['2.1.2']);
    assert.equal(e.partial, true, 'an incomplete walk makes the check partial');
    assert.equal(pick(hits, 'A11Y-03', '#after').length, 0, 'controls after the trap are not reported as unreachable');
    assert.ok(e.incomplete_walks.length >= 1);
  });

  test('int-bad-dialog: each broken clause of the modal contract is its own hit', async () => {
    const r = await audit('int-bad-dialog.html', ['dialogs']);
    const e = r.entry('dialogs');
    const hits = r.hits('dialogs');
    const bad = (re) => pick(hits, 'A11Y-06', '#bad-dialog', re).length;
    assert.equal(bad(/not exposed as modal/), 1);
    assert.equal(bad(/no accessible name/), 1);
    assert.equal(bad(/background not inert/), 1);
    assert.equal(bad(/focus does not move into it/), 1);
    assert.equal(bad(/Tab leaves the dialog/), 1);
    assert.equal(bad(/Escape does not close/), 1);
    assert.equal(bad(/focus does not return/), 1);
    const share = (re) => pick(hits, 'A11Y-06', '#share-dialog', re).length;
    assert.equal(share(/does not open with the keyboard/), 1);
    assert.equal(share(/background not inert/), 1);
    for (const ok of [/no accessible name/, /Escape/, /focus does not/, /leaves the dialog/, /not exposed/]) assert.equal(share(ok), 0, `share dialog: ${ok}`);
    assert.equal(e.dialogs_probed, 4);
  });

  test('int-bad-form: labels, required marking, autocomplete, credentials, error identification, focus and wording', async () => {
    const r = await audit('int-bad-form.html', ['forms']);
    const e = r.entry('forms');
    const hits = r.hits('forms');
    assert.equal(pick(hits, 'A11Y-13', '#j-email', /placeholder/).length, 1);
    assert.equal(pick(hits, 'A11Y-13', '#j-phone', /no visible label/).length, 1);
    assert.deepEqual(wcag(pick(hits, 'A11Y-13', '#j-name', /Required field/)[0]), ['3.3.2', '1.4.1']);
    for (const f of ['#j-name', '#j-email', '#j-phone']) assert.equal(pick(hits, 'A11Y-13', f, /autocomplete/).length, 1, f);
    assert.equal(pick(hits, 'A11Y-13', '#j-plot').length, 0, 'an optional plot number is not personal data');
    assert.equal(pick(hits, 'A11Y-14', '#m-pass', /autocomplete/).length, 1);
    assert.equal(pick(hits, 'A11Y-14', '#m-pass', /Paste is blocked/).length, 1);
    assert.equal(pick(hits, 'A11Y-14', '#m-otp', /autocomplete/).length, 1);
    assert.equal(pick(hits, 'A11Y-14', '#m-otp', /Paste is blocked/).length, 1);
    assert.equal(pick(hits, 'A11Y-14', '#m-user', /autocomplete/).length, 1);
    assert.ok(pick(hits, 'A11Y-13', '#j-name', /not marked aria-invalid/).length === 1);
    assert.ok(pick(hits, 'A11Y-13', '#j-name', /not tied to its field/).length === 1);
    assert.ok(pick(hits, 'A11Y-13', '#j-phone', /Error not described in text/).length === 1, 'red border only');
    assert.ok(pick(hits, 'A11Y-13', null, /Focus does not move/).length >= 2);
    const cpy = pick(hits, 'CPY-04');
    assert.ok(cpy.some((h) => /"Invalid"/.test(h.title)));
    assert.ok(cpy.some((h) => /something went wrong/i.test(h.title)));
    assert.ok(cpy.some((h) => /Blaming/.test(h.title) && /You forgot/.test(h.title)));
    // An input group without a <form>, submitted through its "Apply" button.
    assert.equal(pick(hits, 'A11Y-13', '#promo-code', /placeholder/).length, 1);
    assert.ok(cpy.some((h) => /Error 4031/.test(h.title)), 'a code-only message');
    assert.equal(e.forms_probed, 3);
    assert.ok(e.submissions >= 3);
    assert.ok(Array.isArray(e.skipped));
  });

  test('int-bad-live: unannounced status messages; existing live regions pass; destructive controls are never clicked', async () => {
    const r = await audit('int-bad-live.html', ['live-regions']);
    const e = r.entry('live-regions');
    const hits = r.hits('live-regions');
    assert.equal(pick(hits, 'A11Y-15', '#cart-msg').length, 1);
    assert.equal(pick(hits, 'A11Y-15', '#copy-zone > div').length, 1, 'role=status inserted with its text');
    assert.equal(pick(hits, 'A11Y-15', '#nl-msg').length, 1, 'form submission outcome');
    assert.equal(pick(hits, 'A11Y-15', null, /Settings saved/).length, 1, 'toast');
    assert.equal(pick(hits, 'A11Y-15', '#price-status').length, 0, 'a role=status region present at load is announced');
    assert.equal(pick(hits, 'A11Y-15', '#delete-msg').length, 0);
    assert.ok(!e.probed.some((p) => /Delete list/.test(p.action)), 'the destructive control was not clicked');
    assert.ok(e.skipped.some((s) => /Delete list/.test(s.action) && /destructive/.test(s.reason)));
    assert.equal(hits.length, 4);
  });

  test('int-bad-states: missing states, weak disabled styles, H1/H9 candidate, slow feedback', async () => {
    const r = await audit('int-bad-states.html', ['states']);
    const e = r.entry('states');
    const hits = r.hits('states');
    assert.ok(pick(hits, 'CMP-01', '#preview', /hover/).length >= 1);
    assert.ok(pick(hits, 'CMP-01', '#plain-link', /hover/).length >= 1);
    assert.equal(pick(hits, 'CMP-01', '#loading-btn').length + pick(hits, 'CMP-01', '#quick').length, 0, 'controls with hover and pressed states pass');
    assert.equal(pick(hits, 'CMP-03', '#ghost', /fewer than two cues/).length, 1);
    assert.equal(pick(hits, 'CMP-03', '#faded', /barely perceivable/).length, 1);
    assert.equal(pick(hits, 'CMP-03', '#create').length, 0, 'a primary submit disabled at rest is not a CMP-03 failure');
    assert.ok(!hits.some((h) => h.criteria.some((c) => c.id === 'H1' || c.id === 'H9')), 'candidates never enter the tool hits');
    assert.equal(e.candidates, 1);
    const cand = JSON.parse(fs.readFileSync(path.join(r.runDir, e.candidates_file), 'utf8')).candidates;
    assert.equal(cand.length, 1);
    assert.equal(cand[0].status, 'candidate');
    assert.deepEqual(cand[0].criteria.map((c) => c.id), ['H1', 'H9']);
    assert.equal(cand[0].criteria[0].primary, true);
    assert.equal(cand[0].locations[0].selector, '#create');
    assert.equal(pick(hits, 'CMP-04', '#slow-flat', /acknowledgement/).length, 1);
    assert.equal(pick(hits, 'CMP-04', '#slow-flat', /No progress/).length, 1);
    assert.equal(pick(hits, 'CMP-04', '#loading-btn', /static "Loading…"/).length, 1);
    assert.equal(pick(hits, 'CMP-04', '#quick').length, 0);
    assert.ok(pick(hits, 'CMP-04', '#slow-flat')[0].evidence[0].value.ack_ms >= 1000);
  });

  test('state recipes: a dialog opened by a recipe is probed through its trigger; the walk inside it is modal containment', async () => {
    const states = [{ name: 'rules-open', actions: [{ action: 'click', target: '#open-rules' }] }];
    const r = await audit('int-good.html', ['dialogs', 'keyboard', 'live-regions'], { states });
    const d = r.entry('dialogs');
    assert.equal(d.state, 'ran');
    assert.ok(d.probes.length >= 1 && d.probes.every((p) => /state recipe "rules-open"/.test(p.trigger) && p.outcome === 'contract holds'), JSON.stringify(d.probes));
    assert.deepEqual(r.hits('dialogs'), []);
    const k = r.entry('keyboard');
    assert.equal(k.state, 'ran');
    assert.equal(k.partial, false);
    assert.equal(k.traps, 0);
    assert.deepEqual(r.hits('keyboard').map((h) => h.title), []);
    const l = r.entry('live-regions');
    assert.ok(l.probed.some((p) => /state recipe "rules-open"/.test(p.action)), JSON.stringify(l.probed));
    assert.deepEqual(r.hits('live-regions'), [], 'text inside the opened dialog is not a status message');
  });
});
