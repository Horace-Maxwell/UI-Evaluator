// CSV, YAML, Markdown and JSON Schema helpers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, hasHeader, toObjects, stringifyCsv } from '../../skills/ui-evaluator/scripts/lib/util/csv.mjs';
import { parseYaml, splitFrontMatter } from '../../skills/ui-evaluator/scripts/lib/util/yaml.mjs';
import { placeholders, sections } from '../../skills/ui-evaluator/scripts/lib/util/markdown.mjs';
import { validate, loadSchema } from '../../skills/ui-evaluator/scripts/lib/schema.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(HERE, '../../skills/ui-evaluator');

test('CSV: quotes, embedded commas and newlines, CRLF, BOM, semicolons', () => {
  const rows = parseCsv('\uFEFFa,b,c\r\n1,"x, y","say ""hi""\nthere"\r\n\r\n2,,3\n');
  assert.deepEqual(rows, [['a', 'b', 'c'], ['1', 'x, y', 'say "hi"\nthere'], ['2', '', '3']]);
  assert.deepEqual(parseCsv('a;b\n1;2'), [['a', 'b'], ['1', '2']]);
  assert.equal(hasHeader([['task_id', 'seq'], ['T1', '5']]), true);
  assert.equal(hasHeader([['1', '2'], ['3', '4']]), false);
  const { header, records } = toObjects([['Task ID', 'SEQ'], ['T1', '6']]);
  assert.deepEqual(header, ['task_id', 'seq']);
  assert.equal(records[0].seq, '6');
  assert.equal(stringifyCsv([['a', 'b,c', 'd"e']]), 'a,"b,c","d""e"\n');
});

test('YAML: the DESIGN.md fixture front matter parses with flow maps, lists and comments', () => {
  const text = fs.readFileSync(path.resolve(HERE, '../fixtures/core/DESIGN.md'), 'utf8');
  const { frontMatter } = splitFrontMatter(text);
  const fm = parseYaml(frontMatter);
  assert.equal(fm.version, 'alpha');
  assert.equal(fm.colors.surface, 'oklch(0.985 0.006 250)');
  assert.equal(fm.typography.body.fontSize, '1rem');
  assert.equal(fm['ui-evaluator'].ramps.neutral.length, 12);
  assert.equal(fm['ui-evaluator'].role_steps.primary, 'accent.9');
  assert.deepEqual(fm['ui-evaluator'].themes.shipped, ['light']);
  assert.equal(fm['ui-evaluator'].motion.duration_ms.state, 200);
  assert.equal(fm['ui-evaluator'].brand_attributes[0].not, 'bureaucratic');
});

test('YAML: the template front matter parses', () => {
  const text = fs.readFileSync(path.join(SKILL, 'references/templates/DESIGN.md'), 'utf8');
  const fm = parseYaml(splitFrontMatter(text).frontMatter);
  assert.equal(fm['ui-evaluator'].status, 'template');
  assert.ok(fm.components['button-primary']);
});

test('Markdown: placeholders ignore labels, rule IDs and footnotes', () => {
  assert.deepEqual(placeholders('Done. [confirmed: owner, 2026-09-20] See [HCI-029] and [3].'), []);
  assert.equal(placeholders('Name: [Product name]').length, 1);
  assert.equal(placeholders('<!-- [hidden] --> text').length, 0);
  assert.deepEqual(sections('## A\nx\n## B\ny\n', 2).map((s) => s.title), ['A', 'B']);
});

test('JSON Schema validator: required, enum, if/then/else, $ref, patternProperties', () => {
  const schema = {
    type: 'object',
    required: ['kind'],
    properties: { kind: { enum: ['a', 'b'] }, n: { $ref: '#/$defs/pos' } },
    if: { properties: { kind: { const: 'a' } } },
    then: { required: ['n'] },
    $defs: { pos: { type: 'integer', minimum: 1 } },
    additionalProperties: false,
    patternProperties: { '^_': {} },
  };
  assert.equal(validate(schema, { kind: 'a', n: 2 }).valid, true);
  assert.equal(validate(schema, { kind: 'a' }).valid, false);
  assert.equal(validate(schema, { kind: 'b', _note: 'x' }).valid, true);
  assert.equal(validate(schema, { kind: 'c' }).valid, false);
  assert.equal(validate(schema, { kind: 'b', extra: 1 }).valid, false);
  assert.equal(validate(schema, { kind: 'a', n: 0 }).valid, false);
});

test('templates validate against their schemas', () => {
  const read = (p) => JSON.parse(fs.readFileSync(path.join(SKILL, p), 'utf8'));
  const cfg = validate(loadSchema('config'), read('references/templates/config.example.json'));
  assert.equal(cfg.valid, true, JSON.stringify(cfg.errors.slice(0, 3)));
  const j = validate(loadSchema('journey'), read('references/templates/journey.example.json'));
  assert.equal(j.valid, true, JSON.stringify(j.errors.slice(0, 3)));
});

test('every schema file is valid JSON with an $id matching its name', () => {
  const dir = path.join(SKILL, 'assets/schemas');
  for (const f of fs.readdirSync(dir)) {
    const doc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    assert.equal(doc.$id, f, `${f} has $id ${doc.$id}`);
  }
});

test('SLP-21 reads a serif display from the primary face, never from the sans-serif fallback keyword', async () => {
  const { isSerifStack } = await import('../../skills/ui-evaluator/scripts/lib/browser/checks/tells.mjs');
  assert.equal(isSerifStack('Kaiti SC, STKaiti, KaiTi, PingFang SC, sans-serif'), false);
  assert.equal(isSerifStack('"Source Sans 3", sans-serif'), false);
  assert.equal(isSerifStack('Inter, system-ui, sans-serif'), false);
  assert.equal(isSerifStack('"Noto Serif SC", serif'), true);
  assert.equal(isSerifStack('Georgia, serif'), true);
  assert.equal(isSerifStack('serif'), true);
});
