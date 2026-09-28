/** ################################ VARIANTS ############################# */
/** Class maps for the shared Modal. */

import { cx } from "@/components/theme/utils";

/** Fixed overlay that centres the panel. */
export const overlayClasses = "fixed inset-0 z-[200] flex items-center justify-center p-4";

/** Decorative capture layer behind the panel. */
export const backdropClasses = "absolute inset-0 bg-primary-600/25";

/** Panel surface. */
export const panelBaseClasses = "relative overflow-hidden bg-surface-default shadow-2xl outline-none";

/** Header row holding the centred heading and the close button. */
export const headerClasses = "flex items-center justify-between gap-4 px-12 py-6";

/** Heading wrapper that keeps the title optically centred. */
export const headerTitleClasses = "flex-1 text-center";

/** Dialog heading. */
export const titleClasses = "text-2xl font-bold text-primary-600";

/** Close button. */
export const closeButtonClasses =
  "rounded-lg p-1 text-primary-600/40 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

/**
 * Panel classes, including the caller's overrides.
 *
 * Tailwind resolves conflicts by stylesheet order, not by the order of classes
 * in the attribute, so a default is only emitted when the caller has not
 * supplied their own.
 */
export function panelClasses(className?: string): string {
  return cx(
    panelBaseClasses,
    !className?.includes("rounded") && "rounded-3xl",
    !className?.includes("max-w") && "w-full max-w-4xl",
    className,
  );
}

/** Body padding, omitted entirely when `noPadding` is set. */
export function bodyClasses(noPadding: boolean): string {
  return noPadding ? "p-0" : "px-12 pb-8";
}
/** ################################ /VARIANTS ############################# */
