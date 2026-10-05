#!/usr/bin/env node
// Draw the README images as HTML pages and render them to PNG (docs/assets/README.md says what each one shows):
//   node tools/readme-media/build.mjs [--only <name part>] [--out docs/assets] [--html <dir>]
// Every number comes from the stored benchmark rounds in evals/results/ or from the audit capture in docs/assets/src/;
// every caption about the blind judgement is checked against the round's human-judgement.json before anything is drawn.
// The committed images were rendered on macOS with its system fonts (Avenir Next, SF Mono, PingFang SC); elsewhere the
// fallback fonts change the result. Needs the browser runtime (`node skills/ui-evaluator/scripts/uie.mjs doctor --install`).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, SKILL_DIR, parseArgs, readJson, scoreOf, usage } from '../bench/lib.mjs';

const { opts } = parseArgs(process.argv.slice(2));
if (opts.help) usage('usage: node tools/readme-media/build.mjs [--only <name part>] [--out docs/assets] [--html <dir>]', true);
const OUT = path.resolve(ROOT, typeof opts.out === 'string' ? opts.out : 'docs/assets');
const SRC = path.join(ROOT, 'docs/assets/src');
const RESULTS = path.join(ROOT, 'evals/results');
const only = typeof opts.only === 'string' ? opts.only : '';
if (process.platform !== 'darwin') console.warn('note: not macOS, so Avenir Next, SF Mono and PingFang SC fall back to other fonts and the images will differ from the committed ones');

// ---------------------------------------------------------------- data
const PAIRS = {
  cafe: { round: 'build-benchmark-2026-10-03', eval: 'eval-1-build-en-repair-cafe', run: null, width: 1280 },
  calligraphy: { round: 'build-benchmark-2026-10-04', eval: 'eval-2-build-zh-calligraphy-signup', run: 1, width: 375 },
};
const runDir = (p, config) => path.join(RESULTS, p.round, p.eval, config, p.run ? `run-${p.run}` : '');

/** Per-run numbers shown under each screenshot: tells, failed WCAG and craft criteria, output assertions. */
function numbers(dir) {
  const g = readJson(path.join(dir, 'grading.json'));
  const counts = g.metrics?.counts || {};
  return { hard: (g.metrics?.hard_tells || []).length, g2: counts.G2 || 0, g3: counts.G3 || 0, checks: scoreOf(g, 'output') };
}

/** The person's verdicts in a round, in either stored shape (keyed by eval, or a list with runs). */
function humanVerdicts(round) {
  const doc = readJson(path.join(RESULTS, round, 'human-judgement.json'));
  if (Array.isArray(doc.verdicts)) return doc.verdicts;
  return Object.entries(doc.verdicts).map(([ev, v]) => ({ eval: ev, run: 1, ...v }));
}
const allFor = (v, config) => v && ['more_beautiful', 'less_generic', 'better_overall'].every((q) => v[q] === config);

function checkCaptions() {
  const cafe = humanVerdicts(PAIRS.cafe.round).find((v) => v.eval === PAIRS.cafe.eval);
  if (!allFor(cafe, 'with_skill')) throw new Error('the cafe caption says the owner preferred the skill on all three questions; the stored verdict disagrees');
  const cal = humanVerdicts(PAIRS.calligraphy.round).filter((v) => v.eval === PAIRS.calligraphy.eval);
  const shown = cal.find((v) => v.run === PAIRS.calligraphy.run);
  const others = cal.filter((v) => v.run !== PAIRS.calligraphy.run);
  if (!allFor(shown, 'with_skill') || others.length !== 2 || !others.every((v) => allFor(v, 'without_skill'))) {
    throw new Error('the calligraphy caption says this run went to the skill and the other two to the baseline; the stored verdicts disagree');
  }
}

