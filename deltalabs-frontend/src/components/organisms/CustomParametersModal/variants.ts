/** ################################ VARIANTS ############################# */
/** Class maps for CustomParametersModal. */

/** Content area inside the dialog. */
export const contentClasses = "flex flex-col gap-6 bg-surface-default p-8";

/** Heading block plus the row add/remove controls. */
export const headerClasses = "flex items-start justify-between gap-4";

/** Overline above the title. */
export const eyebrowClasses = "text-xs font-bold uppercase tracking-wider text-primary-600";

/** Dialog title. */
export const titleClasses = "text-lg font-bold text-text-primary";

/** Supporting copy under the title. */
export const subtitleClasses = "mt-1 text-xs text-text-secondary";

/** Divider under the heading block. */
export const dividerClasses = "h-px w-full bg-primary-600/20";

/** Add/remove button pair. */
export const controlsClasses = "flex items-center gap-3 text-primary-600/60";

/**
 * Close button in the heading.
 *
 * The dialog renders with `showHeader={false}`, so `Modal` draws no close
 * control of its own. Without this the only exits were Escape and the backdrop,
 * and the submit button is disabled whenever the rows are empty or invalid.
 */
export const closeButtonClasses =
  "rounded-md p-1 text-text-tertiary transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

/** Vertical rule between the two icon buttons. */
export const controlsDividerClasses = "h-4 w-px bg-border-default";

/** Icon button, sized for the add control. */
export const controlButtonClasses =
  "rounded-md p-1 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

/** Icon button, sized for the remove control. */
export const removeControlButtonClasses =
  "rounded-md p-1 text-error-500 transition-colors hover:text-error-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-300 disabled:cursor-not-allowed disabled:opacity-40";

/** Scrollable list of parameter rows. */
export const listClasses = "flex max-h-96 flex-col gap-6 overflow-y-auto pr-2";

/** One parameter row: two labelled inputs. */
export const rowClasses =
  "relative rounded-xl border border-border-muted bg-surface-default p-6 shadow-sm";

/** Two-column input layout inside a row. */
export const rowFieldsClasses = "grid grid-cols-1 gap-8 md:grid-cols-2";

/** Per-row removal button, top-right of the row. */
export const rowRemoveClasses =
  "absolute right-4 top-4 rounded-md p-1 text-text-tertiary transition-colors hover:text-error-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-300 disabled:cursor-not-allowed disabled:opacity-40";

/** Empty-state message shown once every row has been removed. */
export const emptyClasses =
  "rounded-xl border border-dashed border-border-default p-6 text-center text-sm text-text-secondary";

/** Footer holding the submit button. */
export const footerClasses = "flex flex-col items-center pt-4";

/** Inline error text under a row. */
export const rowErrorClasses = "mt-1.5 text-xs text-error-500";
/** ################################ /VARIANTS ############################# */
