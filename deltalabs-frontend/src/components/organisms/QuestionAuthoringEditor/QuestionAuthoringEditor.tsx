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
 * - fill_blank      → stem textarea + "Insert blank" marker button
 * - matching        → MatchingPairRow list + Add pair
 * - writing         → stem + free-form answer note
 * - ordering        → ordered list of items with up / down reorder + Add item
 *
 * Composes the QuestionOptionRow / MatchingPairRow molecules and theme atoms.
 */

import { ArrowDown, ArrowUp, Plus, Type } from "lucide-react";

import { MatchingPairRow } from "@/components/molecules/MatchingPairRow/MatchingPairRow";
import { QuestionOptionRow } from "@/components/molecules/QuestionOptionRow/QuestionOptionRow";
import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Switch } from "@/components/theme/Switch";
import { Textarea } from "@/components/theme/Textarea";
import { Typography } from "@/components/theme/Typography";
import {
  createEmptyOption,
  createEmptyOrderItem,
  createEmptyPair,
  type CodingQuestion,
  type QuestionMatchingPair,
  type QuestionOrderItem,
} from "@/modules/Competition/types/createBattle";
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
          <Typography className="text-sm font-semibold text-text-primary">
            {row.label}
          </Typography>
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
              mcqCorrectId:
                question.mcqCorrectId === option.id ? "" : question.mcqCorrectId,
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
  const insertBlank = () => {
    const suffix = " ____ ";
    onChange({
      description: `${question.description}${
        question.description.endsWith(" ") ? "" : " "
      }${suffix.trim()}`,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Field
        id="qb-fill-description"
        label="Question text"
        className="gap-1"
      >
        <Textarea
          id="qb-fill-description"
          rows={4}
          value={question.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Write the sentence and insert blanks where players should type their answer…"
        />
      </Field>
      <Button type="button" variant="secondary" size="sm" onClick={insertBlank}>
        <Type className="size-4" aria-hidden />
        Insert blank
      </Button>
      <Typography className="text-xs text-text-secondary">
        Each blank is marked with underscores and will render as a fill-in input
        for players.
      </Typography>

      <Field
        id="qb-fill-expected"
        label="Expected answer (used for auto-grading)"
        className="gap-1"
      >
        <Input
          id="qb-fill-expected"
          value={question.fillExpected}
          onChange={(event) => onChange({ fillExpected: event.target.value })}
          placeholder="e.g. The capital of Ethiopia is Addis Ababa"
        />
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
    matchingPairs: question.matchingPairs.map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    ),
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
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

      {question.matchingPairs.map((pair, index) => (
        <MatchingPairRow
          key={pair.id}
          index={index}
          prompt={pair.prompt}
          answer={pair.answer}
          canRemove={question.matchingPairs.length > 1}
          onPromptChange={(value) => onChange(updatePair(pair.id, { prompt: value }))}
          onAnswerChange={(value) => onChange(updatePair(pair.id, { answer: value }))}
          onRemove={() =>
            onChange({
              matchingPairs: question.matchingPairs.filter((p) => p.id !== pair.id),
            })
          }
        />
      ))}
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
        <Textarea
          id="qb-writing-description"
          rows={6}
          value={question.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Describe the writing task and any expected length or rubric…"
        />
      </Field>
      <Typography className="text-xs text-text-secondary">
        Players respond with a free-form written answer that is graded against
        the rubric.
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
    orderingItems: question.orderingItems.map((o) =>
      o.id === id ? { ...o, text } : o,
    ),
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
            orderingItems: moveItem<QuestionOrderItem>(
              question.orderingItems,
              index,
              direction,
            ),
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
                    orderingItems: question.orderingItems.filter(
                      (o) => o.id !== item.id,
                    ),
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
            label={question.kind === "multiple_choice" || question.kind === "true_false" ? "Question" : "Description"}
          >
            <Textarea
              id="qa-description"
              rows={3}
              value={question.description}
              onChange={(event) => onChange({ description: event.target.value })}
              placeholder="Write the question players will see…"
            />
          </Field>
        )}

      {question.kind === "multiple_choice" && (
        <MultipleChoiceBody question={question} onChange={onChange} />
      )}
      {question.kind === "true_false" && (
        <TrueFalseBody question={question} onChange={onChange} />
      )}
      {question.kind === "fill_blank" && (
        <FillBlankBody question={question} onChange={onChange} />
      )}
      {question.kind === "matching" && (
        <MatchingBody question={question} onChange={onChange} />
      )}
      {question.kind === "writing" && (
        <WritingBody question={question} onChange={onChange} />
      )}
      {question.kind === "ordering" && (
        <OrderingBody question={question} onChange={onChange} />
      )}
    </div>
  );
}

export default QuestionAuthoringEditor;