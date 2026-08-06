/**
 * QuestionBuilderEditor
 * Atomic Level: Organism
 *
 * Center-canvas content for the Question Builder workspace module: title,
 * description, code template, and sample / hidden test cases (via the
 * TestCaseCard molecule). Question meta (language, difficulty, points, time,
 * hint) lives in the QuestionModuleSettings molecule / ModuleSettingsPanel.
 */

import { Plus } from "lucide-react";

import { TestCaseCard } from "@/components/molecules/TestCaseCard/TestCaseCard";
import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Select } from "@/components/theme/Select";
import { Textarea } from "@/components/theme/Textarea";
import { Typography } from "@/components/theme/Typography";
import type { CodingQuestion, TestCase } from "@/modules/Competition/types/createBattle";
import { cn } from "@/lib/utils";

export interface QuestionBuilderEditorProps {
  question: CodingQuestion;
  onChange: (updates: Partial<CodingQuestion>) => void;
  onRemove: () => void;
  /** Language options for the canvas select. */
  languages: string[];
  className?: string;
}

function updateTestCase(
  testCases: TestCase[],
  index: number,
  updates: Partial<TestCase>,
): TestCase[] {
  return testCases.map((tc, i) => (i === index ? { ...tc, ...updates } : tc));
}

function appendTestCase(testCases: TestCase[]): TestCase[] {
  return [
    ...testCases,
    {
      input: "",
      expectedOutput: "",
      explanation: "",
      isSample: false,
      isHidden: true,
    },
  ];
}

export function QuestionBuilderEditor({
  question,
  onChange,
  onRemove,
  languages,
  className,
}: Readonly<QuestionBuilderEditorProps>) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex items-center justify-between">
        <Typography as="h3" className="text-base font-bold text-primary-700">
          Question Editor
        </Typography>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-2 py-1 text-xs font-semibold text-error-600 transition-colors hover:bg-error-50"
        >
          Remove question
        </button>
      </div>

      <Field id="qb-title" label="Title">
        <Input
          id="qb-title"
          value={question.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="e.g. FizzBuzz"
        />
      </Field>

      <Field id="qb-description" label="Description">
        <Textarea
          id="qb-description"
          rows={4}
          value={question.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Explain the task and any constraints…"
        />
      </Field>

      <Field id="qb-language" label="Language">
        <Select
          id="qb-language"
          value={question.language}
          onChange={(event) => onChange({ language: event.target.value })}
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="qb-code" label="Code template">
        <Textarea
          id="qb-code"
          rows={8}
          className="font-mono text-xs"
          value={question.codeTemplate}
          onChange={(event) => onChange({ codeTemplate: event.target.value })}
          placeholder={`Starter scaffold for ${question.language}…`}
        />
      </Field>

      {/* Test cases */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Typography as="h3" className="text-sm font-bold text-primary-700">
            Test cases
          </Typography>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChange({ testCases: appendTestCase(question.testCases) })}
          >
            <Plus className="size-4" aria-hidden />
            Add test case
          </Button>
        </div>

        {question.testCases.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-default bg-surface-muted/40 px-6 py-10 text-center">
            <Typography className="text-sm font-semibold text-text-primary">
              No test cases yet
            </Typography>
            <Typography className="max-w-sm text-xs text-text-secondary">
              Add at least one sample test so players can preview the format.
            </Typography>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {question.testCases.map((tc, index) => (
              <li key={`${tc.input}-${index}`} className="min-w-0">
                <TestCaseCard
                  index={index}
                  input={tc.input}
                  expectedOutput={tc.expectedOutput}
                  isSample={tc.isSample === true}
                  onInputChange={(value) =>
                    onChange({
                      testCases: updateTestCase(question.testCases, index, { input: value }),
                    })
                  }
                  onOutputChange={(value) =>
                    onChange({
                      testCases: updateTestCase(question.testCases, index, {
                        expectedOutput: value,
                      }),
                    })
                  }
                  onToggleSample={() =>
                    onChange({
                      testCases: updateTestCase(question.testCases, index, {
                        isSample: tc.isSample !== true,
                        isHidden: tc.isSample === true,
                      }),
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default QuestionBuilderEditor;