// i18n — I18N-01 (content CJK text resolves through declared CJK families; system-ui and ui-sans-serif are not the
// content face) and I18N-02 (Traditional Chinese pages use TC/HK families, never SC). The declared stack decides;
// the font Chromium actually rendered (CDP platform fonts) is recorded as evidence.
import { withCdp, nodeIdFor, platformFonts } from '../cdp.mjs';

export const mode = 'shared';
export const criteria = ['I18N-01', 'I18N-02'];
export const summary = 'CJK font resolution and regional families';

export const CJK_FAMILY = /pingfang|hiragino|yahei|jhenghei|simsun|simhei|songti|heiti|kaiti|fangsong|noto (sans|serif)( cjk)? (sc|tc|hk|jp|kr|cjk)|noto (sans|serif) cjk|source han|思源|苹方|微软雅黑|微軟正黑|mingliu|pmingliu|biaukai|lihei|ligothic|yu gothic|yu mincho|meiryo|ms gothic|ms mincho|apple sd gothic|malgun|nanum|gulim|dotum|batang|stheiti|stsong|stkaiti|stfangsong|lantinghei|wenquanyi|wqy|droid sans fallback|osaka|hiragino mincho|notosanscjk|notoserifcjk|sarasa|lxgw/i;
export const SYSTEM_GENERIC = /^(system-ui|ui-sans-serif|ui-serif|ui-rounded|ui-monospace|-apple-system|blinkmacsystemfont|sans-serif|serif|cursive|fantasy|math|emoji)$/i;
export const TC_FAMILY = /\b(tc|hk|tw)\b|traditional|jhenghei|微軟正黑|mingliu|pmingliu|biaukai|lihei|ligothic|hant/i;
export const SC_FAMILY = /\b(sc|cn|gb)\b|yahei|微软雅黑|simsun|simhei|stheiti|stsong|stkaiti|lantinghei|wenquanyi|wqy|hans/i;

/** Parse a font-family stack into names without quotes. */
export function parseStack(stack) {
  return String(stack || '').split(',').map((f) => f.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
}

/** I18N-01 verdict for one stack: the first family able to render CJK must be a declared CJK family. */
export function cjkStackProblem(stack) {
  const fams = parseStack(stack);
  const firstCjk = fams.findIndex((f) => CJK_FAMILY.test(f));
  const firstSystem = fams.findIndex((f) => SYSTEM_GENERIC.test(f));
  if (firstCjk < 0) return `no CJK family in the stack (${fams.join(', ') || 'empty'}); CJK glyphs fall back to whatever the OS picks`;
  if (firstSystem >= 0 && firstSystem < firstCjk) return `${fams[firstSystem]} comes before the first CJK family (${fams[firstCjk]}), so it becomes the CJK content face`;
  return null;
}

/** I18N-02 verdict: on Traditional Chinese text, the first CJK family must be TC/HK, never SC. */
export function regionalProblem(stack) {
  const fams = parseStack(stack);
  const first = fams.find((f) => CJK_FAMILY.test(f));
  if (!first) return null;
  if (SC_FAMILY.test(first) && !TC_FAMILY.test(first)) return `the first CJK family is ${first} (Simplified Chinese glyph forms)`;
  return null;
}

function collect() {
  const U = window.__uie;
  U.reset();
  const out = [];
  for (const el of U.textElements(document.body, { limit: 3000 })) {
    const t = U.ownText(el);
    if (!t || !/[぀-ヿ㐀-䶿一-鿿가-힯]/.test(t)) continue;
    const s = U.cs(el);
    const mono = /monospace/.test(s.fontFamily) && !!el.closest('code,pre,kbd,samp,td');
    if (mono) continue;
    const langEl = el.closest('[lang]');
    out.push({ id: U.id(el), stack: s.fontFamily, lang: langEl ? langEl.getAttribute('lang') : '', text: t.slice(0, 40), selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el) });
  }
  return out;
}

export async function run(ctx) {
  const hits = [];
  let cjk = false;
  const rendered = {};
  for await (const pg of ctx.pages(ctx.states({ widths: 'first', themes: 'first' }))) {
    const ps = pg.ps;
    const items = await pg.page.evaluate(collect);
    if (!items.length) continue;
    cjk = true;
    const byStack = new Map();
    for (const it of items) {
      const k = `${it.stack}|${/^zh-(hant|tw|hk|mo)/i.test(it.lang) ? 'tc' : 'other'}`;
      if (!byStack.has(k)) byStack.set(k, { ...it, count: 0 });
      byStack.get(k).count += 1;
    }
    await withCdp(pg.page, async (cdp) => {
      for (const it of byStack.values()) {
        const nodeId = await nodeIdFor(cdp, it.id);
        const fonts = nodeId ? await platformFonts(cdp, nodeId) : [];
        it.rendered = fonts.map((f) => f.familyName);
        rendered[it.stack.slice(0, 120)] = it.rendered;
      }
    }).catch(() => {});
    for (const it of byStack.values()) {
      const where = ctx.loc(ps, { selector: it.selector, bbox: it.bbox, snippet: it.snippet, source: it.source });
      const p1 = cjkStackProblem(it.stack);
      if (p1) {
        hits.push(ctx.hit({ rule: 'I18N-01', title: `CJK text without an explicit CJK font stack: "${it.text.slice(0, 20)}"`, description: `${it.count} CJK text element(s) use font-family "${it.stack.slice(0, 120)}": ${p1}. Rendered with ${it.rendered?.join(', ') || 'unknown'} on this machine.`, location: where, evidence: [{ type: 'measurement', value: it.stack.slice(0, 200), detail: `${p1}; rendered ${it.rendered?.join(', ') || 'n/a'}` }] }));
      }
      if (/^zh-(hant|tw|hk|mo)/i.test(it.lang)) {
        const p2 = regionalProblem(it.stack);
        if (p2) hits.push(ctx.hit({ rule: 'I18N-02', title: `Traditional Chinese text set in a Simplified Chinese family: "${it.text.slice(0, 20)}"`, description: `Text tagged ${it.lang} uses "${it.stack.slice(0, 120)}": ${p2}. Traditional pages need TC or HK families.`, location: where, evidence: [{ type: 'measurement', value: it.stack.slice(0, 200), detail: p2 }] }));
      }
    }
  }
  ctx.record({ cjk_detected: cjk, rendered_fonts: rendered });
  return hits;
}
