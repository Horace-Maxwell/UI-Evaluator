// Derived views of a parsed document shared by the rule families: flattened CSS rules (stylesheets, <style>
// blocks, styled templates and inline styles), parsed class tokens per element, copy segments with context,
// and element roles (call to action, section, page file). Results are memoised on the document.
import { splitClass } from './tailwind.mjs';
import { attr, attrValue, ancestors, elementText, normAttr } from './markup.mjs';

function memo(doc, key, fn) {
  doc._memo = doc._memo || {};
  if (!(key in doc._memo)) doc._memo[key] = fn();
  return doc._memo[key];
}

/** Every CSS rule in the document, with inline styles as `[style]` rules attached to their element. */
export function cssRules(doc) {
  return memo(doc, 'cssRules', () => {
    const out = [];
    for (const s of doc.sheets) for (const r of s.sheet.rules) out.push({ ...r, sheetKind: s.kind });
    for (const st of doc.inlineStyles) {
      if (!st.decls.length) continue;
      const p = doc.pos(st.offset);
      out.push({ selector: '[style]', raw: '[style]', offset: st.offset, line: p.line, col: p.col, decls: st.decls, media: [], at: [], starting: false, inline: true, el: st.el, sheetKind: 'inline' });
    }
    return out;
  });
}

export function keyframesOf(doc) {
  return memo(doc, 'kf', () => doc.sheets.flatMap((s) => s.sheet.keyframes));
}

export function fontFacesOf(doc) {
  return memo(doc, 'ff', () => doc.sheets.flatMap((s) => s.sheet.fontFaces));
}

export function cssImportsOf(doc) {
  return memo(doc, 'imports', () => doc.sheets.flatMap((s) => s.sheet.imports));
}

/** All declarations with their rule (and @apply expanded to class tokens elsewhere). */
export function allDecls(doc) {
  return memo(doc, 'decls', () => cssRules(doc).flatMap((r) => r.decls.map((d) => ({ ...d, rule: r }))));
}

/** Parsed class tokens: [{ value, offset, el, owner, variants, base, important }]. */
export function classTokens(doc) {
  return memo(doc, 'classTokens', () => {
    const out = doc.classTokens.map((t) => ({ ...t, ...splitClass(t.value) }));
    // @apply in stylesheets: utilities applied to a selector.
    for (const r of cssRules(doc)) {
      for (const d of r.decls) {
        if (d.prop !== '@apply') continue;
        const re = /\S+/g;
        let m;
        while ((m = re.exec(d.value))) out.push({ value: m[0], offset: (d.valueOffset ?? d.offset) + m.index, el: null, owner: r.selector, apply: r, ...splitClass(m[0]) });
      }
    }
    return out;
  });
}

/** Class tokens grouped per element (index) and per loose class string (offset of the string). */
export function classGroups(doc) {
  return memo(doc, 'classGroups', () => {
    const byEl = new Map();
    const loose = new Map();
    for (const t of classTokens(doc)) {
      if (t.el) {
        if (!byEl.has(t.el)) byEl.set(t.el, []);
        byEl.get(t.el).push(t);
      } else {
        const key = t.apply ? `apply:${t.apply.offset}` : `str:${t.owner || ''}:${t.str ?? t.offset}`;
        if (!loose.has(key)) loose.set(key, { owner: t.owner, apply: t.apply || null, key: t.key || null, tokens: [] });
        loose.get(key).tokens.push(t);
      }
    }
    return { byEl, loose: [...loose.values()] };
  });
}

export function elTokens(doc, el) {
  return classGroups(doc).byEl.get(el) || [];
}

// ---- element roles ---------------------------------------------------------------------------------

const BUTTONISH_CLASS = /(?:^|[-_\s])(?:btn|button|cta)(?:$|[-_\s])/i;

