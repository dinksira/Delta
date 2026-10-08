/**
 * TimelineStep — Step 3 of the Host Competition wizard.
 * Repeatable phase cards: name, description, and a starting/ending date row,
 * with a top-right remove button and an "+ Add" action under the list.
 */

"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Textarea } from "@/components/theme/Textarea";
import {
  useHostCompetitionWizard,
  type PhaseDraft,
} from "@/modules/Competition/context/HostCompetitionWizardContext";

function PhaseCard({ phase, index }: Readonly<{ phase: PhaseDraft; index: number }>) {
  const { dispatch } = useHostCompetitionWizard();
  const update = (patch: Partial<PhaseDraft>) =>
    dispatch({ type: "UPDATE_PHASE", payload: { id: phase.id, patch } });

  return (
    <div className="relative rounded-xl border border-border-default bg-surface-muted/60 p-4">
      <button
        type="button"
        aria-label={`Remove phase ${index + 1}`}
        onClick={() => dispatch({ type: "REMOVE_PHASE", payload: phase.id })}
        className="absolute right-3 top-3 rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-default hover:text-error-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
      >
        <X className="size-4" aria-hidden />
      </button>

      <div className="flex flex-col gap-4">
        <Field id={`phase-name-${phase.id}`} label="Phase Name">
          <Input
            id={`phase-name-${phase.id}`}
            value={phase.name}
            placeholder="Phase Name"
            onChange={(event) => update({ name: event.target.value })}
          />
        </Field>

        <Field id={`phase-description-${phase.id}`} label="Phase Description">
          <Textarea
            id={`phase-description-${phase.id}`}
            rows={3}
            value={phase.description}
            placeholder="Describe for this phase"
            onChange={(event) => update({ description: event.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`phase-start-${phase.id}`} label="Starting Date">
            <Input
              id={`phase-start-${phase.id}`}
              type="date"
              value={phase.startDate}
              onChange={(event) => update({ startDate: event.target.value })}
            />
          </Field>
          <Field id={`phase-end-${phase.id}`} label="Ending Date">
            <Input
              id={`phase-end-${phase.id}`}
              type="date"
              value={phase.endDate}
              min={phase.startDate || undefined}
              onChange={(event) => update({ endDate: event.target.value })}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

export function TimelineStep() {
  const { state, dispatch } = useHostCompetitionWizard();
  const { phases } = state.draft;

  return (
    <div className="flex flex-col gap-4">
      {phases.length === 0 && (
        <p className="rounded-xl border border-dashed border-border-default bg-surface-muted/60 px-4 py-6 text-center text-sm text-text-secondary">
          No phases yet — add one to build your timeline.
        </p>
      )}

      {phases.map((phase, index) => (
        <PhaseCard key={phase.id} phase={phase} index={index} />
      ))}

      <div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => dispatch({ type: "ADD_PHASE" })}
          className="h-auto gap-1.5 rounded-full px-4 py-2 text-sm"
        >
          <Plus className="size-4" aria-hidden />
          Add
        </Button>
      </div>
    </div>
  );
}

export default TimelineStep;
