// census — computed-style census and conformance over every page state:
// TYP-01…10 (sizes, body by mode, line height, measure, families, hierarchy, weights, tracking, display, justification),
// COL-04 (dark theme composed), LAY-01…05 (scale, monotony, heading rhythm, cramped padding, edge margin),
// SHP-01 (concentric nesting) and SHP-02 (elevation economy). Thresholds come from thresholds.mjs (QUALITY-BAR G3).
// Advisory: TYP-14 (tabular numerals for compared numbers), I18N-08 (no synthetic italics on CJK text), TYP-15 and
// I18N-12 (no stranded last word, or single CJK character, on a wrapped heading or paragraph).
import { parseColor, toOklab } from '../../util/color.mjs';
import {
  minTextSize, bodyMinimum, lineHeightRule, measureRule, trackingProblems, displayProblems, flatSteps,
  onSpacingScale, spacingMonotony, crampedPadding, concentricViolation, parseShadow, shadowKey, isBorderRing,
  zeroOffsetShadow, ghostCard, round,
} from '../thresholds.mjs';
import { withCdp, nodeIdFor, platformFonts } from '../cdp.mjs';

export const mode = 'shared';
export const criteria = ['TYP-01', 'TYP-02', 'TYP-03', 'TYP-04', 'TYP-05', 'TYP-06', 'TYP-07', 'TYP-08', 'TYP-09', 'TYP-10', 'COL-04', 'LAY-01', 'LAY-02', 'LAY-03', 'LAY-04', 'LAY-05', 'SHP-01', 'SHP-02'];
export const summary = 'computed-style census and token conformance: type, spacing, shape, depth, dark theme';

const CJK_FAMILY = /pingfang|hiragino|yahei|jhenghei|simsun|simhei|songti|heiti|kaiti|fangsong|noto (sans|serif) (cjk|sc|tc|hk|jp|kr)|source han|思源|苹方|微软雅黑|mingliu|pmingliu|yu gothic|yu mincho|meiryo|ms gothic|ms mincho|apple sd gothic|malgun|nanum|gulim|dotum|batang|st(heiti|song|kaiti|fangsong)|lantinghei|wenquanyi|droid sans fallback|osaka/i;
const EMOJI_OR_ICON_FAMILY = /emoji|symbol|icons?\b|fontawesome|font awesome|material symbols|material icons|icomoon|glyphicons|ionicons|feather|lucide|remixicon|bootstrap-icons/i;

