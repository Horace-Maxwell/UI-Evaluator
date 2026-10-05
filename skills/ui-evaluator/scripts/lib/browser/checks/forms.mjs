// forms — A11Y-13 (labels, required fields in text, error identification and association, focus to the first error
// or the summary, autocomplete on personal-data fields; 1.3.1, 1.3.5, 3.3.1, 3.3.2), A11Y-14 (credential fields:
// correct autocomplete tokens, paste allowed in password and one-time-code fields; 3.3.8) and CPY-04 (generic,
// blaming or code-only messages in exercised error states, from words-en/zh.json error_generic and error_blame).
// Static checks run at both G2 widths. The submission probe (empty, then type-appropriate invalid values) runs at one
// width on local hosts only (ARCHITECTURE §13); each submission starts from a freshly reloaded page state. When the
// browser's own constraint validation blocks the submit, the browser supplies the text, the association and the
// focus move, so those clauses pass and CPY-04 does not apply to its wording.
import { wordList, matchList } from '../data.mjs';
import { ensureProbeLib, reloadState, waitSettled, clickId, isDestructive, isLocalPage, formFields, plausibleValue, invalidValue, fillFields, trackRequests, handleFor, pageGuard } from '../interact.mjs';

export const mode = 'standalone';
export const openOptions = { bare: true };
export const criteria = ['A11Y-13', 'A11Y-14', 'CPY-04'];
const TEXT_LIKE = new Set(['text', 'email', 'tel', 'url', 'number', 'search', 'password', 'date', 'time', 'datetime-local', 'month', 'week', 'textarea']);

export const summary = 'empty and invalid submission probe; labels, error text and association, focus, autocomplete, paste';

const MAX_FORMS = 4;
const SUBMIT_WIDTH = 1280;

// HTML autofill field names (WHATWG §4.10.18.7.1), for token parsing.
const AUTOFILL = new Set(['name', 'honorific-prefix', 'given-name', 'additional-name', 'family-name', 'honorific-suffix', 'nickname', 'username', 'new-password', 'current-password', 'one-time-code', 'organization-title', 'organization', 'street-address', 'address-line1', 'address-line2', 'address-line3', 'address-level4', 'address-level3', 'address-level2', 'address-level1', 'country', 'country-name', 'postal-code', 'cc-name', 'cc-given-name', 'cc-additional-name', 'cc-family-name', 'cc-number', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'cc-csc', 'cc-type', 'transaction-currency', 'transaction-amount', 'language', 'bday', 'bday-day', 'bday-month', 'bday-year', 'sex', 'url', 'photo', 'tel', 'tel-country-code', 'tel-national', 'tel-area-code', 'tel-local', 'tel-local-prefix', 'tel-local-suffix', 'tel-extension', 'email', 'impp']);

/** Personal-data purposes (1.3.5) detected from type, name, id and label text; first match wins. */
const PURPOSES = [
  { purpose: 'one-time-code', re: /\b(otp|one[\s-]?time|verification\s*code|auth(?:entication)?\s*code|2fa|two[\s-]?factor|passcode|sms\s*code)\b|验证码|动态码|校验码/i, accept: ['one-time-code'], credential: true },
  { purpose: 'username', re: /\b(user\s?name|login|log-in|sign[\s-]?in\s*(?:id|name)|account\s*(?:name|id))\b|用户名|账号|帐号/i, accept: ['username', 'email', 'tel'], credential: true },
  { purpose: 'cc-number', re: /\b(card\s*number|credit\s*card|debit\s*card|cc-?num)\b|卡号/i, accept: ['cc-number'] },
  { purpose: 'cc-csc', re: /\b(cvc|cvv|csc|security\s*code)\b/i, accept: ['cc-csc'] },
  { purpose: 'cc-exp', re: /\b(expir(?:y|ation)|exp\.?\s*date|valid\s*(?:thru|through))\b|有效期/i, accept: ['cc-exp', 'cc-exp-month', 'cc-exp-year'] },
  { purpose: 'cc-name', re: /\b(name\s*on\s*card|card\s*holder|cardholder)\b|持卡人/i, accept: ['cc-name'] },
  { purpose: 'email', re: /\be-?mail\b|邮箱|电子邮件/i, accept: ['email', 'username'] },
  { purpose: 'tel', re: /\b(phone|mobile|cell|telephone|tel)\b|手机|电话/i, accept: ['tel', 'tel-national', 'tel-local', 'tel-country-code', 'tel-area-code'] },
  { purpose: 'given-name', re: /\b(first\s*name|given\s*name|forename)\b|^名$/i, accept: ['given-name', 'cc-given-name'] },
  { purpose: 'family-name', re: /\b(last\s*name|surname|family\s*name)\b|^姓$/i, accept: ['family-name', 'cc-family-name'] },
  { purpose: 'name', re: /^(?:your\s+|full\s+)?name\b|\bfull\s*name\b|^姓名/i, accept: ['name', 'cc-name', 'nickname'] },
  { purpose: 'organization', re: /\b(company|organi[sz]ation|employer)\b|公司|单位/i, accept: ['organization'] },
  { purpose: 'street-address', re: /\b(street|address(?:\s*line)?)\b|地址|街道/i, accept: ['street-address', 'address-line1', 'address-line2', 'address-line3'] },
  { purpose: 'postal-code', re: /\b(post\s?code|postal|zip(?:\s*code)?)\b|邮编|邮政编码/i, accept: ['postal-code'] },
  { purpose: 'address-level2', re: /\b(city|town)\b|城市/i, accept: ['address-level2'] },
  { purpose: 'country', re: /\bcountry\b|国家/i, accept: ['country', 'country-name'] },
  { purpose: 'bday', re: /\b(birth\s*date|date\s*of\s*birth|birthday|dob)\b|生日|出生/i, accept: ['bday', 'bday-day', 'bday-month', 'bday-year'] },
];
const OTHER_PERSON = /\b(recipient|friend|their|someone|gift|other\s+person|emergency|referr?er|guest)\b|收件人|收货人|朋友|对方|紧急联系人/i;

