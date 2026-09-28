/**
 * RatingBreakdown
 * Molecule: a five-row star distribution stack. Each row is a star-level label,
 * a rounded track with a `primary-600` fill, and the share rendered as a
 * percentage on the right.
 *
 * @example
 * ```tsx
 * <RatingBreakdown
 *   entries={[
 *     { stars: 5, percent: 82 },
 *     { stars: 4, percent: 15 },
 *     { stars: 3, percent: 2 },
 *     { stars: 2, percent: 0.4 },
 *     { stars: 1, percent: 0.6 },
 *   ]}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, icon set, class-merging utility, and prop types. */
import React from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RatingBreakdownProps } from "./RatingBreakdown.types";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Track geometry, shared by every row. */
const trackClasses = "h-2 w-full overflow-hidden rounded-full bg-border-default";

/**
 * The fill width is set inline because it is data-driven — the value is a
 * per-review percentage, not a design token, so it cannot be a class map.
 */
const fillClasses = "h-full rounded-full bg-primary-600";

/** Renders one star-level row. */
const BreakdownRow: React.FC<Readonly<{ stars: number; percent: number }>> = ({
  stars,
  percent,
}) => (
  <li className="flex items-center gap-3">
    <span className="flex w-14 flex-shrink-0 items-center gap-1 text-xs text-text-secondary">
      {stars}
      <Star className="h-3 w-3 fill-primary-600 text-primary-600" aria-hidden="true" />
    </span>

    <span className={trackClasses}>
      <span className={fillClasses} style={{ width: `${percent}%` }} />
    </span>

    <span className="w-10 flex-shrink-0 text-right text-xs tabular-nums text-text-secondary">
      {percent}%
    </span>
  </li>
);

/**
 * Exposes each row's share as text via the list semantics, so the bars are a
 * visual restatement of data that is already readable.
 */
export const RatingBreakdown: React.FC<Readonly<RatingBreakdownProps>> = ({
  entries,
  ariaLabel = "Rating distribution",
  className,
}) => (
  <ul className={cn("flex flex-col gap-2", className)} aria-label={ariaLabel}>
    {entries.map((entry) => (
      <BreakdownRow key={entry.stars} stars={entry.stars} percent={entry.percent} />
    ))}
  </ul>
);

RatingBreakdown.displayName = "RatingBreakdown";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default RatingBreakdown;
/** ################################ /EXPORTS ############################# */
