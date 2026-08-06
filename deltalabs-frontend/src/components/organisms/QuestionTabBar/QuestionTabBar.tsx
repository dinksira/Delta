/**
 * QuestionTabBar
 * Atomic Level: Organism
 *
 * Question tab wrapper for the Competition Workspace canvas: a bordered tab box
 * with rounded `Q1.` / `Q2.` … badges (active badge filled with the neutral
 * surface-muted tone) and a trailing square "+ Add question" button.
 * @example <QuestionTabBar questions={questions} activeId={activeId} onSelect={select} onAdd={addQuestion} maxQuestions={50} />
 */

import { Plus } from "lucide-react";

import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";

export interface QuestionTabBarProps {
  /** Question summaries used for badge labels. */
  questions: readonly { id: string; title: string }[];
  activeId: string;
  maxQuestions: number;
  onSelect: (id: string) => void;
  onAdd: () => void;
  className?: string;
}

export function QuestionTabBar({
  questions,
  activeId,
  maxQuestions,
  onSelect,
  onAdd,
  className,
}: Readonly<QuestionTabBarProps>) {
  const atLimit = questions.length >= maxQuestions;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-border-default bg-surface-default p-2",
        className,
      )}
    >
      {questions.map((question, index) => {
        const active = question.id === activeId;
        const label = question.title.trim();
        return (
          <button
            key={question.id}
            type="button"
            onClick={() => onSelect(question.id)}
            aria-current={active ? "step" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition-colors duration-150",
              active
                ? "border-border-default bg-surface-muted text-text-primary"
                : "border-border-default bg-surface-default text-text-secondary hover:bg-surface-muted hover:text-text-primary",
            )}
          >
            <span aria-hidden>Q{index + 1}.</span>
            {label ? (
              <Typography as="span" className="max-w-40 truncate text-xs font-medium">
                {label}
              </Typography>
            ) : null}
          </button>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        disabled={atLimit}
        aria-label="Add question"
        title="Add question"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md border transition-colors duration-150",
          atLimit
            ? "cursor-not-allowed border-border-default text-text-tertiary opacity-60"
            : "border-border-default text-primary-600 hover:border-primary-400 hover:bg-primary-50",
        )}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export default QuestionTabBar;