/**
 * BattleTopicGrid
 * Atomic Level: Organism
 *
 * Responsive grid of BattleTopicCards (4 → 3 → 2 → 1 columns) with an optional
 * empty state. Supports single-select (`selectedId`) and multi-select
 * (`selectedTopicIds` + `multiSelect`) modes. Selection is controlled by the
 * parent via `onSelect`.
 */

import { cn } from "@/lib/utils";
import { BattleTopicCard } from "@/components/molecules/BattleTopicCard";
import type { BattleTopic } from "@/components/molecules/BattleTopicCard";

export interface BattleTopicGridProps {
  topics: BattleTopic[];
  selectedId?: string | null;
  /** Highlighted ids in multi-select mode. */
  selectedTopicIds?: string[];
  /** Enables the checkbox affordance; selection driven by `selectedTopicIds`. */
  multiSelect?: boolean;
  onSelect?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function BattleTopicGrid({
  topics,
  selectedId,
  selectedTopicIds = [],
  multiSelect = false,
  onSelect,
  emptyTitle = "No topics found",
  emptyDescription = "Try a different search or category filter.",
  className,
}: Readonly<BattleTopicGridProps>) {
  if (topics.length === 0) {
    return (
      <div
        role="status"
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-default bg-surface-muted px-6 py-12 text-center",
          className,
        )}
      >
        <p className="text-sm font-semibold text-text-primary">{emptyTitle}</p>
        <p className="text-xs text-text-secondary">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4",
        className,
      )}
    >
      {topics.map((topic) => (
        <li key={topic.id} className="min-w-0">
          <BattleTopicCard
            topic={topic}
            selected={multiSelect ? selectedTopicIds.includes(topic.id) : selectedId === topic.id}
            onSelect={onSelect}
            multiSelect={multiSelect}
          />
        </li>
      ))}
    </ul>
  );
}

export default BattleTopicGrid;
