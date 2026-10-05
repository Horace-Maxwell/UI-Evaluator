// Interaction helpers for the checks that act on a page (forms, live-regions, states, dialogs): an in-page probe
// (window.__uieProbe) armed before an action — MutationObserver timeline with performance.now() marks, setTimeout
// tracking, a 100 ms progress sampler, the visible-text baseline and the live regions present before the action —
// plus Node helpers to reload a page state cheaply, wait until work started by an action settles, fill forms with
// plausible or type-appropriate invalid values, and keep destructive-looking controls out of reach.
import { ensureHelpers } from './inpage.mjs';
import { runActions } from './actions.mjs';
import { isLocalUrl } from './launch.mjs';

/** Controls never activated by a probe (en and zh). Matched against accessible name, text and value. */
export const DESTRUCTIVE_RE = /\b(delete|remove|destroy|discard|erase|clear\s+all|empty\s+(?:cart|basket|trash|bin)|reset|purge|wipe|pay|payment|purchase|buy|checkout|check\s+out|place\s+(?:the\s+)?order|order\s+now|unsubscribe|cancel\s+(?:my\s+)?(?:subscription|account|order|plan|membership)|close\s+(?:my\s+)?account|deactivate|deregister|sign\s*out|log\s*out|logout|transfer|send\s+money|withdraw|donate|revoke|terminate|archive\s+all)\b|删除|移除|清空|清除|重置|支付|付款|购买|下单|结算|退出|注销|取消订阅|转账|撤销/i;

export function isDestructive(...texts) {
  return texts.some((t) => t && DESTRUCTIVE_RE.test(String(t)));
}

/**
 * Run per-page-state work so that one failing page state is recorded (error + partial) instead of crashing the
 * check; `finish()` rethrows when every page state failed, so the check is `failed` (not_run), never a silent pass.
 */
export function pageGuard(ctx) {
  let ok = 0;
  let failed = 0;
  let last = null;
  const guard = async (ps, fn) => {
    try {
      await fn();
      ok += 1;
    } catch (err) {
      failed += 1;
      last = err;
      ctx.error(`${ps.key}: ${String(err && err.message ? err.message : err).split('\n')[0]}`);
      ctx.partial('some page states could not be evaluated (see errors)');
    }
  };
  guard.finish = () => {
    if (!ok && failed && last) throw last;
  };
  return guard;
}

