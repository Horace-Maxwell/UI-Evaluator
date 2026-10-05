// Accessibility source rules.
// Gate (G2): A11Y-17 pointer and keyboard static checks — down-event-only activation (2.5.2), unmodified
//            single-character shortcuts (2.1.4), dragging without a single-pointer alternative (2.5.7), motion
//            actuation (2.5.4); A11Y-14 paste blocked in password or one-time-code fields (3.3.8, static part).
// Advisory (never gate): outline removed without a :focus-visible replacement (CMP-08; A11Y-04 decides in the
//            browser), zoom locks (TYP-19; axe meta-viewport decides under A11Y-01), positive tabindex (2.4.3),
//            clickable non-interactive elements (2.1.1), images without alt (1.1.1), paste blocked in other fields
//            (CMP-17), missing IME composition guard on Enter handlers of text inputs (I18N-14, TOOL-20).
import { cssRules, classGroups, elTokens, hasAncestor } from '../model.mjs';
import { handlers, attr, attrValue } from '../markup.mjs';
import { resolveHandler, listenerCalls, isGlobalTarget, matchBracket, splitArgs } from '../handlers.mjs';
import { splitTopLevel } from '../css.mjs';

export const RULES = [
  { id: 'A11Y-17', level: 'gate', title: 'Pointer and keyboard static checks', fix: 'Activate on click; scope shortcuts to focus or add a modifier and an off switch; add move buttons or click-to-place beside drag; add a button for any motion gesture.' },
  { id: 'A11Y-14', level: 'gate', title: 'Paste blocked in a credential field', wcag: ['3.3.8'], fix: 'Remove the paste handler and add the autocomplete token (current-password, new-password, one-time-code).' },
  { id: 'CMP-08', level: 'advisory', fast: true, title: 'Outline removed without a focus-visible replacement', wcag: ['2.4.7'], fix: 'Draw focus with one shared :focus-visible style built from the focus tokens; never remove outline without it.' },
  { id: 'TYP-19', level: 'advisory', title: 'Zoom locked in the viewport meta', wcag: ['1.4.4'], fix: 'Remove user-scalable=no and maximum-scale below 2 from the viewport meta.' },
  { id: 'WCAG-2.4.3', criterion: { kind: 'wcag', id: '2.4.3' }, level: 'advisory', title: 'Positive tabindex', fix: 'Remove positive tabindex and fix the order in the DOM.' },
  { id: 'WCAG-2.1.1', criterion: { kind: 'wcag', id: '2.1.1' }, level: 'advisory', title: 'Clickable element without keyboard support', wcag: ['4.1.2'], fix: 'Use a <button> or <a href> in the shared component instead of a clickable div or span.' },
  { id: 'WCAG-1.1.1', criterion: { kind: 'wcag', id: '1.1.1' }, level: 'advisory', title: 'Image without alt', fix: 'Add alt text that is equivalent to the image, or alt="" when the image is decorative.' },
  { id: 'CMP-17', level: 'advisory', title: 'Paste blocked in a form field', fix: 'Never block paste; people rely on password managers and copied values.' },
  { id: 'I18N-14', level: 'advisory', fast: true, title: 'Enter handler without an IME composition guard', fix: 'Return early while composing: if (event.isComposing || event.keyCode === 229) return; put the guard in the shared input or hotkey utility.' },
];

function short(s, n = 60) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

// ---- A11Y-17 (a): down-event activation ------------------------------------------------------------------

const DOWN = new Set(['mousedown', 'pointerdown', 'touchstart']);
const UP_OR_MOVE = new Set(['mouseup', 'pointerup', 'touchend', 'pointermove', 'mousemove', 'touchmove', 'click', 'pointercancel']);
const GESTURE = /drag|resize|pan\b|panning|swipe|draw|scrub|slider|range|split|sort|reorder|capture|clientX|clientY|pageX|startX|startY|getBoundingClientRect|ripple/i;
const ACTION_NAME = /submit|delete|remove|open|close|toggle|select|navigate|go(?:To)?\b|save|send|add|buy|pay|confirm|activate|click|choose|pick|apply|start|launch|play/i;

