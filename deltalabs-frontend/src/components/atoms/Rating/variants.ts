/**
 * Rating.variants
 * Shared Tailwind class maps for the `Rating` atom.
 *
 * @example
 * ```tsx
 * <Rating value={4.5} size="lg" />
 * ```
 */

/** Star glyph size per density step. */
export const starSizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-6 w-6",
} as const;

/** Numeric count typography per density step. */
export const countSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
} as const;