function inventory() {
  const U = window.__uie;
  U.reset();
  const FIELD = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]),select,textarea';
  const SUBMIT_RE = /\b(submit|send|save|sign\s*up|sign\s*in|log\s*in|register|continue|next|subscribe|apply|book|create|search|go|update|confirm|join)\b|提交|发送|保存|注册|登录|继续|下一步|订阅|搜索|确认|预订|加入/i;
  const visibleText = (el) => (el && U.isVisible(el) ? U.collapse(U.textAlt(el, 1)) : '');
  const textOf = (ids) => ids.map((i) => document.getElementById(i)).filter(Boolean);
  const fieldInfo = (el) => {
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') || (tag === 'select' ? 'select' : tag === 'textarea' ? 'textarea' : 'text')).toLowerCase();
    let source = 'none';
    let labelText = '';
    let visible = false;
    const lb = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    const labels = el.labels ? [...el.labels] : [];
    if (lb.length) {
      const refs = textOf(lb);
      labelText = U.collapse(refs.map((r) => U.textAlt(r, 1)).join(' '));
      if (labelText) {
        source = 'labelledby';
        visible = refs.some((r) => U.isVisible(r) && U.collapse(r.innerText || '').length > 0);
      }
    }
    if (source === 'none' && (el.getAttribute('aria-label') || '').trim()) {
      source = 'aria-label';
      labelText = U.collapse(el.getAttribute('aria-label'));
    }
    if (source === 'none' && labels.length) {
      labelText = U.collapse(labels.map((l) => U.textAlt(l, 1)).join(' '));
      if (labelText) {
        source = 'label';
        visible = labels.some((l) => U.isVisible(l) && U.collapse(l.innerText || '').length > 0);
      }
    } else if (labels.length && !visible) {
      visible = labels.some((l) => U.isVisible(l) && U.collapse(l.innerText || '').length > 0);
    }
    if (source === 'none' && (el.getAttribute('title') || '').trim()) {
      source = 'title';
      labelText = U.collapse(el.title);
    }
    if (source === 'none' && (el.getAttribute('placeholder') || '').trim()) {
      source = 'placeholder';
      labelText = U.collapse(el.placeholder);
    }
    const labelVisibleText = U.collapse([...labels.filter((l) => U.isVisible(l)).map((l) => U.textAlt(l, 1)), ...textOf(lb).filter((r) => U.isVisible(r)).map((r) => U.textAlt(r, 1))].join(' '));
    const fs = el.closest('fieldset');
    const legend = fs ? fs.querySelector(':scope > legend') : null;
    const group = el.closest('[role=group],[role=radiogroup]');
    const groupLabelled = !!((legend && visibleText(legend)) || (group && (group.getAttribute('aria-labelledby') || '').split(/\s+/).some((i) => visibleText(document.getElementById(i)))));
    const desc = textOf((el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)).map((d) => U.collapse(d.innerText || d.textContent || '')).join(' ');
    return {
      id: U.id(el),
      selector: U.selector(el),
      snippet: U.snippet(el),
      source: U.sourceOf(el),
      bbox: U.docRect(el),
      tag,
      type,
      name: el.getAttribute('name') || '',
      idAttr: el.id || '',
      autocomplete: (el.getAttribute('autocomplete') || '').trim().toLowerCase(),
      placeholder: el.getAttribute('placeholder') || '',
      required: el.required || el.getAttribute('aria-required') === 'true',
      labelSource: source,
      labelText: labelText.slice(0, 120),
      labelVisible: visible,
      labelVisibleText: labelVisibleText.slice(0, 160),
      labelColor: labels[0] && U.isVisible(labels[0]) ? getComputedStyle(labels[0]).color : null,
      groupLabelled,
      desc: desc.slice(0, 200),
      inputmode: el.getAttribute('inputmode') || '',
      maxlength: el.maxLength > 0 ? el.maxLength : null,
      visible: U.isVisible(el),
      search: type === 'search' || !!el.closest('[role=search]') || /\bsearch\b|搜索/i.test(`${el.name} ${el.id} ${el.placeholder} ${labelText}`),
    };
  };
  const out = [];
  const seenFields = new Set();
  for (const f of document.querySelectorAll('form')) {
    if (!U.isVisible(f)) continue;
    const els = [...f.querySelectorAll(FIELD)].filter((x) => !x.disabled && !x.closest('[aria-hidden="true"]') && (U.isVisible(x) || (x.labels && [...x.labels].some((l) => U.isVisible(l)))));
    if (!els.length) continue;
    els.forEach((x) => seenFields.add(x));
    const submit = [...f.querySelectorAll('button:not([type]),button[type=submit],input[type=submit],input[type=image]')].find((b) => U.isVisible(b) && !U.isDisabled(b));
    out.push({ id: U.id(f), selector: U.selector(f), kind: 'form', name: U.accName(f).slice(0, 80) || f.id || f.getAttribute('name') || '', novalidate: f.noValidate, submit: submit ? { id: U.id(submit), selector: U.selector(submit), name: U.accName(submit).slice(0, 80) } : null, fields: els.map(fieldInfo) });
  }
  // Groups of inputs with a submit-like button outside any form.
  for (const b of document.querySelectorAll('button,[role=button],input[type=button]')) {
    if (b.closest('form') || !U.isVisible(b) || U.isDisabled(b)) continue;
    const name = U.accName(b);
    if (!SUBMIT_RE.test(name)) continue;
    let root = null;
    for (let a = b.parentElement, d = 0; a && a !== document.body && d < 5; a = a.parentElement, d += 1) {
      const els = [...a.querySelectorAll(FIELD)].filter((x) => !x.closest('form') && !seenFields.has(x) && U.isVisible(x));
      if (els.length) {
        root = { a, els };
        break;
      }
    }
    if (!root) continue;
    root.els.forEach((x) => seenFields.add(x));
    out.push({ id: U.id(root.a), selector: U.selector(root.a), kind: 'group', name: name.slice(0, 80), novalidate: true, submit: { id: U.id(b), selector: U.selector(b), name: name.slice(0, 80) }, fields: root.els.map(fieldInfo) });
  }
  const captcha = [...document.querySelectorAll('iframe[src*="recaptcha"],iframe[src*="hcaptcha"],iframe[src*="turnstile"],.g-recaptcha,.h-captcha,.cf-turnstile,[class*="captcha" i],[id*="captcha" i],img[alt*="captcha" i],input[name*="captcha" i]')].filter((x) => U.isVisible(x)).slice(0, 5).map((x) => U.selector(x));
  return { forms: out, captcha };
}

