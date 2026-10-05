// dialogs — A11Y-06 (2.1.2, 2.4.3, 4.1.2), the modal dialog contract (APG dialog-modal pattern; TOOL-08), one hit per
// broken clause. Dialogs are reached through their triggers (aria-haspopup="dialog", aria-controls / commandfor /
// data-target / href pointing at a dialog, onclick naming one), through state recipes that leave a dialog open, and
// as dialogs already open in a page state. Each trigger is activated with the keyboard (focus + Enter; a click is
// only the fallback, and a trigger that needs one is itself a finding) on a freshly reloaded page. Clauses:
//   opens with the keyboard (2.1.1) · exposed as a dialog (4.1.2) · modal semantics: aria-modal="true" or native
//   showModal() (4.1.2) · accessible name (4.1.2) · focus moves in (2.4.3) · Tab and Shift+Tab stay inside — leaving
//   for the browser UI is allowed, reaching page content is not (2.4.3) · Escape closes (2.1.2) · focus returns to the
//   trigger, or to a logical place when the trigger is gone (2.4.3) · the background is inert or aria-hidden (4.1.2).
// A dialog that is neither visually nor semantically modal (no backdrop, no aria-modal) is non-modal: the contract
// does not apply and it is only noted.
import { toLocator } from '../locators.mjs';
import { runActions } from '../actions.mjs';
import { ensureProbeLib, reloadState, clickId, handleFor, isDestructive, pageGuard } from '../interact.mjs';

export const mode = 'standalone';
export const openOptions = { bare: true };
export const criteria = ['A11Y-06'];
export const summary = 'modal dialog contract probe: focus in, Tab containment, Escape, focus return, name, modal semantics, inert background';

const MAX_TRIGGERS = 8;

