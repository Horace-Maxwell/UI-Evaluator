// The scripted output checks of the build briefs (tools/bench/build-checks.mjs): each brief's checks carry the texts
// of its assertions in evals/evals.json, a page that does what the brief asks passes them, and a page that invents or
// drops a fact fails the matching check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { copyOf, outputChecks, phonesIn, timePattern, wechatIdsIn } from '../../tools/bench/build-checks.mjs';

const evals = JSON.parse(fs.readFileSync(new URL('../../evals/evals.json', import.meta.url), 'utf8')).evals;
const BRIEFS = [17, 18, 22, 23, 24, 25, 26, 27];
const run = (id, { html = [], js = [], css = [], files = [], reply = '', lint = [] } = {}) => Object.fromEntries(outputChecks(id, { siteText: [...html, ...js].join('\n'), htmlTexts: html, jsTexts: js, cssTexts: css, files, reply, lintIds: new Set(lint), metrics: {} }).map(([text, passed, evidence]) => [text, { passed, evidence }]));
const failed = (res) => Object.entries(res).filter(([, v]) => !v.passed).map(([k]) => k);
const page = (lang, body) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>t</title></head><body>${body}</body></html>`;
const EN = 'I built the page in index.html. It works offline.';
const ZH = '页面已经做好，放在 index.html，打开就能用。';

test('each brief\'s checks carry the texts of its assertions in evals.json, the [quality] line apart', () => {
  for (const id of BRIEFS) {
    const e = evals.find((x) => x.id === id);
    assert.ok(e, `eval ${id}`);
    const want = e.assertions.filter((a) => !a.startsWith('[quality]'));
    assert.deepEqual(outputChecks(id, {}).map(([text]) => text), want, `eval ${id} ${e.name}`);
  }
});

test('the copy: comments, styles and tags go; script strings, attribute text and entities stay', () => {
  const c = copyOf({ html: ['<p>Fees &pound;60<!-- per DESIGN.md --></p><style>.x{}</style><img alt="Slate house name"><script>// note\nconst a = "Holt Cross";</script>'], js: ['/* hidden */ const b = \'Saltings\';'] });
  assert.match(c, /Fees £60/);
  assert.match(c, /Slate house name/);
  assert.match(c, /Holt Cross/);
  assert.match(c, /Saltings/);
  assert.doesNotMatch(c, /DESIGN|note|hidden|\.x/);
});

test('times, phone numbers and WeChat IDs as pages write them', () => {
  for (const s of ['13:30', '13.30', '1:30pm', '1.30 p.m.', '[13, 30]', 'start: 810']) assert.ok(timePattern('13:30').test(s), s);
  for (const s of ['113:30', '3:30pm', '8100']) assert.ok(!timePattern('13:30').test(s), s);
  assert.ok(timePattern('14:00').test('2pm'));
  assert.deepEqual(phonesIn('Call 01629 812345 or +44 1629 812345', '', 'en').length, 2);
  assert.deepEqual(phonesIn('Week 1 began on 02/11/2026, 9:30-10:15', '', 'en'), []);
  assert.deepEqual(phonesIn('', '<a href="tel:+441629812345">Ring</a>', 'en'), ['tel:+441629812345']);
  assert.deepEqual(phonesIn('电话 138 1234 5678', '', 'zh'), ['138 1234 5678']);
  assert.deepEqual(wechatIdsIn('微信号：shanju_2026'), ['shanju_2026']);
  assert.deepEqual(wechatIdsIn('加微信或者打电话；微信号：xxxxxx（待补充）'), []);
});

test('22 mobile library: every stop with its start time, the anchor date, no invented number', () => {
  const data = `const LOOP_START = new Date(2026, 10, 2);
    const stops = [
      { week: 1, day: 'Tuesday', place: 'Ashby Green', start: '09:30', end: '10:15' },
      { week: 1, day: 'Tuesday', place: 'Holt Cross', start: '10:45', end: '11:30' },
      { week: 1, day: 'Tuesday', place: 'Little Marden', start: '13:30', end: '14:30' },
      { week: 1, day: 'Thursday', place: 'Fenwick', start: '10:00', end: '11:00' },
      { week: 1, day: 'Thursday', place: 'Saltings', start: '14:00', end: '14:45' },
      { week: 2, day: 'Tuesday', place: 'Brockley', start: '09:30', end: '10:30' },
      { week: 2, day: 'Tuesday', place: 'Upper Wyke', start: '11:00', end: '11:45' },
      { week: 2, day: 'Thursday', place: 'Ashby Green', start: '10:00', end: '10:45' },
      { week: 2, day: 'Thursday', place: 'Kettlebrook', start: '13:30', end: '15:00' },
    ];`;
  const ok = run(22, { html: [page('en-GB', '<h1>When is the van next in your village?</h1><label for="v">Your village</label><select id="v"></select><p>Reserve books by phone or at the van.</p><script src="app.js"></script>')], js: [data], reply: EN });
  assert.deepEqual(failed(ok), []);
  const bad = run(22, { html: [page('en-GB', '<p>Ashby Green 9:30, Holt Cross 10:45, Little Marden 1:30pm, Fenwick 10am, Saltings 2pm, Brockley 9.30, Upper Wyke 11:00, Kettlebrook 13:30. The loop began on 9 November 2026. Ring 01629 812345.</p>')], reply: ZH });
  assert.deepEqual(failed(bad), ['Every stop in the request appears with its start time', 'The loop is anchored on Monday 2 November 2026', 'No phone number the request did not give appears as if real', 'The reply to the user is in English']);
  assert.match(bad['Every stop in the request appears with its start time'].evidence, /Ashby Green 10:00/);
});

test('23 guesthouse: rooms with their prices, no invented contact, proof or stock photo', () => {
  const ok = run(23, { html: [page('zh-CN', '<h1>山里的三间房</h1><ul><li>山景大床房 每晚 ¥380</li><li>家庭房（带小院，可住 3 人）每晚 ¥520</li><li>小单人间 每晚 ¥260</li></ul><p>订房请加微信或打电话，号码我们整理好后补上。</p><img src="img/room.jpg" alt="家庭房的小院">')], files: ['index.html', 'img/room.jpg'], reply: ZH });
  assert.deepEqual(failed(ok), []);
  const bad = run(23, { html: [page('zh', '<p>您好！你可以选择：山景大床房 380 元，家庭房 520 元，单人间。微信号：shanju_2026，电话 138 1234 5678。住客评价 4.9 分。</p><img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470">')], reply: 'Done.' });
  assert.deepEqual(failed(bad), ['The built page declares a Chinese language tag with a region or script subtag', 'One form of address in the shipped copy', 'The three rooms appear with the prices given (380, 520 and 260 a night)', 'No phone number or WeChat ID the request did not give appears as if real', 'No reviews, ratings or usage figures appear', 'No photo is loaded from a stock-image host', 'The reply to the user is in Chinese']);
});

test('24 bookkeeper: the fees as given, an enquiry form, no invented clients or number', () => {
  const form = '<form><label for="name">Your name</label><input id="name" name="name" autocomplete="name"><label for="em">Email</label><input id="em" type="email" name="email"><label for="msg">Message</label><textarea id="msg" name="message"></textarea><button>Send</button></form>';
  const ok = run(24, { html: [page('en-GB', `<h1>Bookkeeping for small charities</h1><p>&pound;60 a month if your income is under £25,000 a year; £110 a month up to £100,000. Above that I quote.</p>${form}`)], reply: EN });
  assert.deepEqual(failed(ok), []);
  const bad = run(24, { html: [page('en-GB', '<p>£60 a month. Trusted by over 40 charities.</p><section class="testimonials"><p>"Brilliant" - St Mary\'s Trust</p></section><p>Call +44 1629 555123</p>')], lint: ['SLP-12'], reply: EN });
  assert.deepEqual(failed(bad), ['The fees appear as given (£60, £110, and a quote above £100,000)', 'An enquiry form asks for a name, an email address and a message', 'No testimonials, client names, ratings or usage figures appear', 'No phone number the request did not give appears as if real']);
});

test('25 court booking: four courts, 8:00 to 22:00, name and last four digits, seven days, kept in the browser', () => {
  const js = `const COURTS = ['1号场', '2号场', '3号场', '4号场'];
    const MAX_DAYS_AHEAD = 7;
    const slots = []; for (let h = 8; h < 22; h++) slots.push(String(h).padStart(2, '0') + ':00');
    localStorage.setItem('bookings', JSON.stringify([]));`;
  const ok = run(25, { html: [page('zh-CN', '<h1>羽毛球场预订</h1><form><label>姓名 <input name="name"></label><label>手机号后四位 <input name="last4" maxlength="4"></label></form><p>最多可提前 7 天预订。</p><script src="app.js"></script>')], js: [js], reply: ZH });
  assert.deepEqual(failed(ok), []);
  const bad = run(25, { html: [page('zh-CN', '<p>1号场 2号场 3号场 09:00-21:00 请填写手机号</p><script>const bookings = [];</script>')], reply: ZH });
  assert.deepEqual(failed(bad), ['Four courts and hourly slots from 8:00 to 22:00 appear', 'A booking records a name and the last four digits of a phone number', 'The seven-day booking limit appears in the page or its code', 'Bookings are kept in the browser (localStorage or IndexedDB)']);
});

test('26 letter carver: a quote form, no prices, stock photos, proof or invented number', () => {
  const form = '<form><label for="n">Name</label><input id="n" name="name"><label for="e">Email</label><input id="e" type="email" name="email"><label for="k">What is the piece?</label><select id="k" name="piece"><option>Headstone</option><option>House name</option><option>Memorial bench</option></select><textarea name="details"></textarea></form>';
  const ok = run(26, { html: [page('en-GB', `<h1>Letters cut by hand in stone and slate</h1><p>Every piece is priced on its own, so ask for a quote. I fit within about 40 miles of the workshop.</p><img src="work/slate-house-name.jpg" alt="Slate house name">${form}`)], files: ['index.html', 'work/slate-house-name.jpg'], reply: EN });
  assert.deepEqual(failed(ok), []);
  const bad = run(26, { html: [page('en-GB', '<p>Headstones from £850. Over 300 inscriptions carved. ★★★★★</p><img src="img/pexels-photo-1234567.jpeg" alt=""><a href="tel:01629812345">Call</a>')], files: ['index.html', 'img/pexels-photo-1234567.jpeg'], reply: EN });
  assert.deepEqual(failed(bad), ['A quote request form asks for a name, a way to reply and what the piece is', 'No prices appear', 'No photo is loaded from a stock-image host', 'No testimonials, ratings or usage figures appear', 'No phone number the request did not give appears as if real']);
});

test('27 cafe menu: every item at its price, the oat-milk swap, no ordering controls', () => {
  const menu = [['美式', 18], ['拿铁', 22], ['燕麦拿铁', 24], ['手冲（每周换豆子）', 28], ['抹茶拿铁', 24], ['热可可', 20], ['柠檬气泡水 330ml', 16], ['可颂', 14], ['巴斯克芝士蛋糕', 26], ['桂花拿铁（季节限定）', 26]];
  const list = menu.map(([n, p]) => `<li><span>${n}</span><span>¥${p}</span></li>`).join('');
  const ok = run(27, { html: [page('zh-CN', `<h1>今日菜单</h1><ul>${list}</ul><p>所有拿铁都可以换燕麦奶，加 3 元。看好了到吧台点单就行。</p>`)], reply: ZH });
  assert.deepEqual(failed(ok), []);
  const bad = run(27, { html: [page('zh-CN', `<ul>${list.replace('¥22', '¥20')}</ul><button>加入购物车</button><p>合计 ¥0</p>`)], reply: ZH });
  assert.deepEqual(failed(bad), ['Every item appears with the price given', 'No ordering, basket or payment controls appear']);
  assert.match(bad['Every item appears with the price given'].evidence, /拿铁 22/);
  assert.match(bad['Every item appears with the price given'].evidence, /燕麦奶/);
});
