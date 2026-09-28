/**
 * RelatedCourseCard
 * Molecule: a horizontal-split course card pairing a fixed-width cover image
 * with a content column holding the title · institution header, a share action,
 * a rating row with a relationship badge, and a primary enrol CTA.
 *
 * @example
 * ```tsx
 * <RelatedCourseCard
 *   course={{ id: "chem-1", title: "Chemistry", institution: "Haramaya University",
 *             thumbnailUrl: "/laboratory_glass.png", rating: 4, ratingCount: 128,
 *             status: "complement" }}
 *   onEnroll={(id) => router.push(`/features/course/enrolled/${id}`)}
 *   onShare={shareCourse}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, icon set, class-merging utility, and shared design-system primitives. */
import React from "react";
import { Share2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/theme";
import { Rating } from "@/components/atoms/Rating";
import { statusClasses, statusLabel } from "./variants";
import type { RelatedCourseCardProps } from "./RelatedCourseCard.types";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/**
 * Renders one related-course entry. The card is an `<article>` rather than a
 * click surface, so the share control and the CTA stay independently
 * focusable instead of competing with a parent click handler.
 */
export const RelatedCourseCard: React.FC<Readonly<RelatedCourseCardProps>> = ({
  course,
  onEnroll,
  onShare,
  enrollLabel = "Enroll",
  className,
}) => {
  const { id, title, institution, thumbnailUrl, rating, ratingCount, status } = course;

  return (
    <article
      className={cn(
        "flex min-h-40 flex-row overflow-hidden rounded-2xl bg-surface-muted",
        "border border-border-default transition-all duration-200 hover:shadow-md",
        className,
      )}
    >
      <img
        src={thumbnailUrl}
        alt={title}
        className="h-full w-2/5 flex-shrink-0 object-cover"
        loading="lazy"
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-2">
            <h3 className="truncate text-sm font-bold text-primary-900">{title}</h3>
            <span className="h-3 w-px flex-shrink-0 bg-border-default" aria-hidden="true" />
            <span className="truncate text-xs text-text-secondary">{institution}</span>
          </div>

          <button
            type="button"
            onClick={() => onShare?.(id)}
            aria-label={`Share ${title}`}
            className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors duration-150 hover:bg-surface-canvas hover:text-primary-700"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Rate</span>
            <Rating value={rating} count={ratingCount} />
          </div>

          <span
            className={cn(
              "flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
              statusClasses[status],
            )}
          >
            {statusLabel[status]}
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="mt-auto w-full"
          onClick={() => onEnroll?.(id)}
        >
          {enrollLabel}
        </Button>
      </div>
    </article>
  );
};

RelatedCourseCard.displayName = "RelatedCourseCard";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default RelatedCourseCard;
/** ################################ /EXPORTS ############################# */
