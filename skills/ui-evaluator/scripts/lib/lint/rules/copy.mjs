// Copy rules on source strings (content-copy.md; anti-slop.md SLP-12…15; cjk.md).
// Gate: CPY-01 placeholder text; SLP-12 fabricated proof (a hard tell only when the claim is absent from
// PRODUCT.md's Facts section; never acceptable through DESIGN.md); SLP-13 placeholder identities; SLP-14 copy tells
// (Table B hits, ≥ 3 aphorisms, generic hero copy, ≥ 8 em dashes at ≥ 1 per 500 Latin characters); SLP-15 generic
// CTA set (page files, with the calls to action of the local components the page renders).
// Advisory: CPY-09 error wording in source (a static candidate for CPY-04 until the error state is exercised),
// CPY-19 GOV.UK words to avoid, I18N-17 zh canonical terms, I18N-18 zh jargon review list ([heuristic]).
// Test, story and mock files are not shipped UI: copy rules skip them.
import path from 'node:path';
import { copySegments, isCta, isPageFile, labelOf, hasAncestor, elTokens, inHero } from '../model.mjs';
import { attrValue, ownerOf, normAttr, elementText } from '../markup.mjs';
import { wordList, listMeta, matchAll, firstMatch, tellParams } from '../data.mjs';
import { hasCjk } from '../../util/text.mjs';

export const RULES = [
  { id: 'CPY-01', level: 'gate', title: 'No placeholder text shipped', fix: 'Replace it with real content from PRODUCT.md, or a visibly labelled placeholder such as [price to confirm] listed for the owner.' },
  { id: 'SLP-12', level: 'gate', fast: true, title: 'Fabricated proof', fix: 'Ask the owner for the fact and add it to PRODUCT.md Facts, or show a visible placeholder, or remove the section; never make an invented figure look more plausible.' },
  { id: 'SLP-13', level: 'gate', fast: true, title: 'Placeholder identities', fix: 'Replace with real content from the owner, or label the demo data where users see it.' },
  { id: 'SLP-14', level: 'gate', fast: true, title: 'Copy tells', fix: 'Say what the product literally does, for whom, in the users\' words; test the line with the swap test, and delete rather than rephrase into a new formula.' },
  { id: 'SLP-15', level: 'gate', fast: true, title: 'Generic CTA set', fix: 'Name each action\'s outcome with the product\'s own verbs, one label per intent through the flow.' },
  { id: 'CPY-09', level: 'advisory', title: 'Error wording', fix: 'Say what happened and what to do next in the field\'s own terms; no blame, jokes, alarm words or bare codes.' },
  { id: 'CPY-19', level: 'advisory', title: 'Words to avoid', fix: 'Rewrite with a concrete verb and object from PRODUCT.md.' },
  { id: 'I18N-17', level: 'advisory', title: 'zh-CN canonical terms', fix: 'Use the glossary term (登录, 账号, 其他, 抱歉, 禁用名单) everywhere and record it in DESIGN.md.' },
  { id: 'I18N-18', level: 'advisory', title: 'zh jargon review list [heuristic]', fix: 'Name the action or outcome instead of the jargon term; judge each hit by sense (never SLP-14 evidence).' },
];

function short(s, n = 70) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

/** Copy that ships: no test, story or mock files, nothing inside code elements. */
function shippedSegments(doc) {
  if (doc.nonShipped) return [];
  return copySegments(doc).filter((s) => !s.code);
}

const LABELLED = /\[[^\]]{2,80}\]|\b(?:placeholder|sample|example|demo|dummy|to confirm|tbc)\b|示例|样例|演示|占位/i;

// ---- CPY-01 ----------------------------------------------------------------------------------------------

function cpy01(doc, report) {
  const lists = [['en', wordList('en', 'placeholder_text', { all: true })], ['zh', wordList('zh', 'placeholder_text', { all: true })]];
  for (const seg of shippedSegments(doc)) {
    let hit = null;
    for (const [lang, list] of lists) {
      const listHeuristic = !!listMeta(lang, 'placeholder_text').heuristic;
      for (const m of matchAll(list, seg.text)) {
        // A visibly labelled placeholder ([price to confirm]) is allowed.
        const before = seg.text.slice(0, m.index);
        if (/\[[^\]]*$/.test(before) && seg.text.slice(m.index).includes(']')) continue;
        // A heuristic entry (UI-Evaluator's rendering beyond the named strings) counts only when it is most of the
        // string, a label that is the placeholder; prose that mentions "placeholder text" or 占位符 is not one.
        if ((m.entry.heuristic || listHeuristic) && !(seg.text.length <= 24 || m.match.length / seg.text.length >= 0.5)) continue;
        hit = m;
        break;
      }
      if (hit) break;
    }
    if (hit) report('CPY-01', doc, seg.offset, { message: `placeholder text "${short(hit.match, 30)}" in ${seg.kind === 'attr' ? `${seg.attr}` : 'shipped copy'}: "${short(seg.text, 50)}"`, value: hit.match });
  }
}

