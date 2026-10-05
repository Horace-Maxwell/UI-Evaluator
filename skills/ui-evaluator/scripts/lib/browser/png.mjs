// PNG helpers on top of pngjs and pixelmatch (both loaded through deps.mjs and passed in).
// Images are plain {width, height, data: Uint8Array RGBA}.

export function decodePng(PNG, buffer) {
  const img = PNG.sync.read(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
  return { width: img.width, height: img.height, data: img.data };
}

export function encodePng(PNG, img) {
  const out = new PNG({ width: img.width, height: img.height });
  Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength).copy(out.data);
  return PNG.sync.write(out);
}

/** Crop a rectangle [x, y, w, h] (CSS px × scale), clamped to the image. Returns null when empty. */
export function cropImage(img, [x, y, w, h], scale = 1) {
  const x0 = Math.max(0, Math.floor(x * scale));
  const y0 = Math.max(0, Math.floor(y * scale));
  const x1 = Math.min(img.width, Math.ceil((x + w) * scale));
  const y1 = Math.min(img.height, Math.ceil((y + h) * scale));
  const cw = x1 - x0;
  const ch = y1 - y0;
  if (cw <= 0 || ch <= 0) return null;
  const data = new Uint8Array(cw * ch * 4);
  for (let row = 0; row < ch; row += 1) {
    const src = ((y0 + row) * img.width + x0) * 4;
    data.set(img.data.subarray(src, src + cw * 4), row * cw * 4);
  }
  return { width: cw, height: ch, data, x: x0, y: y0 };
}

export function pixelAt(img, x, y) {
  const xi = Math.min(img.width - 1, Math.max(0, Math.round(x)));
  const yi = Math.min(img.height - 1, Math.max(0, Math.round(y)));
  const i = (yi * img.width + xi) * 4;
  return { r: img.data[i] / 255, g: img.data[i + 1] / 255, b: img.data[i + 2] / 255, alpha: img.data[i + 3] / 255 };
}

/**
 * Pixel difference between two images of possibly different sizes. The overlapping area is compared with
 * pixelmatch; rows or columns outside the overlap count as changed.
 * @returns {{changed:number, total:number, ratio:number, mask:Uint8Array, width:number, height:number}}
 */
export function diffImages(pixelmatch, a, b, { threshold = 0.1, includeAA = false } = {}) {
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const pa = a.width === w && a.height === h ? a : cropImage(a, [0, 0, w, h]);
  const pb = b.width === w && b.height === h ? b : cropImage(b, [0, 0, w, h]);
  const out = new Uint8Array(w * h * 4);
  const changedOverlap = w && h
    ? pixelmatch(pa.data, pb.data, out, w, h, { threshold, includeAA, diffMask: true, alpha: 0, aaColor: [0, 0, 0], diffColor: [255, 0, 0], diffColorAlt: [255, 0, 0] })
    : 0;
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (out[i + 3] > 0 && (out[i] > 0 || out[i + 1] > 0 || out[i + 2] > 0)) mask[y * width + x] = 1;
    }
  }
  let extra = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x >= w || y >= h) {
        mask[y * width + x] = 1;
        extra += 1;
      }
    }
  }
  const changed = changedOverlap + extra;
  const total = width * height;
  return { changed, total, ratio: total ? changed / total : 0, mask, width, height };
}

/**
 * Bounding boxes of changed regions, by clustering a coarse grid of changed cells (4-connected).
 * @returns {number[][]} boxes [x, y, w, h] in image pixels, largest first
 */
export function changedRegions(mask, width, height, { cell = 16, max = 20 } = {}) {
  const gw = Math.ceil(width / cell);
  const gh = Math.ceil(height / cell);
  const grid = new Uint8Array(gw * gh);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) if (mask[y * width + x]) grid[Math.floor(y / cell) * gw + Math.floor(x / cell)] = 1;
  }
  const seen = new Uint8Array(gw * gh);
  const boxes = [];
  for (let i = 0; i < grid.length; i += 1) {
    if (!grid[i] || seen[i]) continue;
    let minx = Infinity;
    let miny = Infinity;
    let maxx = -1;
    let maxy = -1;
    let cells = 0;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const k = stack.pop();
      const gx = k % gw;
      const gy = Math.floor(k / gw);
      cells += 1;
      minx = Math.min(minx, gx);
      miny = Math.min(miny, gy);
      maxx = Math.max(maxx, gx);
      maxy = Math.max(maxy, gy);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const nk = ny * gw + nx;
        if (grid[nk] && !seen[nk]) {
          seen[nk] = 1;
          stack.push(nk);
        }
      }
    }
    boxes.push({ box: [minx * cell, miny * cell, Math.min(width, (maxx + 1) * cell) - minx * cell, Math.min(height, (maxy + 1) * cell) - miny * cell], cells });
  }
  return boxes.sort((a, b) => b.cells - a.cells).slice(0, max).map((b) => b.box);
}

/** Capture validity statistics (EVD-03): luminance spread and share of the most common colour. */
export function imageStats(img, { step = 4 } = {}) {
  const counts = new Map();
  let n = 0;
  let sum = 0;
  let sum2 = 0;
  for (let y = 0; y < img.height; y += step) {
    for (let x = 0; x < img.width; x += step) {
      const i = (y * img.width + x) * 4;
      const r = img.data[i];
      const g = img.data[i + 1];
      const b = img.data[i + 2];
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sum += l;
      sum2 += l * l;
      n += 1;
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  const mean = n ? sum / n : 0;
  const sd = n ? Math.sqrt(Math.max(0, sum2 / n - mean * mean)) : 0;
  const top = Math.max(0, ...counts.values());
  return { samples: n, luminanceSd: Math.round(sd * 100) / 100, dominantShare: n ? Math.round((top / n) * 1000) / 1000 : 1, colours: counts.size };
}
