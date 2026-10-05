export function Menu() {
  return (
    <div role="menu">
      <div role="menuitem" tabIndex={0}>Open</div>
      <div role="menuitem" tabIndex={-1}>Rename</div>
    </div>
  );
}