/** Synthetic paste into a field: blocked when a handler cancels it. Untrusted events never insert text. */
function pasteBlocked(id) {
  const el = window.__uie.el(id);
  if (!el) return null;
  const dt = new DataTransfer();
  dt.setData('text/plain', 'Pasted-Secret-1');
  const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true, composed: true });
  el.dispatchEvent(ev);
  const before = new InputEvent('beforeinput', { inputType: 'insertFromPaste', data: 'Pasted-Secret-1', bubbles: true, cancelable: true, composed: true });
  el.dispatchEvent(before);
  return { paste: ev.defaultPrevented, beforeinput: before.defaultPrevented, attr: el.getAttribute('onpaste') || null };
}

/** Per-field state used before and after a submission; `red` marks an error-coloured border, ring or label. */
function fieldStates(ids) {
  const U = window.__uie;
  U.reset();
  const reddish = (c) => {
    const m = String(c || '').match(/rgba?\(([^)]+)\)/g) || [];
    return m.some((x) => {
      const [r, g, b, a = 1] = x.replace(/rgba?\(|\)/g, '').split(/[,\s/]+/).filter(Boolean).map(Number);
      if (a < 0.3) return false;
      const R = r / 255;
      const G = g / 255;
      const B = b / 255;
      const max = Math.max(R, G, B);
      const min = Math.min(R, G, B);
      const l = (max + min) / 2;
      const d = max - min;
      if (d < 0.05) return false;
      const sat = d / (1 - Math.abs(2 * l - 1));
      let h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
      h = (h * 60 + 360) % 360;
      return (h >= 345 || h <= 20) && sat >= 0.45 && l >= 0.2 && l <= 0.75;
    });
  };
  return ids.map((id) => {
    const el = U.el(id);
    if (!el) return { id, gone: true };
    const s = getComputedStyle(el);
    const label = el.labels && el.labels[0] ? getComputedStyle(el.labels[0]).color : null;
    const ring = s.outlineStyle !== 'none' ? s.outlineColor : '';
    return {
      id,
      ariaInvalid: el.getAttribute('aria-invalid'),
      valid: el.validity ? el.validity.valid : true,
      message: el.validationMessage || '',
      red: reddish(s.borderTopColor) || reddish(s.borderBottomColor) || reddish(s.borderLeftColor) || reddish(ring) || reddish(s.boxShadow) || reddish(label),
      look: [s.borderTopColor, s.borderBottomColor, s.borderLeftColor, s.outlineColor, s.outlineStyle, s.backgroundColor, s.boxShadow, label].join('|'),
      describedby: (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean),
      errormessage: (el.getAttribute('aria-errormessage') || '').split(/\s+/).filter(Boolean),
    };
  });
}

/** After a submission: for every changed text, the fields that reference it, the label it sits in, summary links. */
function errorLinks({ fieldIds, changedIds }) {
  const U = window.__uie;
  const ERR_RE = /required|invalid|must|enter|please|can['’]?t be|cannot be|missing|incorrect|wrong|not valid|isn['’]?t valid|too (?:short|long)|at least|at most|doesn['’]?t match|error|problem|check|必填|请输入|不能为空|错误|无效|格式|不正确|有误|请填写|不得|至少|最多|请检查/i;
  // "feedback" alone is not an error class (Bootstrap's valid-feedback is a success note; invalid-feedback matches "invalid").
  const CLS_RE = /error|invalid|danger|warning|alert|validation|help-block|problem/i;
  const fields = fieldIds.map((i) => U.el(i)).filter(Boolean);
  const reddish = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return false;
    const [r, g, b] = m[1].split(/[,\s/]+/).map(Number);
    return r >= 150 && r - Math.max(g, b) >= 60;
  };
  const out = [];
  for (const cid of changedIds) {
    const el = U.el(cid);
    if (!el) continue;
    const refBy = [];
    const inLabelOf = [];
    for (const f of fields) {
      const refs = [...(f.getAttribute('aria-describedby') || '').split(/\s+/), ...(f.getAttribute('aria-errormessage') || '').split(/\s+/)].filter(Boolean).map((i) => document.getElementById(i)).filter(Boolean);
      if (refs.some((r) => r === el || r.contains(el))) refBy.push(U.id(f));
      const labs = f.labels ? [...f.labels] : [];
      if (labs.some((l) => l === el || l.contains(el))) inLabelOf.push(U.id(f));
    }
    // A summary: a container of this text with in-page links to the fields.
    const summaryLinks = [];
    let summary = null;
    for (let a = el, d = 0; a && a !== document.body && d < 5; a = a.parentElement, d += 1) {
      const links = [...a.querySelectorAll('a[href^="#"]')];
      const targets = links.map((l) => {
        const h = decodeURIComponent(l.getAttribute('href').slice(1));
        const t = h ? document.getElementById(h) || document.getElementsByName(h)[0] : null;
        return t ? fields.find((f) => f === t || t.contains(f)) : null;
      }).filter(Boolean);
      if (targets.length) {
        summary = a;
        targets.forEach((t) => summaryLinks.push(U.id(t)));
        break;
      }
    }
    let nearest = null;
    const r = el.getBoundingClientRect();
    for (const f of fields) {
      const fr = f.getBoundingClientRect();
      const dx = Math.max(0, fr.left - r.right, r.left - fr.right);
      const dy = Math.max(0, fr.top - r.bottom, r.top - fr.bottom);
      const dist = Math.hypot(dx, dy);
      if (!nearest || dist < nearest.dist) nearest = { id: U.id(f), dist: Math.round(dist) };
    }
    const s = getComputedStyle(el);
    const hint = `${el.id} ${typeof el.className === 'string' ? el.className : ''} ${el.parentElement ? `${el.parentElement.id} ${typeof el.parentElement.className === 'string' ? el.parentElement.className : ''}` : ''}`;
    const text = U.ownText(el) || U.collapse(el.innerText || '');
    out.push({
      id: cid,
      text: text.slice(0, 200),
      errorish: !!(el.closest('[role=alert]') || CLS_RE.test(hint) || reddish(s.color) || ERR_RE.test(text) || refBy.length || summaryLinks.length),
      refBy,
      inLabelOf,
      summaryLinks: [...new Set(summaryLinks)],
      summary: summary ? U.id(summary) : null,
      nearest,
    });
  }
  const active = window.__uieProbe.deepActive();
  let focusSummary = null;
  for (const o of out) {
    if (o.summary === null) continue;
    const sEl = U.el(o.summary);
    if (sEl && active && (sEl === active || sEl.contains(active))) focusSummary = o.summary;
  }
  return { links: out, focus: active && active !== document.body ? U.id(active) : null, focusSummary };
}

