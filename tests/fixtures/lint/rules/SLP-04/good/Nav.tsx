import { cn } from '@/lib/utils';

// The active item's stripe is the current-page cue (active navigation is exempt by definition).
export function SideNav({ items, current }: { items: { href: string; label: string }[]; current: string }) {
  return (
    <nav aria-label="Sections">
      {items.map((item) => (
        <a key={item.href} href={item.href} className={cn('block rounded-md py-2 pl-3', current === item.href && 'border-l-4 border-primary bg-accent')}>
          {item.label}
        </a>
      ))}
      <a href="/help" className={cn('block pl-3', { 'border-l-4 border-primary': current === '/help' })}>Help</a>
    </nav>
  );
}
