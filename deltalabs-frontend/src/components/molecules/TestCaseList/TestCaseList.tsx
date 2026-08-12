/**
 * TestCaseList
 * Atomic Level: Molecule
 *
 * Scrollable list of TestCaseCards for the Code Editor module's "Test cases"
 * tab, with an empty state and an "Add test case" action. Composes the shared
 * TestCaseCard molecule so the Code Editor module and any future surface share
 * the same test-authoring UI.
 *
 * @example
 * <TestCaseList
 *   testCases={question.testCases}
 *   onUpdate={(index, updates) => onChange({ testCases: update(...) })}
 *   onToggleSample={(index, isSample) => onToggle(...) }
 *   onRemove={(index) => onRemove(...) }
 *   onAdd={() => onAdd() }
 * />
 */

import { Plus } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";
import type { TestCase } from "@/modules/Competition/types/createBattle";
import { TestCaseCard } from "@/components/molecules/TestCaseCard/TestCaseCard";

export interface TestCaseListProps {
  testCases: readonly TestCase[];
  /** Write partial updates to the test case at `index`. */
  onUpdate: (index: number, updates: Partial<TestCase>) => void;
  /** Flip a test between Sample / Hidden (pass the new `isSample` value). */
  onToggleSample: (index: number, isSample: boolean) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  className?: string;
}

export function TestCaseList({
  testCases,
  onUpdate,
  onToggleSample,
  onRemove,
  onAdd,
  className,
}: Readonly<TestCaseListProps>) {
  if (testCases.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-default bg-surface-muted/40 px-6 py-8 text-center">
        <Typography className="text-sm font-semibold text-text-primary">
          No test cases yet
        </Typography>
        <Typography className="max-w-sm text-xs text-text-secondary">
          Add at least one sample test so players can preview the format.
        </Typography>
        <Button variant="secondary" size="sm" className="justify-center gap-1.5" onClick={onAdd}>
          <Plus className="size-4" aria-hidden />
          Add test case
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex max-h-72 flex-col gap-3 overflow-y-auto pr-1", className)}>
      {testCases.map((tc, index) => (
        <TestCaseCard
          key={`${tc.input}-${index}`}
          index={index}
          input={tc.input}
          expectedOutput={tc.expectedOutput}
          explanation={tc.explanation}
          isSample={tc.isSample === true}
          onInputChange={(value) => onUpdate(index, { input: value })}
          onOutputChange={(value) => onUpdate(index, { expectedOutput: value })}
          onExplanationChange={(value) => onUpdate(index, { explanation: value })}
          onToggleSample={() => onToggleSample(index, tc.isSample !== true)}
          onRemove={() => onRemove(index)}
        />
      ))}
      <Button variant="secondary" size="sm" className="justify-center gap-1.5" onClick={onAdd}>
        <Plus className="size-4" aria-hidden />
        Add test case
      </Button>
    </div>
  );
}

export default TestCaseList;
