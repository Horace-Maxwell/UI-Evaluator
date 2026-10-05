import { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

export function Board({ onOpen, onMove }: { onOpen: () => void; onMove: (id: string, by: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') onOpen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpen]);

  useHotkeys('mod+k', onOpen);

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'j') onMove('a', 1);
  };

  return (
    <ul onKeyDown={onListKey}>
      <li draggable="true">
        Card A
        <button type="button" onClick={() => onMove('a', -1)}>Move up</button>
        <button type="button" onClick={() => onMove('a', 1)}>Move down</button>
      </li>
      <li>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onOpen}>Bold</button>
        <div role="slider" aria-valuenow={3} onPointerDown={() => onMove('a', 0)} />
        <div onPointerDown={startDrag} />
      </li>
    </ul>
  );
}

function startDrag(e: PointerEvent) {
  const startX = e.clientX;
  return startX;
}
