/**
 * QuizQuestionCard — the main question card for a duel quiz.
 * Renders the current question (with a kind + difficulty badge), the
 * participant answering surface (`QuizAnswerForm`), and a reveal banner when an
 * answer has been submitted.
 *
 * @example
 * ```tsx
 * <QuizQuestionCard
 *   question={question}
 *   index={0}
 *   total={5}
 *   revealed={state.isAnswered}
 *   result={state.lastResult}
 *   answer={state.answer}
 *   onSubmit={duel.submitAnswer}
 * />
 * ```
 */

import { CheckCircle2, HelpCircle, MinusCircle, XCircle } from "lucide-react";

import { RichText } from "@/components/atoms/RichText/RichText";
import { QuizAnswerForm } from "@/components/organisms/QuizAnswerForm/QuizAnswerForm";
import { cn } from "@/lib/utils";
import type {
  DuelQuestion,
  ParticipantAnswer,
} from "@/modules/Competition/types/duelQuiz";

const KIND_LABELS: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  fill_blank: "Fill-in-the-Blanks",
  matching: "Matching",
  ordering: "Ordering",
  writing: "Writing / Essay",
  coding: "Coding",
};

export interface QuizQuestionCardProps {
  question: DuelQuestion;
  /** Zero-based question index; used for the "Question N of M" caption. */
  index: number;
  total: number;
  revealed: boolean;
  /** Auto-grade result of the submitted answer, null when not auto-graded. */
  result: boolean | null;
  answer: ParticipantAnswer | null;
  onSubmit: (answer: ParticipantAnswer) => void;
  className?: string;
}

export function QuizQuestionCard({
  question,
  index,
  total,
  revealed,
  result,
  answer,
  onSubmit,
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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
          {KIND_LABELS[question.kind] ?? question.kind}
          {question.difficulty ? ` · ${question.difficulty}` : ""}
        </span>
      </div>

      <RichText
        html={question.text}
        className="text-lg font-semibold leading-snug text-text-primary"
      />

      <div className="mt-5">
        <QuizAnswerForm
          key={question.id}
          question={question}
          revealed={revealed}
          answer={answer}
          onSubmit={onSubmit}
        />
      </div>

      {revealed && (
        <div
          className={cn(
            "mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold",
            result === true
              ? "border-success-500 bg-success-50 text-success-700"
              : result === false
                ? "border-error-500 bg-error-50 text-error-700"
                : "border-border-default bg-surface-muted text-text-secondary",
          )}
          role="status"
        >
          {result === true ? (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          ) : result === false ? (
            <XCircle className="size-4 shrink-0" aria-hidden />
          ) : (
            <MinusCircle className="size-4 shrink-0" aria-hidden />
          )}
          {result === true
            ? "Correct"
            : result === false
              ? "Incorrect"
              : "Submitted for review"}
        </div>
      )}
    </div>
  );
}

export default QuizQuestionCard;