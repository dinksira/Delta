/**
 * MetricCard
 * Molecule: one course-analysis metric. A 48px icon badge and a top-right
 * indicator (trend delta or rating score) sit above a large headline figure,
 * with a bottom row holding either a period filter or a star rating summary.
 *
 * @example
 * ```tsx
 * <MetricCard
 *   ariaLabel="Enrollment"
 *   icon={<Signal aria-hidden className="size-6" />}
 *   iconTone="warning"
 *   badge={{ kind: "trend", value: "+0.25%", direction: "up" }}
 *   value="122"
 *   footer={{ kind: "period", label: "Enrollment", period, options, onPeriodChange }}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, star display, period selector, class-merging utility, types. */
import React from "react";

import { Rating } from "@/components/atoms/Rating";
import { PeriodSelector } from "@/components/molecules/PeriodSelector";
import { cn } from "@/lib/utils";
import type {
  MetricCardBadge,
  MetricCardFooter,
  MetricCardProps,
} from "./MetricCard.types";
import {
  badgeClasses,
  cardClasses,
  iconBadgeClasses,
  iconToneClasses,
  scoreBadgeClasses,
  trendBadgeClasses,
  trendIconMap,
  valueClasses,
} from "./variants";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Rising or falling delta, with the direction stated in text as well as icon. */
const TrendBadge: React.FC<Readonly<Extract<MetricCardBadge, { kind: "trend" }>>> = ({
  value,
  direction,
}) => {
  const Arrow = trendIconMap[direction];

  return (
    <span className={cn(badgeClasses, trendBadgeClasses)}>
      <Arrow className="size-3.5" aria-hidden="true" />
      {value}
      <span className="sr-only">{direction === "up" ? " increase" : " decrease"}</span>
    </span>
  );
};

/** Solid teal pill holding the average score. */
const ScoreBadge: React.FC<Readonly<Extract<MetricCardBadge, { kind: "score" }>>> = ({
  value,
}) => <span className={cn(badgeClasses, scoreBadgeClasses)}>{value}</span>;

/** Label plus inline period dropdown. */
const PeriodFooter: React.FC<Readonly<Extract<MetricCardFooter, { kind: "period" }>>> = ({
  label,
  period,
  options,
  onPeriodChange,
}) => (
  <p className="mt-2 flex items-baseline gap-1 text-sm text-text-primary">
    <span>{label} /</span>
    <PeriodSelector
      value={period}
      options={options}
      onChange={onPeriodChange}
      ariaLabel={`${label} period`}
    />
  </p>
);

/** Star rating plus review count. */
const RatingFooter: React.FC<Readonly<Extract<MetricCardFooter, { kind: "rating" }>>> = ({
  score,
  reviews,
}) => (
  <div className="mt-2 flex items-center justify-between gap-2">
    <Rating value={score} size="sm" />
    <span className="text-sm text-text-secondary">[{reviews} Reviews]</span>
  </div>
);

/** Exposes the card as an article labelled by its metric name. */
export const MetricCard: React.FC<Readonly<MetricCardProps>> = ({
  icon,
  iconTone,
  badge,
  value,
  footer,
  ariaLabel,
  className,
}) => (
  <article aria-label={ariaLabel} className={cn(cardClasses, className)}>
    <div className="flex items-start justify-between">
      <span className={cn(iconBadgeClasses, iconToneClasses[iconTone])} aria-hidden="true">
        {icon}
      </span>

      {badge.kind === "trend" ? <TrendBadge {...badge} /> : <ScoreBadge {...badge} />}
    </div>

    <p className={cn("mt-4", valueClasses)}>{value}</p>

    {footer.kind === "period" ? <PeriodFooter {...footer} /> : <RatingFooter {...footer} />}
  </article>
);

MetricCard.displayName = "MetricCard";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default MetricCard;
/** ################################ /EXPORTS ############################# */
