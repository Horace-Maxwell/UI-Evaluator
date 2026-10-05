// Scanner tests on tricky inputs: css.mjs (comments, nesting, at-rules, Tailwind v4), markup.mjs (TSX generics,
// template literals, class-merging calls, Vue and Svelte directives, MDX code fences, styled-components) and
// tailwind.mjs (variants, arbitrary values, utility classification). Line numbers must stay true.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseCss, transitionProps, colorsIn, parseShadowLayer, animationNames, splitTopLevel } from '../../skills/ui-evaluator/scripts/lib/lint/css.mjs';
import { parseDocument, blankMarkdownCode, looksLikeClassList, eventOf, normAttr } from '../../skills/ui-evaluator/scripts/lib/lint/markup.mjs';
import {
  splitClass, colorUtility, spacingUtility, radiusUtility, borderWidthUtility, transitionUtility, animateUtility,
  transformUtility, fontFamilyUtility, isGradientUtility, easeBezier,
} from '../../skills/ui-evaluator/scripts/lib/lint/tailwind.mjs';

const doc = (name, text) => parseDocument(`/virtual/${name}`, text, { rel: name });
const rule = (sheet, sel) => sheet.rules.filter((r) => r.selector === sel);
const decl = (r, prop) => r.decls.find((d) => d.prop === prop);

// ---- css.mjs ----------------------------------------------------------------------------------------------

test('css: SCSS comments, nesting, & selectors and conditional groups keep their selector and line', () => {
  const src = [
    '// line comment with a { brace',
    '$gap: 8px;',
    '.card {',
    '  /* block { comment } */',
    '  padding: $gap * 2; // trailing comment',
    '  background: url(//cdn.example.org/a.png);',
    '  &__title { color: red; }',
    '  &:hover { color: blue; }',
    '  @media (min-width: 40rem) {',
    '    padding: 16px;',
    '    @supports (display: grid) { display: grid; }',
    '  }',
    '  .theme-dark & { margin: 0; }',
    '}',
  ].join('\n');
  const sheet = parseCss(src, { lang: 'scss' });
  const card = rule(sheet, '.card');
  assert.equal(decl(card[0], 'padding').value, '$gap * 2');
  assert.equal(decl(card[0], 'padding').line, 5);
  assert.equal(decl(card[0], 'background').value, 'url(//cdn.example.org/a.png)', '// inside url() is not a comment');
  assert.equal(rule(sheet, '.card__title')[0].line, 7);
  assert.equal(decl(rule(sheet, '.card:hover')[0], 'color').value, 'blue');
  const media = card.find((r) => r.media.length && !r.at.length);
  assert.deepEqual(media.media, ['(min-width: 40rem)']);
  assert.equal(decl(media, 'padding').line, 10);
  const supports = card.find((r) => r.at.length);
  assert.deepEqual(supports.at, ['@supports (display: grid)']);
  assert.deepEqual(supports.media, ['(min-width: 40rem)']);
  assert.equal(decl(rule(sheet, '.theme-dark .card')[0], 'margin').line, 13);
  assert.deepEqual(sheet.vars.map((v) => v.name), ['$gap']);
});

test('css: @layer, @container, @keyframes, @font-face, @import and strings with braces', () => {
  const src = `@import url('base.css');
@layer components {
  @container card (min-width: 20rem) {
    .x { gap: 2px; }
  }
}
@keyframes spin { from { transform: rotate(0) } 50%, 75% { opacity: .5 } to { transform: rotate(360deg) } }
@font-face { font-family: 'A'; src: url('a.woff2'); }
.y { content: "}"; color: green !important; }
/* .commented { color: red; } */`;
  const sheet = parseCss(src);
  assert.deepEqual(sheet.imports.map((i) => i.url), ['base.css']);
  const x = rule(sheet, '.x')[0];
  assert.deepEqual(x.at, ['@layer components', '@container card (min-width: 20rem)']);
  assert.equal(x.line, 4);
  assert.deepEqual(sheet.keyframes[0].frames.map((f) => f.selector), ['from', '50%, 75%', 'to']);
  assert.equal(sheet.fontFaces.length, 1);
  const y = rule(sheet, '.y')[0];
  assert.equal(decl(y, 'content').value, '"}"');
  assert.equal(decl(y, 'color').important, true);
  assert.equal(rule(sheet, '.commented').length, 0, 'commented-out rules are not parsed');
});

