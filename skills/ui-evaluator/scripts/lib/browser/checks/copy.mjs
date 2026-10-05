// copy — rendered text: CPY-01 (placeholder text, unrendered interpolation, leaked values), CPY-02 (bare link names
// without programmatic context), CPY-03 (one case convention per element type across the run), and the copy tells
// SLP-12 (fabricated-proof candidates vs PRODUCT.md facts), SLP-13 (placeholder identities), SLP-14 (buzzwords,
// theatre and generic hero phrases, aphorisms, em-dash density) and SLP-15 (generic CTA set). Word lists come from
// assets/data/words-*.json (gate entries only; heuristic entries are recorded for review, never as hits).
import { wordList, matchList, matchEntries } from '../data.mjs';
import { classifyCase, round } from '../thresholds.mjs';
import { loadData } from '../../gates/rules.mjs';

export const mode = 'shared';
export const criteria = ['CPY-01', 'CPY-02', 'CPY-03', 'SLP-12', 'SLP-13', 'SLP-14', 'SLP-15'];
export const summary = 'rendered text: placeholder text, link text, case consistency, copy tells, generic CTA sets, fabricated-proof candidates';

const LEAK = [
  { re: /\{\{[^{}]{0,60}\}\}/, what: 'unrendered template braces' },
  { re: /\$\{[^{}]{0,60}\}/, what: 'unrendered ${…} interpolation' },
  { re: /(^|[^\w%])%[sd](?![\w%])/, what: 'printf placeholder' },
  { re: /\[object Object\]/, what: '[object Object]' },
  { re: /\bundefined\b/, what: 'leaked undefined' },
  { re: /\bNaN\b/, what: 'leaked NaN' },
];
const CLAIM_WORDS = /\b(users?|customers?|teams?|companies|businesses|developers|downloads?|installs?|reviews?|ratings?|uptime|faster|satisfaction|countries|members|clients|brands|organi[sz]ations|people|creators|startups|enterprises|stars?)\b|用户|客户|企业|团队|好评|满意/i;

const FINITE = /\b(?:is|are|was|were|be|been|being|am|has|have|had|do|does|did|can|could|will|would|should|shall|may|might|must|needs?|needed|takes?|gets?|goes|comes?|works?)\b/i;

/** A literal, domain or technical use of a buzzword, which the copy-tell rule exempts (shared data with uie lint). */
function literalUse(h, t, productText) {
  const after = t.text.slice(h.index + h.match.length, h.index + h.match.length + 60);
  if (h.entry.literal_after) {
    try {
      if (new RegExp(h.entry.literal_after, 'iu').test(after)) return true;
    } catch {
      /* bad patterns are caught by the data tests */
    }
  }
  const next = (after.match(/^\s+([\p{L}-]+)/u) || [])[1];
  if (productText && next && productText.toLowerCase().replace(/\s+/g, ' ').includes(`${h.match} ${next}`.toLowerCase())) return true;
  if (t.article && h.entry.technical) return true;
  if (t.article && /^\p{Lu}/u.test(h.match)) {
    // Inside a Title Case run of three or more capitalised words, the word is part of a cited title or a name.
    const words = t.text.split(/\s+/);
    const at = t.text.slice(0, h.index).split(/\s+/).length - 1;
    const run = words.slice(Math.max(0, at - 2), at + 3).filter((w) => /^\p{Lu}/u.test(w)).length;
    if (run >= 3) return true;
  }
  return false;
}

