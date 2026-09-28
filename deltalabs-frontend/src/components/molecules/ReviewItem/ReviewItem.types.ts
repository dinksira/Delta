/**
 * ReviewItem.types
 * Prop types for the `ReviewItem` molecule.
 *
 * @example
 * ```tsx
 * <ReviewItem
 *   review={{ id: "r1", author: "Kristy Allen", date: "Feb 24, 2023", rating: 5, content: "…", upvotes: 1254, downvotes: 125, userVote: null }}
 *   onVote={() => {}}
 *   onReport={() => {}}
 * />
 * ```
 */

/** Which way the current user has voted on a review, if at all. */
export type ReviewVote = "up" | "down" | null;

/** A single user-submitted course review. */
export interface Review {
  /** Stable unique identifier. */
  id: string;
  /** Reviewer display name. */
  author: string;
  /** Pre-formatted publication date, e.g. `"Feb 24, 2023"`. */
  date: string;
  /** Star rating on a 0–5 scale. */
  rating: number;
  /** Review body copy. */
  content: string;
  /** Upvote tally. */
  upvotes: number;
  /** Downvote tally. */
  downvotes: number;
  /** The current user's vote direction. */
  userVote: ReviewVote;
}

/** Public props for `ReviewItem`. */
export interface ReviewItemProps {
  /** The review to render. */
  review: Review;
  /** Toggles a vote. Re-click the active direction to clear it. */
  onVote?: (reviewId: string, direction: Exclude<ReviewVote, null>) => void;
  /** Reports the review. Omit to hide the report action. */
  onReport?: (reviewId: string) => void;
  /** Extra classes merged onto the list item. */
  className?: string;
}
