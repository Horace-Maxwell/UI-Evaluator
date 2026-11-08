// The scripted output checks for the build briefs whose assertions are about the shipped page and the reply only, so
// the same for both configurations: a build without the skill can pass every one. grade-build.mjs gathers the inputs
// (the shipped files, the reply, the lint and audit results); the checks are functions of those, so tests can feed
// them fixtures. The newer checks search the copy with scripts included, because a timetable or a menu is often
// rendered from data in a script. They are keyword and proximity searches: a pass says the fact is on the page, not
// that it reads well.
import { stripJsComments } from './strip-comments.mjs';

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", pound: '£', yen: '¥', mdash: '—', ndash: '–', middot: '·', times: '×' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m;
  const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1));
  return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
});
const COPY_ATTRS = /\b(?:alt|title|placeholder|aria-label|value|content|label)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

/**
 * The copy a visitor can be shown, as one string: HTML without comments, styles and tags (the text of alt, title,
 * placeholder, aria-label, value, content and label attributes kept), and scripts without comments. Whitespace is
 * collapsed, so distances in the proximity checks are counted in characters of copy.
 */
export function copyOf({ html = [], js = [] }) {
  const fromHtml = html.map((t) => t
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_, src) => ` ${stripJsComments(src)} `)
    .replace(/<[a-z][^>]*>/gi, (tag) => ` ${[...tag.matchAll(COPY_ATTRS)].map((m) => m[1] ?? m[2]).join(' ')} `)
    .replace(/<\/[a-z][^>]*>/gi, ' '));
  return decode([...fromHtml, ...js.map(stripJsComments)].join('\n')).replace(/\s+/g, ' ');
}

