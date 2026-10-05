// media — FUN-04: no broken images or media (naturalWidth 0, failed requests), no broken in-scope links, and no
// visible mailto:/tel:/sms: link without a target (it cannot work as shipped).
export const mode = 'shared';
export const criteria = ['FUN-04'];
export const summary = 'broken images, media and in-scope links; email and phone links with no target';

const MAX_LINKS = 200;

export async function run(ctx) {
  const hits = [];
  const linkCache = new Map();
  let linksChecked = 0;
  let unverifiable = 0;
  const base = new URL(ctx.config.app?.base_url || 'http://localhost:3000');
  for await (const pg of ctx.pages(ctx.states({ widths: 'first', themes: 'first' }))) {
    const ps = pg.ps;
    const found = await pg.page.evaluate(() => {
      const U = window.__uie;
      const media = [];
      for (const img of document.querySelectorAll('img,input[type=image]')) {
        const src = img.currentSrc || img.src || img.getAttribute('src') || '';
        if (!src) continue;
        if (img.tagName === 'IMG' && !img.complete) continue;
        if (img.tagName === 'IMG' && img.naturalWidth === 0) media.push({ kind: 'image', src, selector: U.selector(img), bbox: U.docRect(img), snippet: U.snippet(img), source: U.sourceOf(img), visible: U.isVisible(img) });
      }
      for (const v of document.querySelectorAll('video,audio')) {
        const err = v.error;
        if (err || v.networkState === 3) media.push({ kind: v.tagName.toLowerCase(), src: v.currentSrc || v.src || '', selector: U.selector(v), bbox: U.docRect(v), snippet: U.snippet(v), source: U.sourceOf(v), code: err ? err.code : null, visible: U.isVisible(v) });
      }
      const links = [];
      const dead = [];
      for (const a of document.querySelectorAll('a[href]')) {
        const href = a.getAttribute('href') || '';
        // An email or phone link with no address opens a blank message or dials nothing: the action cannot work as
        // shipped. Share links ("share by email") rightly leave the recipient to the visitor.
        const contact = /^(mailto|tel|sms):([^?]*)/i.exec(href);
        if (contact && U.isVisible(a)) {
          let target = contact[2];
          try {
            target = decodeURIComponent(target);
          } catch {
            /* keep it raw */
          }
          const name = U.accName(a).slice(0, 80);
          const empty = contact[1].toLowerCase() === 'mailto' ? !/@/.test(target) : !/\d{3}/.test(target);
          if (empty && !/share|forward|send to a friend|tell a friend|分享|转发/i.test(name)) dead.push({ scheme: contact[1].toLowerCase(), href: href.slice(0, 200), name, selector: U.selector(a), bbox: U.docRect(a), snippet: U.snippet(a), source: U.sourceOf(a) });
        }
        if (!href || /^(mailto:|tel:|javascript:|data:|sms:)/i.test(href)) continue;
        links.push({ href, abs: a.href, selector: U.selector(a), bbox: U.docRect(a), snippet: U.snippet(a), source: U.sourceOf(a), visible: U.isVisible(a), name: U.accName(a).slice(0, 80) });
      }
      const ids = new Set([...document.querySelectorAll('[id]')].map((e) => e.id));
      const names = new Set([...document.querySelectorAll('a[name]')].map((e) => e.getAttribute('name')));
      return { media, links, dead, ids: [...ids], names: [...names] };
    });
    for (const d of found.dead || []) {
      const what = d.scheme === 'mailto' ? 'Email link has no address' : 'Phone link has no number';
      hits.push(ctx.hit({
        rule: 'FUN-04',
        title: `${what}: "${d.name || d.href}"`,
        description: `The link "${d.name || d.href}" (${d.href}) ${d.scheme === 'mailto' ? 'opens an email with no recipient' : 'has no number to call'}, so the action cannot work as shipped. Put the real ${d.scheme === 'mailto' ? 'address' : 'number'} in one named setting, or offer another way to complete the action (knowledge/content-copy.md §3.5).`,
        location: ctx.loc(ps, { selector: d.selector, bbox: d.bbox, snippet: d.snippet, source: d.source }),
        evidence: [{ type: 'measurement', value: d.href, detail: `${d.scheme}: link without ${d.scheme === 'mailto' ? 'an address' : 'a number'}` }],
      }));
    }
    for (const m of found.media) {
      hits.push(ctx.hit({
        rule: 'FUN-04',
        title: `Broken ${m.kind} on ${ps.route}`,
        description: `The ${m.kind} ${m.src ? `"${m.src.slice(0, 120)}" ` : ''}did not load${m.kind === 'image' ? ' (naturalWidth = 0)' : ` (media error${m.code ? ` ${m.code}` : ''})`}.`,
        location: ctx.loc(ps, { selector: m.selector, bbox: m.bbox, snippet: m.snippet, source: m.source }),
        evidence: [{ type: 'network', value: m.src.slice(0, 300), detail: m.kind === 'image' ? 'naturalWidth 0' : 'media error' }],
      }));
    }
    const reported = new Set(found.media.map((m) => m.src));
    for (const r of [...pg.failedRequests, ...pg.badResponses]) {
      if (!['image', 'media'].includes(r.resourceType)) continue;
      if (reported.has(r.url)) continue;
      if (/ERR_BLOCKED_BY_CLIENT|blockedbyclient/i.test(r.failure || '')) {
        unverifiable += 1;
        continue;
      }
      reported.add(r.url);
      hits.push(ctx.hit({
        rule: 'FUN-04',
        title: `Failed ${r.resourceType} request on ${ps.route}`,
        description: `A ${r.resourceType} request failed (${r.status ? `HTTP ${r.status}` : r.failure}): ${r.url.slice(0, 160)}. It is not tied to an <img> element, so it is probably a CSS background or a preloaded asset.`,
        location: ctx.loc(ps, { selector: 'html' }),
        evidence: [{ type: 'network', value: r.url.slice(0, 300), detail: r.status ? `HTTP ${r.status}` : r.failure }],
      }));
    }
    const ids = new Set(found.ids);
    const names = new Set(found.names);
    for (const l of found.links) {
      let url;
      try {
        url = new URL(l.abs);
      } catch {
        continue;
      }
      const pageUrl = new URL(pg.load.url);
      const samePage = url.origin === pageUrl.origin && url.pathname === pageUrl.pathname && url.search === pageUrl.search;
      if (l.href.startsWith('#') || (samePage && url.hash)) {
        const frag = decodeURIComponent((url.hash || '').slice(1));
        if (!frag || frag === 'top' || ids.has(frag) || names.has(frag)) continue;
        hits.push(ctx.hit({
          rule: 'FUN-04',
          title: `In-page link to a missing target "#${frag.slice(0, 40)}"`,
          description: `The link "${l.name || l.href}" points to #${frag}, but no element on the page has that id or name.`,
          location: ctx.loc(ps, { selector: l.selector, bbox: l.bbox, snippet: l.snippet, source: l.source }),
          evidence: [{ type: 'measurement', value: l.href, detail: 'fragment target not found' }],
        }));
        continue;
      }
      if (url.origin !== base.origin) continue;
      const key = url.href.replace(/#.*$/, '');
      if (!linkCache.has(key)) {
        if (linksChecked >= MAX_LINKS) {
          ctx.partial(`link check capped at ${MAX_LINKS} distinct in-scope links`);
          linkCache.set(key, null);
        } else {
          linksChecked += 1;
          linkCache.set(key, await probeLink(pg.context, key));
        }
      }
      const res = linkCache.get(key);
      if (res && !res.ok) {
        hits.push(ctx.hit({
          rule: 'FUN-04',
          title: `Broken link to ${url.pathname.slice(0, 60)}`,
          description: `The link "${l.name || l.href}" leads to ${key.slice(0, 160)}, which answered ${res.status ? `HTTP ${res.status}` : res.error}.`,
          location: ctx.loc(ps, { selector: l.selector, bbox: l.bbox, snippet: l.snippet, source: l.source }),
          evidence: [{ type: 'network', value: res.status || res.error, detail: key.slice(0, 300) }],
        }));
      }
    }
  }
  if (unverifiable) ctx.partial(`${unverifiable} remote media request(s) were blocked (local-only network guard) and could not be verified; rerun with --allow-remote to check them`);
  ctx.record({ links_checked: linksChecked, remote_media_unverified: unverifiable });
  return hits;
}

async function probeLink(context, url) {
  try {
    let r = await context.request.fetch(url, { method: 'HEAD', timeout: 10000, maxRedirects: 5, failOnStatusCode: false });
    // Many small servers do not implement HEAD (404, 405 or 501): confirm any failure with a GET before calling it broken.
    if (r.status() >= 400) r = await context.request.fetch(url, { method: 'GET', timeout: 10000, maxRedirects: 5, failOnStatusCode: false });
    return { ok: r.status() < 400, status: r.status() };
  } catch (err) {
    return { ok: false, status: null, error: err.message.split('\n')[0].slice(0, 120) };
  }
}
