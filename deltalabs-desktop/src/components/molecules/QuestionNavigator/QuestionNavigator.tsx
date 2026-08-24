/**
 * QuestionNavigator
 * Atomic Level: Molecule
 *
 * Horizontal, wrapping row of numbered question pills plus a trailing "+ add"
 * pill, used by the custom-question builder sub-flow. The active question is
 * filled with the primary token; inactive pills are bordered. The add pill is
 * disabled once `total` reaches `maxQuestions`.
 */

import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface QuestionNavigatorProps {
  /** Question summaries used for pill labels. */
  questions: readonly { id: string; title: string }[];
  /** Currently edited question id. */
  activeId: string;
  /** Cap on the number of questions (disables the add pill when reached). */
  maxQuestions: number;
  onSelect: (id: string) => void;
  onAdd: () => void;
  className?: string;
}

export function QuestionNavigator({
  questions,
  activeId,
  maxQuestions,
  onSelect,
  onAdd,
  className,
}: Readonly<QuestionNavigatorProps>) {
  const atLimit = questions.length >= maxQuestions;

  return (
    <nav
      aria-label="Questions"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {questions.map((question, index) => {
        const active = question.id === activeId;
        const label =
          question.title.trim().length > 0
            ? question.title.trim()
            : `Question ${index + 1}`;
        return (
          <button
            key={question.id}
            type="button"
            onClick={() => onSelect(question.id)}
            aria-current={active ? "step" : undefined}
            className={cn(
              "max-w-64 truncate rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
              active
                ? "border-primary-600 bg-primary-600 text-white"
                : "border-border-default bg-surface-default text-text-secondary hover:border-primary-400 hover:text-text-primary",
            )}
          >
            {label}
          </button>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        disabled={atLimit}
        aria-disabled={atLimit}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg border border-dashed px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
          atLimit
            ? "cursor-not-allowed border-border-default text-text-tertiary opacity-60"
            : "border-primary-400 text-primary-600 hover:bg-primary-50",
        )}
      >
        <Plus className="size-3.5" aria-hidden />
        Add
      </button>
    </nav>
  );
}

export default QuestionNavigator;