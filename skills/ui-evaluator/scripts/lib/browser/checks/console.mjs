// console — FUN-02: no uncaught exceptions or console errors during load and state recipes; parity vs baseline.
export const mode = 'shared';
export const criteria = ['FUN-02'];
export const summary = 'console errors and page errors during load; parity vs baseline';

function remoteHost(where, hosts = []) {
  try {
    return hosts.includes(new URL(String(where).replace(/:\d+$/, '')).host);
  } catch {
    return false;
  }
}

const signature = (s) => String(s || '').replace(/https?:\/\/[^\s)]+/g, '<url>').replace(/\d+/g, '#').slice(0, 200);

export async function run(ctx) {
  const hits = [];
  const list = [];
  const blocked = () => ctx.session.blocked;
  let remoteFailures = 0;
  const seen = new Set();
  for await (const pg of ctx.pages(ctx.states({ widths: 'g2', themes: 'first' }))) {
    const ps = pg.ps;
    const items = [
      ...pg.pageErrors.map((e) => ({ kind: 'uncaught exception', text: e.message, where: e.stack.split('\n')[1]?.trim() || '', phase: e.phase })),
      ...pg.console.map((c) => ({ kind: 'console error', text: c.text, where: c.url ? `${c.url}${c.line != null ? `:${c.line + 1}` : ''}` : '', phase: c.phase })),
    ].filter((e) => ['load', 'settle', 'recipe'].includes(e.phase));
    for (const e of items) {
      if (/ERR_BLOCKED_BY_CLIENT/.test(e.text) || blocked().some((u) => e.text.includes(u) || e.where.includes(u))) continue;
      // A remote asset (web font, CDN stylesheet) that failed at the network level says more about this machine's network
      // than about the page: it is recorded, not reported as FUN-02.
      if (/net::ERR_/.test(e.text) && remoteHost(e.where, ctx.session.assetHosts)) {
        remoteFailures += 1;
        continue;
      }
      const sig = `${ps.route}|${ps.state}|${e.kind}|${signature(e.text)}`;
      list.push({ route: ps.route, state: ps.state, width: ps.width, kind: e.kind, text: e.text.slice(0, 300), where: e.where, signature: signature(e.text) });
      if (seen.has(sig)) continue;
      seen.add(sig);
      hits.push(ctx.hit({
        rule: 'FUN-02',
        title: `${e.kind === 'uncaught exception' ? 'Uncaught exception' : 'Console error'} on ${ps.route}${ps.state !== 'default' ? ` (${ps.state})` : ''}`,
        description: `${e.kind === 'uncaught exception' ? 'An uncaught exception' : 'A console error'} was raised during ${e.phase === 'recipe' ? 'the state recipe' : 'page load'}: "${e.text.slice(0, 200)}"${e.where ? ` at ${e.where}` : ''}.`,
        location: ctx.loc(ps, { selector: 'html', snippet: e.text.slice(0, 200) }),
        evidence: [{ type: 'console', value: e.text.slice(0, 500), detail: e.where || e.phase }],
        problem_type: 'single_location',
      }));
    }
  }
  const fields = { errors_list: list.slice(0, 200), distinct: seen.size, remote_asset_failures: remoteFailures };
  if (ctx.baseline && ctx.baseline.checks?.console) {
    const base = new Set((ctx.baseline.checks.console.errors_list || []).map((e) => `${e.route}|${e.state}|${e.kind}|${e.signature}`));
    const introduced = [...seen].filter((s) => !base.has(s));
    fields.baseline_run = ctx.baseline.run || null;
    fields.introduced = introduced.length;
    fields.introduced_list = introduced.slice(0, 50);
  } else fields.introduced = null;
  ctx.record(fields);
  return hits;
}
