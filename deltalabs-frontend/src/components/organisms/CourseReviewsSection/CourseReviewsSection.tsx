/**
 * CourseReviewsSection
 * Organism: the "TOP REVIEWS" feed. Stacks the `RatingSummary` header above a
 * divided list of `ReviewItem` rows, with a "Show more" text action beneath.
 *
 * @example
 * ```tsx
 * <CourseReviewsSection
 *   summary={{ average: 4.8, totalRatings: 1631, breakdown }}
 *   reviews={visibleReviews}
 *   hasMore
 *   onShowMore={showMore}
 *   onVote={handleVote}
 *   onReport={handleReport}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, icon set, class-merging utility, and composed molecules/organisms. */
import React from "react";
import { MessageSquare } from "lucide-react";

import { ReviewItem } from "@/components/molecules/ReviewItem";
import { Button } from "@/components/theme";
import { cn } from "@/lib/utils";
import { RatingSummary } from "@/components/organisms/RatingSummary";
import type { CourseReviewsSectionProps } from "./CourseReviewsSection.types";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Shown when the feed has no reviews to display. */
const EmptyReviews: React.FC = () => (
  <div className="flex flex-col items-center gap-2 py-12 text-center">
    <MessageSquare className="h-6 w-6 text-text-tertiary" aria-hidden="true" />
    <p className="text-sm text-text-secondary">No reviews yet.</p>
    <p className="text-xs text-text-tertiary">Be the first to share your experience.</p>
  </div>
);

/** The feed body: either the empty state or the divided list plus show-more. */
type ReviewFeedProps = Omit<CourseReviewsSectionProps, "summary">;

const ReviewFeed: React.FC<Readonly<ReviewFeedProps>> = ({
  reviews,
  hasMore = false,
  onShowMore,
  onVote,
  onReport,
}) => {
  if (reviews.length === 0) {
    return <EmptyReviews />;
  }

  return (
    <>
      <ul className="divide-y divide-border-subtle">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} onVote={onVote} onReport={onReport} />
        ))}
      </ul>

      {hasMore && onShowMore && (
        <div className="mt-2">
          <Button variant="link" onClick={onShowMore} className="font-bold">
            Show more
          </Button>
        </div>
      )}
    </>
  );
};

/** Exposes the feed as a labelled region. */
export const CourseReviewsSection: React.FC<Readonly<CourseReviewsSectionProps>> = ({
  summary,
  className,
  ...feedProps
}) => (
  <section aria-label="Course reviews" className={cn("flex flex-col", className)}>
    <RatingSummary
      average={summary.average}
      totalRatings={summary.totalRatings}
      breakdown={summary.breakdown}
    />

    <h3 className="mt-6 text-sm font-bold tracking-wide text-primary-600 uppercase">
      Top Reviews
    </h3>

    <ReviewFeed {...feedProps} />
  </section>
);

CourseReviewsSection.displayName = "CourseReviewsSection";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default CourseReviewsSection;
/** ################################ /EXPORTS ############################# */
