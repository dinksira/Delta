/**
 * QuestionAuthoringEditor
 * Atomic Level: Organism
 *
 * Center-canvas content for the six quiz question types. Renders the shared
 * Title + Question stem (description) + Remove chrome, then a body that
 * switches on `question.kind`:
 *
 * - multiple_choice → QuestionOptionRow list + Add option
 * - true_false      → two True / False rows with Switch toggles
 * - fill_blank      → rich-text stem editor with toolbar + mini blank marker
 * - matching        → Column B answer pool (MatchingAnswerRow) + MatchingPairRow
 *   pairs whose dropdown maps each prompt to a pool option
 * - writing         → stem + free-form answer note
 * - ordering        → ordered list of items with up / down reorder + Add item
 *
 * Composes the QuestionOptionRow / MatchingPairRow / MatchingAnswerRow
 * molecules and theme atoms.
 */

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";

import { BlankAnswerList } from "@/components/molecules/BlankAnswerList/BlankAnswerList";
import { MatchingAnswerRow } from "@/components/molecules/MatchingAnswerRow/MatchingAnswerRow";
import { MatchingPairRow } from "@/components/molecules/MatchingPairRow/MatchingPairRow";
import { QuestionOptionRow } from "@/components/molecules/QuestionOptionRow/QuestionOptionRow";
import { RichTextEditor } from "@/components/molecules/RichTextEditor/RichTextEditor";
import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Switch } from "@/components/theme/Switch";
import { Typography } from "@/components/theme/Typography";
import {
  createEmptyMatchingAnswer,
  createEmptyOption,
  createEmptyOrderItem,
  createEmptyPair,
  type CodingQuestion,
  type QuestionMatchingAnswer,
  type QuestionMatchingPair,
  type QuestionOrderItem,
} from "@/modules/Competition/types/createBattle";
import { countBlanks } from "@/lib/richText";
import { cn } from "@/lib/utils";

export interface QuestionAuthoringEditorProps {
  question: CodingQuestion;
  onChange: (updates: Partial<CodingQuestion>) => void;
  onRemove: () => void;
  className?: string;
}

function letterFor(index: number): string {
  return String.fromCharCode(65 + index);
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function TrueFalseBody({
  question,
  onChange,
}: Readonly<{
  question: CodingQuestion;
  onChange: QuestionAuthoringEditorProps["onChange"];
}>) {
  const rows: { label: string; active: boolean }[] = [
    { label: "True", active: question.tfAnswer === true },
    { label: "False", active: question.tfAnswer !== true },
  ];

  return (
    <div className="flex flex-col gap-2">
      <Typography as="h3" className="text-sm font-bold text-primary-700">
        Correct answer
      </Typography>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-default px-4 py-3"
        >
          <Typography className="text-sm font-semibold text-text-primary">{row.label}</Typography>
          <Switch
            label={`Set correct answer to ${row.label}`}
            checked={row.active}
            onCheckedChange={() => onChange({ tfAnswer: row.label === "True" })}
          />
        </div>
      ))}
    </div>
  );
}

function MultipleChoiceBody({
  question,
  onChange,
}: Readonly<{
  question: CodingQuestion;
  onChange: QuestionAuthoringEditorProps["onChange"];
}>) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Typography as="h3" className="text-sm font-bold text-primary-700">
          Options
        </Typography>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange({
              mcqOptions: [
                ...question.mcqOptions,
                createEmptyOption(letterFor(question.mcqOptions.length)),
              ],
            })
          }
        >
          <Plus className="size-4" aria-hidden />
          Add option
        </Button>
      </div>

      {question.mcqOptions.map((option, index) => (
        <QuestionOptionRow
          key={option.id}
          label={letterFor(index)}
          text={option.text}
          selected={option.id === question.mcqCorrectId}
          canRemove={question.mcqOptions.length > 1}
          onTextChange={(value) =>
            onChange({
              mcqOptions: question.mcqOptions.map((o) =>
                o.id === option.id ? { ...o, text: value } : o,
              ),
            })
          }
          onSelect={() => onChange({ mcqCorrectId: option.id })}
          onRemove={() =>
            onChange({
              mcqOptions: question.mcqOptions.filter((o) => o.id !== option.id),
              mcqCorrectId: question.mcqCorrectId === option.id ? "" : question.mcqCorrectId,
            })
          }
        />
      ))}
    </div>
  );
}