function collect() {
  const U = window.__uie;
  U.reset();
  const demo = (el) => !!el.closest('[data-demo],[data-sample],[aria-label*="sample" i],[aria-label*="demo" i],[class*="demo-data" i],[class*="sample-data" i],[class*="placeholder" i]');
  const texts = [];
  for (const el of U.textElements(document.body, { limit: 3000 })) {
    const t = U.ownText(el);
    if (!t) continue;
    texts.push({
      id: U.id(el),
      text: t.slice(0, 600),
      tag: el.tagName.toLowerCase(),
      code: !!el.closest('code,pre,kbd,samp,textarea'),
      quote: !!el.closest('blockquote,q,cite,[class*="testimonial" i],[class*="quote" i]'),
      heading: /^H[1-6]$/.test(el.tagName),
      article: !!el.closest('article,[role=article]'),
      body: !!el.closest('p,li,dd,blockquote,figcaption') && !el.closest('nav,header,footer,button,a'),
      demo: demo(el),
      table: !!el.closest('table,form,[role=grid]'),
      px: parseFloat(U.cs(el).fontSize),
      selector: U.selector(el),
      bbox: U.docRect(el),
      snippet: U.snippet(el),
      source: U.sourceOf(el),
    });
  }
  const links = [];
  for (const a of document.querySelectorAll('a[href],[role=link]')) {
    if (!U.isVisible(a)) continue;
    const name = U.accName(a);
    const block = a.closest('p,li,td,th,dd,dt,figcaption,blockquote');
    let context = '';
    if (block) context = U.collapse(block.innerText || '').replace(U.collapse(a.innerText || ''), '').trim();
    const described = (a.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)).filter(Boolean).map((n) => U.collapse(n.textContent)).join(' ');
    links.push({ name, context, described, selector: U.selector(a), bbox: U.docRect(a), snippet: U.snippet(a), source: U.sourceOf(a), nav: !!a.closest('nav,[role=navigation]') });
  }
  const buttonLike = (el) => {
    if (el.matches('button,[role=button],input[type=submit],input[type=button]')) return true;
    if (!el.matches('a[href]')) return false;
    const s = U.cs(el);
    const bg = s.backgroundColor;
    const filled = bg && !/rgba\([^)]*,\s*0\)$|transparent/.test(bg);
    const bordered = parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none';
    return /block|flex|grid/.test(s.display) && (filled || bordered) && parseFloat(s.paddingLeft) >= 6;
  };
  const controls = [];
  for (const el of document.querySelectorAll('button,[role=button],input[type=submit],input[type=button],a[href],h1,h2,h3,h4,h5,h6')) {
    if (!U.isVisible(el)) continue;
    let type = null;
    if (/^H[1-6]$/.test(el.tagName)) type = 'headings';
    else if (el.closest('nav,[role=navigation]') && el.matches('a[href],[role=link]')) type = 'navigation';
    else if (buttonLike(el)) type = 'buttons';
    if (!type) continue;
    const text = el.tagName === 'INPUT' ? el.value : U.collapse(el.innerText || '');
    if (!text) continue;
    controls.push({ type, text: text.slice(0, 80), cta: type === 'buttons' && !el.closest('nav,form [role=group],dialog,[role=dialog],[role=menu],[role=toolbar]'), selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el) });
  }
  // Proof candidates: logo sets after "trusted by"-style lines, testimonials, rating stars, stat banners.
  const proof = [];
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,span,div,li')) {
    if (proof.length >= 40) break;
    const t = U.ownText(el);
    if (!t || !U.isVisible(el)) continue;
    if (/\b(trusted by|used by|loved by|customers include|as seen (in|on)|backed by|powering)\b|受到.*信赖|值得信赖/i.test(t)) {
      const scope = el.parentElement || el;
      const logos = [...scope.querySelectorAll('img,svg')].filter((i) => U.isVisible(i)).length;
      proof.push({ kind: 'logo set', text: t.slice(0, 80), logos, selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el), demo: demo(el) });
    }
    if (/★{3,}|☆|\b\d(\.\d)?\s*\/\s*5\b|\b\d(\.\d)? out of 5\b/.test(t)) proof.push({ kind: 'rating', text: t.slice(0, 80), selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el), demo: demo(el) });
  }
  for (const q of document.querySelectorAll('blockquote,[class*="testimonial" i]')) {
    if (!U.isVisible(q) || proof.length >= 60) continue;
    const cite = q.querySelector('cite,figcaption,footer,[class*="author" i],[class*="name" i]') || (q.parentElement && q.parentElement.querySelector('figcaption,cite'));
    proof.push({ kind: 'testimonial', text: U.collapse(q.innerText).slice(0, 100), who: cite ? U.collapse(cite.innerText).slice(0, 60) : '', selector: U.selector(q), bbox: U.docRect(q), snippet: U.snippet(q), source: U.sourceOf(q), demo: demo(q) });
  }
  const placeholders = [...document.querySelectorAll('input[placeholder],textarea[placeholder]')].map((i) => i.placeholder);
  return { texts, links, controls, proof, placeholders, lang: document.documentElement.lang || '' };
}

