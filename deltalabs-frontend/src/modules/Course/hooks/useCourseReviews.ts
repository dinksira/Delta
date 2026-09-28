/**
 * useCourseReviews
 * Owns the course reviews feed: aggregate stats, progressive reveal, and
 * optimistic up/down voting. Kept out of the view so `CourseDetailView` only
 * renders markup.
 */

import { useCallback, useMemo, useState } from "react";

import type { Review, ReviewVote } from "@/components/molecules/ReviewItem";
import {
  COURSE_RATING_STATS,
  COURSE_REVIEWS,
  REVIEWS_PAGE_SIZE,
} from "@/modules/Course/data/courseReviewData";

/** Direction toggle accepted by {@link useCourseReviews.toggleVote}. */
type VoteDirection = Exclude<ReviewVote, null>;

export interface UseCourseReviewsResult {
  /** Aggregate rating stats for the summary header. */
  summary: typeof COURSE_RATING_STATS;
  /** The currently revealed slice of reviews. */
  reviews: Review[];
  /** True while unrevealed reviews remain. */
  hasMore: boolean;
  /** Reveals the next page of reviews. */
  showMore: () => void;
  /** Applies a vote toggle, re-click to clear. */
  toggleVote: (reviewId: string, direction: VoteDirection) => void;
}

/** Seeds the feed with the first page and tracks how many are visible. */
export function useCourseReviews(): UseCourseReviewsResult {
  const [reviews, setReviews] = useState<Review[]>(() => COURSE_REVIEWS.slice(0, REVIEWS_PAGE_SIZE));
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PAGE_SIZE);

  const hasMore = visibleCount < COURSE_REVIEWS.length;

  const showMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + REVIEWS_PAGE_SIZE, COURSE_REVIEWS.length));
  }, []);

  const visibleReviews = useMemo(() => reviews.slice(0, visibleCount), [reviews, visibleCount]);

  /**
   * Applies a vote delta to one review. Re-voting in the same direction clears
   * it, matching the toggle behaviour the button's `aria-pressed` advertises.
   */
  const toggleVote = useCallback((reviewId: string, direction: VoteDirection) => {
    setReviews((current) =>
      current.map((review) => {
        if (review.id !== reviewId) {
          return review;
        }

        const clearing = review.userVote === direction;
        const opposite = direction === "up" ? "down" : "up";

        const upvotes =
          direction === "up" ? review.upvotes + (clearing ? -1 : 1) : review.upvotes;
        const downvotes =
          direction === "down" ? review.downvotes + (clearing ? -1 : 1) : review.downvotes;

        return {
          ...review,
          upvotes: review.userVote === opposite ? upvotes + 1 : upvotes,
          downvotes: review.userVote === opposite ? downvotes + 1 : downvotes,
          userVote: clearing ? null : direction,
        };
      }),
    );
  }, []);

  return { summary: COURSE_RATING_STATS, reviews: visibleReviews, hasMore, showMore, toggleVote };
}

export default useCourseReviews;
