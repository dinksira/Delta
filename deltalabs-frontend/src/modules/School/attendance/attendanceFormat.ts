import type {
  AttendanceDeviceRecord,
  AttendanceDeviceType,
  AttendanceMarkStatus,
  AttendanceSessionTracking,
} from "@/modules/School/attendance/types";

export function deviceTypeLabel(type: AttendanceDeviceType): string {
  switch (type) {
    case "qr_scanner":
      return "QR Scanner";
    case "fingerprint":
      return "Fingerprint";
    default:
      return "Device";
  }
}

export function formatAttendanceDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function countPresentMarks(
  studentId: string,
  sessionIds: readonly string[],
  marks: Readonly<Record<string, AttendanceMarkStatus>>,
): number {
  let count = 0;
  for (const sessionId of sessionIds) {
    if (marks[`${studentId}:${sessionId}`] === "present") count += 1;
  }
  return count;
}

export function deviceStatusClass(status: AttendanceDeviceRecord["status"]): string {
  return status === "online"
    ? "bg-emerald-500 text-white"
    : "bg-surface-muted text-text-tertiary";
}

/** Formula column: count of present + late marks across all session columns. */
export function attendanceFormulaScore(
  studentId: string,
  sessionIds: readonly string[],
  marks: Readonly<Record<string, AttendanceMarkStatus>>,
): number {
  let score = 0;
  for (const sessionId of sessionIds) {
    const status = marks[`${studentId}:${sessionId}`];
    if (status === "present") score += 1;
    else if (status === "late") score += 1;
  }
  return score;
}

export function nextMarkStatus(current: AttendanceMarkStatus | undefined): AttendanceMarkStatus | undefined {
  if (!current) return "present";
  if (current === "present") return "absent";
  if (current === "absent") return "late";
  return undefined;
}
