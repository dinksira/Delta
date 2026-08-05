/**
 * PrizeRuleGrid
 * Atomic Level: Organism
 *
 * Responsive grid of PrizeRuleCards (3 → 2 → 1 columns) with an optional
 * empty state. Selection is controlled by the parent via `selectedId`/`onSelect`.
 */
import { cn } from "@/lib/utils";
import { PrizeRuleCard } from "@/components/molecules/PrizeRuleCard";
import type { PrizeRule } from "@/components/molecules/PrizeRuleCard";

export interface PrizeRuleGridProps {
  rules: PrizeRule[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function PrizeRuleGrid({
  rules,
  selectedId,
  onSelect,
  emptyTitle = "No prize rules available",
  emptyDescription = "Please try again later.",
  className,
}: Readonly<PrizeRuleGridProps>) {
  if (rules.length === 0) {
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
    <ul className={cn("grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3", className)}>
      {rules.map((rule) => (
        <li key={rule.id} className="min-w-0">
          <PrizeRuleCard
            rule={rule}
            selected={selectedId === rule.id}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}

export default PrizeRuleGrid;
