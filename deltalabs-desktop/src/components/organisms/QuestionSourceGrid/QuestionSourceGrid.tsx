/**
 * QuestionSourceGrid
 * Atomic Level: Organism
 *
 * Responsive grid of QuestionSourceCards (2 → 1 columns) for the question
 * pool step. Selection is controlled by the parent via `selectedId`/`onSelect`.
 */

import { cn } from "@/lib/utils";
import { QuestionSourceCard } from "@/components/molecules/QuestionSourceCard";
import type { QuestionSource } from "@/components/molecules/QuestionSourceCard";

export interface QuestionSourceGridProps {
  options: QuestionSource[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function QuestionSourceGrid({
  options,
  selectedId,
  onSelect,
  emptyTitle = "No question sources available",
  emptyDescription = "Please try again later.",
  className,
}: Readonly<QuestionSourceGridProps>) {
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
      {options.map((source) => (
        <li key={source.id} className="min-w-0">
          <QuestionSourceCard
            source={source}
            selected={selectedId === source.id}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}

export default QuestionSourceGrid;
