// The probe action vocabulary (ARCHITECTURE §8.5), shared by state recipes, journeys and `uie probe`.
// Every action has a timeout and fails with a readable message that names the step and the target.
import path from 'node:path';
import { toLocator, parseTarget, describeTarget, TargetSyntaxError } from './locators.mjs';
import { resolveUrl, assertAllowedUrl, isLocalUrl } from './launch.mjs';
import { ensureDir } from '../util/fs.mjs';
import { slug } from '../util/time.mjs';

export const ACTIONS = {
  goto: { required: ['url'] },
  click: { required: ['target'] },
  dblclick: { required: ['target'] },
  hover: { required: ['target'] },
  focus: { required: ['target'] },
  fill: { required: ['target', 'value'] },
  select: { required: ['target', 'value'] },
  check: { required: ['target'] },
  uncheck: { required: ['target'] },
  press: { required: ['key'] },
  tab: { required: [] },
  scroll: { required: [] },
  wait: { required: [] },
  expect: { required: [] },
  screenshot: { required: ['name'] },
  viewport: { required: ['width'] },
  emulate: { required: [] },
};

const EXPECT_STATES = ['visible', 'hidden', 'enabled', 'disabled', 'focused', 'checked'];
const MAX_WAIT_MS = 60000;

export class ActionError extends Error {
  constructor(message, { step, action, cause } = {}) {
    super(message);
    this.userMessage = message;
    this.step = step;
    this.action = action;
    this.cause = cause;
  }
}

function describe(a) {
  if (!a || typeof a !== 'object') return String(a);
  const bits = [a.action];
  if (a.target) bits.push(describeTarget(a.target));
  if (a.url) bits.push(a.url);
  if (a.key) bits.push(a.key);
  if (a.text) bits.push(`"${a.text}"`);
  if (a.state) bits.push(a.state);
  return bits.join(' ');
}

/** Validate an action list; returns an array of problems ({step, message}). */
export function validateActions(actions) {
  const problems = [];
  if (!Array.isArray(actions)) return [{ step: 0, message: 'actions must be an array' }];
  actions.forEach((a, i) => {
    const step = i + 1;
    if (!a || typeof a !== 'object' || Array.isArray(a)) {
      problems.push({ step, message: 'each action must be an object with an "action" key' });
      return;
    }
    const spec = ACTIONS[a.action];
    if (!spec) {
      problems.push({ step, message: `unknown action "${a.action}" (known: ${Object.keys(ACTIONS).join(', ')})` });
      return;
    }
    for (const k of spec.required) if (a[k] === undefined || a[k] === null || a[k] === '') problems.push({ step, message: `${a.action} needs "${k}"` });
    if (a.target !== undefined) {
      try {
        parseTarget(a.target);
      } catch (err) {
        problems.push({ step, message: err.message });
      }
    }
    if (a.action === 'expect') {
      const forms = ['text' in a, 'url' in a, 'state' in a && 'target' in a];
      if (!forms.some(Boolean)) problems.push({ step, message: 'expect needs {text[, target]}, {url} or {target, state}' });
      if (a.state && !EXPECT_STATES.includes(a.state)) problems.push({ step, message: `expect state must be one of ${EXPECT_STATES.join(', ')}` });
    }
    if (a.action === 'wait' && a.ms === undefined && !a.target) problems.push({ step, message: 'wait needs {ms} or {target[, state]}' });
    if (a.action === 'wait' && a.ms !== undefined && (!Number.isFinite(Number(a.ms)) || a.ms < 0 || a.ms > MAX_WAIT_MS)) problems.push({ step, message: `wait ms must be 0..${MAX_WAIT_MS}` });
    if (a.action === 'tab' && a.count !== undefined && (!Number.isInteger(a.count) || a.count < 1 || a.count > 500)) problems.push({ step, message: 'tab count must be an integer 1..500' });
    if (a.action === 'scroll' && a.target === undefined && a.y === undefined) problems.push({ step, message: 'scroll needs {target} or {y}' });
  });
  return problems;
}

/** Parse actions given as JSON text, a JSON file path, or an array. */
export function parseActionsArg(value, readFile) {
  if (Array.isArray(value)) return value;
  const s = String(value || '').trim();
  if (!s) return [];
  let text = s;
  if (!s.startsWith('[') && !s.startsWith('{')) text = readFile(s);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new TargetSyntaxError(`--actions is not valid JSON: ${err.message}`);
  }
  if (!Array.isArray(parsed)) parsed = parsed.actions || parsed.correct_actions || [parsed];
  return parsed;
}

function friendly(err, a, timeout) {
  const msg = String(err && err.message ? err.message : err).split('\n')[0];
  if (/strict mode violation/i.test(msg)) {
    const n = (msg.match(/resolved to (\d+) elements/) || [])[1];
    return `${n ? `${n} elements match` : 'several elements match'} ${describeTarget(a.target)}; make the target unique (add a name or a parent)`;
  }
  if (err && (err.name === 'TimeoutError' || /Timeout \d+ms exceeded/i.test(msg))) {
    return `timed out after ${timeout} ms${a.target ? ` waiting for ${describeTarget(a.target)}` : ''}`;
  }
  if (/net::ERR_|NS_ERROR/.test(msg)) return `navigation failed: ${msg}`;
  return msg;
}

