export function Composer({ send }: { send: () => void }) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') send();
  };
  return (
    <div>
      <textarea aria-label="Message" onKeyDown={onKeyDown} />
      <input aria-label="Name" onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); }} />
    </div>
  );
}
