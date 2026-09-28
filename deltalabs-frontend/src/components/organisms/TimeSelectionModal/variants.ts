/** ################################ VARIANTS ############################# */
/** Class maps and time-slot data for TimeSelectionModal. */

/** Transparent capture layer behind the popover. */
export const backdropClasses = "fixed inset-0 z-40";

/**
 * Panel sizing only — the surface, border, elevation, and anchoring come from
 * the shared `Popover` molecule, so they are not duplicated here.
 */
export const panelWidthClasses = "w-96";

/** Two-pane body; collapses to a single column when slots are hidden. */
export const bodyClasses = "flex";

/** Calendar side. */
export const calendarPaneClasses = "flex-1 p-4";

/** Time-slot side, visually recessed against the calendar. */
export const slotsPaneClasses =
  "flex w-44 flex-col gap-3 border-l border-border-subtle bg-surface-muted p-4";

/** Heading row: Today shortcut, month label, and the three nav buttons. */
export const headerClasses = "mb-3 flex items-center justify-between gap-2";

/** Month and year label. */
export const monthLabelClasses = "text-sm font-bold text-primary-900";

/** Container for the three header actions. */
export const headerActionsClasses = "flex items-center gap-1";

/** Square icon button used for the prev, next, and jump-to-today actions. */
export const navButtonClasses =
  "flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300";

/** Text-only "Today" shortcut. */
export const todayButtonClasses =
  "rounded-md px-2 py-1 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300";

/** Weekday column headers. */
export const weekdayHeaderClasses = "pb-1 text-center text-xs font-semibold uppercase text-text-tertiary";

/** Day cell button, unselected. */
export const dayClasses =
  "flex size-9 items-center justify-center rounded-md text-sm font-semibold text-text-primary transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300";

/** Day cell button, selected. */
export const daySelectedClasses = "bg-primary-600 text-white hover:bg-primary-600";

/** Day cell button, disabled by `minDate`. */
export const dayDisabledClasses = "cursor-not-allowed text-text-tertiary opacity-50 hover:bg-transparent";

/** Row of the calendar grid. */
export const weekRowClasses = "grid grid-cols-7";

/** Slot list heading. */
export const slotsHeadingClasses = "flex items-center gap-2 text-xs font-bold uppercase text-text-secondary";

/** Scrollable slot list. */
export const slotListClasses = "flex flex-1 flex-col gap-1 overflow-y-auto";

/** Time-slot row, unselected. */
export const slotClasses =
  "flex w-full items-center justify-between rounded-md border border-transparent bg-surface-default px-3 py-2 text-left text-sm font-semibold text-text-primary transition-colors hover:border-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300";

/** Time-slot row, selected. */
export const slotSelectedClasses = "border-primary-600 bg-surface-default text-primary-700";

/** Selectable hourly slots offered when `showTimeSlots` is enabled. */
export const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
] as const;
/** ################################ /VARIANTS ############################# */
