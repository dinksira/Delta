/**
 * ReviewItem
 * Molecule: one user review, laid out as a metadata column (author, date, star
 * rating) beside a content column (body copy, then a right-aligned vote and
 * report toolbar).
 *
 * @example
 * ```tsx
 * <ReviewItem review={review} onVote={handleVote} onReport={handleReport} />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, icon set, class-merging utility, and prop types. */
import React from "react";
import { Flag, ThumbsDown, ThumbsUp } from "lucide-react";

import { Rating } from "@/components/atoms/Rating";
import { Button } from "@/components/theme";
import { cn } from "@/lib/utils";
import type { Review, ReviewItemProps, ReviewVote } from "./ReviewItem.types";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Shared chrome for the two vote buttons. */
const voteButtonClasses = "text-xs font-medium text-text-secondary hover:text-primary-600";

/** Current-vote affordance applied to whichever direction is active. */
const activeVoteClasses = "text-primary-600";

/**
 * Resolves the button classes for a vote direction, highlighting it only when
 * it matches the user's current vote.
 */
function getVoteClasses(direction: Exclude<ReviewVote, null>, current: ReviewVote): string {
  return cn(voteButtonClasses, direction === current && activeVoteClasses);
}

/** Author, date, and the reviewer's star rating. */
const ReviewMeta: React.FC<Readonly<{ review: Review }>> = ({ review }) => (
  <div className="flex w-full flex-col gap-1 sm:w-40 sm:flex-shrink-0">
    <p className="text-sm font-semibold text-text-primary sm:text-base">{review.author}</p>
    <p className="text-xs text-text-secondary">{review.date}</p>
    <Rating value={review.rating} className="mt-0.5" />
  </div>
);

/** Upvote, downvote, and report controls. */
const ReviewActions: React.FC<
  Readonly<{ review: Review; onVote?: ReviewItemProps["onVote"]; onReport?: ReviewItemProps["onReport"] }>
> = ({ review, onVote, onReport }) => (
  <div className="mt-3 flex items-center justify-end gap-4">
    <Button
      variant="ghost"
      size="sm"
      className={getVoteClasses("up", review.userVote)}
      aria-pressed={review.userVote === "up"}
      aria-label={`Upvote ${review.author}'s review`}
      onClick={() => onVote?.(review.id, "up")}
    >
      <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
      {review.upvotes}
    </Button>

    <Button
      variant="ghost"
      size="sm"
      className={getVoteClasses("down", review.userVote)}
      aria-pressed={review.userVote === "down"}
      aria-label={`Downvote ${review.author}'s review`}
      onClick={() => onVote?.(review.id, "down")}
    >
      <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
      {review.downvotes}
    </Button>

    {onReport && (
      <Button
        variant="link"
        size="sm"
        className="text-xs underline"
        onClick={() => onReport(review.id)}
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        Report
      </Button>
    )}
  </div>
);

/** Exposes the review as a list item with author and body text labelled. */
export const ReviewItem: React.FC<Readonly<ReviewItemProps>> = ({
  review,
  onVote,
  onReport,
  className,
}) => (
  <li className={cn("flex flex-col gap-3 py-6 sm:flex-row sm:gap-6", className)}>
    <ReviewMeta review={review} />

    <div className="min-w-0 flex-1">
      <p className="text-sm leading-relaxed text-text-primary">{review.content}</p>
      <ReviewActions review={review} onVote={onVote} onReport={onReport} />
    </div>
  </li>
);

ReviewItem.displayName = "ReviewItem";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default ReviewItem;
/** ################################ /EXPORTS ############################# */
