// live-regions — A11Y-15 (WCAG 4.1.3): status messages that appear after scripted async actions must be exposed
// through role=status, role=alert, a live region or <output> without moving focus. Exercised actions: buttons that
// start work (not links, toggles, popup or dialog openers, and never destructive-looking controls), form
// submissions with plausible values (local hosts only), and the configured state recipes. Each action runs on a
// freshly reloaded page with the probe armed before it: a MutationObserver timeline, the visible-text baseline and
// the live regions present before the action. A new short text is a status message when it uses status wording,
// sits in a toast-like layer, or lands in a live region; it passes when that region existed (and was rendered)
// before the change, or is a role=alert inserted with it; text that received focus, opened in a dialog or menu, or
// sits inside the activated control is not a status message for 4.1.3.
import { toLocator } from '../locators.mjs';
import { runActions } from '../actions.mjs';
import { ensureProbeLib, reloadState, waitSettled, clickId, isDestructive, isLocalPage, formFields, plausibleValue, fillFields, trackRequests, pageGuard } from '../interact.mjs';

export const mode = 'standalone';
export const openOptions = { bare: true };
export const criteria = ['A11Y-15'];
export const summary = 'status messages after scripted async actions (buttons, form submissions, state recipes)';

const MAX_BUTTONS = 8;
const MAX_FORMS = 4;

