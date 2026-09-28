/** ################################ HOOK ############################# */
/**
 * Arrow-key, page-key, and Escape handling for the calendar grid.
 *
 * Internal to TimeSelectionModal: day buttons carry `data-iso`, which is how
 * the currently focused day is recovered without threading a ref per cell.
 * A move that crosses a month boundary only records a pending ISO date; the
 * caller re-centres the view and moves focus in one place.
 */

import { useCallback, type KeyboardEvent, type RefObject } from "react";

import { shiftIso, shiftIsoByMonth } from "./dateGrid";

/** Props for {@link useCalendarKeys}. */
export interface UseCalendarKeysOptions {
  /** Wrapper holding the day buttons. */
  gridRef: RefObject<HTMLDivElement | null>;
  /** Records a day to focus, usually one the current month has not rendered. */
  setPendingFocus: (iso: string) => void;
}

/** Day-offset for each arrow key. */
const DAY_MOVES: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

/**
 * Returns a keydown handler for the calendar grid.
 *
 * Escape is deliberately not handled here: the shared `Popover` already closes
 * on Escape, and handling it in both places would fire `onClose` twice.
 */
export function useCalendarKeys({ gridRef, setPendingFocus }: Readonly<UseCalendarKeysOptions>) {
  return useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const iso = (document.activeElement as HTMLElement | null)?.dataset.iso;
      if (!iso) {
        return;
      }

      if (event.key in DAY_MOVES) {
        event.preventDefault();
        const next = shiftIso(iso, DAY_MOVES[event.key]);
        setPendingFocus(next);
        gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${next}"]`)?.focus();
        return;
      }

      if (event.key === "PageUp" || event.key === "PageDown") {
        event.preventDefault();
        setPendingFocus(shiftIsoByMonth(iso, event.key === "PageUp" ? -1 : 1));
      }
    },
    [gridRef, setPendingFocus],
  );
}
/** ################################ /HOOK ############################# */
