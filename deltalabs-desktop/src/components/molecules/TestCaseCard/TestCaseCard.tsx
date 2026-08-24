/**
 * TestCaseCard
 * Atomic Level: Molecule
 *
 * One test-case editor row for the custom-question builder: a Sample / Hidden
 * status toggle pill, "Test #N" index label, an Input grid for the test input +
 * expected output, an optional Explanation field (LeetCode-style example
 * explanations), and an optional Remove action. Uses the shared `Field` + `Input`
 * atoms.
 */

import { Trash2 } from "lucide-react";

import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { cn } from "@/lib/utils";

export interface TestCaseCardProps {
  /** Zero-based test index, rendered as "Test #N". */
  index: number;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  explanation?: string;
  onInputChange: (value: string) => void;
  onOutputChange: (value: string) => void;
  onToggleSample: () => void;
  onExplanationChange?: (value: string) => void;
  onRemove?: () => void;
  className?: string;
}

export function TestCaseCard({
  index,
  input,
  expectedOutput,
  isSample,
  explanation,
  onInputChange,
  onOutputChange,
  onToggleSample,
  onExplanationChange,
  onRemove,
  className,
}: Readonly<TestCaseCardProps>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border-default bg-surface-muted/40 p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggleSample}
          aria-pressed={isSample}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors duration-200",
            isSample
              ? "border border-primary-400 bg-primary-50 text-primary-700 hover:bg-primary-100"
              : "bg-primary-700 text-white hover:bg-primary-800",
          )}
        >
          {isSample ? "Sample" : "Hidden"}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-tertiary">Test #{index + 1}</span>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove test case ${index + 1}`}
              className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-error-50 hover:text-error-600"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field id={`qb-tc-in-${index}`} label="Input">
          <Input
            id={`qb-tc-in-${index}`}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Test input"
          />
        </Field>
        <Field id={`qb-tc-out-${index}`} label="Expected output">
          <Input
            id={`qb-tc-out-${index}`}
            value={expectedOutput}
            onChange={(event) => onOutputChange(event.target.value)}
            placeholder="Expected output"
          />
        </Field>
      </div>

      {onExplanationChange && (
        <Field id={`qb-tc-exp-${index}`} label="Explanation (shown with the example)">
          <Input
            id={`qb-tc-exp-${index}`}
            value={explanation ?? ""}
            onChange={(event) => onExplanationChange(event.target.value)}
            placeholder="Optional walkthrough of the expected behaviour"
          />
        </Field>
      )}
    </div>
  );
}

export default TestCaseCard;
