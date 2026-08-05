/**
 * FeeSelector
 * Atomic Level: Molecule
 *
 * Entry-fee picker for the Create Topic Battle wizard (player & entry step).
 * Follows the Step 4 redesign spec: a "Entry Fee" header, a 2×2 grid of preset
 * fee cards (Free / 5 / 10 / 20 ETB per player, with "Popular" pills on Free
 * and 5), and an always-visible "Custom Amount" ETB input that activates the
 * Custom fee as soon as it is edited.
 */

import { Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EntryFeeOption {
  label: string;
  value: number | "Free";
  /** Optional "Popular" pill in the card's top-right corner. */
  isPopular?: boolean;
}

export interface FeeSelectorProps {
  options: EntryFeeOption[];
  value: number | "Free" | "Custom";
  customFee?: number;
  onChange: (fee: number | "Free" | "Custom", customFee?: number) => void;
  className?: string;
}

export function FeeSelector({
  options,
  value,
  customFee,
  onChange,
  className,
}: Readonly<FeeSelectorProps>) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center gap-2">
        <Wallet className="size-5 text-primary-700" aria-hidden />
        <h3 className="text-sm font-bold text-primary-700">Entry Fee</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={cn(
                "relative flex min-h-14 items-center justify-center rounded-xl border-2 px-3 py-3 text-center transition-all duration-200",
                selected
                  ? "border-primary-700 bg-primary-700 text-white shadow-md"
                  : "border-border-default bg-surface-default text-text-primary hover:border-primary-400",
              )}
            >
              {option.isPopular && (
                <span
                  className={cn(
                    "absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    selected ? "bg-white text-primary-700" : "bg-primary-700 text-white",
                  )}
                >
                  Popular
                </span>
              )}
              <span className="text-sm font-bold">{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="custom-fee" className="text-[13px] font-bold text-primary-700">
          Custom Amount
        </label>
        <div className="relative">
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-tertiary"
            aria-hidden
          >
            ETB
          </span>
          <input
            id="custom-fee"
            type="number"
            min={1}
            inputMode="numeric"
            value={customFee ?? 25}
            onChange={(event) =>
              onChange("Custom", event.target.value === "" ? 0 : Number(event.target.value))
            }
            className={cn(
              "h-11 w-full rounded-lg bg-surface-muted pl-12 pr-3 text-sm font-medium text-primary-700 outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary-400/60",
              value === "Custom" && "ring-2 ring-primary-700",
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default FeeSelector;
