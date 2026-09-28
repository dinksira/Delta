/** ################################ COMPONENT ############################# */
/**
 * TimeSlotPane — the optional hourly slot list shown beside the calendar, and
 * CalendarHeader — the "Today" shortcut plus the month steppers.
 *
 * Both are internal building blocks of `TimeSelectionModal`.
 */

import React from "react";
import { CalendarClock, Check, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMonthYear, type YearMonth } from "./dateGrid";
import {
  headerActionsClasses,
  headerClasses,
  monthLabelClasses,
  navButtonClasses,
  slotClasses,
  slotListClasses,
  slotSelectedClasses,
  slotsHeadingClasses,
  slotsPaneClasses,
  todayButtonClasses,
  TIME_SLOTS,
} from "./variants";

/** Props for {@link TimeSlotPane}. */
export interface TimeSlotPaneProps {
  /** Currently selected slot label. */
  selectedTime: string | undefined;
  /** Receives the chosen slot. */
  onSelect: (time: string) => void;
}

/** Renders the selectable hourly slots as a listbox. */
export function TimeSlotPane({ selectedTime, onSelect }: Readonly<TimeSlotPaneProps>) {
  return (
    <div className={slotsPaneClasses}>
      <p className={slotsHeadingClasses}>
        <CalendarClock className="size-4" aria-hidden="true" />
        Available slots
      </p>

      <div role="listbox" aria-label="Available time slots" className={slotListClasses}>
        {TIME_SLOTS.map((slot) => {
          const isSelected = slot === selectedTime;
          return (
            <button
              key={slot}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={cn(slotClasses, isSelected && slotSelectedClasses)}
              onClick={() => onSelect(slot)}
            >
              {slot}
              {isSelected ? <Check className="size-3.5" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

TimeSlotPane.displayName = "TimeSlotPane";

/** Props for {@link CalendarHeader}. */
export interface CalendarHeaderProps {
  /** Month currently rendered. */
  view: YearMonth;
  /** Steps the view by the given number of months. */
  onShiftMonth: (delta: number) => void;
  /** Selects today. */
  onToday: () => void;
}

/** Renders the "Today" shortcut, the month label, and the steppers. */
export function CalendarHeader({ view, onShiftMonth, onToday }: Readonly<CalendarHeaderProps>) {
  return (
    <div className={headerClasses}>
      <button type="button" className={todayButtonClasses} onClick={onToday}>
        Today
      </button>

      <p className={monthLabelClasses} aria-live="polite">
        {formatMonthYear(view)}
      </p>

      <div className={headerActionsClasses}>
        <button
          type="button"
          aria-label="Previous month"
          className={navButtonClasses}
          onClick={() => onShiftMonth(-1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          className={navButtonClasses}
          onClick={() => onShiftMonth(1)}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

CalendarHeader.displayName = "CalendarHeader";
/** ################################ /COMPONENT ############################# */