/* eslint-disable no-restricted-globals */
function probeLib() {
  if (window.__uieProbe && window.__uieProbe.v === 2) return true;
  const U = window.__uie;
  const P = { v: 2, armed: false, timers: new Map(), records: [], samples: [], t0: null };
  const origST = window.setTimeout.bind(window);
  const origCT = window.clearTimeout.bind(window);
  P.origST = origST;
  window.setTimeout = function uieSetTimeout(fn, ms, ...args) {
    const d = Number(ms) || 0;
    if (!P.armed || d > 6000) return origST(fn, ms, ...args);
    let id = null;
    const wrapped = function uieTimer() {
      P.timers.delete(id);
      // eslint-disable-next-line no-eval
      return typeof fn === 'function' ? fn.apply(this, args) : (0, eval)(String(fn));
    };
    id = origST(wrapped, ms);
    P.timers.set(id, performance.now() + d);
    return id;
  };
  window.clearTimeout = function uieClearTimeout(id) {
    P.timers.delete(id);
    return origCT(id);
  };

  const LIVE_SEL = '[aria-live]:not([aria-live="off"]),[role=status],[role=alert],[role=log],output';
  const shown = (el) => {
    if (!el || !el.isConnected) return false;
    if (typeof el.checkVisibility === 'function') return el.checkVisibility({ visibilityProperty: true });
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
    }
    return true;
  };
  P.liveRegions = () => [...document.querySelectorAll(LIVE_SEL)].filter((e) => shown(e) && !e.closest('[aria-hidden="true"]'));

  const textSnapshot = () => {
    U.reset();
    const m = new Map();
    for (const el of U.textElements(document.body, { limit: 5000 })) m.set(el, U.ownText(el));
    return m;
  };
  const deepActive = () => {
    let a = document.activeElement;
    for (let i = 0; a && a.shadowRoot && a.shadowRoot.activeElement && i < 20; i += 1) a = a.shadowRoot.activeElement;
    return a;
  };
  P.deepActive = deepActive;
  const openModals = () => [...document.querySelectorAll('dialog,[role=dialog],[role=alertdialog]')].filter((d) => {
    try {
      if (d.matches(':modal')) return true;
    } catch {
      /* :modal unsupported */
    }
    return d.getAttribute('aria-modal') === 'true' && U.isVisible(d);
  });
  P.openModals = openModals;

  const VISUAL_ATTRS = ['class', 'style', 'hidden', 'disabled', 'open', 'src', 'value', 'checked', 'aria-busy', 'aria-pressed', 'aria-expanded', 'aria-invalid', 'aria-hidden'];
  const LOADING_RE = /\b(loading|saving|sending|submitting|processing|uploading|exporting|working|please wait|updating|searching)\b|…$|\.\.\.$|加载中|正在|处理中|请稍候|提交中|保存中/i;

  P.sample = () => {
    if (!P.armed || P.t0 === null) return;
    U.reset();
    let spin = 0;
    try {
      for (const a of document.getAnimations()) {
        if (a.playState !== 'running' || !a.effect) continue;
        const t = a.effect.getTiming ? a.effect.getTiming() : {};
        const target = a.effect.target;
        if (t.iterations === Infinity && target && U.isVisible(target)) spin += 1;
      }
    } catch {
      /* getAnimations unsupported */
    }
    let progress = 0;
    let determinate = 0;
    for (const e of document.querySelectorAll('progress,[role=progressbar],[aria-busy="true"]')) {
      if (!U.isVisible(e)) continue;
      progress += 1;
      if ((e.tagName === 'PROGRESS' && e.hasAttribute('value')) || e.hasAttribute('aria-valuenow')) determinate += 1;
    }
    let loadingText = 0;
    let percent = 0;
    for (const [el, before] of P.textAfterArm()) {
      const now = U.ownText(el);
      if (now === before) continue;
      if (LOADING_RE.test(now)) loadingText += 1;
      if (/\b\d{1,3}\s?%/.test(now)) percent += 1;
    }
    P.samples.push({ t: Math.round(performance.now() - P.t0), spin, progress, determinate, loadingText, percent });
  };
  // Text elements whose own text differs from the armed baseline (new or changed), visible now.
  P.textAfterArm = () => {
    const out = [];
    for (const el of U.textElements(document.body, { limit: 5000 })) {
      const before = P.base.has(el) ? P.base.get(el) : null;
      out.push([el, before]);
    }
    return out;
  };

  const tick = () => {
    if (!P.armed) return;
    try {
      P.sample();
    } catch {
      /* sampling is best effort */
    }
    P.sampler = origST(tick, 100);
  };

  P.arm = ({ triggerId = null } = {}) => {
    P.disarm();
    U.reset();
    P.armed = true;
    P.t0 = null;
    P.records = [];
    P.samples = [];
    P.timers = new Map();
    P.base = textSnapshot();
    P.liveBefore = new Set(P.liveRegions());
    P.modalsBefore = new Set(openModals());
    P.focusBefore = deepActive();
    P.url = location.href;
    P.trigger = triggerId === null ? null : U.el(triggerId);
    P.submits = 0;
    P.invalids = 0;
    P.mutCount = 0;
    P.mo = new MutationObserver((list) => {
      const t = performance.now();
      P.mutCount += list.length;
      if (P.records.length > 4000) return;
      U.reset();
      for (const m of list) {
        let el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        if (!el || ['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'TITLE'].includes(el.tagName)) continue;
        if (m.type === 'attributes' && !VISUAL_ATTRS.includes(m.attributeName)) continue;
        let visible = U.isVisible(el);
        if (!visible && m.type === 'childList') visible = [...m.addedNodes].some((n) => (n.nodeType === 1 ? U.isVisible(n) : n.parentElement && U.isVisible(n.parentElement))) || (m.removedNodes.length > 0 && U.isVisible(el));
        if (!visible && m.type === 'attributes' && (m.attributeName === 'hidden' || m.attributeName === 'style' || m.attributeName === 'class')) visible = true; // shown or hidden by the change
        P.records.push({ t, visible, type: m.type, attr: m.attributeName || null });
      }
    });
    P.mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true });
    P.onDown = () => {
      if (P.t0 === null) P.t0 = performance.now();
    };
    P.onSubmit = () => {
      P.submits += 1;
    };
    P.onInvalid = () => {
      P.invalids += 1;
    };
    for (const ev of ['pointerdown', 'mousedown', 'keydown']) document.addEventListener(ev, P.onDown, true);
    document.addEventListener('submit', P.onSubmit, true);
    document.addEventListener('invalid', P.onInvalid, true);
    P.sampler = origST(tick, 100);
    return true;
  };

  P.disarm = () => {
    if (P.mo) P.mo.disconnect();
    P.mo = null;
    P.armed = false;
    if (P.sampler) origCT(P.sampler);
    for (const ev of ['pointerdown', 'mousedown', 'keydown']) if (P.onDown) document.removeEventListener(ev, P.onDown, true);
    if (P.onSubmit) document.removeEventListener('submit', P.onSubmit, true);
    if (P.onInvalid) document.removeEventListener('invalid', P.onInvalid, true);
  };

  /** Mark the action start explicitly (programmatic actions without a pointer or key event). */
  P.mark = () => {
    if (P.t0 === null) P.t0 = performance.now();
  };

  P.status = () => ({ pending: P.timers.size, mutations: P.mutCount, url: location.href });

  const STATUS_RE = /\b(saved|added|removed|deleted|updated|sent|submitted|copied|uploaded|downloaded|created|published|subscribed|unsubscribed|registered|booked|reserved|success(?:ful(?:ly)?)?|done|complete(?:d)?|thanks|thank you|confirmed|error|failed|failure|unable|couldn['’]?t|cannot|can['’]?t|invalid|loading|saving|sending|processing|please wait|in progress|no results?|results? (?:found|returned)|items? found|\d+\s+(?:results?|items?|matches|products?|records?|plots?|files?)|in (?:your )?(?:cart|basket|bag)|out of stock|ready|signed in|logged in|try again)\b|已保存|保存成功|已添加|添加成功|已删除|删除成功|已更新|更新成功|已发送|发送成功|已提交|提交成功|已复制|复制成功|已上传|上传成功|成功|失败|错误|出错|无法|加载中|正在|处理中|请稍候|没有结果|无结果|共\s*\d+\s*(?:条|个|项)|购物车|感谢|谢谢/i;
  const TOASTY_RE = /toast|snack|notif|alert|flash|message|status|banner|callout|feedback|growl|notice/i;
  const POPUPISH = 'dialog[open],[role=dialog],[role=alertdialog],[role=menu],[role=listbox],[role=tooltip],[popover]';

  /** Everything observed since arm(). */
  P.result = () => {
    U.reset();
    const t0 = P.t0 === null ? null : P.t0;
    const vis = P.records.filter((r) => r.visible && (t0 === null || r.t >= t0 - 1));
    const firstVisible = vis.length && t0 !== null ? Math.max(0, Math.round(vis[0].t - t0)) : null;
    const lastVisible = vis.length && t0 !== null ? Math.max(0, Math.round(vis[vis.length - 1].t - t0)) : null;
    const active = deepActive();
    const trigger = P.trigger && P.trigger.isConnected ? P.trigger : null;
    const tr = trigger ? trigger.getBoundingClientRect() : null;
    const liveNow = P.liveRegions();
    const modalsNow = openModals();
    const newModals = modalsNow.filter((m) => !P.modalsBefore.has(m));
    const changed = [];
    for (const el of U.textElements(document.body, { limit: 5000 })) {
      const now = U.ownText(el);
      const before = P.base.has(el) ? P.base.get(el) : null;
      if (!now || now === before) continue;
      if (changed.length >= 60) break;
      const lr = el.closest(LIVE_SEL);
      let liveVia = null;
      if (lr && !lr.closest('[aria-hidden="true"]')) {
        const role = (lr.getAttribute('role') || '').trim();
        if (P.liveBefore.has(lr)) liveVia = 'existing';
        else if (role === 'alert' || (lr.getAttribute('aria-live') === 'assertive' && role === 'alert')) liveVia = 'inserted-alert';
        else liveVia = 'inserted';
      }
      const r = el.getBoundingClientRect();
      let near = null;
      if (tr) {
        const dx = Math.max(0, tr.left - r.right, r.left - tr.right);
        const dy = Math.max(0, tr.top - r.bottom, r.top - tr.bottom);
        near = Math.round(Math.hypot(dx, dy));
      }
      let toast = false;
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        const s = getComputedStyle(a);
        if ((s.position === 'fixed' || s.position === 'absolute') && TOASTY_RE.test(`${a.id} ${a.className && a.className.baseVal !== undefined ? a.className.baseVal : a.className} ${a.getAttribute('role') || ''}`)) {
          toast = true;
          break;
        }
      }
      let block = el;
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        const d = getComputedStyle(a).display;
        if (!d.startsWith('inline') && d !== 'contents') {
          block = a;
          break;
        }
      }
      changed.push({
        id: U.id(el),
        block: U.id(block),
        selector: U.selector(el),
        snippet: U.snippet(el),
        source: U.sourceOf(el),
        bbox: U.docRect(el),
        text: now.slice(0, 200),
        before: before === null ? null : before.slice(0, 120),
        status: STATUS_RE.test(now),
        toast,
        classHint: TOASTY_RE.test(`${el.id} ${typeof el.className === 'string' ? el.className : ''} ${block.id} ${typeof block.className === 'string' ? block.className : ''}`),
        liveVia,
        liveSel: lr ? U.selector(lr) : null,
        inTrigger: !!(trigger && (trigger === el || trigger.contains(el))),
        inFocus: !!(active && active !== document.body && (active === el || active.contains(el) || el.contains(active))),
        inPopup: !!el.closest(POPUPISH),
        ariaHidden: !!el.closest('[aria-hidden="true"]'),
        near,
      });
    }
    return {
      t0: t0 === null ? null : 0,
      started: t0 !== null,
      firstVisible,
      lastVisible,
      visibleMutations: vis.length,
      pending: P.timers.size,
      samples: P.samples.slice(0, 200),
      changed,
      focusMoved: active !== P.focusBefore,
      focus: active && active !== document.body ? { id: U.id(active), selector: U.selector(active), tag: active.tagName.toLowerCase() } : null,
      newModals: newModals.map((m) => ({ id: U.id(m), selector: U.selector(m) })),
      urlChanged: location.href.replace(/#.*$/, '') !== String(P.url).replace(/#.*$/, ''),
      submits: P.submits,
      invalids: P.invalids,
      liveRegions: liveNow.length,
    };
  };

  window.__uieProbe = P;
  return true;
}

