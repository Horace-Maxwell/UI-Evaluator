// Audit check registry. Names are canonical (ARCHITECTURE §7.2). `mode: 'shared'` checks read a page loaded once
// for all of them; `standalone` checks drive their own pages (focus walks, form submissions, emulations, timing).
import * as routes from './routes.mjs';
import * as consoleCheck from './console.mjs';
import * as media from './media.mjs';
import * as axe from './axe.mjs';
import * as keyboard from './keyboard.mjs';
import * as dialogs from './dialogs.mjs';
import * as layout from './layout.mjs';
import * as palette from './palette.mjs';
import * as targets from './targets.mjs';
import * as contrast from './contrast.mjs';
import * as forms from './forms.mjs';
import * as liveRegions from './live-regions.mjs';
import * as lang from './lang.mjs';
import * as crossPage from './cross-page.mjs';
import * as cvd from './cvd.mjs';
import * as census from './census.mjs';
import * as states from './states.mjs';
import * as motion from './motion.mjs';
import * as tells from './tells.mjs';
import * as copy from './copy.mjs';
import * as i18n from './i18n.mjs';
import * as vitals from './vitals.mjs';

export const CHECKS = {
  routes,
  console: consoleCheck,
  media,
  axe,
  keyboard,
  dialogs,
  layout,
  palette,
  targets,
  contrast,
  forms,
  'live-regions': liveRegions,
  lang,
  'cross-page': crossPage,
  cvd,
  census,
  states,
  motion,
  tells,
  copy,
  i18n,
  vitals,
};

/** Canonical order (§7.2 table); execution follows §9.3 within each phase. */
export const CHECK_NAMES = Object.keys(CHECKS);

/** `uie audit --quick` (§7.2). */
export const QUICK_CHECKS = ['routes', 'console', 'axe', 'keyboard', 'layout', 'contrast', 'census', 'tells', 'copy'];

export function describeChecks() {
  return CHECK_NAMES.map((n) => ({ name: n, mode: CHECKS[n].mode, criteria: CHECKS[n].criteria || [], summary: CHECKS[n].summary || '' }));
}
