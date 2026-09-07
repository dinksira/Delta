/**
 * LiveLeaderboardPanel — bottom panel of the Live Duel right sidebar. Lists
 * the ranked entries with points stacked over the "Points" unit label, inside
 * a scrollable column so the card stays compact during a long battle.
 *
 * @example
 * ```tsx
 * <LiveLeaderboardPanel entries={room.leaderboard} />
 * ```
 */

import { Trophy } from "lucide-react";

import { LeaderboardRow } from "@/components/molecules/LeaderboardRow";
import type { DuelLeaderboardEntry } from "@/modules/Competition/types/duelQuiz";
import { cn } from "@/lib/utils";

export interface LiveLeaderboardPanelProps {
  entries: DuelLeaderboardEntry[];
  className?: string;
}

export function LiveLeaderboardPanel({ entries, className }: Readonly<LiveLeaderboardPanelProps>) {
  return (
    <aside
      aria-label="Live leaderboard"
      className={cn(
        "flex min-h-0 flex-1 flex-col rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-warning-500" aria-hidden />
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-primary">
            Live Leaderboard
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-bold text-warning-700 dark:bg-warning-900/40 dark:text-warning-300">
          {entries.length} players
        </span>
      </div>
      <ol className="max-h-[320px] min-h-0 divide-y divide-border-subtle overflow-y-auto">
        {entries.map((entry) => (
          <li key={`${entry.rank}-${entry.name}`}>
            <LeaderboardRow entry={entry} pointsLabel="Points" />
          </li>
        ))}
      </ol>
    </aside>
  );
}

export default LiveLeaderboardPanel;