export function Login() {
  return (
    <form>
      <label htmlFor="pw">Password</label>
      <input id="pw" type="password" autoComplete="current-password" />
      <label htmlFor="otp">Code from your phone</label>
      <input id="otp" name="otp" autoComplete="one-time-code" inputMode="numeric" onPaste={(e) => console.log(e.clipboardData)} />
    </form>
  );
}
