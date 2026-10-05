export function Mockup() {
  return (
    <div className="rounded-xl border">
      <div className="flex gap-2 p-3">
        <span className="h-3 w-3 rounded-full bg-red-500" /> {/* expect: SLP-10 */}
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-500" />
      </div>
      <div className="p-6">Dashboard preview</div>
    </div>
  );
}
