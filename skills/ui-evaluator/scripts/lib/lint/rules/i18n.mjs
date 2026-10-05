// Localisation rules (QUALITY-BAR G3; cjk.md).
// I18N-01 (when a CJK locale ships): content CJK text resolves through declared CJK families; system-ui and
//         ui-sans-serif are not the content face. Static part: every content font stack names a CJK family before
//         any system or generic family (a passing :lang(zh|ja|ko) override covers the base stack).
// I18N-03 (all locales): SF Pro/New York, Segoe UI, PingFang, Microsoft YaHei and GDS Transport are referenced by
//         local name only: no @font-face url(), no bundled font files, no next/font/local or font-CDN loading.
import path from 'node:path';
import { splitTopLevel } from '../css.mjs';
import { cssRules, fontFacesOf, cssImportsOf, copySegments } from '../model.mjs';
import { attrValue } from '../markup.mjs';
import { matchBracket } from '../handlers.mjs';
import { isCjkFamily } from './tokens.mjs';
import { hasCjk } from '../../util/text.mjs';

export const RULES = [
  { id: 'I18N-01', level: 'gate', title: 'Explicit CJK font stack', fix: 'Define the content stack once as a font token: the Latin family, then the platform CJK families for the region, then an open CJK fallback (e.g. Noto Sans SC), then the generic family; override it under :lang().' },
  { id: 'I18N-03', level: 'gate', fast: true, title: 'Restricted fonts not self-hosted', fix: 'Delete the @font-face rule and the font file; keep the family in the stack by local name only, or self-host an openly licensed face.' },
];

const RESTRICTED_FAMILY = /^(?:sf pro(?: (?:display|text|rounded|compact|expanded|condensed|icons))?(?: [\w ]+)?|sf compact(?: [\w ]+)?|-?apple-?system-?font|new york(?: (?:small|medium|large|extra large))?|segoe ui(?: (?:variable|display|text|small|semibold|semilight|light|bold|black|historic))*|pingfang(?: (?:sc|tc|hk))?(?: [\w ]+)?|microsoft yahei(?: ui)?(?: [\w ]+)?|微软雅黑|苹方(?:-简|-繁)?|gds transport(?: [\w ]+)?)$/i;
const RESTRICTED_FILE = /(?:^|[\/_-])(?:sf-?pro|sfpro|sf-?compact|sfcompact|newyork|new-york|segoe-?ui|segoeui|seguisb|seguisym|segoeuib|segoeuil|segoeuisl|seguibl|pingfang|msyh(?:bd|l)?|microsoft-?yahei|gds-?transport)[\w.-]*\.(?:woff2?|ttf|otf|ttc|eot)$/i;
// A URL that loads one of the restricted faces: a font file named for it, a stylesheet in a fonts path named for it,
// or a font CDN stylesheet for it. Page links that merely contain the words (a /new-york office page) do not count.
const RESTRICTED_NAME = String.raw`(?:sf-?pro(?:-?(?:display|text|rounded|compact|icons))?|sfpro\w*|sf-?compact\w*|segoe-?ui\w*|segui\w*|pingfang\w*|microsoft-?yahei\w*|msyh(?:bd|l)?|gds-?transport\w*|new-?york(?:-?(?:small|medium|large|extra-?large))?)`;
const RESTRICTED_URL = new RegExp(String.raw`(?:^|[\/_.-])${RESTRICTED_NAME}[\w.-]*\.(?:woff2?|ttf|otf|ttc|eot)(?:[?#]|$)|\/fonts?\/(?:[\w.-]+\/)*${RESTRICTED_NAME}[\w.-]*\.css(?:[?#]|$)|fonts\.cdnfonts\.com\/css\/(?:sf-pro|segoe-ui|pingfang|microsoft-yahei|gds-transport|new-york)`, 'i');
const FONT_LINK_REL = /\b(?:stylesheet|preload|prefetch)\b/i;

