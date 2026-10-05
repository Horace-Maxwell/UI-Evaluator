// Admonition kinds: the stripe colour is the state cue of the kind.
const tone = {
  note: 'border-l-4 border-sky-700 bg-sky-50',
  warning: 'border-l-4 border-amber-600 bg-amber-50',
} as const;

export function Callout({ kind, children }: { kind: keyof typeof tone; children: React.ReactNode }) {
  return <aside className={`rounded-md p-4 ${tone[kind]}`}>{children}</aside>;
}

export function Alert({ children }: { children: React.ReactNode }) {
  return <div role="alert" className="rounded-md border-l-4 border-red-600 p-4">{children}</div>;
}
