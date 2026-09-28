/** ################################ HOOK ############################# */
/**
 * Day-picker state for `TimeSelectionModal`: which month is on screen, which
 * day is focused, and the selection/keyboard handlers.
 *
 * All of this lives here so the component stays a thin composition. Cross-month
 * keyboard moves go through a single `pendingIso` path, which is the only place
 * that re-centres the view.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { addMonths, todayIso, yearMonthOfIso, type YearMonth } from "./dateGrid";
import { useCalendarKeys } from "./useCalendarKeys";

/** Props for {@link useDayPicker}. */
export interface UseDayPickerOptions {
  /** Externally controlled selection, `yyyy-mm-dd`. Defaults to today. */
  selectedDate: string | undefined;
  /** Earliest selectable day, `yyyy-mm-dd`. */
  minDate: string | undefined;
  /** Receives the chosen day. */
  onSelect: (isoDate: string) => void;
  /** Dismisses the popover. */
  onClose: () => void;
  /** Whether choosing a day also closes the popover. */
  closeOnSelect: boolean;
}

/** The value {@link useDayPicker} hands back to the component. */
export interface UseDayPickerResult {
  /** Month currently rendered. */
  view: YearMonth;
  /** Selected day as `yyyy-mm-dd`. */
  selectedIso: string;
  /** Ref for the grid wrapper, used for focus movement. */
  gridRef: React.RefObject<HTMLDivElement | null>;
  /** Keydown handler for the grid. */
  handleKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  /** Selects a day, closing the popover when `closeOnSelect`. */
  handleSelect: (iso: string) => void;
  /** Steps the visible month. */
  shiftMonth: (delta: number) => void;
}

/**
 * Settles a pending keyboard focus onto a real day button.
 *
 * A keyboard move can cross a month boundary, so the target is not in the DOM
 * yet. The view is re-centred first, then focus is retried on every subsequent
 * render until the button actually exists.
 */
function usePendingFocus(
  pendingIso: string | null,
  view: YearMonth,
  setView: (view: YearMonth) => void,
  gridRef: React.RefObject<HTMLDivElement | null>,
  settle: () => void,
) {
  useEffect(() => {
    if (pendingIso) {
      setView(yearMonthOfIso(pendingIso));
    }
  }, [pendingIso, setView]);

  useEffect(() => {
    if (!pendingIso) {
      return;
    }
    const target = gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${pendingIso}"]`);
    if (!target) {
      return;
    }
    target.focus();
    settle();
  }, [gridRef, pendingIso, settle, view]);
}

/** Owns the calendar's view, focus, and selection state. */
export function useDayPicker({
  selectedDate,
  onSelect,
  onClose,
  closeOnSelect,
}: Readonly<UseDayPickerOptions>): UseDayPickerResult {
  const selectedIso = useMemo(() => selectedDate ?? todayIso(), [selectedDate]);
  const [view, setView] = useState<YearMonth>(() => yearMonthOfIso(selectedDate ?? todayIso()));
  const [pendingIso, setPendingIso] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // A newly supplied selection should reveal itself rather than staying hidden
  // in whatever month happens to be on screen.
  useEffect(() => {
    setView(yearMonthOfIso(selectedIso));
  }, [selectedIso]);

  /**
   * A keyboard move can cross a month boundary, so the target day is not in the
   * DOM yet. The view is re-centred first, then focus is retried on every
   * subsequent render until the button actually exists.
   */
  usePendingFocus(
    pendingIso,
    view,
    setView,
    gridRef,
    useCallback(() => setPendingIso(null), []),
  );

  const handleKeyDown = useCalendarKeys({ gridRef, setPendingFocus: setPendingIso });

  const handleSelect = useCallback(
    (iso: string) => {
      onSelect(iso);
      if (closeOnSelect) {
        onClose();
      }
    },
    [closeOnSelect, onClose, onSelect],
  );

  const shiftMonth = useCallback((delta: number) => {
    setView((current) => addMonths(current, delta));
  }, []);

  return { view, selectedIso, gridRef, handleKeyDown, handleSelect, shiftMonth };
}
/** ################################ /HOOK ############################# */
