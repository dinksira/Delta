"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ExerciseQuestionTypeDto } from "@/modules/School/api";
import {
  EXERCISE_QUESTION_TYPE_OPTIONS,
  questionTypeLabel,
} from "@/modules/School/course/exercise/exerciseModel";

export function ExerciseQuestionTypePicker({
  value,
  onChange,
}: Readonly<{
  value: ExerciseQuestionTypeDto | null;
  onChange: (type: ExerciseQuestionTypeDto) => void;
}>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <button
        type="button"
        className="flex h-11 w-full items-center justify-between rounded-xl border border-[#c5d0da] bg-white px-3.5 text-left text-sm text-[#0f2a3d] shadow-sm hover:border-primary-500"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? "font-medium" : "text-[#8a9aab]"}>{questionTypeLabel(value)}</span>
        <ChevronDown className="size-4 text-[#5a7184]" aria-hidden />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-[#c5d0da] bg-white py-1 shadow-lg"
        >
          {EXERCISE_QUESTION_TYPE_OPTIONS.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === opt.id}
                className={[
                  "flex w-full px-3.5 py-2.5 text-left text-sm transition-colors",
                  value === opt.id
                    ? "bg-primary-50 font-medium text-primary-900"
                    : "text-[#0f2a3d] hover:bg-[#f0f4f7]",
                ].join(" ")}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