// ---------------------------------------------------------------- shared look (a proof sheet: paper, ink, one red)
const CSS = `
:root { --paper:#F3F0E7; --ink:#191714; --ink2:#59544B; --rule:#CBC4B4; --red:#C2341B; }
* { box-sizing:border-box; margin:0; padding:0; }
body { background:#fff; }
#frame { position:relative; width:880px; background:var(--paper); color:var(--ink); font-family:"Avenir Next","Helvetica Neue",sans-serif; }
#frame.zh { font-family:"Avenir Next","PingFang SC","Hiragino Sans GB",sans-serif; }
.mono { font-family:"SF Mono",Menlo,monospace; }
.crop { position:absolute; width:14px; height:14px; border-color:var(--ink); border-style:solid; border-width:0; }
.crop.tl { left:10px; top:10px; border-left-width:1px; border-top-width:1px; }
.crop.tr { right:10px; top:10px; border-right-width:1px; border-top-width:1px; }
.crop.bl { left:10px; bottom:10px; border-left-width:1px; border-bottom-width:1px; }
.crop.br { right:10px; bottom:10px; border-right-width:1px; border-bottom-width:1px; }
`;
const CROPS = '<i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i>';
const TICK = '<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true"><path d="M2 9.5 C4.5 10.5 6.5 12.5 8 14.5 C10.5 9 14.5 4.5 20 1.5" fill="none" stroke="#C2341B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const page = (zh, css, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${css}</style></head><body><div id="frame" class="${zh ? 'zh' : ''}">${CROPS}${body}</div></body></html>`;
const fileUrl = (p) => pathToFileURL(p).href;

// ---------------------------------------------------------------- banner and social preview
function banner(lang, social = false) {
  const zh = lang === 'zh';
  const gates = zh ? ['证据', '功能', '无障碍', '工艺底线', '无 AI 痕迹', '可用性', '设计评审', '真实用户'] : ['Evidence', 'Function', 'Accessibility', 'Craft floor', 'No AI tells', 'Usability', 'Design panel', 'Real users'];
  let rows = gates.map((name, i) => `<div class="row"><span class="mono gid">G${i}</span><span class="gname">${name}</span>${i <= 4 ? TICK : '<span class="box"></span>'}</div>`).join('');
  // Brackets: G0–G4 make L1, G5–G6 add L2, G7 gives L4 (L3 is a person's confirmation, not a gate).
  rows += [[3, 114, 'L1'], [123, 42, 'L2'], [171, 18, 'L4']].map(([t, h, lab]) => `<div class="lvl" style="top:${t}px;height:${h}px"><span>${lab}</span></div>`).join('');
  const tagline = zh ? '构建、审计、修复网页界面，<br>做到可以核验的标准。' : 'Build, audit and fix web interfaces<br>to a bar you can check.';
  const spec = zh ? 'WCAG 2.2 AA · 工艺底线 · 零 AI 痕迹 · 独立评估' : 'WCAG 2.2 AA · craft floor · zero AI tells · isolated evaluators';
  return page(zh, `
#frame { height:${social ? 440 : 320}px; }
.inner { position:absolute; left:0; right:0; top:${social ? 60 : 0}px; height:320px; }
.word { position:absolute; left:52px; top:58px; font-family:"Avenir Next Condensed","Avenir Next",sans-serif; font-weight:700; font-size:98px; line-height:1; letter-spacing:-1.5px; }
.tag { position:absolute; left:56px; top:178px; font-size:22px; line-height:1.35; color:var(--ink); font-weight:500; }
.zh .tag { font-size:21px; line-height:1.5; }
.spec { position:absolute; left:56px; bottom:38px; font-size:12px; color:var(--ink2); }
.card { position:absolute; right:70px; top:38px; width:262px; border:1.5px solid var(--ink); background:#FBF9F3; padding:12px 14px 10px; }
.card h2 { font-size:13px; font-weight:600; margin-bottom:6px; }
.row { display:flex; align-items:center; height:24px; border-top:1px solid var(--rule); font-size:14px; }
.gid { width:32px; font-size:12px; color:var(--ink2); }
.gname { flex:1; }
.row svg { margin-right:2px; }
.box { width:13px; height:13px; border:1.3px solid var(--ink2); margin-right:6px; }
.rows { position:relative; }
.lvl { position:absolute; left:calc(100% + 22px); width:7px; border:1.5px solid var(--red); border-left:0; }
.lvl span { position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:12px; color:var(--red); font-weight:700; font-family:"SF Mono",Menlo,monospace; }
`, `<div class="inner"><div class="word">UI-Evaluator</div>
<div class="tag">${tagline}</div>
<div class="spec mono">${spec}</div>
<div class="card"><h2>${zh ? '门禁' : 'Gates'}</h2><div class="rows">${rows}</div></div></div>`);
}