async function pollUntil(fn, timeout, interval = 100) {
  const end = Date.now() + timeout;
  let last;
  for (;;) {
    last = await fn();
    if (last && last.ok) return last;
    if (Date.now() >= end) return last || { ok: false };
    await new Promise((r) => setTimeout(r, interval));
  }
}

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/**
 * True when activating `locator` would submit a payment or authentication form (§13). With `implicit`, pressing
 * Enter in any field of such a form counts too (implicit submission).
 */
async function sensitiveSubmit(locator, { implicit = false } = {}) {
  try {
    return await locator.first().evaluate((el, imp) => {
      const form = el.form || el.closest('form');
      if (!form) return false;
      const isSubmit = el.type === 'submit' || el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || (imp && ['INPUT', 'SELECT'].includes(el.tagName));
      const fields = [...form.querySelectorAll('input')];
      const sensitive = fields.some((f) => f.type === 'password' || /^cc-|one-time-code/.test(f.autocomplete || '') || /card|cvv|cvc|iban|password/i.test(`${f.name} ${f.id}`));
      return isSubmit && sensitive;
    }, implicit);
  } catch {
    return false;
  }
}

/**
 * Run one action on a page.
 * @param {import('playwright').Page} page
 * @param {object} a action
 * @param {{baseUrl?:string, allowRemote?:boolean, timeout?:number, outDir?:string, step?:number, screenshots?:string[]}} opts
 */
export async function runAction(page, a, opts = {}) {
  const timeout = Math.min(Number(opts.timeout) || 10000, MAX_WAIT_MS);
  const step = opts.step || 0;
  const loc = () => toLocator(page, a.target);
  const remotePage = !isLocalUrl(page.url()) && page.url() !== 'about:blank';
  try {
    switch (a.action) {
      case 'goto': {
        const url = resolveUrl(opts.baseUrl || page.url(), a.url);
        assertAllowedUrl(url, opts.allowRemote);
        const resp = await page.goto(url, { waitUntil: 'load', timeout: Math.max(timeout, 30000) });
        if (resp && resp.status() >= 400) throw new Error(`${url} answered HTTP ${resp.status()}`);
        await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
        return { url: page.url(), status: resp ? resp.status() : null };
      }
      case 'click':
      case 'dblclick': {
        const l = loc();
        if (remotePage && (await sensitiveSubmit(l))) throw new Error('refusing to submit a payment or authentication form on a non-local host');
        if (a.action === 'click') await l.click({ timeout });
        else await l.dblclick({ timeout });
        return {};
      }
      case 'hover':
        await loc().hover({ timeout });
        return {};
      case 'focus':
        await loc().focus({ timeout });
        return {};
      case 'fill':
        await loc().fill(String(a.value), { timeout });
        return {};
      case 'select':
        await loc().selectOption(Array.isArray(a.value) ? a.value.map(String) : String(a.value), { timeout });
        return {};
      case 'check':
        await loc().check({ timeout });
        return {};
      case 'uncheck':
        await loc().uncheck({ timeout });
        return {};
      case 'press': {
        const enter = /enter/i.test(a.key);
        if (a.target) {
          const l = loc();
          if (remotePage && enter && (await sensitiveSubmit(l, { implicit: true }))) throw new Error('refusing to submit a payment or authentication form on a non-local host');
          await l.press(a.key, { timeout });
        } else {
          if (remotePage && enter && (await sensitiveSubmit(page.locator(':focus'), { implicit: true }))) throw new Error('refusing to submit a payment or authentication form on a non-local host');
          await page.keyboard.press(a.key);
        }
        return {};
      }
      case 'tab': {
        const n = a.count || 1;
        for (let i = 0; i < n; i += 1) await page.keyboard.press(a.shift ? 'Shift+Tab' : 'Tab');
        return {};
      }
      case 'scroll':
        if (a.target) await loc().scrollIntoViewIfNeeded({ timeout });
        else await page.evaluate((y) => window.scrollTo(0, y), Number(a.y) || 0);
        return {};
      case 'wait':
        if (a.target) await loc().first().waitFor({ state: a.state === 'hidden' ? 'hidden' : 'visible', timeout: Math.min(a.ms || timeout, MAX_WAIT_MS) });
        else await page.waitForTimeout(Math.min(Number(a.ms) || 0, MAX_WAIT_MS));
        return {};
      case 'expect':
        return await runExpect(page, a, timeout);
      case 'screenshot': {
        const dir = ensureDir(path.join(opts.outDir || process.cwd(), 'screenshots'));
        const file = path.join(dir, `${slug(a.name, 60)}.png`);
        await page.screenshot({ path: file, fullPage: !!a.full_page, animations: 'disabled', caret: 'hide' });
        if (opts.screenshots) opts.screenshots.push(file);
        return { file };
      }
      case 'viewport':
        await page.setViewportSize({ width: Number(a.width), height: Number(a.height) || page.viewportSize()?.height || 900 });
        return {};
      case 'emulate': {
        const m = {};
        if (a.colorScheme) m.colorScheme = a.colorScheme;
        if (a.reducedMotion) m.reducedMotion = a.reducedMotion;
        if (a.forcedColors) m.forcedColors = a.forcedColors;
        await page.emulateMedia(m);
        return {};
      }
      default:
        throw new Error(`unknown action "${a.action}"`);
    }
  } catch (err) {
    if (err instanceof ActionError) throw err;
    const msg = err && err.isUsage ? err.message : friendly(err, a, timeout);
    throw new ActionError(`step ${step} (${describe(a)}): ${msg}`, { step, action: a, cause: err });
  }
}

