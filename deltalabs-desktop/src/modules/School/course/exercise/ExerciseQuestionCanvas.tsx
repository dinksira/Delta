"use client";

import type { ExerciseQuestionDto, ExerciseQuestionTypeDto } from "@/modules/School/api";
import {
  MatchingQuestionEditor,
  McqQuestionEditor,
} from "@/modules/School/course/exercise/editors/McqAndMatchingEditors";
import {
  FillBlankQuestionEditor,
  OrderingQuestionEditor,
  TrueFalseQuestionEditor,
  WritingQuestionEditor,
} from "@/modules/School/course/exercise/editors/OtherQuestionEditors";
import {
  activeVariant,
  createEmptyQuestion,
  withActiveVariant,
} from "@/modules/School/course/exercise/exerciseModel";
import { ExerciseQuestionEmptyState } from "@/modules/School/course/exercise/ExerciseQuestionEmptyState";
import { ExerciseQuestionTabs } from "@/modules/School/course/exercise/ExerciseQuestionTabs";
import { ExerciseQuestionTypePicker } from "@/modules/School/course/exercise/ExerciseQuestionTypePicker";

export function ExerciseQuestionCanvas({
  questions,
  activeIndex,
  onActiveIndexChange,
  onQuestionsChange,
  readOnly = false,
}: Readonly<{
  questions: readonly ExerciseQuestionDto[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onQuestionsChange: (next: ExerciseQuestionDto[]) => void;
  readOnly?: boolean;
}>) {
  const question = questions[activeIndex] ?? null;
  const variant = question ? activeVariant(question) : null;

  const updateQuestion = (nextQ: ExerciseQuestionDto) => {
    if (readOnly) return;
    onQuestionsChange(questions.map((q, i) => (i === activeIndex ? nextQ : q)));
  };

  const setVariant = (nextV: ReturnType<typeof activeVariant>) => {
    if (!question) return;
    updateQuestion(withActiveVariant(question, nextV));
  };

  const onPickType = (type: ExerciseQuestionTypeDto) => {
    if (!question || !variant) return;
    setVariant({ ...variant, type });
  };

  let typeBody = <ExerciseQuestionEmptyState />;
  if (variant?.type === "mcq") {
    typeBody = <McqQuestionEditor variant={variant} onChange={setVariant} />;
  } else if (variant?.type === "matching") {
    typeBody = <MatchingQuestionEditor variant={variant} onChange={setVariant} />;
  } else if (variant?.type === "true_false") {
    typeBody = <TrueFalseQuestionEditor variant={variant} onChange={setVariant} />;
  } else if (variant?.type === "fill_blank") {
    typeBody = <FillBlankQuestionEditor variant={variant} onChange={setVariant} />;
  } else if (variant?.type === "writing") {
    typeBody = <WritingQuestionEditor variant={variant} onChange={setVariant} />;
  } else if (variant?.type === "ordering") {
    typeBody = <OrderingQuestionEditor variant={variant} onChange={setVariant} />;
  }

  return (
    <div className="min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
      <ExerciseQuestionTabs
        count={questions.length}
        activeIndex={activeIndex}
        onSelect={onActiveIndexChange}
        onAdd={
          readOnly
            ? undefined
            : () => {
                const next = [...questions, createEmptyQuestion(questions.length)];
                onQuestionsChange(next);
                onActiveIndexChange(next.length - 1);
              }
        }
      />

      <ExerciseQuestionTypePicker
        value={variant?.type ?? null}
        onChange={readOnly ? () => undefined : onPickType}
      />

      <div
        className={[
          "rounded-2xl border border-[#e3ebf1] bg-white p-4 sm:p-5",
          readOnly ? "pointer-events-none opacity-80" : "",
        ].join(" ")}
      >
        {typeBody}
      </div>
    </div>
  );
}