function FillBlankBody({
  question,
  onChange,
}: Readonly<{
  question: CodingQuestion;
  onChange: QuestionAuthoringEditorProps["onChange"];
}>) {
  const blankCount = countBlanks(question.description);

  const answers = useMemo(() => {
    const next = [...question.fillAnswers];
    while (next.length < blankCount) next.push("");
    return next.slice(0, blankCount);
  }, [question.fillAnswers, blankCount]);

  // Keep the stored answer key aligned with the blank markers in the stem.
  useEffect(() => {
    if (question.fillAnswers.length === blankCount) return;
    const next = [...question.fillAnswers];
    while (next.length < blankCount) next.push("");
    onChange({ fillAnswers: next.slice(0, blankCount) });
  }, [question.fillAnswers, blankCount, onChange]);

  const setAnswer = (index: number, value: string) => {
    const next = [...question.fillAnswers];
    while (next.length < blankCount) next.push("");
    next[index] = value;
    onChange({ fillAnswers: next });
  };

  return (
    <div className="flex flex-col gap-2">
      <Field id="qb-fill-description" label="Question text" className="gap-1">
        <RichTextEditor
          id="qb-fill-description"
          value={question.description}
          onChange={(html) => onChange({ description: html })}
          insertBlankButton
          placeholder="Write the sentence, format it, and place blanks…"
        />
      </Field>
      <Typography className="text-xs text-text-secondary">
        Select part of the sentence and use the Blank button to turn it into a box players must fill
        — every blank needs its own answer below.
      </Typography>

      <Field id="qb-fill-answers" label="Answers for each blank" className="gap-1">
        {blankCount === 0 ? (
          <Typography className="text-xs text-text-secondary">
            No blanks yet. Use the Blank button in the editor toolbar to mark the words players
            should fill in.
          </Typography>
        ) : (
          <BlankAnswerList answers={answers} label="Answer for blank" onChange={setAnswer} />
        )}
      </Field>
    </div>
  );
}

function MatchingBody({
  question,
  onChange,
}: Readonly<{
  question: CodingQuestion;
  onChange: QuestionAuthoringEditorProps["onChange"];
}>) {
  const updatePair = (
    id: string,
    updates: Partial<QuestionMatchingPair>,
  ): Partial<CodingQuestion> => ({
    matchingPairs: question.matchingPairs.map((p) => (p.id === id ? { ...p, ...updates } : p)),
  });

  const updateAnswer = (
    id: string,
    updates: Partial<QuestionMatchingAnswer>,
  ): Partial<CodingQuestion> => ({
    matchingAnswers: question.matchingAnswers.map((a) => (a.id === id ? { ...a, ...updates } : a)),
  });

  const removeAnswer = (id: string): Partial<CodingQuestion> => ({
    matchingAnswers: question.matchingAnswers.filter((a) => a.id !== id),
    // Any pair referencing the removed option loses its selection.
    matchingPairs: question.matchingPairs.map((p) =>
      p.answerId === id ? { ...p, answerId: "" } : p,
    ),
  });

  const poolTexts = question.matchingAnswers
    .map((a) => a.text.trim().toLowerCase())
    .filter(Boolean);
  const duplicateAnswers = poolTexts.length !== new Set(poolTexts).size;
  const emptyPrompt = question.matchingPairs.some((p) => !p.prompt.trim());
  const unassignedPair = question.matchingPairs.some((p) => !p.answerId);
  const emptyAnswer = question.matchingAnswers.some((a) => !a.text.trim());
  const hasWarnings = duplicateAnswers || emptyPrompt || unassignedPair || emptyAnswer;

  return (
    <div className="flex flex-col gap-2">
      <Field id="qb-matching-description" label="Question text" className="gap-1">
        <RichTextEditor
          id="qb-matching-description"
          value={question.description}
          onChange={(html) => onChange({ description: html })}
          placeholder="Write the matching instruction players will see…"
        />
      </Field>

      <div className="flex items-center justify-between">
        <Typography as="h3" className="text-sm font-bold text-primary-700">
          Column B · Answer options
        </Typography>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange({
              matchingAnswers: [...question.matchingAnswers, createEmptyMatchingAnswer()],
            })
          }
        >
          <Plus className="size-4" aria-hidden />
          Add answer
        </Button>
      </div>
      <Typography className="text-xs text-text-secondary">
        Type each answer once — participants pick from this list, and each pair below maps to one of
        them.
      </Typography>

      {question.matchingAnswers.map((answer, index) => (
        <MatchingAnswerRow
          key={answer.id}
          index={index}
          text={answer.text}
          canRemove={question.matchingAnswers.length > 1}
          onChange={(value) => onChange(updateAnswer(answer.id, { text: value }))}
          onRemove={() => onChange(removeAnswer(answer.id))}
        />
      ))}

      <div className="mt-2 flex items-center justify-between">
        <Typography as="h3" className="text-sm font-bold text-primary-700">
          Pairs
        </Typography>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange({ matchingPairs: [...question.matchingPairs, createEmptyPair()] })
          }
        >
          <Plus className="size-4" aria-hidden />
          Add pair
        </Button>
      </div>
      <Typography className="text-xs text-text-secondary">
        Give each Column A item its match from the answer options above.
      </Typography>

      {question.matchingPairs.map((pair, index) => (
        <MatchingPairRow
          key={pair.id}
          index={index}
          prompt={pair.prompt}
          answerId={pair.answerId}
          answers={question.matchingAnswers}
          canRemove={question.matchingPairs.length > 1}
          onPromptChange={(value) => onChange(updatePair(pair.id, { prompt: value }))}
          onAnswerIdChange={(value) => onChange(updatePair(pair.id, { answerId: value }))}
          onRemove={() =>
            onChange({
              matchingPairs: question.matchingPairs.filter((p) => p.id !== pair.id),
            })
          }
        />
      ))}

      {hasWarnings && (
        <div className="rounded-xl border border-warning-500/40 bg-warning-50 px-3 py-2 text-xs text-warning-700">
          {duplicateAnswers && "Duplicate answer options make matching ambiguous. "}
          {emptyPrompt && "Every pair needs a Column A item. "}
          {unassignedPair && "Every pair needs a matching answer chosen. "}
          {emptyAnswer && "Every answer option needs text. "}
        </div>
      )}
    </div>
  );
}

