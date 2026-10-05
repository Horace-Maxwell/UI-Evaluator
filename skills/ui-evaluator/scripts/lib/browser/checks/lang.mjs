// lang — A11Y-16: `lang` present and matching the dominant script; mixed-language runs tagged; Chinese tagged with a
// region or script subtag (never bare `zh` when both scripts ship); Simplified/Traditional text matches its tag.
import { dominantScript, langFitsScript, isValidLangTag, hanVariantCounts, tagVariant } from '../thresholds.mjs';

export const mode = 'shared';
export const criteria = ['A11Y-16'];
export const summary = '`lang` vs dominant script; regional Chinese tags; untagged runs in another script';

function collect() {
  const U = window.__uie;
  U.reset();
  const html = document.documentElement;
  const total = { han: 0, kana: 0, hangul: 0, latin: 0 };
  let sample = '';
  const runs = [];
  for (const el of U.textElements(document.body, { limit: 3000 })) {
    const t = U.ownText(el);
    if (!t || el.closest('code,pre,kbd,samp,script,style')) continue;
    const s = U.scripts(t);
    total.han += s.han;
    total.kana += s.kana;
    total.hangul += s.hangul;
    total.latin += s.latin;
    if (sample.length < 4000) sample += `${t} `;
    const langEl = el.closest('[lang]');
    runs.push({ text: t.slice(0, 160), counts: { han: s.han, kana: s.kana, hangul: s.hangul, latin: s.latin }, words: t.split(/\s+/).filter(Boolean).length, lang: langEl ? langEl.getAttribute('lang') : '', own: el.hasAttribute('lang'), selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el) });
  }
  return { lang: html.getAttribute('lang'), xmlLang: html.getAttribute('xml:lang'), total, sample: sample.slice(0, 4000), runs: runs.slice(0, 2000) };
}

export async function run(ctx) {
  const hits = [];
  let cjk = false;
  const locales = (ctx.scope.locales?.list || []).map((l) => String(l).toLowerCase());
  const bothScripts = locales.some((l) => /^zh-(hans|cn|sg)/.test(l)) && locales.some((l) => /^zh-(hant|tw|hk|mo)/.test(l));
  for await (const pg of ctx.pages(ctx.states({ widths: 'first', themes: 'first' }))) {
    const ps = pg.ps;
    const d = await pg.page.evaluate(collect);
    const where = (o) => ctx.loc(ps, { selector: o.selector, bbox: o.bbox, snippet: o.snippet, source: o.source });
    const page = ctx.loc(ps, { selector: 'html' });
    if (d.total.han + d.total.kana + d.total.hangul > 0) cjk = true;
    const script = dominantScript(d.total);
    const lang = (d.lang || '').trim();
    let pageMismatch = null;
    if (!lang) {
      hits.push(ctx.hit({ rule: 'A11Y-16', wcag: ['3.1.1'], title: `Page has no lang attribute: ${ps.route}`, description: `<html> declares no lang; the page's dominant script is ${script || 'unknown'}. Screen readers pick the voice, and browsers the glyph forms, from it.`, location: page, evidence: [{ type: 'measurement', value: d.total, detail: 'missing lang' }], problem_type: 'missing_element' }));
    } else if (!isValidLangTag(lang)) {
      hits.push(ctx.hit({ rule: 'A11Y-16', wcag: ['3.1.1'], title: `Invalid lang tag "${lang}"`, description: `"${lang}" is not a valid BCP 47 language tag.`, location: page, evidence: [{ type: 'measurement', value: lang, detail: 'invalid tag' }] }));
    } else if (script && script !== 'mixed' && !langFitsScript(lang, script)) {
      pageMismatch = script;
      hits.push(ctx.hit({ rule: 'A11Y-16', wcag: ['3.1.1'], title: `lang="${lang}" does not match the ${script} content`, description: `The page is tagged "${lang}" but its text is predominantly ${script} (Han ${d.total.han}, Kana ${d.total.kana}, Hangul ${d.total.hangul}, Latin ${d.total.latin} characters). axe accepts any valid tag, so this is checked by script ratio.`, location: page, evidence: [{ type: 'measurement', value: d.total, detail: `dominant ${script}` }] }));
    }
    if (lang && script === 'chinese') {
      if (/^zh$/i.test(lang) && bothScripts) {
        hits.push(ctx.hit({ rule: 'A11Y-16', wcag: ['3.1.1'], title: 'Bare lang="zh" while both Chinese scripts ship', description: 'Both Simplified and Traditional Chinese are in scope, so pages need a region or script subtag (zh-CN, zh-TW, zh-HK, zh-Hans, zh-Hant), never bare zh.', location: page, evidence: [{ type: 'measurement', value: lang, detail: `locales ${locales.join(', ')}` }] }));
      } else if (/^zh$/i.test(lang)) ctx.note('bare lang="zh" seen on a single-script product (allowed by W3C advice; consider a subtag)');
      const v = hanVariantCounts(d.sample);
      const tagged = tagVariant(lang);
      const seen = v.traditional > v.simplified * 2 && v.traditional >= 3 ? 'traditional' : v.simplified > v.traditional * 2 && v.simplified >= 3 ? 'simplified' : null;
      if (tagged && seen && tagged !== seen) {
        hits.push(ctx.hit({ rule: 'A11Y-16', wcag: ['3.1.1'], title: `lang="${lang}" tags ${seen} Chinese text`, description: `The tag says ${tagged} Chinese, but the text uses ${seen}-only characters (${v.simplified} simplified, ${v.traditional} traditional in the sample).`, location: page, evidence: [{ type: 'measurement', value: v, detail: `${seen} characters under ${lang}` }] }));
      }
    }
    // Untagged runs in another script (3.1.2).
    let reported = 0;
    for (const r of d.runs) {
      if (reported >= 10) break;
      const rs = dominantScript(r.counts);
      const effective = r.lang || lang;
      if (!rs || rs === 'mixed' || !effective) continue;
      if (pageMismatch && rs === pageMismatch && (r.lang || '') === lang) continue;
      const cjkRun = rs === 'chinese' || rs === 'japanese' || rs === 'korean';
      const long = cjkRun ? r.counts.han + r.counts.kana + r.counts.hangul >= 6 : r.words >= 5 && r.counts.latin >= 25;
      if (!long || langFitsScript(effective, rs)) continue;
      reported += 1;
      hits.push(ctx.hit({ rule: 'A11Y-16', wcag: ['3.1.2'], title: `Untagged ${rs} text in a "${effective}" context`, description: `"${r.text.slice(0, 80)}" is ${rs} text inside content tagged "${effective}" without its own lang attribute.`, location: where(r), evidence: [{ type: 'quote', value: r.text.slice(0, 120), detail: `${rs} run under ${effective}` }] }));
    }
  }
  ctx.record({ cjk_detected: cjk, both_chinese_scripts: bothScripts });
  return hits;
}
