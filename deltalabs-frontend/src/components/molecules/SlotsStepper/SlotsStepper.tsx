/**
 * SlotsStepper
 * Atomic Level: Molecule
 *
 * Number-of-Players configuration card for the Create Topic Battle wizard
 * (player & entry step). Follows the Step 4 redesign spec: light cool-grey
 * filled card with a "Number of Players" header, large slot-count display,
 * circular −/＋ stepper controls, a Min/Max range track, and a nested darker
 * format info banner.
 */

import { Minus, Plus, Users } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SlotsStepperProps {
  /** Current slot count (clamped to min/max). */
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Optional format banner title, e.g. "Format: 1 VS 1 Duel". */
  formatTitle?: string;
  /** Optional format banner description. */
  formatDescription?: string;
  className?: string;
}

const stepButtonClasses =
  "flex size-9 items-center justify-center rounded-full bg-primary-700 text-white transition-colors duration-150 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

export function SlotsStepper({
  value,
  min,
  max,
  onChange,
  formatTitle,
  formatDescription,
  className,
}: Readonly<SlotsStepperProps>) {
  const clamped = Math.min(max, Math.max(min, value));
  const canDecrease = clamped > min;
  const canIncrease = clamped < max;
  const fillPercent = min === max ? 100 : ((clamped - min) / (max - min)) * 100;

  return (
    <div className={cn("flex flex-col gap-5 rounded-2xl bg-surface-muted p-6", className)}>
      <div className="flex items-center gap-2">
        <Users className="size-5 text-primary-700" aria-hidden />
        <h3 className="text-sm font-bold text-primary-700">Number of Players</h3>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-5xl font-bold leading-none text-primary-700">{clamped}</span>
        <span className="text-sm text-text-secondary">Total Battle Slots</span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="text-sm font-medium text-text-secondary">Players:</span>
        <button
          type="button"
          onClick={() => onChange(clamped - 1)}
          disabled={!canDecrease}
          aria-label="Decrease player slots"
          className={stepButtonClasses}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="min-w-6 text-center text-lg font-bold text-primary-700">{clamped}</span>
        <button
          type="button"
          onClick={() => onChange(clamped + 1)}
          disabled={!canIncrease}
          aria-label="Increase player slots"
          className={stepButtonClasses}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs font-medium text-text-secondary">
        <span>Min: {min}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-200" aria-hidden>
          <div
            className="h-full rounded-full bg-primary-700 transition-all duration-300"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <span>Max: {max}</span>
      </div>

      {formatTitle && (
        <div className="rounded-xl bg-primary-800 p-4">
          <p className="text-sm font-bold text-white">{formatTitle}</p>
          {formatDescription && (
            <p className="mt-0.5 text-xs text-white/70">{formatDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default SlotsStepper;
