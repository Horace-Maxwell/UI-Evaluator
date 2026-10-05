// Minimal Markdown helpers: sections by heading, pipe tables, HTML-comment stripping.

export function stripComments(md) {
  return String(md || '').replace(/<!--[\s\S]*?-->/g, '');
}

/** Split into sections by heading level (default 2). Returns [{ title, level, line, content }]. */
export function sections(md, level = 2) {
  const lines = String(md || '').split(/\r?\n/);
  const out = [];
  let cur = null;
  let inFence = false;
  const re = new RegExp(`^#{${level}}\\s+(.+?)\\s*#*\\s*$`);
  lines.forEach((l, i) => {
    if (/^```/.test(l.trim())) inFence = !inFence;
    const m = !inFence && l.match(re);
    if (m && !l.startsWith('#'.repeat(level + 1))) {
      if (cur) out.push(cur);
      cur = { title: m[1].trim(), level, line: i + 1, content: '' };
    } else if (cur) cur.content += `${l}\n`;
  });
  if (cur) out.push(cur);
  return out;
}

export function headings(md) {
  const out = [];
  let inFence = false;
  String(md || '')
    .split(/\r?\n/)
    .forEach((l, i) => {
      if (/^```/.test(l.trim())) inFence = !inFence;
      const m = !inFence && l.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (m) out.push({ level: m[1].length, title: m[2].trim(), line: i + 1 });
    });
  return out;
}

function splitRow(line) {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cur = '';
  let code = false;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch === '`') code = !code;
    if (ch === '\\' && inner[i + 1] === '|') {
      cur += '|';
      i += 1;
      continue;
    }
    if (ch === '|' && !code) {
      cells.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

/** Parse every pipe table in the text. Returns [{ header: string[], rows: string[][] }]. */
export function tables(md) {
  const lines = String(md || '').split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].trim().startsWith('|') || !lines[i + 1] || !/^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) continue;
    const header = splitRow(lines[i]);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && lines[j].trim().startsWith('|')) {
      rows.push(splitRow(lines[j]));
      j += 1;
    }
    out.push({ header, rows, line: i + 1 });
    i = j - 1;
  }
  return out;
}

/** Rows of the first table as objects keyed by lower-cased header. */
export function tableObjects(md) {
  const t = tables(md)[0];
  if (!t) return [];
  const keys = t.header.map((h) => h.toLowerCase());
  return t.rows.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ''])));
}

/** Template placeholders left in text (after removing comments), e.g. "[Product name]" or "[one line: …]". */
export function placeholders(md) {
  const t = stripComments(md);
  const found = t.match(/\[([^\]\n]{2,160})\](?!\()/g) || [];
  return found.filter((x) => {
    const inner = x.slice(1, -1).trim();
    if (/^(confirmed|inferred|unverified|calibrating|heuristic|proposal|x|\s)\b/i.test(inner)) return false;
    if (/^[A-Z0-9]+(-[A-Z0-9]+)*-\d+[a-z]?(,\s*[A-Z0-9]+(-[A-Z0-9]+)*-\d+[a-z]?)*$/.test(inner)) return false; // rule or research IDs
    if (/^\d+(\.\d+)*$/.test(inner)) return false; // footnote numbers
    return true;
  });
}
