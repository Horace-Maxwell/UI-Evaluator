export function Loader() {
  return (
    <div>
      <svg className="h-4 w-4 motion-safe:animate-spin" viewBox="0 0 24 24" aria-hidden="true" />
      <div className="h-4 w-32 animate-pulse rounded bg-muted" aria-hidden="true" />
      <a className="transition-transform hover:-translate-y-1 motion-reduce:transition-none" href="/next">Next chapter</a>
      <a className="transition-colors hover:text-primary" href="/prev">Previous chapter</a>
    </div>
  );
}
