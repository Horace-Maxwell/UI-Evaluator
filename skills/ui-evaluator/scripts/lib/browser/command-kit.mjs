// Shared plumbing of the browser commands (capture, audit, probe, journey, doctor): loading the runtime with a
// clear message, tool versions for the manifest, capture bookkeeping (manifest.captures, EVD-03) and URL slugs.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { UsageError } from '../util/args.mjs';
import { listDir, isDir } from '../util/fs.mjs';
import { slug } from '../util/time.mjs';
import { loadBrowserDeps, BrowserDepsError, MISSING_MESSAGE, resolvePackage } from '../deps.mjs';

/** Load the browser runtime or fail with the doctor hint (exit 1 through UsageError). */
export async function loadDeps(root, { require } = {}) {
  try {
    return await loadBrowserDeps({ projectRoot: root, ...(require ? { require } : {}) });
  } catch (err) {
    if (err instanceof BrowserDepsError) throw new UsageError(err.userMessage || MISSING_MESSAGE);
    throw new UsageError(`${MISSING_MESSAGE} (${err.message})`);
  }
}

/**
 * Only the image packages (pngjs, pixelmatch) for pixel diffs: no Playwright, no Chromium. Null when absent.
 * @returns {Promise<{PNG:any, pixelmatch:Function, versions:Record<string,string>}|null>}
 */
export async function loadImageDeps(root) {
  const png = resolvePackage('pngjs', { projectRoot: root });
  const pm = resolvePackage('pixelmatch', { projectRoot: root });
  if (!png || !pm) return null;
  const pngMod = await import(pathToFileURL(png.cjs || png.file).href);
  const pmMod = await import(pathToFileURL(pm.file).href);
  return { PNG: pngMod.PNG || pngMod.default?.PNG, pixelmatch: pmMod.default || pmMod, versions: { pngjs: png.version, pixelmatch: pm.version } };
}

/** Tool and engine versions for manifest.tools (EVD-01). */
export function toolVersions(deps, browserVersion) {
  const v = deps?.versions || {};
  const out = {};
  for (const k of ['playwright', '@axe-core/playwright', 'axe-core', 'web-vitals', 'pngjs', 'pixelmatch', 'colorjs.io']) if (v[k]) out[k] = v[k];
  if (browserVersion) out.chromium = browserVersion;
  return out;
}

const IMAGE_KINDS = new Set(['still', 'audit', 'cvd', 'preference', 'url']);

/**
 * Merge capture items into manifest.captures. Items are keyed by file, so a retake replaces the earlier record;
 * valid/invalid count the images (EVD-03); ARIA and DOM records are kept in the list with their own kind.
 */
export function mergeCaptures(existing, items) {
  const byFile = new Map();
  for (const it of existing?.items || []) if (it && it.file) byFile.set(it.file, it);
  for (const it of items) if (it && it.file) byFile.set(it.file, it);
  const all = [...byFile.values()].sort((a, b) => String(a.file).localeCompare(String(b.file)));
  const images = all.filter((i) => IMAGE_KINDS.has(i.kind));
  const invalidItems = images.filter((i) => !i.valid);
  return {
    ...(existing || {}),
    valid: images.length - invalidItems.length,
    invalid: invalidItems.length,
    invalid_files: invalidItems.map((i) => i.file).slice(0, 50),
    items: all,
  };
}

/** Next numbered probe folder: runs/<id>/probes/<n>/. */
export function nextNumberedDir(parent) {
  const nums = listDir(parent)
    .filter((n) => /^\d+$/.test(n) && isDir(path.join(parent, n)))
    .map(Number);
  return path.join(parent, String((nums.length ? Math.max(...nums) : 0) + 1));
}

/** A readable, filesystem-safe slug for a URL: the last path segments (file URLs) or path and query. */
export function urlSlug(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return slug(url, 60);
  }
  const segs = decodeURIComponent(u.pathname).split('/').filter(Boolean);
  const tail = u.protocol === 'file:' ? segs.slice(-2).join('-') : `${segs.join('-') || 'root'}${u.search ? `-${u.search.slice(1)}` : ''}`;
  return slug(tail || u.hostname || 'page', 60);
}

/** Parse "320,1280" into widths. */
export function parseWidths(value, name = 'widths') {
  if (value === undefined || value === null || value === true) return null;
  const ws = String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
  if (!ws.length || ws.some((w) => !Number.isInteger(w) || w < 200 || w > 4000)) throw new UsageError(`--${name} must be comma-separated integers between 200 and 4000 (got "${value}")`);
  return [...new Set(ws)].sort((a, b) => a - b);
}

export function parseThemes(value) {
  if (value === undefined || value === null || value === true) return null;
  const ts = String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!ts.length || ts.some((t) => !['light', 'dark'].includes(t))) throw new UsageError(`--themes must be light, dark or both (got "${value}")`);
  return [...new Set(ts)];
}
