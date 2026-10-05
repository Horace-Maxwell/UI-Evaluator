import CountUp from 'react-countup';

export function Hero() {
  return (
    <div>
      <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" /> {/* expect: SLP-11 */}
      <span className="animate-blink">|</span> {/* expect: SLP-11 */}
      <CountUp end={12000} duration={2} /> {/* expect: SLP-11 */}
    </div>
  );
}
