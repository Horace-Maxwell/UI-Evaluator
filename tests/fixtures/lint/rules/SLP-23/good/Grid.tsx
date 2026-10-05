// A radius scale by role: controls 6px, cards 8px, sheets 16px, pills full.
export function Grid() {
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border p-4">One</div>
      <div className="rounded-lg border p-4">Two</div>
      <div className="rounded-lg border p-4">Three</div>
      <div className="rounded-2xl border p-4">Sheet</div>
      <button className="rounded-md px-4 py-2">Book</button>
      <button className="rounded-md px-4 py-2">Cancel</button>
      <input className="rounded-md border px-3" aria-label="Search" />
      <select className="rounded-md border" aria-label="Sort" />
      <span className="rounded-full px-2">Tag</span>
      <span className="rounded-full px-2">New</span>
      <img className="rounded-lg" src="/a.png" alt="Site map" />
    </div>
  );
}
