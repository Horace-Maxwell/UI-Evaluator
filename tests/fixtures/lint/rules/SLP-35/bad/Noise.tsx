export function Noise() {
  return (
    <svg aria-hidden="true" width="0" height="0">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" /> {/* expect: SLP-35 */}
      </filter>
    </svg>
  );
}