// ---------------------------------------------------------------- before and after
function pair(lang, kind) {
  const zh = lang === 'zh';
  const p = PAIRS[kind];
  const cafe = kind === 'cafe';
  const [width, cropH] = cafe ? [390, 560] : [300, 640];
  const sub = cafe
    ? zh ? '修车咖啡馆单页网站 · 基准第 3 轮 · 电脑 1280 px' : 'Repair café one-page site · benchmark iteration 3 · 1280 px'
    : zh ? '老年大学书法班报名页 · 基准第 4 轮 · 手机 375 px' : 'Calligraphy class sign-up for older learners · benchmark iteration 4 · 375 px';
  const verdict = cafe
    ? zh ? '这一组的盲评：项目负责人在“更美”“更不像模板”“会发布哪个”三项上都选了右侧。' : 'Blind judgement of this pair: the project owner preferred the right page on beauty, distinctiveness and which to publish.'
    : zh ? '这一组的盲评：项目负责人三项都选了右侧。同一需求的另外两次运行里，基线三项全胜。' : 'Blind judgement of this pair: the right page was preferred on all three questions. In the other two runs of this prompt, the baseline won all three.';
  const labels = zh ? ['不用技能', '用 UI-Evaluator'] : ['Without the skill', 'With UI-Evaluator'];
  const rowLabels = zh ? ['硬性 AI 痕迹', 'WCAG 判据未通过', '工艺判据未通过', '页面与回复检查'] : ['Hard AI tells', 'WCAG criteria failed', 'Craft criteria failed', 'Checks on the page and reply'];
  const col = (label, config) => {
    const dir = runDir(p, config);
    const n = numbers(dir);
    const vals = [n.hard, n.g2, n.g3, `${n.checks.passed} / ${n.checks.total}`];
    const rows = rowLabels.map((l, i) => `<div class="mrow"><span>${l}</span><span class="mono v${i < 3 && vals[i] ? ' bad' : ''}">${vals[i]}</span></div>`).join('');
    return `<div class="col"><h3>${label}</h3><div class="shot" style="width:${width}px;height:${cropH}px"><img src="${fileUrl(path.join(dir, `screen-${p.width}.png`))}" style="width:${width}px"></div><div class="mtab">${rows}</div></div>`;
  };
  const foot = zh
    ? '数字来自基准测试的评分脚本：uie 对交付文件的审计，以及对页面和回复的检查。综合四轮结果，不用技能的页面更常被判为更美，详见实测结果。'
    : 'Numbers from the benchmark grader: the uie audit of the shipped files, and its checks on the page and the reply. Across all rounds the unaided page was more often judged the more beautiful one; see the measured results.';
  return page(zh, `
#frame { padding:30px 36px 26px; }
h2 { font-size:21px; font-weight:600; }
.sub { font-size:12px; color:var(--ink2); margin:4px 0 18px; }
.cols { display:flex; justify-content:center; gap:28px; }
h3 { font-size:15px; font-weight:600; margin-bottom:8px; }
.shot { overflow:hidden; border:1px solid var(--ink); background:#fff; }
.shot img { display:block; }
.mtab { margin-top:10px; border-top:1.5px solid var(--ink); }
.mrow { display:flex; justify-content:space-between; gap:12px; font-size:13px; padding:5px 0; border-bottom:1px solid var(--rule); }
.v { font-size:13px; white-space:nowrap; }
.v.bad { color:var(--red); font-weight:600; }
.verdict { margin-top:16px; font-size:13px; line-height:1.5; }
.foot { margin-top:6px; font-size:12px; line-height:1.5; color:var(--ink2); }
`, `<h2>${zh ? '同一个需求，同一个模型' : 'Same request, same model'}</h2><div class="sub mono">${sub}</div>
<div class="cols">${col(labels[0], 'without_skill')}${col(labels[1], 'with_skill')}</div>
<p class="verdict">${verdict}</p><p class="foot">${foot}</p>`);
}