function inventory() {
  const U = window.__uie;
  U.reset();
  const dialogs = [...document.querySelectorAll('dialog,[role=dialog],[role=alertdialog]')];
  const isDialog = (el) => !!el && (el.tagName === 'DIALOG' || ['dialog', 'alertdialog'].includes((el.getAttribute('role') || '').trim()));
  const byIdRef = (ref) => {
    const id = String(ref || '').trim().replace(/^#/, '');
    if (!id) return null;
    const el = document.getElementById(id);
    if (isDialog(el)) return el;
    const inner = el && el.querySelector ? el.querySelector('dialog,[role=dialog],[role=alertdialog]') : null;
    return inner || null;
  };
  const triggers = [];
  for (const el of document.querySelectorAll('button,a[href],[role=button],input[type=button],summary,[aria-haspopup],[commandfor],[data-target],[data-bs-target],[onclick]')) {
    if (triggers.length >= 60) break;
    if (!U.isVisible(el) || U.isDisabled(el) || U.isInert(el)) continue;
    if (dialogs.some((d) => d.contains(el) && U.isVisible(d))) continue;
    let target = null;
    let how = null;
    const hp = (el.getAttribute('aria-haspopup') || '').trim();
    if (hp === 'dialog') how = 'aria-haspopup="dialog"';
    for (const ref of (el.getAttribute('aria-controls') || '').split(/\s+/)) {
      const d = byIdRef(ref);
      if (d) {
        target = d;
        how = how || 'aria-controls';
      }
    }
    const cf = byIdRef(el.getAttribute('commandfor'));
    if (cf && /show-modal|toggle|show/i.test(el.getAttribute('command') || 'show-modal')) {
      target = cf;
      how = how || 'commandfor';
    }
    for (const attr of ['data-target', 'data-bs-target']) {
      const d = byIdRef(el.getAttribute(attr));
      if (d) {
        target = d;
        how = how || attr;
      }
    }
    if (el.tagName === 'A' && (el.getAttribute('href') || '').startsWith('#')) {
      const d = byIdRef(el.getAttribute('href'));
      if (d) {
        target = d;
        how = how || 'href';
      }
    }
    const oc = el.getAttribute('onclick') || '';
    if (!how && oc) {
      const d = dialogs.find((x) => x.id && oc.includes(x.id));
      if (d || /showModal\s*\(/.test(oc)) {
        target = d || null;
        how = 'onclick';
      }
    }
    if (!how) continue;
    triggers.push({ id: U.id(el), selector: U.selector(el), name: U.accName(el).slice(0, 80), text: U.collapse(el.innerText || '').slice(0, 60), how, target: target ? U.selector(target) : null });
  }
  const open = dialogs.filter((d) => U.isVisible(d)).map((d) => U.selector(d));
  const all = dialogs.map((d) => ({ selector: U.selector(d), name: U.accName(d).slice(0, 80), visible: U.isVisible(d) }));
  return { triggers, open, all };
}

/** Visible dialogs now, and the modal-looking overlays (fixed, covering ≥ 40% of the viewport) without a dialog role. */
function visibleDialogs() {
  const U = window.__uie;
  U.reset();
  const dlg = [...document.querySelectorAll('dialog,[role=dialog],[role=alertdialog]')].filter((d) => U.isVisible(d)).map((d) => U.id(d));
  const overlays = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (overlays.length >= 5) break;
    const s = getComputedStyle(el);
    if (s.position !== 'fixed' || !U.isVisible(el)) continue;
    const r = el.getBoundingClientRect();
    if ((r.width * r.height) / (innerWidth * innerHeight) < 0.4) continue;
    if (el.closest('dialog,[role=dialog],[role=alertdialog]')) continue;
    if (!U.collapse(el.innerText || '') && !el.querySelector('button,a[href],input,select,textarea')) continue;
    overlays.push(U.id(el));
  }
  return { dlg, overlays };
}

/** The state of one dialog: visibility, semantics, focus relation, background inertness. */
function dialogState(id) {
  const U = window.__uie;
  U.reset();
  const d = U.el(id);
  if (!d || !d.isConnected) return { gone: true, visible: false };
  let active = document.activeElement;
  for (let i = 0; active && active.shadowRoot && active.shadowRoot.activeElement && i < 20; i += 1) active = active.shadowRoot.activeElement;
  let modal = false;
  try {
    modal = d.matches(':modal');
  } catch {
    modal = false;
  }
  const tabbables = [...d.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]')].filter((e) => U.tabbable(e) && U.isVisible(e));
  // Background: everything outside the dialog's ancestor chain must be inert or aria-hidden (or the dialog :modal).
  const offenders = [];
  if (!modal) {
    for (let a = d; a && a !== document.body && a.parentElement; a = a.parentElement) {
      for (const sib of a.parentElement.children) {
        if (sib === a || ['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'LINK', 'META'].includes(sib.tagName)) continue;
        if (sib.inert || sib.closest('[inert]') || sib.getAttribute('aria-hidden') === 'true') continue;
        const perceivable = U.isVisible(sib) && (U.collapse(sib.innerText || '').length > 0 || sib.querySelector('a[href],button,input,select,textarea,img,svg,[tabindex]'));
        if (!perceivable) continue;
        offenders.push(U.selector(sib));
      }
    }
  }
  // Visually modal: points outside the dialog box land on a layer that is not page content (a backdrop).
  const r = d.getBoundingClientRect();
  let backdrop = modal;
  if (!modal) {
    const pts = [[4, 4], [innerWidth - 5, 4], [4, innerHeight - 5], [innerWidth - 5, innerHeight - 5]].filter(([x, y]) => x < r.left || x > r.right || y < r.top || y > r.bottom);
    let covered = 0;
    for (const [x, y] of pts) {
      const t = document.elementFromPoint(x, y);
      if (!t) continue;
      for (let a = t; a && a !== document.documentElement; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (s.position === 'fixed') {
          const ar = a.getBoundingClientRect();
          if (ar.width >= innerWidth * 0.9 && ar.height >= innerHeight * 0.9) {
            covered += 1;
            break;
          }
        }
      }
    }
    backdrop = pts.length > 0 && covered === pts.length;
  }
  return {
    gone: false,
    visible: U.isVisible(d),
    open: d.tagName === 'DIALOG' ? d.open : null,
    native: d.tagName === 'DIALOG',
    modal,
    ariaModal: d.getAttribute('aria-modal') === 'true',
    role: d.tagName === 'DIALOG' ? 'dialog' : (d.getAttribute('role') || '').trim(),
    name: U.accName(d).slice(0, 80),
    selector: U.selector(d),
    snippet: U.snippet(d),
    source: U.sourceOf(d),
    bbox: U.docRect(d),
    tabbables: tabbables.length,
    firstTabbable: tabbables.length ? U.id(tabbables[0]) : null,
    focusInside: !!active && (active === d || d.contains(active)),
    focusOnBody: !active || active === document.body || active === document.documentElement,
    focus: active && active !== document.body ? { id: U.id(active), selector: U.selector(active) } : null,
    backdrop,
    background: { ok: modal || offenders.length === 0, offenders: offenders.slice(0, 3) },
    closeButton: (() => {
      const b = [...d.querySelectorAll('button,[role=button],input[type=button]')].find((x) => U.isVisible(x) && /^(close|cancel|dismiss|×|✕|✖|x|关闭|取消)$/i.test(U.accName(x).trim()));
      return b ? U.id(b) : null;
    })(),
  };
}

function activeInfo() {
  let a = document.activeElement;
  for (let i = 0; a && a.shadowRoot && a.shadowRoot.activeElement && i < 20; i += 1) a = a.shadowRoot.activeElement;
  if (!a || a === document.body || a === document.documentElement) return null;
  return { id: window.__uie.id(a), selector: window.__uie.selector(a), connected: a.isConnected };
}

async function poll(fn, ms = 1200, step = 60) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() >= end) return null;
    await new Promise((r) => setTimeout(r, step));
  }
}