function discover() {
  const U = window.__uie;
  U.reset();
  const buttons = [];
  for (const el of document.querySelectorAll('button,[role=button],input[type=button],input[type=submit],input[type=image]')) {
    if (buttons.length >= 80) break;
    if (!U.isVisible(el) || U.isDisabled(el) || U.isInert(el) || el.closest('[aria-hidden="true"]')) continue;
    const role = (el.getAttribute('role') || '').trim();
    const type = (el.getAttribute('type') || (el.tagName === 'BUTTON' ? 'submit' : '')).toLowerCase();
    const form = el.form || el.closest('form');
    const isSubmit = !!form && ((el.tagName === 'BUTTON' && type === 'submit') || (el.tagName === 'INPUT' && ['submit', 'image'].includes(type)));
    let skip = null;
    if (el.hasAttribute('aria-haspopup') && el.getAttribute('aria-haspopup') !== 'false') skip = 'opens a popup or dialog';
    else if (el.hasAttribute('aria-expanded')) skip = 'disclosure toggle';
    else if (el.hasAttribute('aria-controls')) skip = 'controls another region';
    else if (el.hasAttribute('commandfor') || el.hasAttribute('popovertarget')) skip = 'opens a popover or dialog';
    else if (['tab', 'switch', 'checkbox', 'radio', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option'].includes(role)) skip = `role=${role}`;
    else if (type === 'reset') skip = 'reset button';
    else if (el.closest('a[href]')) skip = 'inside a link';
    buttons.push({ id: U.id(el), selector: U.selector(el), name: U.accName(el).slice(0, 80), text: U.collapse(el.innerText || el.value || '').slice(0, 80), isSubmit, form: form ? U.id(form) : null, skip });
  }
  const forms = [];
  for (const f of document.querySelectorAll('form')) {
    if (!U.isVisible(f)) continue;
    const submit = [...f.querySelectorAll('button:not([type]),button[type=submit],input[type=submit],input[type=image]')].find((b) => U.isVisible(b) && !U.isDisabled(b));
    const fields = [...f.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]),select,textarea')].filter((x) => U.isVisible(x));
    if (!submit || !fields.length) continue;
    const card = fields.some((x) => /^cc-/.test(x.getAttribute('autocomplete') || '') || /card.?number|cvc|cvv|iban/i.test(`${x.name} ${x.id}`));
    forms.push({ id: U.id(f), selector: U.selector(f), submit: U.id(submit), submitSelector: U.selector(submit), submitName: U.accName(submit).slice(0, 80), name: U.accName(f).slice(0, 80) || f.id || '', card });
  }
  return { buttons, forms };
}

function resolve({ selector, name }) {
  const U = window.__uie;
  let els = [];
  try {
    els = [...document.querySelectorAll(selector)];
  } catch {
    return null;
  }
  if (els.length > 1 && name) els = els.filter((e) => U.accName(e).slice(0, 80) === name);
  return els.length ? U.id(els[0]) : null;
}

export async function run(ctx) {
  const st = { probed: [], skipped: [], exercised: 0 };
  const guard = pageGuard(ctx);
  for (const spec of ctx.states({ widths: 'first', themes: 'first' })) {
    const isDefault = !((spec.stateCfg && spec.stateCfg.actions) || []).length;
    await guard(spec, () => (isDefault ? probeDefault(ctx, spec, st) : probeRecipe(ctx, spec, st.probed, st.skipped)));
  }
  guard.finish();
  const { probed, skipped, exercised } = st;
  const rel = ctx.writeEvidence('live-regions/actions.json', { probed, skipped });
  ctx.note('a status message = new short text with status wording, in a toast-like layer, or in a live region; it passes in a live region present before the change or in an inserted role=alert; text that took focus, opened in a dialog or menu, or changed inside the activated control is not counted');
  ctx.note(`exercised: buttons that start work (≤ ${MAX_BUTTONS} per page state), form submissions with plausible values on local hosts (≤ ${MAX_FORMS}), state recipes; never links, toggles, popup openers or destructive-looking controls`);
  if (!probed.length) ctx.note('no action could be exercised: A11Y-15 has no exercised actions in this scope');
  ctx.record({ actions_probed: probed.length, actions_exercised: exercised, actions_skipped: skipped.length, actions_file: rel, probed: probed.slice(0, 30), skipped: skipped.slice(0, 30) });
  return [];
}

/** The default page state: discover safe buttons and forms, then probe each on a freshly reloaded page. */
async function probeDefault(ctx, spec, st) {
  const { probed, skipped } = st;
  const pg = await ctx.openPage(spec, openOptions);
  try {
    if (!pg.ok) return;
    const { page, ps } = pg;
    trackRequests(page);
    await ensureProbeLib(page);
    const local = isLocalPage(page);
    const found = await page.evaluate(discover);
    const actions = [];
    for (const b of found.buttons) {
      const label = b.name || b.text || b.selector;
      if (isDestructive(b.name, b.text)) skipped.push({ route: ps.route, state: ps.state, action: `click "${label}"`, reason: 'destructive-looking control' });
      else if (b.skip) skipped.push({ route: ps.route, state: ps.state, action: `click "${label}"`, reason: b.skip });
      else if (b.isSubmit) continue; // submitted with its form
      else if (actions.filter((a) => a.kind === 'button').length >= MAX_BUTTONS) skipped.push({ route: ps.route, state: ps.state, action: `click "${label}"`, reason: `cap of ${MAX_BUTTONS} buttons per page state` });
      else actions.push({ kind: 'button', label, selector: b.selector, name: b.name });
    }
    for (const f of found.forms) {
      const label = `submit ${f.name ? `"${f.name}"` : f.selector} with "${f.submitName || 'submit'}"`;
      if (!local) skipped.push({ route: ps.route, state: ps.state, action: label, reason: 'non-local host: forms are never submitted (ARCHITECTURE §13)' });
      else if (isDestructive(f.submitName)) skipped.push({ route: ps.route, state: ps.state, action: label, reason: 'destructive-looking submit' });
      else if (actions.filter((a) => a.kind === 'form').length >= MAX_FORMS) skipped.push({ route: ps.route, state: ps.state, action: label, reason: `cap of ${MAX_FORMS} forms per page state` });
      else actions.push({ kind: 'form', label, selector: f.submitSelector, name: f.submitName, formSelector: f.selector });
    }
    for (let i = 0; i < actions.length; i += 1) {
      const a = actions[i];
      if (i > 0) {
        const re = await reloadState(ctx, pg);
        if (!re.ok) {
          ctx.error(`${ps.key}: ${re.error}`);
          skipped.push({ route: ps.route, state: ps.state, action: a.label, reason: re.error });
          continue;
        }
      }
      const outcome = await probeAction(ctx, pg, a);
      probed.push({ route: ps.route, state: ps.state, action: a.label, outcome: outcome.summary });
      if (outcome.exercised) st.exercised += 1;
    }
  } finally {
    await pg.close();
  }
}

async function probeAction(ctx, pg, a) {
  const { page, ps } = pg;
  const id = await page.evaluate(resolve, { selector: a.selector, name: a.name }).catch(() => null);
  if (id === null) return { summary: 'control not found after reload', exercised: false };
  if (a.kind === 'form') {
    const formId = await page.evaluate(resolve, { selector: a.formSelector, name: '' }).catch(() => null);
    if (formId !== null) {
      const fields = (await page.evaluate(formFields, formId).catch(() => null)) || [];
      await fillFields(page, fields, plausibleValue);
    }
  }
  await page.evaluate((t) => window.__uieProbe.arm({ triggerId: t }), id);
  const click = await clickId(page, id);
  if (!click.ok) {
    await page.evaluate(() => window.__uieProbe && window.__uieProbe.disarm()).catch(() => {});
    return { summary: `could not activate: ${click.error}`, exercised: false };
  }
  await waitSettled(page, { maxMs: 4000, quietMs: 300 });
  const res = await page.evaluate(() => {
    const r = window.__uieProbe.result();
    window.__uieProbe.disarm();
    return r;
  }).catch(() => null);
  // A navigation is a change of context: the action was exercised, and WCAG 4.1.3 has no status message to ask for.
  if (!res) return { summary: 'the page navigated away (change of context, not a status message)', exercised: true };
  if (res.urlChanged) return { summary: 'navigated (change of context, not a status message)', exercised: true };
  const found = judge(ctx, ps, res, a);
  return { summary: found.length ? `${found.length} unannounced status message(s)` : `${res.changed.length} text change(s); no unannounced status message`, exercised: true };
}

/** Decide which new texts are status messages and whether each is announced; add hits. Returns the hits. */
function judge(ctx, ps, res, a) {
  // When the action's outcome reached assistive technology (a live region present before the action changed, an
  // alert was inserted, or focus moved to the new message), the other new texts are its details, not missed status
  // messages: e.g. a "0 results" role=status count beside an empty-state panel, or a focused error summary beside
  // inline errors that the fields reference.
  if (res.changed.some((c) => c.liveVia === 'existing' || c.liveVia === 'inserted-alert' || (c.inFocus && !c.inTrigger))) return [];
  const cands = res.changed.filter((c) => !c.inTrigger && !c.inFocus && !c.inPopup && c.text.length <= 200);
  // Content updates (many texts in one block, or long text) are not status messages unless a live region holds them.
  const perBlock = new Map();
  for (const c of cands) {
    const b = perBlock.get(c.block) || { n: 0, chars: 0 };
    b.n += 1;
    b.chars += c.text.length;
    perBlock.set(c.block, b);
  }
  const hits = [];
  for (const c of cands) {
    const blk = perBlock.get(c.block);
    const content = blk.n > 3 || blk.chars > 240;
    const statusLike = !!(c.liveVia || c.status || c.toast || c.classHint);
    if (!statusLike || (content && !c.liveVia)) continue;
    if (c.liveVia === 'existing' || c.liveVia === 'inserted-alert') continue;
    let why;
    if (c.ariaHidden) why = 'it is inside aria-hidden content, so assistive technology never receives it';
    else if (c.liveVia === 'inserted') why = `its live region (${c.liveSel}) was inserted together with the text; screen readers only announce changes to regions that already exist`;
    else why = 'it is not inside role=status, role=alert, an aria-live region or <output>';
    const hit = ctx.hit({
      rule: 'A11Y-15',
      title: `Status message not announced: "${c.text.slice(0, 50)}"`,
      description: `After ${a.label}, the message "${c.text.slice(0, 120)}" appeared without moving focus, but ${why}. Screen readers do not announce the outcome.`,
      location: ctx.loc(ps, { selector: c.selector, bbox: c.bbox, snippet: c.snippet, source: c.source }),
      evidence: [{ type: 'probe', value: { action: a.label, live: c.liveVia || 'none', appeared_ms: res.lastVisible }, detail: `${a.label} → "${c.text.slice(0, 80)}" (${c.liveVia ? `live region ${c.liveVia}` : 'no live region'})` }],
      recommendation: 'Render one persistent, initially empty role="status" region (role="alert" for errors) with the page, and write the message text into it.',
    });
    hits.push(hit);
    ctx.add(hit);
  }
  return hits;
}

/** A configured state recipe as the action: page at rest, probe armed, recipe actions run, then judged. */
async function probeRecipe(ctx, spec, probed, skipped) {
  const actions = spec.stateCfg.actions || [];
  if (actions.some((x) => x.action === 'goto')) {
    skipped.push({ route: spec.route, state: spec.state, action: `state recipe "${spec.state}"`, reason: 'recipe navigates (goto)' });
    return;
  }
  const pg = await ctx.openPage(spec, { ...openOptions, recipe: false });
  try {
    if (!pg.ok) return;
    const { page, ps } = pg;
    trackRequests(page);
    await ensureProbeLib(page);
    const last = [...actions].reverse().find((x) => x.target && ['click', 'dblclick', 'press', 'check', 'select'].includes(x.action));
    let triggerId = null;
    if (last) {
      triggerId = await toLocator(page, last.target).first().evaluate((el) => window.__uie.id(el)).catch(() => null);
      const desc = await toLocator(page, last.target).first().evaluate((el) => `${el.getAttribute('aria-label') || ''} ${el.innerText || el.value || ''}`).catch(() => '');
      if (isDestructive(desc)) {
        skipped.push({ route: ps.route, state: ps.state, action: `state recipe "${ps.state}"`, reason: 'destructive-looking control in the recipe' });
        return;
      }
    }
    await page.evaluate((t) => {
      window.__uieProbe.arm({ triggerId: t });
      window.__uieProbe.mark();
    }, triggerId);
    const rr = await runActions(page, actions, { baseUrl: ctx.session.baseUrl, allowRemote: ctx.session.allowRemote, timeout: 8000 });
    if (!rr.ok) {
      skipped.push({ route: ps.route, state: ps.state, action: `state recipe "${ps.state}"`, reason: rr.error });
      return;
    }
    await waitSettled(page, { maxMs: 4000, quietMs: 300 });
    const res = await page.evaluate(() => {
      const r = window.__uieProbe.result();
      window.__uieProbe.disarm();
      return r;
    }).catch(() => null);
    if (!res || res.urlChanged) {
      probed.push({ route: ps.route, state: ps.state, action: `state recipe "${ps.state}"`, outcome: 'navigated' });
      return;
    }
    const a = { label: `the "${ps.state}" state recipe` };
    const found = judge(ctx, ps, res, a);
    probed.push({ route: ps.route, state: ps.state, action: `state recipe "${ps.state}"`, outcome: found.length ? `${found.length} unannounced status message(s)` : 'no unannounced status message' });
  } finally {
    await pg.close();
  }
}
