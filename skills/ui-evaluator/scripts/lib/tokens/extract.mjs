// Inventory the tokens a shipped build actually uses, from source: CSS custom properties (light and dark), SCSS
// variables, literal colours, families, sizes, spacing, radii, shadows, durations and easings, plus Tailwind classes
// mapped through the default scale. The result drafts an "as-built" DESIGN.md (setup workflow; IMP-051, IMP-053).
import path from 'node:path';
import { readText, walkFiles } from '../util/fs.mjs';
import { parseColor, toOklch, deltaEOK, toHex, extractColors } from '../util/color.mjs';
import { toPx } from './check.mjs';

const STYLE_EXT = new Set(['.css', '.scss', '.sass', '.less', '.pcss', '.postcss']);
const MARKUP_EXT = new Set(['.html', '.htm', '.vue', '.svelte', '.astro', '.jsx', '.tsx', '.js', '.ts', '.mjs', '.cjs', '.mdx']);

// --- a small CSS walker -----------------------------------------------------------------------

/** Yield {selector, atRules[], decls: [{prop, value}]} for every block, nested blocks included (SCSS-friendly). */
export function cssBlocks(css) {
  const src = String(css).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'])\/\/[^\n]*/g, '$1');
  const out = [];
  const stack = [{ selector: '', atRules: [], decls: [] }];
  let buf = '';
  let depthParen = 0;
  let quote = null;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quote) {
      buf += ch;
      if (ch === quote && src[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === '(') depthParen += 1;
    if (ch === ')') depthParen = Math.max(0, depthParen - 1);
    if (ch === '{' && depthParen === 0) {
      const prelude = buf.trim();
      buf = '';
      const parent = stack[stack.length - 1];
      const isAt = prelude.startsWith('@');
      const node = {
        selector: isAt ? parent.selector : nestSelector(parent.selector, prelude),
        atRules: isAt ? [...parent.atRules, prelude] : parent.atRules,
        decls: [],
      };
      stack.push(node);
      continue;
    }
    if (ch === '}' && depthParen === 0) {
      pushDecl(stack[stack.length - 1], buf);
      buf = '';
      const node = stack.pop();
      if (node && node.decls.length) out.push(node);
      if (!stack.length) stack.push({ selector: '', atRules: [], decls: [] });
      continue;
    }
    if (ch === ';' && depthParen === 0) {
      pushDecl(stack[stack.length - 1], buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  pushDecl(stack[0], buf);
  if (stack[0].decls.length) out.push(stack[0]);
  return out;
}

function nestSelector(parent, child) {
  if (!parent) return child;
  if (child.includes('&')) return child.replace(/&/g, parent);
  return `${parent} ${child}`;
}

function pushDecl(node, raw) {
  const t = raw.trim();
  if (!t || !node) return;
  const m = t.match(/^(\$[\w-]+|--[\w-]+|[a-zA-Z-]+)\s*:\s*([\s\S]+)$/);
  if (m) node.decls.push({ prop: m[1].toLowerCase(), value: m[2].replace(/\s*!important\s*$/i, '').trim() });
}

const isDarkContext = (b) => b.atRules.some((a) => /prefers-color-scheme\s*:\s*dark/i.test(a)) || /(^|[\s.[:])(dark|theme-dark)\b|data-theme\s*=\s*["']?dark|\[data-mode=["']?dark/i.test(b.selector);
const isRootLike = (sel) => !sel || /(^|,)\s*(:root|html|body|:host|\.light|\.dark|\[data-theme[^\]]*\]|\[data-mode[^\]]*\])\s*(,|$)/i.test(sel) || /^@theme/.test(sel);

// --- Tailwind default scale (v3 defaults; v4 differs slightly for radius names) -------------------

const TW_TEXT = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60, '7xl': 72, '8xl': 96, '9xl': 128 };
const TW_ROUNDED = { none: 0, sm: 2, '': 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, full: 9999 };
const TW_WEIGHT = { thin: 100, extralight: 200, light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 };
const TW_LEADING = { none: 1, tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2 };

function twSpacing(v) {
  if (v === 'px') return 1;
  const n = Number(v);
  return Number.isFinite(n) ? n * 4 : NaN;
}

// --- inventory ---------------------------------------------------------------------------------

class Counter {
  constructor() {
    this.m = new Map();
  }
  add(k, n = 1, meta) {
    if (k === undefined || k === null || k === '' || (typeof k === 'number' && !Number.isFinite(k))) return;
    const cur = this.m.get(k) || { value: k, count: 0, meta: {} };
    cur.count += n;
    if (meta) for (const [mk, mv] of Object.entries(meta)) cur.meta[mk] = (cur.meta[mk] || 0) + mv;
    this.m.set(k, cur);
  }
  top(n = Infinity) {
    return [...this.m.values()].sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value))).slice(0, n);
  }
}

