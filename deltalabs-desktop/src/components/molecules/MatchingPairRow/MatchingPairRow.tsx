/**
 * MatchingPairRow
 * Atomic Level: Molecule
 *
 * One editable row of a Matching question: a "Column A" prompt input and a
 * "Column B" dropdown that picks which answer-pool item this prompt matches.
 * The dropdown is populated from the author's `matchingAnswers` pool, so the
 * participant always sees exactly the authored options and grading compares
 * answer ids rather than free text.
 *
 * @example
 * <MatchingPairRow index={0} prompt="2+2" answerId="ans_1" answers={pool} onPromptChange={...} onAnswerIdChange={...} />
 */

import { Trash2 } from "lucide-react";

import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Select } from "@/components/theme/Select";
import type { QuestionMatchingAnswer } from "@/modules/Competition/types/createBattle";

export interface MatchingPairRowProps {
  index: number;
  prompt: string;
  /** Selected Column B pool item id ("" when unassigned). */
  answerId: string;
  /** Column B pool options to choose from. */
  answers: QuestionMatchingAnswer[];
  onPromptChange: (value: string) => void;
  onAnswerIdChange: (value: string) => void;
  onRemove: () => void;
  /** Disables the remove button (e.g. only one pair left). */
  canRemove?: boolean;
}

export function MatchingPairRow({
  index,
  prompt,
  answerId,
  answers,
  onPromptChange,
  onAnswerIdChange,
  onRemove,
  canRemove = true,
}: Readonly<MatchingPairRowProps>) {
  const idA = `mp-a-${index}`;
  const idB = `mp-b-${index}`;

  return (
    <div className="flex items-end gap-2 rounded-xl border border-border-default bg-surface-default p-2.5">
      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
        <Field id={idA} label={`Item · Pair ${index + 1}`} className="min-w-0 gap-1">
          <Input
            id={idA}
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="e.g. Ethiopia"
          />
        </Field>
        <Field id={idB} label="Matches" className="min-w-0 gap-1">
          <Select
            id={idB}
            value={answerId}
            onChange={(event) => onAnswerIdChange(event.target.value)}
          >
            <option value="" disabled>
              Choose Column B…
            </option>
            {answers.map((answer) => (
              <option key={answer.id} value={answer.id}>
                {answer.text || "…"}
              </option>
            ))}
          </Select>
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
