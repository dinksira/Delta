/** ################################ TEST ############################# */
/** Tests for the pure calendar helpers. */
import { describe, expect, it } from "vitest";

import {
  addMonths,
  currentYearMonth,
  formatLongDate,
  formatMonthYear,
  getDaysInMonth,
  getMonthGrid,
  isBeforeIso,
  isSameIso,
  toIsoDate,
  toWeekRows,
  todayIso,
} from "./dateGrid";

describe("toIsoDate", () => {
  it("zero-pads month and day", () => {
    expect(toIsoDate(2026, 0, 5)).toBe("2026-01-05");
    expect(toIsoDate(2026, 11, 31)).toBe("2026-12-31");
  });
});

describe("getDaysInMonth", () => {
  it("handles 30-day months", () => {
    expect(getDaysInMonth(2026, 3)).toBe(30);
  });

  it("handles February in a common year", () => {
    expect(getDaysInMonth(2026, 1)).toBe(28);
  });

  it("handles February in a leap year", () => {
    expect(getDaysInMonth(2028, 1)).toBe(29);
  });

  it("handles December", () => {
    expect(getDaysInMonth(2026, 11)).toBe(31);
  });
});

describe("addMonths", () => {
  it("moves forward inside the year", () => {
    expect(addMonths({ year: 2026, month: 0 }, 1)).toEqual({ year: 2026, month: 1 });
  });

  it("rolls over into the next year", () => {
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
  });

  it("rolls back into the previous year", () => {
    expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe("getMonthGrid", () => {
  it("pads the start so day 1 lands under its real weekday", () => {
    // 1 March 2026 is a Sunday, so there is no leading padding.
    const cells = getMonthGrid({ year: 2026, month: 2 });
    expect(cells[0]).toEqual({ iso: "2026-03-01", day: 1 });
  });

  it("emits leading padding when the month starts mid-week", () => {
    // 1 June 2026 is a Monday, so exactly one padding cell precedes it.
    const cells = getMonthGrid({ year: 2026, month: 5 });
    expect(cells[0].iso).toBeNull();
    expect(cells[1]).toEqual({ iso: "2026-06-01", day: 1 });
  });

  it("returns only real days for a 28-day February", () => {
    const cells = getMonthGrid({ year: 2026, month: 1 });
    expect(cells.filter((cell) => cell.iso !== null)).toHaveLength(28);
  });

  it("returns 29 real days for a leap February", () => {
    const cells = getMonthGrid({ year: 2028, month: 1 });
    expect(cells.filter((cell) => cell.iso !== null)).toHaveLength(29);
  });

  it("always produces a whole number of weeks", () => {
    for (let month = 0; month < 12; month += 1) {
      expect(getMonthGrid({ year: 2026, month }).length % 7).toBe(0);
    }
  });
});

describe("toWeekRows", () => {
  it("groups cells into rows of seven", () => {
    const rows = toWeekRows(getMonthGrid({ year: 2026, month: 2 }));
    expect(rows.every((row) => row.length === 7)).toBe(true);
  });
});

describe("formatting", () => {
  it("formats the month heading", () => {
    expect(formatMonthYear({ year: 2026, month: 2 })).toBe("March 2026");
  });

  it("formats a long date", () => {
    expect(formatLongDate("2026-03-15")).toBe("March 15, 2026");
  });
});

describe("today helpers", () => {
  it("produces a valid ISO date for today", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("produces a month in range for today", () => {
    const { month } = currentYearMonth();
    expect(month).toBeGreaterThanOrEqual(0);
    expect(month).toBeLessThanOrEqual(11);
  });
});

describe("comparison helpers", () => {
  it("detects the same day", () => {
    expect(isSameIso("2026-03-15", "2026-03-15")).toBe(true);
    expect(isSameIso("2026-03-15", "2026-03-16")).toBe(false);
  });

  it("treats null as never matching", () => {
    expect(isSameIso(null, null)).toBe(false);
  });

  it("compares against a minimum date", () => {
    expect(isBeforeIso("2026-03-01", "2026-03-15")).toBe(true);
    expect(isBeforeIso("2026-03-15", "2026-03-15")).toBe(false);
  });

  it("allows everything when no minimum is given", () => {
    expect(isBeforeIso("2020-01-01", undefined)).toBe(false);
  });
});
/** ################################ /TEST ############################# */
