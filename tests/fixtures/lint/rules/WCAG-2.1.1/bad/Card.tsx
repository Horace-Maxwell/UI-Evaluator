export function Card({ open }: { open: () => void }) {
  return <div className="card" onClick={open}>Open the April invoice</div>; // expect: WCAG-2.1.1
}
