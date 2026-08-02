/**
 * BattleSummaryPanel — compact recap of a topic battle for confirmation dialogs.
 * Echoes the TopicBattleCard (status, title, subject/creator, prize/entry economics,
 * players progress) in a single read-only panel.
 *
 * @example
 * ```tsx
 * <BattleSummaryPanel battle={battle} />
 * ```
 */

import { ProgressBar } from "@/components/atoms/ProgressBar";
import { getInitials, getStatusBadgeClass, getStatusLabel } from "@/modules/Competition/utils";
import type { TopicBattle } from "@/modules/Competition/types/topicBattle";
import { cn } from "@/lib/utils";

export interface BattleSummaryPanelProps {
  battle: TopicBattle;
  className?: string;
}

export function BattleSummaryPanel({ battle, className }: Readonly<BattleSummaryPanelProps>) {
  const creatorName = battle.isOwner ? "You" : battle.creator.name;
  const progress =
    battle.playersMax > 0
      ? Math.min(100, Math.round((battle.playersJoined / battle.playersMax) * 100))
      : 0;

  return (
    <div
      className={cn("rounded-xl border border-border-default bg-surface-muted/60 p-4", className)}
    >
      {/* Status badge + difficulty pill */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            getStatusBadgeClass(battle.status),
          )}
        >
          {getStatusLabel(battle.status)}
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full border border-border-default px-2.5 py-0.5 text-xs text-text-secondary">
          {battle.difficulty}
        </span>
      </div>

      {/* Title */}
      <h4 className="mt-3 text-base font-bold text-text-primary">{battle.title}</h4>

      {/* Subject · creator */}
      <p className="mt-1.5 flex items-center gap-2 text-xs text-text-secondary">
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-700 text-[9px] font-semibold text-white"
          aria-hidden
        >
          {getInitials(creatorName)}
        </span>
        {battle.subject} · Created by {creatorName}
      </p>

      {/* Compact 3-cell economics grid */}
      <div className="mt-4 grid grid-cols-3 divide-x divide-border-default rounded-lg border border-border-default bg-surface-default">
        <div className="flex flex-col items-center gap-0.5 px-2 py-2">
          <p className="text-sm font-bold text-text-primary">
            {battle.playersJoined}/{battle.playersMax}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-text-secondary">Players</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2 py-2">
          <p className="text-sm font-bold text-success-600 dark:text-success-400">
            {battle.prizePool}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-text-secondary">Prize Pool</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2 py-2">
          <p className="text-sm font-bold text-primary-700 dark:text-primary-300">
            {battle.entryFee}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-text-secondary">Entry Fee</p>
        </div>
      </div>

      <ProgressBar
        className="mt-3"
        progress={progress}
        valueText={`${battle.playersJoined}/${battle.playersMax}`}
      />
    </div>
  );
}

export default BattleSummaryPanel;
