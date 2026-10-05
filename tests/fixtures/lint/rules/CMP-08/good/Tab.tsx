export function Tab() {
  return (
    <div>
      <button className="rounded px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Overview</button>
      <a className="outline-none focus-visible:border-ring" href="/a">Details</a>
    </div>
  );
}