// ---- SLP-12 ----------------------------------------------------------------------------------------------

const COUNT_NOUNS = 'teams|companies|customers|users|developers|businesses|downloads|installs|countries|people|clients|members|organi[sz]ations|stars|reviews|projects|sites|websites|stores|shops|brands|creators|students|learners|integrations|partners|homes|families|schools|hospitals|restaurants|cities|subscribers|readers|fans|merchants|agencies|startups|enterprises';
const PROOF = [
  { kind: 'trusted-by', re: /\b(?:trusted|loved)\s+by\b/i },
  // "used by", "chosen by", "relied on by" are ordinary prose ("the action chosen by a policy") unless a count or a
  // group of customers follows.
  { kind: 'trusted-by', re: new RegExp(String.raw`\b(?:used|chosen|relied on)\s+by\s+(?:\d|over\b|more than\b|thousands\b|millions\b|hundreds\b|leading\b|top\b|the world's\b|(?:${COUNT_NOUNS})\s+(?:at|like|from|including)\s+\p{Lu})`, 'iu') },
  { kind: 'trusted-by', re: /\bbacked\s+by\s+(?:y combinator|yc\b|sequoia|a16z|andreessen|accel|index ventures|leading|top|[A-Z][\w&]*\s+(?:capital|ventures|partners)\b)/i },
  { kind: 'logo wall', re: /\bas\s+(?:featured|seen)\s+(?:in|on)\b/i },
  // Counts: a large number with a plus (10,000+ or 10k+), or any number with a plus or an "over" before a counted noun.
  { kind: 'count', re: /(?:^|[^\w.])(?:\d{1,3}(?:[,.  ]\d{3})+|\d+(?:\.\d+)?\s?(?:k|K|M|B|million|billion|thousand))\+(?=\s|$|[.,;:!)])/ },
  { kind: 'count', re: new RegExp(String.raw`(?:^|[^\w.])\d[\d,.]*\+\s+(?:[\w-]+\s+){0,2}(?:${COUNT_NOUNS})\b`, 'i') },
  { kind: 'count', re: new RegExp(String.raw`\b(?:over|more than|nearly|almost|upwards of)\s+\d[\d,.]*\s*(?:k|K|M|B|million|billion|thousand)?\s+(?:happy\s+|active\s+|satisfied\s+|independent\s+)?(?:${COUNT_NOUNS})\b`, 'i') },
  { kind: 'percent', re: /\b\d{1,3}(?:\.\d+)?\s?%\s+(?:uptime|faster|more|less|fewer|higher|lower|better|satisfaction|satisfied|retention|growth|increase|reduction|conversion|accuracy|savings|cheaper|of (?:customers|users|teams|companies|developers))\b/i },
  { kind: 'percent', re: /\b\d{1,3}(?:\.\d+)?\s?%\s*(?:uptime|SLA)\b/i },
  { kind: 'multiplier', re: /\b\d+(?:\.\d+)?\s?[x×]\s+(?:faster|more|better|cheaper|quicker|higher|productivity|ROI|growth|conversion|speed|efficiency)\b/i },
  { kind: 'rating', re: /[★⭐]{3,}/u },
  { kind: 'rating', re: /\b[1-5]\.\d\s*\/\s*5(?![.\d])|\b[1-5](?:\.\d)?\s*(?:out of 5|stars?)\b|\brated\s+[1-5](?:\.\d)?\b/i },
  { kind: 'badge', re: /\b(?:SOC\s?2(?:\s+Type\s+(?:II|I|1|2))?|ISO\s?27001|HIPAA[- ]compliant|GDPR[- ]compliant|PCI[- ]DSS|FedRAMP)\b|\bProduct of the (?:Day|Week|Month)\b|\bG2 (?:Leader|High Performer)\b|\baward[- ]winning\b/i },
];
// A number right after these words is a version, an age or a size, not a usage count ("Node 18+", "ages 13+").
const NOT_A_COUNT_BEFORE = /\b(?:node(?:\.js)?|ios|ipados|android|python|react|vue|angular|chrome|firefox|safari|edge|version|v|ages?|aged|level|grade|wcag|es|ecmascript|java|php|ruby|go|rust|windows|macos|ubuntu|debian|api|tls|http|size|sizes|ip|ram|gb|tb|mb|year|years|over-|under-)\s*$/i;

