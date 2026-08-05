/**
 * MatchVisibilityGrid
 * Atomic Level: Organism
 *
 * Responsive grid of MatchVisibilityCards (2 → 1 columns) for the match type
 * step. Selection is controlled by the parent via `selectedId`/`onSelect`.
 */

import { cn } from "@/lib/utils";
import { MatchVisibilityCard } from "@/components/molecules/MatchVisibilityCard";
import type { MatchVisibility } from "@/components/molecules/MatchVisibilityCard";

export interface MatchVisibilityGridProps {
  options: MatchVisibility[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function MatchVisibilityGrid({
  options,
  selectedId,
  onSelect,
  emptyTitle = "No visibility options available",
  emptyDescription = "Please try again later.",
  className,
}: Readonly<MatchVisibilityGridProps>) {
  if (options.length === 0) {
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
    <ul className={cn("grid grid-cols-1 gap-5 md:grid-cols-2", className)}>
      {options.map((visibility) => (
        <li key={visibility.id} className="min-w-0">
          <MatchVisibilityCard
            visibility={visibility}
            selected={selectedId === visibility.id}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}

export default MatchVisibilityGrid;
