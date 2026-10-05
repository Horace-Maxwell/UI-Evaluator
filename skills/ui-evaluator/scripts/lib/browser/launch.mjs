// Chromium launch, browser contexts per width × theme × preference, and the network guard (ARCHITECTURE §7.1, §13):
// only localhost, 127.0.0.1, [::1], *.localhost and file: URLs are opened unless --allow-remote is passed.
import { UsageError } from '../util/args.mjs';

export const PREFERENCES = ['default', 'reduced-motion', 'forced-colors', 'more-contrast'];

/** True for URLs the browser layer may open without --allow-remote. */
export function isLocalUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (['file:', 'data:', 'blob:', 'about:'].includes(u.protocol)) return true;
  if (!['http:', 'https:', 'ws:', 'wss:'].includes(u.protocol)) return false;
  const host = u.hostname.toLowerCase();
  return host === 'localhost' || host === '[::1]' || host === '::1' || /^127(\.\d{1,3}){3}$/.test(host) || host.endsWith('.localhost');
}

/** Throw a usage error when a top-level URL is remote and remote access was not granted. */
export function assertAllowedUrl(url, allowRemote = false) {
  if (allowRemote || isLocalUrl(url)) return url;
  throw new UsageError(`refusing to open ${url}: only localhost, 127.0.0.1, [::1], *.localhost and file: URLs are opened unless --allow-remote is passed`);
}

/** Resolve a route path or URL against the app's base URL. */
export function resolveUrl(baseUrl, p) {
  if (!p) return baseUrl;
  if (/^[a-z][a-z0-9+.-]*:/i.test(p)) return p;
  return new URL(p, baseUrl.endsWith('/') || p.startsWith('/') ? baseUrl : `${baseUrl}/`).href;
}

export async function launchBrowser(deps, { headless = true } = {}) {
  try {
    return await deps.playwright.chromium.launch({ headless, args: ['--font-render-hinting=none', '--disable-lcd-text'] });
  } catch (err) {
    const e = new Error(`Chromium could not be launched (${err.message.split('\n')[0]}). Run \`uie doctor\`; \`uie doctor --install\` installs it after the owner agrees.`);
    e.userMessage = e.message;
    throw e;
  }
}

/**
 * Touch viewports (CMP-06 operational definition, lead ADR; [calibrating]): matrix entries captured with touch
 * emulation — by default every width below 1024 CSS px. Playwright's hasTouch also yields pointer: coarse, hover: none.
 */
export const TOUCH_BELOW = 1024;
export function isTouchWidth(width) {
  return width < TOUCH_BELOW;
}

/**
 * Playwright context options for one cell of the matrix. `reducedMotion` overrides the preference (the capture
 * recipe takes every still under 'reduce', ARCHITECTURE §9.1); `storageState` restores a saved session (journeys).
 */
export function contextOptions({ width = 1280, height = 900, dsf = 1, theme = 'light', preference = 'default', touch, locale, reducedMotion, storageState } = {}) {
  const opts = {
    viewport: { width, height },
    deviceScaleFactor: dsf,
    colorScheme: theme === 'dark' ? 'dark' : 'light',
    reducedMotion: reducedMotion || (preference === 'reduced-motion' ? 'reduce' : 'no-preference'),
    forcedColors: preference === 'forced-colors' ? 'active' : 'none',
    contrast: preference === 'more-contrast' ? 'more' : 'no-preference',
    hasTouch: touch === undefined ? isTouchWidth(width) : !!touch,
    isMobile: false,
    serviceWorkers: 'block',
    timezoneId: 'UTC',
  };
  if (locale) opts.locale = locale;
  if (storageState) opts.storageState = storageState;
  return opts;
}

/**
 * Create a context with the network guard installed. Blocked request URLs are pushed to `blocked`.
 * @returns {Promise<import('playwright').BrowserContext>}
 */
/** Resource types a page loads to render itself; with remoteAssets, remote GETs of these are allowed. */
const ASSET_TYPES = new Set(['stylesheet', 'font', 'image', 'media', 'script']);

/**
 * A browser context that keeps the audit on this machine. Without allowRemote, a page's own static assets from a font
 * service or CDN still load (remoteAssets, the default), so captures look as they do for a visitor; everything else
 * that would leave the machine is blocked: remote navigations, fetch and XHR, form posts and every non-GET request.
 * Allowed asset hosts are collected in assetHosts, blocked URLs in blocked.
 */
export async function newGuardedContext(browser, spec, { allowRemote = false, blocked = [], remoteAssets = true, assetHosts = [] } = {}) {
  const context = await browser.newContext(contextOptions(spec));
  if (!allowRemote) {
    await context.route('**/*', (route) => {
      const req = route.request();
      const url = req.url();
      if (isLocalUrl(url)) return route.continue();
      if (remoteAssets && req.method() === 'GET' && ASSET_TYPES.has(req.resourceType())) {
        let host = '';
        try {
          host = new URL(url).host;
        } catch {
          host = '';
        }
        if (host && assetHosts.length < 50 && !assetHosts.includes(host)) assetHosts.push(host);
        return route.continue();
      }
      if (blocked.length < 500 && !blocked.includes(url)) blocked.push(url);
      return route.abort('blockedbyclient');
    });
  }
  return context;
}
