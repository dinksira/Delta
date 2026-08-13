/**
 * QuizAnswerForm
 * Atomic Level: Organism
 *
 * Participant answering surface for a single duel question. Renders the input
 * that matches `question.kind`:
 *
 * - multiple_choice / true_false → selecting an option submits immediately.
 * - fill_blank / matching / ordering / writing / coding → a draft is captured
 *   locally and a "Submit" button locks it in.
 * - markdown / design → the authored Markdown Pad / Design Canvas brief is
 *   rendered to the player and a free-form response is submitted for review.
 *
 * After submission (`revealed`), the correct answer is highlighted for the
 * auto-graded kinds and a "submitted for review" notice is shown for writing /
 * coding / markdown / design. Draft state resets per question via the `key` on
 * the caller.
 */

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Loader2, Play, Send, X } from "lucide-react";

import { BlankAnswerList } from "@/components/molecules/BlankAnswerList/BlankAnswerList";
import { CodeEditor } from "@/components/molecules/CodeEditor/CodeEditor";
import { RichText } from "@/components/atoms/RichText/RichText";
import { RunConsole } from "@/components/molecules/RunConsole/RunConsole";
import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Select } from "@/components/theme/Select";
import { Textarea } from "@/components/theme/Textarea";
import { Typography } from "@/components/theme/Typography";
import { useCodeExecution } from "@/components/organisms/CodeEditorModule/useCodeExecution";
import { cn } from "@/lib/utils";
import type { TestCase } from "@/modules/Competition/types/createBattle";
import type { DuelQuestion, ParticipantAnswer } from "@/modules/Competition/types/duelQuiz";

export interface QuizAnswerFormProps {
  question: DuelQuestion;
  revealed: boolean;
  /** Submitted answer (used to reflect the player's disclosure when revealed). */
  answer: ParticipantAnswer | null;
  onSubmit: (answer: ParticipantAnswer) => void;
}

function OptionButton({
  state,
  disabled,
  label,
  text,
  onPress,
}: Readonly<{
  state: "idle" | "selected" | "correct" | "incorrect";
  disabled: boolean;
  label: string;
  text: string;
  onPress: () => void;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      className={cn(
        "group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
        state === "correct" && "border-success-500 bg-success-50",
        state === "incorrect" && "border-error-500 bg-error-50",
        state === "selected" && "border-primary-500 bg-primary-50",
        state === "idle" && "border-border-default bg-surface-default hover:border-primary-300",
        disabled && "cursor-default",
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          state === "correct"
            ? "bg-success-600 text-white"
            : state === "incorrect"
              ? "bg-error-600 text-white"
              : state === "selected"
                ? "bg-primary-700 text-white"
                : "border border-border-default bg-surface-muted text-text-tertiary group-hover:border-primary-300",
        )}
        aria-hidden
      >
        {state === "correct" ? (
          <Check className="size-4" />
        ) : state === "incorrect" ? (
          <X className="size-4" />
        ) : (
          label
        )}
      </span>
      <span className="text-sm font-medium text-text-primary">{text}</span>
    </button>
  );
}

function SubmitRow({
  onSubmit,
  disabled = false,
}: Readonly<{ onSubmit: () => void; disabled?: boolean }>) {
  return (
    <div className="flex justify-end pt-1">
      <Button type="button" variant="primary" size="sm" disabled={disabled} onClick={onSubmit}>
        <Send className="size-4" aria-hidden />
        Submit
      </Button>
    </div>
  );
}

function MultipleChoiceAnswer({
  question,
  revealed,
  submittedId,
  onSubmit,
}: Readonly<{
  question: Extract<DuelQuestion, { kind: "multiple_choice" }>;
  revealed: boolean;
  submittedId: string | undefined;
  onSubmit: (answer: ParticipantAnswer) => void;
}>) {
  return (
    <div className="flex flex-col gap-2.5">
      {question.options.map((option) => {
        let state: "idle" | "selected" | "correct" | "incorrect" = "idle";
        if (revealed) {
          if (option.id === question.correctId) state = "correct";
          else if (option.id === submittedId) state = "incorrect";
        } else if (option.id === submittedId) {
          state = "selected";
        }
        return (
          <OptionButton
            key={option.id}
            label={option.label}
            text={option.text}
            state={state}
            disabled={revealed}
            onPress={() => onSubmit({ kind: "multiple_choice", optionId: option.id })}
          />
        );
      })}
    </div>
  );
}