function collect({ rootPx, width, wantSpacing }) {
  const U = window.__uie;
  U.reset();
  const isHeading = (el) => /^H[1-6]$/.test(el.tagName) || el.getAttribute('role') === 'heading';
  const legalRe = /©|\bcopyright\b|all rights reserved|\bterms\b|\bprivacy\b|\bcookies?\b|\blegal\b|版权所有|隐私|条款/i;
  const texts = [];
  for (const el of U.textElements(document.body, { limit: 2500 })) {
    const own = U.ownText(el);
    if (!own) continue;
    if (el.closest('[aria-hidden="true"]') && own.length <= 2) continue;
    const s = U.cs(el);
    const fontSize = parseFloat(s.fontSize);
    const lh = s.lineHeight === 'normal' ? null : parseFloat(s.lineHeight);
    const ls = s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing) || 0;
    // Lines of the element's own text.
    const tops = [];
    for (const c of el.childNodes) {
      if (c.nodeType !== 3 || !c.nodeValue.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(c);
      for (const r of range.getClientRects()) if (r.width > 0.5 && r.height > 0.5) tops.push(Math.round(r.top * 2) / 2);
    }
    const lineTops = [...new Set(tops)].sort((a, b) => a - b);
    const merged = [];
    for (const t of lineTops) if (!merged.length || t - merged[merged.length - 1] > fontSize * 0.5) merged.push(t);
    const deltas = merged.slice(1).map((t, i) => t - merged[i]).sort((a, b) => a - b);
    const pitch = deltas.length ? deltas[Math.floor(deltas.length / 2)] : null;
    const sc = U.scripts(own);
    const tag = el.tagName.toLowerCase();
    // Text inside a heading is heading text, even in an inline child such as <time> or <em> (TYP-03, TYP-08).
    const headingEl = isHeading(el) ? el : el.closest('h1,h2,h3,h4,h5,h6,[role=heading]');
    const heading = !!headingEl;
    const interactive = !!el.closest('a[href],button,label,input,select,textarea,summary,[role=button],[role=link],[role=tab],[role=menuitem]');
    const inCode = !!el.closest('code,pre,kbd,samp');
    const inCell = !!el.closest('td,th');
    const legal = !!el.closest('small,figcaption,caption,footer,[class*="legal" i],[class*="copyright" i],[class*="caption" i]') || legalRe.test(own);
    const block = !U.cs(el).display.startsWith('inline');
    const proseTag = ['p', 'li', 'dd', 'blockquote', 'figcaption'].includes(tag) || (block && own.length >= 80 && !heading);
    let perLine = null;
    if (proseTag && !inCell && !inCode && merged.length >= 2) perLine = U.charsPerLine(el, { maxChars: 3000 });
    // The text on the last rendered line, for stranded single words or characters (TYP-15, I18N-12).
    let lastLine = null;
    if (block && merged.length >= 2 && own.length <= 400 && !inCode && !inCell) {
      const nodes = [];
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (!n.nodeValue.trim()) continue;
        const pe = n.parentElement;
        if (pe && (pe.closest('[aria-hidden="true"]') || U.cs(pe).visibility === 'hidden')) continue;
        nodes.push(n);
      }
      const rg = document.createRange();
      const chars = [];
      let top = null;
      scan: for (let ni = nodes.length - 1; ni >= 0; ni -= 1) {
        const v = nodes[ni].nodeValue;
        for (let i = v.length - 1; i >= 0; i -= 1) {
          if (/\s/.test(v[i])) {
            if (top !== null && chars[chars.length - 1] !== ' ') chars.push(' ');
            continue;
          }
          rg.setStart(nodes[ni], i);
          rg.setEnd(nodes[ni], i + 1);
          const q = rg.getClientRects()[0];
          if (!q || q.height < 0.5) continue;
          if (top === null) top = q.top;
          else if ((q.top + q.bottom) / 2 < top) break scan; // centre above the last line's top: an earlier line
          chars.push(v[i]);
          if (chars.length > 60) break scan;
        }
      }
      lastLine = chars.reverse().join('').trim();
    }
    const r = el.getBoundingClientRect();
    texts.push({
      id: U.id(el),
      lastLine,
      tag,
      heading,
      level: heading ? U.headingLevel(headingEl) : 0,
      text: own.slice(0, 120),
      len: own.length,
      cjk: sc.letters ? sc.cjk / sc.letters >= 0.5 : false,
      latin: sc.latin,
      cjkCount: sc.cjk,
      px: fontSize,
      weight: Number(s.fontWeight) || 400,
      style: s.fontStyle,
      family: s.fontFamily,
      lh,
      pitch,
      lines: merged.length,
      ls,
      transform: s.textTransform,
      align: s.textAlign,
      hyphens: s.hyphens || s.webkitHyphens,
      lang: (el.closest('[lang]') || document.documentElement).getAttribute('lang') || '',
      interactive,
      inCode,
      inCell,
      legal,
      prose: proseTag && !inCell && !inCode,
      perLine,
      bodyCandidate: !heading && !interactive && !inCode && !el.closest('nav,header,footer,small,figcaption,label,legend,button') && (['p', 'li', 'dd', 'td', 'blockquote'].includes(tag) || own.length >= 40),
      bbox: U.docRect(el),
      vx: [r.left, r.right],
      selector: U.selector(el),
      snippet: U.snippet(el),
      source: U.sourceOf(el),
    });
  }
  // Inputs (TYP-02 inputs ≥ 16 px below 768 px).
  const inputs = [];
  for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]),textarea,select')) {
    if (!U.isVisible(el)) continue;
    inputs.push({ px: parseFloat(U.cs(el).fontSize), selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el), name: U.accName(el).slice(0, 60) });
  }
  // Boxes: spacing declarations, padding insets, radii, shadows.
  const spacing = [];
  const boxes = [];
  const shadows = [];
  const all = [...document.body.querySelectorAll('*')].slice(0, 4000);
  const sigOf = (el) => `${el.tagName.toLowerCase()}${[...el.classList].filter((c) => c.length < 40).sort().map((c) => `.${c}`).join('')}${el.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : ''}`;
  const transparent = (c) => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c) || /\/ 0\)$/.test(c);
  for (const el of all) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'BR', 'WBR'].includes(el.tagName)) continue;
    if (!U.isVisible(el, { minOpacity: 0.01 })) continue;
    const s = U.cs(el);
    if (wantSpacing && el.computedStyleMap) {
      const m = el.computedStyleMap();
      const sig = sigOf(el);
      const props = ['margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left'];
      if (/flex|grid/.test(s.display)) props.push('row-gap', 'column-gap');
      for (const p of props) {
        const v = m.get(p);
        if (!v || v.constructor.name !== 'CSSUnitValue' || v.unit !== 'px') continue;
        if (Math.abs(v.value) < 0.5) continue;
        spacing.push({ sig, prop: p, v: Math.round(v.value * 10) / 10, id: U.id(el) });
      }
    }
    const r = el.getBoundingClientRect();
    const bw = ['Top', 'Right', 'Bottom', 'Left'].map((k) => (s[`border${k}Style`] !== 'none' && s[`border${k}Style`] !== 'hidden' && !transparent(s[`border${k}Color`]) ? parseFloat(s[`border${k}Width`]) || 0 : 0));
    const filled = !transparent(s.backgroundColor) || (s.backgroundImage && s.backgroundImage !== 'none');
    const radii = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((k) => {
      const raw = s[`border${k}Radius`] || '0px';
      const parts = raw.split(/\s+/).map((x) => (x.endsWith('%') ? (parseFloat(x) / 100) * Math.min(r.width, r.height) : parseFloat(x) || 0));
      return Math.min(...parts);
    });
    const floating = s.position === 'fixed' || s.position === 'absolute' || !!el.closest('dialog,[role=dialog],[role=menu],[role=listbox],[role=tooltip],[popover]');
    if (s.boxShadow && s.boxShadow !== 'none') {
      shadows.push({ value: s.boxShadow, id: U.id(el), selector: U.selector(el), snippet: U.snippet(el), bbox: U.docRect(el), source: U.sourceOf(el), borderMax: Math.max(...bw), floating, focus: el.matches(':focus,:focus-within') });
    }
    const replaced = ['IMG', 'VIDEO', 'CANVAS', 'PICTURE', 'IFRAME'].includes(el.tagName);
    boxes.push({
      id: U.id(el),
      parent: el.parentElement && el.parentElement !== document.body ? U.id(el.parentElement) : null,
      tag: el.tagName.toLowerCase(),
      display: s.display,
      rect: [r.left + scrollX, r.top + scrollY, r.width, r.height],
      bw,
      pad: [parseFloat(s.paddingTop) || 0, parseFloat(s.paddingRight) || 0, parseFloat(s.paddingBottom) || 0, parseFloat(s.paddingLeft) || 0],
      filled,
      bg: s.backgroundColor,
      radii,
      replaced,
      control: ['INPUT', 'SELECT', 'TEXTAREA', 'OPTION'].includes(el.tagName),
      round: radii.every((x) => x >= Math.min(r.width, r.height) / 2 - 0.5) && r.width > 0,
      shadowed: s.boxShadow && s.boxShadow !== 'none' && !/inset/.test(s.boxShadow),
      inset: /inset/.test(s.boxShadow || ''),
      role: el.getAttribute('role') || '',
      floating,
      dialogLike: el.matches('dialog,[role=dialog],[role=alertdialog],[role=menu],[role=listbox],[role=tooltip],[popover]'),
    });
  }
  const scheme = getComputedStyle(document.documentElement).colorScheme || '';
  const meta = document.querySelector('meta[name="color-scheme"]');
  return {
    rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize) || rootPx,
    vw: document.documentElement.clientWidth,
    width,
    texts,
    inputs,
    spacing,
    boxes,
    shadows,
    scheme: `${scheme} ${meta ? meta.getAttribute('content') : ''}`.trim(),
    canvas: U.canvasColor(),
  };
}

