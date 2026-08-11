/**
 * MatchingAnswerRow
 * Atomic Level: Molecule
 *
 * One editable row of a Matching question's Column B answer pool: a labelled
 * "Answer" input (the option participants choose from) with a remove button.
 * Composes the theme `Field` + `Input` atoms.
 *
 * @example
 * <MatchingAnswerRow index={0} text="Addis Ababa" onChange={...} onRemove={...} />
 */

import { Trash2 } from "lucide-react";

import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";

export interface MatchingAnswerRowProps {
  index: number;
  text: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  /** Disables the remove button (e.g. only one answer left). */
  canRemove?: boolean;
}

export function MatchingAnswerRow({
  index,
  text,
  onChange,
  onRemove,
  canRemove = true,
}: Readonly<MatchingAnswerRowProps>) {
  const id = `ma-${index}`;

  return (
    <div className="flex items-end gap-2 rounded-xl border border-border-default bg-surface-default p-2.5">
      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-1">
        <Field id={id} label={`Answer · Option ${index + 1}`} className="min-w-0 gap-1">
          <Input
            id={id}
            value={text}
            onChange={(event) => onChange(event.target.value)}
            placeholder="e.g. Addis Ababa"
          />
        </Field>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-error-50 hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Remove answer option ${index + 1}`}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export default MatchingAnswerRow;