function TrueFalseAnswer({
  question,
  revealed,
  submitted,
  onSubmit,
}: Readonly<{
  question: Extract<DuelQuestion, { kind: "true_false" }>;
  revealed: boolean;
  submitted: boolean;
  onSubmit: (answer: ParticipantAnswer) => void;
}>) {
  const rows: { label: string; value: boolean }[] = [
    { label: "True", value: true },
    { label: "False", value: false },
  ];
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => {
        let state: "idle" | "selected" | "correct" | "incorrect" = "idle";
        if (revealed) {
          if (row.value === question.correct) state = "correct";
          else if (row.value === submitted) state = "incorrect";
        } else if (row.value === submitted) {
          state = "selected";
        }
        return (
          <OptionButton
            key={row.label}
            label={row.label}
            text={row.label}
            state={state}
            disabled={revealed}
            onPress={() => onSubmit({ kind: "true_false", value: row.value })}
          />
        );
      })}
    </div>
  );
}

function MatchingAnswer({
  question,
  revealed,
  submittedMap,
  onSubmit,
}: Readonly<{
  question: Extract<DuelQuestion, { kind: "matching" }>;
  revealed: boolean;
  submittedMap: Record<string, string>;
  onSubmit: (answer: ParticipantAnswer) => void;
}>) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const map = revealed ? submittedMap : draft;
  const allFilled =
    question.pairs.length > 0 && question.pairs.every((pair) => map[pair.id]?.trim());

  return (
    <div className="flex flex-col gap-3">
      {question.pairs.map((pair, index) => (
        <Field key={pair.id} id={`match-${pair.id}`} label={`Pair ${index + 1}`} className="gap-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm text-text-primary">
              {pair.prompt || "—"}
            </div>
            <Select
              id={`match-${pair.id}`}
              value={map[pair.id] ?? ""}
              disabled={revealed}
              onChange={(event) => setDraft((prev) => ({ ...prev, [pair.id]: event.target.value }))}
            >
              <option value="" disabled>
                Choose Column B…
              </option>
              {question.answers.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.text}
                </option>
              ))}
            </Select>
          </div>
        </Field>
      ))}
      {!revealed && (
        <SubmitRow
          disabled={!allFilled}
          onSubmit={() => onSubmit({ kind: "matching", map: { ...map } })}
        />
      )}
    </div>
  );
}

function OrderingAnswer({
  question,
  revealed,
  submittedIds,
  onSubmit,
}: Readonly<{
  question: Extract<DuelQuestion, { kind: "ordering" }>;
  revealed: boolean;
  submittedIds: string[];
  onSubmit: (answer: ParticipantAnswer) => void;
}>) {
  const authored = question.items.map((item) => item.id);
  const [draft, setDraft] = useState<string[]>(authored);
  const orderIds = revealed ? submittedIds : draft;

  const swap = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= orderIds.length) return;
    const next = [...orderIds];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {orderIds.map((id, index) => {
        const item = question.items.find((i) => i.id === id);
        return (
          <div
            key={id}
            className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-default px-3 py-2"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-muted text-xs font-bold text-text-tertiary">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
              {item?.text || "…"}
            </span>
            {!revealed && (
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => swap(index, -1)}
                  disabled={index === 0}
                  className="rounded-md p-1.5 text-text-tertiary hover:bg-surface-muted hover:text-text-primary disabled:opacity-40"
                  aria-label="Move up"
                >
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => swap(index, 1)}
                  disabled={index === orderIds.length - 1}
                  className="rounded-md p-1.5 text-text-tertiary hover:bg-surface-muted hover:text-text-primary disabled:opacity-40"
                  aria-label="Move down"
                >
                  <ArrowDown className="size-4" aria-hidden />
                </button>
              </div>
            )}
          </div>
        );
      })}
      {!revealed && (
        <SubmitRow onSubmit={() => onSubmit({ kind: "ordering", itemIds: orderIds })} />
      )}
    </div>
  );
}