export const PROBE_LIB_SOURCE = `(${probeLib.toString()})()`;

export async function ensureProbeLib(page) {
  await ensureHelpers(page);
  await page.evaluate(PROBE_LIB_SOURCE);
}

/** Count fetch/XHR requests in flight on a page (attached once). */
const INFLIGHT = new WeakMap();
export function trackRequests(page) {
  if (INFLIGHT.has(page)) return INFLIGHT.get(page);
  const st = { inflight: 0, started: 0, urls: [] };
  const busy = (r) => ['fetch', 'xhr', 'eventsource', 'websocket'].includes(r.resourceType());
  page.on('request', (r) => {
    if (!busy(r)) return;
    st.inflight += 1;
    st.started += 1;
    if (st.urls.length < 20) st.urls.push(r.url());
  });
  const done = (r) => {
    if (busy(r)) st.inflight = Math.max(0, st.inflight - 1);
  };
  page.on('requestfinished', done);
  page.on('requestfailed', done);
  INFLIGHT.set(page, st);
  return st;
}

/**
 * Wait until work started by an action has settled: no tracked timers pending, no fetch/XHR in flight and no DOM
 * mutation for `quietMs`; bounded by `maxMs`. Returns {settled, ms}.
 */
export async function waitSettled(page, { maxMs = 3500, quietMs = 300, minMs = 0 } = {}) {
  const net = trackRequests(page);
  const t0 = Date.now();
  let last = -1;
  let quietSince = Date.now();
  for (;;) {
    const st = await page.evaluate(() => (window.__uieProbe ? window.__uieProbe.status() : { pending: 0, mutations: 0 })).catch(() => null);
    const now = Date.now();
    if (!st) return { settled: false, ms: now - t0, gone: true };
    if (st.mutations !== last) {
      last = st.mutations;
      quietSince = now;
    }
    if (now - t0 >= minMs && st.pending === 0 && net.inflight === 0 && now - quietSince >= quietMs) return { settled: true, ms: now - t0 };
    if (now - t0 >= maxMs) return { settled: false, ms: now - t0 };
    await page.waitForTimeout(50);
  }
}

