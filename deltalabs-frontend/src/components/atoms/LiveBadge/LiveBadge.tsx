/**
 * LiveBadge — pulsing red "LIVE" status pill used over the live stream stage.
 * The animated dot signals the room is broadcasting right now.
 *
 * @example
 * ```tsx
 * <LiveBadge />
 * ```
 */

import { cn } from "@/lib/utils";

export interface LiveBadgeProps {
  className?: string;
}

export function LiveBadge({ className }: Readonly<LiveBadgeProps>) {
  return (
    <span
      role="status"
      aria-label="Live"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-error-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm",
        className,
      )}
    >
      <span className="relative flex size-2" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-white" />
      </span>
      Live
    </span>
  );
}

export default LiveBadge;