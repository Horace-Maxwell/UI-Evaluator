// tells — DOM tell detectors for G4 (anti-slop.md; parameters from assets/data/tells.json `detect.params`, falling
// back to the QUALITY-BAR values): hard SLP-01…11 (DOM-detectable parts) and soft SLP-20…26. Copy tells SLP-12…15
// belong to the `copy` check. Each tell runs only on the modes tells.json lists for it.
import { parseColor, extractColors, toOklch, rgbToHsl, hueDistance, luminance } from '../../util/color.mjs';
import { inIndigoBand, cieChroma, isCream, chroma, round } from '../thresholds.mjs';
import { tellParams, faceOnList, normaliseFamily } from '../data.mjs';
import { loadData } from '../../gates/rules.mjs';
import { withCdp, nodeIdFor, forceState } from '../cdp.mjs';

export const mode = 'shared';
export const criteria = ['SLP-01', 'SLP-02', 'SLP-03', 'SLP-04', 'SLP-05', 'SLP-06', 'SLP-07', 'SLP-08', 'SLP-09', 'SLP-10', 'SLP-11', 'SLP-20', 'SLP-21', 'SLP-22', 'SLP-23', 'SLP-24', 'SLP-25', 'SLP-26'];
export const summary = 'DOM tell detectors (SLP-01…11, SLP-20…26)';

const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong', '-apple-system', 'blinkmacsystemfont']);
/**
 * Whether a font stack's primary face is a serif: the first family that is not a generic keyword, or the generic
 * `serif` itself. Matching the whole stack would read the fallback keyword `sans-serif` as a serif.
 */
