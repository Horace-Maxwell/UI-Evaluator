// routes — FUN-01: every in-scope route and state loads (2xx) and renders its main content within the timeout.
export const mode = 'shared';
export const includeFailed = true;
export const criteria = ['FUN-01'];
export const summary = 'loads each in-scope route and state; status and render timing';

export async function run(ctx) {
  const hits = [];
  const rows = [];
  for await (const pg of ctx.pages(ctx.states({ widths: 'first', themes: 'first' }))) {
    const ps = pg.ps;
    const row = { route: ps.route, state: ps.state, url: pg.load.url, status: pg.load.status, ms: pg.load.ms, fcp: pg.load.timing?.fcp ?? null, ok: pg.ok };
    rows.push(row);
    if (pg.authWall) {
      // A sign-in page is not the route: never evaluated in its place, never a FUN-01 failure (LOOP-012).
      row.auth_wall = pg.authWall.final_url;
      ctx.partial(`${ps.route} redirected to a sign-in page and was not evaluated`);
      continue;
    }
    if (!pg.load.ok) {
      hits.push(ctx.hit({
        rule: 'FUN-01',
        title: `Route ${ps.route} does not load`,
        description: `Opening ${pg.load.url} failed: ${pg.load.error}. Every in-scope route must answer 2xx and render its main content within ${ctx.config.app?.timeout_ms || 60000} ms.`,
        location: ctx.loc(ps, { selector: 'html' }),
        evidence: [{ type: 'network', value: pg.load.status, detail: pg.load.error }],
        problem_type: 'overall_structure',
      }));
      continue;
    }
    if (pg.recipe && !pg.recipe.ok) {
      hits.push(ctx.hit({
        rule: 'FUN-01',
        title: `State "${ps.state}" of ${ps.route} cannot be reached`,
        description: `The state recipe failed: ${pg.recipe.error}. Either the UI no longer offers this path or the recipe in config.json is out of date; states that cannot be rendered are not audited.`,
        location: ctx.loc(ps, { selector: 'html' }),
        evidence: [{ type: 'probe', detail: pg.recipe.error, value: pg.recipe.steps.length }],
        problem_type: 'overall_structure',
      }));
      continue;
    }
    if (!pg.ok) {
      hits.push(ctx.hit({
        rule: 'FUN-01',
        title: `Route ${ps.route} renders no usable content`,
        description: `${pg.error}. A blank or near-uniform page is never evaluated (EVD-03).`,
        location: ctx.loc(ps, { selector: 'body' }),
        evidence: [{ type: 'screenshot', detail: pg.error }],
        problem_type: 'overall_structure',
      }));
      continue;
    }
    const content = await pg.page.evaluate(() => {
      const U = window.__uie;
      const main = document.querySelector('main,[role=main]');
      const root = main || document.body;
      const text = U.collapse(root.innerText || '').length;
      const media = [...root.querySelectorAll('img,svg,video,canvas')].filter((e) => U.isVisible(e)).length;
      return { text, media, hasMain: !!main };
    }).catch(() => ({ text: 0, media: 0 }));
    row.content = content;
    if (content.text === 0 && content.media === 0) {
      hits.push(ctx.hit({
        rule: 'FUN-01',
        title: `Route ${ps.route} renders no main content`,
        description: `After loading ${pg.load.url}${ps.state !== 'default' ? ` and running state "${ps.state}"` : ''}, the ${content.hasMain ? 'main landmark' : 'body'} shows no text and no media.`,
        location: ctx.loc(ps, { selector: content.hasMain ? 'main' : 'body' }),
        evidence: [{ type: 'measurement', value: content, detail: 'no visible text or media' }],
        problem_type: 'overall_structure',
      }));
    }
  }
  ctx.record({ routes: rows, auth_walls: ctx.session.authWalls.map((w) => ({ route: w.route, final_url: w.final_url })) });
  return hits;
}