const CJK_CHAR = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
const CLOSING_PUNCT = /^[\p{P}\p{S}]*$/u;

/**
 * TYP-15 / I18N-12 decision on one text record: a stranded last word (Latin headings, short paragraphs of ≤ 3 lines)
 * or a CJK last line with a single character, optionally followed by punctuation. UI strings and labels are exempt.
 */
export function strandedLine(t) {
  if (!t || !t.lastLine || t.lines < 2 || t.interactive) return null;
  const line = t.lastLine.trim();
  if (t.cjk) {
    const cjk = (line.match(CJK_CHAR) || []).length;
    const rest = line.replace(CJK_CHAR, '');
    if (cjk === 1 && CLOSING_PUNCT.test(rest)) return { rule: t.heading ? 'TYP-15' : 'I18N-12', what: 'One character' };
    return null;
  }
  const words = line.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  if (words.length === 1 && (t.heading || t.lines <= 3) && t.latin >= 1) return { rule: 'TYP-15', what: 'One word' };
  return null;
}

/** Text blocks for LAY-03 heading rhythm, LAY-04 cramped padding and LAY-05 edge margin. */
/**
 * Advisory TYP-14 and I18N-08 inputs. TYP-14: short numeric values that are compared or update in place (table
 * cells, grid cells, live regions, <data>/<output>/<meter> values, metric tiles among numeric siblings) without
 * tabular-nums in a face whose digits differ in width. I18N-08: CJK text set in a slanted style the browser may
 * synthesise (no italic exists in CJK faces), unless font-synthesis-style is none.
 */
