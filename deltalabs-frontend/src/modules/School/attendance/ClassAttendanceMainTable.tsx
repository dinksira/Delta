"use client";

import { ChevronDown, EyeOff, LayoutGrid, Maximize2, MoreHorizontal, Plus } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { Button } from "@/components/theme";
import { markKey } from "@/modules/School/attendance/classAttendanceStorage";
import { evaluateAttendanceFormula } from "@/modules/School/attendance/attendanceFormulaEngine";
import { ClassAttendanceFormulaColumnHead } from "@/modules/School/attendance/ClassAttendanceFormulaColumnHead";
import {
  ClassAttendanceRealtimeTrackCell,
  ClassAttendanceRealtimeTrackColumnHead,
} from "@/modules/School/attendance/ClassAttendanceRealtimeTrackColumnHead";
import type {
  AttendanceFormulaConfig,
  AttendanceMarkStatus,
  AttendanceRealtimeTrackConfig,
  AttendanceSessionRecord,
  AttendanceStudentRow,
  ClassAttendanceState,
} from "@/modules/School/attendance/types";

function ColumnHead({
  title,
  icon,
  trailing,
}: Readonly<{
  title: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}>) {
  return (
    <div className="flex min-h-[2.25rem] items-center gap-1.5 px-2 py-1.5">
      {icon ? (
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary">
          {icon}
        </span>
      ) : null}
      <span className="truncate text-xs font-medium text-text-secondary">{title}</span>
      {trailing}
    </div>
  );
}

/** Manual session cell — empty checkbox → present (checked) → absent → late → clear. */
function ManualMarkCell({
  status,
  disabled,
  onToggle,
}: Readonly<{
  status: AttendanceMarkStatus | undefined;
  disabled: boolean;
  onToggle: () => void;
}>) {
  if (!status) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className="mx-auto flex size-[1.125rem] items-center justify-center rounded-[3px] border border-border-default bg-surface-default transition-colors hover:bg-surface-muted disabled:opacity-50"
        aria-label="Mark attendance"
      />
    );
  }
  if (status === "present") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className="mx-auto flex size-[1.125rem] items-center justify-center rounded-[3px] border border-primary-600 bg-primary-600 text-white disabled:opacity-50"
        aria-label="Present"
        title="Present"
      >
        <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M2 6l3 3 5-5" />
        </svg>
      </button>
    );
  }
  if (status === "absent") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className="mx-auto flex size-[1.125rem] items-center justify-center rounded-[3px] border border-red-400 bg-red-50 text-red-600 disabled:opacity-50"
        aria-label="Absent"
        title="Absent"
      >
        <span className="text-[10px] font-bold leading-none">✕</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className="mx-auto flex size-[1.125rem] items-center justify-center rounded-[3px] border border-amber-400 bg-amber-100 text-amber-800 disabled:opacity-50"
      aria-label="Late"
      title="Late"
    >
      <span className="text-[9px] font-bold leading-none">L</span>
    </button>
  );
}

/** Device / auto-track session cell — solid grey square when device recorded present (Figma Session 3). */
function DeviceMarkCell({
  status,
}: Readonly<{
  status: AttendanceMarkStatus | undefined;
}>) {
  const filled = status === "present" || status === "late";
  return (
    <div
      className={[
        "mx-auto size-[1.125rem] rounded-[3px]",
        filled ? "bg-[#b8c4d0]" : "border border-border-default bg-surface-muted/60",
      ].join(" ")}
      title={filled ? "Recorded by device" : "No device record"}
      aria-label={filled ? "Device recorded" : "No device record"}
    />
  );
}

