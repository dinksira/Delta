/**
 * LiveDuelGrid — responsive grid of Live Duel lobby cards with an empty state,
 * mirroring the topic battle grid.
 *
 * @example
 * ```tsx
 * <LiveDuelGrid duels={entries} onJoin={openFor} />
 * ```
 */

import { Radio } from "lucide-react";

import { LiveDuelCard } from "@/components/organisms/LiveDuelCard/LiveDuelCard";
import type { LiveDuelEntry } from "@/modules/Competition/types/liveDuel";
import { cn } from "@/lib/utils";

export interface LiveDuelGridProps {
  duels: LiveDuelEntry[];
  onJoin?: (id: string) => void;
  onEnter?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function LiveDuelGrid({
  duels,
  onJoin,
  onEnter,
  emptyTitle = "No live duels found",
  emptyDescription = "Live duels will appear here once they are hosted.",
  className,
}: Readonly<LiveDuelGridProps>) {
  if (duels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default p-12 text-center">
        <Radio className="size-8 text-text-tertiary" aria-hidden />
        <p className="mt-3 text-lg font-medium text-text-primary">{emptyTitle}</p>
        <p className="mt-1 text-sm text-text-secondary">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {duels.map((duel) => (
        <LiveDuelCard
          key={duel.id}
          duel={duel}
          onJoin={onJoin}
          onEnter={onEnter}
        />
      ))}
    </div>
  );
}

export default LiveDuelGrid;