function collectNumeralsEmphasis() {
  const U = window.__uie;
  const NUM = /^(?:[A-Za-z]{1,3}\s)?[\s$€£¥+\-−±~≈<>]*\d[\d\s,.:/%]*(?:[a-zA-Z°µ%]{0,4})?$/;
  const canvas = document.createElement('canvas');
  const c2d = canvas.getContext('2d');
  const proportional = (s) => {
    c2d.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    return Math.abs(c2d.measureText('1111111111').width - c2d.measureText('0000000000').width) > 0.5;
  };
  const numerals = [];
  const seen = new Set();
  for (const el of U.textElements(document.body, { limit: 2500 })) {
    if (numerals.length >= 30) break;
    const own = U.ownText(el);
    if (!own || own.length > 24 || (own.match(/\d/g) || []).length < 2 || !NUM.test(own)) continue;
    // Short numeric values only: running text keeps proportional figures (exception in TYP-14).
    if (el.closest('blockquote,figcaption,code,pre,kbd,samp,a[href],button,label,h1,h2,h3,h4,h5,h6')) continue;
    if (el.closest('p,li') && U.collapse(el.closest('p,li').textContent || '').length > 32) continue;
    const compared = el.closest('td,th,[role=cell],[role=gridcell],[aria-live],[role=status],[role=timer],data,output,meter,progress');
    let tile = false;
    if (!compared && el.parentElement) {
      const sibs = [...el.parentElement.parentElement?.children || []].filter((n) => n !== el.parentElement);
      tile = sibs.filter((n) => /\d/.test(n.textContent || '') && (n.textContent || '').trim().length <= 60).length >= 2;
    }
    if (!compared && !tile) continue;
    const s = U.cs(el);
    if (/tabular-nums/.test(s.fontVariantNumeric)) continue;
    if (!proportional(s)) continue;
    const sig = `${s.fontFamily}|${s.fontWeight}|${(el.className && typeof el.className === 'string') ? el.className : el.tagName}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    numerals.push({ id: U.id(el), text: own, family: s.fontFamily.split(',')[0].trim(), context: compared ? compared.tagName.toLowerCase() : 'tile', selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el) });
  }
  const slanted = [];
  for (const el of U.textElements(document.body, { limit: 2500 })) {
    if (slanted.length >= 20) break;
    const own = U.ownText(el);
    if (!own || !/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(own)) continue;
    const s = U.cs(el);
    if (!/italic|oblique/.test(s.fontStyle)) continue;
    const synth = s.fontSynthesisStyle || s.fontSynthesis || '';
    if (/\bnone\b/.test(synth) && !/style/.test(synth)) continue;
    slanted.push({ id: U.id(el), text: own.slice(0, 40), tag: el.tagName.toLowerCase(), fontStyle: s.fontStyle, selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el) });
  }
  return { numerals, slanted };
}

function collectRhythm({ narrow }) {
  const U = window.__uie;
  const vis = (el) => el && U.isVisible(el);
  const out = { headings: [], cramped: [], edges: [] };
  // LAY-03.
  for (const h of document.querySelectorAll('h2,h3,h4,h5,h6,[role=heading]')) {
    if (!vis(h)) continue;
    let node = h;
    for (let i = 0; i < 2 && node.parentElement && node.parentElement.children.length === 1 && node.parentElement !== document.body; i += 1) node = node.parentElement;
    let prev = node.previousElementSibling;
    while (prev && !vis(prev)) prev = prev.previousElementSibling;
    let next = node.nextElementSibling;
    while (next && !vis(next)) next = next.nextElementSibling;
    if (!prev || !next) continue;
    const hr = node.getBoundingClientRect();
    const pr = prev.getBoundingClientRect();
    const nr = next.getBoundingClientRect();
    const overlapX = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 4;
    if (!overlapX(hr, pr) || !overlapX(hr, nr)) continue;
    if (pr.bottom > hr.top + 1 || nr.top < hr.bottom - 1) continue;
    out.headings.push({ above: hr.top - pr.bottom, below: nr.top - hr.bottom, selector: U.selector(h), bbox: U.docRect(h), snippet: U.snippet(h), source: U.sourceOf(h), text: U.collapse(h.textContent).slice(0, 60) });
  }
  // LAY-04: bordered or filled block containers that hold text.
  const transparent = (c) => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c) || /\/ 0\)$/.test(c);
  const effBg = (el) => {
    for (let a = el; a; a = a.parentElement) {
      const c = U.cs(a).backgroundColor;
      if (!transparent(c)) return c;
    }
    return '';
  };
  for (const el of document.querySelectorAll('body *')) {
    if (out.cramped.length >= 40) break;
    if (['INPUT', 'SELECT', 'TEXTAREA', 'IMG', 'SVG', 'svg', 'VIDEO', 'CANVAS', 'IFRAME', 'HTML', 'BODY', 'CODE', 'KBD', 'MARK', 'SAMP', 'TD', 'TH', 'TR', 'TABLE', 'TBODY', 'THEAD'].includes(el.tagName)) continue;
    const s = U.cs(el);
    if (s.display.startsWith('inline') && s.display !== 'inline-block' && s.display !== 'inline-flex' && s.display !== 'inline-grid') continue;
    if (s.display === 'contents' || s.display === 'none') continue;
    if (!vis(el)) continue;
    const borders = ['Top', 'Right', 'Bottom', 'Left'].filter((k) => s[`border${k}Style`] !== 'none' && !transparent(s[`border${k}Color`]) && parseFloat(s[`border${k}Width`]) >= 1);
    const filled = !transparent(s.backgroundColor) && s.backgroundColor !== effBg(el.parentElement);
    if (!(filled || borders.length === 4)) continue;
    const text = U.collapse(el.innerText || '');
    if (!text) continue;
    // The inset is measured to the text itself. A range over the element's contents would also return the border
    // boxes of child elements, so a wrapper that carries the padding (header > .inner) would read as 0 px inset.
    const range = document.createRange();
    const rects = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t && rects.length < 400; t = walker.nextNode()) {
      if (!t.textContent.trim()) continue;
      const pe = t.parentElement;
      if (pe && (pe.closest('[aria-hidden="true"]') || U.cs(pe).visibility === 'hidden')) continue;
      range.selectNodeContents(t);
      for (const q of range.getClientRects()) if (q.width > 0.5 && q.height > 0.5) rects.push(q);
    }
    if (!rects.length) continue;
    const tb = { l: Math.min(...rects.map((q) => q.left)), t: Math.min(...rects.map((q) => q.top)), r: Math.max(...rects.map((q) => q.right)), b: Math.max(...rects.map((q) => q.bottom)) };
    const r = el.getBoundingClientRect();
    const inner = { l: r.left + parseFloat(s.borderLeftWidth), t: r.top + parseFloat(s.borderTopWidth), r: r.right - parseFloat(s.borderRightWidth), b: r.bottom - parseFloat(s.borderBottomWidth) };
    const ins = { top: tb.t - inner.t, bottom: inner.b - tb.b, left: tb.l - inner.l, right: inner.r - tb.r };
    if (Object.values(ins).some((v) => v < -1)) continue;
    // The size basis comes from the same text the inset was measured to: never from aria-hidden or hidden text.
    const firstText = [...el.querySelectorAll('*'), el].find((n) => U.ownText(n) && !n.closest('[aria-hidden="true"]') && U.cs(n).visibility !== 'hidden');
    const fontPx = parseFloat(U.cs(firstText || el).fontSize);
    out.cramped.push({ ins, fontPx, selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el), text: text.slice(0, 50) });
  }
  // LAY-05 (narrow widths): paragraph-like text blocks wider than half the viewport.
  if (narrow) {
    const vw = document.documentElement.clientWidth;
    for (const el of document.querySelectorAll('p,li,blockquote,dd,figcaption,div,section,article')) {
      if (out.edges.length >= 30) break;
      if (!vis(el)) continue;
      const own = U.ownText(el);
      if (el.tagName === 'DIV' || el.tagName === 'SECTION' || el.tagName === 'ARTICLE') {
        if (own.length < 40) continue;
      } else if (!own) continue;
      if (el.closest('pre,code,table,nav,button')) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= vw / 2) continue;
      const boxes = [];
      for (const c of el.childNodes) {
        if (c.nodeType !== 3 || !c.nodeValue.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(c);
        for (const q of range.getClientRects()) if (q.width > 0.5) boxes.push(q);
      }
      if (!boxes.length) continue;
      const left = Math.min(...boxes.map((q) => q.left));
      const right = vw - Math.max(...boxes.map((q) => q.right));
      if (Math.min(left, right) < 16 - 0.5) out.edges.push({ left: Math.round(left * 10) / 10, right: Math.round(right * 10) / 10, selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el), vw });
    }
  }
  return out;
}

const rel = (o) => ({ selector: o.selector, bbox: o.bbox, snippet: o.snippet, source: o.source });

export async function run(ctx) {
  const hits = [];
  const perPage = new Map(); // route#state → {ps, spacing: Map, texts...}
  const shadowStyles = new Map(); // theme → Map(key → {count, example})
  const dark = ctx.scope.themes.includes('dark');
  const scale = ctx.design.spacingScale;
  const declared = (id) => ctx.design.declared(id);
  for await (const pg of ctx.pages(ctx.states({ widths: 'all', themes: 'all' }))) {
    const ps = pg.ps;
    const page = pg.page;
    const firstTheme = ps.theme === ctx.scope.themes[0];
    const data = await page.evaluate(collect, { rootPx: 16, width: ps.width, wantSpacing: firstTheme });
    const where = (o) => ctx.loc(ps, rel(o));
    const key = `${ps.route}#${ps.state}`;
    if (!perPage.has(key)) perPage.set(key, { ps, spacing: new Map(), fonts: new Map(), roles: null });
    const agg = perPage.get(key);

    // TYP-01 minimum size; TYP-07 thin weights; TYP-08 tracking; TYP-10 justification; TYP-03 line height; TYP-04 measure.
    for (const t of data.texts) {
      const min = minTextSize({ cjk: t.cjk || t.cjkCount > 0, legalOrCaption: t.legal, interactive: t.interactive });
      if (t.px < min - 0.01) {
        hits.push(ctx.hit({ rule: 'TYP-01', title: `Text below ${min} px: "${t.text.slice(0, 40)}"`, description: `Rendered at ${round(t.px, 2)} px${t.cjk ? ' (CJK text: 12 px minimum without exception)' : t.legal && !t.interactive ? ' (legal or caption text: 11 px minimum)' : ''}; the minimum is ${min} px.`, location: where(t), evidence: [{ type: 'measurement', value: round(t.px, 2), detail: `font-size ${round(t.px, 2)} px < ${min} px` }] }));
      }
      if (t.weight < 400 && t.px < 24) {
        hits.push(ctx.hit({ rule: 'TYP-07', title: `Thin weight ${t.weight} at ${round(t.px, 1)} px: "${t.text.slice(0, 40)}"`, description: `Weight ${t.weight} is below 400 on text smaller than 24 px.`, location: where(t), evidence: [{ type: 'measurement', value: { weight: t.weight, px: round(t.px, 1) }, detail: `weight ${t.weight} < 400 at ${round(t.px, 1)} px` }] }));
      }
      const upper = t.transform === 'uppercase' || (t.latin >= 2 && t.text === t.text.toUpperCase() && /\p{Lu}/u.test(t.text));
      const tracking = trackingProblems({ px: t.px, letterSpacingPx: t.ls, uppercase: upper, display: t.px >= 24 || (t.heading && t.level <= 2), cjk: t.cjk, text: t.text });
      for (const p of tracking) hits.push(ctx.hit({ rule: 'TYP-08', title: `Tracking outside the limits: "${t.text.slice(0, 40)}"`, description: `${p}.`, location: where(t), evidence: [{ type: 'measurement', value: { letter_spacing_px: t.ls, px: round(t.px, 1) }, detail: p }] }));
      if (t.align === 'justify' && t.latin > 0 && !/^auto$/.test(t.hyphens || '')) {
        hits.push(ctx.hit({ rule: 'TYP-10', title: `Justified Latin text without hyphenation: "${t.text.slice(0, 40)}"`, description: `text-align: justify with hyphens: ${t.hyphens || 'manual'}; justified Latin text needs hyphens: auto (and a correct lang), or start alignment.`, location: where(t), evidence: [{ type: 'measurement', value: t.hyphens || 'manual', detail: 'justify without hyphens: auto' }] }));
      }
      const lh = t.pitch || t.lh;
      if (t.lines >= 2 && lh) {
        const res = lineHeightRule({ lines: t.lines, ratio: lh / t.px, cjk: t.cjk, heading: t.heading, px: t.px });
        if (!res.ok) hits.push(ctx.hit({ rule: 'TYP-03', title: `Line height ${round(lh / t.px, 2)} below ${res.min}: "${t.text.slice(0, 40)}"`, description: `${res.kind} renders ${t.lines} lines at a line height of ${round(lh / t.px, 2)} (${round(lh, 1)} px on ${round(t.px, 1)} px text); the minimum is ${res.min}.`, location: where(t), evidence: [{ type: 'measurement', value: round(lh / t.px, 3), detail: `${t.lines} lines; pitch ${round(lh, 1)} px` }] }));
      }
      if (t.prose && t.perLine && t.perLine.length >= 2) {
        const res = measureRule(t.perLine, t.cjk);
        if (!res.ok) hits.push(ctx.hit({ rule: 'TYP-04', title: `Long measure (lines over ${res.limit} ${t.cjk ? 'glyphs' : 'characters'}): "${t.text.slice(0, 30)}"`, description: `At ${ps.width} px, ${res.over} rendered lines of this ${t.cjk ? 'CJK' : 'Latin'} prose block exceed ${res.limit} ${t.cjk ? 'glyphs' : 'characters'} (longest ${res.longest}); the target is ${t.cjk ? '≤ 40 glyphs' : '45–75 characters'}.`, location: where(t), evidence: [{ type: 'measurement', value: res.longest, detail: `${res.over} lines > ${res.limit}` }] }));
      }
      const disp = displayProblems({ px: t.px, rootPx: data.rootPx, isH1: t.tag === 'h1', text: t.text, declaredMax: declared('TYP-09') ? Number(declared('TYP-09').value) || Infinity : null });
      for (const p of disp) hits.push(ctx.hit({ rule: 'TYP-09', title: `${/^h1/.test(p) ? 'Full-sentence h1 at display size' : 'Display text above 6rem'}: "${t.text.slice(0, 40)}"`, description: `${p}.`, location: where(t), evidence: [{ type: 'measurement', value: round(t.px, 1), detail: p }] }));
    }
    // TYP-02 body size by mode (dominant body size), and inputs ≥ 16 px below 768 px.
    const body = new Map();
    for (const t of data.texts.filter((x) => x.bodyCandidate)) body.set(t.px, (body.get(t.px) || 0) + t.len);
    const dominant = [...body.entries()].sort((a, b) => b[1] - a[1])[0];
    if (dominant) {
      const need = bodyMinimum(ps.mode);
      if (dominant[0] < need - 0.01) {
        hits.push(ctx.hit({ rule: 'TYP-02', title: `Body text ${round(dominant[0], 1)} px below ${need} px on a ${ps.mode} surface`, description: `The dominant body size on ${ps.route} is ${round(dominant[0], 1)} px; ${ps.mode} surfaces need ≥ ${need} px body text.`, location: ctx.loc(ps, { selector: 'body' }), evidence: [{ type: 'measurement', value: round(dominant[0], 2), detail: `dominant body size at ${ps.width} px` }], problem_type: 'overall_structure' }));
      }
    }
    if (ps.width < 768) {
      for (const i of data.inputs) {
        if (i.px < 16 - 0.01) hits.push(ctx.hit({ rule: 'TYP-02', title: `Input text ${round(i.px, 1)} px below 16 px: ${i.name ? `"${i.name}"` : i.selector.slice(0, 40)}`, description: `At ${ps.width} px, text inputs need ≥ 16 px (iOS Safari zooms the page on smaller inputs).`, location: where(i), evidence: [{ type: 'measurement', value: round(i.px, 2), detail: `input font-size < 16 px at ${ps.width} px` }] }));
      }
    }
    // TYP-06 roles (per page state).
    const roleMap = new Map();
    for (const t of data.texts) {
      const role = t.heading ? `h${Math.min(t.level || 2, 6)}` : t.bodyCandidate ? 'body' : null;
      if (!role) continue;
      if (!roleMap.has(role)) roleMap.set(role, new Map());
      const k = `${t.px}|${t.weight}`;
      roleMap.get(role).set(k, (roleMap.get(role).get(k) || 0) + t.len);
    }
    const roles = [...roleMap.entries()]
      .map(([role, m]) => {
        const [k] = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
        const [px, weight] = k.split('|').map(Number);
        return { role, px, weight };
      })
      .sort((a, b) => (a.role === 'body' ? 99 : Number(a.role.slice(1))) - (b.role === 'body' ? 99 : Number(b.role.slice(1))));
    if (roles.length >= 3) {
      const flat = flatSteps(roles, ps.mode);
      if (flat.length) hits.push(ctx.hit({ rule: 'TYP-06', title: `Flat type hierarchy on ${ps.route}`, description: `Adjacent text roles are too close (${flat.map((f) => `${f.upper}→${f.lower} ${f.ratio}×`).join(', ')}); ${ps.mode} surfaces need steps ≥ ${flat[0].min}× or a weight difference.`, location: ctx.loc(ps, { selector: 'body' }), evidence: [{ type: 'measurement', value: roles, detail: flat.map((f) => `${f.upper}/${f.lower} ${f.ratio}`).join('; ') }], problem_type: 'overall_structure' }));
    }
    // TYP-05 families (rendered platform fonts, one node per distinct stack).
    if (firstTheme) {
      const reps = new Map();
      for (const t of data.texts) if (!reps.has(t.family)) reps.set(t.family, t);
      await withCdp(page, async (cdp) => {
        for (const [stack, t] of reps) {
          const nodeId = await nodeIdFor(cdp, t.id);
          if (!nodeId) continue;
          for (const f of await platformFonts(cdp, nodeId)) {
            if (EMOJI_OR_ICON_FAMILY.test(f.familyName) || EMOJI_OR_ICON_FAMILY.test(stack)) continue;
            const mono = /monospace/.test(stack) || /mono|code|consol|courier|menlo|monaco/i.test(f.familyName);
            const cjkFam = CJK_FAMILY.test(f.familyName);
            const k = f.familyName;
            const prev = agg.fonts.get(k) || { family: k, cjk: cjkFam, mono, outsideCode: false, glyphs: 0, example: t };
            prev.glyphs += f.glyphCount || 0;
            if (mono && !t.inCode && !t.inCell) prev.outsideCode = true;
            agg.fonts.set(k, prev);
          }
        }
      }).catch((err) => ctx.error(`${ps.key}: platform fonts unavailable: ${err.message.split('\n')[0]}`));
    }
    // LAY-01/LAY-02 declarations (deduplicated by signature, property and value) — collected on the first theme.
    for (const s of data.spacing) agg.spacing.set(`${s.sig}|${s.prop}|${s.v}`, s);
    // LAY-03, LAY-04, LAY-05.
    const rh = await page.evaluate(collectRhythm, { narrow: ps.width < 768 });
    for (const h of rh.headings) {
      if (h.above <= h.below + 0.5) hits.push(ctx.hit({ rule: 'LAY-03', title: `Heading closer to the previous section than to its content: "${h.text.slice(0, 40)}"`, description: `At ${ps.width} px the space above this heading (${round(h.above, 1)} px) is not larger than the space below it (${round(h.below, 1)} px).`, location: where(h), evidence: [{ type: 'measurement', value: { above: round(h.above, 1), below: round(h.below, 1) }, detail: `above ${round(h.above, 1)} px ≤ below ${round(h.below, 1)} px` }] }));
    }
    for (const c of rh.cramped) {
      const probs = crampedPadding({ ...c.ins, fontPx: c.fontPx });
      if (probs.length) hits.push(ctx.hit({ rule: 'LAY-04', title: `Cramped padding: "${c.text.slice(0, 40)}"`, description: `Inside this bordered or filled container (${round(c.fontPx, 1)} px text): ${probs.join('; ')}.`, location: where(c), evidence: [{ type: 'measurement', value: Object.fromEntries(Object.entries(c.ins).map(([k, v]) => [k, round(v, 1)])), detail: probs.join('; ') }] }));
    }
    // Advisory TYP-15 (no stranded last word in headings and short paragraphs) and I18N-12 (no CJK paragraph whose
    // last line holds one character, or one character and punctuation).
    for (const t of data.texts) {
      const s = strandedLine(t);
      if (!s) continue;
      hits.push(ctx.hit({ rule: s.rule, title: `${s.what} on the last line: "${t.text.slice(0, 40)}"`, description: `${t.heading ? 'This heading' : 'This text'} wraps onto ${t.lines} lines at ${ps.width} px, and its last line holds only "${t.lastLine}". ${s.rule === 'I18N-12' ? 'A stranded character reads as a broken line.' : 'A stranded word weakens the shape of the block.'}`, location: where(t), evidence: [{ type: 'measurement', value: t.lastLine, detail: `${t.lines} lines; last line "${t.lastLine}" at ${ps.width} px` }], recommendation: s.rule === 'I18N-12' ? 'Edit the copy or adjust the container width; text-wrap: pretty may help, but its effect on Chinese is unverified.' : 'Add text-wrap: balance to headings and text-wrap: pretty to paragraphs; if a word is still stranded, edit the copy or the width.' }));
    }
    // Advisory TYP-14 (tabular numerals) and I18N-08 (no synthetic italics on CJK), once per route and state.
    if (firstTheme && !agg.numeralsDone) {
      agg.numeralsDone = true;
      const ne = await page.evaluate(collectNumeralsEmphasis).catch(() => ({ numerals: [], slanted: [] }));
      for (const n of ne.numerals) {
        hits.push(ctx.hit({ rule: 'TYP-14', title: `Compared number without tabular figures: "${n.text}"`, description: `"${n.text}" sits in a ${n.context === 'tile' ? 'row of numeric tiles' : `<${n.context}>`} where values are compared or update in place, but its face (${n.family}) has digits of different widths and font-variant-numeric does not set tabular-nums, so columns and changing values wobble.`, location: where(n), evidence: [{ type: 'measurement', value: { family: n.family, context: n.context }, detail: 'proportional digits; no tabular-nums' }], recommendation: 'Put tabular-nums into the data role token and right-align numeric columns.' }));
      }
      for (const t of ne.slanted) {
        hits.push(ctx.hit({ rule: 'I18N-08', title: `Slanted CJK text: "${t.text}"`, description: `CJK text in <${t.tag}> is set in font-style ${t.fontStyle}. CJK faces have no italics, so the browser fakes a slant; emphasise with weight, a different face or emphasis dots (text-emphasis), and set font-synthesis-style: none on CJK text.`, location: where(t), evidence: [{ type: 'measurement', value: t.fontStyle, detail: `font-style ${t.fontStyle} on CJK text` }], recommendation: 'Restyle em under :lang(zh) with the emphasis weight or text-emphasis; set font-synthesis-style: none.' }));
      }
    }
    for (const e of rh.edges) {
      hits.push(ctx.hit({ rule: 'LAY-05', title: `Body text closer than 16 px to the viewport edge: "${(e.snippet || '').replace(/<[^>]*>/g, '').slice(0, 30)}"`, description: `Text starts ${e.left} px from the left and ends ${e.right} px from the right edge of a ${e.vw} px viewport; body text needs ≥ 16 px at widths below 768 px.`, location: where(e), evidence: [{ type: 'measurement', value: { left: e.left, right: e.right }, detail: `edge margin ${Math.min(e.left, e.right)} px < 16 px` }] }));
    }
    // SHP-01 concentric nesting (anchors resolved in one round trip below).
    const pending = [];
    const byId = new Map(data.boxes.map((b) => [b.id, b]));
    for (const c of data.boxes) {
      const p = c.parent !== null ? byId.get(c.parent) : null;
      if (!p || !Math.max(...p.radii) || !(p.filled || p.bw.some((w) => w > 0))) continue;
      const boundary = c.replaced || (c.filled && c.bg !== p.bg) || c.bw.some((w) => w > 0);
      if (!boundary || c.round || c.control) continue;
      const [px, py, pw, ph] = p.rect;
      const [cx, cy, cw, ch] = c.rect;
      if (cx < px - 0.5 || cy < py - 0.5 || cx + cw > px + pw + 0.5 || cy + ch > py + ph + 0.5) continue;
      const corners = [
        { i: 0, dx: cx - px, dy: cy - py, padX: p.bw[3] + p.pad[3], padY: p.bw[0] + p.pad[0] },
        { i: 1, dx: px + pw - (cx + cw), dy: cy - py, padX: p.bw[1] + p.pad[1], padY: p.bw[0] + p.pad[0] },
        { i: 2, dx: px + pw - (cx + cw), dy: py + ph - (cy + ch), padX: p.bw[1] + p.pad[1], padY: p.bw[2] + p.pad[2] },
        { i: 3, dx: cx - px, dy: py + ph - (cy + ch), padX: p.bw[3] + p.pad[3], padY: p.bw[2] + p.pad[2] },
      ];
      for (const k of corners) {
        if (Math.abs(k.dx - k.padX) > 1.5 || Math.abs(k.dy - k.padY) > 1.5) continue;
        const parentRadius = p.radii[k.i];
        if (!parentRadius) continue;
        const inset = Math.min(k.dx, k.dy);
        const v = concentricViolation({ parentRadius, inset, childRadius: c.radii[k.i] });
        if (v.fail) {
          pending.push({ id: c.id, args: {
            rule: 'SHP-01',
            title: `Nested corner not concentric (child radius ${round(c.radii[k.i], 1)} px > ${round(v.limit, 1)} px)`,
            description: `A ${c.tag} inset ${round(inset, 1)} px into a parent with radius ${round(parentRadius, 1)} px has radius ${round(c.radii[k.i], 1)} px; with an inset smaller than the parent radius the child radius must be ≤ ${round(v.limit, 1)} px.`,
            location: ctx.loc(ps, { bbox: [cx, cy, cw, ch].map((n) => Math.round(n)) }),
            evidence: [{ type: 'measurement', value: { parent_radius: round(parentRadius, 1), inset: round(inset, 1), child_radius: round(c.radii[k.i], 1) }, detail: `limit ${round(v.limit, 1)} px` }],
          } });
          break;
        }
      }
    }
    // SHP-02 shadows (styles per theme; ghost cards; zero-offset shadows).
    if (!shadowStyles.has(ps.theme)) shadowStyles.set(ps.theme, new Map());
    const styles = shadowStyles.get(ps.theme);
    for (const s of data.shadows) {
      if (s.focus) continue;
      const layers = parseShadow(s.value);
      if (!layers.length || isBorderRing(layers)) continue;
      const k = shadowKey(layers.filter((l) => !(l.blur === 0 && l.x === 0 && l.y === 0)));
      if (!styles.has(k)) styles.set(k, { value: s.value, example: s, route: ps.route, state: ps.state, ps });
      if (!s.floating && ghostCard({ borderWidth: s.borderMax, layers })) {
        hits.push(ctx.hit({ rule: 'SHP-02', title: 'Hairline border with a wide soft shadow (ghost card)', description: `An in-flow surface pairs a ${s.borderMax} px border with a shadow blur of ${Math.max(...layers.map((l) => l.blur))} px (≥ 24 px); keep one edge treatment.`, location: where(s), evidence: [{ type: 'measurement', value: s.value.slice(0, 200), detail: `border ${s.borderMax} px + blur ${Math.max(...layers.map((l) => l.blur))} px` }] }));
      }
      if (zeroOffsetShadow(layers)) {
        hits.push(ctx.hit({ rule: 'SHP-02', title: 'Shadow without offset (glow, not depth)', description: `Every blurred layer of this shadow has a zero offset (${s.value.slice(0, 120)}); a shadow needs at least one offset layer from the shared light direction.`, location: where(s), evidence: [{ type: 'measurement', value: s.value.slice(0, 200), detail: 'all blurred layers at 0 0' }] }));
      }
    }
    // COL-04 dark theme composition.
    if (dark && ps.theme === 'dark') {
      if (!/dark/.test(data.scheme)) {
        hits.push(ctx.hit({ rule: 'COL-04', title: `color-scheme does not declare dark on ${ps.route}`, description: 'The dark theme ships, but neither the root color-scheme property nor <meta name="color-scheme"> includes "dark", so form controls and scrollbars stay light.', location: ctx.loc(ps, { selector: 'html' }), evidence: [{ type: 'measurement', value: data.scheme || 'normal', detail: 'color-scheme without dark' }], problem_type: 'overall_structure' }));
      }
      const canvas = parseColor(data.canvas) || { r: 0, g: 0, b: 0, alpha: 1 };
      const effBg = (b) => {
        for (let x = b; x; x = x.parent !== null ? byId.get(x.parent) : null) {
          const c = parseColor(x.bg);
          if (c && c.alpha >= 0.99) return c;
        }
        return canvas;
      };
      for (const b of data.boxes) {
        if (!(b.dialogLike || (b.shadowed && b.filled && !b.control))) continue;
        if (b.inset || b.control) continue;
        const own = parseColor(b.bg);
        if (!own || own.alpha < 0.99) continue;
        const parent = b.parent !== null ? byId.get(b.parent) : null;
        const base = parent ? effBg(parent) : canvas;
        const lOwn = toOklab(own)[0];
        const lBase = toOklab(base)[0];
        if (lOwn < lBase - 0.005) {
          pending.push({ id: b.id, args: { rule: 'COL-04', title: 'Elevated surface darker than the surface beneath it (dark theme)', description: `In the dark theme this ${b.dialogLike ? (b.role || b.tag) : 'raised card'} has OKLab L ${round(lOwn, 3)}, darker than the base beneath it (L ${round(lBase, 3)}); on dark ground elevation reads as lightness.`, location: ctx.loc(ps, { bbox: b.rect.map((n) => Math.round(n)) }), evidence: [{ type: 'measurement', value: { surface_L: round(lOwn, 3), base_L: round(lBase, 3) }, detail: `${b.bg} over ${round(lBase, 3)}` }] } });
        }
      }
    }
    if (pending.length) {
      const anchors = await page.evaluate((ids) => ids.map((i) => {
        const U = window.__uie;
        const el = U.el(i);
        return el ? { selector: U.selector(el), snippet: U.snippet(el), source: U.sourceOf(el) } : {};
      }), pending.map((x) => x.id)).catch(() => []);
      pending.forEach((x, i) => {
        const a = anchors[i] || {};
        x.args.location = { ...x.args.location, selector: a.selector, snippet: a.snippet, source: a.source };
        hits.push(ctx.hit(x.args));
      });
    }
  }
  // Page-level aggregates: TYP-05, LAY-01, LAY-02.
  for (const { ps, spacing, fonts } of perPage.values()) {
    if (fonts.size && !ctx.design.declared('TYP-05')) {
      const latin = [...fonts.values()].filter((f) => !f.cjk && !(f.mono && !f.outsideCode));
      const cjk = [...fonts.values()].filter((f) => f.cjk);
      for (const [label, list] of [['Latin', latin], ['CJK', cjk]]) {
        if (list.length > 2) {
          hits.push(ctx.hit({ rule: 'TYP-05', title: `${list.length} ${label} type families on ${ps.route}`, description: `Rendered ${label} families: ${list.map((f) => f.family).join(', ')}; the limit is 2 per script plus an optional monospace for code or data, unless DESIGN.md declares more with a reason.`, location: ctx.loc(ps, { selector: 'body' }), evidence: [{ type: 'measurement', value: list.map((f) => f.family), detail: 'CDP CSS.getPlatformFontsForNode' }], problem_type: 'overall_structure' }));
        }
      }
    }
    const decls = [...spacing.values()];
    if (decls.length) {
      const on = decls.filter((d) => onSpacingScale(d.v, scale));
      const share = on.length / decls.length;
      if (share < 0.9 - 1e-9 && !ctx.design.declared('LAY-01')) {
        const off = decls.filter((d) => !onSpacingScale(d.v, scale));
        hits.push(ctx.hit({ rule: 'LAY-01', title: `${Math.round(share * 100)}% of spacing values on the scale on ${ps.route}`, description: `${on.length} of ${decls.length} distinct margin, padding and gap declarations are on the ${scale ? 'declared scale' : 'default scale (0, 2 px or multiples of 4 px)'}; the floor is 90%. Off-scale examples: ${off.slice(0, 6).map((d) => `${d.sig} ${d.prop} ${d.v}px`).join('; ')}.`, location: ctx.loc(ps, { selector: 'body' }), evidence: [{ type: 'measurement', value: round(share, 3), detail: `${on.length}/${decls.length} on scale` }], problem_type: 'overall_structure' }));
      }
      const mono = spacingMonotony(decls.map((d) => d.v));
      if (mono.fail) {
        hits.push(ctx.hit({ rule: 'LAY-02', title: `Spacing monotony on ${ps.route}`, description: `Among ${mono.n} spacing declarations (deduplicated by signature), ${mono.topValue} px accounts for ${Math.round(mono.topShare * 100)}% and only ${mono.distinct} distinct values are used.`, location: ctx.loc(ps, { selector: 'body' }), evidence: [{ type: 'measurement', value: mono, detail: `${mono.topValue} px = ${Math.round(mono.topShare * 100)}%, ${mono.distinct} values` }], problem_type: 'overall_structure' }));
      }
    }
  }
  for (const [theme, styles] of shadowStyles) {
    if (styles.size > 4) {
      const first = [...styles.values()][0];
      hits.push(ctx.hit({ rule: 'SHP-02', title: `${styles.size} distinct shadow styles in the ${theme} theme`, description: `The ${theme} theme uses ${styles.size} distinct shadow styles across the audited pages; the limit is 4 per theme. Styles: ${[...styles.values()].slice(0, 6).map((s) => s.value.slice(0, 60)).join(' | ')}.`, location: ctx.loc(first.ps, { selector: 'body' }), evidence: [{ type: 'measurement', value: styles.size, detail: [...styles.values()].map((s) => s.value.slice(0, 80)).join(' | ').slice(0, 480) }], problem_type: 'overall_structure' }));
    }
  }
  ctx.record({ spacing_scale: scale || 'default (0, 2 px, multiples of 4 px)', spacing_scale_source: ctx.design.spacingSource || 'default', shadow_styles: Object.fromEntries([...shadowStyles].map(([t, m]) => [t, m.size])) });
  return hits;
}
