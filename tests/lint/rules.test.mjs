// Every rule ID the lint layer emits has a positive and a negative fixture under tests/fixtures/lint/rules/<ID>/:
// `bad/` must produce exactly the hits its `expect:` markers name (rule ID, file, line) at the rule's level, and
// `good/` (idiomatic code near the rule's boundary) must produce none for that rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { RULE_META } from '../../skills/ui-evaluator/scripts/lib/lint/index.mjs';
import { FIXTURES, LEVEL, lintDir, markers, rows } from './helpers.mjs';

const RULES_DIR = path.join(FIXTURES, 'rules');

test('the level table covers exactly the rule IDs the lint layer emits', () => {
  assert.deepEqual(Object.keys(RULE_META).sort(), Object.keys(LEVEL).sort());
  for (const [id, meta] of Object.entries(RULE_META)) assert.equal(meta.level, LEVEL[id], `${id} level`);
});

// Each `bad*/` and `good*/` folder is linted as its own project (its PRODUCT.md, DESIGN.md and config apply).
const projects = (base, prefix) => fs.readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name.startsWith(prefix)).map((e) => path.join(base, e.name));

for (const id of Object.keys(LEVEL)) {
  test(`${id}: positive and negative fixtures`, async () => {
    const base = path.join(RULES_DIR, id);
    const bads = projects(base, 'bad');
    const goods = projects(base, 'good');
    assert.ok(bads.length, `missing positive fixture ${base}/bad`);
    assert.ok(goods.length, `missing negative fixture ${base}/good`);

    for (const bad of bads) {
      const res = await lintDir(bad);
      assert.deepEqual(res.errors.filter((e) => e.family), [], 'no rule family crashed');
      const hits = rows(res).filter((r) => r.id === id);
      const want = [...markers(bad)].filter(([, ids]) => ids.has(id)).map(([k]) => k).sort();
      const got = [...new Set(hits.map((h) => `${h.file}:${h.line ?? 'file'}`))].sort();
      assert.ok(want.length > 0, `${id}: ${path.basename(bad)} has no expect markers`);
      assert.deepEqual(got, want, `${id}: hit lines (got) vs expect markers (want) in ${path.basename(bad)}`);
      for (const h of hits) {
        assert.equal(h.level, LEVEL[id], `${id} at ${h.file}:${h.line} level`);
        assert.equal(h.hit.criteria[0].primary, true);
        assert.equal(h.hit.found_by[0].check, 'lint');
        assert.equal(h.hit.locations[0].source.method, 'lint');
        assert.equal(h.hit.locations[0].source.file, h.file);
      }
    }

    for (const good of goods) {
      const gres = await lintDir(good);
      assert.deepEqual(gres.errors.filter((e) => e.family), [], 'no rule family crashed (good)');
      const false_ = rows(gres).filter((r) => r.id === id).map((r) => `${r.file}:${r.line} ${r.message}`);
      assert.deepEqual(false_, [], `${id}: no hits on the negative fixture ${path.basename(good)}`);
    }
  });
}