export async function run(ctx) {
  const stats = { dialogs_probed: 0, triggers: 0, untested: [], probes: [] };
  const guard = pageGuard(ctx);
  for (const spec of ctx.states({ widths: 'g2', themes: 'first' })) await guard(spec, () => probeSpec(ctx, spec, stats));
  guard.finish();
  const untested = dedupe(stats.untested, (u) => `${u.route}|${u.state}|${u.dialog}`);
  if (untested.length) ctx.partial(`${untested.length} dialog(s) could not be opened and were not probed; add state recipes that open them`);
  ctx.note('triggers are activated by focus + Enter; Tab leaving to the browser UI (no focused element) is allowed, reaching page content behind the dialog is not');
  ctx.note('a dialog without aria-modal and without a backdrop is treated as non-modal: the modal contract is not applied to it');
  const rel = ctx.writeEvidence('dialogs/probes.json', { probes: stats.probes, untested });
  ctx.record({ dialogs_probed: stats.dialogs_probed, triggers_activated: stats.triggers, untested: untested.slice(0, 20), probes: stats.probes.slice(0, 20), probes_file: rel });
  return [];
}

/** One page state: dialogs already open (at load or by the recipe), then the triggers found at rest. */
async function probeSpec(ctx, spec, stats) {
  const recipe = (spec.stateCfg && spec.stateCfg.actions) || [];
  const pg = await ctx.openPage(spec, openOptions);
  try {
    if (!pg.ok) return;
    const { page, ps } = pg;
    await ensureProbeLib(page);
    const inv = await page.evaluate(inventory);
    const probed = new Set();
    for (const sel of inv.open) {
      const last = [...recipe].reverse().find((a) => a.target && ['click', 'press', 'dblclick'].includes(a.action));
      if (recipe.length && last) await probeRecipeDialog(ctx, pg, sel, recipe, last, stats);
      else await probeOpenDialog(ctx, pg, sel, stats);
      probed.add(sel);
    }
    if (recipe.length) return; // recipe states start from an open dialog or another view
    let n = 0;
    for (const t of inv.triggers) {
      if (t.target && probed.has(t.target)) continue;
      if (n >= MAX_TRIGGERS) {
        stats.untested.push({ route: ps.route, state: ps.state, dialog: t.target || '?', reason: `cap of ${MAX_TRIGGERS} triggers per page state` });
        continue;
      }
      if (isDestructive(t.name, t.text) && t.how === 'onclick') {
        stats.untested.push({ route: ps.route, state: ps.state, dialog: t.target || '?', reason: `destructive-looking trigger ${t.selector}` });
        continue;
      }
      n += 1;
      const re = await reloadState(ctx, pg);
      if (!re.ok) {
        ctx.error(`${ps.key}: ${re.error}`);
        continue;
      }
      const sel = await probeTrigger(ctx, pg, t, stats);
      if (sel) probed.add(sel);
      if (t.target) probed.add(t.target);
    }
    for (const d of inv.all) {
      if (!probed.has(d.selector) && !d.visible) stats.untested.push({ route: ps.route, state: ps.state, dialog: d.selector, reason: 'no trigger found in the page (add a state recipe that opens it)' });
    }
  } finally {
    await pg.close();
  }
}

