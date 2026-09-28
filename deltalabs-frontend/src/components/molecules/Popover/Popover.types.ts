/** ################################ TYPES ############################# */
/** Props and variants for Popover. */
import type { KeyboardEvent, ReactNode } from "react";

/** Which horizontal edge of the trigger the panel aligns to. */
export type PopoverPlacement = "left" | "right";

/** Props for {@link Popover}. */
export interface PopoverProps {
  /** Whether the popover is visible. Renders `null` when false. */
  isOpen: boolean;
  /** Dismisses on backdrop pointer press and on `Escape`. */
  onClose: () => void;
  /** Accessible name for the dialog region. */
  ariaLabel: string;
  /** Edge the panel aligns to. Defaults to `"left"`. */
  placement?: PopoverPlacement;
  /** Extra classes merged onto the panel, e.g. to set its width. */
  className?: string;
  /** Extra key handling on the panel, merged with the built-in Escape close. */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** Popover contents. */
  children: ReactNode;
}
/** ################################ /TYPES ############################# */
