import type { ReactNode } from "react";

/** Shared empty-state illustration (document + magnifying glass) — matches class session empty states. */
export function ClassAttendanceEmptyIllustration() {
  return (
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
  );
}

export function ClassAttendanceEmptyState({
  title,
  subtitle,
  action,
}: Readonly<{
  title: string;
  subtitle: string;
  action: ReactNode;
}>) {
  return (
    <div className="flex min-h-[380px] w-full flex-col items-center justify-center rounded-[0.9rem] border border-dashed border-border-default bg-surface-muted/25 py-14 sm:min-h-[420px]">
      <div className="flex max-w-sm flex-col items-center text-center">
        <ClassAttendanceEmptyIllustration />
        <p className="text-base font-bold text-text-primary">{title}</p>
        <p className="mt-1.5 text-sm font-normal text-text-tertiary">{subtitle}</p>
        <div className="mt-8">{action}</div>
      </div>
    </div>
  );
}
