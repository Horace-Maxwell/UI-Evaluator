export function Badge() {
  return (
    <div className="bg-background text-foreground">
      <span className="bg-warning/10 text-warning-foreground border-[var(--line)]">Due</span>
      <svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4" fill="#2f6f5e" /></svg>
    </div>
  );
}
