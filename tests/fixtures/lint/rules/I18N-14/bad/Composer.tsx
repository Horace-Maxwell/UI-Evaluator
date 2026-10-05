export function Composer({ send }: { send: () => void }) {
  return <textarea aria-label="Message" onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />; // expect: I18N-14
}