function modesFor(id) {
  const t = loadData('tells', { tells: {} }).tells || {};
  return t[id]?.modes || null;
}

const norm = (s) => String(s || '').toLowerCase().replace(/[.!?。！？…:：]+$/u, '').replace(/\s+/g, ' ').trim();
const numToken = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();

export async function run(ctx) {
  const hits = [];
  const review = [];
  const caseSeen = { buttons: new Map(), headings: new Map(), navigation: new Map() };
  const lists = {
    placeholder: [...wordList('en', 'placeholder_text'), ...wordList('zh', 'placeholder_text')],
    vague: [...wordList('en', 'link_text_vague'), ...wordList('zh', 'link_text_vague')],
    identities: [...wordList('en', 'placeholder_identities'), ...wordList('zh', 'placeholder_identities')],
    buzz: wordList('en', 'ai_buzzwords'),
    theatre: wordList('en', 'theatre_phrases'),
    hero: wordList('en', 'generic_hero_phrases'),
    aphorism: wordList('en', 'aphorism_patterns'),
    generic: wordList('en', 'generic_ctas'),
    heuristicPlaceholder: wordList('en', 'placeholder_text', { all: true }).filter((e) => e.heuristic),
  };
  const facts = numToken(ctx.design.factsText);
  for await (const pg of ctx.pages(ctx.states({ widths: 'first', themes: 'first' }))) {
    const ps = pg.ps;
    const allowed = (id) => {
      const m = modesFor(id);
      return !m || m.includes(ps.mode);
    };
    const data = await pg.page.evaluate(collect);
    const where = (o) => ctx.loc(ps, { selector: o.selector, bbox: o.bbox, snippet: o.snippet, source: o.source });
    // CPY-01 placeholder text and leaked values.
    for (const t of data.texts) {
      if (t.code || t.demo || /^\[[^\]]+\]$/.test(t.text)) continue;
      const found = matchList(lists.placeholder, t.text);
      const leak = LEAK.filter((l) => l.re.test(t.text)).map((l) => l.what);
      if (/^(null|undefined|NaN)$/.test(t.text)) leak.push(`leaked ${t.text}`);
      const what = [...found, ...leak];
      if (what.length) hits.push(ctx.hit({ rule: 'CPY-01', title: `Placeholder or leaked text: "${t.text.slice(0, 40)}"`, description: `Rendered text contains ${what.join(', ')}. Replace it with real content or a visibly labelled placeholder.`, location: where(t), evidence: [{ type: 'quote', value: t.text.slice(0, 200), detail: what.join(', ') }] }));
      for (const h of matchList(lists.heuristicPlaceholder, t.text)) review.push({ rule: 'CPY-01', route: ps.route, text: t.text.slice(0, 80), match: h });
    }
    // CPY-02 descriptive link text.
    for (const l of data.links) {
      const n = norm(l.name);
      if (!n) continue;
      const bare = matchList(lists.vague, n).length > 0;
      if (!bare) continue;
      const hasContext = l.described || (l.context && l.context.split(/\s+/).length >= 3) || (/[㐀-鿿]/.test(l.context) && l.context.length >= 6);
      if (hasContext) continue;
      hits.push(ctx.hit({ rule: 'CPY-02', title: `Link text "${l.name}" has no context`, description: `The link's accessible name is only "${l.name}" and no programmatically determined context (sentence, paragraph, list item, table cell or aria-describedby) says where it leads (WCAG 2.4.4).`, location: where(l), evidence: [{ type: 'quote', value: l.name, detail: 'bare link name without context' }] }));
    }
    // CPY-03 conventions (aggregated across the run).
    const lexicon = new Set();
    for (const t of data.texts) if (t.body) for (const w of t.text.match(/\p{L}+/gu) || []) if (w === w.toLowerCase()) lexicon.add(w);
    const enough = data.texts.filter((t) => t.body).reduce((a, t) => a + t.text.split(/\s+/).length, 0) >= 150;
    for (const c of data.controls) {
      const words = c.text.match(/\p{L}[\p{L}'’-]*/gu) || [];
      const ignore = enough ? words.slice(1).filter((w) => /^\p{Lu}/u.test(w) && !lexicon.has(w.toLowerCase()) && w !== w.toUpperCase()) : [];
      const conv = classifyCase(c.text, { ignore });
      if (!conv) continue;
      const m = caseSeen[c.type];
      if (!m.has(conv)) m.set(conv, { ...c, ps });
    }
    if (allowed('SLP-13')) {
      for (const t of data.texts) {
        if (t.demo || t.code) continue;
        const found = matchList(lists.identities, t.text);
        if (found.length) hits.push(ctx.hit({ rule: 'SLP-13', title: `Placeholder identity: ${found[0]}`, description: `"${t.text.slice(0, 120)}" contains a stock placeholder identity (${found.join(', ')}) outside labelled demo data.`, location: where(t), evidence: [{ type: 'quote', value: t.text.slice(0, 200), detail: found.join(', ') }] }));
      }
    }
    if (allowed('SLP-12')) {
      for (const t of data.texts) {
        if (t.demo || t.code || t.table) continue;
        const suffixed = t.text.match(/(\d[\d,.]*\s?(?:%|×|x\b|\+|k\b|K\b|M\b|B\b|万|亿)|\d(?:\.\d)?\s?\/\s?5\b)/);
        const counted = t.text.match(/(\d{1,3}(?:,\d{3})+|\d{4,})(?=\s+(?:[\p{L}-]+\s+){0,2}(?:users?|customers?|teams?|companies|businesses|developers|downloads?|installs?|reviews?|members|clients|people|creators|startups|enterprises|countries)\b)/iu);
        const m = suffixed || counted;
        if (!m) continue;
        const claimy = !!counted || CLAIM_WORDS.test(t.text) || /%|×/.test(m[1]) || t.px >= 22;
        if (!claimy) continue;
        const tok = numToken(m[1]).replace(/[^\d.%x×+kmb万亿/]/g, '');
        if (facts && tok && facts.includes(tok.replace(/\+$/, ''))) continue;
        hits.push(ctx.hit({ rule: 'SLP-12', title: `Unsourced claim: "${t.text.slice(0, 40)}"`, description: `The figure "${m[1].trim()}" in "${t.text.slice(0, 120)}" is not in the facts section of PRODUCT.md${ctx.design.hasProduct ? '' : ' (PRODUCT.md is missing)'} and is not labelled as a placeholder.`, location: where(t), evidence: [{ type: 'quote', value: t.text.slice(0, 200), detail: `figure ${m[1].trim()} absent from facts` }] }));
      }
      for (const p of data.proof) {
        if (p.demo) continue;
        if (p.kind === 'logo set' && p.logos < 3) continue;
        const key = numToken(p.who || p.text).slice(0, 24);
        if (facts && key && facts.includes(key)) continue;
        hits.push(ctx.hit({ rule: 'SLP-12', title: `Unsourced ${p.kind}: "${(p.who || p.text).slice(0, 40)}"`, description: `A ${p.kind}${p.who ? ` attributed to "${p.who}"` : ''} appears without a matching entry in the facts section of PRODUCT.md${ctx.design.hasProduct ? '' : ' (PRODUCT.md is missing)'}.`, location: where(p), evidence: [{ type: 'quote', value: p.text.slice(0, 200), detail: p.kind }] }));
      }
    }
    if (allowed('SLP-14')) {
      const prose = data.texts.filter((t) => !t.code && !t.quote && !t.demo);
      const buzz = [];
      for (const t of prose) {
        // Same exemptions as the lint rule: literal or domain uses ("seamless gutters"), technical vocabulary and
        // Title Case work names inside articles are not copy tells.
        for (const h of matchEntries(lists.buzz, t.text)) if (!literalUse(h, t, ctx.design.productText)) buzz.push({ t, b: h.entry.text || h.match });
        for (const b of matchList(lists.theatre, t.text)) buzz.push({ t, b });
        if (t.heading || t.px >= 24) for (const b of matchList(lists.hero, t.text)) buzz.push({ t, b });
      }
      if (buzz.length) {
        const first = buzz[0].t;
        hits.push(ctx.hit({ rule: 'SLP-14', title: `Copy tells: ${[...new Set(buzz.map((x) => x.b))].slice(0, 4).join(', ')}`, description: `${buzz.length} buzzword, theatre or generic-hero phrase hit(s): ${buzz.slice(0, 6).map((x) => `"${x.b}" in "${x.t.text.slice(0, 50)}"`).join('; ')}.`, location: where(first), evidence: [{ type: 'quote', value: [...new Set(buzz.map((x) => x.b))].join(', '), detail: `${buzz.length} hit(s)` }] }));
      }
      const all = prose.map((t) => t.text).join('\n');
      let aph = 0;
      for (const h of matchEntries(lists.aphorism, all)) {
        // Two-part shapes ("X. No Y.") count only as verbless fragments, as in the lint rule.
        if (h.entry.fragment && FINITE.test(h.match.replace(/^[\s\S]*?\.\s+(?:No|Just)\s/, ''))) continue;
        aph += 1;
      }
      if (aph >= 3) hits.push(ctx.hit({ rule: 'SLP-14', title: `${aph} aphoristic constructions`, description: `The page uses ${aph} constructions such as "Not a X. A Y." or "X. No Y." (≥ 3 count as a tell).`, location: ctx.loc(ps, { selector: 'body' }), evidence: [{ type: 'measurement', value: aph, detail: 'aphorism patterns' }], problem_type: 'overall_structure' }));
      const bodyText = data.texts.filter((t) => t.body && !t.code).map((t) => t.text).join(' ');
      const latin = (bodyText.match(/[A-Za-z]/g) || []).length;
      const dashes = (bodyText.replace(/——/g, '').match(/—/g) || []).length;
      if (dashes >= 8 && latin > 0 && dashes / (bodyText.length / 500) >= 1) {
        hits.push(ctx.hit({ rule: 'SLP-14', title: `${dashes} em dashes in body text`, description: `Body text has ${dashes} em dashes in ${bodyText.length} characters (≥ 8 at ≥ 1 per 500 characters of Latin-script text).`, location: ctx.loc(ps, { selector: 'body' }), evidence: [{ type: 'measurement', value: { dashes, chars: bodyText.length }, detail: `${round(dashes / (bodyText.length / 500), 2)} per 500 chars` }], problem_type: 'overall_structure' }));
      }
    }
    if (allowed('SLP-15')) {
      const ctas = data.controls.filter((c) => c.cta);
      if (ctas.length && ctas.every((c) => matchList(lists.generic, norm(c.text)).length)) {
        hits.push(ctx.hit({ rule: 'SLP-15', title: `Only generic calls to action (${[...new Set(ctas.map((c) => c.text))].slice(0, 4).join(', ')})`, description: `Every call to action on the page is generic (${ctas.map((c) => `"${c.text}"`).join(', ')}); name each action's outcome with the product's own verbs.`, location: where(ctas[0]), evidence: [{ type: 'quote', value: ctas.map((c) => c.text).join(' | '), detail: `${ctas.length} CTA(s), all generic` }], problem_type: 'multiple_locations' }));
      }
    }
  }
  for (const [type, m] of Object.entries(caseSeen)) {
    if (m.size > 1) {
      const examples = [...m.entries()];
      const first = examples[0][1];
      hits.push(ctx.hit({ rule: 'CPY-03', title: `Mixed case conventions in ${type}`, description: `${type[0].toUpperCase()}${type.slice(1)} use ${examples.map(([c, e]) => `${c} case ("${e.text.slice(0, 30)}")`).join(' and ')} across the run scope; use one convention per element type.`, location: ctx.loc(first.ps, { selector: first.selector, bbox: first.bbox, snippet: first.snippet, source: first.source }), evidence: [{ type: 'quote', value: examples.map(([c, e]) => `${c}: ${e.text}`).join(' | '), detail: `${m.size} conventions` }], problem_type: 'multiple_locations' }));
    }
  }
  if (review.length) ctx.record({ review: review.slice(0, 50) });
  if (!ctx.design.hasProduct) ctx.note('PRODUCT.md is missing, so every proof candidate counts as unsourced (SLP-12)');
  return hits;
}