// ---------------------------------------------------------------- what the audit sees
const WORDS = { en: { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' }, zh: { 2: '两', 3: '三', 4: '四', 5: '五', 6: '六' } };

function audit(lang) {
  const zh = lang === 'zh';
  const hits = readJson(path.join(SRC, 'audit-cafe-hits.json'));
  const shot = path.join(SRC, 'audit-cafe-1280.png');
  const site = fs.readFileSync(path.join(SRC, 'cafe-baseline-site/index.html'), 'utf8');
  const [scale, height] = [0.4375, 1640];
  // The first hit of each rule with a box inside the shown region.
  const pick = (id) => {
    const h = hits.find((x) => x.id === id && !x.advisory && x.bbox && x.bbox[1] < height);
    if (!h) throw new Error(`no ${id} hit with a box in the shown region of ${path.relative(ROOT, SRC)}/audit-cafe-hits.json`);
    return h;
  };
  const picks = ['SLP-05', 'SLP-25', 'TYP-03', 'SLP-06', 'SLP-13'].map(pick);
  for (const id of ['SLP-07', 'SHP-02']) if (!hits.some((x) => x.id === id && !x.advisory)) throw new Error(`the footnote names ${id}, which the capture did not report`);
  if (!site.includes('example.org')) throw new Error('the SLP-13 caption names an example.org address that the page does not contain');
  const lineHeight = (/Line height ([\d.]+)/.exec(picks[2].title) || [])[1];
  const cards = Number((/\((\d+) cards\)/.exec(picks[3].title) || [])[1]);
  if (!lineHeight || !WORDS.en[cards]) throw new Error('cannot read the TYP-03 line height or the SLP-06 card count from their titles');
  const desc = zh
    ? { 'SLP-05': ['硬性痕迹', '主标题上方的小标签'], 'SLP-25': ['软性痕迹', '标题中换一种强调色的半句'], 'TYP-03': ['工艺底线', `换行文字的行高只有 ${lineHeight}`], 'SLP-06': ['硬性痕迹', `图标卡片行：${WORDS.zh[cards]}张长得一样的卡片`], 'SLP-13': ['硬性痕迹', '占位身份：把 example.org 地址当成真的展示'] }
    : { 'SLP-05': ['hard tell', 'Eyebrow label above the hero headline'], 'SLP-25': ['soft tell', 'Accent-coloured run inside the headline'], 'TYP-03': ['craft floor', `Line height ${lineHeight} on text that wraps`], 'SLP-06': ['hard tell', `Icon-tile feature row: ${WORDS.en[cards]} look-alike cards`], 'SLP-13': ['hard tell', 'Placeholder identity: an example.org address shown as real'] };
  let boxes = '';
  let legend = '';
  picks.forEach((h, i) => {
    const [x, y, w, hh] = h.bbox;
    const pad = 4;
    const bh = hh * scale + 2 * pad;
    // The number sits outside the box, left of it: centred on a short box, near the top of a tall one.
    const btop = bh < 60 ? (bh - 20) / 2 : 4;
    boxes += `<div class="bx" style="left:${x * scale - pad}px;top:${y * scale - pad}px;width:${w * scale + 2 * pad}px;height:${bh}px"><b style="top:${btop - 2}px">${i + 1}</b></div>`;
    const [kind, text] = desc[h.id];
    legend += `<li><b class="num">${i + 1}</b><div><div class="rid mono">${h.id} · ${kind}</div><div class="txt">${text}</div></div></li>`;
  });
  const graded = numbers(runDir(PAIRS.cafe, 'without_skill'));
  const foot = zh
    ? `同一页面上，审计还报告了卡片套卡片（SLP-07）、空心卡片（SHP-02）等问题，以及 ${graded.g2} 条 WCAG 判据和 ${graded.g3} 条工艺判据未通过。`
    : `On the same page the audit also reported cards nested in cards (SLP-07), a ghost card (SHP-02), ${graded.g2} failed WCAG criteria and ${graded.g3} failed craft criteria.`;
  return page(zh, `
#frame { padding:30px 36px 28px; }
h2 { font-size:21px; font-weight:600; }
.sub { font-size:12px; color:var(--ink2); margin:4px 0 16px; }
.wrap { display:flex; gap:26px; align-items:flex-start; }
.page { position:relative; width:${1280 * scale}px; height:${height * scale}px; overflow:hidden; border:1px solid var(--ink); background:#fff; flex:none; }
.page img { width:${1280 * scale}px; display:block; }
.bx { position:absolute; border:2px solid var(--red); }
.bx b { position:absolute; left:-25px; width:20px; height:20px; border-radius:50%; background:var(--red); color:#fff; font-size:11px; display:flex; align-items:center; justify-content:center; font-family:"Avenir Next",sans-serif; }
ol { list-style:none; flex:1; border-top:1.5px solid var(--ink); }
li { display:flex; gap:10px; padding:10px 0; border-bottom:1px solid var(--rule); }
.num { flex:none; width:20px; height:20px; border-radius:50%; background:var(--red); color:#fff; font-size:11px; display:flex; align-items:center; justify-content:center; }
.rid { font-size:11.5px; color:var(--ink2); }
.txt { font-size:14px; line-height:1.35; margin-top:2px; }
.foot { margin-top:14px; font-size:12px; line-height:1.5; color:var(--ink2); }
`, `<h2>${zh ? '审计看到了什么' : 'What the audit sees'}</h2><div class="sub mono">${zh ? '不用技能时 Claude 做的修车咖啡馆页面 · 框为检测器给出的位置' : 'The repair café page Claude built without the skill · boxes are the detectors’ own'}</div>
<div class="wrap"><div class="page"><img src="${fileUrl(shot)}">${boxes}</div><ol>${legend}</ol></div>
<p class="foot">${foot}</p>`);
}

// ---------------------------------------------------------------- workflow
function workflow(lang) {
  const zh = lang === 'zh';
  const steps = [
    ['setup', '准备', 'Users, jobs, journeys and facts in PRODUCT.md', '用户、任务、关键旅程和事实写进 PRODUCT.md', false],
    ['direct', '定方向', 'Three seeded directions, one locked in DESIGN.md', '抽出三个方向，选定一个锁进 DESIGN.md', false],
    ['build', '构建', 'Tokens first, every state, then a finish pass', '先令牌，状态做全，最后做完成度检查', false],
    ['audit', '审计', 'Browser checks, then isolated critics and a verifier', '浏览器检查、隔离评审、验证者复核', true],
    ['fix', '修复', 'One fix at a time, re-tested and committed', '一次修一个，复测后提交', false],
    ['verify', '验证', 'A fresh reviewer, gates recomputed', '换一位复核者确认，重算门禁', true],
    ['report', '报告', 'Claims no stronger than the evidence', '措辞不超过证据', false],
  ];
  const W = 808;
  const n = steps.length;
  const cw = W / n;
  const cx = (i) => cw * i + cw / 2;
  const R1 = zh ? 106 : 118;
  const R2 = R1 + 78;
  const name = (en, zhName) => (zh ? `<b>${zhName}</b> <span class="mono">${en}</span>` : `<span class="mono b">${en}</span>`);
  let cols = '';
  steps.forEach(([en, zhName, de, dz, red], i) => {
    cols += `<div class="st${red ? ' red' : ''}" style="left:${cx(i) - cw / 2 + 4}px;width:${cw - 8}px"><div class="nm">${name(en, zhName)}</div><div class="ds">${zh ? dz : de}</div></div>`;
    cols += `<i class="node${red ? ' red' : ''}" style="left:${cx(i) - 6}px;top:${R1 - 6}px"></i>`;
  });
  const arrows = steps.slice(1).map((_, i) => `<svg class="ar" style="left:${cw * (i + 1) - 4}px;top:${R1 - 5}px" width="8" height="10" viewBox="0 0 8 10"><path d="M1 1 L7 5 L1 9" fill="none" stroke="#191714" stroke-width="1.5"/></svg>`).join('');
  // The loop through real people: audit → study → ingest → fix.
  const [a, f] = [cx(3), cx(4)];
  let loop = `<svg class="loop" width="${W}" height="${R2 + 10}" viewBox="0 0 ${W} ${R2 + 10}"><path d="M${a} ${R1 + 8} V${R2} H${f} V${R1 + 12}" fill="none" stroke="#59544B" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M${f - 5} ${R1 + 18} L${f} ${R1 + 11} L${f + 5} ${R1 + 18}" fill="none" stroke="#59544B" stroke-width="1.5"/></svg>`;
  loop += `<i class="node open" style="left:${a - 6}px;top:${R2 - 6}px"></i><i class="node open" style="left:${f - 6}px;top:${R2 - 6}px"></i>`;
  const second = [['study', '研究', 'A test with real people', '设计一轮真人测试'], ['ingest', '导入', 'Their notes and answers become findings', '记录和回答变成问题记录']];
  second.forEach(([en, zhName, de, dz], i) => {
    const x = [a, f][i];
    loop += `<div class="st2" style="left:${x - cw / 2 + 4}px;width:${cw - 8}px;top:${R2 + 12}px"><div class="nm">${name(en, zhName)}</div><div class="ds">${zh ? dz : de}</div></div>`;
  });
  const legend = zh
    ? '红色的步骤由没有参与构建的评估者完成：评审看不到构建者的思路，复核者不是修复者。'
    : 'Red steps are done by evaluators who did not build the page: critics never see the builder’s reasoning, and the reviewer is not the fixer.';
  return page(zh, `
#frame { padding:30px 36px 26px; }
h2 { font-size:21px; font-weight:600; }
.sub { font-size:12px; color:var(--ink2); margin:4px 0 14px; }
.strip { position:relative; width:${W}px; height:${R2 + (zh ? 72 : 92)}px; }
.strip::before { content:""; position:absolute; left:${cx(0)}px; width:${cx(n - 1) - cx(0)}px; top:${R1 - 0.75}px; height:1.5px; background:var(--ink); }
.st, .st2 { position:absolute; text-align:center; }
.st { top:0; }
.nm { font-size:13.5px; margin-bottom:4px; }
.nm .mono { font-size:12.5px; }
.zh .nm .mono { font-size:11px; color:var(--ink2); }
.b { font-weight:700; }
.ds { font-size:12px; line-height:1.35; color:var(--ink2); }
.st.red .nm, .st.red .nm .mono { color:var(--red); }
.node { position:absolute; width:12px; height:12px; border-radius:50%; background:var(--ink); }
.node.red { background:var(--red); }
.node.open { background:var(--paper); border:1.5px solid var(--ink2); }
.ar { position:absolute; }
.loop { position:absolute; left:0; top:0; }
.legend { margin-top:4px; font-size:12px; line-height:1.5; color:var(--ink2); border-top:1px solid var(--rule); padding-top:10px; }
`, `<h2>${zh ? '从需求到报告' : 'From brief to report'}</h2><div class="sub mono">${zh ? '七个工作流 · 虚线为真实用户环节 · 红色为独立核查' : 'seven workflows · dashed: real people · red: an independent check'}</div>
<div class="strip">${loop}${cols}${arrows}</div>
<p class="legend">${legend}</p>`);
}

// ---------------------------------------------------------------- render
checkCaptions();
const pages = { 'social-preview': () => banner('en', true) };
for (const lang of ['en', 'zh']) {
  pages[`banner-${lang}`] = () => banner(lang);
  pages[`before-after-cafe-${lang}`] = () => pair(lang, 'cafe');
  pages[`before-after-calligraphy-${lang}`] = () => pair(lang, 'calligraphy');
  pages[`audit-annotated-${lang}`] = () => audit(lang);
  pages[`workflow-${lang}`] = () => workflow(lang);
}
const htmlDir = typeof opts.html === 'string' ? path.resolve(opts.html) : fs.mkdtempSync(path.join(os.tmpdir(), 'uie-readme-media-'));
fs.mkdirSync(htmlDir, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const { loadBrowserDeps } = await import(pathToFileURL(path.join(SKILL_DIR, 'scripts/lib/deps.mjs')).href);
const deps = await loadBrowserDeps({});
const browser = await deps.playwright.chromium.launch();
try {
  for (const [name, make] of Object.entries(pages).sort()) {
    if (only && !name.includes(only)) continue;
    const html = path.join(htmlDir, `${name}.html`);
    fs.writeFileSync(html, make());
    // GitHub's social preview is 1280 × 640: the 880 × 440 frame at 16/11. Everything else at twice the density.
    const tab = await browser.newPage({ viewport: { width: 940, height: 900 }, deviceScaleFactor: name === 'social-preview' ? 16 / 11 : 2 });
    await tab.goto(pathToFileURL(html).href, { waitUntil: 'load' });
    await tab.evaluate(() => document.fonts.ready);
    await tab.waitForTimeout(150);
    const out = path.join(OUT, `${name}.png`);
    await tab.locator('#frame').screenshot({ path: out });
    await tab.close();
    console.log(`${path.relative(ROOT, out)}  ${Math.round(fs.statSync(out).size / 1024)} KB`);
  }
} finally {
  await browser.close();
  if (typeof opts.html !== 'string') fs.rmSync(htmlDir, { recursive: true, force: true });
}