/** True when the page's current URL is a local development host (ARCHITECTURE §7.1, §13). */
export function isLocalPage(page) {
  const u = page.url();
  return isLocalUrl(u) && !/^about:/.test(u);
}

/**
 * Reload a page state without a new browser context: navigate to the state's URL, wait until the network and
 * DOM are quiet, re-install the helpers and re-run the state recipe (unless `recipe: false`).
 */
export async function reloadState(ctx, pg, { recipe = true } = {}) {
  const { page, ps } = pg;
  const url = pg.load && pg.load.url ? pg.load.url : page.url();
  trackRequests(page);
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  } catch (err) {
    return { ok: false, error: `reload failed: ${String(err.message || err).split('\n')[0]}` };
  }
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await ensureProbeLib(page);
  await waitSettled(page, { maxMs: 3000, quietMs: 150 });
  const actions = (recipe && ps.stateCfg && ps.stateCfg.actions) || [];
  if (actions.length) {
    const res = await runActions(page, actions, { baseUrl: ctx.session.baseUrl, allowRemote: ctx.session.allowRemote, timeout: 8000 });
    if (!res.ok) return { ok: false, error: `state recipe failed on reload: ${res.error}` };
    await waitSettled(page, { maxMs: 3000, quietMs: 150 });
  }
  await ensureProbeLib(page);
  return { ok: true };
}

