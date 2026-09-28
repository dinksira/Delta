/** ################################ COMPONENT ############################# */
/**
 * CalendarGrid — the month grid: weekday headers plus the selectable days.
 *
 * Split out of `TimeSelectionModal.tsx` to keep both the file and the parent
 * function within the project's size limits.
 */

import React, { useMemo, type RefObject } from "react";

import { cn } from "@/lib/utils";
import {
  formatLongDate,
  formatMonthYear,
  getMonthGrid,
  isBeforeIso,
  isSameIso,
  toWeekRows,
  todayIso,
  WEEKDAY_FULL_NAMES,
  WEEKDAY_LABELS,
  type YearMonth,
} from "./dateGrid";
import {
  dayClasses,
  dayDisabledClasses,
  daySelectedClasses,
  weekRowClasses,
  weekdayHeaderClasses,
} from "./variants";

/** Props for {@link CalendarGrid}. */
export interface CalendarGridProps {
  /** Month currently rendered. */
  view: YearMonth;
  /** Selected day as `yyyy-mm-dd`. */
  selectedIso: string;
  /** Earliest selectable day; earlier days are disabled. */
  minDate: string | undefined;
  /** Wrapper ref, used for arrow-key focus movement. */
  gridRef: RefObject<HTMLDivElement | null>;
  /** Called with the chosen day. */
  onSelect: (iso: string) => void;
}

/** A single day button, wrapped in its gridcell. */
function DayCell({
  iso,
  day,
  isSelected,
  isDisabled,
  isToday,
  onSelect,
}: Readonly<{
  iso: string;
  day: number;
  isSelected: boolean;
  isDisabled: boolean;
  isToday: boolean;
  onSelect: (iso: string) => void;
}>) {
  return (
    // `aria-selected` belongs on the gridcell: the button role that actually
    // receives focus does not support it.
    <div role="gridcell" aria-selected={isSelected}>
      <button
        type="button"
        data-iso={iso}
        aria-current={isToday ? "date" : undefined}
        aria-label={formatLongDate(iso)}
        disabled={isDisabled}
        onClick={() => onSelect(iso)}
        className={cn(dayClasses, isSelected && daySelectedClasses, isDisabled && dayDisabledClasses)}
      >
        {day}
      </button>
    </div>
  );
}

/** Renders one month as an ARIA grid of day buttons. */
export function CalendarGrid({
  view,
  selectedIso,
  minDate,
  gridRef,
  onSelect,
}: Readonly<CalendarGridProps>) {
  const weeks = useMemo(() => toWeekRows(getMonthGrid(view)), [view]);
  const today = todayIso();

  return (
    <div ref={gridRef} role="grid" aria-label={formatMonthYear(view)}>
      <div role="row" className={weekRowClasses}>
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            role="columnheader"
            aria-label={WEEKDAY_FULL_NAMES[index]}
            className={weekdayHeaderClasses}
          >
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week, weekIndex) => (
        <div role="row" key={weekIndex} className={weekRowClasses}>
          {week.map((cell, cellIndex) =>
            cell.iso ? (
              <DayCell
                key={cell.iso}
                iso={cell.iso}
                day={cell.day}
                isSelected={isSameIso(cell.iso, selectedIso)}
                isDisabled={isBeforeIso(cell.iso, minDate)}
                isToday={cell.iso === today}
                onSelect={onSelect}
              />
            ) : (
              <div key={`pad-${cellIndex}`} role="gridcell" aria-disabled="true" />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

CalendarGrid.displayName = "CalendarGrid";
/** ################################ /COMPONENT ############################# */
