/**
 * BattleTopicCard
 * Atomic Level: Molecule
 *
 * Selectable topic card used in the Create Topic Battle wizard (topic
 * selection step): dark-teal per-subject icon chip, difficulty pill, subject
 * name with an inline "Popular" badge, and a question count line. Mirrors the
 * Step 1 spec tile read. An optional multi-select checkbox replaces the
 * difficulty pill when multi-select mode is active. Fits a responsive grid.
 */

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BattleTopicCardProps } from "./BattleTopicCard.types";

export function BattleTopicCard({
  topic,
  selected = false,
  onSelect,
  multiSelect = false,
  className,
}: Readonly<BattleTopicCardProps>) {
  const interactive = Boolean(onSelect);
  const questionCount = topic.questionCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(topic.id)}
      disabled={!interactive}
      aria-pressed={selected}
      className={cn(
        "group flex w-full cursor-pointer select-none flex-col gap-3 rounded-xl border bg-surface-default p-4 text-left shadow-sm transition-all duration-200",
        interactive && "hover:border-primary-400 hover:shadow-md",
        selected
          ? "border-primary-600 ring-2 ring-primary-600/20"
          : "border-border-subtle",
        !interactive && "cursor-default",
        className,
      )}
    >
      {/* Icon chip (left) + difficulty pill / multi-select checkbox (right) */}
      <div className="flex items-center justify-between gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white"
          aria-hidden
        >
          {topic.icon}
        </span>
        {multiSelect ? (
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
              selected
                ? "border-primary-600 bg-primary-600 text-white"
                : "border-border-default bg-surface-muted text-transparent group-hover:border-primary-400",
            )}
            aria-hidden
          >
            <Check className="size-3.5" />
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
            {topic.difficulty}
          </span>
        )}
      </div>

      {/* Subject name + inline Popular badge */}
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 truncate text-base font-bold leading-tight text-primary-700">
          {topic.name}
        </h3>
        {topic.isPopular && (
          <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            Popular
          </span>
        )}
      </div>

      {/* Question count */}
      <p className="text-xs text-text-secondary">
        {questionCount.toLocaleString()} Questions
      </p>
    </button>
  );
}

export default BattleTopicCard;
