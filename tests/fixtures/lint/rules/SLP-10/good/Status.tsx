// A status legend: each dot sits with its label, and the colours are real states.
export function Legend() {
  return (
    <ul className="flex gap-4">
      <li><span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" /> On track</li>
      <li><span className="h-2 w-2 rounded-full bg-yellow-400" aria-hidden="true" /> At risk</li>
      <li><span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" /> Late</li>
    </ul>
  );
}
export function Avatar() {
  return <span className="h-10 w-10 rounded-full bg-red-500" />;
}