export function isSerifStack(stack) {
  const fams = String(stack || '')
    .split(',')
    .map((f) => f.trim().replace(/^["']|["']$/g, '').toLowerCase())
    .filter(Boolean);
  const first = fams.find((f) => !GENERIC.has(f)) || fams[0] || '';
  if (first === 'serif' || first === 'ui-serif') return true;
  if (GENERIC.has(first)) return false;
  return SERIF_HINT.test(first.replace(/sans-serif/g, '').replace(/\bsans\b/g, ''));
}

const SERIF_HINT = /serif|georgia|times|garamond|playfair|fraunces|bodoni|didot|cormorant|lora|merriweather|newsreader|instrument serif|young serif|recoleta|crimson|dm serif|libre baskerville|baskerville|caslon|charter|iowan|tiempos|canela|freight|source serif|noto serif|pt serif/i;

function collect(p) {
  const U = window.__uie;
  U.reset();
  const vw = innerWidth;
  const vh = innerHeight;
  const out = { gradients: [], ctas: [], gradientText: [], emoji: [], stripes: [], eyebrows: [], heroLabels: [], tiles: [], cards: [], shadows: [], radial: [], traffic: [], liveness: [], radii: [], strokes: [], numbered: [], mono: [], headingMix: [], heroes: [], fonts: [], page: {} };
  const all = [...document.body.querySelectorAll('*')].slice(0, 5000);
  const cardEls = new Set();
  const vis = (el) => U.isVisible(el);
  const transparent = (c) => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c) || /\/ 0\)$/.test(c);
  const anchor = (el) => ({ selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el) });
  const isButtonLike = (el) => {
    if (el.matches('button,[role=button],input[type=submit],input[type=button]')) return true;
    if (!el.matches('a[href]')) return false;
    const s = U.cs(el);
    return /block|flex|grid/.test(s.display) && !transparent(s.backgroundColor) && parseFloat(s.paddingLeft) >= 6;
  };
  const PICTO = /\p{Extended_Pictographic}/u;
  const hasPicto = (t) => [...t].some((ch) => (PICTO.test(ch) && !'©®™‼⁉'.includes(ch)) || '✓✔✗✘☑☒'.includes(ch));
  const startsPicto = (t) => {
    const ch = [...t.trim()][0] || '';
    return (PICTO.test(ch) && !'©®™‼⁉'.includes(ch)) || '✓✔✗✘☑☒'.includes(ch);
  };
  const exemptUser = (el) => !!el.closest('[role=log],[contenteditable],textarea,[data-user-content],blockquote');
  for (const el of all) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)) continue;
    if (!vis(el)) continue;
    const s = U.cs(el);
    const r = el.getBoundingClientRect();
    const own = U.ownText(el);
    // SLP-01 gradient text.
    const clip = `${s.backgroundClip} ${s.webkitBackgroundClip || ''}`;
    if (/\btext\b/.test(clip) && /gradient/.test(s.backgroundImage) && U.collapse(el.textContent)) out.gradientText.push({ ...anchor(el), value: s.backgroundImage.slice(0, 200) });
    // SLP-02 gradients and CTA fills.
    if (/gradient/.test(s.backgroundImage)) out.gradients.push({ ...anchor(el), value: s.backgroundImage.slice(0, 400), area: r.width * r.height, top: r.top + scrollY });
    if (isButtonLike(el) && !transparent(s.backgroundColor)) out.ctas.push({ ...anchor(el), bg: s.backgroundColor, name: U.accName(el).slice(0, 60), color: s.color });
    // SLP-03 emoji as icons.
    if (!exemptUser(el)) {
      const t = U.collapse(el.textContent || '');
      const before = getComputedStyle(el, '::before').content;
      const pseudo = before && before !== 'none' && before !== 'normal' ? before.slice(1, -1) : '';
      if (/^H[1-6]$/.test(el.tagName) && (hasPicto(t) || hasPicto(pseudo))) out.emoji.push({ ...anchor(el), where: 'heading', text: t.slice(0, 50) });
      else if (el.matches('button,[role=button]') && (hasPicto(own) || hasPicto(pseudo))) out.emoji.push({ ...anchor(el), where: 'button', text: t.slice(0, 50) });
      else if (el.tagName === 'LI' && (startsPicto(t) || hasPicto(pseudo))) out.emoji.push({ ...anchor(el), where: 'list marker', text: t.slice(0, 50) });
      else if (el.closest('nav') && el.matches('a,button') && (startsPicto(t) || hasPicto(pseudo))) out.emoji.push({ ...anchor(el), where: 'navigation prefix', text: t.slice(0, 50) });
    }
    // SLP-04 side stripes (colours judged in Node).
    if (!el.matches('a,button,input,select,textarea,td,th,blockquote,[role=alert],[role=status],[aria-current],hr') && !el.closest('nav [aria-current]') && !s.display.startsWith('inline') && U.collapse(el.innerText || '').length >= 2) {
      const w = ['Top', 'Right', 'Bottom', 'Left'].map((k) => (s[`border${k}Style`] !== 'none' && !transparent(s[`border${k}Color`]) ? parseFloat(s[`border${k}Width`]) || 0 : 0));
      const c = ['Top', 'Right', 'Bottom', 'Left'].map((k) => s[`border${k}Color`]);
      if (Math.max(...w) >= 2 && new Set(w).size > 1) out.stripes.push({ ...anchor(el), w, c, rounded: parseFloat(s.borderTopLeftRadius) > 0 || parseFloat(s.borderBottomLeftRadius) > 0 || parseFloat(s.borderTopRightRadius) > 0 });
    }
    // SLP-07 card-like boxes; SLP-23 radii.
    const borderVis = ['Top', 'Right', 'Bottom', 'Left'].every((k) => s[`border${k}Style`] !== 'none' && !transparent(s[`border${k}Color`]) && parseFloat(s[`border${k}Width`]) > 0);
    const shadow = s.boxShadow && s.boxShadow !== 'none' && !/inset/.test(s.boxShadow);
    const radius = Math.max(parseFloat(s.borderTopLeftRadius) || 0, parseFloat(s.borderTopRightRadius) || 0, parseFloat(s.borderBottomLeftRadius) || 0, parseFloat(s.borderBottomRightRadius) || 0);
    const filled = !transparent(s.backgroundColor);
    if ((borderVis || shadow) && (radius > 0 || filled) && r.width >= 50 && r.height >= 30 && U.collapse(el.innerText || '').length >= 10 && !el.matches('button,input,select,textarea,[role=button],dialog,[role=dialog]')) {
      cardEls.add(el);
      out.cards.push({ ...anchor(el), id: U.id(el), shadow: shadow ? s.boxShadow : null, radius, el });
    }
    if (radius > 0 && r.width > 0 && radius < Math.min(r.width, r.height) / 2 - 0.5 && (filled || borderVis || shadow || ['IMG', 'VIDEO'].includes(el.tagName))) out.radii.push(Math.round(radius));
    // SLP-08 shadows (box and text) and radial washes.
    if (shadow) out.shadows.push({ ...anchor(el), value: s.boxShadow, kind: 'box', id: U.id(el) });
    if (s.textShadow && s.textShadow !== 'none' && own) out.shadows.push({ ...anchor(el), value: s.textShadow, kind: 'text', id: U.id(el) });
    if (/radial-gradient/.test(s.backgroundImage) && r.width >= vw * 0.4 && r.top + scrollY < vh * 1.5) out.radial.push({ ...anchor(el), value: s.backgroundImage.slice(0, 400) });
    // SLP-25 monospace labels outside code and data; SLP-11 small looping indicators.
    if (own && /monospace|mono\b|courier|consolas|menlo|monaco|code/i.test(s.fontFamily) && !el.closest('code,pre,kbd,samp,td,th,[class*="code" i]')) out.mono.push({ ...anchor(el), text: own.slice(0, 40), family: s.fontFamily.slice(0, 80) });
  }
  for (const c of out.cards) {
    let a = c.el.parentElement;
    while (a && !cardEls.has(a)) a = a.parentElement;
    c.inCard = a ? U.selector(a) : null;
    delete c.el;
  }
  // Ground colour and headings.
  const bodyBg = (() => {
    for (const e of [document.body, document.documentElement]) {
      const c = U.cs(e).backgroundColor;
      if (!transparent(c)) return c;
    }
    return U.canvasColor();
  })();
  out.page.ground = bodyBg;
  // SLP-05 eyebrows and SLP-22 hero formula.
  const heads = [...document.querySelectorAll('h1,h2,h3,h4')].filter(vis);
  const sections = Math.max(document.querySelectorAll('section').length, heads.filter((h) => h.tagName === 'H2').length, 1);
  out.page.sections = sections;
  const labelAbove = (h) => {
    let node = h;
    let prev = node.previousElementSibling;
    for (let i = 0; i < 2 && !prev && node.parentElement && node.parentElement !== document.body; i += 1) {
      node = node.parentElement;
      prev = node.previousElementSibling;
    }
    while (prev && !vis(prev)) prev = prev.previousElementSibling;
    return prev;
  };
  for (const h of heads) {
    const hs = U.cs(h);
    const hpx = parseFloat(hs.fontSize);
    if (hpx < 20) continue;
    const lab = labelAbove(h);
    if (!lab || /^H[1-6]$/.test(lab.tagName) || lab.matches('nav,ol,ul,form,img,svg,picture,figure,[role=navigation]') || lab.querySelector('time') || lab.closest('[aria-label*="breadcrumb" i]')) continue;
    const ls = U.cs(lab);
    const t = U.collapse(lab.innerText || '');
    const lr = lab.getBoundingClientRect();
    const hr = h.getBoundingClientRect();
    const gapV = hr.top - lr.bottom;
    const px = parseFloat(ls.fontSize);
    if (lab.querySelectorAll('*').length > 6) continue;
    const upper = ls.textTransform === 'uppercase' || (t === t.toUpperCase() && /[A-Z]/.test(t));
    const trackPx = ls.letterSpacing === 'normal' ? 0 : parseFloat(ls.letterSpacing) || 0;
    const tracked = px > 0 && trackPx / px >= p.trackingMinEm - 1e-6;
    // Exempt labels that are dates or meta lines (a full date, not merely a year inside a slogan).
    const dateLike = /^\W*(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}-\d{2}-\d{2}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? \d{1,2}(, \d{4})?|\d{1,2} (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4})\W*$/i.test(t) || /\d+ min(ute)?s? read/i.test(t);
    const sideBySide = Math.min(lr.right, hr.right) - Math.max(lr.left, hr.left) <= 0 && Math.abs(lr.top - hr.top) < hr.height;
    const splitColumn = sideBySide && /grid/.test(U.cs(lab.parentElement || document.body).display);
    if (!(gapV >= -2 && gapV <= 40) && !splitColumn) continue;
    if (dateLike) continue;
    const pill = parseFloat(ls.borderTopLeftRadius) >= lr.height / 2 - 1 && (!transparent(ls.backgroundColor) || parseFloat(ls.borderTopWidth) > 0);
    if (h.tagName === 'H1' && hpx >= p.heroH1Min && t.length >= 2 && t.length <= 60 && px <= p.labelMaxPx + 0.01) {
      const bold = Number(ls.fontWeight) >= 700;
      const dash = /^[—–-]\s*\S/.test(t);
      if ((upper && trackPx >= 1.6 - 1e-6) || bold || dash || pill) out.heroLabels.push({ ...anchor(lab), text: t.slice(0, 60), color: ls.color, bold, dash, pill, upper, trackPx, heading: U.selector(h) });
    }
    if (t.length >= p.labelChars[0] && t.length <= p.labelChars[1] && px <= p.labelMaxPx + 0.01 && (upper || tracked)) out.eyebrows.push({ ...anchor(lab), text: t, heading: U.selector(h), headingText: U.collapse(h.textContent).slice(0, 40), splitColumn, level: h.tagName });
  }
  const h1 = heads.find((h) => h.tagName === 'H1');
  if (h1) {
    let hero = h1.parentElement;
    for (let i = 0; i < 3 && hero && hero !== document.body; i += 1) {
      if (hero.querySelectorAll('a[href],button').length >= 2) break;
      hero = hero.parentElement;
    }
    if (hero && hero !== document.body) {
      const hs = U.cs(h1);
      const centred = hs.textAlign === 'center' || U.cs(hero).textAlign === 'center';
      const buttons = [...hero.querySelectorAll('a[href],button')].filter((b) => vis(b) && isButtonLike(b));
      out.heroes.push({ ...anchor(hero), centred, buttons: buttons.length, h1px: parseFloat(hs.fontSize), gradientPrimary: buttons.some((b) => /gradient/.test(U.cs(b).backgroundImage)) });
    }
  }
  // SLP-06 icon tiles.
  const parents = new Set();
  for (const h of document.querySelectorAll('h2,h3,h4,h5,h6')) {
    const card = h.parentElement;
    if (card && card.parentElement) parents.add(card.parentElement);
  }
  for (const par of parents) {
    const kids = [...par.children].filter(vis);
    if (kids.length < p.minCards) continue;
    const sized = kids.map((k) => ({ k, r: k.getBoundingClientRect() }));
    const w0 = sized[0].r.width;
    const h0 = sized[0].r.height;
    const equal = sized.filter((x) => Math.abs(x.r.width - w0) <= w0 * 0.1 && Math.abs(x.r.height - h0) <= Math.max(h0 * 0.25, 20));
    if (equal.length < p.minCards) continue;
    const withTile = equal.filter(({ k }) => {
      const head = k.querySelector('h2,h3,h4,h5,h6');
      if (!head) return false;
      const hr = head.getBoundingClientRect();
      return [...k.querySelectorAll('*')].some((t) => {
        if (t === head || t.contains(head)) return false;
        const tr = t.getBoundingClientRect();
        const ts = U.cs(t);
        if (tr.width < p.tilePx[0] || tr.width > p.tilePx[1]) return false;
        const aspect = tr.width / Math.max(1, tr.height);
        if (aspect < p.tileAspect[0] || aspect > p.tileAspect[1]) return false;
        const boxed = !transparent(ts.backgroundColor) || (parseFloat(ts.borderTopWidth) > 0 && ts.borderTopStyle !== 'none');
        if (!boxed) return false;
        if (parseFloat(ts.borderTopLeftRadius) >= tr.width / 2 - 0.5) return false;
        const icon = t.querySelector('svg,img,i,[class*="icon" i]') || /\p{Extended_Pictographic}/u.test(t.textContent || '');
        return !!icon && tr.bottom <= hr.top + 2;
      });
    });
    if (withTile.length >= p.minCards) out.tiles.push({ ...anchor(par), count: withTile.length });
  }
  // SLP-10 traffic lights.
  for (const par of new Set([...document.querySelectorAll('body *')].filter((e) => e.children.length >= 3 && e.children.length <= 8).slice(0, 2000))) {
    const dots = [...par.children].filter((d) => {
      const r = d.getBoundingClientRect();
      const s = U.cs(d);
      return r.width >= 6 && r.width <= 20 && Math.abs(r.width - r.height) <= 2 && parseFloat(s.borderTopLeftRadius) >= r.width * 0.4 && !transparent(s.backgroundColor);
    });
    if (dots.length >= 3) out.traffic.push({ ...anchor(par), colours: dots.slice(0, 3).map((d) => U.cs(d).backgroundColor), text: U.collapse(par.parentElement ? par.parentElement.innerText : '').slice(0, 80) });
  }
  // SLP-11 looping indicators (running animations).
  for (const a of document.getAnimations()) {
    const t = a.effect && a.effect.target;
    if (!t || !vis(t)) continue;
    const timing = a.effect.getComputedTiming();
    if (timing.iterations !== Infinity) continue;
    const r = t.getBoundingClientRect();
    let frames = [];
    try {
      frames = a.effect.getKeyframes();
    } catch {
      frames = [];
    }
    const props = new Set(frames.flatMap((f) => Object.keys(f)));
    const rotates = frames.some((f) => /rotate/.test(f.transform || '') || f.rotate);
    const translatesX = frames.some((f) => /translate(X|3d)?\(\s*-?\d/.test(f.transform || ''));
    const s = U.cs(t);
    const roundSmall = r.width <= 16 && r.height <= 16 && parseFloat(s.borderTopLeftRadius) >= r.width * 0.4;
    const busy = !!t.closest('[role=progressbar],[aria-busy="true"],progress');
    out.liveness.push({ ...anchor(t), name: a.animationName || a.id || '', rotates, translatesX, roundSmall, busy, thin: r.width <= 4, wide: r.width > vw, props: [...props].filter((k) => !['offset', 'easing', 'composite', 'computedOffset'].includes(k)), steps: /steps/.test(timing.easing || '') || /steps/.test(s.animationTimingFunction), text: U.collapse(t.textContent).slice(0, 8) });
  }
  for (const m of document.querySelectorAll('marquee')) out.liveness.push({ ...anchor(m), marquee: true });
  // SLP-24 stroke widths of small icon SVGs.
  for (const svg of document.querySelectorAll('svg')) {
    const r = svg.getBoundingClientRect();
    if (r.width === 0 || r.width > 32 || r.height > 32 || !vis(svg)) continue;
    const shape = svg.querySelector('path,line,polyline,circle,rect,polygon');
    if (!shape) continue;
    const ss = getComputedStyle(shape);
    if (!ss.stroke || ss.stroke === 'none') continue;
    const vb = svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width ? svg.viewBox.baseVal.width : r.width;
    out.strokes.push({ ...anchor(svg), sw: Math.round((parseFloat(ss.strokeWidth) || 1) * (r.width / vb) * 4) / 4 });
  }
  // SLP-25 numbered labels and heading font mixes.
  for (const h of heads) {
    const lab = labelAbove(h);
    const t = lab ? U.collapse(lab.innerText || '') : '';
    if (lab && /^(0?\d{1,2}|[ivx]{1,4})[.)]?$/i.test(t) && parseFloat(U.cs(lab).fontSize) <= 16) out.numbered.push({ ...anchor(lab), text: t, inList: !!h.closest('ol,[aria-label*="step" i],[class*="step" i],[class*="timeline" i]') });
    const hs = U.cs(h);
    const hpx = parseFloat(hs.fontSize);
    const text = U.collapse(h.textContent || '');
    if (hpx >= p.accentRunMinPx && text.length <= p.accentRunMaxChars) {
      for (const run of h.querySelectorAll('span,em,i,strong,b,mark')) {
        if (!U.collapse(run.textContent)) continue;
        const rs = U.cs(run);
        if (rs.fontFamily !== hs.fontFamily || rs.fontStyle !== hs.fontStyle || rs.color !== hs.color) {
          out.headingMix.push({ ...anchor(h), run: U.collapse(run.textContent).slice(0, 30), diff: [rs.fontFamily !== hs.fontFamily && 'family', rs.fontStyle !== hs.fontStyle && 'style', rs.color !== hs.color && 'colour'].filter(Boolean) });
          break;
        }
      }
    }
  }
  // SLP-20 faces: display (h1/h2 or ≥ 32 px) and body families with their share of text.
  const famShare = new Map();
  let total = 0;
  for (const el of U.textElements(document.body, { limit: 2500 })) {
    const t = U.ownText(el);
    if (!t) continue;
    const s = U.cs(el);
    const display = /^H[12]$/.test(el.tagName) || parseFloat(s.fontSize) >= 32;
    const k = s.fontFamily;
    const e = famShare.get(k) || { stack: k, chars: 0, display: 0, italicDisplay: 0 };
    e.chars += t.length;
    if (display) {
      e.display += t.length;
      if (s.fontStyle === 'italic') e.italicDisplay += t.length;
    }
    famShare.set(k, e);
    total += t.length;
  }
  out.fonts = [...famShare.values()].map((f) => ({ ...f, share: total ? f.chars / total : 0 }));
  out.page.links = [...document.querySelectorAll('a[href]')].filter(vis).slice(0, 60).map((a) => U.cs(a).color);
  return out;
}

