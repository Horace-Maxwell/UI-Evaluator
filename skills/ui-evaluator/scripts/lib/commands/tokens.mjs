// uie tokens — check DESIGN.md (DEC-02 and token-level craft rules) or draft an as-built DESIGN.md from source.
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readText, writeText, writeJson, exists } from '../util/fs.mjs';
import { UsageError } from '../util/args.mjs';
import { paths, loadConfig, appendIndex } from '../project.mjs';
import { parseDesign } from '../tokens/design.mjs';
import { checkTokens } from '../tokens/check.mjs';
import { productSurfaces, productLocales } from '../tokens/product.mjs';
import { inventory, draftDesignMd } from '../tokens/extract.mjs';
import { loadDtcgTokens } from '../tokens/dtcg.mjs';
import { parseColor, deltaEOK } from '../util/color.mjs';

export const argSpec = { boolean: ['json', 'quiet', 'force', 'no-official'] };
export const help = `uie tokens check [--file DESIGN.md] [--no-official]
uie tokens extract [--src <dir>] [--out DESIGN.as-built.md] [--force]

check    Structure (front matter keys, sections in order, no placeholders, references resolve, the ui-evaluator key)
         and values: role contrast in every shipped theme (text ≥ 4.5:1, edges and focus ≥ 3:1), dark surfaces that
         get lighter when raised, ramps lightest-first with one neutral temperature, type sizes, weights, line heights
         and steps by mode, families, spacing on the scale, ≤ 4 shadows, motion durations and easing. When
         @google/design.md is installed locally its linter runs too (never downloaded). DTCG token files
         (*.tokens.json, tokens.json) are read too: broken aliases and refs, unreadable colours, and colour roles
         whose value differs from DESIGN.md are reported as warnings (TOOL-28). Exit 2 on errors.
extract  Inventories what the shipped source uses (CSS custom properties in light and dark, colours, families, sizes,
         spacing, radii, shadows, durations, easings, Tailwind classes on the default scale) into
         .ui-evaluator/tokens-inventory.json and drafts an as-built DESIGN.md that endorses nothing (IMP-051).
         Never overwrites an existing file without --force.`;

function officialLint(root, file) {
  const local = [path.join(root, 'node_modules', '.bin', 'design.md'), path.join(root, 'node_modules', '@google', 'design.md')];
  if (!local.some((p) => exists(p))) return { ran: false, note: 'official @google/design.md linter not installed locally; bundled validator used' };
  const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--no-install', '@google/design.md', 'lint', file], { cwd: root, encoding: 'utf8', timeout: 60000 });
  if (r.error) return { ran: false, note: `official linter failed to start: ${r.error.message}` };
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const errors = Number((out.match(/(\d+)\s+errors?/i) || [])[1] || (r.status ? 1 : 0));
  const warnings = Number((out.match(/(\d+)\s+warnings?/i) || [])[1] || 0);
  return { ran: true, status: r.status, errors, warnings, output: out.trim().split('\n').slice(-20).join('\n') };
}

/** DTCG files next to DESIGN.md: their own problems, and colour roles that disagree with DESIGN.md (two sources). */
function dtcgSummary(root, design) {
  const t = loadDtcgTokens(root);
  const warnings = t.errors.map((e) => `DTCG ${e}`);
  const roles = design?.fm?.colors || {};
  for (const c of t.colors) {
    const role = c.path.split('.').pop();
    if (!(role in roles)) continue;
    const a = parseColor(roles[role]);
    const b = parseColor(c.css);
    if (a && b && deltaEOK(a, b) > 0.02) warnings.push(`DTCG ${c.file}: ${c.path} (${c.hex}) differs from DESIGN.md colors.${role} (${roles[role]}); keep one source of truth`);
  }
  return { warnings, summary: { files: t.files, tokens: t.tokens.length, colors: t.colors.length, errors: t.errors.length } };
}

