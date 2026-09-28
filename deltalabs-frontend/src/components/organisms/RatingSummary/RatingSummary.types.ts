/**
 * RatingSummary.types
 * Prop types for the `RatingSummary` organism.
 *
 * @example
 * ```tsx
 * <RatingSummary average={4.8} totalRatings={1631} breakdown={breakdown} onRate={openModal} />
 * ```
 */

/** One star level's share of all ratings. */
export interface RatingSummaryEntry {
  /** Star level (5 down to 1). */
  stars: number;
  /** Percentage of ratings at this level, 0–100. */
  percent: number;
}

/** Public props for `RatingSummary`. */
export interface RatingSummaryProps {
  /** Mean rating, 0–5. Floors to whole stars. */
  average: number;
  /** Total rating count, rendered beneath the star row. */
  totalRatings: number;
  /** Per-star shares, highest first. */
  breakdown: readonly RatingSummaryEntry[];
  /** Label for the rate action. Defaults to `"Rate"`. */
  rateLabel?: string;
  /** Opens the rating flow. Omit to hide the action. */
  onRate?: () => void;
  /** Extra classes merged onto the section root. */
  className?: string;
}
