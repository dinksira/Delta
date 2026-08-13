/**
 * MarkdownPadModule
 * Atomic Level: Organism
 *
 * Competition Workspace center-canvas authoring surface for `kind: "markdown"`
 * questions: a Title input, the MarkdownEditor pad (source + live preview, via
 * MarkdownToolbar/Markdown), and an optional plain-text rubric. Question meta
 * (difficulty, timer, points, hint) lives in the QuestionModuleSettings /
 * ModuleSettingsPanel, matching the Code Editor and Question Builder modules.
 * Fully controlled via `question` + `onChange`.
 *
 * @example
 * <MarkdownPadModule
 *   question={activeQuestion}
 *   onChange={(updates) => updateQuestion(activeQuestion.id, updates)}
 *   onRemove={removeQuestion}
 * />
 */

import { ScrollText } from "lucide-react";

import { MarkdownEditor } from "@/components/molecules/MarkdownEditor/MarkdownEditor";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Textarea } from "@/components/theme/Textarea";
import { Typography } from "@/components/theme/Typography";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";
import { cn } from "@/lib/utils";

export interface MarkdownPadModuleProps {
  question: CodingQuestion;
  onChange: (updates: Partial<CodingQuestion>) => void;
  onRemove: () => void;
  className?: string;
}

export function MarkdownPadModule({
  question,
  onChange,
  onRemove,
  className,
}: Readonly<MarkdownPadModuleProps>) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex items-center justify-between">
        <Typography as="h3" className="flex items-center gap-2 text-base font-bold text-primary-700">
          <ScrollText className="size-4" aria-hidden />
          Markdown Question
        </Typography>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-2 py-1 text-xs font-semibold text-error-600 transition-colors hover:bg-error-50"
        >
          Remove question
        </button>
      </div>

      <Field id="mpd-title" label="Title">
        <Input
          id="mpd-title"
          value={question.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="e.g. Explain photosynthesis in markdown"
        />
      </Field>

      <Field
        id="mpd-source"
        label="Markdown"
        labelClassName="text-sm font-medium text-text-primary"
        className="gap-1"
      >
        <MarkdownEditor
          id="mpd-source"
          value={question.markdown.source}
          onChange={(source) => onChange({ markdown: { ...question.markdown, source } })}
          placeholder="Write the question in markdown — headings, tables, code blocks all render for participants…"
        />
      </Field>

      <Field id="mpd-rubric" label="Rubric / scoring notes">
        <Textarea
          id="mpd-rubric"
          rows={3}
          value={question.markdown.rubric}
          onChange={(event) => onChange({ markdown: { ...question.markdown, rubric: event.target.value } })}
          placeholder="How should answers be graded? (human-graded)"
        />
      </Field>
    </div>
  );
}

export default MarkdownPadModule;