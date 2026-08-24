/**
 * TimingOptionGrid
 * Atomic Level: Organism
 *
 * Responsive grid of TimingOptionCards (2 → 1 columns) for the "When to start
 * Battle" section of the match type step. Selection is controlled by the
 * parent via `selectedId`/`onSelect`.
 */

import { cn } from "@/lib/utils";
import { TimingOptionCard } from "@/components/molecules/TimingOptionCard";
import type { TimingOption } from "@/components/molecules/TimingOptionCard";

export interface TimingOptionGridProps {
  options: TimingOption[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

export function TimingOptionGrid({
  options,
  selectedId,
  onSelect,
  className,
}: Readonly<TimingOptionGridProps>) {
  return (
    <ul className={cn("grid grid-cols-1 gap-5 md:grid-cols-2", className)}>
      {options.map((option) => (
        <li key={option.id} className="min-w-0">
          <TimingOptionCard
            option={option}
            selected={selectedId === option.id}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}

export default TimingOptionGrid;
