/**
 * PrizePoolCounter
 * Atomic Level: Molecule
 *
 * Total-prize-pool adjuster for the Create Topic Battle wizard (prize rules
 * step). Follows the Step 5 redesign spec: a light cool-grey card with − / ＋
 * dark circular buttons around a bold "N ETB" display and the centered
 * "Total Prize Pool Available" caption.
 */

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PrizePoolCounterProps } from "./PrizePoolCounter.types";

const stepButtonClasses =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white transition-colors duration-150 hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

export function PrizePoolCounter({
  value,
  onChange,
  min = 0,
  max,
  step = 10,
  className,
}: Readonly<PrizePoolCounterProps>) {
  const clamped = max === undefined ? Math.max(min, value) : Math.min(max, Math.max(min, value));
  const canDecrease = clamped > min;
  const canIncrease = max === undefined || clamped < max;

  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-xl bg-surface-muted px-6 py-6", className)}>
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => onChange(clamped - step)}
          disabled={!canDecrease}
          aria-label="Decrease prize pool"
          className={stepButtonClasses}
        >
          <Minus className="size-4" aria-hidden />
        </button>

        <span className="min-w-40 text-center text-3xl font-bold text-primary-700">
          {clamped} ETB
        </span>

        <button
          type="button"
          onClick={() => onChange(clamped + step)}
          disabled={!canIncrease}
          aria-label="Increase prize pool"
          className={stepButtonClasses}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>

      <p className="text-[13px] font-medium text-text-secondary">Total Prize Pool Available</p>
    </div>
  );
}

export default PrizePoolCounter;