export async function run(args, ctx) {
  const sub = args._[0];
  const p = paths(ctx.root);
  if (sub === 'check') {
    const file = args.file ? path.resolve(String(args.file)) : p.design;
    if (!exists(file)) throw new UsageError(`${path.relative(ctx.root, file) || file} not found. New work: run the direct workflow; shipped product: uie tokens extract`);
    const config = loadConfig(ctx.root);
    const productText = readText(p.product, '');
    const surfaces = productText ? productSurfaces(productText) : [];
    const locales = [...(config.locales?.list || []), ...(productText ? productLocales(productText) : [])];
    const cjk = locales.some((l) => /^(zh|ja|ko)\b/i.test(String(l)));
    const d = parseDesign(readText(file), { work: config.project?.work || 'existing' });
    const t = checkTokens(d, { surfaces, cjk });
    const official = args['no-official'] ? { ran: false, note: 'skipped (--no-official)' } : officialLint(ctx.root, file);
    const errors = [...d.problems, ...t.errors];
    const warnings = [...d.warnings, ...t.warnings];
    const dtcg = dtcgSummary(ctx.root, d);
    warnings.push(...dtcg.warnings);
    if (official.ran && (official.errors || official.warnings)) errors.push(`official linter: ${official.errors} error(s), ${official.warnings} warning(s) — "lints clean" means 0 and 0 (DEC-02)`);
    ctx.result({ file: path.relative(ctx.root, file), status: d.status, errors, warnings, pairs: t.pairs, official, dtcg: dtcg.summary });
    ctx.print(`${path.relative(ctx.root, file)} (status: ${d.status || 'unknown'})`);
    for (const e of errors) ctx.print(`  error   ${e}`);
    for (const w of warnings) ctx.print(`  warning ${w}`);
    ctx.info(official.ran ? `official linter exit ${official.status}` : official.note);
    if (dtcg.summary.files.length) ctx.info(`DTCG token files: ${dtcg.summary.files.join(', ')} (${dtcg.summary.tokens} token(s), ${dtcg.summary.colors} colour(s))`);
    if (d.status === 'as-built') ctx.info('as-built files record what ships; they pass DEC-02 only after the setup or direct workflow completes them');
    ctx.print(errors.length ? `${errors.length} error(s), ${warnings.length} warning(s)` : `no errors, ${warnings.length} warning(s)`);
    return errors.length ? 2 : 0;
  }
  if (sub === 'extract') {
    const src = path.resolve(ctx.root, String(args.src || '.'));
    const out = path.resolve(ctx.root, String(args.out || 'DESIGN.as-built.md'));
    if (exists(out) && !args.force) throw new UsageError(`${path.relative(ctx.root, out)} exists; pass --force to replace it, or --out <other file>`);
    const inv = inventory(src);
    const productText = readText(p.product, '');
    const surfaces = productText ? productSurfaces(productText) : [];
    const config = loadConfig(ctx.root);
    const name = config.project?.name || path.basename(ctx.root);
    const md = draftDesignMd(inv, { name, surfaces });
    writeJson(path.join(p.ws, 'tokens-inventory.json'), { generated_at: new Date().toISOString(), ...inv });
    writeText(out, md);
    appendIndex(ctx.root, `tokens extract: as-built draft ${path.relative(ctx.root, out)}`);
    ctx.result({ out: path.relative(ctx.root, out), inventory: '.ui-evaluator/tokens-inventory.json', files: inv.files, colors: inv.colors.length, families: inv.families, tailwind: !!inv.tailwind.config || inv.tailwind.classes.length > 0 });
    ctx.print(`scanned ${inv.files.total} file(s) (${inv.files.style} style, ${inv.files.markup} markup/script)${inv.files.truncated ? ' — truncated; pass --src to narrow' : ''}`);
    ctx.print(`colours: ${inv.colors.length} distinct; families: ${inv.families.map((f) => f.name).join(', ') || 'none'}; custom properties: ${Object.keys(inv.custom_properties.light).length} light, ${Object.keys(inv.custom_properties.dark).length} dark`);
    if (inv.tailwind.classes.length) ctx.print(`tailwind classes: ${inv.tailwind.classes.length} distinct among the top; hue families ${inv.tailwind.hue_families.map((h) => h.name).join(', ') || 'none'}`);
    ctx.print(`wrote ${path.relative(ctx.root, out)} (status as-built: records what ships, endorses nothing) and .ui-evaluator/tokens-inventory.json`);
    ctx.print('next: write the identity lock sentence from these measurements, complete the placeholders, then uie tokens check');
    return 0;
  }
  throw new UsageError(help);
}
