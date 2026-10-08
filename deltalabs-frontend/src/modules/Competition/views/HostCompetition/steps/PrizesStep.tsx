/**
 * PrizesStep — Step 2 of the Host Competition wizard.
 * Repeatable prize cards (rank + type on top, value + win condition below)
 * with a top-right remove button and an "+ Add" action under the list.
 */

"use client";

import { Banknote, Medal, Plus, Trophy, X } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Select } from "@/components/theme/Select";
import { Textarea } from "@/components/theme/Textarea";
import {
  useHostCompetitionWizard,
  type PrizeDraft,
} from "@/modules/Competition/context/HostCompetitionWizardContext";
import { cn } from "@/lib/utils";

const PRIZE_TYPES = ["Money", "In-Kind", "Medal", "Subscription"] as const;

/** Input with a leading glyph pinned inside the field. */
function IconInput({
  icon,
  ...props
}: Readonly<{ icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <span className="relative block">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        aria-hidden
      >
        {icon}
      </span>
      <Input {...props} className={cn("pl-9", props.className)} />
    </span>
  );
}

function PrizeCard({ prize, index }: Readonly<{ prize: PrizeDraft; index: number }>) {
  const { dispatch } = useHostCompetitionWizard();
  const update = (patch: Partial<PrizeDraft>) =>
    dispatch({ type: "UPDATE_PRIZE", payload: { id: prize.id, patch } });

  return (
    <div className="relative rounded-xl border border-border-default bg-surface-muted/60 p-4">
      <button
        type="button"
        aria-label={`Remove prize ${index + 1}`}
        onClick={() => dispatch({ type: "REMOVE_PRIZE", payload: prize.id })}
        className="absolute right-3 top-3 rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-default hover:text-error-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
      >
        <X className="size-4" aria-hidden />
      </button>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`prize-rank-${prize.id}`} label="Prize Rank">
          <IconInput
            icon={<Medal className="size-4" />}
            id={`prize-rank-${prize.id}`}
            value={prize.rank}
            placeholder="eg. 1st place"
            onChange={(event) => update({ rank: event.target.value })}
          />
        </Field>
        <Field id={`prize-type-${prize.id}`} label="Prize Type">
          <Select
            id={`prize-type-${prize.id}`}
            value={prize.type}
            onChange={(event) => update({ type: event.target.value })}
          >
            {PRIZE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field id={`prize-value-${prize.id}`} label="Prize Value / Description">
          <Textarea
            id={`prize-value-${prize.id}`}
            rows={2}
            value={prize.value}
            placeholder="500 ETB/ 3 months free subscriptions..."
            onChange={(event) => update({ value: event.target.value })}
          />
          <Banknote className="mt-1 size-4 text-text-secondary" aria-hidden />
        </Field>
        <Field id={`prize-condition-${prize.id}`} label="Win Condition">
          <Textarea
            id={`prize-condition-${prize.id}`}
            rows={2}
            value={prize.condition}
            placeholder="e.g Highest Score"
            onChange={(event) => update({ condition: event.target.value })}
          />
          <Trophy className="mt-1 size-4 text-text-secondary" aria-hidden />
        </Field>
      </div>
    </div>
  );
}

export function PrizesStep() {
  const { state, dispatch } = useHostCompetitionWizard();
  const { prizes } = state.draft;

  return (
    <div className="flex flex-col gap-4">
      {prizes.length === 0 && (
        <p className="rounded-xl border border-dashed border-border-default bg-surface-muted/60 px-4 py-6 text-center text-sm text-text-secondary">
          No prizes yet — add one to get started.
        </p>
      )}

      {prizes.map((prize, index) => (
        <PrizeCard key={prize.id} prize={prize} index={index} />
      ))}

      <div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => dispatch({ type: "ADD_PRIZE" })}
          className="h-auto gap-1.5 rounded-full px-4 py-2 text-sm"
        >
          <Plus className="size-4" aria-hidden />
          Add
        </Button>
      </div>
    </div>
  );
}

export default PrizesStep;