/** A call to action: <button>, submit inputs, role=button, Button-like components, or links styled as buttons. */
export function isCta(doc, el) {
  if (!el || el.tag === '#fragment' || el.tag === '#mdx') return false;
  const lower = el.lower;
  if (lower === 'button') return true;
  if (lower === 'input') {
    const t = String(attrValue(el, 'type') || '').toLowerCase();
    return t === 'submit' || t === 'button';
  }
  if (String(attrValue(el, 'role') || '') === 'button') return true;
  const leaf = el.tag.split('.').pop();
  if (el.isComponent && /(?:^|[a-z])(?:Button|Btn|CTA|Cta|CallToAction)$|^(?:Button|Btn|CTA|Cta)/.test(leaf)) return true;
  if (lower === 'a' || (el.isComponent && /^(?:Link|NavLink|RouterLink|NuxtLink)$/.test(leaf))) {
    const cls = attr(el, 'class');
    const clsText = cls && typeof cls.value === 'string' ? cls.value : '';
    if (BUTTONISH_CLASS.test(clsText)) return true;
    const toks = elTokens(doc, el).map((t) => t.base);
    const filled = toks.some((b) => /^bg-(?!clip|gradient|linear|radial|conic|none|transparent|cover|center|no-repeat|fixed)/.test(b));
    const padded = toks.some((b) => /^(?:px|py|p)-/.test(b));
    if (filled && padded) return true;
    if (String(attrValue(el, 'variant') || '').length && el.isComponent) return true;
  }
  return false;
}

export function isSectionLevel(el) {
  if (!el) return false;
  if (el.lower === 'section' || el.tag === 'motion.section' || /\.section$/.test(el.tag)) return true;
  if (el.isComponent && /Section$/.test(el.tag)) return true;
  return false;
}

