/**
 * BattleFormatGrid
 * Atomic Level: Organism
 *
 * Responsive grid of BattleFormatCards (3 → 2 → 1 columns) with an optional
 * empty state. Selection is controlled by the parent via `selectedId`/`onSelect`.
 * A 5-card list lays out as 3 cards (Row 1) + 2 cards left-aligned (Row 2).
 */

import { cn } from "@/lib/utils";
import { BattleFormatCard } from "@/components/molecules/BattleFormatCard";
import type { BattleFormat } from "@/components/molecules/BattleFormatCard";

export interface BattleFormatGridProps {
  formats: BattleFormat[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function BattleFormatGrid({
  formats,
  selectedId,
  onSelect,
  emptyTitle = "No formats available",
  emptyDescription = "Please try again later.",
  className,
}: Readonly<BattleFormatGridProps>) {
  if (formats.length === 0) {
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
        "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {formats.map((format) => (
        <li key={format.id} className="min-w-0">
          <BattleFormatCard
            format={format}
            selected={selectedId === format.id}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}

export default BattleFormatGrid;
