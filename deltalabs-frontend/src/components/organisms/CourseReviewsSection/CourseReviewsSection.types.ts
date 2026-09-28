/**
 * CourseReviewsSection.types
 * Prop types for the `CourseReviewsSection` organism.
 *
 * @example
 * ```tsx
 * <CourseReviewsSection summary={summary} reviews={visible} hasMore onShowMore={showMore} />
 * ```
 */

/** A review as consumed by the section; see the `ReviewItem` molecule. */
import type { Review, ReviewVote } from "@/components/molecules/ReviewItem";

/** The stats block rendered by the nested `RatingSummary`. */
export interface CourseReviewsSummary {
  /** Mean rating, 0–5. */
  average: number;
  /** Total rating count. */
  totalRatings: number;
  /** Per-star shares, highest first. */
  breakdown: readonly { stars: number; percent: number }[];
}

/** Public props for `CourseReviewsSection`. */
export interface CourseReviewsSectionProps {
  /** Mean score, total count, and per-star distribution. */
  summary: CourseReviewsSummary;
  /** Reviews to render, in display order. */
  reviews: readonly Review[];
  /** True while additional reviews remain unfetched. */
  hasMore?: boolean;
  /** Expands the feed. Omit to hide the control. */
  onShowMore?: () => void;
  /** Toggles a vote on a review. */
  onVote?: (reviewId: string, direction: Exclude<ReviewVote, null>) => void;
  /** Reports a review. Omit to hide report actions. */
  onReport?: (reviewId: string) => void;
  /** Extra classes merged onto the section root. */
  className?: string;
}
