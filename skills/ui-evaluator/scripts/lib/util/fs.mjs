// Filesystem helpers: JSON / JSONL I/O with atomic writes, directory walking.
import fs from 'node:fs';
import path from 'node:path';

export function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

export function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function readText(p, fallback) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

/** Write a file atomically (write to a temp file, then rename). */
export function writeText(p, text) {
  ensureDir(path.dirname(p));
  const tmp = `${p}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, p);
  return p;
}

export function readJson(p, fallback) {
  let text;
  try {
    text = fs.readFileSync(p, 'utf8');
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    const e = new Error(`${p} is not valid JSON: ${err.message}`);
    e.userMessage = e.message;
    throw e;
  }
}

export function writeJson(p, data) {
  return writeText(p, `${JSON.stringify(data, null, 2)}\n`);
}

export function readJsonl(p) {
  const text = readText(p, '');
  const out = [];
  text.split('\n').forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    try {
      out.push(JSON.parse(t));
    } catch (err) {
      const e = new Error(`${p}:${i + 1} is not valid JSON: ${err.message}`);
      e.userMessage = e.message;
      throw e;
    }
  });
  return out;
}

export function writeJsonl(p, items) {
  return writeText(p, items.map((x) => JSON.stringify(x)).join('\n') + (items.length ? '\n' : ''));
}

export function appendJsonl(p, items) {
  ensureDir(path.dirname(p));
  const arr = Array.isArray(items) ? items : [items];
  if (!arr.length) return p;
  fs.appendFileSync(p, arr.map((x) => JSON.stringify(x)).join('\n') + '\n');
  return p;
}

export function appendText(p, text) {
  ensureDir(path.dirname(p));
  fs.appendFileSync(p, text);
  return p;
}

export function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return dest;
}

export function listDir(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

const DEFAULT_IGNORES = new Set([
  'node_modules', '.git', '.hg', '.svn', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit',
  '.output', '.vercel', '.turbo', '.cache', 'coverage', '.ui-evaluator', 'vendor', '.parcel-cache',
  'storybook-static', '.astro', '.expo', 'Pods', '.venv', 'venv', '__pycache__',
]);

const ALLOWED_DOT_DIRS = new Set(['.storybook']);

/**
 * Recursively list files under `root` whose extension is in `exts` (lowercase, with dot).
 * Skips common build and dependency folders. `max` bounds the number of files returned.
 */
export function walkFiles(root, { exts, ignore = DEFAULT_IGNORES, max = 20000 } = {}) {
  const out = [];
  const stack = [root];
  while (stack.length && out.length < max) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ignore.has(ent.name)) continue;
        if (ent.name.startsWith('.') && !ALLOWED_DOT_DIRS.has(ent.name)) continue;
        stack.push(full);
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (!exts || exts.has(ext)) out.push(full);
        if (out.length >= max) break;
      }
    }
  }
  return out.sort();
}

export function relPath(root, p) {
  const r = path.relative(root, p);
  return r.split(path.sep).join('/');
}
