/** ################################ VARIANTS ############################# */
/** Class maps for TutorSelectionModal. */

/** Dialog content: a fixed-height column of search, grid, and footer. */
/** Token height; the tutor list scrolls inside it. */
export const contentClasses = "flex h-96 flex-col gap-4";

/** Search field and auto-match row. */
export const controlsClasses = "flex flex-col gap-3";

/** Auto-match switch with its label. */
export const autoMatchClasses = "flex items-center gap-2";

/** Auto-match label. */
export const autoMatchLabelClasses = "text-xs font-medium text-text-secondary";

/** Responsive tutor grid. */
export const gridClasses =
  "grid grid-cols-2 gap-4 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

/** One selectable tutor card. */
export const cardClasses =
  "flex flex-col items-center gap-1.5 rounded-lg p-2 text-center transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

/** Selected card treatment. */
export const cardSelectedClasses = "bg-primary-50 ring-2 ring-primary-600";

/** Square avatar frame. */
export const avatarFrameClasses = "relative aspect-square w-full overflow-hidden rounded-lg bg-surface-muted";

/** Selection indicator badge over the avatar. */
export const checkClasses =
  "absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-sm border-2 bg-surface-default";

/** Unselected indicator border. */
export const checkIdleClasses = "border-surface-default/50";

/** Selected indicator border. */
export const checkSelectedClasses = "border-primary-600";

/** Tutor name. */
export const nameClasses = "w-full truncate text-xs font-semibold text-text-primary";

/** Tutor credential line. */
export const titleClasses = "w-full truncate text-xs text-text-secondary";

/** Empty state for an unmatched search. */
export const emptyClasses =
  "flex flex-1 items-center justify-center rounded-lg border border-dashed border-border-default p-6 text-center text-sm text-text-secondary";

/** Footer row holding the confirm action. */
export const footerClasses = "mt-auto flex justify-end pt-2";
/** ################################ /VARIANTS ############################# */
