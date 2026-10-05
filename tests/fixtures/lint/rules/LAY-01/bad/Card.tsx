export function Card() {
  return (
    <div className="p-[13px] gap-2"> {/* expect: LAY-01 */}
      <p style={{ marginTop: 7 }}>Totals</p> {/* expect: LAY-01 */}
      <p className="mt-2.5">Due</p> {/* expect: LAY-01 */}
    </div>
  );
}
