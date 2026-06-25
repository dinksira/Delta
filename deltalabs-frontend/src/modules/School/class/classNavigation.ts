/** Safe decode of `returnTo` for class → school workspace navigation. */
import type { ClassAttendanceView } from "@/modules/School/attendance/types";

export type { ClassAttendanceView };

export function safeClassReturnHref(returnToRaw: string | null, schoolId: string): string {
  const fallback = `/features/school/${encodeURIComponent(schoolId)}`;
  if (!returnToRaw?.trim()) return fallback;
  try {
    const decoded = decodeURIComponent(returnToRaw.trim());
    if (!decoded.startsWith("/features/school/")) return fallback;
    const after = decoded.slice("/features/school/".length);
    const firstSeg = after.split(/[/?#]/)[0] ?? "";
    if (firstSeg !== schoolId) return fallback;
    return decoded;
  } catch {
    return fallback;
  }
}

const ATTENDANCE_VIEWS = new Set<string>(["sessions", "leave", "devices"]);

/** Sub-view within class attendance (`?nav=attendance&attendanceView=…`). */
export function parseClassAttendanceView(raw: string | null): ClassAttendanceView {
  if (raw && ATTENDANCE_VIEWS.has(raw)) return raw as ClassAttendanceView;
  return "sessions";
}
