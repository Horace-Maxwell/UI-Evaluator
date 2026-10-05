export function Badge() {
  return (
    <div style={{ color: '#1f2937', background: 'rgb(254 243 199)' }}> {/* expect: COL-01 */}
      <span className="bg-amber-100 text-amber-900">Due</span> {/* expect: COL-01 */}
      <span className="border-[#e5e7eb] text-muted-foreground">Paid</span> {/* expect: COL-01 */}
    </div>
  );
}