function dedupe(arr, key) {
  const seen = new Set();
  return arr.filter((x) => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function clauseHit(ctx, ps, d, clause, wcag, description, evidence, recommendation) {
  ctx.add(ctx.hit({
    rule: 'A11Y-06',
    wcag,
    title: `Modal dialog: ${clause}: ${d.name ? `"${d.name.slice(0, 40)}"` : d.selector.slice(0, 50)}`,
    description,
    location: ctx.loc(ps, { selector: d.selector, bbox: d.bbox, snippet: d.snippet, source: d.source }),
    evidence: [{ type: 'probe', value: { clause, ...evidence.value }, detail: evidence.detail }],
    recommendation,
  }));
}

/** Open through a trigger with the keyboard and run the contract. Returns the dialog selector, or null. */
async function probeTrigger(ctx, pg, t, stats) {
  const { page, ps } = pg;
  const id = await page.evaluate(({ selector, name }) => {
    const U = window.__uie;
    let els = [];
    try {
      els = [...document.querySelectorAll(selector)];
    } catch {
      return null;
    }
    if (els.length > 1 && name) els = els.filter((e) => U.accName(e).slice(0, 80) === name);
    return els.length ? U.id(els[0]) : null;
  }, t);
  if (id === null) return null;
  return openAndProbe(ctx, pg, id, `${t.selector}${t.name ? ` ("${t.name}")` : ''}`, t.how, stats);
}

async function openAndProbe(ctx, pg, triggerId, triggerDesc, how, stats) {
  const { page, ps } = pg;
  const before = await page.evaluate(visibleDialogs);
  const h = await handleFor(page, triggerId);
  if (!h) return null;
  let opened = null;
  let method = 'keyboard';
  try {
    await h.focus();
    await page.keyboard.press('Enter');
  } catch {
    /* fall through to the click */
  } finally {
    await h.dispose().catch(() => {});
  }
  const findNew = async () => {
    const now = await page.evaluate(visibleDialogs).catch(() => null);
    if (!now) return null;
    const d = now.dlg.find((x) => !before.dlg.includes(x));
    if (d !== undefined) return { dialog: d };
    const o = now.overlays.find((x) => !before.overlays.includes(x));
    return o !== undefined ? { overlay: o } : null;
  };
  opened = await poll(findNew, 900);
  if (!opened) {
    const c = await clickId(page, triggerId);
    if (c.ok) {
      method = 'click';
      opened = await poll(findNew, 900);
    }
  }
  stats.triggers += 1;
  if (!opened) {
    stats.probes.push({ route: ps.route, state: ps.state, width: ps.width, trigger: triggerDesc, outcome: 'no dialog opened' });
    return null;
  }
  if (opened.overlay !== undefined) {
    if (/haspopup/.test(how)) {
      const o = await page.evaluate((i) => {
        const U = window.__uie;
        const el = U.el(i);
        return { selector: U.selector(el), snippet: U.snippet(el), source: U.sourceOf(el), bbox: U.docRect(el), name: '' };
      }, opened.overlay);
      clauseHit(ctx, ps, o, 'not exposed as a dialog', ['4.1.2'], `Activating ${triggerDesc} (aria-haspopup="dialog") opens a modal-looking overlay that has no role="dialog" and is not a <dialog>, so assistive technology does not announce a dialog.`, { value: { trigger: triggerDesc }, detail: 'overlay without dialog role' }, 'Use a native <dialog> opened with showModal(), or role="dialog" with aria-modal="true" and a name.');
      stats.probes.push({ route: ps.route, state: ps.state, width: ps.width, trigger: triggerDesc, outcome: 'overlay without dialog role' });
    }
    return null;
  }
  // Let an opening transition finish.
  await page.waitForTimeout(150);
  const d0 = await page.evaluate(dialogState, opened.dialog);
  if (method === 'click') {
    clauseHit(ctx, ps, d0, 'does not open with the keyboard', ['2.1.1'], `Pressing Enter on ${triggerDesc} does not open the dialog; only a mouse click does, so keyboard users cannot reach it.`, { value: { trigger: triggerDesc, method: 'click' }, detail: 'Enter on the focused trigger opened nothing; a click did' }, 'Use a <button> as the trigger (or handle Enter and Space on the custom control).');
  }
  const sel = await contract(ctx, pg, opened.dialog, d0, { triggerId, triggerDesc }, stats);
  return sel;
}

/** A dialog already open in the page state (no trigger known). */
async function probeOpenDialog(ctx, pg, selector, stats) {
  const { page } = pg;
  const id = await page.evaluate((s) => {
    try {
      const el = document.querySelector(s);
      return el ? window.__uie.id(el) : null;
    } catch {
      return null;
    }
  }, selector);
  if (id === null) return;
  const d0 = await page.evaluate(dialogState, id);
  await contract(ctx, pg, id, d0, null, stats);
}

/** A dialog opened by the state recipe: replay the recipe up to the opening step, then open it with the keyboard. */
async function probeRecipeDialog(ctx, pg, selector, recipe, last, stats) {
  const { page, ps } = pg;
  const re = await reloadState(ctx, pg, { recipe: false });
  if (!re.ok) {
    ctx.error(`${ps.key}: ${re.error}`);
    return;
  }
  const idx = recipe.lastIndexOf(last);
  const pre = recipe.slice(0, idx);
  if (pre.length) {
    const r = await runActions(page, pre, { baseUrl: ctx.session.baseUrl, allowRemote: ctx.session.allowRemote, timeout: 8000 });
    if (!r.ok) {
      ctx.error(`${ps.key}: recipe replay failed: ${r.error}`);
      return;
    }
  }
  await ensureProbeLib(page);
  const triggerId = await toLocator(page, last.target).first().evaluate((el) => window.__uie.id(el)).catch(() => null);
  if (triggerId === null) {
    // Fall back: run the whole recipe and probe the open dialog without the trigger clauses.
    await reloadState(ctx, pg);
    await probeOpenDialog(ctx, pg, selector, stats);
    return;
  }
  await openAndProbe(ctx, pg, triggerId, `${last.target} (state recipe "${ps.state}")`, 'recipe', stats);
}

/** Run the contract clauses on an open dialog. `trigger` is null when the invoker is unknown. */
async function contract(ctx, pg, dialogId, d0, trigger, stats) {
  const { page, ps } = pg;
  stats.dialogs_probed += 1;
  const outcome = { route: ps.route, state: ps.state, width: ps.width, dialog: d0.selector, trigger: trigger ? trigger.triggerDesc : null, broken: [] };
  const broken = (c) => outcome.broken.push(c);
  if (!d0.modal && !d0.ariaModal && !d0.backdrop) {
    outcome.outcome = 'non-modal dialog: contract not applied';
    stats.probes.push(outcome);
    ctx.note(`non-modal dialog ${d0.selector} on ${ps.route}: the modal contract was not applied`);
    return d0.selector;
  }
  if (!d0.modal && !d0.ariaModal) {
    broken('modal semantics');
    clauseHit(ctx, ps, d0, 'not exposed as modal', ['4.1.2'], `${d0.selector} covers the page like a modal (a full-viewport backdrop) but is neither opened with showModal() nor marked aria-modal="true", so assistive technology treats the page behind it as available.`, { value: { aria_modal: false, native_modal: false }, detail: 'backdrop present; no aria-modal, not :modal' }, 'Open a native <dialog> with showModal(), or add aria-modal="true" to the role="dialog" element.');
  }
  if (!d0.name) {
    broken('accessible name');
    clauseHit(ctx, ps, d0, 'no accessible name', ['4.1.2'], `The dialog ${d0.selector} has no accessible name (no aria-labelledby, aria-label or title), so screen readers announce only "dialog".`, { value: { name: '' }, detail: 'accessible name empty' }, 'Point aria-labelledby at the dialog heading.');
  }
  if (!d0.background.ok) {
    broken('inert background');
    clauseHit(ctx, ps, d0, 'background not inert', ['4.1.2'], `While the dialog is open, page content outside it (${d0.background.offenders.join(', ')}) is neither inert nor aria-hidden${d0.ariaModal ? '; aria-modal="true" alone leaves it reachable for pointer users and some screen readers' : ''}.`, { value: { offenders: d0.background.offenders }, detail: `not inert: ${d0.background.offenders.join(', ')}` }, 'Use showModal() (the browser makes the rest inert) or set inert on the page content while the dialog is open.');
  }
  if (trigger && !d0.focusInside) {
    const st = await poll(async () => {
      const s = await page.evaluate(dialogState, dialogId).catch(() => null);
      return s && s.focusInside ? s : null;
    }, 500);
    if (!st) {
      broken('focus moves in');
      clauseHit(ctx, ps, d0, 'focus does not move into it', ['2.4.3'], `After the dialog opens from ${trigger.triggerDesc}, focus stays ${d0.focusOnBody ? 'on the page body' : `on ${d0.focus ? d0.focus.selector : 'the trigger'}`} instead of moving into the dialog.`, { value: { focus: d0.focus ? d0.focus.selector : null }, detail: `focus after open: ${d0.focus ? d0.focus.selector : 'body'}` }, 'Move focus into the dialog on open (first control, the heading with tabindex="-1", or the least destructive button).');
    }
  } else if (!trigger && !d0.focusInside) {
    ctx.note(`dialog ${d0.selector} on ${ps.route} (${ps.state}) was open without a known invoker; focus placement on open was not judged`);
  }
  // Tab and Shift+Tab containment.
  const startIn = await page.evaluate((id) => {
    const d = window.__uie.el(id);
    const F = window.__uieProbe;
    const a = F.deepActive();
    if (a && (a === d || d.contains(a))) return true;
    const t = [...d.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[tabindex]')].find((e) => window.__uie.tabbable(e));
    (t || d).focus();
    return false;
  }, dialogId);
  void startIn;
  const presses = Math.min(30, d0.tabbables + 2);
  let escaped = null;
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i < presses && !escaped; i += 1) {
      await page.keyboard.press(key);
      const st = await page.evaluate(dialogState, dialogId).catch(() => null);
      if (!st || !st.visible) break;
      if (!st.focusInside && !st.focusOnBody) escaped = { key, to: st.focus ? st.focus.selector : '?' };
    }
    if (escaped) break;
  }
  if (escaped) {
    broken('Tab stays inside');
    clauseHit(ctx, ps, d0, `${escaped.key} leaves the dialog`, ['2.4.3', '2.1.2'], `Pressing ${escaped.key} inside the open dialog moves focus to ${escaped.to} in the page behind it; focus must cycle inside a modal dialog.`, { value: { key: escaped.key, to: escaped.to }, detail: `${escaped.key} → ${escaped.to}` }, 'Use showModal() (focus stays in the dialog), or wrap Tab and Shift+Tab inside it and make the page inert.');
  }
  // Escape closes.
  await page.evaluate((id) => {
    const d = window.__uie.el(id);
    const a = window.__uieProbe.deepActive();
    if (d && !(a && (a === d || d.contains(a)))) {
      const t = [...d.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[tabindex]')].find((e) => window.__uie.tabbable(e));
      (t || d).focus();
    }
  }, dialogId).catch(() => {});
  await page.keyboard.press('Escape');
  let closed = await poll(async () => {
    const s = await page.evaluate(dialogState, dialogId).catch(() => null);
    return s && (s.gone || !s.visible || s.open === false) ? true : null;
  }, 1000);
  let closedBy = 'Escape';
  if (!closed) {
    broken('Escape closes');
    clauseHit(ctx, ps, d0, 'Escape does not close it', ['2.1.2'], 'Pressing Escape inside the open dialog leaves it open; keyboard users expect Escape to dismiss a modal dialog.', { value: { key: 'Escape' }, detail: 'dialog still open 1 s after Escape' }, 'Close the dialog on Escape (native <dialog> does this) and return focus to the invoker.');
    const st = await page.evaluate(dialogState, dialogId).catch(() => null);
    if (st && st.closeButton !== null) {
      const h = await handleFor(page, st.closeButton);
      if (h) {
        await h.focus().catch(() => {});
        await page.keyboard.press('Enter').catch(() => {});
        await h.dispose().catch(() => {});
        closed = await poll(async () => {
          const s = await page.evaluate(dialogState, dialogId).catch(() => null);
          return s && (s.gone || !s.visible || s.open === false) ? true : null;
        }, 1000);
        closedBy = 'its close button';
      }
    }
  }
  // Focus returns to the trigger.
  if (closed && trigger) {
    await page.waitForTimeout(120);
    const a = await page.evaluate(activeInfo).catch(() => null);
    const trig = await page.evaluate((i) => {
      const el = window.__uie.el(i);
      return { connected: !!(el && el.isConnected) };
    }, trigger.triggerId).catch(() => ({ connected: false }));
    const ok = a && (a.id === trigger.triggerId || (!trig.connected && a.connected));
    if (!ok) {
      broken('focus returns');
      clauseHit(ctx, ps, d0, 'focus does not return to the trigger', ['2.4.3'], `After the dialog closes (${closedBy}), focus lands on ${a ? a.selector : 'the page body'} instead of ${trigger.triggerDesc}, so keyboard users lose their place.`, { value: { closed_by: closedBy, focus: a ? a.selector : null }, detail: `focus after close: ${a ? a.selector : 'body'}` }, 'Return focus to the invoker on close (native <dialog> does this; custom dialogs must call trigger.focus()).');
    }
  } else if (!closed) {
    outcome.note = 'could not close the dialog; focus return not judged';
  }
  outcome.outcome = outcome.broken.length ? `${outcome.broken.length} clause(s) broken` : 'contract holds';
  stats.probes.push(outcome);
  return d0.selector;
}
