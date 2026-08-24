/**
 * QuestionOptionRow
 * Atomic Level: Molecule
 *
 * One editable row of a Multiple Choice question: a letter chip (A / B / C…),
 * a radio-style "correct answer" selector, the option text input, and a remove
 * button. Composes the shared `Input` atom.
 * @example <QuestionOptionRow label="A" text="Paris" selected onTextChange={...} />
 */

import { CheckCircle2, Circle, Trash2 } from "lucide-react";

import { Input } from "@/components/theme/Input";
import { cn } from "@/lib/utils";

export interface QuestionOptionRowProps {
  /** Letter chip shown on the left (A / B / C…). */
  label: string;
  text: string;
  /** True when this option is flagged as the correct answer. */
  selected: boolean;
  onTextChange: (text: string) => void;
  onSelect: () => void;
  onRemove: () => void;
  /** Disables the remove button (e.g. only one option left). */
  canRemove?: boolean;
  className?: string;
}

export function QuestionOptionRow({
  label,
  text,
  selected,
  onTextChange,
  onSelect,
  onRemove,
  canRemove = true,
  className,
}: Readonly<QuestionOptionRowProps>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-surface-default p-2 transition-colors",
        selected ? "border-primary-300 bg-primary-50/40" : "border-border-default",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          selected
            ? "bg-primary-700 text-white"
            : "border border-border-default bg-surface-muted text-text-tertiary",
        )}
        aria-hidden
      >
        {label}
      </span>

      <Input
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="Type an option…"
        aria-label={`Option ${label}`}
      />

      <button
        type="button"
        onClick={onSelect}
        className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-text-secondary transition-colors hover:text-primary-700"
        title={selected ? "Marked correct" : "Mark as correct answer"}
      >
        {selected ? (
          <CheckCircle2 className="size-4 text-primary-700" aria-hidden />
        ) : (
          <Circle className="size-4" aria-hidden />
        )}
        {selected ? "Correct" : "Set"}
      </button>

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-error-50 hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Remove option ${label}`}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export default QuestionOptionRow;
