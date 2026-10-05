import { useEffect } from 'react';

export function Board({ onOpen, onDelete }: { onOpen: () => void; onDelete: (id: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k') onOpen();
    };
    window.addEventListener('keydown', onKey); // expect: A11Y-17
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpen]);

  useEffect(() => {
    window.addEventListener('devicemotion', () => onOpen()); // expect: A11Y-17
  }, [onOpen]);

  return (
    <ul>
      <li draggable="true">Card A</li> {/* expect: A11Y-17 */}
      <li>
        <button type="button" onMouseDown={() => onDelete('a')}>Delete</button> {/* expect: A11Y-17 */}
      </li>
    </ul>
  );
}
