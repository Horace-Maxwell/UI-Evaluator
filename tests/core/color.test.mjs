// The zero-dependency colour maths (lib/util/color.mjs) against colorjs.io, as ADR-026 requires. Every check and
// the lint layer use util/color.mjs, so a parsing slip here silently skews contrast, chroma and hue results.
// The comparison runs when colorjs.io is installed (scripts/node_modules); the fixed expectations always run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseColor, contrastRatio, toOklch, deltaEOK } from '../../skills/ui-evaluator/scripts/lib/util/color.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let Color = null;
try {
  const require = createRequire(path.resolve(HERE, '../../skills/ui-evaluator/scripts/package.json'));
  const mod = require('colorjs.io');
  Color = mod.default || mod;
} catch {
  Color = null;
}

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (tolerance ${tol})`);

test('parseColor reads every CSS colour syntax the browser and source code produce', () => {
  const cases = [
    ['#3a80f5', [0.2275, 0.502, 0.9608, 1]],
    ['#3a80f580', [0.2275, 0.502, 0.9608, 0.502]],
    ['rgb(10, 20, 30)', [0.0392, 0.0784, 0.1176, 1]],
    ['rgba(10, 20, 30, 0.5)', [0.0392, 0.0784, 0.1176, 0.5]],
    ['rgb(10 20 30 / 50%)', [0.0392, 0.0784, 0.1176, 0.5]],
    ['color(srgb 0.2 0.5 0.9)', [0.2, 0.5, 0.9, 1]],
    ['color(srgb 0.2 0.5 0.9 / 0.25)', [0.2, 0.5, 0.9, 0.25]],
    ['color(srgb 20% 50% 90%)', [0.2, 0.5, 0.9, 1]],
    ['transparent', [0, 0, 0, 0]],
  ];
  for (const [input, [r, g, b, a]] of cases) {
    const c = parseColor(input);
    assert.ok(c, `${input} parses`);
    close(c.r, r, 0.001, `${input} r`);
    close(c.g, g, 0.001, `${input} g`);
    close(c.b, b, 0.001, `${input} b`);
    close(c.alpha, a, 0.002, `${input} alpha`);
  }
  assert.equal(parseColor('rgb(10 20 30 0.5)')?.alpha ?? 1, 1, 'space syntax takes alpha only after a slash');
  assert.equal(parseColor('color(rec9999 0.1 0.2 0.3)'), null, 'unknown colour spaces are unknown, not black');
  assert.equal(parseColor('not-a-colour'), null);
});

test('conversions agree with colorjs.io', { skip: Color ? false : 'colorjs.io not installed (run uie doctor --install)' }, () => {
  const inputs = [
    '#3a80f5', '#ffffff', '#000000', '#767676', '#e11d48', 'rebeccapurple',
    'hsl(210 80% 50%)', 'hsl(30, 100%, 40%)',
    'oklch(0.62 0.19 259)', 'oklch(0.985 0.006 250)', 'oklch(0.45 0.12 30 / 0.8)',
    'oklab(0.6 -0.05 0.1)', 'lab(52 40 -30)', 'lch(70 30 120)',
    'color(srgb 0.2 0.5 0.9)', 'color(display-p3 0.3 0.5 0.7)', 'color(xyz-d65 0.2 0.2 0.6)', 'color(xyz-d50 0.2 0.2 0.5)',
  ];
  for (const input of inputs) {
    const ours = parseColor(input);
    assert.ok(ours, `${input} parses`);
    const ref = new Color(input).to('srgb');
    const [r, g, b] = ref.coords.map((v) => Math.min(1, Math.max(0, v ?? 0)));
    const inGamut = ref.inGamut();
    close(ours.r, r, 0.003, `${input} r`);
    close(ours.g, g, 0.003, `${input} g`);
    close(ours.b, b, 0.003, `${input} b`);
    assert.equal(ours.inGamut, inGamut, `${input} gamut flag`);
    if (inGamut) {
      const [L, C, H] = new Color(input).to('oklch').coords;
      const o = toOklch(ours);
      close(o.l ?? o.L ?? o[0], L, 0.002, `${input} OKLCH L`);
      close(o.c ?? o.C ?? o[1], C, 0.002, `${input} OKLCH C`);
      if (C > 0.02) {
        const h = o.h ?? o.H ?? o[2];
        const d = Math.abs(((h - H + 540) % 360) - 180);
        assert.ok(d <= 0.5, `${input} OKLCH hue: ${h} vs ${H}`);
      }
    }
  }
});

test('WCAG contrast and ΔE OK agree with colorjs.io', { skip: Color ? false : 'colorjs.io not installed' }, () => {
  const pairs = [['#767676', '#ffffff'], ['#3a80f5', '#ffffff'], ['#e11d48', '#0f172a'], ['oklch(0.7 0.1 150)', 'oklch(0.2 0.02 250)']];
  for (const [fg, bg] of pairs) {
    const ref = new Color(fg).contrast(new Color(bg), 'WCAG21');
    close(contrastRatio(parseColor(fg), parseColor(bg)), ref, 0.01, `contrast ${fg} on ${bg}`);
    const dRef = new Color(fg).deltaE(new Color(bg), 'OK');
    close(deltaEOK(parseColor(fg), parseColor(bg)), dRef, 0.002, `ΔE OK ${fg} vs ${bg}`);
  }
  assert.equal(Math.round(contrastRatio(parseColor('#767676'), parseColor('#ffffff')) * 100) / 100, 4.54);
});
