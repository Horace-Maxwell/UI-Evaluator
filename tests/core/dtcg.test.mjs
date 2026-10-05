// DTCG 2025.10 token files (TOOL-28): type inheritance, aliases, JSON Pointer refs, structured colours and
// dimensions, and the problems a token file can carry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseDtcg, dtcgColorToCss, dtcgDimensionPx, dtcgDurationMs, loadDtcgTokens, findTokenFiles, looksLikeDtcg } from '../../skills/ui-evaluator/scripts/lib/tokens/dtcg.mjs';

const DOC = {
  color: {
    $type: 'color',
    ink: { $value: { colorSpace: 'srgb', components: [0.1, 0.12, 0.15], alpha: 1, hex: '#1a1f26' } },
    canvas: { $value: { colorSpace: 'oklch', components: [0.98, 0.01, 95] } },
    accent: { $value: { colorSpace: 'display-p3', components: [0.2, 0.45, 0.8] } },
    muted: { $value: { colorSpace: 'hwb', components: [210, 30, 40], hex: '#4d7399' } },
    legacy: { $value: '#e11d48' },
    action: { $value: '{color.accent}' },
    focus: { $value: { $ref: '#/color/action/$value' } },
  },
  space: {
    $type: 'dimension',
    2: { $value: { value: 8, unit: 'px' } },
    4: { $value: { value: 1, unit: 'rem' } },
    old: { $value: '24px' },
  },
  font: { body: { $type: 'fontFamily', $value: ['Source Serif 4', 'Georgia', 'serif'] } },
  motion: { fast: { $type: 'duration', $value: { value: 150, unit: 'ms' } }, slow: { $type: 'duration', $value: '0.4s' } },
  broken: {
    $type: 'color',
    loop1: { $value: '{broken.loop2}' },
    loop2: { $value: '{broken.loop1}' },
    missing: { $value: '{color.nope}' },
  },
};

test('parseDtcg inherits group types and resolves aliases and JSON Pointer refs', () => {
  const { tokens, errors } = parseDtcg(DOC, { file: 'design.tokens.json' });
  const by = Object.fromEntries(tokens.map((t) => [t.path, t]));
  assert.equal(by['color.ink'].type, 'color');
  assert.equal(by['space.2'].type, 'dimension');
  assert.deepEqual(by['color.action'].value, DOC.color.accent.$value, 'alias resolves to the target value');
  assert.deepEqual(by['color.focus'].value, DOC.color.accent.$value, '$ref resolves through the alias it points at');
  assert.equal(by['broken.loop1'].value, null);
  assert.equal(by['broken.missing'].value, null);
  assert.ok(errors.some((e) => /cycle/.test(e)), 'alias cycles are reported');
  assert.ok(errors.some((e) => /missing token \{color\.nope\}/.test(e)), 'missing aliases are reported');
});

test('colours, dimensions and durations convert to values the checks can compare', () => {
  assert.equal(dtcgColorToCss(DOC.color.ink.$value), 'color(srgb 0.1 0.12 0.15)');
  assert.equal(dtcgColorToCss(DOC.color.canvas.$value), 'oklch(0.98 0.01 95)');
  assert.equal(dtcgColorToCss(DOC.color.accent.$value), 'color(display-p3 0.2 0.45 0.8)');
  assert.equal(dtcgColorToCss(DOC.color.muted.$value), '#4d7399', 'unsupported spaces fall back to the hex member');
  assert.equal(dtcgColorToCss({ colorSpace: 'hwb', components: [1, 2, 3] }), null, 'no hex, no conversion: unknown, not black');
  assert.equal(dtcgColorToCss({ colorSpace: 'srgb', components: [1, 0, 0], alpha: 0.5 }), 'color(srgb 1 0 0 / 0.5)');
  assert.equal(dtcgDimensionPx({ value: 1.5, unit: 'rem' }), 24);
  assert.equal(dtcgDimensionPx('12px'), 12);
  assert.equal(dtcgDimensionPx({ value: 2, unit: 'em' }), null);
  assert.equal(dtcgDurationMs({ value: 0.2, unit: 's' }), 200);
  assert.equal(dtcgDurationMs('150ms'), 150);
});

test('loadDtcgTokens finds token files, skips non-DTCG JSON and returns allowed values', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'uie-dtcg-'));
  try {
    fs.mkdirSync(path.join(root, 'tokens'));
    fs.mkdirSync(path.join(root, 'node_modules', 'x'), { recursive: true });
    fs.writeFileSync(path.join(root, 'tokens', 'design.tokens.json'), JSON.stringify(DOC));
    fs.writeFileSync(path.join(root, 'tokens.json'), JSON.stringify({ name: 'not tokens', version: 1 }));
    fs.writeFileSync(path.join(root, 'node_modules', 'x', 'a.tokens.json'), JSON.stringify(DOC));
    assert.deepEqual(findTokenFiles(root).map((f) => path.relative(root, f)).sort(), ['tokens.json', path.join('tokens', 'design.tokens.json')].sort());
    const t = loadDtcgTokens(root);
    assert.deepEqual(t.files, ['tokens/design.tokens.json'], 'plain JSON that is not DTCG is ignored');
    assert.ok(t.colors.find((c) => c.path === 'color.legacy' && c.hex === '#e11d48'));
    assert.ok(t.colors.find((c) => c.path === 'color.action'), 'aliased colours are allowed values too');
    assert.deepEqual(t.dimensions.map((d) => d.px).sort((a, b) => a - b), [8, 16, 24]);
    assert.deepEqual(t.fontFamilies[0].families, ['Source Serif 4', 'Georgia', 'serif']);
    assert.deepEqual(t.durations.map((d) => d.ms).sort((a, b) => a - b), [150, 400]);
    assert.ok(t.errors.length >= 2, 'the broken group is reported');
    assert.equal(looksLikeDtcg({ a: { b: { $value: 1 } } }), true);
    assert.equal(looksLikeDtcg({ a: { b: 1 } }), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