const firstFamily = (stack) => String(stack || '').split(',').map((f) => f.trim().replace(/^["']|["']$/g, '')).find((f) => f && !GENERIC.has(f.toLowerCase())) || null;

function modesFor(id) {
  const t = loadData('tells', { tells: {} }).tells || {};
  return t[id]?.modes || null;
}

export async function run(ctx) {
  const hits = [];
  const p5 = tellParams('SLP-05', { label_max_px: 14, tracking_min_em: 0.06, label_chars: [2, 34], heading_min_px: 20, hero: { h1_min_px: 48 } });
  const p6 = tellParams('SLP-06', { min_cards: 3, tile_px: [32, 128], tile_aspect: [0.7, 1.4] });
  const p7 = tellParams('SLP-07', { identical_shadow_min_cards: 4, radius_min_px: 16, radius_share_gt: 0.8 });
  const p8 = tellParams('SLP-08', { cie_lch_chroma_min: 30, blur_gt_px: 4, dark_ground_luminance_lt: 0.1 });
  const p20 = tellParams('SLP-20', { cluster_text_share_min: 0.25 });
  const p23 = tellParams('SLP-23', { share_gt: 0.8, radius_min_px: 16 });
  const p25 = tellParams('SLP-25', { accent_run_heading_min_px: 32, accent_run_heading_max_chars: 140 });
  const p26 = tellParams('SLP-26', { hover_property_changes_gt: 1 });
  const brand = ctx.design.brandColors.filter((c) => chroma(c) >= 0.05).map((c) => toOklch(c).h);
  const inBrand = (c) => brand.some((h) => hueDistance(h, toOklch(c).h) <= 20);
  const declaredRadius = ctx.design.design?.fm?.rounded ? Object.values(ctx.design.design.fm.rounded).map((v) => Math.round(parseFloat(v) || 0)) : [];
  for await (const pg of ctx.pages(ctx.states({ widths: 'first', themes: 'all' }))) {
    const ps = pg.ps;
    const allowed = (id) => {
      const m = modesFor(id);
      return !m || m.includes(ps.mode);
    };
    const data = await pg.page.evaluate(collect, {
      trackingMinEm: p5.tracking_min_em,
      labelChars: p5.label_chars,
      labelMaxPx: p5.label_max_px,
      heroH1Min: p5.hero?.h1_min_px || 48,
      minCards: p6.min_cards,
      tilePx: p6.tile_px,
      tileAspect: p6.tile_aspect,
      accentRunMinPx: p25.accent_run_heading_min_px,
      accentRunMaxChars: p25.accent_run_heading_max_chars,
    });
    const where = (o) => ctx.loc(ps, { selector: o.selector, bbox: o.bbox, snippet: o.snippet, source: o.source });
    const add = (rule, o, title, description, value, extra) => {
      if (!allowed(rule)) return;
      hits.push(ctx.hit({ rule, title, description, location: where(o), evidence: [{ type: 'measurement', value, detail: typeof value === 'string' ? value.slice(0, 200) : JSON.stringify(value).slice(0, 200) }], extra }));
    };
    // SLP-01
    for (const g of data.gradientText) add('SLP-01', g, 'Gradient text', `Text is filled with a gradient through background-clip: text (${g.value.slice(0, 100)}). Decide which emphasis lever the type system gives instead.`, g.value);
    // SLP-02
    for (const g of data.gradients) {
      const stops = extractColors(g.value).map((x) => x.color).filter((c) => c.alpha > 0.2);
      const bad = stops.find((c) => inIndigoBand(c) && !inBrand(c));
      if (bad) add('SLP-02', g, 'Indigo-violet gradient', `A gradient stop sits in the indigo-violet band (OKLCH hue ${round(toOklch(bad).h, 0)}°, chroma ${round(toOklch(bad).c, 3)}) and the hue is not in the documented brand palette.`, g.value.slice(0, 200));
    }
    for (const c of data.ctas) {
      const col = parseColor(c.bg);
      if (col && inIndigoBand(col) && !inBrand(col)) add('SLP-02', c, `Indigo-violet call to action: "${c.name.slice(0, 30)}"`, `The filled call to action uses ${c.bg} (OKLCH hue ${round(toOklch(col).h, 0)}°), in the indigo-violet band, and the hue is not in the documented brand palette.`, c.bg);
    }
    // SLP-03
    for (const e of data.emoji) add('SLP-03', e, `Emoji or pictograph used as an icon (${e.where})`, `"${e.text}" uses an emoji or pictographic glyph as an icon, bullet or prefix in a ${e.where}.`, e.text);
    // SLP-04
    for (const s of data.stripes) {
      const sides = ['top', 'right', 'bottom', 'left'];
      for (const i of [3, 1, 0, 2]) {
        const w = s.w[i];
        const others = s.w.filter((_, j) => j !== i);
        const wo = Math.max(...others);
        const col = parseColor(s.c[i]);
        if (!col || chroma(col) < 0.05 || w <= wo) continue;
        const vertical = i === 1 || i === 3;
        const ok = vertical ? (w >= (s.rounded ? 2 : 3) - 0.01 || (wo > 0 && w >= 2 * wo)) : s.rounded && w >= 3 - 0.01;
        if (ok) {
          add('SLP-04', s, `Decorative ${sides[i]} stripe`, `A ${w} px coloured ${sides[i]} border (${s.c[i]}) on a non-semantic block, against ${wo} px on the other sides. If it marks a state, use the state system's cues; otherwise remove it.`, { side: sides[i], width: w, other: wo, color: s.c[i] });
          break;
        }
      }
    }
    // SLP-05
    if (allowed('SLP-05')) {
      const limit = Math.ceil(data.page.sections / 3);
      const split = data.eyebrows.filter((e) => e.splitColumn);
      if (data.eyebrows.length > limit) {
        const e = data.eyebrows[0];
        add('SLP-05', e, `Eyebrow labels above ${data.eyebrows.length} headings`, `${data.eyebrows.length} short uppercase or tracked labels sit directly above headings (limit ceil(${data.page.sections} sections ÷ 3) = ${limit}): ${data.eyebrows.slice(0, 5).map((x) => `"${x.text}"`).join(', ')}.`, { count: data.eyebrows.length, limit });
      } else for (const e of split) add('SLP-05', e, `Eyebrow label split into a different grid column: "${e.text}"`, `The label "${e.text}" sits in a different grid column from its heading "${e.headingText}".`, e.text);
      for (const h of data.heroLabels) add('SLP-05', h, `Pill or eyebrow above the hero headline: "${h.text.slice(0, 30)}"`, `A ${h.pill ? 'pill' : 'label'} ("${h.text}") sits directly above an h1 of 48 px or more${h.dash ? ' (dash-prefixed)' : ''}${h.bold ? ' (bold)' : ''}${h.upper ? ' (uppercase, tracked)' : ''}.`, h.text);
    }
    // SLP-06
    for (const t of data.tiles) add('SLP-06', t, `Icon-tile feature row (${t.count} cards)`, `${t.count} equal sibling cards each put an icon in a tinted square tile above a heading. Let the content set count, order and weight.`, { cards: t.count });
    // SLP-07
    if (allowed('SLP-07')) {
      const nested = data.cards.filter((c) => c.inCard);
      for (const n of nested.slice(0, 3)) add('SLP-07', n, 'Card nested in a card', `A card-like box (border or shadow plus radius or fill) sits inside another card-like box (${n.inCard}). Decide whether each container is an object or a group.`, n.inCard);
      const byShadow = new Map();
      for (const c of data.cards) if (c.shadow) byShadow.set(c.shadow, (byShadow.get(c.shadow) || 0) + 1);
      const [shadowValue, count] = [...byShadow.entries()].sort((a, b) => b[1] - a[1])[0] || [null, 0];
      const radii = data.radii;
      const top = mostCommon(radii);
      if (count >= p7.identical_shadow_min_cards && top && top.value >= p7.radius_min_px && top.share > p7.radius_share_gt) {
        add('SLP-07', data.cards.find((c) => c.shadow === shadowValue), 'Card kit: one shadow and one large radius everywhere', `${count} cards share the shadow ${shadowValue.slice(0, 80)} and ${Math.round(top.share * 100)}% of rounded elements use ${top.value} px.`, { cards: count, radius: top.value, share: round(top.share, 2) });
      }
    }
    // SLP-08
    const ground = parseColor(data.page.ground) || { r: 1, g: 1, b: 1, alpha: 1 };
    const darkGround = luminance(ground) < p8.dark_ground_luminance_lt;
    for (const s of data.shadows) {
      const layers = parseShadowLayers(s.value);
      const glow = layers.find((l) => l.color && l.blur > p8.blur_gt_px && cieChroma(l.color) >= p8.cie_lch_chroma_min && l.color.alpha > 0.15 && l.x === 0 && l.y === 0);
      const neon = darkGround && layers.find((l) => l.color && l.blur > p8.blur_gt_px && cieChroma(l.color) >= p8.cie_lch_chroma_min && l.color.alpha > 0.15);
      if (glow) add('SLP-08', s, `Decorative glow (${s.kind}-shadow)`, `A zero-offset chromatic ${s.kind}-shadow (blur ${glow.blur} px, CIE LCh chroma ${round(cieChroma(glow.color), 0)}) glows around the element.`, s.value.slice(0, 200), { variant: 'zero-offset' });
      else if (neon) add('SLP-08', s, `Chromatic glow on a dark ground (${s.kind}-shadow)`, `A chromatic blurred ${s.kind}-shadow (chroma ${round(cieChroma(neon.color), 0)}) on a ground with luminance ${round(luminance(ground), 3)} (< 0.1).`, s.value.slice(0, 200), { variant: 'dark-neon' });
    }
    for (const r of data.radial) {
      const stops = extractColors(r.value).map((x) => x.color);
      const chromatic = stops.find((c) => c.alpha > 0.05 && cieChroma(c) >= p8.cie_lch_chroma_min);
      const fades = stops.some((c) => c.alpha < 0.05) || /transparent/.test(r.value);
      if (chromatic && fades) add('SLP-08', r, 'Chromatic radial wash behind the hero', `A chromatic radial gradient fading to transparent sits behind the top of the page (${r.value.slice(0, 100)}).`, r.value.slice(0, 200), { variant: 'radial-wash' });
    }
    // SLP-09 uniform entrance (from the pre-scroll snapshot).
    const pre = pg.preSettle;
    if (pre && allowed('SLP-09')) {
      const byAnim = new Map();
      for (const h of [...pre.hidden, ...pre.animated].filter((x) => x.section && x.anim)) byAnim.set(h.anim, [...(byAnim.get(h.anim) || []), h]);
      const [anim, els] = [...byAnim.entries()].sort((a, b) => b[1].length - a[1].length)[0] || [null, []];
      const revealed = pre.hidden.filter((h) => h.section && h.below);
      if (els.length >= 3) add('SLP-09', els[0], `Same entrance animation on ${els.length} sections`, `${els.length} section-level elements share the entrance keyframes "${anim}".`, { keyframes: anim, sections: els.length });
      else if (revealed.length >= 3) add('SLP-09', revealed[0], `Reveal-on-scroll on ${revealed.length} sections`, `${revealed.length} section-level elements below the fold start at opacity 0 with a transform before scrolling (one reveal pattern applied to every section).`, { sections: revealed.length });
    }
    // SLP-10 traffic lights.
    for (const t of data.traffic) {
      const hues = t.colours.map((c) => parseColor(c)).filter(Boolean).map((c) => ({ h: rgbToHsl(c).h, s: rgbToHsl(c).s }));
      if (hues.length < 3 || hues.some((h) => h.s < 0.4)) continue;
      const red = (h) => h <= 20 || h >= 340;
      const yellow = (h) => h >= 35 && h <= 60;
      const green = (h) => h >= 90 && h <= 150;
      if (red(hues[0].h) && yellow(hues[1].h) && green(hues[2].h)) add('SLP-10', t, 'Fake window chrome (traffic-light dots)', 'Three small red, yellow and green circles imitate a window title bar. Show the real thing (a real screenshot or a working component) instead.', t.colours.join(' '));
    }
    // SLP-11 simulated liveness.
    for (const l of data.liveness) {
      if (l.marquee) {
        add('SLP-11', l, 'Marquee', 'A <marquee> scrolls content continuously.', 'marquee');
        continue;
      }
      if (l.busy || l.rotates) continue;
      if (l.roundSmall) add('SLP-11', l, 'Pulsing dot', `A small round element loops an animation forever ("${l.name}") as if it showed live status.`, l.name);
      else if (l.translatesX && (l.wide || /marquee|scroll|ticker|slide/i.test(l.name))) add('SLP-11', l, 'Scrolling marquee animation', `An infinite horizontal translation ("${l.name}") scrolls a row continuously.`, l.name);
      else if (l.thin || /^[|▌_]$/.test(l.text) || (l.steps && l.props.includes('opacity'))) add('SLP-11', l, 'Blinking cursor outside an input', `An infinite blink ("${l.name}") imitates a text cursor outside any input.`, l.name);
    }
    if (pre && allowed('SLP-11')) {
      const now = await pg.page.evaluate((ids) => ids.map((i) => (window.__uie.el(i) ? window.__uie.ownText(window.__uie.el(i)) : null)), pre.numbers.map((n) => n.id)).catch(() => []);
      const num = (t) => Number(String(t || '').replace(/[^\d.]/g, ''));
      pre.numbers.forEach((n, i) => {
        const later = now[i];
        if (later && later !== n.text && num(later) > num(n.text) && num(n.text) < num(later) * 0.8) {
          hits.push(ctx.hit({ rule: 'SLP-11', title: `Count-up number: "${later}"`, description: `The number counted up from "${n.text}" to "${later}" after load; unless it is bound to live data, make it static.`, location: ctx.loc(ps, { selector: 'body', snippet: later }), evidence: [{ type: 'measurement', value: `${n.text} → ${later}`, detail: 'value changed after load' }] }));
        }
      });
    }
    // SLP-20 saturated faces.
    if (allowed('SLP-20')) {
      const fonts = data.fonts.filter((f) => f.chars > 0);
      const displayFont = fonts.filter((f) => f.display > 0).sort((a, b) => b.display - a.display)[0];
      const bodyFont = fonts.sort((a, b) => b.chars - a.chars)[0];
      const flagged = new Set();
      const consider = (f, role) => {
        const fam = firstFamily(f.stack);
        const face = faceOnList(fam || f.stack);
        if (!face || flagged.has(face.name)) return;
        const share = f.share;
        const cluster = face.group !== 'first-order';
        const only = fonts.length === 1;
        const reason = role === 'display' ? 'the display face' : only ? 'the only face' : cluster && share >= p20.cluster_text_share_min ? `a cluster face carrying ${Math.round(share * 100)}% of the text` : null;
        if (!reason) return;
        if (role !== 'display' && ['operate', 'read'].includes(ps.mode) && !only) return;
        flagged.add(face.name);
        hits.push(ctx.hit({ rule: 'SLP-20', title: `Saturated face as ${reason.split(' carrying')[0]}: ${face.name}`, description: `${face.name} (${face.group} on the dated saturated-face list) is ${reason}; it needs a recorded reason in DESIGN.md (the job it does that no other candidate does).`, location: ctx.loc(ps, { selector: role === 'display' ? 'h1' : 'body' }), evidence: [{ type: 'measurement', value: normaliseFamily(fam || ''), detail: `${f.stack.slice(0, 100)}; ${Math.round(share * 100)}% of text` }] }));
      };
      if (displayFont) consider(displayFont, 'display');
      if (bodyFont) consider(bodyFont, 'body');
      for (const f of fonts) if (f.share >= p20.cluster_text_share_min) consider(f, 'body');
    }
    // SLP-21 second-order house looks.
    if (allowed('SLP-21')) {
      const accents = [...data.ctas.map((c) => parseColor(c.bg)), ...data.page.links.map((c) => parseColor(c))].filter((c) => c && chroma(c) >= 0.08);
      const displayStack = (data.fonts.filter((f) => f.display > 0).sort((a, b) => b.display - a.display)[0] || {}).stack || '';
      const serifDisplay = isSerifStack(displayStack) || data.fonts.some((f) => f.italicDisplay > 0);
      if (isCream(ground) && serifDisplay && accents.some((c) => toOklch(c).h >= 25 && toOklch(c).h <= 60)) {
        hits.push(ctx.hit({ rule: 'SLP-21', title: 'Cream ground + serif display + terracotta accent', description: `The page ground ${data.page.ground} is cream, the display face is a serif (${displayStack.slice(0, 60)}) and the accent is terracotta or clay: a second-order house look, unless the brief asks for it.`, location: ctx.loc(ps, { selector: 'body' }), evidence: [{ type: 'measurement', value: data.page.ground, detail: 'cream ground, serif display, terracotta accent' }], problem_type: 'overall_structure', extra: { variant: 'cream' } }));
      }
      const hues = [...new Set(accents.map((c) => Math.round(toOklch(c).h / 15)))];
      const acid = accents.filter((c) => chroma(c) >= 0.15 && ((toOklch(c).h >= 90 && toOklch(c).h <= 150) || (toOklch(c).h >= 10 && toOklch(c).h <= 30)));
      if (luminance(ground) < 0.05 && acid.length && hues.length <= 2) {
        hits.push(ctx.hit({ rule: 'SLP-21', title: 'Near-black ground with one acid accent', description: `The ground has luminance ${round(luminance(ground), 3)} (< 0.05) and the only accent is a high-chroma acid hue (OKLCH ${round(toOklch(acid[0]).h, 0)}°) [calibrating].`, location: ctx.loc(ps, { selector: 'body' }), evidence: [{ type: 'measurement', value: data.page.ground, detail: 'near-black ground, single acid accent' }], problem_type: 'overall_structure', extra: { variant: 'near-black' } }));
      }
    }
    // SLP-22 SaaS hero formula (Persuade by default, per tells.json modes).
    for (const h of data.heroes) {
      if (h.centred && h.buttons >= 2 && (data.heroLabels.length || data.eyebrows.some((e) => e.level === 'H1'))) {
        add('SLP-22', h, 'SaaS hero formula', `A centred hero holds the h1 (${round(h.h1px, 0)} px), ${h.buttons} calls to action${h.gradientPrimary ? ' (gradient primary)' : ''} and an eyebrow or pill above the headline.`, { buttons: h.buttons, gradient_primary: h.gradientPrimary });
      }
    }
    // SLP-23 radius monotony.
    if (allowed('SLP-23') && data.radii.length >= 5) {
      const top = mostCommon(data.radii);
      if (top.value >= p23.radius_min_px && top.share > p23.share_gt && !declaredRadius.includes(top.value)) {
        hits.push(ctx.hit({ rule: 'SLP-23', title: `Radius monotony: ${Math.round(top.share * 100)}% of radii are ${top.value} px`, description: `${Math.round(top.share * 100)}% of ${data.radii.length} rounded elements share ${top.value} px, with no documented radius system that declares it.`, location: ctx.loc(ps, { selector: 'body' }), evidence: [{ type: 'measurement', value: { radius: top.value, share: round(top.share, 2), n: data.radii.length }, detail: 'computed border-radius histogram' }], problem_type: 'overall_structure' }));
      }
    }
    // SLP-24 mixed stroke widths.
    const widths = [...new Set(data.strokes.map((s) => s.sw))];
    if (allowed('SLP-24') && widths.length >= 2 && data.strokes.length >= 3) {
      hits.push(ctx.hit({ rule: 'SLP-24', title: `Icons with ${widths.length} different stroke widths`, description: `Small stroked SVG icons render at stroke widths ${widths.sort((a, b) => a - b).join(', ')} px: more than one icon family, or icons scaled inconsistently.`, location: ctx.loc(ps, { selector: data.strokes[0].selector, bbox: data.strokes[0].bbox, snippet: data.strokes[0].snippet }), evidence: [{ type: 'measurement', value: widths, detail: 'rendered stroke widths' }], problem_type: 'multiple_locations' }));
    }
    // SLP-25.
    if (allowed('SLP-25')) {
      const numbered = data.numbered.filter((n) => !n.inList);
      if (numbered.length >= 3) add('SLP-25', numbered[0], `Numbered section labels (${numbered.map((n) => n.text).slice(0, 4).join(', ')})`, `${numbered.length} small number labels mark sections that are not a sequence.`, numbered.map((n) => n.text).join(' '));
      if (data.mono.length) add('SLP-25', data.mono[0], `Monospace labels outside code: "${data.mono[0].text}"`, `${data.mono.length} text element(s) use a monospace face outside code, pre, kbd, samp and data cells (${data.mono[0].family}).`, data.mono.map((m) => m.text).slice(0, 5).join(' | '));
      for (const m of data.headingMix.slice(0, 2)) add('SLP-25', m, `Accent run in a headline: "${m.run}"`, `Inside a large headline, the run "${m.run}" changes ${m.diff.join(', ')}.`, m.run);
    }
    // SLP-26 hover clichés (forced :hover through CDP).
    if (allowed('SLP-26')) await hoverCliches(ctx, pg, p26, hits);
  }
  ctx.note('SLP-10 device frames and div-built screenshots, SLP-21 broadsheet and SLP-22 decorative orbs are judged by the design critics');
  return hits;
}

function parseShadowLayers(value) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  parts.push(cur);
  return parts.map((p) => {
    const colors = extractColors(p);
    const c = colors[0] ? colors[0].color : parseColor('rgb(0,0,0)');
    const rest = colors[0] ? p.replace(colors[0].text, ' ') : p;
    const nums = (rest.match(/-?\d*\.?\d+px/g) || []).map(parseFloat);
    return { color: c, x: nums[0] || 0, y: nums[1] || 0, blur: nums[2] || 0, spread: nums[3] || 0, inset: /inset/.test(rest) };
  });
}

function mostCommon(values) {
  if (!values.length) return null;
  const m = new Map();
  for (const v of values) m.set(v, (m.get(v) || 0) + 1);
  const [value, n] = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
  return { value, share: n / values.length, n };
}

function hoverCandidates() {
  const U = window.__uie;
  const out = [];
  const seen = new Set();
  const sig = (el) => `${el.tagName}|${[...el.classList].sort().join('.')}`;
  for (const el of document.querySelectorAll('a[href],button,[role=button],img,[class*="card" i]')) {
    if (out.length >= 30) break;
    if (!U.isVisible(el)) continue;
    const k = sig(el);
    if (seen.has(k)) continue;
    seen.add(k);
    const img = el.tagName === 'IMG' ? el : null;
    const host = img ? img.closest('a,[class*="card" i],figure') || img.parentElement : el;
    out.push({ id: U.id(el), hostId: U.id(host), img: !!img, tag: el.tagName.toLowerCase(), selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el) });
  }
  return out;
}

function readHoverStyle(id) {
  const el = window.__uie.el(id);
  if (!el) return null;
  const s = getComputedStyle(el);
  return {
    colour: [s.color, s.backgroundColor, s.borderTopColor, s.outlineColor, s.textDecorationColor, s.fill, s.stroke].join('|'),
    transform: s.transform,
    shadow: s.boxShadow,
    opacity: s.opacity,
    filter: s.filter,
    size: [s.fontSize, s.letterSpacing, s.paddingTop, s.paddingLeft].join('|'),
    decoration: s.textDecorationLine,
    background: s.backgroundImage,
  };
}

async function hoverCliches(ctx, pg, p26, hits) {
  const page = pg.page;
  const ps = pg.ps;
  const cands = await page.evaluate(hoverCandidates).catch(() => []);
  if (!cands.length) return;
  const scales = [];
  await page.evaluate(() => {
    const st = document.createElement('style');
    st.id = 'uie-no-transition';
    st.textContent = '*,*::before,*::after{transition:none !important;animation-play-state:paused !important}';
    document.head.appendChild(st);
  }).catch(() => {});
  await withCdp(page, async (cdp) => {
    for (const c of cands) {
      const hostNode = await nodeIdFor(cdp, c.hostId);
      const node = await nodeIdFor(cdp, c.id);
      if (!hostNode || !node) continue;
      const before = await page.evaluate(readHoverStyle, c.id);
      try {
        await forceState(cdp, hostNode, ['hover']);
        if (node !== hostNode) await forceState(cdp, node, ['hover']);
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
        const after = await page.evaluate(readHoverStyle, c.id);
        if (!before || !after) continue;
        const changed = Object.keys(before).filter((k) => before[k] !== after[k]);
        const scaled = before.transform !== after.transform && /matrix\(\s*([\d.]+)/.test(after.transform) && Math.abs(parseFloat(after.transform.match(/matrix\(\s*([\d.]+)/)[1]) - 1) > 0.01;
        if (c.img && scaled) {
          hits.push(ctx.hit({ rule: 'SLP-26', title: 'Image zooms on hover', description: 'Hovering scales the image (hover zoom), motion that explains nothing about the action.', location: ctx.loc(ps, { selector: c.selector, bbox: c.bbox, snippet: c.snippet, source: c.source }), evidence: [{ type: 'measurement', value: after.transform, detail: `transform ${before.transform} → ${after.transform}` }] }));
        } else if (scaled) scales.push({ c, transform: after.transform });
        const groups = changed.filter((k) => k !== 'decoration');
        if (!c.img && groups.length > p26.hover_property_changes_gt) {
          hits.push(ctx.hit({ rule: 'SLP-26', title: `Several properties change on hover: ${c.selector.slice(0, 50)}`, description: `On hover this ${c.tag} changes ${groups.join(', ')} at once; give feedback with one property on the actionable container.`, location: ctx.loc(ps, { selector: c.selector, bbox: c.bbox, snippet: c.snippet, source: c.source }), evidence: [{ type: 'measurement', value: groups, detail: groups.join(', ') }] }));
        }
      } finally {
        await forceState(cdp, hostNode, []).catch(() => {});
        if (node !== hostNode) await forceState(cdp, node, []).catch(() => {});
      }
    }
  }).catch((err) => ctx.error(`${ps.key}: hover probe skipped: ${err.message.split('\n')[0]}`));
  await page.evaluate(() => document.getElementById('uie-no-transition')?.remove()).catch(() => {});
  const byT = new Map();
  for (const s of scales) byT.set(s.transform, [...(byT.get(s.transform) || []), s.c]);
  for (const [t, list] of byT) {
    const kinds = new Set(list.map((x) => x.tag));
    if (list.length >= 3 && kinds.size >= 2) {
      hits.push(ctx.hit({ rule: 'SLP-26', title: `Uniform hover scale on ${list.length} unrelated elements`, description: `${list.length} elements of ${kinds.size} kinds share the hover transform ${t}.`, location: ctx.loc(ps, { selector: list[0].selector, bbox: list[0].bbox, snippet: list[0].snippet }), evidence: [{ type: 'measurement', value: t, detail: list.map((x) => x.selector).slice(0, 4).join(' | ') }] }));
    }
  }
}
