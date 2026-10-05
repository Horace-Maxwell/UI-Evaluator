// The build-benchmark helpers (tools/bench): blind copies, seeded keys, assertion kinds and the person's verdict line.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripComments, stripJsComments } from '../../tools/bench/strip-comments.mjs';
import { assertionKind, parseVerdictLine, rng, scoreOf, shuffle, tally } from '../../tools/bench/lib.mjs';

test('JS comments go; strings, template literals, regex literals and division stay', () => {
  const src = [
    'const url = "http://example.test/a"; // gone-1',
    "const t = `a // not a comment ${1 / 2}`;",
    'const re = /\\/\\/not-a-comment/g; /* gone-2 */',
    'const x = a / b / c; // gone-3',
    'if (/[/]/.test(s)) return /x\\/y/;',
  ].join('\n');
  const out = stripJsComments(src);
  assert.ok(!/gone-/.test(out), out);
  assert.ok(out.includes('"http://example.test/a"'));
  assert.ok(out.includes('`a // not a comment ${1 / 2}`'));
  assert.ok(out.includes('/\\/\\/not-a-comment/g'));
  assert.ok(out.includes('a / b / c'));
  assert.ok(out.includes('/[/]/.test(s)') && out.includes('return /x\\/y/'));
});

test('HTML and CSS comments go; other files are untouched', () => {
  assert.equal(stripComments('a.html', '<p>a</p><!-- built with UI-Evaluator --><p>b</p>'), '<p>a</p><p>b</p>');
  assert.equal(stripComments('a.css', 'a{color:red}/* per DESIGN.md */'), 'a{color:red}');
  assert.equal(stripComments('a.svg', '<!-- keep -->'), '<!-- keep -->');
});

test('a seed gives the same keys every time', () => {
  const one = shuffle(['a', 'b', 'c', 'd', 'e'], rng(7));
  const two = shuffle(['a', 'b', 'c', 'd', 'e'], rng(7));
  assert.deepEqual(one, two);
  assert.deepEqual([...one].sort(), ['a', 'b', 'c', 'd', 'e']);
  const seen = new Set(Array.from({ length: 20 }, (_, i) => shuffle(['a', 'b', 'c', 'd', 'e'], rng(i)).join('')));
  assert.ok(seen.size > 1, 'different seeds give different orders');
});

test('process assertions are kept apart from output assertions', () => {
  assert.equal(assertionKind('PRODUCT.md exists at the project root and passes DEC-01'), 'process');
  assert.equal(assertionKind('A seeded direction roll and a decision record exist'), 'process');
  assert.equal(assertionKind('PRODUCT.md records the zh-CN form-of-address decision'), 'process');
  assert.equal(assertionKind('[quality] 0 hard AI tells in the shipped page'), 'output');
  assert.equal(assertionKind('The reply to the user is in Chinese'), 'output');
  const grading = {
    expectations: [
      { text: 'DESIGN.md exists and its tokens validate', passed: false },
      { text: 'No invented proof: no usage figures', passed: true },
      { text: '[quality] 0 WCAG (G2) criteria failed by the deterministic checks', passed: false, kind: 'output' },
    ],
  };
  assert.deepEqual(scoreOf(grading, 'output'), { passed: 1, total: 2 });
  assert.deepEqual(scoreOf(grading, 'process'), { passed: 0, total: 1 });
});

test('the verdict line is unblinded with the page key, notes included', () => {
  const key = { p1: { eval: 'eval-1-build-en-repair-cafe', run: 2, X: 'with_skill', Y: 'without_skill' }, p2: { eval: 'eval-2-build-zh-calligraphy-signup', run: 1, X: 'without_skill', Y: 'with_skill' } };
  const v = parseVerdictLine('页面盲评 | p1(en-repair-cafe#2) 更美=X；更不像模板=Y；会发布=差不多 | p2(zh-calligraphy-signup#1) 更美=X；更不像模板=X；会发布=Y；意见：好看；但=太挤', key);
  assert.deepEqual(v[0], { pid: 'p1', eval: 'eval-1-build-en-repair-cafe', run: 2, more_beautiful: 'with_skill', less_generic: 'without_skill', better_overall: 'tie' });
  assert.equal(v[1].more_beautiful, 'without_skill');
  assert.equal(v[1].better_overall, 'with_skill');
  assert.equal(v[1].note, '好看；但=太挤');
  const en = parseVerdictLine('Round 5 | p1(en-repair-cafe#2) more beautiful=Y; less template-like=About the same; would publish=X; note: tidy; plain', key);
  assert.equal(en[0].more_beautiful, 'without_skill');
  assert.equal(en[0].less_generic, 'tie');
  assert.equal(en[0].note, 'tidy; plain');
  // Lines from the earlier pages named the configurations themselves.
  const old = parseVerdictLine('第四轮盲评 | p1(en-repair-cafe#2) 更美=基线；更不像模板=技能版；会发布=基线', key);
  assert.equal(old[0].less_generic, 'with_skill');
  assert.deepEqual(tally(v).more_beautiful, { with_skill: 1, tie: 0, without_skill: 1 });
  assert.throws(() => parseVerdictLine('x | p9(a#1) 更美=X；更不像模板=X；会发布=X', key), /p9/);
  assert.throws(() => parseVerdictLine('x | p1(a#1) 更美=X；更不像模板=X', key), /better_overall/);
});