test('css: Tailwind v4 @theme, @utility, @apply and @starting-style', () => {
  const sheet = parseCss(`@import "tailwindcss";
@theme { --color-brand: oklch(0.6 0.1 160); }
@utility tab-4 { tab-size: 4; }
.btn { @apply px-4 py-2 bg-brand hover:bg-brand/90; }
.pop { transition: scale 150ms; @starting-style { scale: 0.9; } }`);
  assert.equal(decl(rule(sheet, '@theme')[0], '--color-brand').value, 'oklch(0.6 0.1 160)');
  assert.ok(rule(sheet, '.tab-4').length);
  assert.equal(decl(rule(sheet, '.btn')[0], '@apply').value, 'px-4 py-2 bg-brand hover:bg-brand/90');
  const pop = rule(sheet, '.pop');
  assert.equal(pop.find((r) => r.starting).decls[0].prop, 'scale');
});

test('css: malformed input degrades to fewer rules and never throws', () => {
  for (const src of ['.a { color: red; .b { ', '}}}{{{', '@media (x { .a { }', 'a { b: c', '"unterminated { x: y }']) {
    assert.doesNotThrow(() => parseCss(src));
  }
  assert.deepEqual(parseCss('.a { color: red; .b { ').rules.map((r) => r.selector), ['.a', '.a .b']);
});

test('css: value helpers', () => {
  assert.deepEqual(transitionProps('transition', 'opacity .2s, transform .2s ease'), ['opacity', 'transform']);
  assert.deepEqual(transitionProps('transition', '.2s'), ['all'], 'no property named means all');
  assert.deepEqual(transitionProps('transition', 'var(--motion)'), ['unknown'], 'a variable may name the property');
  assert.deepEqual(transitionProps('transition-property', 'width, var(--x)'), ['width', 'unknown']);
  assert.deepEqual(transitionProps('transition', 'none'), []);
  assert.deepEqual(colorsIn('1px solid red, url(#fade) "#fff" #abc rgb(1 2 3 / .5) var(--x) hsl(var(--y))').map((c) => c.text), ['red', '#abc', 'rgb(1 2 3 / .5)']);
  assert.deepEqual(parseShadowLayer('inset 0 1px 2px rgb(0 0 0 / 0.2)'), { inset: true, x: 0, y: 1, blur: 2, spread: 0, color: 'rgb(0 0 0 / 0.2)' });
  assert.deepEqual(animationNames('animation', 'fade-in 200ms ease-out both, spin 1s linear infinite'), ['fade-in', 'spin']);
  assert.deepEqual(splitTopLevel('a, rgb(1, 2, 3), "x, y"'), ['a', 'rgb(1, 2, 3)', '"x, y"']);
});

// ---- markup.mjs: TSX ----------------------------------------------------------------------------------------

const TSX = `import * as React from 'react';
import Default, { a as b, type T } from './x';
const List = <T extends { id: string }>({ items }: { items: T[] }) => <ul>{items.map((i) => <li key={i.id}>Item</li>)}</ul>;
const id = <T,>(x: T) => x;
const Ref = React.forwardRef<HTMLDivElement, Props>((p, ref) => <div ref={ref} className={cn('p-4', p.active && 'bg-primary', { 'ring-2': p.focus }, p.big ? 'text-lg' : 'text-sm')} />);
const ratio = a < b ? 1 : 2; const re = /<div>[a-z]+"/g; const half = total / 2 / count;
// <p>commented out JSX</p>
const tpl = \`Hello \${user.name}, you have \${count} new <b>messages</b>\`;
const merged = twMerge('px-2 py-1', clsx('rounded', { 'border-l-4': selected }));
export default function Page() {
  return (<main>
    <h1 className={\`text-2xl \${dark ? 'text-white' : 'text-black'}\`}>Your orders</h1>
    {/* a comment */}
    <p>{count > 0 && <span>Pending &amp; due</span>}</p>
    <Button variant="ghost" onClick={() => setOpen((o) => !o)} {...rest}>Open</Button>
  </main>);
}
`;

