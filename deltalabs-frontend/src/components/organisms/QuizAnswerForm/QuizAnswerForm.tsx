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
 *
 * After submission (`revealed`), the correct answer is highlighted for the
 * auto-graded kinds and a "submitted for review" notice is shown for writing /
 * coding. Draft state resets per question via the `key` on the caller.
 */

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Send, X } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Select } from "@/components/theme/Select";
import { Textarea } from "@/components/theme/Textarea";
import { cn } from "@/lib/utils";
import type {
  DuelQuestion,
  ParticipantAnswer,
} from "@/modules/Competition/types/duelQuiz";

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

function matchingOptions(question: Extract<DuelQuestion, { kind: "matching" }>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const pair of question.pairs) {
    if (pair.answer && !seen.has(pair.answer)) {
      seen.add(pair.answer);
      result.push(pair.answer);
    }
  }
  return result;
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
              {matchingOptions(question).map((option) => (
                <option key={option} value={option}>
                  {option}
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
      {!revealed && <SubmitRow onSubmit={() => onSubmit({ kind: "ordering", itemIds: orderIds })} />}
    </div>
  );
}

function FillBlankAnswer({
  revealed,
  onSubmit,
}: Readonly<{
  revealed: boolean;
  onSubmit: (answer: ParticipantAnswer) => void;
}>) {
  const [text, setText] = useState("");
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
  return (
    <div className="flex flex-col gap-2">
      <Field
        id="coding-answer"
        label={`Your code (${question.language}) — submitted for review after the battle`}
        className="gap-1"
      >
        <Textarea
          id="coding-answer"
          rows={10}
          className="font-mono text-xs"
          value={code}
          disabled={revealed}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Write your solution…"
        />
      </Field>
      {!revealed && <SubmitRow onSubmit={() => onSubmit({ kind: "coding", code })} />}
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
      return <FillBlankAnswer revealed={revealed} onSubmit={onSubmit} />;
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
    case "coding":
      return <CodingAnswer question={question} revealed={revealed} onSubmit={onSubmit} />;
    default:
      return null;
  }
}

export default QuizAnswerForm;