const norm = (s) => String(s || '').toLowerCase().replace(/[“”"'‘’]/g, '').replace(/[^\p{L}\p{N}%.,/+\s-]/gu, ' ').replace(/\s+/g, ' ').trim();

function numbersIn(s) {
  return [...String(s).matchAll(/\d[\d,.]*/g)].map((m) => m[0].replace(/,/g, '').replace(/\.$/, '')).filter((x) => x && x !== '.');
}

/** Numbers a claim makes, without rating denominators ("4.8/5", "4.8 out of 5"). */
function claimNumbers(s) {
  return numbersIn(String(s).replace(/\/\s*(?:5|10|100)\b|\bout of (?:5|10|100)\b/gi, ' '));
}

const STOP = new Set(['the', 'and', 'for', 'from', 'with', 'this', 'that', 'your', 'our', 'their', 'over', 'more', 'than', 'since', 'used', 'trusted', 'loved', 'rated', 'by', 'of', 'in', 'on', 'to', 'at', 'a', 'an']);

/**
 * Whether PRODUCT.md Facts back a claim: the claim's numbers all appear in the facts (single digits also need a
 * shared word), the claim text or the matched phrase appears there, every proper name in the claim appears there,
 * or one of the extra strings (an attribution) does.
 */
function inFacts(ctx, { claim = '', match = '', extras = [] }) {
  const factsRaw = ctx.project.product.factsText || '';
  if (!factsRaw.trim()) return false;
  const facts = norm(factsRaw);
  const factNums = new Set(numbersIn(factsRaw));
  const nums = claimNumbers(match || claim);
  if (nums.length && nums.every((n) => factNums.has(n))) {
    const small = nums.every((n) => /^\d$/.test(n));
    const words = norm(claim).split(' ').filter((w) => w.length > 3 && !STOP.has(w));
    if (!small || words.some((w) => facts.includes(w))) return true;
  }
  const c = norm(claim);
  if (c.length > 3 && facts.includes(c)) return true;
  if (match && !numbersIn(match).length && norm(match).length > 3 && facts.includes(norm(match))) return true;
  const names = [...String(claim).matchAll(/(?<![.!?]\s|^)\b(\p{Lu}[\p{L}&'’-]+(?:\s+\p{Lu}[\p{L}&'’-]+)*)/gu)].map((m) => m[1]).filter((n) => !STOP.has(n.toLowerCase()));
  if (names.length && names.every((n) => facts.includes(norm(n)))) return true;
  return extras.some((x) => x && norm(x).length > 2 && facts.includes(norm(x)));
}

function missingText(ctx) {
  if (!ctx.project.product.exists) return 'not backed by PRODUCT.md (no Facts section to list it)';
  return ctx.project.product.factsText.trim() ? 'not in PRODUCT.md Facts' : 'not backed: PRODUCT.md has no Facts entries';
}

/** Attribution of a quote ("— Name, Place" after a dash, or a cite/footer/figcaption child). A hyphen inside a word is not a dash. */
function attribution(doc, el, quote) {
  const child = el.children.find((c) => /^(?:cite|figcaption|footer)$/.test(c.lower));
  if (child) return elementText(doc, child, 200).replace(/^[—–-]+\s*/, '');
  const m = String(quote).match(/(?:^|\s)(?:[—–]|-{1,2}(?=\s))\s*(\p{Lu}[\p{L}.'’-]+(?:\s+\p{Lu}[\p{L}.'’-]+)+)/u);
  return m ? m[1] : null;
}

const TESTIMONIAL_CTX = /testimonial|review|customer|client|quote-card|endorse|praise|social-proof|kudos|wall-of-love/i;
const JOB_TITLE = /\b(?:CEO|CTO|COO|CFO|CMO|CPO|founder|co-founder|owner|head of|director|manager|lead|engineer|designer|developer|VP|president|chair|partner|consultant|coordinator|specialist|officer|principal|teacher|nurse|chef|customer|user|client|member|parent)\b/i;
const PROOF_HEADING = /customer|testimonial|review|what (?:people|our \w+|users|clients) (?:say|think)|loved by|trusted by|from (?:our )?(?:users|customers|clients|shops|teams|members)/i;

/**
 * A quotation is a testimonial (proof) when the page treats it as one: a Testimonial or Review component, a
 * promotional page (calls to action or other proof claims) with the quote outside an <article>, a testimonial-like
 * class, id or label on it or an ancestor, an attribution with a job title, or a nearby heading about customers or
 * reviews. A <blockquote> quoting a source in an article is a citation, not proof.
 */
function testimonialSignal(doc, el, by, promo) {
  if (el.isComponent && /Testimonial|Review/.test(el.tag)) return true;
  // On a promotional page (calls to action or other proof claims), an attributed quote outside an article is proof.
  if (promo && !hasAncestor(el, (a) => a.lower === 'article')) return true;
  const ctx = (e) => (e.isComponent && /Testimonial|Review|Customer|SocialProof/.test(e.tag)) || e.attrs.some((a) => /^(?:class|id|aria-label|aria-labelledby|data-section)$/.test(a.lower) && typeof a.value === 'string' && TESTIMONIAL_CTX.test(a.value));
  if (ctx(el) || hasAncestor(el, ctx)) return true;
  if (by && JOB_TITLE.test(by)) return true;
  for (let e = el.parent, depth = 0; e && depth < 3; e = e.parent, depth += 1) {
    if (e.children.some((c) => c !== el && /^h[1-6]$/.test(c.lower) && PROOF_HEADING.test(elementText(doc, c, 160)))) return true;
  }
  return false;
}

