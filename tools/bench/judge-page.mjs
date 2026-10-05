#!/usr/bin/env node
// A blind judging page for a person: every ready pair of a round, its two pages labelled X and Y at random (seeded,
// separately from the comparators' A and B), and three questions per pair.
//   node tools/bench/judge-page.mjs <round-dir> --seed <n> [--lang zh|en] [--title <text>] [--titles <file.json>]
// Writes <round>/judge.html (one self-contained file, screenshots inline) and <round>/judge-key.json. The page holds no
// key: the person copies a line of X/Y answers, and record-round.mjs reads it with judge-key.json. --titles maps an eval
// folder name to the heading shown for its pairs (default: the eval's name).
import fs from 'node:fs';
import path from 'node:path';
import { evalOfDir, loadEvals, parseArgs, readJson, rng, shuffle, usage, writeJson } from './lib.mjs';

const TEXT = {
  zh: {
    lang: 'zh-CN',
    title: '页面盲评',
    lede: '每组是同一个需求的两个版本，由不同的方法做出来，各自随机标成 X 和 Y（每组单独随机）。请只按看到的内容判断，点截图可以放大。全部选完后点“生成结果”，再把结果复制回来。',
    heading: (title, n) => `${title}（共 ${n} 组）`,
    group: (n, t) => `第 ${n} 组 · ${t}`,
    groupName: (n) => `第 ${n} 组`,
    request: '当时给构建者的需求原文',
    site: (l) => `页面 ${l}`,
    narrow: '手机 375 px',
    wide: '电脑 1280 px',
    zoom: (l, w) => `放大查看页面 ${l} 的${w}截图`,
    alt: (l, w) => `页面 ${l}，${w}宽度的整页截图`,
    phone: '手机',
    desktop: '电脑',
    questions: { more_beautiful: ['哪个更美？', '更美'], less_generic: ['哪个更不像模板、更不像 AI 做的？', '更不像模板'], better_overall: ['如果你是负责人，会发布哪个？', '会发布'] },
    tie: '差不多',
    note: '补充意见（可选）',
    notePrefix: '意见：',
    sep: '；',
    go: '生成结果',
    copyLabel: '把下面这一行完整复制回来：',
    copy: '复制结果',
    copied: '已复制。',
    missing: (g, q) => `还有题没选：${g}，“${q}”`,
    done: '已生成。',
    close: '关闭',
    zoomAlt: '放大的截图',
  },
  en: {
    lang: 'en',
    title: 'Blind page judgement',
    lede: 'Each group shows two versions made for the same request by different methods, labelled X and Y at random (separately for each group). Judge only what you see; select a screenshot to enlarge it. When every question is answered, choose “Make the result” and copy the line back.',
    heading: (title, n) => `${title} (${n} groups)`,
    group: (n, t) => `Group ${n} · ${t}`,
    groupName: (n) => `group ${n}`,
    request: 'The request the builders received',
    site: (l) => `Page ${l}`,
    narrow: 'Phone, 375 px',
    wide: 'Desktop, 1280 px',
    zoom: (l, w) => `Enlarge the ${w} screenshot of page ${l}`,
    alt: (l, w) => `Page ${l}, full-page screenshot at ${w} width`,
    phone: 'phone',
    desktop: 'desktop',
    questions: { more_beautiful: ['Which is more beautiful?', 'more beautiful'], less_generic: ['Which looks less like a template, or like AI made it?', 'less template-like'], better_overall: ['If you were in charge, which would you publish?', 'would publish'] },
    tie: 'About the same',
    note: 'Notes (optional)',
    notePrefix: 'note: ',
    sep: '; ',
    go: 'Make the result',
    copyLabel: 'Copy this whole line back:',
    copy: 'Copy the result',
    copied: 'Copied.',
    missing: (g, q) => `Not answered yet: ${g}, “${q}”`,
    done: 'Done.',
    close: 'Close',
    zoomAlt: 'Enlarged screenshot',
  },
};

