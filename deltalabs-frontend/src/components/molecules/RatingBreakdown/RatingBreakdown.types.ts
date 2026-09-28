/**
 * RatingBreakdown.types
 * Prop types for the `RatingBreakdown` molecule.
 *
 * @example
 * ```tsx
 * <RatingBreakdown entries={[{ stars: 5, percent: 82 }, { stars: 4, percent: 15 }]} />
 * ```
 */

/** Share of reviews holding a given star level. */
export interface RatingBreakdownEntry {
  /** Star level this row describes (5 down to 1). */
  stars: number;
  /** Percentage of reviews at this level, 0–100. */
  percent: number;
}

/** Public props for `RatingBreakdown`. */
export interface RatingBreakdownProps {
  /** Star-level shares, highest first. */
  entries: readonly RatingBreakdownEntry[];
  /** Accessible label for the distribution list. */
  ariaLabel?: string;
  /** Extra classes merged onto the list root. */
  className?: string;
}
