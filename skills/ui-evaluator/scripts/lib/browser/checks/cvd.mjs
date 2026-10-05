// cvd — evidence for A11Y-19 (agent-judged, WCAG 1.4.1) and the forced-colours and increased-contrast evidence of
// accessibility.md §10: captures under deuteranopia, protanopia, tritanopia and achromatopsia through Chromium's
// Emulation.setEmulatedVisionDeficiency (Machado, Oliveira and Fernandes 2009 matrices) at one width per theme, and
// captures with forced-colors: active and prefers-contrast: more. Captures go through the validity check (EVD-03).
// The check emits no hits: the accessibility auditor compares colour-coded elements across the captures.
import path from 'node:path';
import { withCdp, emulateVision, VISION_DEFICIENCIES } from '../cdp.mjs';
import { captureStill } from '../capture.mjs';

export const mode = 'shared';
export const criteria = ['A11Y-19'];
export const summary = 'colour-vision-deficiency and forced-colours captures for the accessibility auditor';

export const SIMULATOR = 'Chromium Emulation.setEmulatedVisionDeficiency (Machado, Oliveira and Fernandes 2009)';

export async function run(ctx) {
  const captures = [];
  const width = ctx.scope.widths.includes(1280) ? 1280 : ctx.scope.widths[ctx.scope.widths.length - 1];
  const g2 = ctx.scope.g2Preferences || [];
  const prefs = ['default', ...['forced-colors', 'more-contrast'].filter((p) => g2.includes(p))];
  for await (const pg of ctx.pages(ctx.states({ widths: [width], themes: 'all', preferences: prefs }))) {
    const ps = pg.ps;
    const base = path.join('screens', ps.slug, ps.state);
    const shot = async (suffix) => {
      const still = await captureStill(pg.page, { PNG: ctx.deps.PNG, fullPage: true, masks: ps.routeCfg.mask || [], dsf: ps.dsf, fonts: pg.settle?.fonts || null });
      const rel = ctx.writeEvidence(path.join(base, `${ps.width}-${ps.theme}-${suffix}.png`), still.buffer);
      const item = { kind: suffix.startsWith('cvd-') ? 'cvd' : 'preference', route: ps.route, state: ps.state, width: ps.width, theme: ps.theme, preference: suffix, file: rel, valid: still.valid, reasons: still.reasons, width_px: still.width, height_px: still.height };
      captures.push(item);
      ctx.runner.stills.push(item);
      if (!still.valid) ctx.error(`${rel}: invalid capture (${still.reasons.join('; ')})`);
    };
    try {
      if (ps.preference !== 'default') {
        await shot(ps.preference);
        continue;
      }
      await withCdp(pg.page, async (cdp) => {
        try {
          for (const type of VISION_DEFICIENCIES) {
            await emulateVision(cdp, type);
            await shot(`cvd-${type}`);
          }
        } finally {
          // The page is shared with later checks: always switch the simulation off.
          await emulateVision(cdp, 'none').catch(() => {});
        }
      });
    } catch (err) {
      ctx.error(`${ps.key}: capture failed: ${err.message.split('\n')[0]}`);
      ctx.partial('some colour-vision or preference captures could not be taken');
    }
  }
  const invalid = captures.filter((c) => !c.valid).length;
  if (invalid) ctx.partial(`${invalid} capture(s) failed the validity check and must be retaken before the auditor reads them`);
  if (!g2.includes('forced-colors')) ctx.note('forced-colours captures were not requested (matrix.g2_preferences lacks "forced-colors")');
  ctx.record({
    simulator: SIMULATOR,
    judged_by: 'accessibility-auditor',
    width,
    captures,
    valid: captures.length - invalid,
    invalid,
  });
  ctx.note('A11Y-19 is agent-judged: the accessibility auditor compares status, series, links and required markers across these captures');
  return [];
}
