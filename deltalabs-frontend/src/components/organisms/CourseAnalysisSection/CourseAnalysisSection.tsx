/**
 * CourseAnalysisSection
 * Organism: the "Course Analysis" dashboard row — enrollment, completion, and
 * rating/review cards in a responsive three-column grid.
 *
 * Period filter state is owned by the caller, so the same section can be driven
 * by different data sources without forking the layout.
 *
 * @example
 * ```tsx
 * <CourseAnalysisSection
 *   enrollment={{ value: "122", trend: "+0.25%", direction: "up", period }}
 *   onEnrollmentPeriodChange={setPeriod}
 *   completion={{ value: "98", trend: "+0.75%", direction: "up", period }}
 *   onCompletionPeriodChange={setPeriod}
 *   rating={{ score: 4.7, reviews: 578 }}
 *   periods={["Month", "Quarter", "Year"]}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, icon set, class-merging utility, and composed molecules. */
import React from "react";
import { CheckCircle2, Signal, Star } from "lucide-react";

import { MetricCard } from "@/components/molecules/MetricCard";
import { cn } from "@/lib/utils";
import type {
  CourseAnalysisSectionProps,
  RatingMetric,
} from "./CourseAnalysisSection.types";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Section heading, ~20px as specified. */
const headingClasses = "text-xl font-bold text-primary-900";

/** Enrollment card: amber signal icon, period filter. */
const EnrollmentCard: React.FC<
  Readonly<Pick<CourseAnalysisSectionProps, "enrollment" | "onEnrollmentPeriodChange" | "periods">>
> = ({ enrollment, onEnrollmentPeriodChange, periods }) => (
  <MetricCard
    ariaLabel="Enrollment"
    icon={<Signal className="size-6" />}
    iconTone="warning"
    badge={{ kind: "trend", value: enrollment.trend, direction: enrollment.direction }}
    value={enrollment.value}
    footer={{
      kind: "period",
      label: "Enrollment",
      period: enrollment.period,
      options: periods,
      onPeriodChange: onEnrollmentPeriodChange,
    }}
  />
);

/** Completion card: green check icon, period filter. */
const CompletionCard: React.FC<
  Readonly<Pick<CourseAnalysisSectionProps, "completion" | "onCompletionPeriodChange" | "periods">>
> = ({ completion, onCompletionPeriodChange, periods }) => (
  <MetricCard
    ariaLabel="Completion"
    icon={<CheckCircle2 className="size-6" />}
    iconTone="success"
    badge={{ kind: "trend", value: completion.trend, direction: completion.direction }}
    value={completion.value}
    footer={{
      kind: "period",
      label: "Completion",
      period: completion.period,
      options: periods,
      onPeriodChange: onCompletionPeriodChange,
    }}
  />
);

/** Rating card: teal star icon, score pill, star rating and review count. */
const RatingCard: React.FC<Readonly<{ rating: RatingMetric }>> = ({ rating }) => (
  <MetricCard
    ariaLabel="Rating and reviews"
    icon={<Star className="size-6" />}
    iconTone="primary"
    badge={{ kind: "score", value: rating.score.toFixed(1) }}
    value={rating.score.toFixed(1)}
    footer={{ kind: "rating", score: rating.score, reviews: rating.reviews }}
  />
);

/** Exposes the dashboard as one labelled region. */
export const CourseAnalysisSection: React.FC<Readonly<CourseAnalysisSectionProps>> = ({
  enrollment,
  onEnrollmentPeriodChange,
  completion,
  onCompletionPeriodChange,
  rating,
  periods,
  title = "Course Analysis",
  className,
}) => (
  <section aria-label={title} className={cn("flex flex-col", className)}>
    <h2 className={cn("mb-6", headingClasses)}>{title}</h2>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <EnrollmentCard
        enrollment={enrollment}
        onEnrollmentPeriodChange={onEnrollmentPeriodChange}
        periods={periods}
      />
      <CompletionCard
        completion={completion}
        onCompletionPeriodChange={onCompletionPeriodChange}
        periods={periods}
      />
      <RatingCard rating={rating} />
    </div>
  </section>
);

CourseAnalysisSection.displayName = "CourseAnalysisSection";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default CourseAnalysisSection;
/** ################################ /EXPORTS ############################# */