/** Element handle for a __uie id. */
export async function handleFor(page, id) {
  const h = await page.evaluateHandle((i) => window.__uie.el(i), id);
  const el = h.asElement();
  if (!el) {
    await h.dispose();
    return null;
  }
  return el;
}

/** Click an element by __uie id (real pointer events through Playwright). Returns {ok, error}. */
export async function clickId(page, id, { timeout = 4000 } = {}) {
  const el = await handleFor(page, id);
  if (!el) return { ok: false, error: 'element is gone' };
  try {
    await el.click({ timeout });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.message || err).split('\n')[0] };
  } finally {
    await el.dispose().catch(() => {});
  }
}

// --- forms ---------------------------------------------------------------------------------------------------

/** In-page: the fields of a form-like group and its submit control. Runs with window.__uie installed. */
export function formFields(formId) {
  const U = window.__uie;
  const root = U.el(formId);
  if (!root) return null;
  const fields = [];
  const sel = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]),select,textarea';
  for (const el of root.querySelectorAll(sel)) {
    if (el.disabled || el.readOnly || !U.isVisible(el) && !(el.labels && [...el.labels].some((l) => U.isVisible(l)))) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    fields.push({ id: U.id(el), tag: el.tagName.toLowerCase(), type: (el.getAttribute('type') || (el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'textarea' : 'text')).toLowerCase(), name: el.name || '', required: el.required || el.getAttribute('aria-required') === 'true', minlength: el.minLength > 0 ? el.minLength : null, maxlength: el.maxLength > 0 ? el.maxLength : null, min: el.min || null, max: el.max || null, pattern: el.pattern || null, autocomplete: el.getAttribute('autocomplete') || '', label: U.accName(el).slice(0, 80) });
  }
  return fields;
}