const PROP_KIND = (p) => (/^(color|-webkit-text-fill-color|caret-color)$/.test(p) ? 'text' : /background|^fill$/.test(p) ? 'fill' : /border|outline|stroke|divide|ring/.test(p) ? 'edge' : /shadow/.test(p) ? 'shadow' : 'other');

/**
 * Scan a project directory.
 * @returns inventory object (see uie tokens extract --json)
 */
export function inventory(root, { max = 6000 } = {}) {
  const files = walkFiles(root, { exts: new Set([...STYLE_EXT, ...MARKUP_EXT]), max });
  const vars = { light: {}, dark: {} };
  const scssVars = {};
  const colors = new Counter();
  const families = new Counter();
  const headingFamilies = new Counter();
  const sizes = new Counter();
  const lineHeights = new Counter();
  const weights = new Counter();
  const spacing = new Counter();
  const radii = new Counter();
  const shadows = new Counter();
  const durations = new Counter();
  const easings = new Counter();
  const twClasses = new Counter();
  const twHues = new Counter();
  let darkMethod = null;
  let tailwindConfig = null;
  let styleFiles = 0;
  let markupFiles = 0;

  const bodySizes = new Counter();
  const handleDecls = (block, origin) => {
    const dark = isDarkContext(block);
    if (dark && !darkMethod) darkMethod = block.atRules.some((a) => /prefers-color-scheme/.test(a)) ? 'prefers-color-scheme' : 'class or attribute';
    const heading = /(^|[\s,>])(h1|h2|h3|\.?(heading|headline|title|display|hero))\b/i.test(block.selector);
    for (const { prop, value } of block.decls) {
      if (prop.startsWith('--')) {
        if (isRootLike(block.selector) || block.atRules.some((a) => /^@theme/.test(a))) (dark ? vars.dark : vars.light)[prop] = value;
        continue;
      }
      if (prop.startsWith('$')) {
        scssVars[prop] = value;
        continue;
      }
      for (const c of extractColors(value)) colors.add(normColorText(c.text), 1, { [PROP_KIND(prop)]: 1, [origin]: 1 });
      if (prop === 'font-family') {
        const fam = firstFamily(value);
        if (fam) {
          families.add(fam);
          if (heading) headingFamilies.add(fam);
        }
      } else if (prop === 'font') {
        const fam = value.match(/(?:\d[\w.%]*\s+)+(?:\/\s*[\w.%]+\s+)?(.+)$/);
        if (fam) families.add(firstFamily(fam[1]));
      } else if (prop === 'font-size') {
        sizes.add(roundPx(toPx(value)));
        if (/(^|[\s,])(html|body|p|main|article)\s*($|,)/i.test(block.selector)) bodySizes.add(roundPx(toPx(value)));
      }
      else if (prop === 'line-height' && /^[\d.]+$/.test(value)) lineHeights.add(Number(value));
      else if (prop === 'font-weight' && /^\d{3}$/.test(value)) weights.add(Number(value), 1, heading ? { heading: 1 } : { text: 1 });
      else if (/^(margin|padding|gap|row-gap|column-gap|inset)(-|$)/.test(prop)) {
        for (const part of value.split(/\s+/)) {
          const px = toPx(part);
          if (Number.isFinite(px) && px >= 0) spacing.add(roundPx(px));
        }
      } else if (/^border(-[a-z]+)*-radius$/.test(prop)) {
        const first = value.split(/\s+/)[0];
        if (/%$/.test(first)) radii.add(first === '50%' ? 9999 : first);
        else radii.add(roundPx(toPx(first)));
      } else if (prop === 'box-shadow' && value !== 'none') shadows.add(value.replace(/\s+/g, ' '));
      else if (/^(transition|animation)(-duration)?$/.test(prop)) {
        for (const m of value.matchAll(/(?<![\w-])([\d.]+)(ms|s)\b/g)) durations.add(m[2] === 's' ? Number(m[1]) * 1000 : Number(m[1]));
        for (const m of value.matchAll(/cubic-bezier\([^)]*\)|\b(ease-in-out|ease-in|ease-out|linear|ease)\b/g)) easings.add(m[0].replace(/\s+/g, ''));
      } else if (/^(transition|animation)-timing-function$/.test(prop)) easings.add(value.replace(/\s+/g, ''));
    }
  };

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file);
    let text;
    try {
      text = readText(file);
    } catch {
      continue;
    }
    if (text.length > 2_000_000) continue;
    if (/^tailwind\.config\.(js|cjs|mjs|ts)$/.test(base)) tailwindConfig = path.relative(root, file);
    if (STYLE_EXT.has(ext)) {
      styleFiles += 1;
      for (const b of cssBlocks(text)) handleDecls(b, 'css');
      continue;
    }
    markupFiles += 1;
    for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) for (const b of cssBlocks(m[1])) handleDecls(b, 'css');
    // Fonts loaded by link, next/font or @fontsource.
    for (const m of text.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'\s>]+)/g)) {
      for (const f of m[1].matchAll(/family=([^:&]+)/g)) families.add(decodeURIComponent(f[1]).replace(/\+/g, ' '), 2);
    }
    for (const m of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]next\/font\/google['"]/g)) {
      for (const n of m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean)) families.add(n.replace(/_/g, ' '), 2);
    }
    for (const m of text.matchAll(/['"]@fontsource(?:-variable)?\/([\w-]+)/g)) families.add(m[1].split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '), 2);
    if (/^tailwind\.config\./.test(base)) {
      for (const m of text.matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"](#[0-9a-fA-F]{3,8})['"]/g)) colors.add(normColorText(m[2]), 1, { config: 1 });
      const ff = text.match(/fontFamily\s*:\s*\{([\s\S]*?)\}/);
      if (ff) for (const f of ff[1].matchAll(/\[\s*['"]([^'"]+)['"]/g)) families.add(f[1], 2);
      continue;
    }
    // Tailwind classes in class / className attributes and class-merging calls.
    const classText = [...text.matchAll(/\bclass(?:Name)?\s*=\s*(?:\{\s*)?[`"']([^`"']+)[`"']/g), ...text.matchAll(/\b(?:clsx|cn|cva|twMerge|classnames)\(([^)]*)\)/g)].map((m) => m[1]).join(' ');
    for (const cls of classText.split(/[\s"'`,{}()]+/).filter(Boolean)) {
      const c = cls.replace(/^([a-z0-9-]+:)+/, ''); // drop variants (md:, hover:, dark:)
      if (!/^[a-z!-]/.test(c)) continue;
      twClasses.add(c);
      let m;
      if ((m = c.match(/^text-(xs|sm|base|lg|[2-9]?xl)$/))) sizes.add(TW_TEXT[m[1]], 1);
      else if ((m = c.match(/^rounded(?:-[trbl]{1,2})?(?:-(none|sm|md|lg|xl|2xl|3xl|full))?$/))) radii.add(TW_ROUNDED[m[1] || '']);
      else if ((m = c.match(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/))) weights.add(TW_WEIGHT[m[1]], 1, { text: 1 });
      else if ((m = c.match(/^leading-(none|tight|snug|normal|relaxed|loose)$/))) lineHeights.add(TW_LEADING[m[1]]);
      else if ((m = c.match(/^-?(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y)-(px|\d+(?:\.\d+)?)$/))) spacing.add(roundPx(twSpacing(m[1])));
      else if ((m = c.match(/^shadow(?:-(sm|md|lg|xl|2xl|inner))?$/))) shadows.add(`tailwind shadow${m[1] ? `-${m[1]}` : ''}`);
      else if ((m = c.match(/^duration-(\d+)$/))) durations.add(Number(m[1]));
      else if ((m = c.match(/^ease-(linear|in|out|in-out)$/))) easings.add(`tailwind ease-${m[1]}`);
      if ((m = c.match(/^(?:bg|text|border|from|via|to|ring|fill|stroke|outline|decoration|shadow)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(\d{2,3})(?:\/\d+)?$/))) twHues.add(m[1]);
      if ((m = c.match(/\[(#[0-9a-fA-F]{3,8}|(?:rgb|hsl|oklch)\([^\]]+\))\]/))) colors.add(normColorText(m[1].replace(/_/g, ' ')), 1, { tailwind: 1 });
    }
    // Inline style colours and colours in JS theme objects.
    for (const c of extractColors(text.replace(/<style[\s\S]*?<\/style>/gi, ''))) colors.add(normColorText(c.text), 1, { script: 1 });
  }

  return {
    root,
    files: { style: styleFiles, markup: markupFiles, total: files.length, truncated: files.length >= max },
    custom_properties: { light: resolveVars(vars.light, vars.light), dark: resolveVars(vars.dark, vars.light) },
    scss_variables: scssVars,
    colors: clusterColors(colors.top()),
    families: families.top(12).map((x) => ({ name: x.value, count: x.count })),
    heading_families: headingFamilies.top(5).map((x) => ({ name: x.value, count: x.count })),
    font_sizes: sizes.top(24).map((x) => ({ px: x.value, count: x.count })),
    body_size: bodySizes.top(1)[0]?.value ?? null,
    line_heights: lineHeights.top(8).map((x) => ({ value: x.value, count: x.count })),
    font_weights: weights.top(9).map((x) => ({ value: x.value, count: x.count, heading: x.meta.heading || 0 })),
    spacing: spacing.top(24).map((x) => ({ px: x.value, count: x.count })),
    radii: radii.top(12).map((x) => ({ value: x.value, count: x.count })),
    shadows: shadows.top(12).map((x) => ({ value: x.value, count: x.count })),
    durations_ms: durations.top(12).map((x) => ({ ms: x.value, count: x.count })),
    easings: easings.top(8).map((x) => ({ value: x.value, count: x.count })),
    dark_method: darkMethod,
    tailwind: { config: tailwindConfig, classes: twClasses.top(60).map((x) => ({ name: x.value, count: x.count })), hue_families: twHues.top(10).map((x) => ({ name: x.value, count: x.count })) },
  };
}

const roundPx = (n) => (Number.isFinite(n) ? Math.round(n * 2) / 2 : NaN);

function firstFamily(value) {
  const first = String(value || '').split(',')[0].trim().replace(/^["']|["']$/g, '');
  if (!first || /^var\(/.test(first) || /^(inherit|initial|unset|revert)$/.test(first)) return null;
  return first;
}

/** "222.2 84% 4.9%" (shadcn) → hsl(); keep other colour strings as written. */
function normColorText(t) {
  const s = String(t).trim();
  if (/^[\d.]+\s+[\d.]+%\s+[\d.]+%(\s*\/\s*[\d.]+%?)?$/.test(s)) return `hsl(${s})`;
  return s.startsWith('#') ? s.toLowerCase() : s.replace(/\s+/g, ' ');
}

/** Resolve var() references and bare HSL triplets in custom-property values. */
function resolveVars(map, fallbackMap) {
  const out = {};
  const get = (name, depth = 0) => {
    if (depth > 8) return null;
    const raw = map[name] ?? fallbackMap[name];
    if (raw === undefined) return null;
    const v = String(raw).replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, (_, n, fb) => get(n, depth + 1) ?? fb ?? '');
    return v.trim();
  };
  for (const name of Object.keys(map)) out[name] = normColorText(get(name));
  return out;
}

/** Merge near-identical colours (ΔE_OK < 0.02) and keep counts per use. */
function clusterColors(list) {
  const clusters = [];
  for (const item of list) {
    const c = parseColor(item.value);
    if (!c || c.alpha === 0) continue;
    const hit = clusters.find((k) => deltaEOK(k.color, c) < 0.02 && Math.abs((k.color.alpha ?? 1) - (c.alpha ?? 1)) < 0.05);
    if (hit) {
      hit.count += item.count;
      hit.variants.push(item.value);
      for (const [mk, mv] of Object.entries(item.meta)) hit.uses[mk] = (hit.uses[mk] || 0) + mv;
    } else clusters.push({ value: item.value, color: c, count: item.count, variants: [item.value], uses: { ...item.meta } });
  }
  return clusters
    .sort((a, b) => b.count - a.count)
    .map((k) => {
      const o = toOklch(k.color);
      return { value: k.value, hex: toHex(k.color), count: k.count, uses: k.uses, oklch: { l: +o.l.toFixed(3), c: +o.c.toFixed(3), h: +o.h.toFixed(1) }, alpha: k.color.alpha ?? 1, variants: k.variants.slice(0, 5) };
    });
}

// --- role mapping and the as-built DESIGN.md ------------------------------------------------------

const ROLE_NAMES = [
  ['surface', /^(background|bg|surface|canvas|page|base|body-bg|color-background|color-bg)$/],
  ['on-surface', /^(foreground|fg|text|ink|on-background|on-surface|body|color-foreground|color-text|text-primary)$/],
  ['surface-container', /^(card|panel|surface-1|surface-container|muted|color-card|bg-subtle|bg-muted)$/],
  ['surface-container-high', /^(popover|overlay|surface-2|surface-container-high|elevated|color-popover)$/],
  ['on-surface-variant', /^(muted-foreground|text-muted|text-secondary|secondary-text|on-surface-variant|subtle|text-subtle|color-muted-foreground)$/],
  ['outline-variant', /^(border|divider|input|outline-variant|border-subtle|color-border)$/],
  ['outline', /^(outline|border-strong|border-emphasis)$/],
  ['focus', /^(ring|focus|focus-ring|color-ring)$/],
  ['primary', /^(primary|brand|accent-primary|action|color-primary|brand-primary)$/],
  ['on-primary', /^(primary-foreground|on-primary|on-brand|color-primary-foreground)$/],
  ['selection', /^(accent|selection|highlight|color-accent)$/],
  ['error', /^(destructive|danger|error|color-destructive)$/],
  ['on-error', /^(destructive-foreground|on-error|danger-foreground)$/],
  ['success', /^(success|positive)$/],
  ['warning', /^(warning|caution)$/],
  ['info', /^(info|notice)$/],
];

function roleFor(varName) {
  const n = varName.replace(/^--/, '').replace(/^(color|colors|clr|c|tw-color)-/, '').toLowerCase();
  for (const [role, re] of ROLE_NAMES) if (re.test(n)) return role;
  return null;
}

/** Map custom properties to colour roles; fall back to usage frequency. */
export function inferRoles(inv) {
  const pick = (vars) => {
    const roles = {};
    const others = {};
    for (const [name, value] of Object.entries(vars)) {
      if (!parseColor(value)) continue;
      const role = roleFor(name);
      if (role && !roles[role]) roles[role] = { value, from: name };
      else if (!role) others[name.replace(/^--/, '')] = value;
    }
    return { roles, others };
  };
  const light = pick(inv.custom_properties.light);
  const dark = pick(inv.custom_properties.dark);
  if (!light.roles.surface || !light.roles['on-surface']) {
    const fills = inv.colors.filter((c) => (c.uses.fill || 0) > 0 && c.alpha > 0.95);
    const texts = inv.colors.filter((c) => (c.uses.text || 0) > 0 && c.alpha > 0.95);
    if (!light.roles.surface && fills[0]) light.roles.surface = { value: fills[0].value, from: `most used fill (${fills[0].count}×)` };
    if (!light.roles['on-surface'] && texts[0]) light.roles['on-surface'] = { value: texts[0].value, from: `most used text colour (${texts[0].count}×)` };
    if (!light.roles.primary) {
      const sat = inv.colors.find((c) => c.oklch.c > 0.08 && c.alpha > 0.95);
      if (sat) light.roles.primary = { value: sat.value, from: `most used saturated colour (${sat.count}×)` };
    }
  }
  return { light, dark };
}

const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
/** Colour value for the front matter: hex for sRGB notations the official linter certainly reads; oklch kept as written. */
const colorOut = (v) => {
  const s = String(v).trim();
  if (/^(oklch|oklab|#)/i.test(s)) return s;
  const c = parseColor(s);
  return c ? toHex(c) : s;
};
const ROLE_ORDER = ['surface', 'surface-container', 'surface-container-high', 'on-surface', 'on-surface-variant', 'outline', 'outline-variant', 'primary', 'primary-hover', 'on-primary', 'focus', 'selection', 'error', 'on-error', 'success', 'warning', 'info'];

/** Draft DESIGN.md text with status as-built. Judgment fields stay as placeholders for the direct/setup workflow. */
export function draftDesignMd(inv, { name = 'Product', surfaces = [] } = {}) {
  const { light, dark } = inferRoles(inv);
  const lines = ['---', '# Drafted by `uie tokens extract` from the shipped source. Status as-built: it records what ships and', '# endorses nothing; a pattern the audit rejects is never canonised here (IMP-051). Replace every <placeholder>.', 'version: alpha', `name: ${q(`${name} interface (as built)`)}`, `description: ${q('As-built record of the tokens the current build uses; not a direction.')}`, 'colors:'];
  const roleKeys = ROLE_ORDER.filter((r) => light.roles[r]);
  for (const r of roleKeys) lines.push(`  ${r}: ${q(colorOut(light.roles[r].value))}   # from ${light.roles[r].from}${colorOut(light.roles[r].value) !== light.roles[r].value ? ` = ${light.roles[r].value}` : ''}`);
  const extra = Object.entries(light.others).slice(0, 12);
  for (const [k, v] of extra) lines.push(`  ${k}: ${q(colorOut(v))}`);
  if (!roleKeys.length && !extra.length) for (const c of inv.colors.slice(0, 6)) lines.push(`  color-${inv.colors.indexOf(c) + 1}: ${q(colorOut(c.value))}   # used ${c.count}×`);

  // Typography roles from size frequency.
  const sizes = inv.font_sizes.filter((s) => s.px >= 10);
  const bodyCand = sizes.filter((s) => s.px >= 14 && s.px <= 20).sort((a, b) => b.count - a.count || Math.abs(a.px - 16) - Math.abs(b.px - 16))[0];
  const body = inv.body_size || bodyCand?.px || 16;
  const labelCand = sizes.filter((s) => s.px < body && s.px >= 11).sort((a, b) => b.count - a.count)[0];
  const larger = [...new Set(sizes.filter((s) => s.px >= body * 1.1).map((s) => s.px))].sort((a, b) => b - a);
  const textFamily = inv.families[0]?.name || '<text family>';
  const displayFamily = inv.heading_families[0]?.name && inv.heading_families[0].name !== textFamily ? inv.heading_families[0].name : textFamily;
  const headingWeight = inv.font_weights.filter((w) => w.heading).sort((a, b) => b.heading - a.heading)[0]?.value || 600;
  const bodyLh = inv.line_heights.filter((l) => l.value >= 1.3 && l.value <= 2).sort((a, b) => b.count - a.count)[0]?.value || 1.5;
  const px = (n) => `${+(n / 16).toFixed(4)}rem`;
  lines.push('typography:');
  const roleDefs = [];
  if (larger[0] && larger[0] >= 32) roleDefs.push(['display', larger.shift(), displayFamily, headingWeight, 1.1]);
  if (larger[0]) roleDefs.push(['headline', larger.shift(), displayFamily, headingWeight, 1.2]);
  if (larger[0]) roleDefs.push(['title', larger.shift(), textFamily, headingWeight, 1.3]);
  roleDefs.push(['body', body, textFamily, 400, bodyLh]);
  if (labelCand) roleDefs.push(['label', labelCand.px, textFamily, 500, 1.25]);
  for (const [role, size, fam, w, lh] of roleDefs) lines.push(`  ${role}: {fontFamily: ${q(fam)}, fontSize: ${px(size)}, fontWeight: ${w}, lineHeight: ${lh}}`);

  const radii = inv.radii.filter((r) => typeof r.value === 'number').map((r) => r.value);
  const distinctR = [...new Set(radii)].sort((a, b) => a - b);
  const rNames = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'];
  const rounded = [];
  if (distinctR.includes(0)) rounded.push('none: 0px');
  distinctR.filter((r) => r > 0 && r < 9999).slice(0, rNames.length).forEach((r, i) => rounded.push(`${rNames[i]}: ${r}px`));
  if (distinctR.includes(9999)) rounded.push('full: 9999px');
  lines.push(`rounded: {${(rounded.length ? rounded : ['none: 0px']).join(', ')}}`);

  const sp = [...new Set(inv.spacing.filter((s) => s.px > 0).sort((a, b) => b.count - a.count).slice(0, 8).map((s) => s.px))].sort((a, b) => a - b);
  const spNames = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
  lines.push(`spacing: {${(sp.length ? sp : [4, 8, 16, 24, 32]).map((v, i) => `${spNames[i]}: ${v}px`).join(', ')}}`);

  lines.push('components:');
  if (light.roles.surface && light.roles['on-surface']) lines.push('  page: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.body}"}');
  if (light.roles.primary && light.roles['on-primary']) lines.push(`  button-primary: {backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.${labelCand ? 'label' : 'body'}}"}`);
  if (light.roles['surface-container'] && light.roles['on-surface']) lines.push('  panel: {backgroundColor: "{colors.surface-container}", textColor: "{colors.on-surface}"}');

  lines.push('ui-evaluator:', '  status: as-built');
  lines.push('  surface_choices:');
  if (surfaces.length) for (const s of surfaces) lines.push(`    - {id: ${q(s.id)}, color_strategy: "<restrained | committed | full-palette | drenched>", motion: "<calm | balanced | bold>"}`);
  else lines.push('    - {id: "<surface id from PRODUCT.md>", color_strategy: "<…>", motion: "<…>"}');
  lines.push('  brand_attributes:', '    - {is: "<attribute>", not: "<its near miss>"}');
  const darkKeys = ROLE_ORDER.filter((r) => dark.roles[r]);
  lines.push('  themes:', `    shipped: [light${darkKeys.length ? ', dark' : ''}]`, '    use_scene: "<who, where, in what light>"');
  if (darkKeys.length) {
    lines.push(`    dark:   # ${inv.dark_method || 'dark rules found'}`, '      colors:');
    for (const r of darkKeys) lines.push(`        ${r}: ${q(colorOut(dark.roles[r].value))}`);
  } else lines.push('    dark: {}');
  lines.push('  type:', `    families: ${q([...new Set([textFamily, displayFamily])].join(' + '))}`);
  const shadowsTop = inv.shadows.slice(0, 4);
  lines.push('  elevation:', `    approach: "<flat | borders | tonal surfaces | shadows>"   # ${inv.shadows.length} distinct shadow style(s) in source`);
  lines.push(`    shadows: {${shadowsTop.map((s, i) => `level-${i + 1}: ${q(s.value)}`).join(', ')}}`);
  const dur = inv.durations_ms.map((d) => d.ms);
  const fb = dur.find((d) => d <= 200);
  const state = dur.find((d) => d <= 300);
  const overlay = dur.find((d) => d > 300 && d <= 600);
  lines.push('  motion:', `    duration_ms: {feedback: ${fb ?? '"<n>"'}, state: ${state ?? '"<n>"'}, overlay_enter: ${overlay ?? '"<n>"'}, overlay_exit: ${overlay ?? '"<n>"'}, scrim: "<n>", focal: none, stagger: "<n>"}`);
  const ease = inv.easings.find((e) => /cubic-bezier/.test(e.value))?.value;
  lines.push(`    easing: {enter: ${q(ease || '<cubic-bezier()>')}, exit: ${q(ease || '<cubic-bezier()>')}, move: ${q(ease || '<cubic-bezier()>')}}`);
  lines.push('    springs: none', '    reduced_motion: "<what remains under reduce>"');
  lines.push('  copy:', '    case: {buttons: "<sentence | title>", headings: "<sentence | title>", navigation: "<…>", labels: "<…>"}');
  lines.push('  declared_exceptions: []', '  accepted_tells: []', '  waivers: ".ui-evaluator/waivers.json"', '---', '');

  // Body: measured facts, so the identity lock can be written from evidence (direction-process.md).
  const topColors = inv.colors.slice(0, 8).map((c) => `${c.value} (${c.count}×)`).join(', ');
  lines.push(`# ${name} design system (as built)`, '');
  lines.push('<!-- Drafted from source by uie tokens extract. Every statement below is a measurement of the current build, not a', 'recommendation. Write the identity lock sentence first (direction-process.md), then fill the sections. -->', '');
  lines.push('## Overview', '', '[Identity lock: one sentence recording the colours in use as roles, the loaded fonts, the layout topology, the surface treatment and the voice, measured from the shipped build.]', '');
  lines.push('## Colors', '', `As built: ${inv.colors.length} distinct colours after merging near-identical values; most used: ${topColors || 'none found'}.${inv.tailwind.hue_families.length ? ` Tailwind hue families in classes: ${inv.tailwind.hue_families.map((h) => `${h.name} (${h.count})`).join(', ')}.` : ''}${darkKeys.length ? ` Dark theme via ${inv.dark_method}.` : ' No dark theme found.'}`, '');
  lines.push('## Typography', '', `As built: families ${inv.families.map((f) => `${f.name} (${f.count})`).join(', ') || 'none declared'}; sizes ${inv.font_sizes.slice(0, 10).map((s) => `${s.px}px (${s.count})`).join(', ') || 'none found'}.`, '');
  lines.push('## Layout', '', `As built: most used spacing values ${inv.spacing.slice(0, 10).map((s) => `${s.px}px (${s.count})`).join(', ') || 'none found'}.`, '');
  lines.push('## Elevation & Depth', '', `As built: ${inv.shadows.length} distinct shadow style(s)${inv.shadows.length ? `; most used ${inv.shadows[0].value}` : ''}.`, '');
  lines.push('## Shapes', '', `As built: radii ${inv.radii.map((r) => `${r.value === 9999 ? 'full' : typeof r.value === 'number' ? `${r.value}px` : r.value} (${r.count})`).join(', ') || 'none found'}.`, '');
  lines.push('## Components', '', '[Components in use and their states; see knowledge/components-states.md §3.]', '');
  lines.push("## Do's and Don'ts", '', '- Do [...]', "- Don't [...]", '');
  lines.push('## Motion', '', `As built: durations ${inv.durations_ms.map((d) => `${d.ms}ms (${d.count})`).join(', ') || 'none found'}; easings ${inv.easings.map((e) => e.value).join(', ') || 'none found'}.`, '');
  lines.push('## Voice and tone', '', '[Voice and tone positions; glossary.]', '');
  lines.push('## Decisions log', '', `- ${new Date().toISOString().slice(0, 10)}: drafted as built by uie tokens extract; not endorsed.`, '');
  return lines.join('\n');
}
