export function Loader() {
  return (
    <div>
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true" /> {/* expect: MOT-04 */}
      <a className="transition-transform hover:-translate-y-1" href="/next">Next chapter</a> {/* expect: MOT-04 */}
    </div>
  );
}
