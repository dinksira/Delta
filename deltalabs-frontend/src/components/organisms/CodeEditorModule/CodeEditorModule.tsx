/**
 * CodeEditorModule
 * Atomic Level: Organism
 *
 * LeetCode-style coding-question canvas for the Competition Workspace "Code
 * Editor" module. Split layout:
 *   - header row: Title + "Remove question"
 *   - left column (~38%): description (RichTextEditor) + constraints
 *   - right column (~62%): language select → CodeEditor → Run / Submit →
 *     a Test cases / Run console area.
 *
 * Difficulty Level, Timer, Points and Hint are owned by the right-hand
 * ModuleSettingsPanel (QuestionModuleSettings) — not duplicated here.
 * Fully controlled via `question` + `onChange` (same contract as
 * QuestionBuilderEditor). `Run` compiles/executes the current code against the
 * backend judge and flags the error line on the editor; `Submit` grades the
 * authored test cases. Real results come from the backend, never fabricated.
 *
 * @example
 * <CodeEditorModule
 *   question={activeQuestion}
 *   onChange={(updates) => updateQuestion(activeQuestion.id, updates)}
 *   onRemove={removeQuestion}
 *   languages={QUESTION_LANGUAGES}
 * />
 */

import { useState } from "react";
import { Check, Loader2, Play, Send, Trash2 } from "lucide-react";

import { CodeEditor } from "@/components/molecules/CodeEditor/CodeEditor";
import { RunConsole } from "@/components/molecules/RunConsole/RunConsole";
import { RichTextEditor } from "@/components/molecules/RichTextEditor/RichTextEditor";
import { TestCaseList } from "@/components/molecules/TestCaseList/TestCaseList";
import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Select } from "@/components/theme/Select";
import { Typography } from "@/components/theme/Typography";
import { useCodeExecution } from "@/components/organisms/CodeEditorModule/useCodeExecution";
import type { CodingQuestion, TestCase } from "@/modules/Competition/types/createBattle";
import { cn } from "@/lib/utils";

export interface CodeEditorModuleProps {
  question: CodingQuestion;
  onChange: (updates: Partial<CodingQuestion>) => void;
  onRemove: () => void;
  /** Language options for the editor's select. */
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

export function CodeEditorModule({
  question,
  onChange,
  onRemove,
  languages,
  className,
}: Readonly<CodeEditorModuleProps>) {
  const [consoleTab, setConsoleTab] = useState<"tests" | "run">("tests");

  const execution = useCodeExecution({
    language: question.language,
    code: question.codeTemplate,
    testCases: question.testCases,
  });

  const sampleCases = question.testCases.filter((tc) => tc.isSample === true);

  return (
    <div className={cn("flex h-full flex-col gap-5", className)}>
      {/* ===== Header row: title + remove (difficulty/points live in ModuleSettings) ===== */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Field id="cem-title" label="Title">
            <Input
              id="cem-title"
              value={question.title}
              onChange={(event) => onChange({ title: event.target.value })}
              placeholder="e.g. Two Sum — LeetCode-style challenge"
            />
          </Field>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-error-600 hover:bg-error-50">
          <Trash2 className="size-4" aria-hidden />
          Remove
        </Button>
      </div>

      {/* ===== Split: problem statement (left) | code editor (right) ===== */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
        {/* Left: description + constraints */}
        <div className="flex min-w-0 flex-col gap-4">
          <Field id="cem-description" label="Problem statement" className="gap-1">
            <RichTextEditor
              id="cem-description"
              value={question.description}
              onChange={(html) => onChange({ description: html })}
              placeholder="Explain the task, examples, and any notes players need…"
            />
          </Field>
          <Field id="cem-constraints" label="Constraints" className="gap-1">
            <RichTextEditor
              id="cem-constraints"
              value={question.constraints}
              onChange={(html) => onChange({ constraints: html })}
              placeholder="e.g. 1 ≤ nums.length ≤ 10⁴, values fit in 32-bit integers…"
            />
          </Field>
        </div>

        {/* Right: language + editor + actions + console */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Field id="cem-language" label="Language" className="w-48">
              <Select
                id="cem-language"
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
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={execution.run}
                disabled={execution.busy}
              >
                {execution.status === "running" && !execution.submitResults ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Play className="size-4" aria-hidden />
                )}
                Run
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={execution.submit}
                disabled={execution.busy}
              >
                {execution.busy && execution.status === "running" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
                Submit
              </Button>
            </div>
          </div>

          <CodeEditor
            value={question.codeTemplate}
            onChange={(code) => {
              onChange({ codeTemplate: code });
              if (execution.status === "done") execution.reset();
            }}
            language={question.language}
            placeholder={`Starter scaffold for ${question.language}…`}
            minLines={12}
            errorLine={execution.errorLine}
          />

          {/* Console tabs: Test cases | Run */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-border-default bg-surface-default p-1">
              <button
                type="button"
                role="tab"
                aria-selected={consoleTab === "tests"}
                onClick={() => setConsoleTab("tests")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  consoleTab === "tests"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                )}
              >
                Test cases ({question.testCases.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={consoleTab === "run"}
                onClick={() => setConsoleTab("run")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  consoleTab === "run"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                )}
              >
                Run
                {execution.status === "done" && (execution.result || execution.submitResults) && (
                  <Check className="size-4 text-success-500" aria-hidden />
                )}
              </button>
            </div>

            {consoleTab === "tests" ? (
              <TestCaseList
                testCases={question.testCases}
                onUpdate={(index, updates) =>
                  onChange({
                    testCases: updateTestCase(question.testCases, index, updates),
                  })
                }
                onToggleSample={(index, isSample) =>
                  onChange({
                    testCases: updateTestCase(question.testCases, index, {
                      isSample,
                      isHidden: !isSample,
                    }),
                  })
                }
                onRemove={(index) =>
                  onChange({
                    testCases: question.testCases.filter((_, i) => i !== index),
                  })
                }
                onAdd={() => onChange({ testCases: appendTestCase(question.testCases) })}
              />
            ) : (
              <RunConsole
                status={execution.status}
                result={execution.result}
                submitResults={execution.submitResults}
                error={execution.error}
                onRun={execution.run}
                onReset={execution.reset}
                onDismissError={execution.dismissError}
              />
            )}
          </div>

          {sampleCases.length === 0 && question.testCases.length > 0 && (
            <Typography className="text-xs text-text-tertiary">
              No sample tests marked yet — flip a test to “Sample” so players see
              an example in the problem statement.
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
}

export default CodeEditorModule;
