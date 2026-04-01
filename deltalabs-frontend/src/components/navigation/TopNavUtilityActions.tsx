"use client";

import { ModeSwitchRect } from "@/components/navigation/ModeSwitchRect";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";

type TopNavUtilityActionsProps = Readonly<{
  isAuthenticated: boolean;
}>;

export function TopNavUtilityActions({ isAuthenticated }: TopNavUtilityActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <ModeSwitchRect isAuthenticated={isAuthenticated} />
      <span className="text-white/90" aria-hidden>
        {`{ }`}
      </span>
      <button type="button" className="text-sm text-white/90 hover:text-white">
        English
      </button>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-100 text-xs font-semibold text-slate-700">
        U
      </span>
      <ThemeToggle />
    </div>
  );
}
