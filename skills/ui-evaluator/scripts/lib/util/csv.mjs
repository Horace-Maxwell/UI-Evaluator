// RFC 4180 CSV: quoted fields with embedded commas, quotes and newlines; CRLF; BOM; comma, semicolon or tab.

/** Guess the delimiter from the first line outside quotes. */
export function sniffDelimiter(text) {
  const counts = { ',': 0, ';': 0, '\t': 0 };
  let inQ = false;
  for (const ch of text) {
    if (ch === '"') inQ = !inQ;
    else if (!inQ && ch === '\n') break;
    else if (!inQ && ch in counts) counts[ch] += 1;
  }
  const [best, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return n > 0 ? best : ',';
}

/** Parse CSV text into an array of rows (arrays of strings). Blank lines are dropped. */
export function parseCsv(text, { delimiter } = {}) {
  const src = String(text ?? '').replace(/^\uFEFF/, '');
  const d = delimiter || sniffDelimiter(src);
  const rows = [];
  let row = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQ = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === '') inQ = true;
    else if (ch === d) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

const isNum = (s) => s !== '' && s !== null && s !== undefined && Number.isFinite(Number(String(s).trim()));

/** True when the first row looks like a header: some cell is non-numeric text and no later row is all text. */
export function hasHeader(rows) {
  if (rows.length < 2) return rows.length === 1 && rows[0].some((c) => c.trim() && !isNum(c));
  const first = rows[0];
  const textCells = first.filter((c) => c.trim() && !isNum(c)).length;
  if (!textCells) return false;
  const secondNumeric = rows[1].filter((c) => isNum(c)).length;
  const firstNumeric = first.filter((c) => isNum(c)).length;
  return secondNumeric > firstNumeric || new Set(first.map((c) => c.trim().toLowerCase())).size === first.length;
}

/** Rows → objects keyed by the header row (lower-cased, spaces → underscores). */
export function toObjects(rows) {
  if (!rows.length) return { header: [], records: [] };
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const records = rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
  return { header, records };
}

export const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function stringifyCsv(rows) {
  return `${rows.map((r) => r.map(csvCell).join(',')).join('\n')}\n`;
}
