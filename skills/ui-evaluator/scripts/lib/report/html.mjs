// Markdown (the subset `uie report` generates) → a self-contained, accessible HTML page.
// The page is a Read surface held to the framework's own floor: semantic structure, AA contrast in both themes,
// a reading measure, visible focus, no decoration without a job, an explicit CJK font fallback.

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(text) {
  let t = escHtml(text);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${href}">${label}</a>`);
  return t;
}

function splitRow(line) {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const out = [];
  let cur = '';
  for (let i = 0; i < inner.length; i += 1) {
    if (inner[i] === '\\' && inner[i + 1] === '|') {
      cur += '|';
      i += 1;
    } else if (inner[i] === '|') {
      out.push(cur.trim());
      cur = '';
    } else cur += inner[i];
  }
  out.push(cur.trim());
  return out;
}

const slugify = (s) => s.toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-|-$/g, '');

export function markdownToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  let list = null;
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) {
      closeList();
      i += 1;
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      closeList();
      const level = h[1].length;
      out.push(`<h${level} id="${slugify(h[2])}">${inline(h[2])}</h${level}>`);
      i += 1;
      continue;
    }
    if (/^DEGRADED:/.test(l)) {
      closeList();
      out.push(`<p class="banner" role="note"><strong>DEGRADED</strong>${inline(l.replace(/^DEGRADED:/, ':'))}</p>`);
      i += 1;
      continue;
    }
    if (l.trim().startsWith('|') && lines[i + 1] && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      closeList();
      const header = splitRow(l);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      // A heuristic-evaluation entry (the lecture's report table): tint the severity and ease-of-fixing cells by their
      // number, as the lecture's example does; the number and its word stay in the cell, so colour is never the only cue.
      const sevCol = header.findIndex((c) => /^severity/i.test(c.trim()));
      const easeCol = header.findIndex((c) => /^ease of fixing/i.test(c.trim()));
      const he = sevCol >= 0 && easeCol >= 0;
      const tint = (c, col) => {
        const n = Number.parseFloat(c);
        if (!Number.isFinite(n)) return '';
        if (col === sevCol) return ` class="sev sev-${Math.max(0, Math.min(4, Math.round(n)))}"`;
        if (col === easeCol) return ` class="ease ease-${Math.max(1, Math.min(4, Math.round(n)))}"`;
        return '';
      };
      out.push(`<div class="table-wrap" tabindex="0" role="region" aria-label="table"><table${he ? ' class="he"' : ''}>`);
      out.push(`<thead><tr>${header.map((c) => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead>`);
      const cell = (c) => (/^(pass|fail|not_run|not_applicable|degraded|waived)$/.test(c.trim()) ? `<span class="state state-${c.trim()}">${c.trim()}</span>` : inline(c));
      out.push(`<tbody>${rows.map((r) => `<tr>${r.map((c, col) => `<td${he ? tint(c, col) : ''}>${cell(c)}</td>`).join('')}</tr>`).join('')}</tbody>`);
      out.push('</table></div>');
      continue;
    }
    const ul = l.match(/^\s*[-*]\s+(.*)$/);
    const ol = l.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      const kind = ul ? 'ul' : 'ol';
      if (list !== kind) {
        closeList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inline((ul || ol)[1])}</li>`);
      i += 1;
      continue;
    }
    closeList();
    const para = [l.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*[-*]\s|\s*\d+\.\s|\s*\|)/.test(lines[i])) {
      para.push(lines[i].trim());
      i += 1;
    }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  closeList();
  return out.join('\n');
}

const CSS = `
:root {
  color-scheme: light dark;
  --ink: #1b1d21; --ink-2: #4a4f57; --rule: #d5d8dd; --surface: #ffffff; --surface-2: #f3f4f6;
  --link: #1d4f91; --focus: #1d4f91; --pass: #1f6b3a; --fail: #a32020; --warn: #7a5200;
  --he-head: #dfe6f5; --sev-0: #eceef1; --sev-1: #f8efc2; --sev-2: #fbd49a; --sev-3: #f6b083; --sev-4: #f19a95;
  --ease-1: #cfeccf; --ease-2: #e4efc2; --ease-3: #f8e1b2; --ease-4: #f4c3b8;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px; --space-6: 32px; --space-7: 48px;
}
@media (prefers-color-scheme: dark) {
  :root { --ink: #e8eaed; --ink-2: #b7bcc4; --rule: #3a3f46; --surface: #16181b; --surface-2: #202328;
    --link: #8db8f2; --focus: #8db8f2; --pass: #7ccf98; --fail: #ff9a9a; --warn: #f0c060;
    --he-head: #24304a; --sev-0: #2a2d33; --sev-1: #46401f; --sev-2: #573c15; --sev-3: #642f17; --sev-4: #6a2323;
    --ease-1: #1f4a2b; --ease-2: #39461d; --ease-3: #54421b; --ease-4: #5b2c24; }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--surface); color: var(--ink);
  font: 400 1rem/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  font-variant-numeric: tabular-nums; }
main { max-width: 72rem; margin: 0 auto; padding: var(--space-6) var(--space-4) var(--space-7); }
p, li { max-width: 72ch; }
h1 { font-size: 1.953rem; line-height: 1.2; font-weight: 600; margin: 0 0 var(--space-4); }
h2 { font-size: 1.563rem; line-height: 1.25; font-weight: 600; margin: var(--space-7) 0 var(--space-3); padding-top: var(--space-4); border-top: 1px solid var(--rule); }
h3 { font-size: 1.25rem; line-height: 1.3; font-weight: 600; margin: var(--space-6) 0 var(--space-2); }
h4 { font-size: 1rem; line-height: 1.4; font-weight: 600; margin: var(--space-5) 0 var(--space-2); }
p { margin: 0 0 var(--space-3); }
ul, ol { margin: 0 0 var(--space-4); padding-left: var(--space-5); }
li { margin-bottom: var(--space-1); }
a { color: var(--link); text-underline-offset: 0.15em; }
a:focus-visible, .table-wrap:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 2px; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.9em; background: var(--surface-2); padding: 0 var(--space-1); border-radius: 3px; }
.table-wrap { overflow-x: auto; margin: 0 0 var(--space-5); }
table { border-collapse: collapse; width: 100%; font-size: 0.9375rem; line-height: 1.45; }
th, td { text-align: left; vertical-align: top; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--rule); }
th { font-weight: 600; background: var(--surface-2); }
table.he th { background: var(--he-head); }
td.sev, td.ease { font-weight: 600; }
td.sev { white-space: nowrap; }
td.sev-0 { background: var(--sev-0); } td.sev-1 { background: var(--sev-1); } td.sev-2 { background: var(--sev-2); }
td.sev-3 { background: var(--sev-3); } td.sev-4 { background: var(--sev-4); }
td.ease-1 { background: var(--ease-1); } td.ease-2 { background: var(--ease-2); } td.ease-3 { background: var(--ease-3); } td.ease-4 { background: var(--ease-4); }
.state { font-weight: 600; white-space: nowrap; }
.state-pass { color: var(--pass); }
.state-fail { color: var(--fail); }
.state-not_run, .state-degraded { color: var(--warn); }
.banner { border: 2px solid var(--warn); padding: var(--space-3) var(--space-4); border-radius: 4px; max-width: none; }
.meta { color: var(--ink-2); font-size: 0.875rem; }
@media (max-width: 600px) { main { padding: var(--space-5) var(--space-4) var(--space-6); } h1 { font-size: 1.563rem; } h2 { font-size: 1.25rem; } }
@media print { body { background: #fff; color: #000; } main { max-width: none; padding: 0; } a { color: #000; } .table-wrap { overflow: visible; } h2 { break-after: avoid; } tr { break-inside: avoid; } }
`;

export function renderHtml(md, { title, lang = 'en' } = {}) {
  const body = markdownToHtml(md);
  return `<!doctype html>
<html lang="${escHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(title || 'UI evaluation report')}</title>
<style>${CSS}</style>
</head>
<body>
<main>
${body}
<p class="meta">Generated by UI-Evaluator from the run's files. Every row traces to evidence in the run directory.</p>
</main>
</body>
</html>
`;
}
