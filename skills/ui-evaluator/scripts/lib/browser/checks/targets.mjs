// targets — A11Y-10 (≥ 24 × 24 CSS px unless an SC 2.5.8 exception applies: spacing circle, inline, user agent;
// equivalent and essential are judged) and CMP-06 (touch-primary controls ≥ 44 × 44 CSS px and ≥ 8 px apart).
// CMP-06 follows the lead's operational definition [calibrating]: touch viewports are matrix widths captured with
// touch emulation (default < 1024 px); primary controls are the surface's declared primary action, controls used
// by journey steps, primary navigation items, form submit buttons and dialog action buttons, never inline links;
// hit area = border box ∪ associated <label> box; spacing = shortest edge-to-edge distance between hit areas.
import { spacingFailures, rectGap, round } from '../thresholds.mjs';
import { isTouchWidth } from '../launch.mjs';
import { toLocator } from '../locators.mjs';
import { loadJourneys } from '../../project.mjs';

export const mode = 'shared';
export const criteria = ['A11Y-10', 'CMP-06'];
export const summary = 'target geometry with the SC 2.5.8 spacing test; touch-primary sizes';

const TARGET_SELECTOR = 'a[href],area[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=option],[role=slider],[role=spinbutton],[role=treeitem],[onclick],[tabindex]:not([tabindex="-1"])';