function FillBlankAnswer({
  question,
  revealed,
  onSubmit,
}: Readonly<{
  question: Extract<DuelQuestion, { kind: "fill_blank" }>;
  revealed: boolean;
  onSubmit: (answer: ParticipantAnswer) => void;
}>) {
  // Multi-blank mode: the stem carries `[data-blank]` markers, so participants
  // fill one input per blank. Legacy mode falls back to a single text box.
  const multiBlank = question.answers.length > 0;
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState<string[]>(question.answers.map(() => ""));

  if (multiBlank) {
    return (
      <div className="flex flex-col gap-2">
        <Field id="fill-answers" label="Fill in each blank" className="gap-1">
          <BlankAnswerList
            answers={answers}
            disabled={revealed}
            label="Blank"
            onChange={(index, value) =>
              setAnswers((prev) => {
                const next = [...prev];
                next[index] = value;
                return next;
              })
            }
          />
        </Field>
        {!revealed && (
          <SubmitRow
            disabled={!answers.every((value) => value.trim())}
            onSubmit={() => onSubmit({ kind: "fill_blank", answers: [...answers] })}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Field id="fill-answer" label="Your answer" className="gap-1">
        <Textarea
          id="fill-answer"
          rows={2}
          value={text}
          disabled={revealed}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type the completed sentence, filling each blank…"
        />
      </Field>
      {!revealed && <SubmitRow onSubmit={() => onSubmit({ kind: "fill_blank", text })} />}
    </div>
  );
}

function WritingAnswer({
  revealed,
  onSubmit,
}: Readonly<{
  revealed: boolean;
  onSubmit: (answer: ParticipantAnswer) => void;
}>) {
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <Field id="writing-answer" label="Your response" className="gap-1">
        <Textarea
          id="writing-answer"
          rows={6}
          value={text}
          disabled={revealed}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write your answer…"
        />
      </Field>
      {!revealed && <SubmitRow onSubmit={() => onSubmit({ kind: "writing", text })} />}
    </div>
  );
}

function MarkdownAnswer({
  revealed,
  submittedText,
  onSubmit,
}: Readonly<{
  revealed: boolean;
  submittedText?: string;
  onSubmit: (answer: ParticipantAnswer) => void;
}>) {
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <Field id="markdown-answer" label="Your response" className="gap-1">
        <Textarea
          id="markdown-answer"
          rows={6}
          value={revealed ? (submittedText ?? "") : text}
          disabled={revealed}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write your answer — you can use markdown formatting (headings, lists, code)…"
        />
      </Field>
      {!revealed && <SubmitRow onSubmit={() => onSubmit({ kind: "markdown", text })} />}
    </div>
  );
}

function DesignAnswer({
  question,
  revealed,
  submittedText,
  onSubmit,
}: Readonly<{
  question: Extract<DuelQuestion, { kind: "design" }>;
  revealed: boolean;
  submittedText?: string;
  onSubmit: (answer: ParticipantAnswer) => void;
}>) {
  const [text, setText] = useState("");
  const hasCover = Boolean(question.coverUrl) && !question.coverUrl?.startsWith("media://");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_3fr]">
        <div className="flex min-w-0 flex-col gap-2">
          <Typography as="span" className="text-sm font-semibold text-text-primary">
            Design brief
          </Typography>
          <div className="rounded-lg border border-border-default bg-surface-muted/40 px-3 py-2">
            <RichText html={question.brief || "No brief provided."} className="text-sm" />
          </div>
          {question.deliverables.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Typography as="span" className="text-sm font-semibold text-text-primary">
                Deliverables
              </Typography>
              <ul className="ml-4 list-disc space-y-0.5 text-sm text-text-primary">
                {question.deliverables.map((deliverable, index) => (
                  <li key={`${deliverable}-${index}`}>{deliverable}</li>
                ))}
              </ul>
            </div>
          )}
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Canvas size · {question.canvasWidth} × {question.canvasHeight} px
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-border-default bg-surface-canvas">
          {hasCover ? (
            // eslint-disable-next-line @next/next/no-img-element -- resolved media API asset
            <img
              src={question.coverUrl ?? undefined}
              alt="Design reference"
              className="h-52 w-full object-cover"
            />
          ) : (
            <div className="flex h-52 flex-col items-center justify-center gap-1 text-center">
              <Typography className="text-sm font-medium text-text-primary">
                No reference image
              </Typography>
              <Typography className="text-xs text-text-secondary">
                Follow the brief and deliverables above.
              </Typography>
            </div>
          )}
        </div>
      </div>

      <Field id="design-answer" label="Your submission" className="gap-1">
        <Textarea
          id="design-answer"
          rows={4}
          value={revealed ? (submittedText ?? "") : text}
          disabled={revealed}
          onChange={(event) => setText(event.target.value)}
          placeholder="Describe your design and any decisions, or paste a link to your work…"
        />
      </Field>
      {!revealed && <SubmitRow onSubmit={() => onSubmit({ kind: "design", text })} />}
    </div>
  );
}