/** The source with comments removed and tags kept, for checks on markup (form fields, class names, tel: links). */
export function sourceOf({ html = [], js = [], css = [] }) {
  return [...html.map((t) => t.replace(/<!--[\s\S]*?-->/g, ' ')), ...js.map(stripJsComments), ...css.map((t) => t.replace(/\/\*[\s\S]*?\*\//g, ' '))].join('\n');
}

const hanCount = (s) => (s.match(/\p{Script=Han}/gu) || []).length;
export const replyInEnglish = (reply) => {
  const han = hanCount(reply);
  return ['The reply to the user is in English', han === 0 && reply.trim().length > 0, `${han} Han characters in the reply`];
};
export const replyInChinese = (reply) => {
  const han = hanCount(reply);
  const latin = (reply.match(/[A-Za-z]/g) || []).length;
  return ['The reply to the user is in Chinese', han > latin, `${han} Han vs ${latin} Latin letters`];
};

/** Every page declares a simplified-Chinese tag with a region or script subtag (zh-CN, zh-Hans, zh-Hans-CN). */
export const chineseLang = (htmlTexts) => {
  const langs = htmlTexts.map((t) => (t.match(/<html[^>]*\blang="([^"]+)"/i) || [])[1] || '');
  return ['The built page declares a Chinese language tag with a region or script subtag', htmlTexts.length > 0 && langs.every((l) => /^zh-(?:CN|Hans(?:-CN)?)$/i.test(l)), `lang: ${langs.join(', ') || 'none'}`];
};
export const cjkFonts = (lintIds, metrics) => ['The CJK font stack passes I18N-01 and no restricted font is self-hosted', !lintIds.has('I18N-01') && !lintIds.has('I18N-03') && !(metrics.criteria_failed?.G3 || []).includes('I18N-01'), `I18N hits: ${[...lintIds].filter((x) => /I18N-0[13]/.test(x)).join(', ') || 'none'}`];
export const oneAddress = (copy) => {
  const nin = /您/.test(copy);
  const ni = /你/.test(copy.replace(/您/g, ''));
  return ['One form of address in the shipped copy', !(nin && ni), `您 ${nin}, 你 ${ni}`];
};

// Phone numbers written as if real. Chinese: mobiles whole or in 3-4-4 groups, landlines with an area code.
// UK: a leading 0 or +44 and ten more digits in any grouping. Any tel: link with seven digits or more.
const CN_PHONE = /(?<!\d)(?:1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}|0\d{2,3}[\s-]?\d{7,8})(?!\d)/g;
const UK_PHONE = /(?<![\d.])(?:\+44[\s-]?(?:\(0\)[\s-]?)?|\b0)\d(?:[\s-]?\d){8,9}(?![\d])/g;
const TEL_LINK = /href\s*=\s*["']tel:([^"']*)["']/gi;
export function phonesIn(copy, source, locale) {
  const found = [...(copy.match(locale === 'zh' ? CN_PHONE : UK_PHONE) || [])];
  for (const m of source.matchAll(TEL_LINK)) if ((m[1].match(/\d/g) || []).length >= 7) found.push(`tel:${m[1]}`);
  return found;
}
const noPhone = (text, found, lintIds, metrics) => [text, !found.length && !lintIds.has('SLP-13') && !(metrics.criteria_failed?.G4 || []).includes('SLP-13'), found.length ? `numbers on the page: ${found.slice(0, 3).join(', ')}` : lintIds.has('SLP-13') ? 'SLP-13 in lint' : 'none'];
// A WeChat ID: six to twenty letters, digits, - or _, starting with a letter, right after 微信 or WeChat. A visible
// placeholder (xxxxxx, your-id) is what the skill asks for when a fact is missing, so it does not count.
const WECHAT_ID = /(?:微信|WeChat|weixin)\s*(?:号|ID|id)?\s*[:：]?\s*([A-Za-z][-_A-Za-z0-9]{5,19})(?![-_A-Za-z0-9])/gi;
export const wechatIdsIn = (copy) => [...copy.matchAll(WECHAT_ID)].map((m) => m[1]).filter((v) => !/^(?:wechat|weixin|qrcode|official)$/i.test(v) && !/^(?:x+|your\w*|todo|tbd|placeholder)$/i.test(v));

// Photos from a stock or placeholder library, by host in the source or by the names those libraries give downloads.
const STOCK_HOST = /\b(?:(?:images|source|plus)\.)?unsplash\.(?:com|it)\b|\b(?:images\.)?pexels\.com\b|\bpixabay\.com\b|\bshutterstock\.com\b|\bistockphoto\.com\b|\bgettyimages\.[a-z.]+\b|\bfreepik\.com\b|\bstock\.adobe\.com\b|\bdepositphotos\.com\b|\bdreamstime\.com\b|\b123rf\.com\b|\bpicsum\.photos\b|\bloremflickr\.com\b|\bplaceimg\.com\b/gi;
const STOCK_NAME = /(?:^|\/)(?:photo-\d{10,}-[0-9a-f]{6,}[^/]*|[^/]*-unsplash\.(?:jpe?g|png|webp|avif)|pexels-[^/]*\d{5,}[^/]*|[^/]*pixabay[^/]*|shutterstock_\d+[^/]*)$/i;
export function stockIn(source, files, lintIds) {
  const hosts = [...new Set((source.match(STOCK_HOST) || []).map((h) => h.toLowerCase()))];
  const names = files.filter((f) => STOCK_NAME.test(f));
  return [...hosts, ...names, ...(lintIds.has('SLP-37') ? ['SLP-37 placeholder image host'] : [])];
}
const noStock = (found) => ['No photo is loaded from a stock-image host', !found.length, found.slice(0, 3).join(', ') || 'none'];

// Proof the request did not give: the lint's fabricated-proof rule (the graded copy has no PRODUCT.md Facts, so any
// claim is unsupported), star ratings, review or testimonial sections, and counts of customers served.
const PROOF = [
  ['copy', /★{2,}|⭐|(?<![\d.])[1-5]\.\d\s?\/\s?5\b|(?<![\d.])[1-5](?:\.\d)?\s?(?:out of 5|stars?)\b/i, 'star rating'],
  ['source', /\b(?:class|className|id)\s*=\s*\{?["'`][^"'`]*\b(?:testimonials?|reviews|ratings?)\b/i, 'review or testimonial section'],
  ['copy', /\bwhat (?:our |my )?(?:clients|customers|people|families|guests|groups) (?:say|said)\b/i, 'what clients say'],
  ['copy', /(?<![\d.,£$])(?:\d{2,}[\d,]*|\d+\+)\s*\+?\s*(?:happy |satisfied )?(?:clients|customers|charities|groups|organi[sz]ations|families|guests|projects|headstones|inscriptions|memorials|commissions)\b/i, 'count of customers or pieces'],
  ['copy', /\d\.\d\s?分(?!钟)|好评|五星|星级评价|评分|住客评价|客人评价|用户评价|客人怎么说/, 'rating or review'],
  ['copy', /(?:\d{2,}|\d+\+)\s*(?:多|余)?\s*(?:位|个|组|户)\s*(?:客人|住客|家庭|游客)|接待(?:了|过)\s*\d+/, 'count of guests'],
];
export function proofIn(copy, source, lintIds, metrics) {
  const found = [];
  if (lintIds.has('SLP-12') || (metrics.criteria_failed?.G4 || []).includes('SLP-12')) found.push('SLP-12 (fabricated proof)');
  for (const [where, re, what] of PROOF) {
    const m = (where === 'source' ? source : copy).match(re);
    if (m) found.push(`${what}: "${m[0].slice(0, 40)}"`);
  }
  return found;
}
const noProof = (text, found) => [text, !found.length, found.slice(0, 3).join('; ') || 'none'];

// Whether a test holds near some occurrence of a name: on the window around it, the text after it and the text before
// it. With `cut`, the window stops at the neighbouring names, so a fact next to another stop or item is not borrowed.
const near = (copy, name, test, before = 80, after = 120, cut = null) => {
  const re = name instanceof RegExp ? new RegExp(name.source, `${name.flags.replace('g', '')}g`) : new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  for (const m of copy.matchAll(re)) {
    const end = m.index + m[0].length;
    let a = copy.slice(end, end + after);
    let b = copy.slice(Math.max(0, m.index - before), m.index);
    if (cut) {
      a = a.split(cut)[0];
      b = b.split(cut).pop();
    }
    if (test(b + m[0] + a, a, b)) return true;
  }
  return false;
};

/** The ways a start time can be written on a page or in its data: 13:30, 13.30, 1:30pm, 2pm, [13, 30], 810 (minutes). */
export function timePattern(hhmm) {
  const [h, mm] = hhmm.split(':').map(Number);
  const m2 = String(mm).padStart(2, '0');
  const h12 = h > 12 ? h - 12 : h;
  const ap = h >= 12 ? 'p' : 'a';
  const forms = [`(?<![\\d:.])0?${h}[:.]${m2}(?!\\d)`, `(?<![\\d.])${h}\\s*,\\s*${mm}(?![\\d.])`, `(?<![\\d:.])${h12}[:.]${m2}\\s?${ap}\\.?m`, `(?<![\\d.])${h * 60 + mm}(?![\\d.])`];
  if (mm === 0) forms.push(`(?<![\\d:.])${h12}\\s?${ap}\\.?m\\b`);
  return new RegExp(forms.join('|'), 'i');
}

const STOP_NAME = /Ashby Green|Holt Cross|Little Marden|Fenwick|Saltings|Brockley|Upper Wyke|Kettlebrook/i;
const LIBRARY_STOPS = [['Ashby Green', '9:30'], ['Holt Cross', '10:45'], ['Little Marden', '13:30'], ['Fenwick', '10:00'], ['Saltings', '14:00'], ['Brockley', '9:30'], ['Upper Wyke', '11:00'], ['Ashby Green', '10:00'], ['Kettlebrook', '13:30']];
const LOOP_ANCHOR = /2026-11-0?2\b|\b0?2(?:nd)?\s+(?:of\s+)?Nov(?:ember|\.)?,?\s+2026|Nov(?:ember|\.)?\s+0?2(?:nd)?,?\s+2026|2026\s*,\s*10\s*,\s*0?2\b|2026\/11\/0?2\b|\b0?2\/11\/2026|\b1793577600(?:000)?\b/i;
const CAFE_MENU = [['美式', 18], [/(?<![麦茶花])拿铁/, 22, '拿铁'], ['燕麦拿铁', 24], ['手冲', 28], ['抹茶拿铁', 24], ['热可可', 20], ['柠檬气泡水', 16], ['可颂', 14], ['巴斯克', 26], ['桂花拿铁', 26]];
// The price must come after the item's name and before the next item's.
const MENU_ROOT = /美式|拿铁|手冲|热可可|柠檬|可颂|巴斯克|燕麦|抹茶|桂花/;
const pricedAfter = (after, price) => new RegExp(`(?<![\\d.])${price}(?!\\d)`).test(after.split(MENU_ROOT)[0]);
const ORDERING = [
  [/<button\b[^>]*>[^<]*(?:购物车|加入(?:购物车|订单)|下单|结算|支付|付款|购买|点单|选购|订购)/, 'ordering button'],
  [/\b(?:class|id)\s*=\s*["'][^"']*\b(?:cart|basket|checkout)\b/i, 'cart markup'],
  [/<input\b[^>]*\btype\s*=\s*["']?number\b/i, 'quantity field'],
  [/aria-label\s*=\s*["'][^"']*(?:数量|增加|减少|加入购物车)/, 'quantity control'],
];

/**
 * The output checks for one build brief, as [text, passed, evidence]. The texts are the brief's assertions in
 * evals/evals.json, without the [quality] line, which grade-build.mjs checks for every brief.
 * ctx: { siteText (the shipped HTML and JS, raw, as one string), htmlTexts, jsTexts, cssTexts, files (paths under
 * the site root), reply, lintIds (a Set), metrics }.
 */
export function outputChecks(evalId, ctx) {
  const { siteText = '', htmlTexts = [], jsTexts = [], cssTexts = [], files = [], reply = '', lintIds = new Set(), metrics = {} } = ctx;
  const copy = copyOf({ html: htmlTexts, js: jsTexts });
  const source = sourceOf({ html: htmlTexts, js: jsTexts, css: cssTexts });
  const out = [];
  if (evalId === 17) {
    // Food-bank front-desk tool (English, Operate).
    const text = siteText;
    out.push(['The page has a donation form with item, quantity and best-before or expiry fields', /item/i.test(text) && /quantit|how many|amount/i.test(text) && /best.?before|expir|use.?by/i.test(text), 'searched the shipped HTML and JS for the three field names']);
    out.push(['Logged donations are kept in the browser (localStorage or IndexedDB)', /localStorage|indexedDB/.test(text), /localStorage/.test(text) ? 'localStorage' : /indexedDB/.test(text) ? 'IndexedDB' : 'neither found']);
    out.push(['There is a low-stock view and an expiring-this-week view', /low|running out|short/i.test(text) && /this week|7 days|seven days|expir/i.test(text), 'searched the shipped copy']);
    out.push(replyInEnglish(reply));
  }
  if (evalId === 18) {
    // Watch-repair shop page (Chinese, Persuade). Judged on the HTML without its scripts, as when it was first graded.
    out.push(chineseLang(htmlTexts), cjkFonts(lintIds, metrics));
    const visible = siteText.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
    out.push(oneAddress(visible));
    out.push(['The opening hours match the request (Tuesday to Sunday, 9:00 to 18:00)', /周二[^。]{0,8}周日|星期二[^。]{0,8}星期日/.test(visible) && /9[:：]00|九点|9 点|上午 ?9/.test(visible) && /18[:：]00|六点|6 点|下午 ?6|晚上 ?6/.test(visible), 'searched the visible copy']);
    out.push(noPhone('No phone number the request did not give appears as if real', visible.match(CN_PHONE) || [], lintIds, metrics));
    out.push(replyInChinese(reply));
  }
  if (evalId === 22) {
    // Mobile library timetable (English, Convey).
    const missing = LIBRARY_STOPS.filter(([name, t]) => !near(copy, name, (w) => timePattern(t).test(w), 80, 120, STOP_NAME)).map(([n, t]) => `${n} ${t}`);
    out.push(['Every stop in the request appears with its start time', !missing.length, missing.length ? `not found near the stop: ${missing.join(', ')}` : `${LIBRARY_STOPS.length} stops with their start times`]);
    const anchor = copy.match(LOOP_ANCHOR);
    out.push(['The loop is anchored on Monday 2 November 2026', !!anchor, anchor ? `"${anchor[0]}"` : 'no form of the date found']);
    out.push(noPhone('No phone number the request did not give appears as if real', phonesIn(copy, source, 'en'), lintIds, metrics));
    out.push(replyInEnglish(reply));
  }
  if (evalId === 23) {
    // Mountain guesthouse (Chinese, Persuade).
    out.push(chineseLang(htmlTexts), cjkFonts(lintIds, metrics), oneAddress(copy));
    const rooms = [['大床', /(?<![\d.])380(?![\d])|三百八/], ['家庭', /(?<![\d.])520(?![\d])|五百二/], ['单人', /(?<![\d.])260(?![\d])|[两二]百六/]];
    const roomsMissing = rooms.filter(([name, price]) => !near(copy, name, (w) => price.test(w), 60, 80)).map(([n]) => n);
    out.push(['The three rooms appear with the prices given (380, 520 and 260 a night)', !roomsMissing.length, roomsMissing.length ? `no price near: ${roomsMissing.join(', ')}` : 'each room with its price']);
    const contact = [...phonesIn(copy, source, 'zh'), ...wechatIdsIn(copy).map((v) => `WeChat ${v}`)];
    out.push(noPhone('No phone number or WeChat ID the request did not give appears as if real', contact, lintIds, metrics));
    out.push(noProof('No reviews, ratings or usage figures appear', proofIn(copy, source, lintIds, metrics)));
    out.push(noStock(stockIn(source, files, lintIds)));
    out.push(replyInChinese(reply));
  }
  if (evalId === 24) {
    // Bookkeeper for small charities (English, Persuade).
    const fees = { '£60': /£\s?60(?![\d,])/, '£110': /£\s?110(?![\d,])/, 'a quote above £100,000': /£\s?100,?000|£\s?100k/i };
    const feesMissing = Object.entries(fees).filter(([, re]) => !re.test(copy)).map(([k]) => k);
    if (!/\bquot(?:e|ed|ation)\b/i.test(copy)) feesMissing.push('the word quote');
    out.push(['The fees appear as given (£60, £110, and a quote above £100,000)', !feesMissing.length, feesMissing.length ? `missing: ${feesMissing.join(', ')}` : 'all three']);
    out.push(enquiryForm(source, 'An enquiry form asks for a name, an email address and a message', 'email'));
    out.push(noProof('No testimonials, client names, ratings or usage figures appear', proofIn(copy, source, lintIds, metrics)));
    out.push(noPhone('No phone number the request did not give appears as if real', phonesIn(copy, source, 'en'), lintIds, metrics));
    out.push(replyInEnglish(reply));
  }
  if (evalId === 25) {
    // Badminton court booking at the front desk (Chinese, Operate).
    out.push(chineseLang(htmlTexts), cjkFonts(lintIds, metrics));
    const labelled = [1, 2, 3, 4].every((n) => new RegExp(`(?:${n}|${'一二三四'[n - 1]})\\s*号\\s*场|(?:场地?|court)\\s*(?:${n}(?!\\d)|${'ABCD'[n - 1]}(?![A-Za-z]))`, 'i').test(copy));
    const courts = labelled || /(?:四|4)\s*片/.test(copy) || /courts?(?:_?count|_?num(?:ber)?|_?total)?\s*[:=]\s*4\b|\[\s*1\s*,\s*2\s*,\s*3\s*,\s*4\s*\]/i.test(copy);
    const opens = /(?<![\d:])0?8[:：]00|八点|早上\s*8\s*点|(?:open|start|first|begin)\w*\s*[:=]\s*8\b|=\s*8\s*;\s*\w+\s*<=?\s*2[12]\b|length\s*:\s*14\b[\s\S]{0,60}\+\s*8\b/i.test(copy);
    const closes = /(?<![\d:])22[:：]00|晚上\s*(?:十|10)\s*点|(?:close|end|last)\w*\s*[:=]\s*2[12]\b|=\s*8\s*;\s*\w+\s*<=?\s*2[12]\b|length\s*:\s*14\b/i.test(copy);
    out.push(['Four courts and hourly slots from 8:00 to 22:00 appear', courts && opens && closes, `courts ${courts}, opens at 8 ${opens}, closes at 22 ${closes}`]);
    const name = /姓名|名字|称呼/.test(copy);
    const last4 = /后\s*(?:四|4)\s*位|尾号|末\s*(?:四|4)\s*位/.test(copy);
    out.push(['A booking records a name and the last four digits of a phone number', name && last4, `name ${name}, last four digits ${last4}`]);
    const week = copy.match(/(?<![\d月])(?:七|7)\s*天|提前\s*(?:七|7)\s*日|一周内|\w*(?:max|limit|ahead|advance|window|range)\w*\s*[:=]\s*[67]\b|\b\w+\s*<\s*7\s*;|\b7\s*\*\s*(?:24|864e5|86400)|(?:864e5|86400\w*)\s*\*\s*7\b|setDate\([^)]*\+\s*7\b/i);
    out.push(['The seven-day booking limit appears in the page or its code', !!week, week ? `"${week[0]}"` : 'not found']);
    const store = /localStorage/.test(source) ? 'localStorage' : /indexedDB/i.test(source) ? 'IndexedDB' : null;
    out.push(['Bookings are kept in the browser (localStorage or IndexedDB)', !!store, store || 'neither found']);
    out.push(replyInChinese(reply));
  }
  if (evalId === 26) {
    // Letter carver's portfolio (English, Persuade).
    out.push(enquiryForm(source, 'A quote request form asks for a name, a way to reply and what the piece is', 'reply'));
    const price = copy.match(/£\s?\d|\b\d[\d,]*\s?(?:pounds|GBP)\b/i);
    out.push(['No prices appear', !price, price ? `"${price[0]}"` : 'none']);
    out.push(noStock(stockIn(source, files, lintIds)));
    out.push(noProof('No testimonials, ratings or usage figures appear', proofIn(copy, source, lintIds, metrics)));
    out.push(noPhone('No phone number the request did not give appears as if real', phonesIn(copy, source, 'en'), lintIds, metrics));
    out.push(replyInEnglish(reply));
  }
  if (evalId === 27) {
    // Cafe menu opened from a QR code (Chinese, Convey).
    out.push(chineseLang(htmlTexts), cjkFonts(lintIds, metrics), oneAddress(copy));
    const missing = CAFE_MENU.filter(([name, price]) => !near(copy, name, (_, after) => pricedAfter(after, price), 0, 80)).map(([n, p, label]) => `${label || n} ${p}`);
    const oat = near(copy, '燕麦奶', (_, after, before) => pricedAfter(after, 3) || /(?:\+|＋|加)\s*¥?\s*3(?!\d)/.test(before), 30, 30);
    if (!oat) missing.push('燕麦奶 +3');
    out.push(['Every item appears with the price given', !missing.length, missing.length ? `missing or another price: ${missing.join(', ')}` : `${CAFE_MENU.length} items and the oat-milk swap`]);
    const ordering = ORDERING.map(([re, what]) => [source.match(re), what]).filter(([m]) => m).map(([m, what]) => `${what}: "${m[0].slice(-30)}"`);
    if (/合计|总计|总价|小计/.test(copy)) ordering.push('a running total');
    out.push(['No ordering, basket or payment controls appear', !ordering.length, ordering.slice(0, 3).join('; ') || 'none']);
    out.push(replyInChinese(reply));
  }
  return out;
}

/** A form with a name field, a way to reply (an email field; for 'reply', email or phone) and a free-text or piece field. */
function enquiryForm(source, text, reply) {
  const form = /<form\b/i.test(source);
  const name = /autocomplete\s*=\s*["']?(?:name|given-name)\b|\b(?:name|id)\s*=\s*["']?[\w-]*name["'\s>]|>\s*(?:your |full )?name\b/i.test(source);
  const email = /type\s*=\s*["']?email\b|autocomplete\s*=\s*["']?email\b|\bname\s*=\s*["']?e-?mail/i.test(source);
  const phone = /type\s*=\s*["']?tel\b|autocomplete\s*=\s*["']?tel\b|\bname\s*=\s*["']?(?:phone|tel)/i.test(source);
  const replyOk = reply === 'email' ? email : email || phone;
  const message = /<textarea\b/i.test(source) || (reply !== 'email' && /<select\b[\s\S]{0,600}?(?:headstone|house name|bench|memorial)|type\s*=\s*["']?radio[\s\S]{0,300}?(?:headstone|house name|bench|memorial)/i.test(source));
  return [text, form && name && replyOk && message, `form ${form}, name ${name}, ${reply === 'email' ? `email ${email}` : `email ${email}, phone ${phone}`}, ${reply === 'email' ? 'message' : 'what the piece is'} ${message}`];
}