function slp12(doc, ctx, report) {
  const missing = missingText(ctx);
  const seen = new Set();
  for (const seg of shippedSegments(doc)) {
    if (LABELLED.test(seg.text)) continue;
    for (const p of PROOF) {
      const m = p.re.exec(seg.text);
      if (!m) continue;
      // In long-form content (Markdown, MDX, <article>) numbers and standards are what the article is about; only the
      // explicit proof shapes (trusted by, as seen in, star rows) are claims there.
      if (seg.content && !['trusted-by', 'logo wall'].includes(p.kind) && !(p.kind === 'rating' && /[★⭐]/u.test(m[0]))) continue;
      if (p.kind === 'count') {
        // Plain counts in data tables are data, not proof; versions, ages and sizes are not usage counts.
        if (seg.table) continue;
        const at = m.index + (m[0].length - m[0].trimStart().length);
        if (NOT_A_COUNT_BEFORE.test(seg.text.slice(Math.max(0, at - 24), at))) continue;
        if (/\b(?:v|version)\s*\d/i.test(seg.text)) continue;
      }
      const claim = seg.text.length <= 90 ? seg.text : seg.text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30);
      if (inFacts(ctx, { claim, match: m[0] })) continue;
      const key = `${seg.line}:${p.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      report('SLP-12', doc, seg.offset, { message: `${p.kind} claim "${short(claim, 60)}" is ${missing}`, value: m[0].trim() });
      break;
    }
  }
  if (doc.nonShipped) return;
  const promo = ctasOf(doc).length > 0 || shippedSegments(doc).some((seg) => PROOF.some((p) => p.re.test(seg.text)));
  // Testimonials: quotes with an attribution.
  for (const el of doc.elements) {
    const isTestimonial = el.lower === 'blockquote' || (el.isComponent && /Testimonial|Review|Quote/.test(el.tag));
    if (!isTestimonial || hasAncestor(el, (a) => a.lower === 'blockquote' || (a.isComponent && /Testimonial|Review/.test(a.tag)))) continue;
    const author = ['author', 'name', 'cite', 'person'].map((n) => attrValue(el, n)).find((v) => typeof v === 'string') || null;
    const quote = ['quote', 'text', 'content', 'body', 'testimonial'].map((n) => attrValue(el, n)).find((v) => typeof v === 'string') || doc.texts.filter((t) => t.el === el || (t.el && hasAncestor(t.el, (a) => a === el))).map((t) => t.value).join(' ');
    if (!quote || quote.length < 12 || LABELLED.test(`${quote} ${author || ''}`)) continue;
    const by = author || attribution(doc, el, quote);
    const named = by || el.children.some((c) => /^(?:cite|figcaption|footer)$/.test(c.lower));
    if (!named || !testimonialSignal(doc, el, by, promo)) continue;
    const firstSentence = String(quote).split(/(?<=[.!?])\s/)[0];
    if (inFacts(ctx, { claim: firstSentence, extras: [by && by.split(',')[0]] })) continue;
    report('SLP-12', doc, el.offset, { message: `testimonial${by ? ` attributed to ${short(by, 40)}` : ''} is ${missing}`, value: short(quote, 60) });
  }
  // Data arrays of testimonials: { quote: "...", author: "..." }.
  for (const s of doc.strings) {
    if (!s.key || !/^(?:quote|testimonial|review)$/i.test(s.key) || s.value.length < 12 || LABELLED.test(s.value)) continue;
    const by = doc.strings.find((x) => x !== s && x.key && /^(?:author|name|cite|person|by)$/i.test(x.key) && Math.abs(x.offset - s.offset) < 400);
    if (inFacts(ctx, { claim: String(s.value).split(/(?<=[.!?])\s/)[0], extras: [by && by.value] })) continue;
    report('SLP-12', doc, s.offset, { message: `testimonial text in data is ${missing}`, value: short(s.value, 60) });
  }
  // Logo walls: arrays named logos / customers / clients / partners with three or more names.
  const re = /(?:const|let|var)\s+(logos|customers|clients|partners|companies|brands|trustedBy|customerLogos)\s*(?::[^=]*)?=\s*\[/gi;
  let m;
  while ((m = re.exec(doc.code))) {
    const names = doc.strings.filter((s) => s.offset > m.index && s.offset < m.index + 1500 && /^[A-Z][\w&.' -]{1,30}$/.test(s.value.trim()) && !/\.(?:svg|png|jpg|webp)$/i.test(s.value));
    if (names.length < 3) continue;
    if (names.every((n) => inFacts(ctx, { claim: n.value, extras: [n.value] }))) continue;
    report('SLP-12', doc, m.index, { message: `${m[1]} lists ${names.length} customer or partner names (${names.slice(0, 3).map((n) => n.value).join(', ')}…) that are ${missing}`, value: names.map((n) => n.value).join(', ') });
  }
}

// ---- SLP-13 ----------------------------------------------------------------------------------------------

const EXAMPLE_BEFORE = /(?:\be\.g\.,?|\bfor (?:example|instance),?|\bsuch as|\bsuppose|\bimagine|\bsay,|比如|例如|假设|假如|譬如|好比|举例来说|举个例子)\s*[：:,，]?\s*$/i;

function slp13(doc, ctx, report) {
  const lists = [wordList('en', 'placeholder_identities', { all: true }), wordList('zh', 'placeholder_identities', { all: true })];
  const segs = shippedSegments(doc);
  const fileLabelled = segs.some((s) => /\b(?:sample|demo|example|test) (?:data|content|accounts?|users?|records?)\b|示例数据|演示数据/i.test(s.text));
  if (fileLabelled) return;
  const seen = new Set();
  for (const seg of segs) {
    if ((seg.attr && normAttr(seg.attr) === 'placeholder') || (seg.key && /placeholder|example|hint/i.test(seg.key))) continue; // format examples
    // Articles and documentation use stock names and example.com on purpose (RFC 2606): they are examples, not UI data.
    if (seg.content) continue;
    const owner = ownerOf(doc, seg.offset) || '';
    if (/demo|sample|mock|fake|dummy|seed|fixture|example/i.test(owner)) continue;
    for (const list of lists) {
      const m = firstMatch(list, seg.text);
      if (!m) continue;
      // A stock name used as the example in an explanation ("for example, John Doe", 比如张三) is labelled by its sentence.
      if (EXAMPLE_BEFORE.test(seg.text.slice(Math.max(0, m.index - 24), m.index))) break;
      // The ACME certificate protocol is not a placeholder company.
      if (/^ACME$/.test(m.match) && /^\s*(?:challenge|protocol|client|account|server|directory|dns|http-01|tls-alpn|v2|order)\b/i.test(seg.text.slice(m.index + m.match.length))) break;
      if (inFacts(ctx, { claim: m.match, extras: [m.match] })) break;
      const key = `${seg.line}:${m.match}`;
      if (seen.has(key)) break;
      seen.add(key);
      report('SLP-13', doc, seg.offset, { message: `placeholder identity "${m.match}" in shipped UI`, value: m.match });
      break;
    }
  }
}

// ---- SLP-14 ----------------------------------------------------------------------------------------------

const CJK_CHARS = /[　-〿぀-ヿ㐀-鿿가-힯＀-￯]/g;
const CJK_CHAR = /[　-〿぀-ヿ㐀-鿿가-힯＀-￯]/;

/**
 * Em dashes in Latin-script text: the Chinese 破折号 —— is standard punctuation, and a single dash between Han
 * characters (正—反—合, 函数—论元) is a CJK connector; neither is counted.
 */
/** A string that reads as the title of a work: at least four words, most of the longer ones capitalised, no full stop. */
function isTitle(text) {
  const t = String(text).trim();
  if (/[.!?]\s+\p{Lu}/u.test(t) || /[.!?]$/.test(t)) return false;
  const words = t.split(/\s+/).filter((w) => /^\p{L}/u.test(w) && w.length > 3);
  if (words.length < 4) return false;
  return words.filter((w) => /^\p{Lu}/u.test(w)).length / words.length >= 0.75;
}

/** True when `match` at `index` is capitalised and a neighbouring word is too: a name or a title, not prose. */
function titleCaseRun(text, index, match) {
  if (!/^\p{Lu}/u.test(match)) return false;
  const before = text.slice(0, index).match(/(\p{L}[\p{L}\p{N}'’-]*)\s+$/u);
  const after = text.slice(index + match.length).match(/^\s+(\p{L}[\p{L}\p{N}'’-]*)/u);
  const cap = (w) => !!w && /^\p{Lu}/u.test(w) && !/^(?:A|An|The|I)$/.test(w);
  const sentenceStart = /(?:^|[.!?:]\s+)$/.test(text.slice(0, index));
  return (!sentenceStart && cap(before?.[1])) || cap(after?.[1]);
}

export function latinDashes(text) {
  const t = String(text).replace(/——/g, '  ');
  let n = 0;
  for (let i = 0; i < t.length; i += 1) {
    if (t[i] !== '—') continue;
    let a = i - 1;
    while (a >= 0 && /\s/.test(t[a])) a -= 1;
    let b = i + 1;
    while (b < t.length && /\s/.test(t[b])) b += 1;
    if ((a >= 0 && CJK_CHAR.test(t[a])) || (b < t.length && CJK_CHAR.test(t[b]))) continue;
    n += 1;
  }
  return n;
}

const FINITE = /\b(?:is|are|was|were|be|been|being|am|has|have|had|do|does|did|can|could|will|would|should|shall|may|might|must|needs?|needed|takes?|gets?|goes|comes?|works?)\b/i;

/** A literal or domain use: the entry's literal nouns follow, or PRODUCT.md uses the same collocation. */
function domainUse(ctx, entry, text, index, match) {
  const after = text.slice(index + match.length, index + match.length + 60);
  if (entry.literal_after) {
    try {
      if (new RegExp(entry.literal_after, 'iu').test(after)) return true;
    } catch {
      // A bad pattern is caught by the data tests.
    }
  }
  const productText = ctx.project.product.text || '';
  const next = (after.match(/^\s+([\p{L}-]+)/u) || [])[1];
  if (productText && next) {
    const coll = `${match} ${next}`.toLowerCase();
    if (productText.toLowerCase().replace(/\s+/g, ' ').includes(coll)) return true;
  }
  return false;
}

function slp14(doc, ctx, report) {
  const P = tellParams('SLP-14');
  const segs = shippedSegments(doc).filter((s) => !s.quote);
  const buzz = wordList('en', 'ai_buzzwords');
  const theatre = wordList('en', 'theatre_phrases');
  const hero = wordList('en', 'generic_hero_phrases');
  const seen = new Set();
  for (const seg of segs) {
    for (const [list, kind] of [[buzz, 'buzzword'], [theatre, 'theatre phrase'], [hero, 'generic hero line']]) {
      for (const h of matchAll(list, seg.text)) {
        if (kind === 'buzzword' && domainUse(ctx, h.entry, seg.text, h.index, h.match)) continue;
        // In articles a capitalised hit inside a Title Case run is part of a name or a cited title ("Learning Robust
        // Visual Features"): product, feature and work names are exempt (CPY-19). Words with a technical sense
        // (robust estimators, statistical leverage, streamlines) are read as technical vocabulary in articles.
        if (kind === 'buzzword' && seg.content && (titleCaseRun(seg.text, h.index, h.match) || h.entry.technical)) continue;
        // A string that is itself a title in Title Case ("Doubly Robust Off-policy Value Evaluation") names a work.
        if (kind === 'buzzword' && isTitle(seg.text) && seg.text.length > h.match.length + 12) continue;
        // "Welcome to …" is an empty hero line; the same words in an onboarding message or a footer are not.
        if (kind === 'generic hero line' && /^\s*welcome to/i.test(h.match) && !inHero(seg.el, seg)) continue;
        const key = `${seg.line}:${h.entry.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        report('SLP-14', doc, seg.offset, { message: `${kind} "${h.match}" in "${short(seg.text, 50)}"`, value: h.match });
      }
    }
  }
  // Aphoristic constructions: counted per file (one page), from 3. Two-part shapes count only as fragments.
  const aph = wordList('en', 'aphorism_patterns');
  const hits = [];
  for (const seg of segs) {
    for (const h of matchAll(aph, seg.text)) {
      if (h.entry.fragment) {
        const tail = h.match.replace(/^[\s\S]*?\.\s+(?:No|Just)\s/, '');
        if (FINITE.test(tail)) continue;
      }
      hits.push({ seg, h });
    }
  }
  const min = P.aphorism_min || 3;
  if (hits.length >= min) report('SLP-14', doc, hits[0].seg.offset, { message: `${hits.length} aphoristic constructions on one page (${hits.slice(0, 3).map((x) => `"${short(x.h.match.replace(/^[.!?]\s+/, ''), 30)}"`).join(', ')})`, value: hits.length, detail: hits.map((x) => `${x.seg.line}: ${x.h.entry.text || x.h.entry.name}`).join('; ') });
  // Em-dash density in Latin-script body text; the Chinese 破折号 —— is standard punctuation and is not counted.
  // Body text: prose with at least 20 Latin letters. A lone "—" standing for an empty value, or a dash in a short
  // label, is not body text (dash-built labels are SLP-27).
  const body = segs.filter((s) => (s.kind === 'text' || s.kind === 'md' || (s.kind === 'string' && s.text.length >= 40)) && (s.text.match(/\p{Script=Latin}/gu) || []).length >= 20);
  let dashes = 0;
  let chars = 0;
  let firstDash = null;
  for (const s of body) {
    // Markdown link labels are cited titles ("[A General Survey — July 1972]"): their dashes are not the prose's.
    const prose = s.kind === 'md' ? s.text.replace(/\[[^\]]*\]/g, ' ') : s.text;
    const latin = prose.replace(/——/g, ' ').replace(CJK_CHARS, '');
    chars += latin.length;
    const n = latinDashes(prose);
    if (n && firstDash === null) firstDash = s.offset;
    dashes += n;
  }
  const em = P.em_dash || { count_min: 8, per_chars: 500 };
  if (dashes >= em.count_min && dashes * em.per_chars >= chars) {
    report('SLP-14', doc, firstDash, { message: `${dashes} em dashes in ${chars} characters of Latin body text (≥ ${em.count_min} at ≥ 1 per ${em.per_chars})`, value: dashes, detail: `${(chars / Math.max(dashes, 1)).toFixed(0)} characters per dash` });
  }
}

