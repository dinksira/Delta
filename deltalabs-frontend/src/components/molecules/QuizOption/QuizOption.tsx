/**
 * QuizOption — a selectable answer choice in a duel quiz question.
 * Renders an A–D letter badge plus the option text; supports idle, selected,
 * correct, and incorrect states (used after the answer is locked in).
 *
 * @example
 * ```tsx
 * <QuizOption
 *   index={0}
 *   text="2x"
 *   state="correct"
 *   onSelect={() => select(0)}
 * />
 * ```
 */

import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type QuizOptionState = "idle" | "selected" | "correct" | "incorrect";

export interface QuizOptionProps {
  /** Zero-based index; the letter badge renders A, B, C, D… */
  index: number;
  text: string;
  state?: QuizOptionState;
  disabled?: boolean;
  onSelect?: (index: number) => void;
  className?: string;
}

const letter = (index: number) => String.fromCharCode(65 + index);

const stateClasses: Record<QuizOptionState, string> = {
  idle:
    "border-border-default bg-surface-default text-text-primary hover:border-primary-400 hover:bg-primary-50",
  selected:
    "border-primary-600 bg-primary-600 text-white",
  correct:
    "border-success-500 bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300",
  incorrect:
    "border-error-500 bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-300",
};

const badgeClasses: Record<QuizOptionState, string> = {
  idle: "bg-surface-muted text-text-secondary",
  selected: "bg-white/20 text-white",
  correct: "bg-success-500 text-white",
  incorrect: "bg-error-500 text-white",
};

export function QuizOption({
  index,
  text,
  state = "idle",
  disabled,
  onSelect,
  className,
}: Readonly<QuizOptionProps>) {
  const showIcon = state === "correct" || state === "incorrect";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(index)}
      disabled={disabled}
      aria-pressed={state === "selected"}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
        stateClasses[state],
        disabled && "cursor-default",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          badgeClasses[state],
        )}
        aria-hidden
      >
        {showIcon ? (
          state === "correct" ? (
            <Check className="size-4" />
          ) : (
            <X className="size-4" />
          )
        ) : (
          letter(index)
        )}
      </span>
      <span className="min-w-0 flex-1">{text}</span>
    </button>
  );
}

export default QuizOption;