export function ClassAttendanceMainTable({
  sessions,
  students,
  marks,
  formulaConfig,
  realtimeTrack,
  canMutate,
  onToggleMark,
  onSaveFormulaConfig,
  onChangeRealtimeTrack,
  onSaveFaceDetectionSettings,
}: Readonly<{
  sessions: readonly AttendanceSessionRecord[];
  students: readonly AttendanceStudentRow[];
  marks: ClassAttendanceState["marks"];
  formulaConfig: AttendanceFormulaConfig;
  realtimeTrack: AttendanceRealtimeTrackConfig;
  canMutate: boolean;
  onToggleMark: (studentId: string, sessionId: string) => void;
  onSaveFormulaConfig: (next: AttendanceFormulaConfig) => void;
  onChangeRealtimeTrack: (next: AttendanceRealtimeTrackConfig) => void;
  onSaveFaceDetectionSettings: (settings: AttendanceRealtimeTrackConfig["faceDetectionSettings"]) => void;
}>) {
  const regionId = useId();
  const [expanded, setExpanded] = useState(true);
  const sessionIds = sessions.map((s) => s.id);

  return (
    <div className="mt-2 first:mt-0">
      <div
        className={[
          "flex min-h-[2.75rem] items-stretch overflow-hidden rounded-t-xl border",
          expanded ? "border-transparent border-b-0 bg-transparent" : "rounded-b-xl border-border-default bg-[#cfd9e4] shadow-sm",
        ].join(" ")}
      >
        <button
          type="button"
          className={[
            "flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500",
            expanded ? "hover:bg-black/[0.03]" : "hover:bg-black/[0.04]",
          ].join(" ")}
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="w-1 shrink-0 self-stretch rounded-full bg-primary-500" aria-hidden />
          <ChevronDown
            className={["size-4 shrink-0 text-text-secondary transition-transform duration-200", expanded ? "rotate-0" : "-rotate-90"].join(" ")}
            aria-hidden
          />
          <div className="min-w-0">
            <span className="text-lg font-semibold leading-tight text-text-primary">Class Attendance</span>
            <p className="mt-px text-[11px] leading-tight text-text-tertiary">
              {students.length} student{students.length === 1 ? "" : "s"} · {sessions.length} session
              {sessions.length === 1 ? "" : "s"}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1 border-l border-transparent px-2 py-1.5">
          <Button type="button" variant="secondary" size="sm" className="hidden h-8 gap-1 text-xs sm:inline-flex" disabled title="Coming soon">
            <Plus className="size-3.5" aria-hidden />
            Add Group
          </Button>
          <button type="button" className="rounded-md p-1.5 text-text-tertiary hover:bg-surface-muted" title="More actions" aria-label="More actions">
            <MoreHorizontal className="size-4" aria-hidden />
          </button>
          <button type="button" className="rounded-md p-1.5 text-text-tertiary hover:bg-surface-muted" title="Expand" aria-label="Expand">
            <Maximize2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {expanded ? (
        <div id={regionId} className="rounded-b-xl border border-t-0 border-border-default bg-surface-default shadow-sm">
          <div className="flex min-h-[44px] items-center gap-6 border-b border-border-default px-3 pb-px pt-3">
            <span className="inline-flex items-center gap-1.5 border-b-2 border-primary-600 pb-2 text-sm font-semibold text-text-primary">
              <LayoutGrid className="size-3.5 text-text-tertiary" aria-hidden />
              Main Table
            </span>
            <button type="button" className="pb-2 text-lg font-medium text-text-tertiary" title="Add table view" aria-label="Add table view">
              +
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-[#e8edf3] text-left">
                  {/* Select */}
                  <th className="sticky left-0 z-[4] w-9 border-b border-r border-white bg-[#e8edf3] px-1.5 py-0">
                    <span className="sr-only">Select</span>
                  </th>
                  {/* Student */}
                  <th className="sticky left-9 z-[4] min-w-[72px] border-b border-l border-white bg-[#e8edf3] p-0 shadow-[2px_0_10px_rgba(2,24,43,0.08)]">
                    <ColumnHead
                      title="Student"
                      icon={<LayoutGrid className="size-3.5" aria-hidden />}
                    />
                  </th>
                  {/* Session columns */}
                  {sessions.map((session) => (
                    <th
                      key={session.id}
                      className={[
                        "min-w-[96px] border-b border-l border-white p-0",
                        session.hidden ? "opacity-80" : "",
                      ].join(" ")}
                    >
                      <ColumnHead
                        title={session.title}
                        trailing={
                          session.hidden ? (
                            <EyeOff className="size-3 shrink-0 text-text-tertiary" aria-label="Hidden from parents" />
                          ) : null
                        }
                      />
                    </th>
                  ))}
                  {/* Formula — user-configured (monday.com-style) */}
                  <th className="min-w-[100px] border-b border-l border-white p-0">
                    <ClassAttendanceFormulaColumnHead
                      config={formulaConfig}
                      sessions={sessions}
                      canMutate={canMutate}
                      onSave={onSaveFormulaConfig}
                    />
                  </th>
                  {/* Realtime track — configure face/voice auto attendance */}
                  <th className="min-w-[140px] border-b border-l border-white p-0">
                    <ClassAttendanceRealtimeTrackColumnHead
                      config={realtimeTrack}
                      canMutate={canMutate}
                      onChange={onChangeRealtimeTrack}
                      onSaveFaceSettings={onSaveFaceDetectionSettings}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={sessions.length + 4} className="px-3 py-8 text-center text-sm text-text-tertiary">
                      Add students on the Student tab first, then return here to mark attendance.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const formula = evaluateAttendanceFormula(student.id, formulaConfig, sessions, marks);
                    const hasRealtimeActivity =
                      realtimeTrack.enabled &&
                      sessionIds.some((sid) => {
                        const st = marks[markKey(student.id, sid)];
                        return st === "present" || st === "late";
                      });

                    return (
                      <tr key={student.id} className="group/row hover:bg-surface-muted/40">
                        <td className="sticky left-0 z-[2] border-b border-r border-border-default bg-surface-default px-1.5 py-2 align-middle group-hover/row:bg-surface-muted/40">
                          <input type="checkbox" className="size-3.5 rounded border-border-default" disabled aria-label="Select row" />
                        </td>
                        <td
                          className="sticky left-9 z-[2] border-b border-l border-border-default bg-surface-default px-2 py-2 align-middle shadow-[2px_0_10px_rgba(2,24,43,0.06)] group-hover/row:bg-surface-muted/40"
                          title={student.label}
                        >
                          <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#dce4ec] text-sm font-semibold text-text-secondary">
                            {student.label.charAt(0).toUpperCase()}
                          </span>
                        </td>
                        {sessions.map((session) => (
                          <td
                            key={session.id}
                            className={[
                              "border-b border-l border-border-default px-2 py-2 text-center align-middle",
                              session.hidden ? "bg-surface-muted/20" : "",
                            ].join(" ")}
                          >
                            {session.trackingMode === "device" ? (
                              <DeviceMarkCell status={marks[markKey(student.id, session.id)]} />
                            ) : (
                              <ManualMarkCell
                                status={marks[markKey(student.id, session.id)]}
                                disabled={!canMutate}
                                onToggle={() => onToggleMark(student.id, session.id)}
                              />
                            )}
                          </td>
                        ))}
                        <td className="border-b border-l border-border-default px-2 py-2 text-center text-sm font-semibold tabular-nums text-text-primary">
                          {formula}
                        </td>
                        <td className="border-b border-l border-border-default px-2 py-2">
                          <ClassAttendanceRealtimeTrackCell config={realtimeTrack} hasActivity={hasRealtimeActivity} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <div className="border-t border-border-default bg-surface-muted/30 px-1.5 py-1.5">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-tertiary"
                title="Students come from the class Student tab"
              >
                <Plus className="size-3.5" aria-hidden />
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
