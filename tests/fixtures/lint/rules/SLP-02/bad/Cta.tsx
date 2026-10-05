export function Cta() {
  return (
    <div>
      <button className="rounded-md bg-indigo-600 px-4 py-2 text-white">Start a trial</button> {/* expect: SLP-02 */}
      <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 p-8">Plans</div> {/* expect: SLP-02 */}
    </div>
  );
}