const CSS = `
:root { --bg:#f6f4ef; --card:#fffdf8; --ink:#1f1d1a; --muted:#5f5a52; --line:#d9d3c7; --accent:#9c2f22; --focus:#1d4ed8; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#191816; --card:#23211e; --ink:#f1ede6; --muted:#b9b2a6; --line:#3c3833; --accent:#e0745f; --focus:#93b4ff; } }
:root[data-theme="dark"] { --bg:#191816; --card:#23211e; --ink:#f1ede6; --muted:#b9b2a6; --line:#3c3833; --accent:#e0745f; --focus:#93b4ff; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.65 system-ui,"PingFang SC","Hiragino Sans GB","Noto Sans SC",sans-serif; }
main { max-width:1180px; margin:0 auto; padding:24px 16px 64px; }
h1 { font-size:1.75rem; line-height:1.3; margin:0 0 8px; }
.lede { color:var(--muted); max-width:46em; margin:0 0 24px; }
.pair { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:20px 16px; margin:0 0 24px; }
.pair h2 { font-size:1.3rem; margin:0 0 8px; }
details { margin:0 0 16px; } summary { cursor:pointer; color:var(--muted); }
.req { border-left:3px solid var(--line); padding-left:12px; color:var(--muted); }
.sites { display:grid; grid-template-columns:1fr; gap:16px; }
@media (min-width:900px) { .sites { grid-template-columns:1fr 1fr; } }
.site h3 { margin:0 0 8px; font-size:1.1rem; }
.shots { display:grid; grid-template-columns:120px 1fr; gap:12px; align-items:start; }
figure { margin:0; } figcaption { font-size:.85rem; color:var(--muted); margin-bottom:4px; }
.shot { display:block; width:100%; padding:0; border:1px solid var(--line); border-radius:6px; background:#fff; cursor:zoom-in; max-height:520px; overflow:hidden; }
.shot img { display:block; width:100%; height:auto; }
.shot:focus-visible, input:focus-visible, textarea:focus-visible, .btn:focus-visible, summary:focus-visible { outline:3px solid var(--focus); outline-offset:2px; }
.questions { margin-top:16px; display:grid; gap:12px; }
fieldset { border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin:0; }
legend { font-weight:600; padding:0 4px; }
.choices { display:flex; flex-wrap:wrap; gap:8px 20px; }
.choices label { display:inline-flex; align-items:center; gap:6px; min-height:44px; cursor:pointer; }
.choices input { width:20px; height:20px; accent-color:var(--accent); }
.note { display:grid; gap:4px; color:var(--muted); }
textarea { font:inherit; color:var(--ink); background:var(--bg); border:1px solid var(--line); border-radius:6px; padding:8px; width:100%; }
.btn { font:inherit; font-weight:600; color:#fff; background:var(--accent); border:0; border-radius:8px; padding:12px 20px; min-height:48px; cursor:pointer; }
#out { display:none; margin-top:16px; }
#out textarea { min-height:120px; }
#msg { color:var(--accent); min-height:1.6em; }
dialog { border:0; padding:0; max-width:96vw; max-height:94vh; overflow:auto; background:transparent; }
dialog::backdrop { background:rgba(0,0,0,.75); }
dialog img { display:block; max-width:96vw; height:auto; }
.close { position:sticky; top:0; float:right; margin:8px; }
`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const dataUrl = (file) => `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;

const { pos, opts } = parseArgs(process.argv.slice(2));
const round = pos[0] && path.resolve(pos[0]);
if (!round || opts.seed === undefined || opts.seed === true || !fs.existsSync(path.join(round, 'pairs.json'))) {
  usage('usage: node tools/bench/judge-page.mjs <round-dir> --seed <n> [--lang zh|en] [--title <text>] [--titles <file.json>]   (run make-pairs.mjs first)', opts.help);
}
const t = TEXT[opts.lang === 'en' ? 'en' : 'zh'];
const title = typeof opts.title === 'string' ? opts.title : t.title;
const titles = typeof opts.titles === 'string' ? readJson(opts.titles) : {};
const random = rng(Number(opts.seed));
const evals = loadEvals();
const pairs = shuffle(readJson(path.join(round, 'pairs.json')).filter((p) => p.ready), random);
const key = {};
const sections = pairs.map((p, i) => {
  const pid = `p${i + 1}`;
  const e = evalOfDir(p.eval, evals);
  const [X, Y] = shuffle(['with_skill', 'without_skill'], random);
  key[pid] = { eval: p.eval, run: p.pair, X, Y };
  const sites = Object.entries({ X, Y }).map(([label, config]) => {
    const screens = path.join(round, p.eval, config, `run-${p.pair}`, 'screens');
    const shot = (w, cls, caption, word) => `<figure${cls}><figcaption>${caption}</figcaption><button class="shot" type="button" aria-label="${esc(t.zoom(label, word))}"><img src="${dataUrl(path.join(screens, `root_default_${w}-light-audit.png`))}" alt="${esc(t.alt(label, word))}"></button></figure>`;
    return `<article class="site"><h3>${t.site(label)}</h3><div class="shots">${shot(375, '', t.narrow, t.phone)}${shot(1280, ' class="wide"', t.wide, t.desktop)}</div></article>`;
  }).join('');
  const question = (q) => `<fieldset><legend>${t.questions[q][0]}</legend><div class="choices">${[['X', t.site('X')], ['Y', t.site('Y')], ['tie', t.tie]].map(([v, label]) => `<label><input type="radio" name="${pid}-${q}" value="${v}"> ${label}</label>`).join('')}</div></fieldset>`;
  return `<section class="pair" id="${pid}"><h2>${esc(t.group(i + 1, titles[p.eval] || e?.name || p.eval))}</h2>
