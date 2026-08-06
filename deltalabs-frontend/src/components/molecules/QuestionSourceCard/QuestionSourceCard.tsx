/**
 * QuestionSourceCard
 * Atomic Level: Molecule
 *
 * Selectable question-source card for the Create Topic Battle wizard
 * (question pool step): circular icon chip, title/description, a feature
 * checklist and a solid slate recommendation tag.
 */

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { QuestionSourceCardProps } from "./QuestionSourceCard.types";

export function QuestionSourceCard({
  source,
  selected = false,
  onSelect,
  className,
}: Readonly<QuestionSourceCardProps>) {
  const interactive = Boolean(onSelect);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(source.id)}
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
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
          <span className="size-5" aria-hidden>
            {source.icon}
          </span>
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-primary-700">{source.title}</h3>
          <p className="text-xs text-text-secondary">{source.description}</p>
        </div>
      </div>

      {/* Feature checklist */}
      <ul className="flex flex-col gap-1.5">
        {source.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
            <Check className="size-4 shrink-0 text-success-600" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      {/* Recommendation tag */}
      <div className="mt-auto">
        <span className="inline-flex w-fit rounded-full bg-primary-400 px-3 py-1.5 text-xs font-semibold text-white">
          {source.tag}
        </span>
      </div>
    </button>
  );
}

export default QuestionSourceCard;
