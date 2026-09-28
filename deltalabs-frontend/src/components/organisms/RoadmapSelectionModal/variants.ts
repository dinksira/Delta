/** ################################ VARIANTS ############################# */
/** Class maps for RoadmapSelectionModal. */

/**
 * Panel classes handed to `Modal`.
 *
 * The height lives on the panel rather than the content because `Modal`'s
 * overlay is `fixed inset-0`, so a percentage here resolves against the
 * viewport. That keeps the old ~75% dialog height without hardcoding one.
 */
export const modalClasses = "h-3/4 w-full max-w-4xl";

/** Dialog content: a scrolling roadmap with a fixed footer. */
export const contentClasses = "relative flex h-full w-full flex-col bg-surface-default";

/** Ordered list of sections; scrolls and positions the spine. */
export const listClasses = "relative flex w-full flex-1 flex-col items-center overflow-y-auto py-6";

/** One section block. */
export const sectionClasses = "relative flex w-full flex-col items-center pb-10";

/** Full-height spine behind a section, drawn from the section's own box. */
export const spineClasses = "absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-border-default";

/** Spine once the section is part of the current selection. */
export const spineReachedClasses = "bg-primary-200";

/** Node dot on the spine. */
export const nodeClasses =
  "z-10 size-7 rounded-full border-2 border-surface-default bg-primary-600 shadow-sm";

/** Node dot before the section is reached. */
export const nodeIdleClasses = "bg-surface-muted";

/** Section card as a toggle. */
export const sectionCardClasses =
  "w-11/12 max-w-3xl cursor-pointer rounded-xl border p-6 text-left shadow-sm transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

/** Selected section card. */
export const sectionCardSelectedClasses = "border-primary-600 bg-primary-50";

/** Unselected section card. */
export const sectionCardIdleClasses = "border-border-default bg-surface-default";

/** Section title. */
export const sectionTitleClasses = "text-xl font-bold text-text-primary";

/** Section summary. */
export const sectionDescriptionClasses = "mt-1 text-sm leading-relaxed text-text-secondary";

/** Resource grid inside a section. */
export const resourceGridClasses = "mt-4 grid w-11/12 max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2";

/** Resource card as a toggle. */
export const resourceCardClasses =
  "relative flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border p-3 text-left shadow-sm transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

/** Selected resource card. */
export const resourceCardSelectedClasses = "border-primary-600 bg-primary-50";

/** Unselected resource card. */
export const resourceCardIdleClasses = "border-border-default bg-surface-default";

/** Selection indicator on a resource card. */
export const resourceCheckClasses =
  "absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-sm border-2 bg-surface-default";

/** Indicator border, unselected. */
export const resourceCheckIdleClasses = "border-border-default";

/** Indicator border, selected. */
export const resourceCheckSelectedClasses = "border-primary-600";

/** Resource title row. */
export const resourceTitleClasses = "flex items-center gap-1.5";

/** Resource title text. */
export const resourceNameClasses = "text-xs font-bold text-text-primary";

/** Resource summary. */
export const resourceDescriptionClasses = "text-xs leading-tight text-text-secondary";

/** Resource meta row. */
export const resourceMetaClasses = "flex items-center gap-1.5";

/** Review affordance on a resource. */
export const reviewClasses = "ml-auto flex items-center gap-1";

/** Topic chip. */
export const tagClasses = "rounded-md bg-surface-muted px-2.5 py-1 text-xs font-bold text-text-secondary";

/** Selected topic chip. */
export const tagSelectedClasses = "bg-primary-100 text-primary-700";

/** Footer holding the confirm action. */
export const footerClasses = "flex w-full justify-end border-t border-border-default bg-surface-default p-4";

/** Empty state. */
export const emptyClasses =
  "flex flex-1 items-center justify-center p-6 text-center text-sm text-text-secondary";
/** ################################ /VARIANTS ############################# */
