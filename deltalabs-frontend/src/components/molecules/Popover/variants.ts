/** ################################ VARIANTS ############################# */
/** Class maps for Popover. */
import type { PopoverPlacement } from "./Popover.types";

/** Transparent full-screen capture layer behind the panel. */
export const backdropClasses = "fixed inset-0 z-40";

/** Shared panel treatment: anchored below the trigger, elevated. */
export const panelClasses =
  "absolute top-full z-50 mt-3 overflow-hidden rounded-lg border border-border-default bg-surface-default shadow-md";

/** Horizontal alignment, keyed by `PopoverPlacement`. */
export const placementClasses: Record<PopoverPlacement, string> = {
  left: "left-0",
  right: "right-0",
};
/** ################################ /VARIANTS ############################# */