const fieldLabel = (f) => (f.labelText ? `"${f.labelText.slice(0, 40)}"` : f.name ? `field "${f.name}"` : f.selector.slice(0, 50));

export async function run(ctx) {
  const stats = { forms_probed: 0, submissions: 0, skipped: [], outcomes: [], fields: 0, captcha: [] };
  const guard = pageGuard(ctx);
  for await (const pg of ctx.pages(ctx.states({ widths: 'g2', themes: 'first' }))) {
    await guard(pg.ps, () => probePage(ctx, pg, stats));
  }
  guard.finish();
  if (stats.captcha.length) ctx.note('CAPTCHA-like elements found: the cognitive-function-test clause of A11Y-14 (3.3.8) is judged by the accessibility auditor');
  ctx.note('3.3.7 redundant entry is judged (A11Y-27), not scripted here; required fields count as indicated in text when required ones carry a marker (*, "required", 必填) or every optional one says "optional"');
  ctx.note('visible label: a visible <label> or aria-labelledby text; aria-label or title alone counts only for search fields and fields inside a visibly labelled fieldset or group');
  const rel = ctx.writeEvidence('forms/submissions.json', { outcomes: stats.outcomes, skipped: stats.skipped });
  ctx.record({ forms_probed: stats.forms_probed, submissions: stats.submissions, fields_checked: stats.fields, skipped: stats.skipped.slice(0, 30), outcomes: stats.outcomes.slice(0, 40), outcomes_file: rel, captcha_detected: stats.captcha.slice(0, 10), exercised_error_states: stats.outcomes.filter((o) => /error state/.test(o.outcome)).length });
  return [];
}

async function probePage(ctx, pg, stats) {
  const { page, ps } = pg;
  trackRequests(page);
  await ensureProbeLib(page);
  const inv = await page.evaluate(inventory);
  if (inv.captcha.length) stats.captcha.push({ route: ps.route, state: ps.state, found: inv.captcha });
  for (const form of inv.forms) {
    stats.fields += form.fields.length;
    staticChecks(ctx, ps, form);
    await credentialChecks(ctx, pg, form);
  }
  if (ps.width !== SUBMIT_WIDTH) return; // submissions run once per page state, at the G2 desktop width
  const local = isLocalPage(page);
  let done = 0;
  for (const form of inv.forms) {
    const label = `${form.kind} ${form.name ? `"${form.name}"` : form.selector}`;
    if (!local) {
      stats.skipped.push({ route: ps.route, state: ps.state, form: label, reason: 'non-local host: nothing is submitted (ARCHITECTURE §13)' });
      continue;
    }
    if (!form.submit && !form.fields.some((f) => ['text', 'email', 'search', 'tel', 'url', 'password', 'number'].includes(f.type))) {
      stats.skipped.push({ route: ps.route, state: ps.state, form: label, reason: 'no submit control and no text field for implicit submission' });
      continue;
    }
    if (form.submit && isDestructive(form.submit.name)) {
      stats.skipped.push({ route: ps.route, state: ps.state, form: label, reason: 'destructive-looking submit' });
      continue;
    }
    if (done >= MAX_FORMS) {
      stats.skipped.push({ route: ps.route, state: ps.state, form: label, reason: `cap of ${MAX_FORMS} forms per page state` });
      continue;
    }
    // A form's error behaviour belongs to the form, not to the page state: submit it once per route, in the first
    // state that shows it (the default state comes first). A later state may have been reached by submitting it
    // (an "errors" recipe), and probing it there would compare errors against errors.
    const formKey = `${ps.route}|${form.selector || form.name || form.kind}`;
    stats.submittedForms = stats.submittedForms || new Set();
    if (stats.submittedForms.has(formKey)) continue;
    stats.submittedForms.add(formKey);
    done += 1;
    stats.forms_probed += 1;
    for (const kind of ['empty', 'invalid']) {
      const re = await reloadState(ctx, pg);
      if (!re.ok) {
        ctx.error(`${ps.key}: ${re.error}`);
        stats.skipped.push({ route: ps.route, state: ps.state, form: label, reason: re.error });
        break;
      }
      const out = await submission(ctx, pg, form, kind);
      stats.outcomes.push({ route: ps.route, state: ps.state, form: label, submission: kind, outcome: out });
      if (out !== 'no invalid value applies') stats.submissions += 1;
    }
  }
}

