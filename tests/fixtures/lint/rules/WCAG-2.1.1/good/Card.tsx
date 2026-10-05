export function Card({ open, close }: { open: () => void; close: () => void }) {
  return (
    <div>
      <div role="button" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === 'Enter' && open()}>Open</div>
      <div className="fixed inset-0 bg-foreground/50" data-overlay aria-hidden="true" onClick={close} />
      <div className="modal-backdrop" onClick={close} />
      <div onClick={open}><button type="button">Open the April invoice</button></div>
      <button type="button" onClick={open}>Open</button>
    </div>
  );
}
