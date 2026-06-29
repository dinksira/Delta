import type { ManagementTableColumnDto, ManagementTableRowDto } from "@/modules/School/api";
import { formatPersonCellLabel } from "@/modules/School/managementTable/managementTablePersonCell";
import { formatClassSessionCellLabel } from "@/modules/School/managementTable/managementTableClassSessionCell";

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Monday-start week containing `anchor`. */
export function startOfWeekMonday(anchor: Date): Date {
  const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatScheduleWeekRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startLabel = `${ordinal(weekStart.getDate())} ${MONTHS[weekStart.getMonth()]}`;
  const endLabel = `${ordinal(weekEnd.getDate())} ${MONTHS[weekEnd.getMonth()]}`;
  return `${startLabel} ↔ ${endLabel}`;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseCellDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const raw = value.trim().slice(0, 10);
  const parts = raw.split("-").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

function findColumnByTitle(columns: readonly ManagementTableColumnDto[], title: string): ManagementTableColumnDto | null {
  const needle = title.trim().toLowerCase();
  return columns.find((c) => c.title.trim().toLowerCase() === needle) ?? null;
}

export type ScheduleCalendarEvent = Readonly<{
  rowId: string;
  dateKey: string;
  timeLabel: string;
  startMinutes: number;
  durationMinutes: number;
  sessionLabel: string;
  teacherLabel: string;
  roomLabel: string;
  statusLabel: string;
  statusId: string;
}>;

export function parseTimeToMinutes(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

export function formatMinutesAsTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isSameDateKey(a: Date, dateKey: string): boolean {
  return toDateKey(a) === dateKey;
}

export function isTodayDate(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export const SCHEDULE_CALENDAR_HOUR_START = 6;
export const SCHEDULE_CALENDAR_HOUR_END = 22;
export const SCHEDULE_CALENDAR_SLOT_MINUTES = 30;
export const SCHEDULE_CALENDAR_PX_PER_MINUTE = 1.15;

export function buildScheduleCalendarEvents(
  rows: readonly ManagementTableRowDto[],
  columns: readonly ManagementTableColumnDto[],
): ScheduleCalendarEvent[] {
  const sessionCol = findColumnByTitle(columns, "Session");
  const dateCol = findColumnByTitle(columns, "Date");
  const timeCol = findColumnByTitle(columns, "Time");
  const teacherCol = findColumnByTitle(columns, "Assign Teacher");
  const roomCol = findColumnByTitle(columns, "Class Room");
  const statusCol = findColumnByTitle(columns, "Status");
  const durationCol = findColumnByTitle(columns, "Duration");

  const events: ScheduleCalendarEvent[] = [];
  for (const row of rows) {
    const dateVal = dateCol ? row.cells[dateCol.id] : null;
    const parsed = parseCellDate(dateVal);
    if (!parsed) continue;

    const sessionRaw = sessionCol ? row.cells[sessionCol.id] : null;
    const sessionLabel = formatClassSessionCellLabel(sessionRaw) || "Session";

    const timeRaw = timeCol ? row.cells[timeCol.id] : null;
    const timeLabel = typeof timeRaw === "string" && timeRaw.trim() ? timeRaw.trim() : "";
    const startMinutes = parseTimeToMinutes(timeRaw) ?? 9 * 60;

    const durationRaw = durationCol ? row.cells[durationCol.id] : null;
    let durationMinutes = 60;
    if (typeof durationRaw === "number" && durationRaw > 0) {
      durationMinutes = Math.round(durationRaw);
    } else if (typeof durationRaw === "string" && durationRaw.trim()) {
      const parsedDuration = Number.parseInt(durationRaw, 10);
      if (!Number.isNaN(parsedDuration) && parsedDuration > 0) durationMinutes = parsedDuration;
    }

    const teacherRaw = teacherCol ? row.cells[teacherCol.id] : null;
    const teacherLabel = teacherCol ? formatPersonCellLabel(teacherRaw) : "";

    const roomRaw = roomCol ? row.cells[roomCol.id] : null;
    const roomLabel = typeof roomRaw === "string" && roomRaw.trim() ? roomRaw.trim() : "";

    let statusLabel = "";
    let statusId = "";
    if (statusCol) {
      const statusVal = row.cells[statusCol.id];
      if (typeof statusVal === "string") statusId = statusVal;
      const opts = statusCol.settings?.options;
      if (typeof statusVal === "string" && Array.isArray(opts)) {
        const match = opts.find(
          (o) => o && typeof o === "object" && "id" in o && String((o as { id: unknown }).id) === statusVal,
        );
        if (match && typeof match === "object" && "label" in match) {
          statusLabel = String((match as { label: unknown }).label);
        }
      }
    }

    events.push({
      rowId: row.id,
      dateKey: toDateKey(parsed),
      timeLabel,
      startMinutes,
      durationMinutes,
      sessionLabel,
      teacherLabel,
      roomLabel,
      statusLabel,
      statusId,
    });
  }

  return events.sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
    return a.startMinutes - b.startMinutes;
  });
}