function CodingAnswer({
  question,
  revealed,
  onSubmit,
}: Readonly<{
  question: Extract<DuelQuestion, { kind: "coding" }>;
  revealed: boolean;
  onSubmit: (answer: ParticipantAnswer) => void;
}>) {
  const [code, setCode] = useState(question.codeTemplate);

  // Map the duel's sample cases onto the authoring test-case shape the judge
  // understands, so the participant gets real pass/fail grading on Submit.
  const testCases: TestCase[] = useMemo(
    () =>
      question.testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        explanation: tc.explanation,
        isSample: true,
        isHidden: false,
      })),
    [question.testCases],
  );

  const execution = useCodeExecution({
    language: question.language,
    code,
    testCases,
  });

  const handleSubmit = () => {
    if (execution.busy) {
      return;
    }
    if (testCases.length === 0) {
      onSubmit({ kind: "coding", code });
      return;
    }
    // Grade the sample cases against the judge, then lock the answer in.
    void execution.submit().then(() => {
      onSubmit({ kind: "coding", code });
    });
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_3fr]">
      {/* Left: problem statement — constraints + sample test cases */}
      <div className="flex min-w-0 flex-col gap-4">
        {question.constraints && (
          <div className="flex flex-col gap-1.5">
            <Typography as="span" className="text-sm font-semibold text-text-primary">
              Constraints
            </Typography>
            <div className="rounded-lg border border-border-default bg-surface-muted/40 px-3 py-2">
              <RichText html={question.constraints} className="text-xs" />
            </div>
          </div>
        )}

        {question.testCases.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Typography as="span" className="text-sm font-semibold text-text-primary">
              Example test cases
            </Typography>
            <ul className="flex flex-col gap-2">
              {question.testCases.map((tc, index) => (
                <li
                  key={`${tc.input}-${index}`}
                  className="rounded-lg border border-border-default bg-surface-muted/40 px-3 py-2 font-mono text-xs"
                >
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    <div>
                      <span className="text-text-tertiary">Input: </span>
                      <span className="whitespace-pre-wrap text-text-primary">
                        {tc.input || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-tertiary">Expected: </span>
                      <span className="whitespace-pre-wrap text-text-primary">
                        {tc.expectedOutput || "—"}
                      </span>
                    </div>
                  </div>
                  {tc.explanation && (
                    <div className="mt-1 text-text-tertiary">
                      <span>Explanation: </span>
                      <span className="text-text-primary">{tc.explanation}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right: language + editor + Run/Submit + judge console */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            {question.language}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={execution.run}
              disabled={execution.busy || revealed}
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
              onClick={handleSubmit}
              disabled={execution.busy || revealed}
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
          id="coding-answer"
          value={code}
          onChange={(value) => {
            setCode(value);
            if (execution.status === "done") {
              execution.reset();
            }
          }}
          language={question.language}
          readOnly={revealed}
          placeholder="Write your solution…"
          minLines={14}
          errorLine={execution.errorLine}
        />

        <RunConsole
          status={execution.status}
          result={execution.result}
          submitResults={execution.submitResults}
          error={execution.error}
          onRun={execution.run}
          onReset={execution.reset}
          onDismissError={execution.dismissError}
        />
      </div>
    </div>
  );
}

export function QuizAnswerForm({
  question,
  revealed,
  answer,
  onSubmit,
}: Readonly<QuizAnswerFormProps>) {
  switch (question.kind) {
    case "multiple_choice": {
      const submittedId = answer?.kind === "multiple_choice" ? answer.optionId : undefined;
      return (
        <MultipleChoiceAnswer
          question={question}
          revealed={revealed}
          submittedId={submittedId}
          onSubmit={onSubmit}
        />
      );
    }
    case "true_false": {
      const submitted = answer?.kind === "true_false" ? answer.value : true;
      return (
        <TrueFalseAnswer
          question={question}
          revealed={revealed}
          submitted={submitted}
          onSubmit={onSubmit}
        />
      );
    }
    case "fill_blank":
      return <FillBlankAnswer question={question} revealed={revealed} onSubmit={onSubmit} />;
    case "matching": {
      const map = answer?.kind === "matching" ? answer.map : {};
      return (
        <MatchingAnswer
          question={question}
          revealed={revealed}
          submittedMap={map}
          onSubmit={onSubmit}
        />
      );
    }
    case "ordering": {
      const ids = answer?.kind === "ordering" ? answer.itemIds : [];
      return (
        <OrderingAnswer
          question={question}
          revealed={revealed}
          submittedIds={ids}
          onSubmit={onSubmit}
        />
      );
    }
    case "writing":
      return <WritingAnswer revealed={revealed} onSubmit={onSubmit} />;
    case "markdown": {
      const submitted = answer?.kind === "markdown" ? answer.text : undefined;
      return <MarkdownAnswer revealed={revealed} submittedText={submitted} onSubmit={onSubmit} />;
    }
    case "design": {
      const submitted = answer?.kind === "design" ? answer.text : undefined;
      return (
        <DesignAnswer
          question={question}
          revealed={revealed}
          submittedText={submitted}
          onSubmit={onSubmit}
        />
      );
    }
    case "coding":
      return <CodingAnswer question={question} revealed={revealed} onSubmit={onSubmit} />;
    default:
      return null;
  }
}

export default QuizAnswerForm;
