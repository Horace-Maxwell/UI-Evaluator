export function Grid() {
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border p-4">One</div> {/* expect: SLP-23 */}
      <div className="rounded-2xl border p-4">Two</div>
      <div className="rounded-2xl border p-4">Three</div>
      <div className="rounded-2xl border p-4">Four</div>
      <div className="rounded-2xl border p-4">Five</div>
      <div className="rounded-2xl border p-4">Six</div>
      <img className="rounded-2xl" src="/a.png" alt="Site map" />
      <button className="rounded-2xl px-4 py-2">Book</button>
      <input className="rounded-2xl border px-3" aria-label="Search" />
      <span className="rounded-md px-2">Tag</span>
      <span className="rounded-2xl px-2">New</span>
    </div>
  );
}
