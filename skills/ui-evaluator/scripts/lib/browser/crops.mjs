// Crops around a finding's bounding box, with margin, for reports and EVD-05 anchors (ARCHITECTURE §9.5).
import path from 'node:path';
import fs from 'node:fs';
import { ensureDir } from '../util/fs.mjs';
import { decodePng, encodePng, cropImage } from './png.mjs';

/**
 * Crop `bbox` [x, y, w, h] (CSS px, document coordinates) out of a full-page PNG, with `margin` CSS px around it.
 * `scale` is the device scale factor of the capture. Returns a PNG buffer or null when the box is outside.
 */
export function cropPng(PNG, pngBuffer, bbox, { margin = 16, scale = 1, maxHeight = 1200 } = {}) {
  const img = Buffer.isBuffer(pngBuffer) || pngBuffer instanceof Uint8Array ? decodePng(PNG, pngBuffer) : pngBuffer;
  const [x, y, w, h] = bbox;
  const box = [x - margin, y - margin, w + 2 * margin, Math.min(h + 2 * margin, maxHeight)];
  const c = cropImage(img, box, scale);
  return c ? encodePng(PNG, c) : null;
}

/** Write crops for hits that have a bbox, using decoded page screenshots keyed by page-state key. */
export class CropWriter {
  constructor({ PNG, dir, relBase, max = 500 }) {
    this.PNG = PNG;
    this.dir = dir;
    this.relBase = relBase;
    this.max = max;
    this.count = 0;
    this.images = new Map();
  }

  addScreenshot(key, buffer, scale = 1) {
    try {
      this.images.set(key, { img: decodePng(this.PNG, buffer), scale });
    } catch {
      /* an undecodable screenshot simply yields no crops */
    }
  }

  /** Attach `crop` to the hit's first location when possible. Returns the relative path or null. */
  attach(hit, key, name) {
    if (this.count >= this.max) return null;
    const l = hit.locations && hit.locations[0];
    if (!l || !Array.isArray(l.bbox)) return null;
    const entry = this.images.get(key);
    if (!entry) return null;
    const [, , w, h] = l.bbox;
    if (w <= 0 || h <= 0) return null;
    const buf = cropPng(this.PNG, entry.img, l.bbox, { scale: entry.scale });
    if (!buf) return null;
    const file = path.join(this.dir, `${name}.png`);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, buf);
    this.count += 1;
    l.crop = path.relative(this.relBase, file).split(path.sep).join('/');
    return l.crop;
  }
}
