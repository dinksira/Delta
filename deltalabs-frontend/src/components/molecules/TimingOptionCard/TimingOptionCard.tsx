/**
 * TimingOptionCard
 * Atomic Level: Molecule
 *
 * Small selectable timing card for the Create Topic Battle wizard (match type
 * step → "When to start Battle"): dark icon chip, title, and a one-line
 * description. Selected cards get a 2px primary border + drop shadow.
 */

import { cn } from "@/lib/utils";
import type { TimingOptionCardProps } from "./TimingOptionCard.types";

export function TimingOptionCard({
  option,
  selected = false,
  onSelect,
  className,
}: Readonly<TimingOptionCardProps>) {
  const interactive = Boolean(onSelect);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(option.id)}
      disabled={!interactive}
      aria-pressed={selected}
      className={cn(
        "group flex w-full cursor-pointer select-none items-center gap-3 rounded-2xl border-2 bg-surface-default p-5 text-left transition-all duration-200",
        interactive && "hover:-translate-y-0.5 hover:shadow-md",
        selected
          ? "border-primary-700 shadow-md"
          : "border-border-default hover:border-primary-400 hover:bg-surface-canvas",
        !interactive && "cursor-default",
        className,
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white">
        <span className="size-5" aria-hidden>
          {option.icon}
        </span>
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-base font-bold text-primary-700">{option.title}</h3>
        <p className="truncate text-xs text-text-secondary">{option.description}</p>
      </div>
    </button>
  );
}

export default TimingOptionCard;
