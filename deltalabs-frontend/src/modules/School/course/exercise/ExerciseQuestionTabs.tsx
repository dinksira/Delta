"use client";

import { Plus } from "lucide-react";

/** Figma: one full-width bordered bar; Q chips + add sit inside it. */
export function ExerciseQuestionTabs({
  count,
  activeIndex,
  onSelect,
  onAdd,
}: Readonly<{
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd?: () => void;
}>) {
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-[#c5d0da] bg-white px-2.5 py-2 sm:px-3">
      {Array.from({ length: count }, (_, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={`q-tab-${i}`}
            type="button"
            className={[
              "inline-flex size-9 shrink-0 items-center justify-center rounded-md border text-sm font-semibold transition-colors",
              active
                ? "border-[#b8cddc] bg-[#dce4ec] text-[#0f2a3d]"
                : "border-[#c5d0da] bg-white text-[#0f2a3d] hover:bg-[#f0f4f7]",
            ].join(" ")}
            onClick={() => onSelect(i)}
          >
            Q{i + 1}.
          </button>
        );
      })}
      {onAdd ? (
        <button
          type="button"
          aria-label="Add question"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-[#c5d0da] bg-white text-[#5a7184] hover:bg-[#f0f4f7] hover:text-[#0f2a3d]"
          onClick={onAdd}
        >
          <Plus className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
