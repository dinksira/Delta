/**
 * QuestionBuilderEditor
 * Atomic Level: Organism
 *
 * Full-screen question editor for the Create Topic Battle wizard (question
 * pool step, custom mode). Edits one CodingQuestion: title, description,
 * code template, language, difficulty, time limit, points, hint, and sample /
 * hidden test cases.
 */

import { Checkbox } from "@/components/theme/Checkbox";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { RadioGroup, type RadioOption } from "@/components/theme/RadioGroup";
import { Select } from "@/components/theme/Select";
import { Textarea } from "@/components/theme/Textarea";
import { Typography } from "@/components/theme/Typography";
import type { CodingQuestion, TestCase } from "@/modules/Competition/types/createBattle";
import { cn } from "@/lib/utils";

export interface QuestionBuilderEditorProps {
  question: CodingQuestion;
  onChange: (updates: Partial<CodingQuestion>) => void;
  onRemove: () => void;
  /** Language options for the select. */
  languages: string[];
  className?: string;
}

const DIFFICULTY_OPTIONS: RadioOption[] = [
  { value: "EASY", label: "Easy", id: "qb-easy" },
  { value: "MEDIUM", label: "Medium", id: "qb-medium" },
  { value: "HARD", label: "Hard", id: "qb-hard" },
];

function updateTestCase(
  testCases: TestCase[],
  index: number,
  updates: Partial<TestCase>,
): TestCase[] {
  return testCases.map((tc, i) => (i === index ? { ...tc, ...updates } : tc));
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

        <div>
          <RadioGroup
            name="qb-difficulty"
            legend="Difficulty"
            options={DIFFICULTY_OPTIONS}
            className="mt-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field id="qb-points" label="Points">
          <Input
            id="qb-points"
            type="number"
            min={0}
            step={0.5}
            value={question.points}
            onChange={(event) => onChange({ points: Number(event.target.value) })}
          />
        </Field>
        <Field id="qb-time" label="Time limit (minutes)">
          <Input
            id="qb-time"
            type="number"
            min={1}
            max={180}
            value={question.timeLimitMinutes}
            onChange={(event) => onChange({ timeLimitMinutes: Number(event.target.value) })}
          />
        </Field>
      </div>

      <Field id="qb-code" label="Code template">
        <Textarea
          id="qb-code"
          rows={5}
          className="font-mono text-xs"
          value={question.codeTemplate}
          onChange={(event) => onChange({ codeTemplate: event.target.value })}
          placeholder="function solution(input) { … }"
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          checked={question.hintEnabled}
          onChange={(event) => onChange({ hintEnabled: event.target.checked })}
        />
        <Typography as="span" className="text-sm font-medium text-text-primary">
          Enable hint for this question
        </Typography>
      </label>

      {question.hintEnabled && (
        <Field id="qb-hint" label="Hint text">
          <Textarea
            id="qb-hint"
            rows={2}
            value={question.hintText}
            onChange={(event) => onChange({ hintText: event.target.value })}
            placeholder="A nudge in the right direction…"
          />
        </Field>
      )}

      {/* Test cases */}
      <div className="flex flex-col gap-3">
        <Typography as="h3" className="text-sm font-bold text-primary-700">
          Test cases
        </Typography>
        {question.testCases.map((tc, index) => (
          <div
            key={`${tc.input}-${index}`}
            className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-muted/40 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                {tc.isSample ? "Sample" : "Hidden"}
              </span>
              <span className="text-[11px] text-text-tertiary">Test #{index + 1}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field id={`qb-tc-in-${index}`} label="Input">
                <Input
                  id={`qb-tc-in-${index}`}
                  value={tc.input}
                  onChange={(event) =>
                    onChange({
                      testCases: updateTestCase(question.testCases, index, {
                        input: event.target.value,
                      }),
                    })
                  }
                />
              </Field>
              <Field id={`qb-tc-out-${index}`} label="Expected output">
                <Input
                  id={`qb-tc-out-${index}`}
                  value={tc.expectedOutput}
                  onChange={(event) =>
                    onChange({
                      testCases: updateTestCase(question.testCases, index, {
                        expectedOutput: event.target.value,
                      }),
                    })
                  }
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuestionBuilderEditor;
