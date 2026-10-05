// uie init — scaffold .ui-evaluator/ (never overwrites).
import path from 'node:path';
import { exists, writeJson, writeText, ensureDir, readJson } from '../util/fs.mjs';
import { paths, DEFAULT_CONFIG, appendIndex, WS_DIR } from '../project.mjs';
import { SKILL_DIR } from '../cli.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'force'] };
export const help = `uie init [--force]

Creates ${WS_DIR}/ with config.json, a .gitignore (evidence and personal data stay local), empty ledgers
(ledger, dismissals, waivers), a debt register and the run index. Existing files are never overwritten;
--force only re-creates missing files. PRODUCT.md and DESIGN.md are written by the setup and direct workflows
from the templates in references/templates/.`;

const GITIGNORE = `# UI-Evaluator: evidence, packets and personal data stay on this machine.
runs/
feedback/raw/
studies/*/data/
*.tmp-*
`;

const DEBT = `# Design debt register

Deferred findings with their reason, owner and revisit trigger (FRAMEWORK §4.7). A P0 can never be deferred to pass a gate.

| Finding | Title | Priority | Reason deferred | Owner | Revisit trigger | Date |
|---|---|---|---|---|---|---|
`;

export async function run(args, ctx) {
  const p = paths(ctx.root);
  ensureDir(p.ws);
  const created = [];
  const kept = [];
  const put = (file, write) => {
    if (exists(file)) {
      kept.push(path.relative(ctx.root, file));
      return;
    }
    write();
    created.push(path.relative(ctx.root, file));
  };
  const preflight = readJson(p.preflight, null);
  put(p.config, () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.project.name = path.basename(ctx.root);
    if (preflight?.app?.start) cfg.app.start = preflight.app.start;
    if (preflight?.app?.base_url) cfg.app.base_url = preflight.app.base_url;
    if (preflight?.routes?.length) cfg.routes = preflight.routes.slice(0, 12).map((r) => ({ path: r, surface: r === '/' ? 'home' : r.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'page', mode: 'operate', states: [{ name: 'default', actions: [] }] }));
    if (preflight?.locales?.length) cfg.locales = { list: preflight.locales, default: preflight.locales[0], switch: null };
    writeJson(p.config, cfg);
  });
  put(path.join(p.ws, '.gitignore'), () => writeText(path.join(p.ws, '.gitignore'), GITIGNORE));
  put(p.ledger, () => writeJson(p.ledger, { schema: 'ledger', version: 1, entries: [] }));
  put(p.dismissals, () => writeJson(p.dismissals, { version: 1, entries: [] }));
  put(p.waivers, () => writeJson(p.waivers, { version: 1, waivers: [] }));
  put(p.debt, () => writeText(p.debt, DEBT));
  put(p.humanChecks, () => writeJson(p.humanChecks, { version: 1, wcag: {}, confirmations: {}, design_verdict: null }));
  ensureDir(p.journeys);
  ensureDir(p.runs);
  if (!exists(p.index)) appendIndex(ctx.root, 'workspace initialised');
  const tpl = path.join(SKILL_DIR, 'references', 'templates');
  ctx.result({ created, kept, templates: tpl });
  ctx.print(`${created.length ? `created: ${created.join(', ')}` : 'nothing to create'}${kept.length ? `\nkept (not overwritten): ${kept.join(', ')}` : ''}`);
  if (!exists(p.product)) ctx.print(`next: write PRODUCT.md from ${path.join(tpl, 'PRODUCT.md')} (setup workflow, step 6)`);
  if (!exists(p.design)) ctx.print(`DESIGN.md: run the direct workflow for new work, or \`uie tokens extract\` for a shipped product`);
  ctx.print(`edit ${path.relative(ctx.root, p.config)}: app.start, app.base_url, routes with modes and state recipes (see ${path.join(tpl, 'config.example.json')})`);
  return 0;
}
