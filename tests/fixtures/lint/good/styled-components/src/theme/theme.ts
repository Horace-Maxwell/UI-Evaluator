// Theme tokens for styled-components: the only literal values in the app.
export const theme = {
  colors: {
    sea: '#0e4c63',
    seaDeep: '#08303f',
    foam: '#f4f8f8',
    ink: '#132026',
    inkMuted: '#4d5f66',
    line: '#cdd9dc',
    warning: '#a85d00',
    focus: '#c2410c',
  },
  space: [0, 4, 8, 12, 16, 24, 32, 48] as const,
  radii: { sm: '4px', md: '8px' },
  shadows: { raised: '0 1px 2px rgb(19 32 38 / 0.1), 0 6px 16px rgb(19 32 38 / 0.08)' },
  motion: { feedback: '120ms', overlay: '220ms', easeOut: 'cubic-bezier(0.2, 0, 0, 1)' },
  fonts: { body: "'Fira Sans', 'Noto Sans', sans-serif", mono: "'Fira Mono', ui-monospace, monospace" },
};

export type Theme = typeof theme;