// ---- SLP-15 ----------------------------------------------------------------------------------------------

const NOT_A_CTA = /^(?:menu|close|open menu|close menu|toggle menu|toggle navigation|search|toggle theme|dark mode|light mode|theme|×|x|back|previous|next|prev|cancel|dismiss)$/i;
const PRIMITIVE = /^(?:Button|Btn|Link|NavLink|RouterLink|NuxtLink|Image|Img|Icon|Fragment|Suspense|Transition|TransitionGroup|Teleport|KeepAlive|Slot|Head|Script|Trans)$|Icon$|^Lucide|^Svg/;

export function normaliseLabel(s) {
  return String(s || '')
    .replace(/[←-⇿➔➡⬅-⬇→←›»«‹…!.,:;]+/g, ' ')
    .replace(/\p{Extended_Pictographic}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Calls to action in one document: [{ el, label, offset }]. */
function ctasOf(doc) {
  const out = [];
  for (const el of doc.elements) {
    if (!isCta(doc, el)) continue;
    if (el.attrs.some((a) => /^aria-(?:expanded|haspopup|controls)$/.test(a.lower)) || String(attrValue(el, 'type') || '') === 'reset') continue;
    if (el.isComponent && el.attrs.some((a) => a.lower === 'aschild')) continue; // the child link carries the label
    const label = normaliseLabel(labelOf(doc, el));
    if (!label || NOT_A_CTA.test(label)) continue;
    out.push({ el, label, offset: el.offset, doc });
  }
  return out;
}

/** Local components a document renders: [{ name, source }] for capitalised tags imported from a relative or alias path. */
function localComponents(doc) {
  const imported = new Map();
  for (const imp of doc.imports) {
    if (!/^(?:\.{1,2}\/|@\/|~\/|\$lib\/|#\/|src\/)/.test(imp.source)) continue;
    for (const n of imp.names) imported.set(n, imp.source);
  }
  const used = new Map();
  for (const el of doc.elements) {
    const head = el.tag.split('.')[0];
    if (!/^[A-Z]/.test(head) || PRIMITIVE.test(head) || !imported.has(head)) continue;
    used.set(head, imported.get(head));
  }
  return [...used.entries()].map(([name, source]) => ({ name, source }));
}

const RESOLVE_EXTS = ['', '.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte', '.astro', '.mdx', '/index.tsx', '/index.ts', '/index.jsx', '/index.js', '/index.vue'];

function resolveImport(fromRel, source, byRel) {
  const bases = [];
  if (/^\.{1,2}\//.test(source)) bases.push(path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), source)));
  else {
    const rest = source.replace(/^(?:@\/|~\/|\$lib\/|#\/)/, '');
    const libRest = source.startsWith('$lib/') ? `lib/${rest}` : rest;
    for (const prefix of ['src/', '', 'app/']) bases.push(`${prefix}${libRest}`);
    // Scans of a sub-folder report paths relative to the project root: match by suffix too.
  }
  for (const b of bases) {
    for (const ext of RESOLVE_EXTS) {
      const hit = byRel.get(`${b}${ext}`);
      if (hit) return hit;
    }
  }
  for (const b of bases) {
    for (const ext of RESOLVE_EXTS) {
      const suffix = `/${b}${ext}`.replace(/\/{2,}/g, '/');
      for (const [rel, d] of byRel) if (rel.endsWith(suffix)) return d;
    }
  }
  return null;
}

function slp15Project(docs, ctx, report) {
  const generic = wordList('en', 'generic_ctas', { all: true });
  const isGeneric = (l) => generic.some((g) => g.re.test(l));
  const byRel = new Map(docs.map((d) => [String(d.rel).replace(/\\/g, '/'), d]));
  for (const page of docs) {
    if (page.nonShipped || !isPageFile(page)) continue;
    // The page's calls to action, plus those of the local components it renders (two levels deep). When a rendered
    // component cannot be read, the set is incomplete and the page is not judged.
    const ctas = [...ctasOf(page)];
    let complete = true;
    const visited = new Set([page]);
    let frontier = [page];
    for (let depth = 0; depth < 2 && frontier.length && complete; depth += 1) {
      const next = [];
      for (const d of frontier) {
        for (const c of localComponents(d)) {
          const target = resolveImport(String(d.rel).replace(/\\/g, '/'), c.source, byRel);
          if (!target) {
            complete = false;
            break;
          }
          if (visited.has(target)) continue;
          visited.add(target);
          ctas.push(...ctasOf(target));
          next.push(target);
        }
        if (!complete) break;
      }
      frontier = next;
    }
    if (!complete || !ctas.length || !ctas.every((c) => isGeneric(c.label))) continue;
    const labels = [...new Set(ctas.map((c) => c.label))];
    const own = ctas.find((c) => c.doc === page);
    const at = own ? own.offset : (page.elements[0]?.offset ?? 0);
    report('SLP-15', page, at, { message: `every call to action on the page is generic (${labels.map((l) => `"${l}"`).join(', ')})`, value: labels.join(' | '), problemType: 'overall_structure' });
  }
}

// ---- advisory ---------------------------------------------------------------------------------------------

const ERROR_COMPONENT = /Error|Alert|Toast|FormMessage|HelperText|Invalid|FieldError|Snackbar|Notification/;
const ERROR_CALLEE = /^(?:toast\.error|message\.error|notification\.error|notify\.error|setError|setErrors|setErrorMessage|setFieldError|form\.setError|reject|showError|alertError)$/;
const ERROR_KEY = /^(?:error|errorMessage|errorText|errorMsg|required|invalid_type_error|required_error|invalid)$/;
const VALIDATION_CALLEE = /^(?:[\w.]*\.)?(?:min|max|email|url|regex|refine|superRefine|nonempty|length|required|matches|pattern|validate|typeError|oneOf|positive|integer|uuid|startsWith|endsWith|includes)$/;

function isErrorContext(doc, seg) {
  const el = seg.el;
  if (el) {
    const errEl = (e) => String(attrValue(e, 'role') || '') === 'alert' || (e.isComponent && ERROR_COMPONENT.test(e.tag)) || elTokens(doc, e).some((t) => /error|invalid|danger|destructive/i.test(t.base) && !t.variants.length);
    if (errEl(el) || hasAncestor(el, errEl)) return true;
  }
  const callee = seg.callee || '';
  if (ERROR_CALLEE.test(callee)) return true;
  if (seg.key && ERROR_KEY.test(seg.key)) return true;
  if (seg.key === 'message' && (VALIDATION_CALLEE.test(callee) || /error|valid/i.test(doc.code.slice(Math.max(0, seg.offset - 200), seg.offset)))) return true;
  if (!seg.key && VALIDATION_CALLEE.test(callee) && seg.kind === 'string') return true;
  return false;
}

function cpy09(doc, report) {
  const lists = [
    ['en', wordList('en', 'error_generic', { all: true }), 'generic'],
    ['en', wordList('en', 'error_blame', { all: true }), 'blaming or alarming'],
    ['zh', wordList('zh', 'error_generic', { all: true }), 'generic'],
    ['zh', wordList('zh', 'error_blame', { all: true }), 'blaming'],
  ];
  for (const seg of shippedSegments(doc)) {
    if (!isErrorContext(doc, seg)) continue;
    for (const [, list, kind] of lists) {
      const m = firstMatch(list, seg.text);
      if (!m) continue;
      report('CPY-09', doc, seg.offset, { message: `${kind} error wording "${short(seg.text, 50)}" (a CPY-04 candidate until the error state is exercised)`, value: m.match });
      break;
    }
  }
}

function cpy19(doc, report) {
  const list = wordList('en', 'gov_uk_words_to_avoid').filter((e) => !e.also_table_b);
  const seen = new Set();
  for (const seg of shippedSegments(doc)) {
    if (seg.quote) continue;
    for (const h of matchAll(list, seg.text)) {
      const key = `${seg.line}:${h.entry.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      report('CPY-19', doc, seg.offset, { message: `"${h.match}": write ${h.entry.instead} instead (GOV.UK words to avoid)`, value: h.match });
    }
  }
}

function zhAdvisory(doc, ctx, report) {
  const segs = shippedSegments(doc).filter((s) => hasCjk(s.text) && !s.quote);
  if (!segs.length) return;
  const jargon = wordList('zh', 'jargon_review', { all: true });
  const terms = wordList('zh', 'canonical_terms', { all: true });
  for (const seg of segs) {
    if (ctx.enabled('I18N-18')) for (const h of matchAll(jargon, seg.text)) report('I18N-18', doc, seg.offset, { message: `[heuristic] ${h.match} in "${short(seg.text, 40)}": review whether the copy names the action or outcome`, value: h.match });
    if (ctx.enabled('I18N-17')) for (const h of matchAll(terms, seg.text)) report('I18N-17', doc, seg.offset, { message: `${h.match} → ${h.entry.use} (one term per concept)`, value: h.match });
  }
}

export function checkFile(doc, ctx, report) {
  if (ctx.enabled('CPY-01')) cpy01(doc, report);
  if (ctx.enabled('SLP-12')) slp12(doc, ctx, report);
  if (ctx.enabled('SLP-13')) slp13(doc, ctx, report);
  if (ctx.enabled('SLP-14')) slp14(doc, ctx, report);
  if (ctx.enabled('CPY-09')) cpy09(doc, report);
  if (ctx.enabled('CPY-19')) cpy19(doc, report);
  if (ctx.enabled('I18N-17') || ctx.enabled('I18N-18')) zhAdvisory(doc, ctx, report);
}

export function checkProject(docs, ctx, report) {
  if (ctx.enabled('SLP-15')) slp15Project(docs, ctx, report);
}
