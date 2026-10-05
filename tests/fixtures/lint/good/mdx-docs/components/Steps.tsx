import type { ReactNode } from 'react';

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="my-6 list-decimal space-y-2 pl-6 marker:font-semibold">{children}</ol>;
}
