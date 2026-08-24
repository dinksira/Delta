/**
 * LeaderboardPanel — sidebar card listing duel participants by rank.
 * Renders each entry through `LeaderboardRow`; the current user's row is
 * highlighted by the row component itself.
 *
 * @example
 * ```tsx
 * <LeaderboardPanel entries={quiz.leaderboard} />
 * ```
 */

import { Trophy } from "lucide-react";

import { LeaderboardRow } from "@/components/molecules/LeaderboardRow";
import type { DuelLeaderboardEntry } from "@/modules/Competition/types/duelQuiz";
import { cn } from "@/lib/utils";

export interface LeaderboardPanelProps {
  entries: DuelLeaderboardEntry[];
  className?: string;
}

export function LeaderboardPanel({ entries, className }: Readonly<LeaderboardPanelProps>) {
  return (
    <aside
      className={cn(
        "rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="size-4 text-warning-500" aria-hidden />
        <h3 className="text-sm font-bold uppercase tracking-wide text-text-primary">
          Leaderboard
        </h3>
      </div>
      <ol className="divide-y divide-border-subtle">
        {entries.map((entry) => (
          <li key={`${entry.rank}-${entry.name}`}>
            <LeaderboardRow entry={entry} />
          </li>
        ))}
      </ol>
    </aside>
  );
}

export default LeaderboardPanel;