/** Page-level files: routes and pages of the common frameworks, plain HTML pages, MDX documents. */
export function isPageFile(doc) {
  const r = `/${doc.rel}`;
  if (/\.(?:html?|mdx)$/i.test(r)) return true;
  if (/\/(?:pages|routes|views|screens)\//i.test(r)) return true;
  if (/\/app\/(?:.*\/)?page\.[jt]sx?$/i.test(r) || /\/\+page\.svelte$/i.test(r)) return true;
  if (/\/(?:App|Home|Landing|LandingPage|HomePage|Index)\.(?:[jt]sx|vue|svelte|astro)$/.test(r)) return true;
  return doc.elements.some((e) => e.lower === 'main' || e.lower === 'body');
}

export function hasAncestor(el, pred) {
  for (const a of ancestors(el)) if (pred(a)) return true;
  return false;
}

const CODE_TAGS = new Set(['code', 'pre', 'kbd', 'samp', 'script', 'style', 'var', 'tt']);

export function inCode(el) {
  if (!el) return false;
  if (CODE_TAGS.has(el.lower)) return true;
  return hasAncestor(el, (a) => CODE_TAGS.has(a.lower) || /^(?:Code|CodeBlock|Pre|Highlight|SyntaxHighlighter|Prism)$/.test(a.tag));
}

export function inQuote(el) {
  if (!el) return false;
  const q = (e) => e.lower === 'blockquote' || e.lower === 'q' || e.lower === 'cite' || (e.isComponent && /Testimonial|Quote|Review/.test(e.tag));
  return q(el) || hasAncestor(el, q);
}

const TABLE_EL = (e) => /^(?:td|th|tr|table|tbody|thead|tfoot)$/.test(e.lower) || (e.isComponent && /^(?:Table(?:Cell|Row|Head|Header|Body|Footer)?|Td|Th|Tr|DataTable|DataGrid|Cell)$/.test(e.tag.split('.').pop()));

/** Inside an <article>: long-form content, where numbers and example names are content rather than UI claims. */
export function inArticle(el) {
  if (!el) return false;
  const art = (e) => e.lower === 'article';
  return art(el) || hasAncestor(el, art);
}

/** Inside a data table (HTML or component table cells). */
export function inTable(el) {
  if (!el) return false;
  return TABLE_EL(el) || hasAncestor(el, TABLE_EL);
}

const HERO = (e) => /^(?:h1|title)$/.test(e.lower) || (e.isComponent && /Hero|Masthead|Jumbotron/.test(e.tag)) || e.attrs.some((a) => /^(?:class|id)$/.test(a.lower) && typeof a.value === 'string' && /(?:^|[\s_-])hero(?:$|[\s_-])/i.test(a.value));

/** A heading or hero context: h1, <title>, a level-1 or level-2 markdown heading, or an element inside a hero. */
export function inHero(el, seg = {}) {
  if (seg.md === 'heading') return /^#{1,2}\s/.test(seg.text || '');
  if (seg.key && /^(?:title|headline|heading|hero|heroTitle|tagline)$/i.test(seg.key)) return true;
  if (!el) return false;
  return HERO(el) || /^h2$/.test(el.lower) || hasAncestor(el, HERO);
}

// ---- copy segments ---------------------------------------------------------------------------------

const COPY_PROPS = /^(?:title|subtitle|heading|headline|subheading|subhead|description|desc|text|label|caption|tooltip|message|helperText|helper|hint|cta|ctaText|ctaLabel|buttonText|buttonLabel|eyebrow|kicker|badge|tagline|quote|testimonial|author|name|role|company|position|jobTitle|alt|aria-label|placeholder|content|summary|body|lede|intro|value|stat|metric|number|figure|price|note|copy|blurb|excerpt|emptyText|errorText|successText|confirmText|cancelText|okText|submitText|header|footer|feature|benefit|question|answer)$/i;
const TECH_ELEMENT_PROPS = /^(?:name|role|value|content|type|id|for|href|src|rel|target|lang|dir|method|action|autocomplete|inputmode|pattern|accept|key)$/i;
const NON_COPY_CALLEES = /^(?:Error|TypeError|RangeError|SyntaxError|console\.\w+|assert|invariant|require|import|fetch|describe|it|test|expect|logger\.\w+|log|debug|warn|querySelector(?:All)?|getElementById|addEventListener|removeEventListener|matchMedia|setAttribute|getAttribute|createElement|useState|useRef|useMemo|useCallback|useEffect|localStorage\.\w+|sessionStorage\.\w+|JSON\.parse|new|String|Number|parseInt|parseFloat|RegExp|Intl\.\w+|split|join|replace|includes|startsWith|endsWith|indexOf|router\.push|navigate|redirect|push|emit|dispatch)$/;
const COPY_CALLEES = /^(?:t|i18n\.t|\$t|translate|toast(?:\.\w+)?|message\.\w+|notification\.\w+|alert|confirm|prompt|setError|setErrors|setErrorMessage|setFieldError|setMessage|setTitle|setStatus|announce|notify)$/;

/** Whether a string reads as UI copy. `display`: the value of a display attribute (alt, title…), always shown as text. */
function looksLikeCopy(v, { display = false } = {}) {
  const t = String(v).trim();
  if (t.length < 2 || t.length > 3000) return false;
  if (!/\p{L}/u.test(t)) return /^\d[\d,.]*\s*[+%×x]$|^[★⭐]+$/u.test(t);
  if (/^(?:https?:|mailto:|tel:|data:|\/|\.\/|\.\.\/|#|@\/|~\/)/.test(t)) return false;
  if (/[{};=<>]|=>|\(\)|\$\{/.test(t)) return false;
  if (/^[a-z][\w-]*(?:[./:][\w-]+)+$/i.test(t) && !/\s/.test(t)) return false; // keys, paths, mime types
  if (/^[a-z]+(?:[A-Z][a-z0-9]*)+$/.test(t)) return false; // camelCase identifiers
  if (!display && /^[A-Z0-9_]{2,}$/.test(t)) return false; // CONSTANT_CASE enum values
  if (/^[a-z0-9-]+$/.test(t) && t.includes('-')) return false; // kebab-case keys and slugs
  return true;
}

const DISPLAY_ATTR = /^(?:alt|title|aria-label|placeholder|label|caption|tooltip)$/i;

/**
 * Copy the UI may show: text nodes, copy-like attributes and props, and string literals in copy contexts.
 * @returns {{text:string, offset:number, line:number, col:number, el:any, kind:string, key?:string|null, callee?:string|null, md?:string, quote:boolean, code:boolean}[]}
 */
export function copySegments(doc) {
  return memo(doc, 'copy', () => {
    const out = [];
    // Markdown and MDX files are documents: articles, guides, posts.
    const contentDoc = /\.(?:mdx|md|markdown)$/i.test(String(doc.rel || doc.file || ''));
    const push = (text, offset, el, kind, extra = {}) => {
      const t = String(text).replace(/\s+/g, ' ').trim();
      if (!t) return;
      const p = doc.pos(offset);
      out.push({ text: t, offset, line: p.line, col: p.col, el, kind, quote: inQuote(el) || /^(?:quote|testimonial|review)$/i.test(extra.key || ''), code: inCode(el), table: inTable(el) || extra.md === 'table', content: contentDoc || inArticle(el), ...extra });
    };
    for (const t of doc.texts) push(t.value, t.offset, t.el, t.kind === 'md' ? 'md' : 'text', { md: t.md });
    for (const el of doc.elements) {
      for (const a of el.attrs) {
        if (a.kind !== 'string' || typeof a.value !== 'string') continue;
        const n = a.name;
        if (n.startsWith('data-') || (n.startsWith('aria-') && n !== 'aria-label')) continue;
        if (!COPY_PROPS.test(n)) continue;
        if (!el.isComponent && TECH_ELEMENT_PROPS.test(n)) {
          const keep = (n === 'value' && (el.lower === 'button' || el.lower === 'option' || (el.lower === 'input' && /^(?:submit|button|reset)$/i.test(String(attrValue(el, 'type') || ''))))) || (n === 'content' && el.lower === 'meta' && /description|title/i.test(String(attrValue(el, 'name') || attrValue(el, 'property') || '')));
          if (!keep) continue;
        }
        if (!looksLikeCopy(a.value, { display: DISPLAY_ATTR.test(n) })) continue;
        push(a.value, a.valueOffset ?? a.offset, el, 'attr', { attr: n });
      }
    }
    for (const s of doc.strings) {
      if (s.classLike || !looksLikeCopy(s.value)) continue;
      if (s.tag) continue; // tagged templates (html``, sql``, gql``) are not copy
      const callee = s.callee || '';
      const attrName = s.attr && s.attr !== '{...}' ? s.attr : null;
      let isCopy = false;
      if (s.inJsxChild) isCopy = true;
      else if (attrName && COPY_PROPS.test(attrName) && !/^on[A-Z]/.test(attrName)) isCopy = true;
      else if (s.key && COPY_PROPS.test(s.key)) isCopy = true;
      else if (COPY_CALLEES.test(callee)) isCopy = true;
      else if (!NON_COPY_CALLEES.test(callee) && !attrName && /\s/.test(s.value.trim()) && /^[\p{Lu}\p{Lo}]/u.test(s.value.trim()) && /\p{Ll}|\p{Lo}/u.test(s.value)) isCopy = true;
      if (!isCopy) continue;
      if (attrName && normAttr(attrName) === 'class') continue;
      push(s.value, s.offset, s.el, 'string', { key: s.key, callee: s.callee || null, attr: attrName });
    }
    return out;
  });
}

/** Visible label of an element (text, aria-label, value of submit inputs). */
export function labelOf(doc, el) {
  const own = elementText(doc, el, 200);
  if (own) return own;
  const v = attrValue(el, 'aria-label') ?? attrValue(el, 'value') ?? attrValue(el, 'title');
  return typeof v === 'string' ? v : '';
}

/** One trimmed source line around an offset, for snippets. */
export function snippetAt(doc, offset, max = 160) {
  const t = doc.text;
  let a = t.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
  let b = t.indexOf('\n', offset);
  if (b < 0) b = t.length;
  let line = t.slice(a, b).trim();
  if (line.length > max) {
    const rel = Math.max(0, offset - a - Math.floor(max / 3));
    line = `${rel > 0 ? '…' : ''}${t.slice(a + rel, Math.min(b, a + rel + max)).trim()}…`;
  }
  return line;
}

export { attr, attrValue, ancestors, elementText };
