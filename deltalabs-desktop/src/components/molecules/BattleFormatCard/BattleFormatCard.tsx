/**
 * BattleFormatCard
 * Atomic Level: Molecule
 *
 * Selectable battle-format card for the Create Topic Battle wizard (battle
 * format step). Follows the Step 2 redesign spec: dark square icon chip,
 * title/description, a dual-column metric pill bar (Players / Duration),
 * a 3-item feature checklist, and a dark "Tournament Structure" chip track.
 * Selected cards get a 2px primary border + drop shadow; cards lift on hover.
 */

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BattleFormatCardProps } from "./BattleFormatCard.types";

export function BattleFormatCard({
  format,
  selected = false,
  onSelect,
  className,
}: Readonly<BattleFormatCardProps>) {
  const interactive = Boolean(onSelect);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(format.id)}
      disabled={!interactive}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full cursor-pointer select-none flex-col gap-4 rounded-2xl border-2 bg-surface-default p-6 text-left shadow-sm transition-all duration-200",
        interactive && "hover:-translate-y-0.5 hover:shadow-md",
        selected
          ? "border-primary-700 shadow-md"
          : "border-border-default hover:border-primary-400",
        !interactive && "cursor-default",
        className,
      )}
    >
      {/* Floating recommended badge */}
      {format.recommended && (
        <span className="absolute right-4 top-4 rounded-full bg-primary-700 px-3 py-1 text-xs font-semibold text-white">
          Recommended
        </span>
      )}

      {/* Icon chip + title */}
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white">
          <span className="size-5" aria-hidden>
            {format.icon}
          </span>
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-primary-700">
            {format.title}
          </h3>
          <p className="truncate text-xs text-text-secondary">{format.description}</p>
        </div>
      </div>

      {/* Metric pill bar: Players / Duration */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5 rounded-lg bg-primary-400 px-3 py-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/80">
            Players
          </span>
          <span className="text-[13px] font-bold text-white">{format.metrics.players}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-lg bg-primary-400 px-3 py-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/80">
            Duration
          </span>
          <span className="text-[13px] font-bold text-white">{format.metrics.duration}</span>
        </div>
      </div>

      {/* Feature checklist */}
      <ul className="flex flex-col gap-1.5">
        {format.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
            <Check className="size-4 shrink-0 text-success-600" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      {/* Structure chip track */}
      <div className="mt-auto flex flex-col gap-2">
        <span className="text-xs font-semibold text-text-secondary">
          {format.structureLabel}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-primary-800 p-2">
          {format.chips.map((chip, index) => (
            <span key={`${chip}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && format.chipsSeparator && (
                <span className="text-xs font-bold text-white/70">
                  {format.chipsSeparator}
                </span>
              )}
              <span
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-semibold",
                  chip === "..."
                    ? "bg-white/15 text-white"
                    : "bg-white text-primary-700",
                )}
              >
                {chip}
              </span>
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

export default BattleFormatCard;
