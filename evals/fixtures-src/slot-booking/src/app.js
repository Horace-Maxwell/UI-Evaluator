// Entry: the pages call DR.init() inline at the end of their body, so the content is in place before the first
// paint; the theme variables are applied first (theme.js) because the stylesheet has no colour literal.
import { applyTheme } from './theme.js';
import { seedFromQuery } from './store.js';
import { initWhen, initVehicle, initConfirm, initDone } from './pages.js';

export function init() {
  applyTheme();
  seedFromQuery();
  const page = document.body.getAttribute('data-page');
  if (page === 'when') initWhen();
  if (page === 'vehicle') initVehicle();
  if (page === 'confirm') initConfirm();
  if (page === 'done') initDone();
}
