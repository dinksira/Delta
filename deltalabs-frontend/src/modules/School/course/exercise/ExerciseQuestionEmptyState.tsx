"use client";

import { ChevronDown, Search } from "lucide-react";

export function ExerciseQuestionEmptyState() {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="relative mb-2 text-primary-700/80">
        <Search className="size-16 stroke-[1.25]" aria-hidden />
        <span className="absolute -bottom-1 -right-2 rounded-md border border-[#c5d0da] bg-white p-1 shadow-sm">
          <ChevronDown className="size-4 text-[#5a7184]" aria-hidden />
        </span>
      </div>
      <p className="text-base font-semibold text-[#0f2a3d]">Select Question Type</p>
      <p className="text-sm text-[#8a9aab]">No question selected!</p>
    </div>
  );
}