function staticChecks(ctx, ps, form) {
  const where = (f) => ctx.loc(ps, { selector: f.selector, bbox: f.bbox, snippet: f.snippet, source: f.source });
  for (const f of form.fields) {
    // Programmatic label; placeholder-only does not count (3.3.2, 1.3.1; axe passes it via non-empty-placeholder).
    if (f.labelSource === 'none' || f.labelSource === 'placeholder') {
      ctx.add(ctx.hit({
        rule: 'A11Y-13',
        wcag: ['3.3.2', '1.3.1'],
        title: f.labelSource === 'placeholder' ? `Input labelled only by its placeholder: ${fieldLabel(f)}` : `Input has no label: ${f.selector.slice(0, 50)}`,
        description: f.labelSource === 'placeholder'
          ? `The ${f.type} field's only name is its placeholder "${f.placeholder.slice(0, 60)}", which disappears as soon as someone types and is not a label.`
          : `The ${f.type} field has no label, aria-labelledby, aria-label or title, so neither people nor assistive technology know what it asks for.`,
        location: where(f),
        evidence: [{ type: 'measurement', value: { label_source: f.labelSource }, detail: `accessible name from ${f.labelSource}${f.placeholder ? `; placeholder "${f.placeholder.slice(0, 40)}"` : ''}` }],
        recommendation: 'Add a visible <label for> in the shared field component (CMP-17); keep the placeholder for an example at most.',
      }));
      continue;
    }
    if (!f.labelVisible && ['aria-label', 'title'].includes(f.labelSource) && !f.search && !f.groupLabelled && f.visible) {
      ctx.add(ctx.hit({
        rule: 'A11Y-13',
        wcag: ['3.3.2'],
        title: `Input has no visible label: ${fieldLabel(f)}`,
        description: `The ${f.type} field is named "${f.labelText.slice(0, 60)}" only through ${f.labelSource}; sighted users see no persistent label for it.`,
        location: where(f),
        evidence: [{ type: 'measurement', value: { label_source: f.labelSource, visible_label: false }, detail: `name from ${f.labelSource} only` }],
        recommendation: 'Show the label as visible text tied to the field with <label for> (or aria-labelledby).',
      }));
    }
  }
  // Required fields in text, not by colour alone (3.3.2): needed when required and optional fields are mixed.
  const req = form.fields.filter((f) => f.required);
  const opt = form.fields.filter((f) => !f.required && f.type !== 'checkbox');
  const reqMarked = (f) => /\*|\brequired\b|\bmandatory\b|必填|必须|必需/i.test(`${f.labelVisibleText} ${f.desc}`);
  const optMarked = (f) => /\boptional\b|可选|选填|非必填/i.test(`${f.labelVisibleText} ${f.desc}`);
  if (req.length && opt.length && !opt.every(optMarked)) {
    const colours = new Set(opt.map((f) => f.labelColor).filter(Boolean));
    for (const f of req.filter((x) => !reqMarked(x) && x.labelVisible)) {
      const colourOnly = f.labelColor && colours.size && !colours.has(f.labelColor);
      ctx.add(ctx.hit({
        rule: 'A11Y-13',
        wcag: colourOnly ? ['3.3.2', '1.4.1'] : ['3.3.2'],
        title: `Required field not indicated in text: ${fieldLabel(f)}`,
        description: `${fieldLabel(f)} is required, but neither its label nor its description says so in text and the optional fields are not marked "optional"${colourOnly ? '; only its label colour differs from the optional fields' : ''}.`,
        location: ctx.loc(ps, { selector: f.selector, bbox: f.bbox, snippet: f.snippet, source: f.source }),
        evidence: [{ type: 'measurement', value: { required: true, text_marker: false, colour_only: !!colourOnly }, detail: `label "${f.labelVisibleText.slice(0, 60)}"${colourOnly ? `; label colour ${f.labelColor} vs ${[...colours].join(', ')}` : ''}` }],
        recommendation: 'Mark required fields in the label text ("(required)" or an explained *), or mark the optional ones "(optional)".',
      }));
    }
  }
  // autocomplete on personal-data fields (1.3.5); credential purposes go to A11Y-14.
  for (const f of form.fields) {
    if (f.search || ['checkbox', 'radio', 'file', 'range', 'color', 'hidden', 'submit'].includes(f.type) || f.type === 'password') continue;
    const hint = `${f.labelText} ${f.name} ${f.idAttr} ${f.placeholder}`;
    if (OTHER_PERSON.test(hint)) continue;
    const p = purposeOf(f, form);
    if (!p || p.credential) continue;
    const token = fieldToken(f.autocomplete);
    if (token && p.accept.includes(token)) continue;
    if (/\b(shipping|billing)\b/.test(f.autocomplete) && token && p.accept.includes(token)) continue;
    ctx.add(ctx.hit({
      rule: 'A11Y-13',
      wcag: ['1.3.5'],
      title: token ? `Wrong autocomplete token on ${p.purpose} field: ${fieldLabel(f)}` : `Personal-data field without autocomplete: ${fieldLabel(f)}`,
      description: token
        ? `${fieldLabel(f)} collects the user's ${p.purpose} but declares autocomplete="${f.autocomplete}"; browsers and assistive tools cannot identify its purpose.`
        : `${fieldLabel(f)} collects the user's ${p.purpose} but has ${f.autocomplete ? `autocomplete="${f.autocomplete}"` : 'no autocomplete attribute'}, so autofill and personalisation tools cannot identify it.`,
      location: ctx.loc(ps, { selector: f.selector, bbox: f.bbox, snippet: f.snippet, source: f.source }),
      evidence: [{ type: 'measurement', value: { purpose: p.purpose, autocomplete: f.autocomplete || null, expected: p.accept }, detail: `expected autocomplete="${p.accept[0]}"` }],
      recommendation: `Add autocomplete="${p.accept[0]}" to the field.`,
    }));
  }
}

export function fieldToken(ac) {
  const toks = String(ac || '').toLowerCase().split(/\s+/).filter(Boolean).filter((t) => t !== 'webauthn');
  for (let i = toks.length - 1; i >= 0; i -= 1) if (AUTOFILL.has(toks[i])) return toks[i];
  return null;
}

