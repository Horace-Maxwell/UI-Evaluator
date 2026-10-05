// Declared tokens (DESIGN.md, W3C DTCG files [TOOL-28], CSS custom properties) in the token rules, and the
// nearest-token hint on drift hits [LOOP-005]: "equals <token> (<value>): use the token" at ΔE OK ≤ 0.02,
// "near <token> (ΔE x): use the token or add a role" up to 0.06, and the nearest scale step for off-scale spacing.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { lintSources, rows } from './helpers.mjs';
import { nearestColourToken, nearestSpacing, tokenColor, EQUALS_DE, NEAR_DE } from '../../skills/ui-evaluator/scripts/lib/lint/rules/tokens.mjs';
import { parseColor } from '../../skills/ui-evaluator/scripts/lib/util/color.mjs';

const DTCG = {
  color: {
    $type: 'color',
    accent: { $value: '#3a80f5' },
    ink: { $value: { colorSpace: 'srgb', components: [0.1, 0.12, 0.15], hex: '#1a1f26' } },
    teal: { 700: { $value: '#0f766e' } },
  },
  space: { $type: 'dimension', 1: { $value: { value: 4, unit: 'px' } }, 2: { $value: { value: 8, unit: 'px' } }, 3: { $value: { value: 12, unit: 'px' } }, 6: { $value: '24px' } },
  radius: { $type: 'dimension', card: { $value: '10px' } },
  font: { $type: 'fontFamily', body: { $value: ['Inter', 'sans-serif'] }, display: { $value: 'Fraunces, serif' } },
};

const byId = (res, id) => rows(res).filter((r) => r.id === id);

