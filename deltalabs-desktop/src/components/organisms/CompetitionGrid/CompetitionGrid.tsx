/**
 * CompetitionGrid
 * Responsive grid that maps competitions[] into CompetitionCard components.
 */

import { CompetitionCard } from "@/components/organisms/CompetitionCard/CompetitionCard";
import type { CompetitionCardData } from "@/components/organisms/CompetitionCard/CompetitionCard";
import { cn } from "@/lib/utils";

export interface CompetitionGridProps {
  competitions: CompetitionCardData[];
  onJoin?: (id: string) => void;
  className?: string;
}

export function CompetitionGrid({
  competitions,
  onJoin,
  className,
}: Readonly<CompetitionGridProps>) {
  if (competitions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default p-12 text-center">
        <p className="text-lg font-medium text-text-primary">No competitions found</p>
        <p className="mt-1 text-sm text-text-secondary">
          Try a different search or filter.
        </p>
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
      {competitions.map((competition) => (
        <CompetitionCard
          key={competition.id}
          competition={competition}
          onJoin={onJoin}
        />
      ))}
    </div>
  );
}