const TEXTUAL = ['text', 'email', 'tel', 'url', 'number', 'password'];
const SELECT_PURPOSES = ['country', 'cc-exp', 'bday', 'address-level2'];

// 1.3.5 lists payment cards only (cc-number). A library, gift, loyalty or member card number has no input purpose.
const OTHER_CARD = /\b(library|gift|loyalty|member(?:ship)?|student|id|identity|insurance|health|transit|travel|sim|rewards?|store|club|access|staff|employee|patron|reader|discount|bonus)\s*card\b|借书证|会员卡|礼品卡|积分卡|学生证|医保卡|交通卡/i;
const PAYMENT_WORD = /\b(credit|debit|payment|pay|cc-?num|visa|mastercard|amex)\b|信用卡|借记卡|银行卡|支付/i;

/** A "card number" field asks for a payment card: no other card type is named, and the hint or the form says payment. */
function paymentCard(hint, form) {
  if (OTHER_CARD.test(hint)) return false;
  if (PAYMENT_WORD.test(hint)) return true;
  const csc = PURPOSES.find((x) => x.purpose === 'cc-csc');
  const exp = PURPOSES.find((x) => x.purpose === 'cc-exp');
  const holder = PURPOSES.find((x) => x.purpose === 'cc-name');
  return form.fields.some((x) => {
    const h = `${x.labelText || ''} | ${x.name || ''} | ${x.idAttr || ''} | ${x.placeholder || ''}`;
    return csc.re.test(h) || exp.re.test(h) || holder.re.test(h);
  });
}

export function purposeOf(f, form) {
  if (f.type === 'email') return PURPOSES.find((p) => p.purpose === 'email');
  if (f.type === 'tel') return PURPOSES.find((p) => p.purpose === 'tel');
  if (!TEXTUAL.includes(f.type) && f.type !== 'select' && f.type !== 'textarea') return null;
  const bare = String(f.labelText || '').replace(/\((?:required|optional)\)|\*|[:：]|必填|选填|可选/gi, ' ').replace(/\s+/g, ' ').trim();
  const hint = `${bare} | ${f.name} | ${f.idAttr} | ${f.placeholder}`;
  const hasPassword = form.fields.some((x) => x.type === 'password');
  for (const p of PURPOSES) {
    if (p.purpose === 'username' && !hasPassword) continue;
    if (f.type === 'select' && !SELECT_PURPOSES.includes(p.purpose)) continue;
    if (f.type === 'textarea' && p.purpose !== 'street-address') continue;
    if (p.purpose === 'cc-number' && p.re.test(hint) && !paymentCard(hint, form)) continue;
    if (p.purpose === 'name') {
      if (/^(?:your |full |first and last )?name$|^姓名$/i.test(bare) || /^(name|full[-_]?name|fullname|your[-_]?name)$/i.test(f.name) || /^(name|full[-_]?name|fullname)$/i.test(f.idAttr)) return p;
      continue;
    }
    if (p.re.test(hint)) return p;
  }
  if (hasPassword && ['text', 'email'].includes(f.type)) {
    const pw = form.fields.findIndex((x) => x.type === 'password');
    const idx = form.fields.indexOf(f);
    if (idx >= 0 && idx < pw && idx === pw - 1) return PURPOSES.find((p) => p.purpose === 'username');
  }
  return null;
}

async function credentialChecks(ctx, pg, form) {
  const { page, ps } = pg;
  const pw = form.fields.filter((f) => f.type === 'password');
  const otpP = PURPOSES.find((p) => p.purpose === 'one-time-code');
  const otp = form.fields.filter((f) => f.type !== 'password' && otpP.re.test(`${f.labelText} ${f.name} ${f.idAttr} ${f.placeholder}`) && !/\b(cvc|cvv|csc)\b/i.test(`${f.labelText} ${f.name}`));
  const userP = PURPOSES.find((p) => p.purpose === 'username');
  const users = pw.length ? form.fields.filter((f) => f.type !== 'password' && purposeOf(f, form) === userP) : [];
  const newPw = pw.length >= 2 || pw.some((f) => /\b(new|create|choose|confirm|repeat|retype)\b|新密码|确认密码|设置密码|再次/i.test(`${f.labelText} ${f.name} ${f.idAttr}`));
  const checks = [
    ...pw.map((f) => ({ f, kind: 'password', accept: newPw ? ['new-password'] : ['current-password', 'new-password'], paste: true })),
    ...otp.map((f) => ({ f, kind: 'one-time code', accept: ['one-time-code'], paste: true })),
    ...users.map((f) => ({ f, kind: 'username', accept: userP.accept, paste: false })),
  ];
  for (const c of checks) {
    const { f } = c;
    const token = fieldToken(f.autocomplete);
    if (!token || !c.accept.includes(token)) {
      ctx.add(ctx.hit({
        rule: 'A11Y-14',
        wcag: ['3.3.8', '1.3.5'],
        title: `${c.kind[0].toUpperCase()}${c.kind.slice(1)} field without the right autocomplete token: ${fieldLabel(f)}`,
        description: `The ${c.kind} field ${fieldLabel(f)} has ${f.autocomplete ? `autocomplete="${f.autocomplete}"` : 'no autocomplete attribute'}; password managers need autocomplete="${c.accept[0]}" to fill it, so people must remember and type the credential.`,
        location: ctx.loc(ps, { selector: f.selector, bbox: f.bbox, snippet: f.snippet, source: f.source }),
        evidence: [{ type: 'measurement', value: { kind: c.kind, autocomplete: f.autocomplete || null, expected: c.accept }, detail: `expected autocomplete="${c.accept.join('" or "')}"` }],
        recommendation: `Set autocomplete="${c.accept[0]}" on the field.`,
      }));
    }
    if (!c.paste) continue;
    const res = await page.evaluate(pasteBlocked, f.id).catch(() => null);
    if (res && (res.paste || res.beforeinput)) {
      ctx.add(ctx.hit({
        rule: 'A11Y-14',
        wcag: ['3.3.8'],
        title: `Paste is blocked in the ${c.kind} field: ${fieldLabel(f)}`,
        description: `A paste into ${fieldLabel(f)} is cancelled by the page (${res.paste ? 'paste event' : 'beforeinput insertFromPaste'} defaultPrevented${res.attr ? `; onpaste="${res.attr.slice(0, 40)}"` : ''}), which forces people to transcribe the credential instead of using a password manager or a copied code.`,
        location: ctx.loc(ps, { selector: f.selector, bbox: f.bbox, snippet: f.snippet, source: f.source }),
        evidence: [{ type: 'probe', value: { paste_prevented: !!res.paste, beforeinput_prevented: !!res.beforeinput }, detail: 'synthetic paste event was cancelled' }],
        recommendation: 'Remove the paste handler (and any key-blocking) from credential fields.',
      }));
    }
  }
}

