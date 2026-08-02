/**
 * LeaderboardRow — a single ranked entry in a battle leaderboard.
 * Shows rank, monogram avatar, name, and points; highlights the current user
 * with a primary ring and "You" label.
 *
 * @example
 * ```tsx
 * <LeaderboardRow entry={entry} />
 * ```
 */

import { getInitials } from "@/modules/Competition/utils";
import type { DuelLeaderboardEntry } from "@/modules/Competition/types/duelQuiz";
import { cn } from "@/lib/utils";

export interface LeaderboardRowProps {
  entry: DuelLeaderboardEntry;
  className?: string;
}

export function LeaderboardRow({ entry, className }: Readonly<LeaderboardRowProps>) {
  const isUser = Boolean(entry.isCurrentUser);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-2 py-2",
        isUser && "bg-primary-50 dark:bg-primary-900/30",
        className,
      )}
    >
      <span
        className={cn(
          "w-6 shrink-0 text-center text-sm font-bold tabular-nums",
          entry.rank <= 3 ? "text-text-primary" : "text-text-tertiary",
        )}
      >
        {entry.rank}
      </span>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          isUser
            ? "bg-primary-700 text-white ring-2 ring-primary-300"
            : "bg-surface-muted text-text-secondary",
        )}
        aria-hidden
      >
        {getInitials(entry.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">
          {entry.name}
          {isUser ? <span className="ml-1.5 text-xs font-medium text-primary-600">(You)</span> : null}
        </p>
      </div>
      <span className="shrink-0 text-sm font-bold tabular-nums text-text-primary">
        {entry.points.toLocaleString()}
      </span>
    </div>
  );
}

export default LeaderboardRow;
