"use client";

import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

import type { ExerciseQuestionVariantDto } from "@/modules/School/api";
import { ExerciseGhostBlockButton } from "@/modules/School/course/exercise/ExerciseGhostBlockButton";
import { createMatchingItem, createMcqOption, optionLetter } from "@/modules/School/course/exercise/exerciseModel";
import { parseExerciseResourceDrag } from "@/modules/School/course/exercise/exerciseResourceDrag";
import { ExerciseQuestionStemEditor } from "@/modules/School/course/exercise/ExerciseQuestionStemEditor";

export function McqQuestionEditor({
  variant,
  onChange,
}: Readonly<{
  variant: ExerciseQuestionVariantDto;
  onChange: (next: ExerciseQuestionVariantDto) => void;
}>) {
  const options = variant.options.length > 0 ? variant.options : [createMcqOption(0), createMcqOption(1)];
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#0f2a3d]">Multiple Choice Question</p>
        <p className="mt-0.5 text-xs text-[#8a9aab]">
          Describe question briefly. Drag a resource onto the stem or an option.
        </p>
      </div>
      <ExerciseQuestionStemEditor
        value={variant.stemHtml}
        ghosted={variant.stemGhosted}
        onChange={(stemHtml) => onChange({ ...variant, stemHtml })}
        onToggleGhost={() => onChange({ ...variant, stemGhosted: !variant.stemGhosted })}
      />
      <div className="space-y-2">
        {options.map((opt, index) => (
          <div
            key={opt.id}
            className={[
              "flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 shadow-sm transition-colors",
              dropTargetId === opt.id
                ? "border-primary-500 ring-2 ring-primary-500/25"
                : "border-[#c5d0da]",
            ].join(" ")}
            onDragOver={(e) => {
              if (!parseExerciseResourceDrag(e.dataTransfer)) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "copy";
              setDropTargetId(opt.id);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
              setDropTargetId((id) => (id === opt.id ? null : id));
            }}
            onDrop={(e) => {
              const payload = parseExerciseResourceDrag(e.dataTransfer);
              setDropTargetId(null);
              if (!payload?.previewUrl) return;
              e.preventDefault();
              e.stopPropagation();
              const note = payload.fileName || payload.name;
              onChange({
                ...variant,
                options: options.map((o) =>
                  o.id === opt.id
                    ? {
                        ...o,
                        imageUrl: payload.previewUrl,
                        text: o.text.trim() ? o.text : note,
                      }
                    : o,
                ),
              });
            }}
          >
            <span
              className={[
                "inline-flex size-4 shrink-0 rounded-full border",
                opt.isCorrect ? "border-primary-600 bg-primary-600" : "border-[#9aa8b5]",
              ].join(" ")}
              aria-hidden
            />
            <button
              type="button"
              className="shrink-0 text-sm font-semibold text-[#0f2a3d]"
              title="Mark correct"
              onClick={() =>
                onChange({
                  ...variant,
                  options: options.map((o) => ({ ...o, isCorrect: o.id === opt.id })),
                })
              }
            >
              {opt.label || optionLetter(index)}.
            </button>
            {opt.imageUrl ? (
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={opt.imageUrl}
                  alt={opt.text || "Option image"}
                  className="h-10 w-10 rounded-lg border border-[#d5e0e8] object-cover"
                />
                <button
                  type="button"
                  aria-label="Remove option image"
                  className="absolute -right-1.5 -top-1.5 inline-flex size-4 items-center justify-center rounded-full bg-[#0f2a3d] text-white"
                  onClick={() =>
                    onChange({
                      ...variant,
                      options: options.map((o) =>
                        o.id === opt.id ? { ...o, imageUrl: "" } : o,
                      ),
                    })
                  }
                >
                  <X className="size-2.5" aria-hidden />
                </button>
              </div>
            ) : null}
            <input
              value={opt.text}
              placeholder={opt.imageUrl ? "Label (optional)…" : "Drop image or type…"}
              className="min-w-0 flex-1 bg-transparent text-sm text-[#0f2a3d] outline-none placeholder:text-[#8a9aab]"
              onChange={(e) =>
                onChange({
                  ...variant,
                  options: options.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)),
                })
              }
            />
            <ExerciseGhostBlockButton
              active={opt.ghosted}
              onToggle={() =>
                onChange({
                  ...variant,
                  options: options.map((o) =>
                    o.id === opt.id ? { ...o, ghosted: !o.ghosted } : o,
                  ),
                })
              }
            />
            <button
              type="button"
              aria-label="Remove option"
              className="text-[#8a9aab] hover:text-[#0f2a3d]"
              onClick={() =>
                onChange({
                  ...variant,
                  options: options.filter((o) => o.id !== opt.id),
                })
              }
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm font-medium text-primary-800 hover:underline"
          onClick={() =>
            onChange({
              ...variant,
              options: [...options, createMcqOption(options.length)],
            })
          }
        >
          + Add Option
        </button>
      </div>
    </div>
  );
}

export function MatchingQuestionEditor({
  variant,
  onChange,
}: Readonly<{
  variant: ExerciseQuestionVariantDto;
  onChange: (next: ExerciseQuestionVariantDto) => void;
}>) {
  const columnA = [...variant.columnA];
  const columnB = [...variant.columnB];

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-[#0f2a3d]">Matching</p>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-[#5a7184]">Matching Description</span>
        <textarea
          value={variant.matchingDescription}
          placeholder="here.."
          rows={3}
          className="w-full resize-y rounded-xl border border-[#c5d0da] bg-white px-3 py-2.5 text-sm text-[#0f2a3d] outline-none focus:border-primary-500"
          onChange={(e) => onChange({ ...variant, matchingDescription: e.target.value })}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <MatchingColumn
          title="Column A"
          items={columnA}
          numbered
          onChange={(next) => onChange({ ...variant, columnA: next })}
        />
        <MatchingColumn
          title="Column B"
          items={columnB}
          numbered={false}
          onChange={(next) => onChange({ ...variant, columnB: next })}
        />
      </div>
    </div>
  );
}

function MatchingColumn({
  title,
  items,
  numbered,
  onChange,
}: Readonly<{
  title: string;
  items: ExerciseQuestionVariantDto["columnA"];
  numbered: boolean;
  onChange: (next: ExerciseQuestionVariantDto["columnA"]) => void;
}>) {
  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-[#dce4ec] px-3 py-2 text-center text-sm font-semibold text-[#0f2a3d]">
        {title}
      </div>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-2 rounded-lg border border-[#c5d0da] bg-white px-2.5 py-2"
        >
          <ChevronDown className="size-3.5 shrink-0 text-[#8a9aab]" aria-hidden />
          <span className="shrink-0 text-xs font-semibold text-[#5a7184]">
            {numbered ? `${index + 1}.` : `${optionLetter(index)}.`}
          </span>
          <input
            value={item.text}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder={numbered ? `Option ${index + 1}` : `Option ${optionLetter(index)}`}
            onChange={(e) =>
              onChange(items.map((row) => (row.id === item.id ? { ...row, text: e.target.value } : row)))
            }
          />
          <button
            type="button"
            aria-label="Remove"
            className="text-[#8a9aab] hover:text-[#0f2a3d]"
            onClick={() => onChange(items.filter((row) => row.id !== item.id))}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ))}
        <button
          type="button"
          className="text-sm font-medium text-primary-800 hover:underline"
          onClick={() => onChange([...items, createMatchingItem()])}
        >
          + Add Option
        </button>
    </div>
  );
}
