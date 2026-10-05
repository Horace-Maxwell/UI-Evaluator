// Precision: idiomatic, well-built projects produce zero gate-level hits, and each known false-positive trap stays
// quiet. tests/fixtures/lint/good/ holds one realistic project per stack (Tailwind + shadcn-style React with a
// tailwind.config and CSS variables, a Vue SFC, a Svelte component, a plain CSS token file with a reduced-motion
// block, a Next.js app/globals.css, a zh-CN page, an MDX doc page, styled-components, and a trade landing page).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { FIXTURES, lintDir, lintSources, rows } from './helpers.mjs';

const GOOD = path.join(FIXTURES, 'good');
const projects = fs.readdirSync(GOOD, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();

test('the good fixture set covers the stacks the brief names', () => {
  for (const p of ['shadcn-app', 'vue-shop', 'svelte-kit', 'tokens-css', 'next-globals', 'zh-cn-site', 'mdx-docs', 'styled-components', 'gutters']) {
    assert.ok(projects.includes(p), `missing good fixture ${p}`);
  }
});

for (const name of projects) {
  test(`good/${name}: zero gate-level and soft hits`, async () => {
    const res = await lintDir(path.join(GOOD, name));
    assert.ok(res.files > 0, 'scanned some files');
    assert.deepEqual(res.errors, [], 'no parse or rule errors');
    const loud = rows(res).filter((r) => (r.level === 'gate' || r.level === 'soft') && !r.requested).map((r) => `${r.id} ${r.file}:${r.line} ${r.message}`);
    assert.deepEqual(loud, []);
    for (const id of ['COL-01', 'LAY-01']) if (res.metrics[id]) assert.ok(res.metrics[id].share >= 0.9, `${id} share ${res.metrics[id].share}`);
  });
}

test('test, story, mock, build, vendored and minified files are skipped (whole project and explicit folder)', async () => {
  const dir = path.join(GOOD, 'shadcn-app');
  for (const paths of [[], [path.join(dir, 'src')], [dir]]) {
    const res = await lintDir(dir, { paths });
    const scanned = res.found.files.map((f) => f.rel);
    assert.ok(!scanned.some((f) => /__tests__|\.test\.|\.stories\.|public\/vendor|dist\//.test(f)), `scanned: ${scanned.join(', ')}`);
    assert.ok(scanned.some((f) => f.endsWith('src/app/page.tsx')));
  }
  const res = await lintDir(dir);
  assert.ok(res.found.skipped.some((s) => s.path.endsWith('button.stories.tsx') && /story/.test(s.reason)));
  // A minified or vendored file that a folder scan reaches by name is recognised by its content.
  const mixed = await lintSources({
    'lib/chart.js': `${'!function(e){var t={color:"#6366f1",transition:"all .3s"};e.Chart=t}(window);'.repeat(40)}\n`,
    'lib/carousel.css': '/*!\n * Slidey v2.4.1\n * Licensed under MIT\n */\n.slidey { transition: all 0.4s; }\n',
    'src/app.css': '.card { transition: opacity 150ms; }\n',
  });
  assert.deepEqual(mixed.found.files.map((f) => f.rel), ['src/app.css']);
  assert.ok(mixed.found.skipped.some((s) => s.path === 'lib/chart.js' && /minified/.test(s.reason)));
  assert.ok(mixed.found.skipped.some((s) => s.path === 'lib/carousel.css' && /vendored/.test(s.reason)));
});

// Each trap below once produced, or plausibly could produce, a gate-level false positive.
const TRAPS = {
  'CSS custom properties are definitions, not raw literals': {
    'src/card.css': '.card {\n  --card-bg: #ffffff;\n  --card-gap: 13px;\n  background: var(--card-bg);\n  gap: var(--card-gap);\n}\n',
  },
  'transition: all inside a prefers-reduced-motion block switches motion off': {
    'src/reset.css': '@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after { transition: all 0.01ms !important; animation: none !important; }\n}\n',
  },
  'outline: none paired with a :focus-visible replacement': {
    'src/focus.css': '.btn:focus { outline: none; }\n.btn:focus-visible { outline: 2px solid var(--ring); }\n',
    'src/Btn.tsx': 'export const Btn = () => <button className="outline-none focus-visible:ring-2 focus-visible:ring-ring">Save draft</button>;\n',
  },
  'literal and domain uses of copy-list words (seamless gutters, keyboard focus, a robust enamel coat)': {
    'index.html': '<!doctype html><html lang="en"><body><h1>Seamless gutters for County Down</h1><p>A robust coat of enamel resists salt air. Keyboard focus moves to the first error.</p></body></html>\n',
  },
  'ordinary prose that happens to start sentences with No or Just': {
    'index.html': '<!doctype html><html lang="en"><body><p>Most houses take one day. No scaffolding is needed for bungalows. Bigger houses with a conservatory take two days. No deposit is taken before the survey. You pay on completion. Just call the office if the date no longer suits you.</p></body></html>\n',
  },
  'numbers in data tables and version requirements are not usage claims': {
    'src/Plans.tsx': 'export function Plans() {\n  return (\n    <table>\n      <tbody>\n        <tr><td>Team</td><td>50+</td><td>10,000+ builds</td></tr>\n      </tbody>\n    </table>\n  );\n}\nexport const Req = () => <p>Requires Node 18+ and iOS 16+.</p>;\n',
  },
  'colour literals in SVG artwork and the Tailwind config': {
    'src/Logo.tsx': 'export const Logo = () => (\n  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M0 0h24v24H0z" /><stop stopColor="#6366f1" /></svg>\n);\n',
    'tailwind.config.js': "module.exports = { theme: { extend: { colors: { brand: { 500: '#0f766e' }, ink: '#132026' } } } };\n",
  },
  'a TSX generic arrow function is not JSX and its body is not copy': {
    'src/list.tsx': "// TODO: virtualise\nexport const pick = <T extends { id: string }>(items: T[], id: string) => items.find((i) => i.id === id); // Lorem ipsum in a comment\nexport const first = <T,>(xs: T[]) => xs[0];\n",
  },
  'example addresses in input placeholders and labelled demo data': {
    'src/Invite.tsx': "const demoUsers = [{ name: 'Jane Doe' }];\nexport const Invite = () => <input type=\"email\" aria-label=\"Email\" placeholder=\"you@example.com\" />;\nexport const seed = demoUsers;\n",
  },
  'a language picker naming 中文 does not put CJK fonts in scope': {
    'index.html': '<!doctype html><html lang="en"><head><style>body { font-family: system-ui, sans-serif; }</style></head><body><a href="/zh" lang="zh-CN">中文</a></body></html>\n',
  },
  'Chinese text: 张三 inside 主张三段式, single dashes as connectors (正—反—合), prose about a 占位符': {
    'index.html': '<!doctype html><html lang="zh-CN"><head><style>body { font-family: "Noto Serif SC", "Songti SC", serif; }</style></head><body><p>他从未主张三段式能自行演绎出内容；把"函数—论元"与"主—谓"对照，"正—反—合"的结构被放大，"同一机能"——康德在此几乎是直接宣告——而非证明。</p><p>在此只是一个占位符，卷六才填入内容（明智）。比如张三借了李四的书。</p></body></html>\n',
  },
  'a scholarly quotation in an article is a citation, not a testimonial': {
    'essay.html': '<!doctype html><html lang="en"><body><article><h1>On sensibility</h1><blockquote><p>Die Leibniz-Wolfische Philosophie hat daher allen Untersuchungen einen ganz unrechten Gesichtspunkt angewiesen.</p><footer>— Immanuel Kant, Critique of Pure Reason</footer></blockquote><p>Kant rejects the view that sensibility is confused thought.</p></article></body></html>\n',
  },
  'page links that mention a restricted font name are not font loads': {
    'index.html': '<!doctype html><html lang="en"><head><link rel="canonical" href="https://example.org/offices/new-york"></head><body></body></html>\n',
  },
};

for (const [name, files] of Object.entries(TRAPS)) {
  test(`trap: ${name}`, async () => {
    const res = await lintSources(files);
    const loud = rows(res).filter((r) => r.level === 'gate').map((r) => `${r.id} ${r.file}:${r.line} ${r.message}`);
    assert.deepEqual(loud, []);
  });
}

test('trap: SLP-12 stays quiet when PRODUCT.md Facts list the claim, and fires without them', async () => {
  const page = {
    'index.html': '<!doctype html><html lang="en"><body><p>Over 1,200 homes fitted since 2009.</p><p>Rated 4.9 out of 5 from 312 Google reviews.</p><blockquote><p>They measured on Monday and the gutters were up by Wednesday.</p><footer>— Siobhan Kearney, Holywood</footer></blockquote></body></html>\n',
  };
  const facts = `# Product\n\n## Facts\n\n| Claim | Allowed wording | Source | Label |\n|---|---|---|---|\n| Homes fitted | "Over 1,200 homes fitted since 2009" | Job book | [confirmed: owner, 2026-09-01] |\n| Rating | "4.9 out of 5 from 312 Google reviews" | Google profile | [confirmed: owner, 2026-09-10] |\n| Testimonial | Siobhan Kearney, Holywood: "They measured on Monday and the gutters were up by Wednesday." | Signed release | [confirmed: owner, 2026-08-20] |\n`;
  const backed = await lintSources({ ...page, 'PRODUCT.md': facts });
  assert.deepEqual(rows(backed).filter((r) => r.id === 'SLP-12').map((r) => r.message), []);
  const unbacked = await lintSources(page);
  assert.deepEqual(rows(unbacked).filter((r) => r.id === 'SLP-12').map((r) => r.line), [1, 1, 1]);
});
