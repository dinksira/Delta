/**
 * BlankAnswerList — one labelled input per blank marker.
 *
 * A vertical list of inputs, one per authored blank in a fill-in-the-blank
 * question. Used in authoring (an answer key per blank) and for participants
 * (each blank's answer typed by the player). Composes the theme `Field` +
 * `Input` atoms.
 *
 * @example
 * ```tsx
 * <BlankAnswerList
 *   answers={question.fillAnswers}
 *   label="Answer for blank"
 *   onChange={(index, value) => setAnswer(index, value)}
 * />
 * ```
 */

import { Input } from "@/components/theme/Input";

export interface BlankAnswerListProps {
  /** One value per blank, in stem order. */
  answers: string[];
  /** Disables all inputs (e.g. after a participant submits). */
  disabled?: boolean;
  /** Row label, rendered as `${label} ${index + 1}` (default "Blank"). */
  label?: string;
  onChange: (index: number, value: string) => void;
  className?: string;
}

export function BlankAnswerList({
  answers,
  disabled = false,
  label = "Blank",
  onChange,
  className,
}: Readonly<BlankAnswerListProps>) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      {answers.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-muted text-xs font-bold text-text-tertiary">
            {index + 1}
          </span>
          <Input
            value={value}
            disabled={disabled}
            aria-label={`${label} ${index + 1}`}
            placeholder={`${label} ${index + 1}`}
            onChange={(event) => onChange(index, event.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
