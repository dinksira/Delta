/**
 * MatchingPairRow
 * Atomic Level: Molecule
 *
 * One editable row of a Matching question: a "Column A" prompt input and a
 * "Column B" matching answer input, with a remove button. Composes the shared
 * `Field` + `Input` atoms.
 * @example <MatchingPairRow index={0} prompt="2+2" answer="4" onPromptChange={...} />
 */

import { Trash2 } from "lucide-react";

import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";

export interface MatchingPairRowProps {
  index: number;
  prompt: string;
  answer: string;
  onPromptChange: (value: string) => void;
  onAnswerChange: (value: string) => void;
  onRemove: () => void;
  /** Disables the remove button (e.g. only one pair left). */
  canRemove?: boolean;
}

export function MatchingPairRow({
  index,
  prompt,
  answer,
  onPromptChange,
  onAnswerChange,
  onRemove,
  canRemove = true,
}: Readonly<MatchingPairRowProps>) {
  const idA = `mp-a-${index}`;
  const idB = `mp-b-${index}`;

  return (
    <div className="flex items-end gap-2 rounded-xl border border-border-default bg-surface-default p-2.5">
      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
        <Field id={idA} label={`Column A · Pair ${index + 1}`} className="min-w-0 gap-1">
          <Input
            id={idA}
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="Prompt"
          />
        </Field>
        <Field id={idB} label="Column B" className="min-w-0 gap-1">
          <Input
            id={idB}
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            placeholder="Matching item"
          />
        </Field>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-error-50 hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Remove pair ${index + 1}`}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export default MatchingPairRow;