/**
 * MatchVisibilityCard
 * Atomic Level: Molecule
 *
 * Selectable match-visibility card for the Create Topic Battle wizard (match
 * visibility step): icon chip, title/description, a feature checklist, and a
 * "Best for" audience pill.
 */

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MatchVisibilityCardProps } from "./MatchVisibilityCard.types";

export function MatchVisibilityCard({
  visibility,
  selected = false,
  onSelect,
  className,
}: Readonly<MatchVisibilityCardProps>) {
  const interactive = Boolean(onSelect);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(visibility.id)}
      disabled={!interactive}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full cursor-pointer select-none flex-col gap-4 rounded-2xl border-2 bg-surface-default p-6 text-left shadow-sm transition-all duration-200",
        interactive && "hover:-translate-y-0.5 hover:shadow-md",
        selected
          ? "border-primary-700 shadow-md"
          : "border-border-default hover:border-primary-400 hover:bg-surface-canvas",
        !interactive && "cursor-default",
        className,
      )}
    >
      {/* Icon chip + title */}
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white">
          <span className="size-5" aria-hidden>
            {visibility.icon}
          </span>
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-primary-700">{visibility.title}</h3>
          <p className="text-xs text-text-secondary">{visibility.description}</p>
        </div>
      </div>

      {/* Feature checklist */}
      <ul className="flex flex-col gap-1.5">
        {visibility.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
            <Check className="size-4 shrink-0 text-success-600" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      {/* Best-for pill */}
      <div className="mt-auto">
        <span className="inline-flex w-fit rounded-full bg-primary-400 px-3 py-1.5 text-xs font-semibold text-white">
          Best for: {visibility.bestFor}
        </span>
      </div>
    </button>
  );
}

export default MatchVisibilityCard;
