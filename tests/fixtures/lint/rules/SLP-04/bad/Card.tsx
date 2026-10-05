export function Card({ title }: { title: string }) {
  return (
    <div className="rounded-xl border-l-4 border-emerald-600 bg-card p-6"> {/* expect: SLP-04 */}
      <h3>{title}</h3>
    </div>
  );
}
