// DOM → source mapping (TOOL-31; ARCHITECTURE §9.4). The in-page part is window.__uie.sourceOf(el)
// (data-insp-path → __svelte_meta.loc → Vue inspector → React debug source or owner stack); this module
// normalises those raw values and adds the last resort, a text search of the project's UI source files.
import fs from 'node:fs';
import path from 'node:path';
import { walkFiles, relPath } from '../util/fs.mjs';

const UI_EXTS = new Set(['.html', '.htm', '.jsx', '.tsx', '.js', '.ts', '.vue', '.svelte', '.astro', '.mdx', '.md', '.css', '.scss']);

/** "src/App.tsx:12:5:div" → {file, line, col}. Paths may contain ":" (Windows drives), so parse from the right. */
export function parseLocString(raw) {
  const parts = String(raw || '').split(':');
  if (parts.length < 2) return { file: raw || null, line: null, col: null };
  const nums = [];
  while (parts.length > 1 && nums.length < 2) {
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) nums.unshift(Number(parts.pop()));
    else if (nums.length === 0 && /^[a-z][\w-]*$/i.test(last)) parts.pop(); // trailing tag name
    else break;
  }
  return { file: parts.join(':'), line: nums[0] ?? null, col: nums[1] ?? null };
}

function relativise(file, root) {
  if (!file) return file;
  let f = String(file).replace(/^file:\/\//, '');
  if (/^https?:\/\//.test(f)) {
    try {
      const u = new URL(f);
      f = decodeURIComponent(u.pathname).replace(/^\/@fs\//, '/').replace(/^\//, '');
    } catch {
      /* keep */
    }
  }
  f = f.replace(/[?#].*$/, '');
  if (root && path.isAbsolute(f)) {
    const r = path.relative(root, f);
    if (!r.startsWith('..')) return r.split(path.sep).join('/');
  }
  return f.split(path.sep).join('/');
}

/** Normalise a raw in-page source record to {file, line, col, method, confidence}. */
export function normaliseSource(raw, root) {
  if (!raw) return null;
  let rec;
  if (raw.raw) rec = { ...parseLocString(raw.raw), method: raw.method, confidence: raw.confidence };
  else if (raw.url) rec = { file: raw.url, line: raw.line ?? null, col: raw.col ?? null, method: raw.method, confidence: raw.confidence };
  else rec = { file: raw.file, line: raw.line ?? null, col: raw.col ?? null, method: raw.method, confidence: raw.confidence };
  rec.file = relativise(rec.file, root);
  if (!rec.file) return null;
  if (!Number.isInteger(rec.line)) rec.line = null;
  if (!Number.isInteger(rec.col)) rec.col = null;
  return rec;
}

/**
 * Text-search fallback: find a distinctive token from the element in the project's UI source files.
 * Results are marked method "text-search", confidence "low" (inferred).
 */
export class SourceSearcher {
  constructor(root, { maxFiles = 3000, maxBytes = 1_500_000 } = {}) {
    this.root = root;
    this.files = null;
    this.maxFiles = maxFiles;
    this.maxBytes = maxBytes;
    this.cache = new Map();
  }

  load() {
    if (this.files) return this.files;
    this.files = [];
    if (!this.root) return this.files;
    for (const f of walkFiles(this.root, { exts: UI_EXTS, max: this.maxFiles })) {
      try {
        const st = fs.statSync(f);
        if (st.size > this.maxBytes) continue;
        this.files.push({ file: f, text: fs.readFileSync(f, 'utf8') });
      } catch {
        /* unreadable file */
      }
    }
    return this.files;
  }

  /** Tokens worth searching for, from a snippet: id, data-testid, distinctive classes, then visible text. */
  static tokens(snippet) {
    const s = String(snippet || '');
    const out = [];
    const id = s.match(/\sid="([^"]{3,})"/);
    if (id) out.push(`id="${id[1]}"`, id[1]);
    const tid = s.match(/data-testid="([^"]+)"/);
    if (tid) out.push(tid[1]);
    const cls = s.match(/class="([^"]+)"/);
    if (cls) {
      for (const c of cls[1].split(/\s+/)) if (c.length >= 6 && !/^(flex|grid|block|hidden|text-|bg-|p-|m-|w-|h-)/.test(c)) out.push(c);
    }
    const text = s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length >= 12) out.push(text.slice(0, 40));
    return out;
  }

  find(snippet) {
    const toks = SourceSearcher.tokens(snippet);
    if (!toks.length) return null;
    const key = toks.join('|');
    if (this.cache.has(key)) return this.cache.get(key);
    let res = null;
    for (const tok of toks) {
      const hits = [];
      for (const f of this.load()) {
        const i = f.text.indexOf(tok);
        if (i >= 0) hits.push({ f, i });
        if (hits.length > 3) break;
      }
      if (hits.length >= 1 && hits.length <= 3) {
        const { f, i } = hits[0];
        const line = f.text.slice(0, i).split('\n').length;
        res = { file: relPath(this.root, f.file), line, col: null, method: 'text-search', confidence: 'low', token: tok.slice(0, 60) };
        break;
      }
    }
    this.cache.set(key, res);
    return res;
  }
}
