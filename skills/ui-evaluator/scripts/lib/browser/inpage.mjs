// In-page helper library, injected on demand as window.__uie. Functions passed to page.evaluate() cannot see
// module scope, so every check reaches shared logic through this object. Pure DOM; no app code is touched.

/* eslint-disable no-restricted-globals */
function uieHelpers() {
  if (window.__uie && window.__uie.v === 4) return true;
  const U = { v: 4 };
  const ids = new WeakMap();
  const els = [];
  let cache = new Map();

  U.id = (el) => {
    let i = ids.get(el);
    if (i === undefined) {
      i = els.length;
      els.push(el);
      ids.set(el, i);
    }
    return i;
  };
  U.el = (i) => els[i];
  U.reset = () => {
    cache = new Map();
  };
  const memo = (kind, el, fn) => {
    let m = cache.get(kind);
    if (!m) {
      m = new Map();
      cache.set(kind, m);
    }
    if (m.has(el)) return m.get(el);
    const v = fn();
    m.set(el, v);
    return v;
  };
  U.cs = (el, pseudo) => (pseudo ? getComputedStyle(el, pseudo) : memo('cs', el, () => getComputedStyle(el)));
  U.px = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  U.collapse = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  U.effOpacity = (el) =>
    memo('op', el, () => {
      let o = 1;
      for (let a = el; a && a.nodeType === 1; a = a.parentElement) o *= U.px(U.cs(a).opacity) || (U.cs(a).opacity === '0' ? 0 : 1);
      return o;
    });

  const SR_CLIP = /rect\(\s*(0|1)(px)?\s*,?\s*(0|1)(px)?\s*,?\s*(0|1)(px)?\s*,?\s*(0|1)(px)?\s*\)/;
  /** The element's box clipped by overflow:hidden/clip ancestors (viewport coordinates), or null when nothing shows. */
  U.clippedRect = (el) =>
    memo('clip', el, () => {
      const r = el.getBoundingClientRect();
      let x1 = r.left;
      let y1 = r.top;
      let x2 = r.right;
      let y2 = r.bottom;
      for (let a = el.parentElement; a && a !== document.documentElement && a !== document.body; a = a.parentElement) {
        const s = U.cs(a);
        const ox = s.overflowX;
        const oy = s.overflowY;
        const clipsX = ox === 'hidden' || ox === 'clip';
        const clipsY = oy === 'hidden' || oy === 'clip';
        const paint = /paint|strict|content/.test(s.contain || '');
        if (!clipsX && !clipsY && !paint) continue;
        const ar = a.getBoundingClientRect();
        const bl = U.px(s.borderLeftWidth);
        const bt = U.px(s.borderTopWidth);
        if (clipsX || paint) {
          x1 = Math.max(x1, ar.left + bl);
          x2 = Math.min(x2, ar.left + bl + a.clientWidth);
        }
        if (clipsY || paint) {
          y1 = Math.max(y1, ar.top + bt);
          y2 = Math.min(y2, ar.top + bt + a.clientHeight);
        }
        if (x2 - x1 < 0.5 || y2 - y1 < 0.5) return null;
      }
      return { left: x1, top: y1, right: x2, bottom: y2, width: x2 - x1, height: y2 - y1 };
    });

  /** Visible to a sighted user at rest: rendered, not hidden, not transparent, not clipped away, not an sr-only box. */
  U.isVisible = (el, { minOpacity = 0.05 } = {}) => {
    if (!el) return false;
    if (el.nodeType !== 1) el = el.parentElement;
    if (!el || !el.isConnected) return false;
    return memo(`vis${minOpacity}`, el, () => {
      if (!el.getClientRects().length) return false;
      const s = U.cs(el);
      if (s.visibility !== 'visible' || s.display === 'none') return false;
      if (s.contentVisibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      if (r.width * r.height < 2 && el.tagName !== 'BR') return false;
      if (U.effOpacity(el) < minOpacity) return false;
      for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
        const as = U.cs(a);
        if ((as.position === 'absolute' || as.position === 'fixed') && SR_CLIP.test(as.clip || '')) return false;
        if (/inset\(\s*50%|circle\(\s*0(px)?\s*(at|\))/.test(as.clipPath || '')) return false;
        if (a.hasAttribute('hidden') && as.display === 'none') return false;
      }
      if (r.right + scrollX <= 0 || r.bottom + scrollY <= 0) return false;
      const c = U.clippedRect(el);
      if (!c || c.width * c.height < 1) return false;
      return true;
    });
  };

  U.docRect = (el) => {
    const r = el.getBoundingClientRect();
    return [Math.round(r.left + scrollX), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)];
  };
  U.rectOf = (r) => [Math.round(r.left + scrollX), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)];

  const HASHED = /^(css|sc|jsx|svelte|emotion|tw)-[a-z0-9]{4,}$|^[a-z]{1,3}[A-Z0-9][A-Za-z0-9]{4,}$|__[A-Za-z0-9]{5,}$|^_[A-Za-z0-9]{5,}$/;
  const goodClass = (c) => c && !HASHED.test(c) && !/^(is|has)-/.test(c) && c.length < 40 && /^[A-Za-z_-][\w-]*$/.test(c);
  const goodId = (id) => id && /^[A-Za-z][\w-]*$/.test(id) && !/\d{4,}|^[a-f0-9-]{16,}$|^(radix|headlessui|react-aria|mui|:r)/i.test(id);

  /** A short, unique, reasonably stable CSS selector. */
  U.selector = (el) =>
    memo('sel', el, () => {
      if (!el || el.nodeType !== 1) return '';
      if (el === document.documentElement) return 'html';
      if (el === document.body) return 'body';
      const esc = (s) => CSS.escape(s);
      if (goodId(el.id) && document.querySelectorAll(`#${esc(el.id)}`).length === 1) return `#${esc(el.id)}`;
      const tid = el.getAttribute('data-testid');
      if (tid && document.querySelectorAll(`[data-testid="${CSS.escape(tid)}"]`).length === 1) return `[data-testid="${tid}"]`;
      const parts = [];
      let cur = el;
      while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
        if (cur !== el && goodId(cur.id) && document.querySelectorAll(`#${esc(cur.id)}`).length === 1) {
          parts.unshift(`#${esc(cur.id)}`);
          break;
        }
        if (cur === document.body) {
          parts.unshift('body');
          break;
        }
        let part = cur.tagName.toLowerCase();
        const cls = [...cur.classList].filter(goodClass).slice(0, 2);
        if (cls.length) part += cls.map((c) => `.${esc(c)}`).join('');
        const parent = cur.parentElement;
        if (parent) {
          const same = [...parent.children].filter((c) => c.tagName === cur.tagName && (!cls.length || cls.every((k) => c.classList.contains(k))));
          if (same.length > 1) {
            const sameTag = [...parent.children].filter((c) => c.tagName === cur.tagName);
            part += `:nth-of-type(${sameTag.indexOf(cur) + 1})`;
          }
        }
        parts.unshift(part);
        const sel = parts.join(' > ');
        try {
          if (document.querySelectorAll(sel).length === 1 && parts.length >= 2) return sel;
        } catch {
          /* keep climbing */
        }
        cur = parent;
      }
      return parts.join(' > ');
    });

  U.snippet = (el, max = 220) => {
    if (!el || el.nodeType !== 1) return '';
    const html = el.outerHTML || '';
    const open = html.slice(0, Math.max(0, html.indexOf('>') + 1)).slice(0, 160);
    const text = U.collapse(el.innerText || el.textContent || '').slice(0, 80);
    return `${open}${text ? `${text}${(el.innerText || '').length > 80 ? '…' : ''}` : ''}`.slice(0, max);
  };

  U.inspPath = (el) => {
    const n = el && el.closest ? el.closest('[data-insp-path]') : null;
    return n ? n.getAttribute('data-insp-path') : null;
  };

  const INPUT_ROLES = {
    button: 'button', submit: 'button', reset: 'button', image: 'button', checkbox: 'checkbox', radio: 'radio',
    range: 'slider', number: 'spinbutton', search: 'searchbox', email: 'textbox', tel: 'textbox', text: 'textbox',
    url: 'textbox', password: 'textbox', '': 'textbox', date: 'textbox', 'datetime-local': 'textbox', month: 'textbox',
    time: 'textbox', week: 'textbox', color: 'button', file: 'button',
  };
  const inSection = (el) => !!el.parentElement && !!el.parentElement.closest('article,aside,main,nav,section');
  U.role = (el) =>
    memo('role', el, () => {
      if (!el || el.nodeType !== 1) return '';
      const explicit = (el.getAttribute('role') || '').trim().split(/\s+/)[0];
      if (explicit && explicit !== 'presentation' && explicit !== 'none') return explicit;
      if (explicit) return 'none';
      const t = el.tagName.toLowerCase();
      switch (t) {
        case 'a':
        case 'area':
          return el.hasAttribute('href') ? 'link' : 'generic';
        case 'button':
          return 'button';
        case 'input': {
          const ty = (el.getAttribute('type') || '').toLowerCase();
          if (ty === 'hidden') return 'none';
          if (el.hasAttribute('list') && ['', 'text', 'search', 'email', 'tel', 'url'].includes(ty)) return 'combobox';
          return INPUT_ROLES[ty] || 'textbox';
        }
        case 'select':
          return el.multiple || el.size > 1 ? 'listbox' : 'combobox';
        case 'textarea':
          return 'textbox';
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          return 'heading';
        case 'nav':
          return 'navigation';
        case 'main':
          return 'main';
        case 'header':
          return inSection(el) ? 'generic' : 'banner';
        case 'footer':
          return inSection(el) ? 'generic' : 'contentinfo';
        case 'aside':
          return 'complementary';
        case 'form':
          return 'form';
        case 'section':
          return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') ? 'region' : 'generic';
        case 'img':
          return el.getAttribute('alt') === '' ? 'none' : 'img';
        case 'svg':
          return 'graphics-document';
        case 'ul':
        case 'ol':
        case 'menu':
          return 'list';
        case 'li':
          return 'listitem';
        case 'table':
          return 'table';
        case 'tr':
          return 'row';
        case 'td':
          return 'cell';
        case 'th':
          return 'columnheader';
        case 'dialog':
          return 'dialog';
        case 'details':
          return 'group';
        case 'summary':
          return 'button';
        case 'progress':
          return 'progressbar';
        case 'meter':
          return 'meter';
        case 'output':
          return 'status';
        case 'fieldset':
          return 'group';
        case 'option':
          return 'option';
        case 'hr':
          return 'separator';
        case 'article':
          return 'article';
        case 'figure':
          return 'figure';
        case 'label':
          return 'label';
        default:
          return 'generic';
      }
    });

  U.headingLevel = (el) => {
    const m = /^h([1-6])$/i.exec(el.tagName);
    if (m) return Number(m[1]);
    const lv = Number(el.getAttribute('aria-level'));
    return Number.isInteger(lv) && lv > 0 ? lv : el.getAttribute('role') === 'heading' ? 2 : 0;
  };

  const NAME_FROM_CONTENT = new Set([
    'button', 'link', 'heading', 'checkbox', 'radio', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
    'option', 'cell', 'columnheader', 'rowheader', 'switch', 'treeitem', 'tooltip', 'gridcell', 'row', 'label',
  ]);
  const hiddenForName = (el) => {
    if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return true;
    const s = el.nodeType === 1 ? U.cs(el) : null;
    return !!s && (s.display === 'none' || s.visibility === 'hidden');
  };
  U.textAlt = (node, depth = 0) => {
    if (!node || depth > 25) return '';
    if (node.nodeType === 3) return node.nodeValue;
    if (node.nodeType !== 1) return '';
    const el = node;
    if (hiddenForName(el)) return '';
    const t = el.tagName.toLowerCase();
    if (el.hasAttribute('aria-label') && el.getAttribute('aria-label').trim() && depth > 0) return ` ${el.getAttribute('aria-label')} `;
    if (t === 'img' || t === 'area') return ` ${el.getAttribute('alt') || ''} `;
    if (t === 'input') {
      const ty = (el.type || '').toLowerCase();
      if (['button', 'submit', 'reset'].includes(ty)) return ` ${el.value || (ty === 'submit' ? 'Submit' : ty === 'reset' ? 'Reset' : '')} `;
      if (ty === 'image') return ` ${el.alt || ''} `;
      return ` ${el.value || ''} `;
    }
    if (t === 'svg') {
      const title = el.querySelector('title');
      return title ? ` ${title.textContent} ` : '';
    }
    if (t === 'select') return ` ${el.selectedOptions && el.selectedOptions[0] ? el.selectedOptions[0].textContent : ''} `;
    let out = '';
    const before = el.nodeType === 1 ? getComputedStyle(el, '::before').content : 'none';
    if (before && before !== 'none' && before !== 'normal' && /^["']/.test(before)) out += before.slice(1, -1);
    for (const c of el.childNodes) out += U.textAlt(c, depth + 1);
    const after = getComputedStyle(el, '::after').content;
    if (after && after !== 'none' && after !== 'normal' && /^["']/.test(after)) out += after.slice(1, -1);
    const disp = U.cs(el).display;
    return disp && !disp.startsWith('inline') ? ` ${out} ` : out;
  };

  /** Simplified accessible name (AccName 1.2 order: labelledby, label, native label, alt/title, content, title, placeholder). */
  U.accName = (el) =>
    memo('name', el, () => {
      if (!el || el.nodeType !== 1) return '';
      const lb = el.getAttribute('aria-labelledby');
      if (lb) {
        const s = lb.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean).map((n) => (n.getAttribute('aria-label') || U.textAlt(n, 1))).join(' ');
        if (U.collapse(s)) return U.collapse(s);
      }
      const al = el.getAttribute('aria-label');
      if (al && al.trim()) return U.collapse(al);
      const t = el.tagName.toLowerCase();
      if (['input', 'select', 'textarea', 'meter', 'progress', 'output'].includes(t)) {
        const ty = (el.type || '').toLowerCase();
        if (t === 'input' && ['button', 'submit', 'reset'].includes(ty)) return U.collapse(el.value || (ty === 'submit' ? 'Submit' : ty === 'reset' ? 'Reset' : ''));
        if (t === 'input' && ty === 'image') return U.collapse(el.alt || el.title || '');
        const labels = el.labels ? [...el.labels] : [];
        const s = labels.map((l) => U.textAlt(l, 1)).join(' ');
        if (U.collapse(s)) return U.collapse(s);
        if (el.title) return U.collapse(el.title);
        if (el.placeholder) return U.collapse(el.placeholder);
        return '';
      }
      if (t === 'img' || t === 'area') return U.collapse(el.getAttribute('alt') || el.title || '');
      if (t === 'svg') {
        const title = el.querySelector(':scope > title');
        return U.collapse(title ? title.textContent : '');
      }
      if (t === 'fieldset') {
        const lg = el.querySelector(':scope > legend');
        if (lg) return U.collapse(U.textAlt(lg, 1));
      }
      if (t === 'table') {
        const cap = el.querySelector(':scope > caption');
        if (cap) return U.collapse(U.textAlt(cap, 1));
      }
      const role = U.role(el);
      if (NAME_FROM_CONTENT.has(role) || t === 'summary') {
        const s = U.collapse(U.textAlt(el, 0));
        if (s) return s;
      }
      if (el.title) return U.collapse(el.title);
      return '';
    });

  const NATIVE_FOCUSABLE = 'a[href],area[href],button,input:not([type=hidden]),select,textarea,summary,iframe,[contenteditable=""],[contenteditable=true],audio[controls],video[controls]';
  U.isDisabled = (el) => !!(el.disabled || el.closest('fieldset[disabled]') && !el.closest('legend') && el.matches('button,input,select,textarea') || el.getAttribute('aria-disabled') === 'true');
  U.isInert = (el) => !!el.closest('[inert]');
  U.tabbable = (el) => {
    if (!el || el.nodeType !== 1 || U.isInert(el)) return false;
    if (el.disabled) return false;
    const ti = el.getAttribute('tabindex');
    if (ti !== null && Number(ti) < 0) return false;
    if (ti !== null && Number.isInteger(Number(ti))) return true;
    return el.matches(NATIVE_FOCUSABLE);
  };
  U.INTERACTIVE_ROLES = new Set([
    'button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
    'slider', 'spinbutton', 'textbox', 'searchbox', 'combobox', 'listbox', 'treeitem', 'gridcell', 'scrollbar',
  ]);
  U.isInteractive = (el) => {
    if (!el || el.nodeType !== 1) return false;
    if (el.matches(NATIVE_FOCUSABLE)) return true;
    return U.INTERACTIVE_ROLES.has(U.role(el)) && el.hasAttribute('role');
  };

  const HAN = /[㐀-䶿一-鿿豈-﫿]/g;
  const KANA = /[぀-ヿㇰ-ㇿ]/g;
  const HANGUL = /[가-힯ᄀ-ᇿ㄰-㆏]/g;
  const LATIN = /[A-Za-zÀ-ɏ]/g;
  U.scripts = (text) => {
    const s = String(text || '');
    const han = (s.match(HAN) || []).length;
    const kana = (s.match(KANA) || []).length;
    const hangul = (s.match(HANGUL) || []).length;
    const latin = (s.match(LATIN) || []).length;
    return { han, kana, hangul, latin, cjk: han + kana + hangul, letters: han + kana + hangul + latin };
  };
  U.isCjkChar = (ch) => /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯　-〿＀-￯]/.test(ch);

  /** Direct visible text of an element (its own text nodes only). */
  U.ownText = (el) => {
    let s = '';
    for (const c of el.childNodes) if (c.nodeType === 3) s += c.nodeValue;
    return U.collapse(s);
  };

  /** Elements that directly contain visible text, in document order. */
  U.textElements = (root = document.body, { limit = 6000 } = {}) => {
    const out = [];
    const seen = new Set();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    for (let n = walker.nextNode(); n && out.length < limit; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || seen.has(el)) continue;
      const tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE' || tag === 'TITLE') continue;
      if (el.closest('svg') && tag !== 'svg') {
        if (tag !== 'text' && tag !== 'tspan') continue;
      }
      seen.add(el);
      if (!U.isVisible(el)) continue;
      out.push(el);
    }
    return out;
  };

  /** Line boxes of an element's text (viewport coordinates), grouped by vertical position. */
  U.lineBoxes = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
    const lines = [];
    for (const r of rects.sort((a, b) => a.top - b.top || a.left - b.left)) {
      const mid = (r.top + r.bottom) / 2;
      const line = lines.find((l) => mid > l.top && mid < l.bottom);
      if (line) {
        line.left = Math.min(line.left, r.left);
        line.right = Math.max(line.right, r.right);
        line.top = Math.min(line.top, r.top);
        line.bottom = Math.max(line.bottom, r.bottom);
      } else lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    }
    return lines.sort((a, b) => a.top - b.top);
  };

  /** Characters per rendered line (Latin characters incl. inner spaces, CJK glyphs counted separately). */
  U.charsPerLine = (el, { maxChars = 4000 } = {}) => {
    const range = document.createRange();
    const lines = [];
    let budget = maxChars;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n && budget > 0; n = walker.nextNode()) {
      const v = n.nodeValue;
      if (!v.trim()) continue;
      const pe = n.parentElement;
      if (pe && !U.isVisible(pe)) continue;
      for (let i = 0; i < v.length && budget > 0; i += 1) {
        budget -= 1;
        const ch = v[i];
        range.setStart(n, i);
        range.setEnd(n, i + 1);
        const rs = range.getClientRects();
        if (!rs.length) continue;
        const r = rs[0];
        if (r.width <= 0 && /\s/.test(ch)) continue;
        const mid = (r.top + r.bottom) / 2;
        let line = lines.find((l) => mid > l.top && mid < l.bottom);
        if (!line) {
          line = { top: r.top, bottom: r.bottom, text: '' };
          lines.push(line);
        }
        line.text += /\s/.test(ch) ? ' ' : ch;
      }
    }
    return lines
      .sort((a, b) => a.top - b.top)
      .map((l) => {
        const t = l.text.replace(/\s+/g, ' ').trim();
        let cjk = 0;
        for (const ch of t) if (U.isCjkChar(ch)) cjk += 1;
        return { chars: t.length, cjk, text: t.slice(0, 120) };
      });
  };

  /** Background chain from the element up to the root (computed strings; composited in Node). */
  U.bgChain = (el) => {
    const out = [];
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const s = U.cs(a);
      out.push({
        id: U.id(a),
        tag: a.tagName.toLowerCase(),
        bg: s.backgroundColor,
        img: s.backgroundImage && s.backgroundImage !== 'none' ? s.backgroundImage.slice(0, 300) : null,
        op: s.opacity,
        blend: s.mixBlendMode !== 'normal' ? s.mixBlendMode : null,
        filter: s.filter !== 'none' ? s.filter : null,
        backdrop: s.backdropFilter && s.backdropFilter !== 'none' ? s.backdropFilter : null,
      });
    }
    return out;
  };

  /** The page canvas colour (what shows when html and body are transparent), honouring color-scheme. */
  U.canvasColor = () => {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;width:0;height:0;background-color:Canvas;color:CanvasText;';
    document.documentElement.appendChild(d);
    const c = getComputedStyle(d).backgroundColor;
    d.remove();
    return c;
  };

  /** Whether something other than an ancestor paints below the element's centre (positioned layers, images). */
  U.foreignBelow = (el) => {
    const r = el.getBoundingClientRect();
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + r.height / 2], [r.right - 2, r.top + r.height / 2]];
    for (const [x, y] of pts) {
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
      const stack = document.elementsFromPoint(x, y);
      const idx = stack.indexOf(el);
      const below = idx >= 0 ? stack.slice(idx + 1) : stack;
      for (const b of below) {
        if (b === document.documentElement || b === document.body) break;
        if (b.contains(el)) {
          const s = U.cs(b);
          if (s.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor) && !/\/ 0\)$/.test(s.backgroundColor)) break;
          continue;
        }
        const s = U.cs(b);
        const paints = ['IMG', 'VIDEO', 'CANVAS', 'PICTURE', 'svg', 'IFRAME'].includes(b.tagName) || (s.backgroundImage && s.backgroundImage !== 'none') || (s.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor));
        if (paints) return { id: U.id(b), tag: b.tagName.toLowerCase() };
      }
    }
    return null;
  };

  U.cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /**
   * DOM → source, in the order of TOOL-31: data-insp-path → __svelte_meta.loc → Vue inspector →
   * React debug source / owner stack. Raw values are normalised in Node (source.mjs).
   */
  U.sourceOf = (el) => {
    if (!el || el.nodeType !== 1) return null;
    const insp = el.closest('[data-insp-path]');
    if (insp) return { method: 'data-insp-path', raw: insp.getAttribute('data-insp-path'), confidence: insp === el ? 'high' : 'medium' };
    for (let a = el, d = 0; a && d < 12; a = a.parentElement, d += 1) {
      const m = a.__svelte_meta;
      if (m && m.loc && m.loc.file) return { method: '__svelte_meta.loc', file: m.loc.file, line: m.loc.line, col: m.loc.column, confidence: a === el ? 'high' : 'medium' };
    }
    const vi = el.closest('[data-v-inspector]');
    if (vi) return { method: 'vue-inspector', raw: vi.getAttribute('data-v-inspector'), confidence: vi === el ? 'high' : 'medium' };
    for (let a = el, d = 0; a && d < 12; a = a.parentElement, d += 1) {
      const c = a.__vueParentComponent;
      if (c && c.type && c.type.__file) return { method: 'vue __file', file: c.type.__file, line: null, col: null, confidence: 'low' };
    }
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
    if (key) {
      for (let f = el[key], i = 0; f && i < 40; f = f.return, i += 1) {
        if (f._debugSource && f._debugSource.fileName) {
          return { method: 'react _debugSource', file: f._debugSource.fileName, line: f._debugSource.lineNumber, col: f._debugSource.columnNumber, confidence: 'high' };
        }
      }
      for (let f = el[key], i = 0; f && i < 40; f = f.return, i += 1) {
        const st = f._debugStack && (f._debugStack.stack || String(f._debugStack));
        if (!st) continue;
        const frames = st.split('\n').slice(1);
        for (const fr of frames) {
          if (/node_modules|react-dom|react-jsx|\/react\/|chunk-|\.vite\/deps/.test(fr)) continue;
          const m = fr.match(/\(?((?:https?|file):\/\/[^\s)]+?):(\d+):(\d+)\)?\s*$/);
          if (m) return { method: 'react owner stack', url: m[1], line: Number(m[2]), col: Number(m[3]), confidence: 'medium' };
        }
      }
    }
    return null;
  };

  window.__uie = U;
  return true;
}

/** Source text that installs the helpers when evaluated in a page. */
export const HELPERS_SOURCE = `(${uieHelpers.toString()})()`;

/** Install the helpers in the page (idempotent). */
export async function ensureHelpers(page) {
  await page.evaluate(HELPERS_SOURCE);
  await page.evaluate(() => window.__uie.reset());
}
