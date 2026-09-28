/** ################################ DATE GRID ############################# */
/**
 * Pure calendar helpers for TimeSelectionModal.
 *
 * These exist because the previous implementation hardcoded a 31-day grid, a
 * missing weekday offset, and the literal year 2024. Keeping the maths here
 * makes it testable without rendering anything.
 */

/** Month names in `Date` order (index 0 = January). */
export const MONTH_NAMES = [
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
] as const;

/** Weekday headers, Sunday first, matching `Date.prototype.getDay`. */
export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

/** Full weekday names, used for `abbr` on the column headers. */
export const WEEKDAY_FULL_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** One cell in the month grid. `iso` is null for leading/trailing padding. */
export interface CalendarCell {
  /** `yyyy-mm-dd`, or null when the cell is outside the displayed month. */
  iso: string | null;
  /** Day of month, 1-31. Zero for padding cells. */
  day: number;
}

/** Year plus zero-indexed month, as tracked by the view state. */
export interface YearMonth {
  year: number;
  month: number;
}

/** Formats a date as `yyyy-mm-dd` without timezone drift. */
export function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/** Number of days in the given month, leap years included. */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Steps the view by `delta` months, normalising the month index. */
export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const next = month + delta;
  return { year: year + Math.floor(next / 12), month: ((next % 12) + 12) % 12 };
}

/** Builds the padded cell list for a month, always a multiple of seven. */
export function getMonthGrid({ year, month }: YearMonth): CalendarCell[] {
  const leading = new Date(year, month, 1).getDay();
  const cells: CalendarCell[] = Array.from({ length: leading }, () => ({ iso: null, day: 0 }));

  for (let day = 1; day <= getDaysInMonth(year, month); day += 1) {
    cells.push({ iso: toIsoDate(year, month, day), day });
  }

  while (cells.length % WEEKDAY_LABELS.length !== 0) {
    cells.push({ iso: null, day: 0 });
  }

  return cells;
}

/** Splits a flat cell list into rows of seven for `role="row"` wrappers. */
export function toWeekRows(cells: readonly CalendarCell[]): CalendarCell[][] {
  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += WEEKDAY_LABELS.length) {
    rows.push(cells.slice(i, i + WEEKDAY_LABELS.length));
  }
  return rows;
}

/** Steps an ISO date by whole days, constructed in local time to avoid drift. */
export function shiftIso(iso: string, deltaDays: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + deltaDays);
  return toIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Shifts an ISO date by whole months, clamping to the shorter month. */
export function shiftIsoByMonth(iso: string, deltaMonths: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const target = addMonths({ year, month: month - 1 }, deltaMonths);
  const lastDay = getDaysInMonth(target.year, target.month);
  return toIsoDate(target.year, target.month, Math.min(day, lastDay));
}

/** Human heading, e.g. `"March 2026"`. */
export function formatMonthYear({ year, month }: YearMonth): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

/** Long form for a `yyyy-mm-dd` string, e.g. `"March 15, 2026"`. */
export function formatLongDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

/** Today as `yyyy-mm-dd` in the viewer's local timezone. */
export function todayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Today as a {@link YearMonth}. */
export function currentYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/** Converts a `yyyy-mm-dd` string to the `{ year, month }` it falls in. */
export function yearMonthOfIso(iso: string): YearMonth {
  const [year, month] = iso.split("-").map(Number);
  return { year, month: month - 1 };
}

/** True when both strings describe the same calendar day. */
export function isSameIso(left: string | null | undefined, right: string | null | undefined): boolean {
  return Boolean(left) && left === right;
}

/** True when `iso` is strictly before `boundary`; null/undefined disables it. */
export function isBeforeIso(iso: string, boundary: string | undefined): boolean {
  return boundary ? iso < boundary : false;
}
/** ################################ /DATE GRID ############################# */
