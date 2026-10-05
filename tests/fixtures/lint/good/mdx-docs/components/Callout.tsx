import type { ReactNode } from 'react';

// Admonition kinds: the stripe colour is the kind's state cue (note or warning), from the docs theme tokens.
const styles = {
  note: 'border-l-4 border-info bg-info-subtle text-info-foreground',
  warning: 'border-l-4 border-warning bg-warning-subtle text-warning-foreground',
} as const;

export function Callout({ kind = 'note', children }: { kind?: keyof typeof styles; children: ReactNode }) {
  return (
    <aside role="note" className={`my-6 rounded-md px-4 py-3 ${styles[kind]}`}>
      {children}
    </aside>
  );
}