test('DTCG colours name the token a literal copies (equals) or approximates (near), in the message and the evidence', async () => {
  const res = await lintSources({
    'tokens/design.tokens.json': JSON.stringify(DTCG),
    'src/card.css': '.card {\n  color: #3a80f6;\n  border-color: #2f6fe0;\n  background: #ff00aa;\n}\n',
  });
  assert.deepEqual(res.project.dtcg.files, ['tokens/design.tokens.json']);
  const hits = byId(res, 'COL-01');
  assert.deepEqual(hits.map((h) => h.line), [2, 3, 4]);
  assert.match(hits[0].message, /equals \{color\.accent\} \(#3a80f5\): use the token$/);
  assert.deepEqual(hits[0].hit.evidence[0].nearest_token, { name: '{color.accent}', value: '#3a80f5', delta_e: 0.002, relation: 'equals', source: 'tokens/design.tokens.json' });
  assert.match(hits[1].message, /near \{color\.accent\} \(ΔE 0\.05\): use the token or add a role$/);
  assert.equal(hits[1].hit.evidence[0].nearest_token.relation, 'near');
  assert.equal(hits[2].hit.evidence[0].nearest_token, undefined, 'no token within ΔE 0.06: no hint');
  assert.doesNotMatch(hits[2].message, /token/);
});

test('a palette utility generated from the declared token set conforms; tailwind.config and @theme colours count as declared', async () => {
  const dtcg = await lintSources({
    'tokens/design.tokens.json': JSON.stringify(DTCG),
    'src/Tag.tsx': 'export const Tag = () => <span className="bg-teal-700 text-sky-700">Tag</span>;\n',
  });
  assert.deepEqual(byId(dtcg, 'COL-01').map((h) => h.message), ['raw palette utility text-sky-700']);
  const config = await lintSources({
    'tailwind.config.js': "module.exports = { theme: { extend: { colors: { teal: { 700: '#115e59' }, 'sky': { 700: '#075985' } } } } };\n",
    'src/Tag.tsx': 'export const Tag = () => <span className="bg-teal-700 text-sky-700 border-rose-500">Tag</span>;\n',
  });
  assert.deepEqual(byId(config, 'COL-01').map((h) => h.message), ['raw palette utility border-rose-500']);
  const theme = await lintSources({
    'src/app.css': '@import "tailwindcss";\n@theme { --color-rose-500: oklch(0.6 0.2 15); }\n',
    'src/Tag.tsx': 'export const Tag = () => <span className="border-rose-500 bg-lime-200">Tag</span>;\n',
  });
  assert.deepEqual(byId(theme, 'COL-01').map((h) => h.message), ['raw palette utility bg-lime-200']);
});

test('CSS custom properties and DESIGN.md colours are named tokens too', async () => {
  const css = await lintSources({
    'src/theme.css': ':root {\n  --color-surface: #fffbeb;\n  --primary: 161 41% 31%;\n}\n',
    'src/badge.css': '.badge {\n  background: #fffbeb;\n  color: hsl(161 41% 31%);\n}\n',
  });
  assert.deepEqual(byId(css, 'COL-01').map((h) => h.message), ['literal #fffbeb in background: equals --color-surface (#fffbeb): use the token', 'literal hsl(161 41% 31%) in color: equals --primary (#2f6f5b): use the token']);
  const design = await lintSources({
    'DESIGN.md': '---\nversion: alpha\nname: Harbour\ncolors:\n  primary: "#0e4c63"\nui-evaluator:\n  status: approved\n---\n\n# Harbour\n',
    'src/Badge.tsx': 'export const Badge = () => <span style={{ color: \'#0e4c63\' }}>Due</span>;\n',
  });
  assert.match(byId(design, 'COL-01')[0].message, /equals \{colors\.primary\} \(#0e4c63\): use the token$/);
});

test('off-scale spacing names the nearest step: a declared token, else the default 4 px grid', async () => {
  const declared = await lintSources({
    'tokens/design.tokens.json': JSON.stringify(DTCG),
    'src/card.css': '.card {\n  padding: 13px;\n  margin: 10px;\n  gap: 24px;\n}\n',
  });
  const lay = byId(declared, 'LAY-01');
  assert.deepEqual(lay.map((h) => h.line), [2, 3], 'the radius token (10px) is not a spacing step: a spacing group exists');
  assert.match(lay[0].message, /off the declared scale \(0, 4, 8, 12, 24 px\); nearest \{space\.3\} \(12px\)$/);
  assert.deepEqual(lay[0].hit.evidence[0].nearest_token, { name: '{space.3}', value: '12px', delta_px: -1, relation: 'nearest', source: 'tokens/design.tokens.json' });
  const plain = await lintSources({ 'src/card.css': '.card {\n  padding: 13px;\n  margin: 7px;\n}\n' });
  assert.deepEqual(byId(plain, 'LAY-01').map((h) => h.message), ['padding: 13px (13 px) is off the default scale (0, 2 px, multiples of 4 px); nearest step 12px', 'margin: 7px (7 px) is off the default scale (0, 2 px, multiples of 4 px); nearest step 8px']);
  const vars = await lintSources({ 'src/card.css': ':root { --space-3: 12px; }\n.card {\n  padding: 13px;\n}\n' });
  assert.match(byId(vars, 'LAY-01')[0].message, /nearest --space-3 \(12px\)$/);
});

test('TYP-05 counts families declared as tokens and names the stray one', async () => {
  const res = await lintSources({
    'tokens/design.tokens.json': JSON.stringify(DTCG),
    'src/type.css': 'body { font-family: var(--font-body); }\n.quote { font-family: \'Lora\', serif; }\n',
  });
  const t = byId(res, 'TYP-05');
  assert.equal(t.length, 1);
  assert.equal(t[0].file, 'src/type.css');
  assert.equal(t[0].line, 2);
  assert.match(t[0].message, /3 Latin families \(Lora, Inter, Fraunces\).*not in the declared tokens: Lora$/);
  const ok = await lintSources({ 'tokens/design.tokens.json': JSON.stringify(DTCG), 'src/type.css': 'body { font-family: var(--font-body); }\nh1 { font-family: Fraunces, serif; }\n' });
  assert.deepEqual(byId(ok, 'TYP-05'), []);
});

test('token files are never drift: DTCG JSON, token stylesheets and the Tailwind config', async () => {
  const res = await lintSources({
    'tokens/design.tokens.json': JSON.stringify(DTCG),
    'src/styles/tokens.css': ':root { --brand: #0f766e; --ink: #132026; --gap: 13px; }\n.card-token-demo { color: #ff00aa; padding: 13px; }\n',
    'tailwind.config.ts': "export default { theme: { extend: { colors: { brand: '#0f766e' }, spacing: { 13: '13px' } } } };\n",
  });
  assert.deepEqual(rows(res).filter((r) => r.level === 'gate').map((r) => `${r.id} ${r.file}`), []);
});

test('nearest-token helpers', () => {
  const tokens = [{ name: '--a', color: parseColor('#3a80f5') }, { name: '--b', color: parseColor('#0f766e') }];
  assert.equal(nearestColourToken(tokens, parseColor('#3a80f5')).relation, 'equals');
  assert.equal(nearestColourToken(tokens, parseColor('#ff0000')), null);
  assert.equal(nearestColourToken(tokens, parseColor('rgb(58 128 245 / 0.4)')), null, 'a translucent literal is not a copy of an opaque token');
  assert.ok(EQUALS_DE < NEAR_DE);
  assert.deepEqual(nearestSpacing([], 13), { name: null, value: '12px', delta_px: -1, relation: 'nearest step', source: 'default scale' });
  assert.equal(nearestSpacing([], 1).value, '2px');
  assert.equal(nearestSpacing([], 13, { declared: true }), null, 'a declared scale without named steps gives no guess');
  assert.equal(tokenColor('161 41% 31%').alpha, 1, 'shadcn bare HSL channels read as a colour');
});