function WritingBody({
  question,
  onChange,
}: Readonly<{
  question: CodingQuestion;
  onChange: QuestionAuthoringEditorProps["onChange"];
}>) {
  return (
    <div className="flex flex-col gap-2">
      <Field id="qb-writing-description" label="Prompt" className="gap-1">
        <RichTextEditor
          id="qb-writing-description"
          value={question.description}
          onChange={(html) => onChange({ description: html })}
          placeholder="Describe the writing task and any expected length or rubric…"
        />
      </Field>
      <Typography className="text-xs text-text-secondary">
        Players respond with a free-form written answer that is graded against the rubric.
      </Typography>
    </div>
  );
}

function OrderingBody({
  question,
  onChange,
}: Readonly<{
  question: CodingQuestion;
  onChange: QuestionAuthoringEditorProps["onChange"];
}>) {
  const updateItem = (id: string, text: string): Partial<CodingQuestion> => ({
    orderingItems: question.orderingItems.map((o) => (o.id === id ? { ...o, text } : o)),
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Typography as="h3" className="text-sm font-bold text-primary-700">
          Correct order
        </Typography>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange({ orderingItems: [...question.orderingItems, createEmptyOrderItem()] })
          }
        >
          <Plus className="size-4" aria-hidden />
          Add item
        </Button>
      </div>

      {question.orderingItems.map((item, index) => {
        const swap = (direction: -1 | 1) =>
          onChange({
            orderingItems: moveItem<QuestionOrderItem>(question.orderingItems, index, direction),
          });
        return (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-default p-2"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-muted text-xs font-bold text-text-tertiary">
              {index + 1}
            </span>
            <Input
              value={item.text}
              onChange={(event) => onChange(updateItem(item.id, event.target.value))}
              placeholder={`Item ${index + 1}`}
              aria-label={`Item ${index + 1}`}
            />
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => swap(-1)}
                disabled={index === 0}
                className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Move item ${index + 1} up`}
              >
                <ArrowUp className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => swap(1)}
                disabled={index === question.orderingItems.length - 1}
                className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Move item ${index + 1} down`}
              >
                <ArrowDown className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    orderingItems: question.orderingItems.filter((o) => o.id !== item.id),
                  })
                }
                disabled={question.orderingItems.length <= 1}
                className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-error-50 hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Remove item ${index + 1}`}
              >
                <span aria-hidden className="text-sm font-semibold leading-none">
                  ×
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function QuestionAuthoringEditor({
  question,
  onChange,
  onRemove,
  className,
}: Readonly<QuestionAuthoringEditorProps>) {
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

      <Field id="qa-title" label="Title">
        <Input
          id="qa-title"
          value={question.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="e.g. Capital cities of the world"
        />
      </Field>

      {question.kind !== "fill_blank" &&
        question.kind !== "writing" &&
        question.kind !== "matching" && (
          <Field
            id="qa-description"
            label={
              question.kind === "multiple_choice" || question.kind === "true_false"
                ? "Question"
                : "Description"
            }
            className="gap-1"
          >
            <RichTextEditor
              id="qa-description"
              value={question.description}
              onChange={(html) => onChange({ description: html })}
              placeholder="Write the question players will see…"
            />
          </Field>
        )}

      {question.kind === "multiple_choice" && (
        <MultipleChoiceBody question={question} onChange={onChange} />
      )}
      {question.kind === "true_false" && <TrueFalseBody question={question} onChange={onChange} />}
      {question.kind === "fill_blank" && <FillBlankBody question={question} onChange={onChange} />}
      {question.kind === "matching" && <MatchingBody question={question} onChange={onChange} />}
      {question.kind === "writing" && <WritingBody question={question} onChange={onChange} />}
      {question.kind === "ordering" && <OrderingBody question={question} onChange={onChange} />}
    </div>
  );
}

export default QuestionAuthoringEditor;
