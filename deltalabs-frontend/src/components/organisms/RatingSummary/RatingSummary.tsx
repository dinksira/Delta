/**
 * RatingSummary
 * Organism: the "Reviews" header block. Shows the mean score as large teal
 * numerals beside a star row, the total rating count, a "Rate" text action, and
 * the five-row star distribution underneath.
 *
 * @example
 * ```tsx
 * <RatingSummary
 *   average={4.8}
 *   totalRatings={1631}
 *   breakdown={[
 *     { stars: 5, percent: 82 },
 *     { stars: 4, percent: 15 },
 *     { stars: 3, percent: 2 },
 *     { stars: 2, percent: 0.4 },
 *     { stars: 1, percent: 0.6 },
 *   ]}
 *   onRate={openRatingModal}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, class-merging utility, and composed molecules/atoms. */
import React from "react";

import { Rating } from "@/components/atoms/Rating";
import { RatingBreakdown } from "@/components/molecules/RatingBreakdown";
import { Button } from "@/components/theme";
import { cn } from "@/lib/utils";
import type { RatingSummaryProps } from "./RatingSummary.types";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Thousands separator for the rating count, e.g. 1631 → "1,631". */
const formatCount = (value: number): string => value.toLocaleString("en-US");

/** Title, mean score, stars, count, and the rate action. */
const ScoreBlock: React.FC<
  Readonly<Pick<RatingSummaryProps, "average" | "totalRatings" | "rateLabel" | "onRate">>
> = ({ average, totalRatings, rateLabel, onRate }) => (
  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
    <h2 className="w-full text-xl font-bold text-primary-900 sm:w-auto">Reviews</h2>

    <p className="text-4xl font-bold leading-none text-primary-600 tabular-nums sm:text-5xl">
      {average}
    </p>

    <div className="flex flex-col gap-1.5">
      <Rating value={average} size="lg" />
      <p className="text-xs text-text-secondary">{formatCount(totalRatings)} ratings</p>
    </div>

    {onRate && (
      <Button variant="link" onClick={onRate} className="ml-auto sm:ml-0">
        {rateLabel}
      </Button>
    )}
  </div>
);

/** Exposes the summary as a labelled region for assistive tech. */
export const RatingSummary: React.FC<Readonly<RatingSummaryProps>> = ({
  average,
  totalRatings,
  breakdown,
  rateLabel = "Rate",
  onRate,
  className,
}) => (
  <section
    aria-label="Rating summary"
    className={cn("flex flex-col gap-6 border-b border-border-subtle pb-6", className)}
  >
    <ScoreBlock
      average={average}
      totalRatings={totalRatings}
      rateLabel={rateLabel}
      onRate={onRate}
    />

    <RatingBreakdown entries={breakdown} />
  </section>
);

RatingSummary.displayName = "RatingSummary";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default RatingSummary;
/** ################################ /EXPORTS ############################# */
