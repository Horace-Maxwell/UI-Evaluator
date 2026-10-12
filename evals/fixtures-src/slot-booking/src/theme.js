// Colours are computed at run time from the council's hue, so the stylesheet carries no colour literal; the
// values a page shows exist only once the script has run (seeded problem R03 lives in the "few left" tag).
export const HUE = 152;

const hsl = (h, s, l) => `hsl(${h} ${s}% ${l}%)`;

export function palette(dark) {
  const h = HUE;
  return dark
    ? {
        ground: hsl(h, 15, 9), surface: hsl(h, 12, 13), ink: hsl(h, 10, 90), muted: hsl(h, 8, 70), rule: hsl(h, 10, 26), edge: hsl(h, 8, 55),
        accent: hsl(h, 40, 65), 'accent-hover': hsl(h, 40, 72), 'accent-active': hsl(h, 40, 80), tint: hsl(h, 25, 20), hover: hsl(h, 18, 17),
        'on-accent': hsl(h, 15, 9), focus: hsl(h, 10, 90), error: hsl(8, 70, 72), 'error-hover': hsl(8, 70, 78), 'error-active': hsl(8, 70, 84), 'error-tint': hsl(8, 30, 18),
        few: hsl(38, 60, 42), 'few-bg': hsl(38, 30, 18),
      }
    : {
        ground: hsl(h, 12, 96), surface: hsl(0, 0, 100), ink: hsl(h, 20, 12), muted: hsl(h, 10, 34), rule: hsl(h, 10, 80), edge: hsl(h, 8, 42),
        accent: hsl(h, 45, 28), 'accent-hover': hsl(h, 45, 22), 'accent-active': hsl(h, 45, 16), tint: hsl(h, 35, 92), hover: hsl(h, 20, 94),
        'on-accent': hsl(0, 0, 100), focus: hsl(h, 20, 12), error: hsl(8, 70, 38), 'error-hover': hsl(8, 70, 31), 'error-active': hsl(8, 70, 24), 'error-tint': hsl(8, 70, 95),
        few: hsl(38, 85, 40), 'few-bg': hsl(38, 80, 92),
      };
}

export function applyTheme() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const set = () => {
    const p = palette(mq.matches);
    const root = document.documentElement.style;
    for (const k of Object.keys(p)) root.setProperty(`--c-${k}`, p[k]);
  };
  set();
  if (mq.addEventListener) mq.addEventListener('change', set);
}