function benignDownBody(body) {
  let b = String(body)
    .replace(/\b\w+\.(?:preventDefault|stopPropagation|stopImmediatePropagation|persist)\(\)/g, '')
    .replace(/\b[\w.]+\.focus\([^)]*\)/g, '')
    .replace(/\bset\w*(?:Pressed|Active|Down|Pressing|Hover(?:ed)?|Focus(?:ed)?|Touch(?:ed)?|Pointer\w*)\([^)]*\)/g, '');
  b = b.replace(/^\s*\(?[^)]*\)?\s*=>/, '').replace(/^\s*(?:async\s+)?function\s*\w*\s*\([^)]*\)/, '');
  const calls = (b.match(/[A-Za-z_$][\w$.]*\s*\(/g) || []).filter((c) => !/^(?:if|for|while|switch|return|function|catch|typeof)\s*\($/.test(c.replace(/\s+/g, '')));
  return calls.length === 0;
}

function downEvents(doc, report) {
  for (const el of doc.elements) {
    const hs = handlers(el);
    const downs = hs.filter((h) => DOWN.has(h.event));
    if (!downs.length) continue;
    if (hs.some((h) => UP_OR_MOVE.has(h.event))) continue;
    if (el.lower === 'input' && /range/i.test(String(attrValue(el, 'type') || ''))) continue;
    if (/slider|scrollbar|separator/i.test(String(attrValue(el, 'role') || ''))) continue;
    for (const h of downs) {
      const expr = h.attr.kind === 'expr' ? h.attr.value : h.attr.value === true ? '' : String(h.attr.value);
      const res = resolveHandler(doc, expr);
      if (!res) continue;
      const nameAndBody = `${res.name || ''} ${res.body || ''}`;
      if (GESTURE.test(nameAndBody) || /modifiers?:\s*\[?['"]?prevent|\.prevent\b/.test(h.attr.name)) continue;
      if (res.body ? benignDownBody(res.body) : !ACTION_NAME.test(res.name || '')) continue;
      report('A11Y-17', doc, h.attr.offset, { message: `${h.attr.name} activates on the ${h.event} event; it cannot be cancelled by moving away (2.5.2)`, value: short(`${h.attr.name}=${expr}`), wcag: ['2.5.2'] });
    }
  }
  for (const l of listenerCalls(doc, [...DOWN])) {
    if (isGlobalTarget(l.target)) continue; // document/window listeners are the click-outside idiom
    if (GESTURE.test(`${l.name || ''} ${l.body || ''} ${l.target}`)) continue;
    if (l.body ? benignDownBody(l.body) : !ACTION_NAME.test(l.name || '')) continue;
    report('A11Y-17', doc, l.offset, { message: `${l.target}.addEventListener('${l.event}') activates on the down event (2.5.2)`, value: short(l.handler), wcag: ['2.5.2'] });
  }
}

// ---- A11Y-17 (b): single-character shortcuts -------------------------------------------------------------

const MODIFIER = /ctrlKey|metaKey|altKey|getModifierState|\bmod\b|e\.ctrl|e\.meta|e\.alt/;
const OFF_SWITCH = /shortcuts?(?:Enabled|Disabled|Off|On)\b|enable\w*Shortcuts?|disable\w*Shortcuts?|keyboardShortcuts|hotkeysEnabled|shortcutsEnabled|settings\.\w*shortcut|remap/i;
const KEY_CODES = new Set([...Array.from({ length: 10 }, (_, i) => 48 + i), ...Array.from({ length: 26 }, (_, i) => 65 + i), 186, 187, 188, 189, 190, 191, 192, 219, 220, 221, 222]);

function singleKeyHits(body) {
  const out = [];
  const b = String(body);
  const push = (key, index) => {
    const around = b.slice(Math.max(0, index - 140), index + 140);
    if (!MODIFIER.test(around)) out.push(key);
  };
  let m;
  const r1 = /\.key\s*(?:\.toLowerCase\(\)|\.toUpperCase\(\))?\s*={2,3}\s*(['"`])([^\s'"`\\])\1/g;
  while ((m = r1.exec(b))) push(m[2], m.index);
  const r2 = /(['"`])([^\s'"`\\])\1\s*={2,3}\s*[\w.]+\.key\b/g;
  while ((m = r2.exec(b))) push(m[2], m.index);
  const r3 = /\.code\s*={2,3}\s*(['"`])(Key[A-Z]|Digit\d|Slash|Period|Comma|Semicolon|Quote|BracketLeft|BracketRight|Backslash|Minus|Equal|Backquote)\1/g;
  while ((m = r3.exec(b))) push(m[2], m.index);
  const r4 = /\.(?:keyCode|which)\s*={2,3}\s*(\d+)/g;
  while ((m = r4.exec(b))) if (KEY_CODES.has(Number(m[1]))) push(`keyCode ${m[1]}`, m.index);
  if (/switch\s*\(\s*[\w.]+\.key(?:\.toLowerCase\(\))?\s*\)/.test(b)) {
    const r5 = /case\s+(['"`])([^\s'"`\\])\1\s*:/g;
    while ((m = r5.exec(b))) push(m[2], m.index);
  }
  const r6 = /\[((?:\s*(['"`])[^\s'"`\\]\2\s*,?)+)\]\.includes\(\s*[\w.]+\.key/g;
  while ((m = r6.exec(b))) push(m[1].replace(/\s+/g, ''), m.index);
  return [...new Set(out)];
}

function shortcuts(doc, report) {
  const offSwitch = OFF_SWITCH.test(doc.code);
  if (offSwitch) return;
  for (const l of listenerCalls(doc, ['keydown', 'keypress', 'keyup'])) {
    if (!isGlobalTarget(l.target) || !l.body) continue;
    const keys = singleKeyHits(l.body);
    if (keys.length) report('A11Y-17', doc, l.offset, { message: `global ${l.event} shortcut on ${keys.map((k) => `"${k}"`).join(', ')} with no modifier, focus scope or off switch (2.1.4)`, value: keys.join(' '), wcag: ['2.1.4'] });
  }
  // Hotkey libraries.
  const code = doc.code;
  const re = /\b(useHotkeys|hotkeys|Mousetrap\.bind|useKeyPress|useKey|tinykeys)\s*\(/g;
  let m;
  while ((m = re.exec(code))) {
    const open = m.index + m[0].length - 1;
    const close = matchBracket(code, open);
    if (close < 0) continue;
    const args = splitArgs(code.slice(open + 1, close - 1));
    if (m[1] === 'tinykeys') {
      const keys = [...String(args[1] || '').matchAll(/(['"`])([^\s'"`+\\])\1\s*:/g)].map((x) => x[2]);
      if (keys.length) report('A11Y-17', doc, m.index, { message: `tinykeys binds single-character key${keys.length > 1 ? 's' : ''} ${keys.join(', ')} (2.1.4)`, value: keys.join(' '), wcag: ['2.1.4'] });
      continue;
    }
    const spec = args[0] || '';
    const strs = [...spec.matchAll(/(['"`])([^'"`]+)\1/g)].map((x) => x[2]);
    const single = strs.flatMap((s) => s.split(',')).map((s) => s.trim()).filter((s) => s.length === 1 && s !== ' ' && !s.includes('+'));
    if (!single.length) continue;
    const opts = args.slice(1).join(',');
    if (/\benabled\s*:/.test(opts)) continue; // an option that can switch the shortcut off
    report('A11Y-17', doc, m.index, { message: `${m[1]} binds single-character key${single.length > 1 ? 's' : ''} ${single.map((k) => `"${k}"`).join(', ')} with no modifier or off switch (2.1.4)`, value: single.join(' '), wcag: ['2.1.4'] });
  }
}

// ---- A11Y-17 (c): dragging without a single-pointer alternative ------------------------------------------

const DND_PKG = /^(?:@dnd-kit\/|react-beautiful-dnd$|@hello-pangea\/dnd$|react-dnd(?:$|-)|sortablejs$|react-sortablejs$|vuedraggable$|vue-draggable-plus$|svelte-dnd-action$|@atlaskit\/pragmatic-drag-and-drop|react-draggable$|react-grid-layout$|@formkit\/drag-and-drop$|dragula$|interactjs$|@shopify\/draggable$|react-movable$)/;
const MOVE_ALT_TEXT = /\bmove\s?(?:up|down|left|right|to|before|after|top|bottom|forward|backward|earlier|later|item|row|card|column)\b|\b(?:上移|下移|移到|置顶|置底)/i;
const MOVE_ALT_CODE = /\b(?:move(?:Up|Down|Left|Right|To|Before|After|Item|Row|Card|Column|Forward|Backward|Earlier|Later|Top|Bottom)|reorder(?:Up|Down)|onMove\w*|handleMove\w*|shift(?:Up|Down)|swap(?:Up|Down|Items?)|bump(?:Up|Down))\b/;

function dragAlternatives(doc, report) {
  let first = null;
  let what = '';
  for (const imp of doc.imports) {
    if (DND_PKG.test(imp.source)) {
      first = first ?? imp.offset;
      what = what || imp.source;
    }
  }
  for (const el of doc.elements) {
    const d = attr(el, 'draggable');
    const v = d ? (d.kind === 'bool' ? 'true' : String(d.value).replace(/[{}\s]/g, '')) : null;
    const dragStart = handlers(el).find((h) => h.event === 'dragstart');
    const preventOnly = dragStart && /^\s*\(?\s*\w*\s*\)?\s*=>\s*\w+\.preventDefault\(\)\s*;?\s*$/.test(String(dragStart.attr.value));
    if ((v === 'true' || (dragStart && !preventOnly)) && el.lower !== 'img') {
      if (first === null || el.offset < first) first = el.offset;
      what = what || (v === 'true' ? 'draggable="true"' : 'a dragstart handler');
    }
  }
  const hook = /\buse(?:Draggable|Sortable|Drag)\s*\(|\bnew\s+Sortable\s*\(|\bSortable\.create\s*\(|<Draggable\b|<Droppable\b/.exec(doc.code);
  if (hook) {
    if (first === null || hook.index < first) first = hook.index;
    what = what || hook[0].replace(/\s*\($/, '');
  }
  if (first === null) return;
  const text = doc.texts.map((t) => t.value).join(' ') + ' ' + doc.elements.flatMap((e) => e.attrs.filter((a) => /aria-label|title/i.test(a.name)).map((a) => String(a.value))).join(' ');
  if (MOVE_ALT_TEXT.test(text) || MOVE_ALT_CODE.test(doc.code)) return;
  report('A11Y-17', doc, first, { message: `dragging (${what}) with no single-pointer alternative such as move buttons or click-to-place (2.5.7)`, value: what, wcag: ['2.5.7'] });
}

// ---- A11Y-17 (d): motion actuation -----------------------------------------------------------------------

function motionActuation(doc, report) {
  const ls = listenerCalls(doc, ['devicemotion', 'deviceorientation', 'deviceorientationabsolute']);
  for (const l of ls) report('A11Y-17', doc, l.offset, { message: `${l.event} handler: device motion must have a UI alternative and a way to turn it off (2.5.4)`, value: l.event, wcag: ['2.5.4'] });
  if (ls.length) return;
  const m = /\b(?:useDeviceMotion|useDeviceOrientation|DeviceMotionEvent\.requestPermission|DeviceOrientationEvent\.requestPermission|new\s+Shake\s*\()/.exec(doc.code);
  if (m) report('A11Y-17', doc, m.index, { message: `${m[0].replace(/\s*\($/, '')}: device motion must have a UI alternative and a way to turn it off (2.5.4)`, value: m[0], wcag: ['2.5.4'] });
  for (const imp of doc.imports) if (/^(?:shake\.js|shake-detector|shakejs)$/.test(imp.source)) report('A11Y-17', doc, imp.offset, { message: `${imp.source}: shake gestures need a UI alternative (2.5.4)`, value: imp.source, wcag: ['2.5.4'] });
}

// ---- paste blocking --------------------------------------------------------------------------------------

const CREDENTIAL = /pass(?:word|code)?\b|passwd|pwd|\botp\b|one[-\s]?time|verification code|security code|\bpin\b|验证码|密码|InputOTP|OtpInput|PinInput|PasswordInput/i;

function isCredentialField(el) {
  const type = String(attrValue(el, 'type') || '').toLowerCase();
  const ac = String(attrValue(el, 'autocomplete') || '').toLowerCase();
  if (type === 'password' || /current-password|new-password|one-time-code/.test(ac)) return true;
  const names = ['name', 'id', 'placeholder', 'aria-label', 'label'].map((n) => attrValue(el, n)).filter((v) => typeof v === 'string').join(' ');
  return CREDENTIAL.test(`${names} ${el.isComponent ? el.tag : ''}`);
}

function pasteBlocking(doc, report) {
  for (const el of doc.elements) {
    for (const h of handlers(el)) {
      if (h.event !== 'paste') continue;
      const v = String(h.attr.value);
      const blocks = /\.prevent\b/.test(h.attr.name) || /preventDefault\(\)|return\s+false/.test(v) || (resolveHandler(doc, v)?.body && /preventDefault\(\)|return\s+false/.test(resolveHandler(doc, v).body));
      if (!blocks) continue;
      if (isCredentialField(el)) report('A11Y-14', doc, h.attr.offset, { message: 'paste is blocked in a password or one-time-code field', value: short(`${h.attr.name}=${v}`) });
      else report('CMP-17', doc, h.attr.offset, { message: 'paste is blocked in a form field', value: short(`${h.attr.name}=${v}`) });
    }
  }
  for (const l of listenerCalls(doc, ['paste'])) {
    if (!l.body || !/preventDefault\(\)|return\s+false/.test(l.body)) continue;
    if (CREDENTIAL.test(l.target)) report('A11Y-14', doc, l.offset, { message: `paste blocked on ${l.target} (a credential field)`, value: short(l.handler) });
    else report('CMP-17', doc, l.offset, { message: `paste blocked on ${l.target}`, value: short(l.handler) });
  }
}

// ---- outline removal (advisory) --------------------------------------------------------------------------

const FOCUSABLE_SEL = /(?:^|[\s,>+~])(?:\*|a|button|input|select|textarea|summary|\[tabindex[^\]]*\]|\[contenteditable[^\]]*\])(?=$|[\s,:.[>+~])|:focus\b(?!-)/i;
const REPLACEMENT_PROP = /^(?:box-shadow|border|border-color|border-width|border-bottom|border-bottom-color|background|background-color|text-decoration|text-decoration-color|outline-color|ring)$/;

/** Pre-pass: selectors that have a :focus-visible style somewhere (and whether a global one exists). */
export function collectFocusVisible(doc, state) {
  state.focusVisible = state.focusVisible || new Set();
  for (const r of cssRules(doc)) {
    if (!/:focus-visible/.test(r.selector)) continue;
    if (!r.decls.some((d) => /^(?:outline|outline-width|outline-style|outline-color|box-shadow|border|border-color)$/.test(d.prop) && !/^(?:none|0|0px)$/.test(d.value.trim()))) continue;
    for (const part of splitTopLevel(r.selector, ',')) {
      const p = part.trim();
      state.focusVisible.add(p.replace(/:focus-visible/g, '').trim() || '*');
      if (/^(?:\*|:root\s+\*)?:focus-visible$|^\*:focus-visible$/.test(p)) state.globalFocusVisible = true;
    }
  }
}

function outlineRemoval(doc, ctx, report) {
  const st = ctx.state;
  for (const r of cssRules(doc)) {
    if (r.inline) continue;
    const kill = r.decls.find((d) => (d.prop === 'outline' && /^(?:none|0|0px)(?:\s|$)/i.test(d.value.trim())) || (d.prop === 'outline-style' && /^none$/i.test(d.value.trim())) || (d.prop === 'outline-width' && /^0(?:px)?$/i.test(d.value.trim())));
    if (!kill) continue;
    if (/:focus-visible/.test(r.selector) && !/:not\(:focus-visible\)/.test(r.selector)) {
      if (r.decls.some((d) => REPLACEMENT_PROP.test(d.prop) && !/^none$/i.test(d.value.trim()))) continue;
    }
    if (/:focus:not\(:focus-visible\)/.test(r.selector)) continue;
    if (!FOCUSABLE_SEL.test(r.selector)) continue;
    if (r.decls.some((d) => REPLACEMENT_PROP.test(d.prop) && !/^(?:none|0|transparent)$/i.test(d.value.trim()))) continue;
    if (st.globalFocusVisible) continue;
    const base = splitTopLevel(r.selector, ',').map((p) => p.replace(/:focus(?:-within)?\b/g, '').trim() || '*');
    if (base.every((b) => st.focusVisible?.has(b))) continue;
    report('CMP-08', doc, kill.offset, { message: `${kill.prop}: ${kill.value} on ${short(r.selector, 50)} with no :focus-visible replacement`, value: `${r.selector} { ${kill.prop}: ${kill.value} }` });
  }
  if (st.globalFocusVisible) return;
  const check = (tokens) => {
    const kill = tokens.find((t) => /^outline-(?:none|hidden|0)$/.test(t.base) && (!t.variants.length || t.variants.every((v) => /^(?:focus|focus-visible|focus-within)$/.test(v))));
    if (!kill) return;
    const replaced = tokens.some((t) => t.variants.some((v) => /^(?:focus|focus-visible|focus-within|group-focus|peer-focus|group-focus-visible|peer-focus-visible)$/.test(v)) && /^(?:ring(?:-|$)|outline(?:-(?!none|hidden|0$))|border(?:-|$)|shadow(?:-|$)|bg-|underline|decoration-)/.test(t.base));
    if (!replaced) report('CMP-08', doc, kill.offset, { message: `${kill.value} with no focus-visible ring or outline on the same element`, value: kill.value });
  };
  const { byEl, loose } = classGroups(doc);
  for (const toks of byEl.values()) check(toks);
  for (const g of loose) check(g.tokens);
}

// ---- other advisory signals ------------------------------------------------------------------------------

function zoomLock(doc, report) {
  for (const el of doc.elements) {
    if (el.lower !== 'meta' || String(attrValue(el, 'name') || '').toLowerCase() !== 'viewport') continue;
    const content = String(attrValue(el, 'content') || '');
    const ms = content.match(/maximum-scale\s*=\s*([\d.]+)/i);
    if (/user-scalable\s*=\s*(?:no|0)\b/i.test(content) || (ms && Number(ms[1]) < 2)) report('TYP-19', doc, el.offset, { message: `viewport meta locks zoom (${short(content)})`, value: content });
  }
  const m = /\bexport\s+const\s+viewport\b[^;]*?(?:userScalable\s*:\s*false|maximumScale\s*:\s*1(?:\.0+)?\b)/s.exec(doc.code);
  if (m) report('TYP-19', doc, m.index, { message: 'Next.js viewport export locks zoom (userScalable: false or maximumScale: 1)', value: short(m[0]) });
}

function positiveTabindex(doc, report) {
  for (const el of doc.elements) {
    const a = attr(el, 'tabindex');
    if (!a) continue;
    const v = Number(String(a.value).replace(/[{}"'\s]/g, ''));
    if (Number.isFinite(v) && v > 0) report('WCAG-2.4.3', doc, a.offset, { message: `tabindex="${v}" overrides the reading order`, value: v });
  }
}

const NON_INTERACTIVE = new Set(['div', 'span', 'li', 'p', 'img', 'svg', 'section', 'article', 'td', 'tr', 'i', 'b', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'header', 'footer', 'main', 'aside', 'ul', 'ol']);
const INTERACTIVE_ROLE = /^(?:button|link|menuitem|menuitemcheckbox|menuitemradio|tab|checkbox|radio|switch|option|treeitem|gridcell|row|slider|spinbutton|combobox|textbox|searchbox)$/;
const BACKDROP = /backdrop|overlay|scrim|mask|dimmer|underlay|modal-bg|close-area|click-outside/i;

function clickable(doc, report) {
  for (const el of doc.elements) {
    if (el.kind === 'html' && el.lower === 'template') continue;
    if (!NON_INTERACTIVE.has(el.lower)) continue;
    const hs = handlers(el);
    const click = hs.find((h) => h.event === 'click');
    if (!click) continue;
    if (/stopPropagation\(\)\s*;?\s*\}?\s*$/.test(String(click.attr.value)) && !/[;,]/.test(String(click.attr.value).replace(/stopPropagation\(\)\s*;?/, ''))) continue;
    const cls = [...elTokens(doc, el).map((t) => t.value), String(attrValue(el, 'id') || ''), String(attrValue(el, 'class') || '')].join(' ');
    if (BACKDROP.test(cls) || String(attrValue(el, 'aria-hidden')) === 'true') continue;
    const role = String(attrValue(el, 'role') || '');
    if (/^(?:presentation|none)$/.test(role)) continue;
    const hasInteractiveChild = (e) => e.children.some((c) => /^(?:button|a|input|select|textarea|summary)$/.test(c.lower) || (c.isComponent && /Button|Link/.test(c.tag)) || hasInteractiveChild(c));
    if (hasInteractiveChild(el)) continue;
    const missing = [];
    if (!INTERACTIVE_ROLE.test(role)) missing.push('role');
    if (!attr(el, 'tabindex')) missing.push('tabindex');
    if (!hs.some((h) => /^key(?:down|up|press)$/.test(h.event))) missing.push('key handler');
    if (missing.length) report('WCAG-2.1.1', doc, click.attr.offset, { message: `clickable <${el.tag}> without ${missing.join(', ')}`, value: `<${el.tag} ${click.attr.name}>` });
  }
}

function imgAlt(doc, report) {
  for (const el of doc.elements) {
    const isImg = el.lower === 'img' || (el.isComponent && /^(?:Image|NextImage|Img)$/.test(el.tag) && el.attrs.some((a) => a.lower === 'src'));
    if (!isImg || el.hasSpread) continue;
    if (attr(el, 'alt')) continue;
    if (String(attrValue(el, 'aria-hidden')) === 'true' || /^(?:presentation|none)$/.test(String(attrValue(el, 'role') || ''))) continue;
    report('WCAG-1.1.1', doc, el.offset, { message: `<${el.tag}> without alt`, value: `<${el.tag}>` });
  }
}

const TEXT_INPUT_COMPONENT = /(?:^|\.)(?:Input|TextInput|TextField|Textarea|TextArea|Search\w*|\w*SearchBox|Composer|ChatInput|MessageInput|CommandInput|Editor|PromptInput|Autocomplete|Combobox)$/;

function isTextInput(el) {
  if (el.lower === 'textarea') return true;
  if (el.lower === 'input') {
    const t = String(attrValue(el, 'type') || 'text').toLowerCase();
    return /^(?:text|search|email|url|tel|password)$/.test(t) || (typeof attrValue(el, 'type') === 'object');
  }
  if (attr(el, 'contenteditable') && String(attrValue(el, 'contenteditable')) !== 'false') return true;
  return el.isComponent && TEXT_INPUT_COMPONENT.test(el.tag);
}

const ENTER = /['"`]Enter['"`]|keyCode\s*={2,3}\s*13\b|which\s*={2,3}\s*13\b|\.code\s*={2,3}\s*['"`](?:Numpad)?Enter['"`]|\bkey\s*!==?\s*['"`]Enter/;
const GUARD = /isComposing|229|compos/i;

function imeGuard(doc, report) {
  for (const el of doc.elements) {
    if (!isTextInput(el)) continue;
    for (const h of handlers(el)) {
      if (h.event !== 'keydown' && h.event !== 'keypress') continue;
      const enterModifier = /\.enter\b/i.test(h.attr.name);
      const v = String(h.attr.value === true ? '' : h.attr.value);
      const res = resolveHandler(doc, v);
      const body = res?.body ?? null;
      if (!enterModifier && (!body || !ENTER.test(body))) continue;
      if (body && GUARD.test(body)) continue;
      if (!body && !enterModifier) continue;
      report('I18N-14', doc, h.attr.offset, { message: `${h.attr.name} acts on Enter without an IME composition guard (isComposing or keyCode 229)`, value: short(`${h.attr.name}=${v}`) });
    }
  }
  for (const l of listenerCalls(doc, ['keydown', 'keypress'])) {
    if (isGlobalTarget(l.target) || !l.body || !ENTER.test(l.body) || GUARD.test(l.body)) continue;
    if (!/input|textarea|editor|field|search|composer|ref/i.test(l.target)) continue;
    report('I18N-14', doc, l.offset, { message: `${l.target}.addEventListener('${l.event}') acts on Enter without an IME composition guard`, value: short(l.handler) });
  }
}

// ---- entry points ----------------------------------------------------------------------------------------

export function checkFile(doc, ctx, report) {
  if (ctx.enabled('A11Y-17')) {
    downEvents(doc, report);
    shortcuts(doc, report);
    dragAlternatives(doc, report);
    motionActuation(doc, report);
  }
  if (ctx.enabled('A11Y-14') || ctx.enabled('CMP-17')) pasteBlocking(doc, (id, ...rest) => ctx.enabled(id) && report(id, ...rest));
  if (ctx.enabled('CMP-08')) outlineRemoval(doc, ctx, report);
  if (ctx.enabled('TYP-19')) zoomLock(doc, report);
  if (ctx.enabled('WCAG-2.4.3')) positiveTabindex(doc, report);
  if (ctx.enabled('WCAG-2.1.1')) clickable(doc, report);
  if (ctx.enabled('WCAG-1.1.1')) imgAlt(doc, report);
  if (ctx.enabled('I18N-14')) imeGuard(doc, report);
}