const lc = (s) => String(s || '').toLowerCase();

/** A plausible valid value for a field (null: leave it). */
export function plausibleValue(f) {
  const hint = `${lc(f.name)} ${lc(f.label)} ${lc(f.autocomplete)}`;
  const pad = (v) => (f.minlength && v.length < f.minlength ? v.padEnd(f.minlength, 'x') : v);
  switch (f.type) {
    case 'email':
      return 'alex.tester@example.org';
    case 'tel':
      return '01632 960001';
    case 'url':
      return 'https://example.org';
    case 'number':
    case 'range': {
      const min = f.min !== null && f.min !== '' ? Number(f.min) : null;
      return String(Number.isFinite(min) ? min : 1);
    }
    // Date-like inputs take their own minimum when they have one (a booking form that only accepts future dates).
    case 'date':
      return f.min || '2026-01-15';
    case 'time':
      return f.min || '10:00';
    case 'datetime-local':
      return f.min || '2026-01-15T10:00';
    case 'month':
      return f.min || '2026-01';
    case 'week':
      return f.min || '2026-W03';
    case 'password':
      return pad('Correct-horse-9!');
    case 'checkbox':
    case 'radio':
      return f.required ? 'check' : null;
    case 'select':
      return 'first';
    case 'file':
    case 'color':
      return null;
    default:
      break;
  }
  if (f.pattern) return null;
  if (/e-?mail|邮箱/.test(hint)) return 'alex.tester@example.org';
  if (/phone|mobile|tel\b|手机|电话/.test(hint)) return '01632 960001';
  if (/post\s?code|postal|zip|邮编/.test(hint)) return pad('94107');
  if (/name|姓名/.test(hint)) return pad('Alex Tester');
  if (/search|query|搜索/.test(hint)) return pad('tomatoes');
  return pad(f.type === 'textarea' ? 'A short test note.' : 'Test value');
}

/** A type-appropriate invalid value (null when the type has no fillable invalid form). */
export function invalidValue(f) {
  const hint = `${lc(f.name)} ${lc(f.label)} ${lc(f.autocomplete)}`;
  if (f.type === 'email' || (f.type === 'text' && /e-?mail|邮箱/.test(hint))) return 'not-an-email';
  if (f.type === 'url') return 'not a url';
  if (f.type === 'tel' || /phone|mobile|手机|电话/.test(hint)) return 'abc';
  if (f.type === 'number') {
    if (f.min !== null && f.min !== '' && Number.isFinite(Number(f.min))) return String(Number(f.min) - 1);
    if (f.max !== null && f.max !== '' && Number.isFinite(Number(f.max))) return String(Number(f.max) + 1);
    return null;
  }
  if (['text', 'search', 'textarea', 'password'].includes(f.type)) {
    if (f.pattern) return '!!!';
    if (f.minlength && f.minlength > 1) return 'a';
  }
  return null;
}

/** Fill fields with values from `pick(field)` ('check', 'first' or a string). Returns the fields filled. */
export async function fillFields(page, fields, pick) {
  const filled = [];
  for (const f of fields) {
    const v = pick(f);
    if (v === null || v === undefined) continue;
    const el = await handleFor(page, f.id);
    if (!el) continue;
    try {
      if (v === 'check') await el.check({ timeout: 2000, force: true });
      else if (v === 'first') {
        const opt = await el.evaluate((s) => {
          if (s.value) return null;
          const o = [...s.options].find((x) => x.value && !x.disabled);
          return o ? o.value : null;
        });
        if (opt !== null) await el.selectOption(opt, { timeout: 2000 });
        else continue;
      } else await el.fill(String(v), { timeout: 2000 });
      filled.push({ id: f.id, value: v === 'check' || v === 'first' ? v : String(v).slice(0, 40) });
    } catch {
      /* a field that refuses the value is left as is */
    } finally {
      await el.dispose().catch(() => {});
    }
  }
  return filled;
}
