/**
 * QuizQuestionCard — the main question card for a duel quiz.
 * Renders the current question, its options as `QuizOption` rows, and a
 * progress caption. Controlled by the host via `question`, `selected`,
 * `revealed`, and `onSelect`.
 *
 * @example
 * ```tsx
 * <QuizQuestionCard
 *   question={question}
 *   index={0}
 *   total={5}
 *   selected={selected}
 *   revealed={isAnswered}
 *   onSelect={selectAnswer}
 * />
 * ```
 */

import { HelpCircle } from "lucide-react";

import { QuizOption } from "@/components/molecules/QuizOption";
import type { DuelQuestion } from "@/modules/Competition/types/duelQuiz";
import { cn } from "@/lib/utils";

export interface QuizQuestionCardProps {
  question: DuelQuestion;
  /** Zero-based question index; used for the "Question N of M" caption. */
  index: number;
  total: number;
  /** Zero-based index of the player's chosen option, if any. */
  selected: number | null;
  /** True after an answer is locked in; reveals correct/incorrect states. */
  revealed: boolean;
  onSelect?: (index: number) => void;
  className?: string;
}

export function QuizQuestionCard({
  question,
  index,
  total,
  selected,
  revealed,
  onSelect,
  className,
}: Readonly<QuizQuestionCardProps>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-default bg-surface-default p-5 shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          <HelpCircle className="size-4 text-primary-600" aria-hidden />
          Question {index + 1} of {total}
        </span>
      </div>

      <h2 className="text-lg font-semibold leading-snug text-text-primary">{question.text}</h2>

      <div className="mt-5 flex flex-col gap-2.5">
        {question.options.map((option, optionIndex) => {
          let state: "idle" | "selected" | "correct" | "incorrect" = "idle";
          if (revealed) {
            if (optionIndex === question.correctIndex) {
              state = "correct";
            } else if (optionIndex === selected) {
              state = "incorrect";
            }
          } else if (optionIndex === selected) {
            state = "selected";
          }
          return (
            <QuizOption
              key={option}
              index={optionIndex}
              text={option}
              state={state}
              disabled={revealed}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

export default QuizQuestionCard;
