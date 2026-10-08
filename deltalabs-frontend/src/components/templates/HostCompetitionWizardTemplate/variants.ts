/**
 * HostCompetitionWizardTemplate.variants
 * Shared Tailwind class maps for the host-competition wizard shell.
 * Every value resolves to a design token — no arbitrary colours.
 */

/** Header text-action buttons (Integrate / Automate / Invite). */
export const headerActionClasses =
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200";

/** Header outline actions (Draft / Preview) reuse the secondary button look. */
export const headerOutlineButtonClasses = "h-auto gap-1.5 px-3 py-1.5 text-sm";

/** Hairline separator between header action groups. */
export const headerDividerClasses = "mx-1 h-5 w-px bg-border-default";

/** Title badge holding the Layers glyph beside the page title. */
export const titleBadgeClasses =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-primary-700 ring-1 ring-inset ring-border-default";

/** Content card wrapping each step body. */
export const contentCardClasses =
  "rounded-2xl border border-border-default bg-surface-default p-5 shadow-sm md:p-8";

/** Step section header (semi-bold 14/16 per the wizard spec). */
export const stepHeaderClasses = "text-sm font-semibold leading-4 text-text-primary";

/** Step counter shown right of the section header. */
export const stepCounterClasses = "text-xs text-text-secondary";

/** Footer chrome pinned under the scrolling content region. */
export const footerClasses =
  "shrink-0 border-t border-border-default bg-surface-default px-4 py-3 md:px-8";
