"use client";

import { CalendarCheck, Fingerprint, LogIn } from "lucide-react";

import type { ClassAttendanceView } from "@/modules/School/attendance/types";

const VIEWS: ReadonlyArray<{
  id: ClassAttendanceView;
  label: string;
  Icon: typeof CalendarCheck;
}> = [
  { id: "sessions", label: "Manual attendance", Icon: CalendarCheck },
  { id: "leave", label: "Leave management", Icon: LogIn },
  { id: "devices", label: "Device integration", Icon: Fingerprint },
];

/** Vertically centered stack of three attendance sub-views (Figma left rail). */
export function ClassAttendanceSideRail({
  activeView,
  onSelect,
}: Readonly<{
  activeView: ClassAttendanceView;
  onSelect: (view: ClassAttendanceView) => void;
}>) {
  return (
    <nav
      className="flex shrink-0 flex-col items-center justify-center gap-2.5 self-center py-4"
      aria-label="Attendance sections"
    >
      {VIEWS.map(({ id, label, Icon }) => {
        const active = activeView === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect(id)}
            className={[
              "inline-flex size-11 items-center justify-center rounded-lg border transition-colors sm:size-12",
              active
                ? "border-primary-600 bg-primary-700 text-white shadow-sm"
                : "border-border-default bg-surface-default text-text-secondary hover:border-primary-200 hover:bg-surface-muted",
            ].join(" ")}
          >
            <Icon className="size-5 sm:size-[1.35rem]" aria-hidden strokeWidth={1.75} />
          </button>
        );
      })}
    </nav>
  );
}