function collect({ selector, primaryIds, primaryNames }) {
  const U = window.__uie;
  U.reset();
  // User-agent default sizes, from a pristine document.
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:absolute;left:-9999px;top:0;width:400px;height:200px;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const fdoc = frame.contentDocument;
  const uaCache = new Map();
  const uaSize = (el) => {
    const key = `${el.tagName}|${el.type || ''}`;
    if (uaCache.has(key)) return uaCache.get(key);
    let v = null;
    try {
      const c = fdoc.createElement(el.tagName);
      if (el.type) c.setAttribute('type', el.type);
      if (el.tagName === 'BUTTON' || el.tagName === 'A') c.textContent = el.textContent;
      fdoc.body.appendChild(c);
      const r = c.getBoundingClientRect();
      const s = frame.contentWindow.getComputedStyle(c);
      v = { w: Math.round(r.width), h: Math.round(r.height), font: s.fontSize, padding: s.padding, border: s.borderWidth };
      c.remove();
    } catch {
      v = null;
    }
    uaCache.set(key, v);
    return v;
  };
  const isUA = (el, r) => {
    const t = el.tagName;
    if (!['INPUT', 'BUTTON', 'SELECT'].includes(t)) return false;
    const s = U.cs(el);
    if (s.appearance === 'none' || s.webkitAppearance === 'none') return false;
    const ua = uaSize(el);
    if (!ua) return false;
    if (t === 'INPUT' && ['checkbox', 'radio'].includes(el.type)) return Math.abs(r.width - ua.w) <= 1 && Math.abs(r.height - ua.h) <= 1;
    return s.fontSize === ua.font && s.padding === ua.padding && s.borderWidth === ua.border && Math.abs(r.height - ua.h) <= 1;
  };
  const blockOf = (el) => {
    for (let a = el.parentElement; a; a = a.parentElement) {
      const d = U.cs(a).display;
      if (!d.startsWith('inline') && d !== 'contents') return a;
    }
    return document.body;
  };
  const isInline = (el) => {
    const d = U.cs(el).display;
    if (!d.startsWith('inline')) return false;
    if (!(el.tagName === 'A' || el.getAttribute('role') === 'link')) return false;
    const block = blockOf(el);
    if (['LI', 'NAV', 'TD', 'TH', 'DT', 'DD'].includes(block.tagName) && U.collapse(block.textContent).length - U.collapse(el.textContent).length < 12) return false;
    const own = U.collapse(el.textContent).length;
    const total = U.collapse(block.textContent).length;
    return total - own >= 12;
  };
  const primaryNav = (() => {
    const cands = [...document.querySelectorAll('header nav, [role=banner] nav, nav[aria-label*="main" i], nav[aria-label*="primary" i], [role=navigation][aria-label*="main" i]')].filter((n) => U.isVisible(n));
    if (cands.length) return cands[0];
    return [...document.querySelectorAll('nav,[role=navigation]')].find((n) => U.isVisible(n) && n.querySelectorAll('a[href],button').length >= 2) || null;
  })();
  const pids = new Set(primaryIds);
  const pnames = new Set(primaryNames.map((n) => n.toLowerCase()));
  const out = [];
  const els = [...document.querySelectorAll(selector)];
  const isTarget = new Set(els);
  for (const el of els) {
    if (out.length >= 800) break;
    if (U.isDisabled(el) || U.isInert(el) || !U.isVisible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    let parentTarget = null;
    for (let a = el.parentElement; a; a = a.parentElement) if (isTarget.has(a)) parentTarget = a;
    const tag = el.tagName.toLowerCase();
    const name = U.accName(el).slice(0, 80);
    const inForm = !!(el.form || el.closest('form'));
    const submit = (tag === 'button' && inForm && (el.getAttribute('type') || 'submit').toLowerCase() === 'submit') || (tag === 'input' && ['submit', 'image'].includes(el.type));
    const dialogAction = !!el.closest('dialog[open],[role=dialog],[role=alertdialog]') && (tag === 'button' || el.getAttribute('role') === 'button' || (tag === 'input' && ['submit', 'button', 'reset'].includes(el.type)));
    const navItem = !!primaryNav && primaryNav.contains(el) && (tag === 'a' || tag === 'button' || ['link', 'button', 'menuitem', 'tab'].includes(el.getAttribute('role')));
    const declared = pids.has(U.id(el)) || (name && pnames.has(name.toLowerCase()));
    const inline = isInline(el);
    let hit = { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
    if (el.labels && el.labels.length) {
      for (const l of el.labels) {
        if (!U.isVisible(l)) continue;
        const lr = l.getBoundingClientRect();
        const x1 = Math.min(hit.x, lr.left + scrollX);
        const y1 = Math.min(hit.y, lr.top + scrollY);
        const x2 = Math.max(hit.x + hit.w, lr.right + scrollX);
        const y2 = Math.max(hit.y + hit.h, lr.bottom + scrollY);
        hit = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
      }
    }
    out.push({
      id: U.id(el),
      tag,
      role: U.role(el),
      name,
      x: r.left + scrollX,
      y: r.top + scrollY,
      w: r.width,
      h: r.height,
      hit,
      inline,
      ua: isUA(el, r),
      parent: parentTarget ? U.id(parentTarget) : null,
      primary: !inline && (submit || dialogAction || navItem || declared),
      why: [submit && 'form submit', dialogAction && 'dialog action', navItem && 'primary navigation', declared && 'declared primary action'].filter(Boolean),
      selector: U.selector(el),
      snippet: U.snippet(el),
      source: U.sourceOf(el),
    });
  }
  frame.remove();
  return out;
}

/** For undersized targets, test whether a square of `size` px centred on the target is entirely its hit area. */
function probe({ ids, size }) {
  const U = window.__uie;
  const res = {};
  for (const id of ids) {
    const el = U.el(id);
    if (!el) continue;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const n = 5;
    let ok = true;
    for (let i = 0; i < n && ok; i += 1) {
      for (let j = 0; j < n && ok; j += 1) {
        const x = cx - size / 2 + (size * (i + 0.5)) / n;
        const y = cy - size / 2 + (size * (j + 0.5)) / n;
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) {
          ok = false;
          break;
        }
        const t = document.elementFromPoint(x, y);
        if (!t || !(t === el || el.contains(t))) ok = false;
      }
    }
    res[id] = ok;
  }
  window.scrollTo(0, 0);
  return res;
}

async function primaryHints(ctx, page, ps) {
  const ids = [];
  const names = [];
  const targets = [];
  const pa = ps.routeCfg.primary_action;
  if (pa) targets.push(...(Array.isArray(pa) ? pa : [pa]));
  for (const j of ctx._journeys) {
    for (const a of j.correct_actions || []) if (a && a.target && ['click', 'dblclick', 'fill', 'select', 'check', 'uncheck', 'press'].includes(a.action)) targets.push(a.target);
  }
  for (const t of [...new Set(targets)].slice(0, 60)) {
    try {
      const got = await toLocator(page, t).evaluateAll((els) => els.slice(0, 5).map((e) => window.__uie.id(e)));
      ids.push(...got);
    } catch {
      /* targets of other routes do not resolve here */
    }
  }
  for (const s of ctx.design.surfaces || []) {
    if (s.id === ps.surface && s.primary_action) names.push(s.primary_action);
  }
  return { ids, names };
}

export async function run(ctx) {
  const hits = [];
  ctx._journeys = ctx.root ? safeJourneys(ctx.root) : [];
  let checked = 0;
  let primaries = 0;
  for await (const pg of ctx.pages(ctx.states({ widths: 'all', themes: 'first' }))) {
    const ps = pg.ps;
    const page = pg.page;
    const hints = await primaryHints(ctx, page, ps);
    const list = await page.evaluate(collect, { selector: TARGET_SELECTOR, primaryIds: hints.ids, primaryNames: hints.names });
    checked += list.length;
    const under = list.filter((t) => (t.w < 24 - 0.01 || t.h < 24 - 0.01) && !t.inline && !t.ua);
    const probed = under.length ? await page.evaluate(probe, { ids: under.map((t) => t.id), size: 24 }) : {};
    const rootOf = new Map(list.map((t) => [t.id, t.parent ?? t.id]));
    const geo = list.map((t) => ({
      id: t.id,
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
      group: rootOf.get(t.id),
      undersized: under.includes(t) && !probed[t.id],
    }));
    const fails = spacingFailures(geo);
    const byId = new Map(list.map((t) => [t.id, t]));
    for (const f of fails) {
      const t = byId.get(f.id);
      const o = byId.get(f.conflict);
      hits.push(ctx.hit({
        rule: 'A11Y-10',
        title: `Target smaller than 24 × 24 px: ${t.name ? `"${t.name.slice(0, 40)}"` : t.selector.slice(0, 60)}`,
        description: `The ${t.role} measures ${round(t.w, 1)} × ${round(t.h, 1)} CSS px at ${ps.width} px, and a 24 px circle centred on it intersects ${o ? `${o.role} ${o.name ? `"${o.name.slice(0, 40)}"` : o.selector}` : 'another target'}, so the spacing exception does not apply.`,
        location: ctx.loc(ps, { selector: t.selector, bbox: [t.x, t.y, t.w, t.h], snippet: t.snippet, source: t.source }),
        evidence: [{ type: 'measurement', value: { width: round(t.w, 1), height: round(t.h, 1), conflict: o?.selector || null }, detail: `${round(t.w, 1)}×${round(t.h, 1)} px; spacing circle intersects ${o?.selector || 'a neighbour'}` }],
        recommendation: 'Grow the hit area with padding or a pseudo-element (keep the glyph), or add spacing so the 24 px circles do not touch.',
      }));
    }
    if (isTouchWidth(ps.width)) {
      const prim = list.filter((t) => t.primary && !(t.parent && list.some((p) => p.id === t.parent && p.primary)));
      primaries += prim.length;
      for (const t of prim) {
        if (t.hit.w >= 44 - 0.5 && t.hit.h >= 44 - 0.5) continue;
        hits.push(ctx.hit({
          rule: 'CMP-06',
          title: `Touch-primary control smaller than 44 × 44 px: ${t.name ? `"${t.name.slice(0, 40)}"` : t.selector.slice(0, 60)}`,
          description: `On the ${ps.width} px touch viewport, this ${t.why.join(' / ')} control has a hit area of ${round(t.hit.w, 1)} × ${round(t.hit.h, 1)} CSS px (border box${t.tag === 'input' || t.tag === 'select' || t.tag === 'textarea' ? ' plus its label' : ''}); touch-primary controls need ≥ 44 × 44.`,
          location: ctx.loc(ps, { selector: t.selector, bbox: [t.hit.x, t.hit.y, t.hit.w, t.hit.h], snippet: t.snippet, source: t.source }),
          evidence: [{ type: 'measurement', value: { width: round(t.hit.w, 1), height: round(t.hit.h, 1), why: t.why }, detail: `${round(t.hit.w, 1)}×${round(t.hit.h, 1)} px < 44×44` }],
        }));
      }
      for (let i = 0; i < prim.length; i += 1) {
        for (let j = i + 1; j < prim.length; j += 1) {
          const a = prim[i];
          const b = prim[j];
          const gap = rectGap(a.hit, b.hit);
          if (gap >= 8 - 0.01) continue;
          hits.push(ctx.hit({
            rule: 'CMP-06',
            title: `Touch-primary controls closer than 8 px: ${a.name ? `"${a.name.slice(0, 30)}"` : a.selector.slice(0, 40)} and ${b.name ? `"${b.name.slice(0, 30)}"` : b.selector.slice(0, 40)}`,
            description: `On the ${ps.width} px touch viewport, the hit areas of these primary controls are ${round(gap, 1)} px apart (edge to edge); they need ≥ 8 px.`,
            location: ctx.loc(ps, { selector: a.selector, bbox: [a.hit.x, a.hit.y, a.hit.w, a.hit.h], snippet: a.snippet, source: a.source }),
            evidence: [{ type: 'measurement', value: { gap: round(gap, 1), other: b.selector }, detail: `${round(gap, 1)} px gap < 8 px` }],
          }));
        }
      }
    }
  }
  ctx.note('SC 2.5.8 equivalent and essential exceptions are judged by the accessibility auditor, not scripted');
  ctx.record({ targets_checked: checked, touch_primary_controls: primaries, touch_below_px: 1024 });
  return hits;
}

function safeJourneys(root) {
  try {
    return loadJourneys(root);
  } catch {
    return [];
  }
}
