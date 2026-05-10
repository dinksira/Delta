import { Plus } from "lucide-react";

import { Button } from "@/components/theme";

/**
 * Mock empty state: illustration (document + magnifying glass), “No Session” / “Add Session”, large + New Session.
 */
export function ClassSessionsEmptyState({
  onNewSession,
  disabled,
}: Readonly<{
  onNewSession: () => void;
  disabled: boolean;
}>) {
  return (
    <div className="flex min-h-[380px] w-full flex-col items-center justify-center rounded-[0.9rem] border border-dashed border-border-default bg-surface-muted/25 py-14 sm:min-h-[420px]">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="relative mb-5 flex h-24 w-28 items-center justify-center">
          <div className="absolute inset-x-0 top-8 h-11 rounded-full bg-primary-50/90" />
          <div className="relative z-[1] rounded-xl border border-border-default bg-surface-default p-3.5 shadow-sm">
            <div className="space-y-1.5">
              <div className="h-2 w-11 rounded-full bg-surface-muted" />
              <div className="h-2 w-14 rounded-full bg-surface-muted" />
              <div className="h-2 w-9 rounded-full bg-surface-muted" />
            </div>
          </div>
          <div className="absolute right-0 top-3 z-[2] rounded-full border border-border-default bg-surface-default p-1.5 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-text-tertiary" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-4.1-4.1" />
            </svg>
          </div>
        </div>
        <p className="text-base font-bold text-text-primary">No Session</p>
        <p className="mt-1.5 text-sm font-normal text-text-tertiary">Add Session</p>
        <Button type="button" variant="primary" size="sm" className="mt-8 min-w-[11rem] px-6 py-2.5 text-sm" onClick={onNewSession} disabled={disabled}>
          <Plus className="size-4" aria-hidden />
          New Session
        </Button>
      </div>
    </div>
  );
}
