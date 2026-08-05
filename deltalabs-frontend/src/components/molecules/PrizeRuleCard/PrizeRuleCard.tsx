/**
 * PrizeRuleCard
 * Atomic Level: Molecule
 *
 * Selectable prize-distribution card for the Create Topic Battle wizard
 * (prize rules step). Follows the Step 5 redesign spec: square dark icon chip,
 * title/description, an optional top-right "Recommended" pill, and a muted
 * tag pill pinned to the bottom.
 */

import { cn } from "@/lib/utils";
import type { PrizeRuleCardProps } from "./PrizeRuleCard.types";

export function PrizeRuleCard({
  rule,
  selected = false,
  onSelect,
  className,
}: Readonly<PrizeRuleCardProps>) {
  const interactive = Boolean(onSelect);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(rule.id)}
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
      {rule.recommended && (
        <span className="absolute right-4 top-4 rounded-full bg-primary-700 px-3 py-1 text-xs font-semibold text-white">
          Recommended
        </span>
      )}

      {/* Icon chip */}
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white">
        <span className="size-5" aria-hidden>
          {rule.icon}
        </span>
      </span>

      {/* Title + description */}
      <div className="min-w-0">
        <h3 className="text-lg font-bold text-primary-700">{rule.title}</h3>
        <p className="mt-0.5 text-[13px] text-text-secondary">{rule.description}</p>
      </div>

      {/* Bottom tag pill */}
      <span className="mt-auto inline-flex w-fit rounded-full bg-primary-400 px-3 py-1.5 text-xs font-semibold text-white">
        {rule.tag}
      </span>
    </button>
  );
}

export default PrizeRuleCard;
