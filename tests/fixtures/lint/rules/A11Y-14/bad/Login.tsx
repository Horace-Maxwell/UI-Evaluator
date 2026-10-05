export function Login() {
  return (
    <form>
      <label htmlFor="pw">Password</label>
      <input id="pw" type="password" onPaste={(e) => e.preventDefault()} /> {/* expect: A11Y-14 */}
      <label htmlFor="otp">Code from your phone</label>
      <input id="otp" name="otp" autoComplete="one-time-code" onPaste={blockPaste} /> {/* expect: A11Y-14 */}
    </form>
  );
}

function blockPaste(e: ClipboardEvent) {
  e.preventDefault();
}