async function submission(ctx, pg, form, kind) {
  const { page, ps } = pg;
  const formId = await page.evaluate(({ selector }) => {
    try {
      const el = document.querySelector(selector);
      return el ? window.__uie.id(el) : null;
    } catch {
      return null;
    }
  }, { selector: form.selector });
  if (formId === null) return 'form not found after reload';
  const fields = (await page.evaluate(formFields, formId)) || [];
  const map = new Map(form.fields.map((f) => [f.selector, f]));
  const ids = await page.evaluate((sels) => sels.map((s) => {
    try {
      const el = document.querySelector(s);
      return el ? window.__uie.id(el) : null;
    } catch {
      return null;
    }
  }), form.fields.map((f) => f.selector));
  const byId = new Map();
  form.fields.forEach((f, i) => {
    if (ids[i] !== null) byId.set(ids[i], f);
  });
  if (kind === 'invalid') {
    const invalid = fields.filter((f) => invalidValue(f) !== null);
    if (!invalid.length) return 'no invalid value applies';
    await fillFields(page, fields, (f) => invalidValue(f) ?? plausibleValue(f));
  }
  if (kind === 'empty') {
    // An empty submission is empty: prefilled text-like values (a default quantity of 10) are cleared first, otherwise
    // the form saves and its success note is judged as if it were an error message.
    await fillFields(page, fields, (f) => (TEXT_LIKE.has(f.type) || f.tag === 'textarea' ? '' : null));
  }
  const fieldIds = [...byId.keys()];
  // Snapshots are taken without focus or hover so neither reads as an error style.
  await page.evaluate(() => {
    const a = window.__uieProbe.deepActive();
    if (a && a !== document.body && a.blur) a.blur();
  });
  await page.mouse.move(0, 0).catch(() => {});
  const before = await page.evaluate(fieldStates, fieldIds);
  const submitId = form.submit ? await page.evaluate(({ selector }) => {
    try {
      const el = document.querySelector(selector);
      return el ? window.__uie.id(el) : null;
    } catch {
      return null;
    }
  }, { selector: form.submit.selector }) : null;
  await page.evaluate((t) => window.__uieProbe.arm({ triggerId: t }), submitId);
  if (submitId !== null) {
    const c = await clickId(page, submitId);
    if (!c.ok) return `could not activate the submit control: ${c.error}`;
  } else {
    const first = fields.find((f) => ['text', 'email', 'search', 'tel', 'url', 'password', 'number'].includes(f.type));
    const h = first ? await handleFor(page, first.id) : null;
    if (!h) return 'no field for implicit submission';
    await h.press('Enter').catch(() => {});
    await h.dispose().catch(() => {});
  }
  await waitSettled(page, { maxMs: 4000, quietMs: 300 });
  const res = await page.evaluate(() => window.__uieProbe.result()).catch(() => null);
  await page.evaluate(() => window.__uieProbe && window.__uieProbe.disarm()).catch(() => {});
  if (!res) return 'navigated away (no error state on this page)';
  if (res.urlChanged) return 'navigated (no error state on this page)';
  if (res.invalids > 0 && res.submits === 0) return 'blocked by browser constraint validation (browser supplies text, association and focus)';
  const changedIds = res.changed.filter((c) => !c.inTrigger).map((c) => c.id);
  const links = await page.evaluate(errorLinks, { fieldIds, changedIds });
  await page.evaluate(() => {
    const a = window.__uieProbe.deepActive();
    if (a && a !== document.body && a.blur) a.blur();
  });
  await page.mouse.move(0, 0).catch(() => {});
  const after = await page.evaluate(fieldStates, fieldIds);
  const errTexts = links.links.filter((l) => l.errorish && l.text);
  const beforeById = new Map(before.map((b) => [b.id, b]));
  const invalid = [];
  for (const a of after) {
    if (a.gone) continue;
    const b = beforeById.get(a.id) || {};
    const f = byId.get(a.id);
    if (!f) continue;
    const texts = errTexts.filter((t) => t.refBy.includes(a.id) || t.inLabelOf.includes(a.id) || t.summaryLinks.includes(a.id) || (t.nearest && t.nearest.id === a.id && t.nearest.dist <= 64 && t.summary === null));
    const flagged = a.ariaInvalid === 'true' && b.ariaInvalid !== 'true';
    const looks = !!a.red && !b.red; // an error colour appeared on the field or its label
    if (!flagged && !texts.length && !looks) continue;
    invalid.push({ a, f, texts, flagged, looks });
  }
  if (!invalid.length && !errTexts.length) return 'no error state produced';
  const loc = (f) => ctx.loc(ps, { selector: f.selector, bbox: f.bbox, snippet: f.snippet, source: f.source });
  const how = kind === 'empty' ? 'an empty submission' : 'a submission with invalid values';
  for (const { a, f, texts, flagged, looks } of invalid) {
    const own = texts.filter((t) => !t.summaryLinks.includes(a.id) || t.refBy.includes(a.id) || t.inLabelOf.includes(a.id));
    if (!texts.length) {
      ctx.add(ctx.hit({
        rule: 'A11Y-13',
        wcag: looks ? ['3.3.1', '1.4.1'] : ['3.3.1'],
        title: `Error not described in text: ${fieldLabel(f)}`,
        description: `After ${how}, ${fieldLabel(f)} is marked as wrong (${[flagged && 'aria-invalid="true"', looks && 'an error colour on its border, ring or label'].filter(Boolean).join(', ')}) but no text says what is wrong or how to fix it.`,
        location: loc(f),
        evidence: [{ type: 'probe', value: { submission: kind, aria_invalid: a.ariaInvalid, style_changed: looks }, detail: `${how}: error indicated without text` }],
        recommendation: 'Show an error message in text next to the field and reference it with aria-describedby.',
      }));
      continue;
    }
    if (a.ariaInvalid !== 'true') {
      ctx.add(ctx.hit({
        rule: 'A11Y-13',
        wcag: ['3.3.1'],
        title: `Field with an error is not marked aria-invalid: ${fieldLabel(f)}`,
        description: `After ${how}, the message "${texts[0].text.slice(0, 80)}" is shown for ${fieldLabel(f)}, but the field does not carry aria-invalid="true", so assistive technology does not report it as invalid.`,
        location: loc(f),
        evidence: [{ type: 'probe', value: { submission: kind, aria_invalid: a.ariaInvalid }, detail: `${how}: "${texts[0].text.slice(0, 60)}"` }],
        recommendation: 'Set aria-invalid="true" on fields with an error (and remove it once fixed).',
      }));
    }
    const associated = texts.some((t) => t.refBy.includes(a.id) || t.inLabelOf.includes(a.id) || t.summaryLinks.includes(a.id));
    if (!associated) {
      ctx.add(ctx.hit({
        rule: 'A11Y-13',
        wcag: ['1.3.1', '3.3.1'],
        title: `Error message not tied to its field: ${fieldLabel(f)}`,
        description: `After ${how}, the message "${(own[0] || texts[0]).text.slice(0, 80)}" appears next to ${fieldLabel(f)} but is not referenced by its aria-describedby or aria-errormessage, not inside its label, and no error summary links to the field.`,
        location: loc(f),
        evidence: [{ type: 'probe', value: { submission: kind, associated: false }, detail: `${how}: message ${texts[0].nearest ? `${texts[0].nearest.dist} px away` : 'nearby'}, not referenced` }],
        recommendation: 'Reference the message from the field with aria-describedby (or aria-errormessage), or link to the field from an error summary.',
      }));
    }
  }
  // Focus moves to the first error or to the error summary (fields are in DOM order).
  const firstInvalid = fieldIds.find((id) => invalid.some((x) => x.a.id === id)) ?? null;
  const onFirst = links.focus !== null && links.focus === firstInvalid;
  const onSummary = links.focusSummary !== null;
  const focusOnErrorText = links.focus !== null && errTexts.some((t) => t.id === links.focus);
  if (!onFirst && !onSummary && !focusOnErrorText) {
    const target = invalid.length ? invalid[0].f : form.fields[0];
    const focusDesc = links.focus === null ? 'nowhere (the page body)' : links.focus === submitId ? 'the submit control' : res.focus ? res.focus.selector : 'another element';
    ctx.add(ctx.hit({
      rule: 'A11Y-13',
      wcag: [],
      title: `Focus does not move to the first error or the error summary: ${form.kind} ${form.name ? `"${form.name.slice(0, 30)}"` : form.selector.slice(0, 40)}`,
      description: `After ${how}, focus stays on ${focusDesc} instead of moving to the first field with an error or to an error summary, so keyboard and screen-reader users are not taken to the problem.`,
      location: ctx.loc(ps, { selector: target.selector, bbox: target.bbox, snippet: target.snippet, source: target.source }),
      evidence: [{ type: 'probe', value: { submission: kind, focus: res.focus ? res.focus.selector : null }, detail: `${how}: focus on ${res.focus ? res.focus.selector : 'body'}` }],
      recommendation: 'On a failed submit, move focus to an error summary (role="alert", tabindex="-1") that links to each field, or to the first invalid field.',
    }));
  }
  // CPY-04 on the exercised error texts.
  const seen = new Set();
  for (const t of errTexts) {
    const msg = t.text.replace(/\s+/g, ' ').trim();
    if (!msg || seen.has(msg)) continue;
    seen.add(msg);
    const generic = [...matchList(wordList('en', 'error_generic'), msg), ...matchList(wordList('zh', 'error_generic'), msg)];
    const blame = [...matchList(wordList('en', 'error_blame'), msg), ...matchList(wordList('zh', 'error_blame'), msg)];
    if (!generic.length && !blame.length) continue;
    const field = byId.get(t.refBy[0] ?? t.inLabelOf[0] ?? (t.nearest ? t.nearest.id : null)) || invalid[0]?.f || form.fields[0];
    const c = res.changed.find((x) => x.id === t.id);
    ctx.add(ctx.hit({
      rule: 'CPY-04',
      title: `${generic.length ? 'Generic' : 'Blaming'} error message: "${msg.slice(0, 50)}"`,
      description: `After ${how}, the form shows "${msg.slice(0, 120)}"${field ? ` for ${fieldLabel(field)}` : ''}; it ${generic.length ? 'names no problem and no fix' : 'blames the person'} (${[...generic, ...blame].join(', ')}).`,
      location: c ? ctx.loc(ps, { selector: c.selector, bbox: c.bbox, snippet: c.snippet, source: c.source }) : ctx.loc(ps, { selector: field.selector, bbox: field.bbox, snippet: field.snippet, source: field.source }),
      evidence: [{ type: 'probe', value: { text: msg.slice(0, 120), matched: [...generic, ...blame] }, detail: `${how}: "${msg.slice(0, 80)}"` }],
      recommendation: 'Write one message per validation rule that names the field and the fix, e.g. "Enter an email address in the correct format, like name@example.com".',
    }));
  }
  return `error state: ${invalid.length} field(s) flagged, ${errTexts.length} error text(s)`;
}
