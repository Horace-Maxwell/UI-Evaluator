export function Form() {
  return (
    <form>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" onPaste={(e) => e.preventDefault()} /> {/* expect: CMP-17 */}
    </form>
  );
}