test('markup: TSX generics, comparisons, regex literals and comments do not open JSX', () => {
  const d = doc('Generic.tsx', TSX);
  assert.deepEqual(d.errors, []);
  assert.deepEqual(d.elements.map((e) => e.tag), ['ul', 'li', 'div', 'main', 'h1', 'p', 'span', 'Button']);
  assert.deepEqual(d.texts.map((t) => [t.line, t.value]), [[3, 'Item'], [12, 'Your orders'], [14, 'Pending & due'], [15, 'Open']]);
  assert.ok(!d.code.includes('commented out JSX'), 'comments are blanked in doc.code');
  assert.equal(d.code.length, d.text.length, 'the code view keeps every offset');
  assert.deepEqual(d.imports.map((i) => [i.source, i.names]), [['react', ['React']], ['./x', ['Default', 'a', 'T']]]);
  const btn = d.elements.find((e) => e.tag === 'Button');
  assert.equal(btn.hasSpread, true);
  assert.equal(btn.line, 15);
});

test('markup: cn/clsx/twMerge arguments and template literals become class tokens; conditional ones are marked', () => {
  const d = doc('Generic.tsx', TSX);
  const toks = Object.fromEntries(d.classTokens.map((t) => [t.value, t]));
  for (const c of ['p-4', 'bg-primary', 'ring-2', 'text-lg', 'text-sm', 'px-2', 'py-1', 'rounded', 'border-l-4', 'text-2xl', 'text-white', 'text-black']) assert.ok(toks[c], `class token ${c}`);
  assert.equal(toks['p-4'].el.tag, 'div');
  assert.equal(toks['p-4'].cond, false);
  assert.equal(toks['bg-primary'].cond, true, 'cond && "class"');
  assert.equal(toks['ring-2'].cond, true, 'clsx({ "class": cond })');
  assert.equal(toks['text-lg'].cond, true, 'ternary branch');
  assert.equal(toks['text-sm'].cond, true, 'ternary else branch');
  assert.equal(toks['border-l-4'].cond, true);
  assert.equal(toks['text-2xl'].el.tag, 'h1');
  const tpl = d.strings.find((s) => s.isTemplate && /Hello/.test(s.value));
  assert.ok(tpl && !/\$\{/.test(tpl.value), 'template interpolations are dropped from the value');
});

test('markup: Vue directives, interpolation and scoped SCSS', () => {
  const d = doc('Comp.vue', `<script setup lang="ts">
const label = 'Save changes';
</script>
<template>
  <div :class="{ active: isActive, 'text-red-600': hasError }" class="p-4 rounded" @click="toggle" v-if="show">
    <span v-for="i in items" :key="i.id">{{ i.name }} items left</span>
    <button @click.prevent="save" :aria-label="label">Save</button>
  </div>
</template>
<style scoped lang="scss">
.p { color: var(--ink); &:hover { color: red; } }
</style>`);
  assert.deepEqual(d.errors, []);
  const div = d.elements.find((e) => e.tag === 'div');
  assert.deepEqual(div.attrs.map((a) => [a.name, a.lower]), [[':class', 'class'], ['class', 'class'], ['@click', '@click'], ['v-if', 'v-if']]);
  assert.deepEqual(d.texts.map((t) => [t.line, t.value]), [[6, 'items left'], [7, 'Save']], '{{ }} is not copy');
  assert.deepEqual(d.classTokens.map((t) => t.value).sort(), ['p-4', 'rounded', 'text-red-600']);
  assert.deepEqual(d.sheets[0].sheet.rules.map((r) => r.selector), ['.p', '.p:hover']);
  assert.equal(d.sheets[0].sheet.rules[1].line, 11);
  assert.equal(eventOf('@click.prevent'), 'click');
  assert.equal(normAttr(':class'), 'class');
});

test('markup: Svelte blocks, directives and shorthand attributes', () => {
  const d = doc('Toggle.svelte', `<script>
  export let open = false;
</script>
<button class="btn" class:active={open} on:click={() => (open = !open)} {disabled}>Toggle</button>
{#if open}<p transition:fade>Now open</p>{:else}<p>Closed</p>{/if}
{#each items as item (item.id)}<li>{item.name}</li>{/each}
<style>.btn { padding: 8px; }</style>`);
  assert.deepEqual(d.errors, []);
  const btn = d.elements.find((e) => e.tag === 'button');
  assert.deepEqual(btn.attrs.map((a) => a.name), ['class', 'class:active', 'on:click', 'disabled']);
  assert.equal(eventOf('on:click'), 'click');
  assert.deepEqual(d.texts.map((t) => t.value), ['Toggle', 'Now open', 'Closed']);
  assert.deepEqual(d.classTokens.map((t) => t.value), ['btn', 'active']);
  assert.equal(d.sheets[0].sheet.rules[0].line, 7);
});

test('markup: MDX fences (```, ~~~~, indented, unclosed), inline code and link targets are not copy', () => {
  const src = `---
title: Guide
---
import { Tip } from './Tip';

# Install

Run \`npm i\` and see [the docs](https://example.com/docs).

\`\`\`js
<p>Lorem ipsum</p>
\`\`\`

~~~~css
.x { transition: all 1s; }
~~~~

  \`\`\`
  indented fence <b>bold</b>
  \`\`\`

| Plan | Price |
|------|-------|
| Pro  | 10+   |

- item one
<Tip kind="note">Use **Node 20**.</Tip>

\`\`\`html
<p>an unclosed fence runs to the end</p>`;
  const blanked = blankMarkdownCode(src);
  assert.equal(blanked.length, src.length);
  assert.equal(blanked.split('\n').length, src.split('\n').length, 'newlines are kept');
  assert.ok(!/Lorem|transition|indented fence|unclosed|example\.com|npm i/.test(blanked));
  const d = doc('guide.mdx', src);
  assert.deepEqual(d.errors, []);
  assert.deepEqual(d.elements.map((e) => [e.tag, e.line]), [['Tip', 27]]);
  const kinds = Object.fromEntries(d.texts.map((t) => [t.line, t.md || t.kind]));
  assert.equal(kinds[6], 'heading');
  assert.equal(kinds[22], 'table');
  assert.equal(kinds[24], 'table');
  assert.equal(kinds[26], 'list');
  assert.equal(kinds[1], undefined, 'front-matter fences are not text');
  assert.ok(!d.texts.some((t) => /Lorem|unclosed/.test(t.value)));
  assert.deepEqual(d.imports.map((i) => i.source), ['./Tip']);
});

test('markup: styled-components templates (typed, .attrs, nested css``) parse as CSS with true lines', () => {
  const d = doc('styled.tsx', `import styled, { css } from 'styled-components';
const Row = styled.li<{ $active: boolean }>\`
  padding: \${({ theme }) => theme.space[2]}px 12px;
  color: \${(p) => p.theme.ink};
  \${(p) => p.$active && css\`
    background: #f00;
  \`}
  transition: opacity 150ms;
\`;
const Link = styled(BaseLink).attrs({ role: 'link' })\`gap: 4px;\`;
`);
  assert.deepEqual(d.errors, []);
  const all = d.sheets.flatMap((s) => s.sheet.rules.flatMap((r) => r.decls.map((x) => [x.prop, x.value.replace(/\s+/g, ' '), x.line])));
  assert.deepEqual(all.find((x) => x[0] === 'background'), ['background', '#f00', 6]);
  assert.deepEqual(all.find((x) => x[0] === 'color'), ['color', '$e', 4], 'an interpolation reads as a token reference');
  assert.deepEqual(all.find((x) => x[0] === 'transition'), ['transition', 'opacity 150ms', 8], 'a standalone interpolation ends its statement');
  assert.deepEqual(all.find((x) => x[0] === 'gap'), ['gap', '4px', 10]);
});

test('markup: HTML comments, script and style content, void elements and entities', () => {
  const d = doc('page.html', `<!doctype html><html lang="en"><head><style>body{margin:0}</style><script>const x = "<div>";</script></head>
<body><!-- <p>commented</p> --><img src=a.png alt="A &amp; B"><br><p>Tom &mdash; Jerry</p><input type=text disabled></body></html>`);
  assert.deepEqual(d.errors, []);
  assert.deepEqual(d.elements.map((e) => e.tag), ['html', 'head', 'style', 'script', 'body', 'img', 'br', 'p', 'input']);
  assert.deepEqual(d.texts.map((t) => t.value), ['Tom — Jerry']);
  assert.equal(d.elements.find((e) => e.tag === 'img').attrs.find((a) => a.name === 'alt').value, 'A & B');
  assert.equal(d.elements.find((e) => e.tag === 'p').parent.tag, 'body', 'void elements do not swallow siblings');
});

test('markup: class-list detection and malformed input', () => {
  assert.equal(looksLikeClassList('flex items-center gap-2'), true);
  assert.equal(looksLikeClassList('Save changes'), false);
  assert.equal(looksLikeClassList('transition: all 0.3s'), false);
  for (const [name, src] of [['a.tsx', '<div className="x" <<< {'], ['b.vue', '<template><div :class="{"></template>'], ['c.html', '<p <b>></'], ['d.mdx', '```\n<p>'], ['e.svelte', '{#if}{/each}<p']]) {
    assert.doesNotThrow(() => doc(name, src));
  }
});

// ---- tailwind.mjs -------------------------------------------------------------------------------------------

test('tailwind: variants, arbitrary values and important markers split correctly', () => {
  assert.deepEqual(splitClass('md:hover:bg-primary/90'), { variants: ['md', 'hover'], base: 'bg-primary/90', important: false });
  assert.deepEqual(splitClass('[&:hover]:bg-[url(a:b)]'), { variants: ['[&:hover]'], base: 'bg-[url(a:b)]', important: false });
  assert.deepEqual(splitClass('!p-4'), { variants: [], base: 'p-4', important: true });
  assert.deepEqual(splitClass('data-[state=open]:animate-in'), { variants: ['data-[state=open]'], base: 'animate-in', important: false });
});

test('tailwind: utility classification', () => {
  assert.deepEqual(colorUtility('bg-indigo-500'), { prefix: 'bg', kind: 'palette', family: 'indigo', shade: '500', alpha: null });
  assert.equal(colorUtility('text-muted-foreground').kind, 'token');
  assert.equal(colorUtility('bg-[#fff]').kind, 'literal');
  assert.equal(colorUtility('bg-[var(--brand)]').kind, 'var');
  assert.equal(colorUtility('fill-current').kind, 'keyword');
  for (const notColour of ['text-sm', 'text-2xl', 'border-2', 'bg-cover', 'shadow-lg', 'ring-2', 'outline-none', 'text-[14px]', 'bg-gradient-to-r']) assert.equal(colorUtility(notColour), null, notColour);
  assert.deepEqual(spacingUtility('p-1.5'), { prefix: 'p', px: 6, step: '1.5' });
  assert.deepEqual(spacingUtility('mt-[13px]'), { prefix: 'mt', px: 13, value: '13px', arbitrary: true });
  assert.equal(spacingUtility('px-[var(--gutter)]').token, true);
  assert.equal(spacingUtility('m-auto').skip, true);
  assert.deepEqual(radiusUtility('rounded-2xl'), { px: 16, full: false });
  assert.deepEqual(borderWidthUtility('border-l-4'), { side: 'l', px: 4 });
  assert.equal(borderWidthUtility('border-primary'), null);
  assert.equal(transitionUtility('transition-all').kind, 'all');
  assert.deepEqual(transitionUtility('transition-[max-height]').props, ['max-height']);
  assert.equal(animateUtility('animate-[wiggle_1s_ease-in-out_infinite]').name, 'wiggle');
  assert.deepEqual(transformUtility('-translate-y-1'), { kind: 'translate', axis: 'y', value: '1' });
  assert.equal(fontFamilyUtility('font-semibold'), null);
  assert.equal(fontFamilyUtility("font-['Fraunces',serif]").family, "'Fraunces',serif");
  assert.equal(isGradientUtility('bg-linear-to-r'), true);
  assert.deepEqual(easeBezier('ease-[cubic-bezier(0.68,-0.6,0.32,1.6)]'), [0.68, -0.6, 0.32, 1.6]);
});
