/** ################################ TYPES ############################# */
/** Props contract for TimeSelectionModal. */

/**
 * Props for {@link TimeSelectionModal}.
 *
 * Note: despite the historical name, this renders a **popover** — it must sit
 * inside a relatively-positioned parent so the panel can anchor to its trigger.
 * The name is retained to avoid a breaking change to the published library API.
 */
export interface TimeSelectionModalProps {
  /** Whether the popover is visible. Renders `null` when false. */
  isOpen: boolean;
  /** Dismisses the popover without selecting. */
  onClose: () => void;
  /** Receives the chosen day as `yyyy-mm-dd`. */
  onSelect: (isoDate: string) => void;
  /** Externally controlled selection, `yyyy-mm-dd`. Defaults to today. */
  selectedDate?: string;
  /** Reveals the time-slot pane beside the calendar. Defaults to `false`. */
  showTimeSlots?: boolean;
  /** Currently selected time slot, when `showTimeSlots` is on. */
  selectedTime?: string;
  /** Receives the chosen time slot, when `showTimeSlots` is on. */
  onTimeSelect?: (time: string) => void;
  /** Earliest selectable day as `yyyy-mm-dd`. Earlier days are disabled. */
  minDate?: string;
  /**
   * Accessible name for the dialog. Defaults to `"Estimated tutor time"`.
   * This names the surrounding dialog, not the calendar grid inside it.
   */
  ariaLabel?: string;
  /** Extra classes merged onto the popover panel. */
  className?: string;
}
/** ################################ /TYPES ############################# */