<details><summary>${t.request}</summary><p class="req">${esc(e?.prompt || '')}</p></details>
<div class="sites">${sites}</div>
<div class="questions">${Object.keys(t.questions).map(question).join('')}
<label class="note">${t.note}<textarea name="${pid}-note" rows="2"></textarea></label></div></section>`;
});
// What the page needs to build the line: pair ids, their eval and run (not secret), and the words. No configurations.
const meta = Object.fromEntries(Object.entries(key).map(([pid, k], i) => [pid, { name: t.groupName(i + 1), short: k.eval.replace(/^eval-\d+-build-/, ''), run: k.run }]));
const words = { title, questions: Object.fromEntries(Object.entries(t.questions).map(([q, [, short]]) => [q, short])), tie: t.tie, sep: t.sep, notePrefix: t.notePrefix };
const html = `<!doctype html>
<html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style></head>
<body><main>
<h1>${esc(t.heading(title, pairs.length))}</h1>
<p class="lede">${t.lede}</p>
${sections.join('\n')}
<button class="btn" id="go" type="button">${t.go}</button>
<p id="msg" role="status"></p>
<div id="out"><label for="result">${t.copyLabel}</label><textarea id="result" readonly></textarea><p><button class="btn" id="copy" type="button">${t.copy}</button> <span id="copied" role="status"></span></p></div>
<dialog id="zoom"><button class="btn close" type="button" id="zclose">${t.close}</button><img id="zimg" alt="${t.zoomAlt}"></dialog>
</main>
<script>
const META = ${JSON.stringify(meta)};
const W = ${JSON.stringify(words)};
const MISSING = ${t.missing.toString()};
const z = document.getElementById('zoom');
document.querySelectorAll('.shot').forEach((b) => b.addEventListener('click', () => { document.getElementById('zimg').src = b.querySelector('img').src; z.showModal(); }));
document.getElementById('zclose').addEventListener('click', () => z.close());
z.addEventListener('click', (e) => { if (e.target === z) z.close(); });
document.getElementById('copy').addEventListener('click', async () => {
  const ta = document.getElementById('result');
  try { await navigator.clipboard.writeText(ta.value); } catch { ta.focus(); ta.select(); document.execCommand('copy'); }
  document.getElementById('copied').textContent = ${JSON.stringify(t.copied)};
});
document.getElementById('go').addEventListener('click', () => {
  const parts = [W.title];
  for (const [pid, m] of Object.entries(META)) {
    const a = [];
    for (const [q, word] of Object.entries(W.questions)) {
      const v = document.querySelector('input[name="' + pid + '-' + q + '"]:checked');
      if (!v) { document.getElementById('msg').textContent = MISSING(m.name, word); document.getElementById(pid).scrollIntoView(); return; }
      a.push(word + '=' + (v.value === 'tie' ? W.tie : v.value));
    }
    const note = document.querySelector('textarea[name="' + pid + '-note"]').value.trim().replace(/[|\\n]+/g, ' ');
    parts.push(pid + '(' + m.short + '#' + m.run + ') ' + a.join(W.sep) + (note ? W.sep + W.notePrefix + note : ''));
  }
  document.getElementById('msg').textContent = ${JSON.stringify(t.done)};
  document.getElementById('out').style.display = 'block';
  const ta = document.getElementById('result'); ta.value = parts.join(' | '); ta.focus(); ta.select();
});
</script>
</body></html>
`;
fs.writeFileSync(path.join(round, 'judge.html'), html);
writeJson(path.join(round, 'judge-key.json'), key);
console.log(`${pairs.length} pair(s); ${path.join(round, 'judge.html')} (${Math.round(html.length / 1024)} KB) and judge-key.json`);