/** Evaluate an expect action (or a success-condition predicate). Returns {ok, detail}. */
export async function checkPredicate(page, a, timeout = 0) {
  if (a.url !== undefined) {
    let re;
    try {
      re = new RegExp(a.url);
    } catch (err) {
      return { ok: false, detail: `invalid url pattern ${a.url}: ${err.message}` };
    }
    return pollUntil(async () => {
      const u = new URL(page.url());
      const candidates = [page.url(), `${u.pathname}${u.search}${u.hash}`, u.pathname];
      const ok = candidates.some((c) => re.test(c));
      return { ok, detail: ok ? `url ${page.url()} matches ${a.url}` : `url ${page.url()} does not match ${a.url}` };
    }, timeout);
  }
  if (a.text !== undefined) {
    const want = norm(a.text);
    return pollUntil(async () => {
      let texts = [];
      try {
        if (a.target) texts = (await toLocator(page, a.target).allInnerTexts()).map(norm);
        else texts = [norm(await page.locator('body').innerText({ timeout: 2000 }))];
      } catch (err) {
        return { ok: false, detail: err.message.split('\n')[0] };
      }
      const ok = texts.some((t) => t.includes(want));
      return { ok, detail: ok ? `found "${a.text}"` : `"${a.text}" not found${a.target ? ` in ${describeTarget(a.target)}` : ''}${texts.length ? ` (saw "${texts.join(' | ').slice(0, 120)}")` : ''}` };
    }, timeout);
  }
  if (a.target && a.state) {
    return pollUntil(async () => {
      const l = toLocator(page, a.target);
      let ok = false;
      try {
        const n = await l.count();
        if (a.state === 'hidden') ok = n === 0 || !(await l.first().isVisible());
        else if (n === 0) ok = false;
        else if (a.state === 'visible') ok = await l.first().isVisible();
        else if (a.state === 'enabled') ok = await l.first().isEnabled();
        else if (a.state === 'disabled') ok = await l.first().isDisabled();
        else if (a.state === 'checked') ok = await l.first().isChecked();
        else if (a.state === 'focused') ok = await l.first().evaluate((el) => el === document.activeElement || el.contains(document.activeElement));
      } catch (err) {
        return { ok: false, detail: err.message.split('\n')[0] };
      }
      return { ok, detail: `${describeTarget(a.target)} is ${ok ? '' : 'not '}${a.state}` };
    }, timeout);
  }
  return { ok: false, detail: 'unsupported predicate (use {url}, {text[, target]} or {target, state})' };
}

async function runExpect(page, a, timeout) {
  const res = await checkPredicate(page, a, timeout);
  if (!res.ok) throw new Error(`expectation failed: ${res.detail}`);
  return { detail: res.detail };
}

/**
 * Run an action list. Stops at the first failure unless `continueOnError`.
 * @returns {Promise<{ok:boolean, steps:object[], error?:string}>}
 */
export async function runActions(page, actions, opts = {}) {
  const problems = validateActions(actions);
  if (problems.length) {
    return { ok: false, steps: [], error: problems.map((p) => `step ${p.step}: ${p.message}`).join('; ') };
  }
  const steps = [];
  for (let i = 0; i < actions.length; i += 1) {
    const a = actions[i];
    const t0 = Date.now();
    try {
      const res = await runAction(page, a, { ...opts, step: i + 1 });
      steps.push({ step: i + 1, action: a.action, target: a.target, ok: true, ms: Date.now() - t0, url: page.url(), ...res });
      if (opts.onStep) await opts.onStep(steps.at(-1), page);
    } catch (err) {
      steps.push({ step: i + 1, action: a.action, target: a.target, ok: false, ms: Date.now() - t0, url: page.url(), error: err.userMessage || err.message });
      if (opts.onStep) await opts.onStep(steps.at(-1), page);
      if (!opts.continueOnError) return { ok: false, steps, error: err.userMessage || err.message };
    }
  }
  const failed = steps.find((s) => !s.ok);
  return { ok: !failed, steps, error: failed ? failed.error : undefined };
}
