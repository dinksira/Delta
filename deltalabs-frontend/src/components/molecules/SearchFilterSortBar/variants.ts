/**
 * SearchFilterSortBar.variants
 * Shared Tailwind class maps for the `SearchFilterSortBar` molecule.
 *
 * @example
 * ```tsx
 * <div className={sizeClasses[size]} />
 * ```
 */

import type { SearchFilterSortBarSize } from "./SearchFilterSortBar.types";

/** Bar height per density step. */
export const sizeClasses: Readonly<Record<SearchFilterSortBarSize, string>> = {
  sm: "h-10",
  md: "h-12",
};

/** Shared classes for the two trailing action buttons. */
export const actionBaseClasses =
  "flex h-full w-10 flex-shrink-0 cursor-pointer items-center justify-center transition-colors duration-150";

/** Action button classes keyed by pressed state. */
export const actionStateClasses = {
  active: "text-primary-700",
  idle: "text-text-secondary hover:text-primary-700",
} as const;