const SYSTEM_DECIDES = /^(?:system-ui|ui-sans-serif|ui-serif|ui-rounded|-apple-system|blinkmacsystemfont|sans-serif|serif|cursive|fantasy)$/i;
const CONTENT_SELECTOR = /^(?::root|html|body|\*|#root|#__next|#app|#__nuxt|@theme|main)$/;
const CONTENT_TOKEN = /^--(?:font-(?:sans|body|base|text|family|default|primary|content|ui)|default-font-family|body-font(?:-family)?|font-family(?:-base|-body|-sans)?)$/;
const LANG_SELECTOR = /:lang\(\s*(?:zh|ja|ko)[^)]*\)|\[lang[|^*]?=["']?(?:zh|ja|ko)/i;
const CJK_LANG = /^(?:zh|ja|ko|yue)(?:[-_]|$)/i;
const LANGUAGE_NAME = /^(?:[A-Za-z][\w ()/-]*[:·|/-]\s*)?(?:简体中文|繁體中文|繁体中文|简体|繁體|中文|汉语|漢語|普通话|粵語|粤语|日本語|한국어|中文\s*[(（](?:简体|繁體|简|繁|中国|台灣|香港)[)）])(?:\s*[(（][^)）]{1,12}[)）])?$/;

/** How CJK text resolves through a stack: { ok, reason }. Latin-only families are skipped over. */
export function cjkResolution(value) {
  const parts = splitTopLevel(value, ',').map((p) => p.replace(/["']/g, '').trim()).filter(Boolean);
  if (!parts.length || parts.every((p) => /^var\(/.test(p))) return { ok: true, reason: 'indirect' };
  if (parts.some((p) => /^(?:monospace|ui-monospace)$/i.test(p))) return { ok: true, reason: 'monospace (code and data are exempt)' };
  for (const p of parts) {
    if (/^var\(/.test(p)) return { ok: true, reason: 'indirect' };
    if (isCjkFamily(p)) return { ok: true, reason: `CJK text resolves through ${p}` };
    if (SYSTEM_DECIDES.test(p)) return { ok: false, reason: `${p} is reached before any CJK family, so the system chooses the CJK face` };
  }
  return { ok: false, reason: 'no CJK family in the stack' };
}

function stackOf(d) {
  if (d.prop === 'font') {
    const m = d.value.match(/(?:^|\s)(?:[\d.]+(?:px|rem|em|%|pt|vw|vh)|small|medium|large|x-large|xx-large)(?:\s*\/\s*[\w.%-]+)?\s+(.+)$/i);
    return m ? m[1] : null;
  }
  return d.value;
}

/** Pre-pass signals: CJK text, lang attributes, content stacks, Tailwind default stack. */
export function collectI18n(doc, state) {
  state.i18n = state.i18n || { cjkText: false, cjkLang: false, stacks: [], tailwind: null, tailwindSans: false };
  const st = state.i18n;
  // CJK copy puts I18N-01 in scope; a language picker that only names a language (中文, 日本語) does not.
  if (!st.cjkText && copySegments(doc).some((s) => !s.code && hasCjk(s.text) && !LANGUAGE_NAME.test(s.text.trim()))) st.cjkText = true;
  // The page language (<html lang>) puts CJK in scope; a lang attribute on a short run, such as the link to the
  // Chinese edition in a language picker, tags that run (A11Y-16) and says nothing about the content.
  for (const el of doc.elements) {
    if (el.lower !== 'html') continue;
    const lang = attrValue(el, 'lang');
    if (typeof lang === 'string' && CJK_LANG.test(lang)) st.cjkLang = true;
  }
  for (const r of cssRules(doc)) {
    const sel = r.selector.trim();
    const langSel = LANG_SELECTOR.test(sel);
    for (const d of r.decls) {
      if (d.prop === 'font-family' || d.prop === 'font') {
        if (!(CONTENT_SELECTOR.test(sel) || langSel)) continue;
        const v = stackOf(d);
        if (v) st.stacks.push({ doc, offset: d.offset, value: v, lang: langSel, where: sel });
      } else if (CONTENT_TOKEN.test(d.prop)) {
        st.stacks.push({ doc, offset: d.offset, value: d.value, lang: langSel, where: d.prop });
        if (d.prop === '--font-sans' && sel === '@theme') st.tailwindSans = true;
      }
    }
  }
  for (const s of doc.sheets) {
    const imp = s.sheet.imports.find((i) => /^tailwindcss(?:$|\/)/.test(i.url));
    const dir = s.sheet.atRules.find((a) => a.name === 'tailwind' && /base|preflight/.test(a.params));
    if ((imp || dir) && !st.tailwind) st.tailwind = { doc, offset: (imp || dir).offset, how: imp ? '@import "tailwindcss"' : '@tailwind base' };
  }
  if (/tailwind\.config/.test(doc.rel)) {
    const code = doc.code;
    const m = /fontFamily\s*:\s*\{/.exec(code);
    let sans = null;
    if (m) {
      const open = m.index + m[0].length - 1;
      const close = matchBracket(code, open);
      const body = code.slice(open, close > 0 ? close : code.length);
      const sm = body.match(/(['"]?)sans\1\s*:\s*(\[[^\]]*\]|(['"`])[^'"`]*\3)/);
      if (sm) sans = { text: sm[2], offset: open + sm.index };
    }
    if (sans) {
      st.tailwindSans = true;
      const fams = [...sans.text.matchAll(/(['"`])([^'"`]+)\1/g)].map((x) => x[2]).join(', ');
      const spreadsDefault = /defaultTheme\.fontFamily\.sans|fontFamily\.sans/.test(sans.text);
      st.stacks.push({ doc, offset: sans.offset, value: spreadsDefault ? `${fams}, ui-sans-serif, system-ui, sans-serif` : fams, lang: false, where: 'tailwind.config fontFamily.sans' });
    } else if (!st.tailwind) st.tailwind = { doc, offset: 0, how: 'tailwind.config' };
  }
}

export function cjkInScope(ctx) {
  const st = ctx.state.i18n || {};
  return !!(ctx.project.cjkLocale || ctx.project.cjkLocaleFiles || st.cjkLang || st.cjkText);
}

function i18n01(ctx, report) {
  const st = ctx.state.i18n;
  if (!st || !cjkInScope(ctx)) return;
  const langOk = st.stacks.some((s) => s.lang && cjkResolution(s.value).ok);
  let reported = 0;
  for (const s of st.stacks) {
    if (!s.lang && langOk) continue;
    const r = cjkResolution(s.value);
    if (r.ok) continue;
    reported += 1;
    report('I18N-01', s.doc, s.offset, { message: `content font stack (${s.where}): ${r.reason}`, value: s.value.slice(0, 120) });
  }
  if (!st.stacks.length && st.tailwind && !st.tailwindSans) {
    report('I18N-01', st.tailwind.doc, st.tailwind.offset, { message: `Tailwind's default font-sans stack (${st.tailwind.how}) has no CJK family, so the system chooses the CJK face`, value: st.tailwind.how });
  }
  return reported;
}

function i18n03File(doc, ctx, report) {
  for (const ff of fontFacesOf(doc)) {
    const fam = ff.decls.find((d) => d.prop === 'font-family');
    const src = ff.decls.find((d) => d.prop === 'src');
    if (!fam || !src) continue;
    const name = fam.value.replace(/["']/g, '').trim();
    const urls = [...src.value.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)].map((m) => m[2]);
    if (!urls.length) continue; // local() only is allowed
    const file = urls.find((u) => RESTRICTED_FILE.test(`/${u.split(/[?#]/)[0].split('/').pop()}`));
    if (!RESTRICTED_FAMILY.test(name) && !file) continue;
    report('I18N-03', doc, ff.offset, { message: `@font-face self-hosts ${RESTRICTED_FAMILY.test(name) ? name : `${name} from ${file.split('/').pop()}`}; its licence allows the local name only`, value: `${name}: ${src.value.slice(0, 80)}` });
  }
  for (const imp of cssImportsOf(doc)) {
    if (RESTRICTED_URL.test(imp.url)) report('I18N-03', doc, imp.offset, { message: `@import loads a restricted font (${imp.url})`, value: imp.url });
  }
  for (const el of doc.elements) {
    if (el.lower !== 'link') continue;
    const href = String(attrValue(el, 'href') || '');
    const rel = String(attrValue(el, 'rel') || '');
    if (href && FONT_LINK_REL.test(rel) && RESTRICTED_URL.test(href)) report('I18N-03', doc, el.offset, { message: `<link> loads a restricted font (${href})`, value: href });
  }
  const re = /\blocalFont\s*\(/g;
  let m;
  while ((m = re.exec(doc.code))) {
    const open = m.index + m[0].length - 1;
    const close = matchBracket(doc.code, open);
    const args = doc.code.slice(open, close > 0 ? close : open + 600);
    const file = (args.match(/(['"`])([^'"`]*\.(?:woff2?|ttf|otf|ttc|eot))\1/i) || [])[2];
    if (file && RESTRICTED_FILE.test(path.basename(file).replace(/^/, '/'))) report('I18N-03', doc, m.index, { message: `next/font/local bundles ${path.basename(file)}, a restricted font`, value: file });
  }
}

export function checkFile(doc, ctx, report) {
  if (ctx.enabled('I18N-03')) i18n03File(doc, ctx, report);
}

export function checkProject(docs, ctx, report) {
  if (ctx.enabled('I18N-01')) i18n01(ctx, report);
  if (ctx.enabled('I18N-03')) {
    for (const f of ctx.fonts || []) {
      if (RESTRICTED_FILE.test(`/${path.basename(f.rel)}`)) report('I18N-03', { rel: f.rel, pos: () => ({ line: null, col: null }) }, null, { message: `font file ${path.basename(f.rel)} bundles a restricted font in the repository`, value: f.rel, line: null, col: null });
    }
  }
}
