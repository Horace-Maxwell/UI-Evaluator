// The dot is shown only while the feed is connected, and says so.
export function LiveBadge({ connected }: { connected: boolean }) {
  return (
    <span>
      {connected && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />}
      <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" aria-label="Live: receiving readings" />
      <input className="caret-primary" aria-label="Command" />
    </span>
  );
}
