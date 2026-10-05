// cross-page — A11Y-18 across the in-scope routes (WCAG 3.2.3, 3.2.4, 3.2.6; TOOL-41):
//   3.2.3  each navigation landmark repeated on several routes keeps its links in the same relative order;
//   3.2.4  the same link in the same place of the repeated chrome (banner, navigation, footer) keeps its name;
//   3.2.6  help mechanisms (contact, chat, FAQ, help) keep their region and their relative order.
// Also SLP-45, cross-page system drift (soft tell [CRAFT-030]): a route whose dominant text family, or (with three
// or more routes) whose dominant control radius, differs from the rest of the site and from DESIGN.md.
// One page state per route (the default state, first width and theme). With one configured route the criterion
// does not apply (recorded as `not_applicable`); a --route filter that leaves one route makes the check skipped.
export const mode = 'shared';
export const criteria = ['A11Y-18', 'SLP-45'];
export const summary = 'navigation order, names of identical functions, help placement and design-system drift across routes';

const HELP_SOURCE = '\\b(help|support|contact( us)?|faq|chat|get in touch|customer service)\\b|帮助|客服|联系我们|常见问题|在线咨询';

function collect(helpSource) {
  const U = window.__uie;
  U.reset();
  const HELP = new RegExp(helpSource, 'i');
  const norm = (href) => {
    try {
      const u = new URL(href, location.href);
      return `${u.origin}${u.pathname.replace(/\/+$/, '') || '/'}${u.search}`;
    } catch {
      return href;
    }
  };
  const regionOf = (el) => {
    const lm = el.closest('header,[role=banner],nav,[role=navigation],main,[role=main],aside,[role=complementary],footer,[role=contentinfo]');
    if (!lm) return 'none';
    const r = U.role(lm);
    return r === 'generic' ? lm.tagName.toLowerCase() : r;
  };
  // Navigation landmarks outside the main content (breadcrumbs and in-page tables of contents vary by design).
  const navs = [];
  const seenNames = new Map();
  for (const n of document.querySelectorAll('nav,[role=navigation]')) {
    if (!U.isVisible(n) || n.closest('main,[role=main],article')) continue;
    const name = U.accName(n);
    if (/breadcrumb|面包屑/i.test(`${name} ${n.className || ''}`)) continue;
    const links = [...n.querySelectorAll('a[href]')].filter((a) => U.isVisible(a)).map((a) => ({ href: norm(a.href), name: U.accName(a) }));
    if (links.length < 2) continue;
    const region = n.closest('header,[role=banner]') ? 'banner' : n.closest('footer,[role=contentinfo]') ? 'contentinfo' : 'page';
    const base = `${region}:${name.toLowerCase() || 'unnamed'}`;
    const k = seenNames.get(base) || 0;
    seenNames.set(base, k + 1);
    navs.push({ key: `${base}#${k}`, name, links, selector: U.selector(n), bbox: U.docRect(n), snippet: U.snippet(n) });
  }
  // Links of the repeated chrome, keyed by place and destination; duplicates within one page are ambiguous.
  const chrome = [];
  for (const a of document.querySelectorAll('a[href]')) {
    if (!U.isVisible(a)) continue;
    const region = regionOf(a);
    if (!['banner', 'navigation', 'contentinfo', 'header', 'footer'].includes(region)) continue;
    if (a.closest('main,[role=main]')) continue;
    chrome.push({ key: `${region}|${norm(a.href)}`, href: norm(a.href), name: U.accName(a), region, selector: U.selector(a), bbox: U.docRect(a), snippet: U.snippet(a), source: U.sourceOf(a) });
  }
  const help = [];
  for (const el of document.querySelectorAll('a[href],button,[role=button],[role=link]')) {
    if (!U.isVisible(el)) continue;
    const name = U.accName(el);
    const href = el.getAttribute('href') || '';
    if (!HELP.test(name) && !/\b(help|support|contact|faq|chat)\b/i.test(href)) continue;
    help.push({ key: href ? norm(el.href) : `button:${name.toLowerCase()}`, name, region: regionOf(el), selector: U.selector(el), bbox: U.docRect(el), snippet: U.snippet(el), source: U.sourceOf(el) });
  }
  // Design-system signature for SLP-45: text families weighted by characters (code excluded), control radii.
  const families = {};
  let chars = 0;
  for (const el of document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,dt,dd,td,th,label,a,button,figcaption,blockquote,span')) {
    if (families.__n > 1500) break;
    if (!U.isVisible(el) || el.closest('code,pre,kbd,samp,svg,[aria-hidden=true]')) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (own.length < 2) continue;
    const fam = (getComputedStyle(el).fontFamily.split(',')[0] || '').trim().replace(/^["']|["']$/g, '').toLowerCase();
    if (!fam || /icon|symbol|emoji/.test(fam)) continue;
    families[fam] = (families[fam] || 0) + own.length;
    chars += own.length;
    families.__n = (families.__n || 0) + 1;
  }
  delete families.__n;
  const radii = {};
  for (const el of document.querySelectorAll('button,[role=button],input[type=submit],input[type=button],input[type=text],input[type=email],input[type=search],select,textarea')) {
    if (!U.isVisible(el)) continue;
    const r = Math.round(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
    radii[r] = (radii[r] || 0) + 1;
  }
  return { navs, chrome, help, system: { families, chars, radii } };
}

const dominant = (counts) => Object.entries(counts || {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

/** SLP-45: routes whose dominant family or (with ≥ 3 routes) dominant control radius departs from the rest. */
export function systemDrift(pages, { declaredFamilies = [] } = {}) {
  const out = [];
  const declared = new Set(declaredFamilies.map((f) => String(f).toLowerCase()));
  const fam = pages.filter((p) => p.system && p.system.chars >= 200).map((p) => ({ p, d: dominant(p.system.families) }));
  if (fam.length >= 2) {
    const votes = {};
    for (const x of fam) votes[x.d] = (votes[x.d] || 0) + 1;
    const [top, n] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    // A clear majority is needed; with two routes, the second route is reported against the first.
    if (n > fam.length / 2 || fam.length === 2) {
      for (const x of fam) {
        if (x.d === top || declared.has(x.d)) continue;
        out.push({ kind: 'family', ps: x.p.ps, value: x.d, majority: top, of: fam.length });
      }
    }
  }
  const rad = pages.filter((p) => p.system && Object.values(p.system.radii).reduce((a, b) => a + b, 0) >= 2).map((p) => ({ p, d: Number(dominant(p.system.radii)) }));
  if (rad.length >= 3) {
    const votes = {};
    for (const x of rad) votes[x.d] = (votes[x.d] || 0) + 1;
    const [top, n] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    if (n > rad.length / 2) {
      for (const x of rad) if (Math.abs(x.d - Number(top)) > 2) out.push({ kind: 'radius', ps: x.p.ps, value: x.d, majority: Number(top), of: rad.length });
    }
  }
  return out;
}

/** Name used for consistency: case, punctuation and "current page" markers do not make a name different. */
export function comparableName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\(?\b(current( page)?|selected|you are here)\b\)?|当前(页面|页)?/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Relative order of the items both lists share: a.filter(in b) vs b.filter(in a). */
export function sharedOrderDiffers(a, b) {
  const sa = [...new Set(a)];
  const sb = [...new Set(b)];
  const common = sa.filter((x) => sb.includes(x));
  if (common.length < 2) return null;
  const inB = sb.filter((x) => common.includes(x));
  return common.join('\u0001') === inB.join('\u0001') ? null : { reference: common, other: inB };
}

const short = (h) => h.replace(/^https?:\/\/[^/]+/, '') || '/';

export async function run(ctx) {
  const hits = [];
  const configured = (ctx.config.routes || []).length;
  if (ctx.scope.routes.length < 2) {
    if (configured >= 2) {
      ctx.skip(`--route narrowed the scope to one route; cross-page consistency needs the ${configured} configured routes`);
      return [];
    }
    ctx.record({ not_applicable: 'only one route is in scope; WCAG 3.2.3, 3.2.4 and 3.2.6 apply to a set of pages', routes_compared: [] });
    ctx.note('not applicable: one route in scope');
    return [];
  }
  const pages = [];
  for await (const pg of ctx.pages(ctx.states({ widths: 'first', themes: 'first', states: 'default' }))) {
    try {
      pages.push({ ps: pg.ps, ...(await pg.page.evaluate(collect, HELP_SOURCE)) });
    } catch (err) {
      ctx.error(`${pg.ps.key}: ${err.message.split('\n')[0]}`);
    }
  }
  if (pages.length < 2) {
    ctx.partial('fewer than two routes could be compared');
    ctx.record({ routes_compared: pages.map((p) => p.ps.route) });
    return hits;
  }
  // 3.2.3 — per navigation landmark, against the first route that has it.
  const navRef = new Map();
  for (const p of pages) {
    for (const n of p.navs) {
      const ref = navRef.get(n.key);
      if (!ref) {
        navRef.set(n.key, { ps: p.ps, nav: n });
        continue;
      }
      const diff = sharedOrderDiffers(ref.nav.links.map((l) => l.href), n.links.map((l) => l.href));
      if (!diff) continue;
      hits.push(ctx.hit({
        rule: 'A11Y-18',
        wcag: ['3.2.3'],
        title: `Navigation order differs on ${p.ps.route}${n.name ? ` (${n.name})` : ''}`,
        description: `The links this navigation shares with ${ref.ps.route} appear in a different relative order on ${p.ps.route}: ${diff.other.map(short).join(' → ')} instead of ${diff.reference.map(short).join(' → ')}.`,
        location: ctx.loc(p.ps, { selector: n.selector, bbox: n.bbox, snippet: n.snippet }),
        evidence: [{ type: 'measurement', value: { reference_route: ref.ps.route, reference: diff.reference.map(short), order: diff.other.map(short) }, detail: '3.2.3 consistent navigation' }],
        recommendation: 'Render navigation from one shared layout component so its order never varies between pages.',
      }));
    }
  }
  // 3.2.4 — the same link in the same place keeps its name across pages.
  const chromeRef = new Map();
  for (const p of pages) {
    const counts = new Map();
    for (const c of p.chrome) counts.set(c.key, (counts.get(c.key) || 0) + 1);
    for (const c of p.chrome) {
      if (counts.get(c.key) > 1 || !c.name) continue;
      const ref = chromeRef.get(c.key);
      if (!ref) {
        chromeRef.set(c.key, { ps: p.ps, item: c });
        continue;
      }
      if (comparableName(ref.item.name) === comparableName(c.name)) continue;
      hits.push(ctx.hit({
        rule: 'A11Y-18',
        wcag: ['3.2.4'],
        title: `Same link, different names: ${short(c.href)} in the ${c.region}`,
        description: `The ${c.region} link to ${short(c.href)} is named "${ref.item.name}" on ${ref.ps.route} but "${c.name}" on ${p.ps.route}. The same function should be identified the same way on every page.`,
        location: ctx.loc(p.ps, { selector: c.selector, bbox: c.bbox, snippet: c.snippet, source: c.source }),
        evidence: [{ type: 'measurement', value: { reference_route: ref.ps.route, names: [ref.item.name, c.name] }, detail: '3.2.4 consistent identification' }],
      }));
    }
  }
  // 3.2.6 — help mechanisms keep their region and relative order.
  const helpRef = new Map();
  let helpOrderRef = null;
  for (const p of pages) {
    for (const h of p.help) {
      const prev = helpRef.get(h.key);
      if (!prev) {
        helpRef.set(h.key, { region: h.region, ps: p.ps });
        continue;
      }
      if (prev.region === h.region) continue;
      hits.push(ctx.hit({
        rule: 'A11Y-18',
        wcag: ['3.2.6'],
        title: `Help "${h.name}" moves between page regions`,
        description: `The help mechanism "${h.name}" is in the ${prev.region} on ${prev.ps.route} but in the ${h.region} on ${p.ps.route}.`,
        location: ctx.loc(p.ps, { selector: h.selector, bbox: h.bbox, snippet: h.snippet, source: h.source }),
        evidence: [{ type: 'measurement', value: { reference_route: prev.ps.route, from: prev.region, to: h.region }, detail: '3.2.6 consistent help' }],
      }));
    }
    const seq = p.help.map((h) => h.key);
    if (!helpOrderRef) {
      if (seq.length >= 2) helpOrderRef = { ps: p.ps, seq };
      continue;
    }
    const diff = sharedOrderDiffers(helpOrderRef.seq, seq);
    if (diff) {
      const h = p.help[0];
      hits.push(ctx.hit({
        rule: 'A11Y-18',
        wcag: ['3.2.6'],
        title: `Help mechanisms change order on ${p.ps.route}`,
        description: `The help mechanisms shared with ${helpOrderRef.ps.route} appear in a different relative order on ${p.ps.route}: ${diff.other.map(short).join(' → ')} instead of ${diff.reference.map(short).join(' → ')}.`,
        location: ctx.loc(p.ps, { selector: h.selector, bbox: h.bbox, snippet: h.snippet, source: h.source }),
        evidence: [{ type: 'measurement', value: { reference_route: helpOrderRef.ps.route, reference: diff.reference.map(short), order: diff.other.map(short) }, detail: '3.2.6 consistent help' }],
      }));
    }
  }
  // SLP-45 — design-system drift between routes (soft tell: needs a disposition, never a WCAG failure).
  const typo = ctx.design.design?.fm?.typography || {};
  const declaredFamilies = Object.values(typo).map((t) => (t && typeof t === 'object' ? t.fontFamily || t['font-family'] : null)).filter(Boolean).flatMap((f) => String(f).split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')));
  const drift = systemDrift(pages, { declaredFamilies });
  for (const d of drift) {
    hits.push(ctx.hit({
      rule: 'SLP-45',
      title: d.kind === 'family' ? `Different text family on ${d.ps.route}: ${d.value}` : `Different control radius on ${d.ps.route}: ${d.value} px`,
      description: d.kind === 'family'
        ? `Most text on ${d.ps.route} is set in ${d.value}, while the other route(s) use ${d.majority} (${d.of} routes compared), and DESIGN.md declares no ${d.value} role. Pages of one product should come from one type system.`
        : `Buttons and fields on ${d.ps.route} mostly use a ${d.value} px radius, while ${d.majority} px dominates across the ${d.of} routes compared. Controls should share one radius scale.`,
      location: ctx.loc(d.ps, { selector: 'body' }),
      evidence: [{ type: 'measurement', value: { [d.kind]: d.value, majority: d.majority, routes: d.of }, detail: 'cross-page system drift (SLP-45, soft)' }],
      problem_type: 'overall_structure',
      recommendation: 'Render the page from the shared layout and the type and radius tokens, or record in DESIGN.md why this surface differs.',
    }));
  }
  ctx.record({ routes_compared: pages.map((p) => p.ps.route), navigations: navRef.size, chrome_links: chromeRef.size, help_mechanisms: helpRef.size, system_drift: drift.map((d) => ({ kind: d.kind, route: d.ps.route, value: d.value, majority: d.majority })) });
  return hits;
}
