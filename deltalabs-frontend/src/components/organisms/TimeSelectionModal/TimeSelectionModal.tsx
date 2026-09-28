/**
 * TimeSelectionModal
 * Organism: a calendar popover for picking a day, with an optional time-slot
 * pane. Anchored below its trigger by a relatively-positioned parent.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <button type="button" onClick={() => setOpen(true)}>
 *     <CalendarDays className="size-4" />
 *     {date ?? "Estimate tutor time"}
 *   </button>
 *   <TimeSelectionModal
 *     isOpen={open}
 *     onClose={() => setOpen(false)}
 *     onSelect={setDate}
 *   />
 * </div>
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, class utility, shared popover, and local building blocks. */
import React from "react";

import { cn } from "@/lib/utils";
import { Popover } from "@/components/molecules/Popover";
import type { TimeSelectionModalProps } from "./TimeSelectionModal.types";
import { todayIso } from "./dateGrid";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarHeader, TimeSlotPane } from "./TimeSlotPane";
import { useDayPicker } from "./useDayPicker";
import { bodyClasses, calendarPaneClasses, panelWidthClasses } from "./variants";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Exposes a calendar popover for choosing a day, with optional time slots. */
export function TimeSelectionModal({
  isOpen, onClose, onSelect, selectedDate, showTimeSlots = false,
  selectedTime, onTimeSelect, minDate, ariaLabel = "Estimated tutor time", className,
}: Readonly<TimeSelectionModalProps>) {
  const picker = useDayPicker({
    selectedDate,
    minDate,
    onSelect,
    onClose,
    closeOnSelect: !showTimeSlots,
  });

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={ariaLabel}
      placement="right"
      className={cn(panelWidthClasses, className)}
    >
      <div className={bodyClasses} onKeyDown={picker.handleKeyDown}>
        <div className={calendarPaneClasses}>
          <CalendarHeader
            view={picker.view}
            onShiftMonth={picker.shiftMonth}
            onToday={() => picker.handleSelect(todayIso())}
          />
          <CalendarGrid
            view={picker.view}
            selectedIso={picker.selectedIso}
            minDate={minDate}
            gridRef={picker.gridRef}
            onSelect={picker.handleSelect}
          />
        </div>

        {showTimeSlots ? (
          <TimeSlotPane selectedTime={selectedTime} onSelect={onTimeSelect ?? (() => undefined)} />
        ) : null}
      </div>
    </Popover>
  );
}

TimeSelectionModal.displayName = "TimeSelectionModal";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default TimeSelectionModal;
/** ################################ /EXPORTS ############################# */
