"use client";

import { X } from "lucide-react";

import type { ExerciseQuestionVariantDto } from "@/modules/School/api";
import { createMatchingItem } from "@/modules/School/course/exercise/exerciseModel";
import { ExerciseQuestionStemEditor } from "@/modules/School/course/exercise/ExerciseQuestionStemEditor";

export function TrueFalseQuestionEditor({
  variant,
  onChange,
}: Readonly<{
  variant: ExerciseQuestionVariantDto;
  onChange: (next: ExerciseQuestionVariantDto) => void;
}>) {
  const options =
    variant.options.length >= 2
      ? variant.options
      : [
          { id: "tf_t", label: "T", text: "True", isCorrect: true, ghosted: false },
          { id: "tf_f", label: "F", text: "False", isCorrect: false, ghosted: false },
        ];

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-[#0f2a3d]">True/False</p>
      <ExerciseQuestionStemEditor
        value={variant.stemHtml}
        ghosted={variant.stemGhosted}
        onChange={(stemHtml) => onChange({ ...variant, stemHtml, options })}
        onToggleGhost={() => onChange({ ...variant, stemGhosted: !variant.stemGhosted, options })}
      />
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={[
              "rounded-full border px-4 py-2 text-sm font-medium",
              opt.isCorrect
                ? "border-primary-600 bg-primary-50 text-primary-900"
                : "border-[#c5d0da] bg-white text-[#0f2a3d]",
            ].join(" ")}
            onClick={() =>
              onChange({
                ...variant,
                options: options.map((o) => ({ ...o, isCorrect: o.id === opt.id })),
              })
            }
          >
            {opt.text || opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FillBlankQuestionEditor({
  variant,
  onChange,
}: Readonly<{
  variant: ExerciseQuestionVariantDto;
  onChange: (next: ExerciseQuestionVariantDto) => void;
}>) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-[#0f2a3d]">Fill-in-the-Blanks</p>
      <ExerciseQuestionStemEditor
        value={variant.stemHtml}
        ghosted={variant.stemGhosted}
        placeholder="Write the sentence and mark blanks…"
        onChange={(stemHtml) => onChange({ ...variant, stemHtml })}
        onToggleGhost={() => onChange({ ...variant, stemGhosted: !variant.stemGhosted })}
      />
      <div className="space-y-2">
        <p className="text-xs font-medium text-[#5a7184]">Accepted answers</p>
        {variant.blanks.map((blank, index) => (
          <div key={`blank-${index}`} className="flex items-center gap-2">
            <input
              value={blank}
              className="h-10 flex-1 rounded-lg border border-[#c5d0da] px-3 text-sm outline-none focus:border-primary-500"
              onChange={(e) => {
                const next = [...variant.blanks];
                next[index] = e.target.value;
                onChange({ ...variant, blanks: next });
              }}
            />
            <button
              type="button"
              className="text-[#8a9aab] hover:text-[#0f2a3d]"
              onClick={() =>
                onChange({ ...variant, blanks: variant.blanks.filter((_, i) => i !== index) })
              }
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm font-medium text-primary-800 hover:underline"
          onClick={() => onChange({ ...variant, blanks: [...variant.blanks, ""] })}
        >
          + Add blank answer
        </button>
      </div>
    </div>
  );
}

export function WritingQuestionEditor({
  variant,
  onChange,
}: Readonly<{
  variant: ExerciseQuestionVariantDto;
  onChange: (next: ExerciseQuestionVariantDto) => void;
}>) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-[#0f2a3d]">Writing</p>
      <ExerciseQuestionStemEditor
        value={variant.stemHtml}
        ghosted={variant.stemGhosted}
        placeholder="Prompt for the writing response…"
        onChange={(stemHtml) => onChange({ ...variant, stemHtml })}
        onToggleGhost={() => onChange({ ...variant, stemGhosted: !variant.stemGhosted })}
      />
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-[#5a7184]">Rubric / guidance</span>
        <textarea
          value={variant.writingPrompt}
          rows={4}
          className="w-full rounded-xl border border-[#c5d0da] px-3 py-2.5 text-sm outline-none focus:border-primary-500"
          onChange={(e) => onChange({ ...variant, writingPrompt: e.target.value })}
        />
      </label>
    </div>
  );
}

export function OrderingQuestionEditor({
  variant,
  onChange,
}: Readonly<{
  variant: ExerciseQuestionVariantDto;
  onChange: (next: ExerciseQuestionVariantDto) => void;
}>) {
  const items = [...variant.orderingItems];
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-[#0f2a3d]">Ordering / Sequencing</p>
      <ExerciseQuestionStemEditor
        value={variant.stemHtml}
        ghosted={variant.stemGhosted}
        onChange={(stemHtml) => onChange({ ...variant, stemHtml })}
        onToggleGhost={() => onChange({ ...variant, stemGhosted: !variant.stemGhosted })}
      />
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-lg border border-[#c5d0da] bg-white px-2.5 py-2"
          >
            <span className="text-xs font-semibold text-[#5a7184]">{index + 1}.</span>
            <input
              value={item.text}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              onChange={(e) =>
                onChange({
                  ...variant,
                  orderingItems: items.map((row) =>
                    row.id === item.id ? { ...row, text: e.target.value } : row,
                  ),
                })
              }
            />
            <button
              type="button"
              className="text-[#8a9aab] hover:text-[#0f2a3d]"
              onClick={() =>
                onChange({
                  ...variant,
                  orderingItems: items.filter((row) => row.id !== item.id),
                })
              }
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm font-medium text-primary-800 hover:underline"
          onClick={() =>
            onChange({ ...variant, orderingItems: [...items, createMatchingItem()] })
          }
        >
          + Add item
        </button>
      </div>
    </div>
  );
}
