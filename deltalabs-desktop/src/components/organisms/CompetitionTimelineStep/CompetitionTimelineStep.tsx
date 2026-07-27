/**
 * CompetitionTimelineStep
 * Step 3: Repeatable PhaseEntryCard list + Add button.
 */

import { Plus } from "lucide-react";

import { PhaseEntryCard } from "@/components/molecules/PhaseEntryCard/PhaseEntryCard";
import { Button } from "@/components/theme/Button";
import type { PhaseEntry } from "@/modules/Competition/types/host";
import { cn } from "@/lib/utils";

export interface CompetitionTimelineStepProps {
  phases: PhaseEntry[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<PhaseEntry>) => void;
  onRemove: (id: string) => void;
  className?: string;
}

export function CompetitionTimelineStep({
  phases,
  onAdd,
  onChange,
  onRemove,
  className,
}: Readonly<CompetitionTimelineStepProps>) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <h2 className="text-lg font-bold text-text-primary">Competition Timeline</h2>

      <div className="flex flex-col gap-3">
        {phases.map((entry) => (
          <PhaseEntryCard
            key={entry.id}
            entry={entry}
            onChange={onChange}
            onRemove={onRemove}
          />
        ))}
      </div>

      <div>
        <Button variant="primary" size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
