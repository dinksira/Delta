/**
 * CourseAnalysisSection.types
 * Prop types for the `CourseAnalysisSection` organism.
 *
 * @example
 * ```tsx
 * <CourseAnalysisSection
 *   enrollment={{ value: "122", trend: "+0.25%", period }}
 *   onEnrollmentPeriodChange={setEnrollmentPeriod}
 *   completion={{ value: "122", trend: "+0.75%", period: completionPeriod }}
 *   onCompletionPeriodChange={setCompletionPeriod}
 *   rating={{ score: 4.7, reviews: 578 }}
 *   periods={ANALYSIS_PERIODS}
 * />
 * ```
 */

import type { AnalysisPeriod } from "@/components/molecules/MetricCard";

/** A period-filtered trend metric (enrollment or completion). */
export interface TrendMetric {
  /** Headline figure for the selected period. */
  value: string;
  /** Delta versus the previous period, e.g. `"+0.25%"`. */
  trend: string;
  /** Direction of the delta, driving the arrow glyph and screen-reader text. */
  direction: "up" | "down";
  /** Currently selected period. */
  period: AnalysisPeriod;
}

/** The rating metric, which has no period filter. */
export interface RatingMetric {
  /** Mean score, 0–5. */
  score: number;
  /** Total review count. */
  reviews: number;
}

/** Public props for `CourseAnalysisSection`. */
export interface CourseAnalysisSectionProps {
  /** Enrollment figure and its period filter. */
  enrollment: TrendMetric;
  /** Called when the enrollment period changes. */
  onEnrollmentPeriodChange: (period: AnalysisPeriod) => void;
  /** Completion figure and its period filter. */
  completion: TrendMetric;
  /** Called when the completion period changes. */
  onCompletionPeriodChange: (period: AnalysisPeriod) => void;
  /** Average score and review count. */
  rating: RatingMetric;
  /** Periods offered by both filters. */
  periods: readonly AnalysisPeriod[];
  /** Section heading. Defaults to `"Course Analysis"`. */
  title?: string;
  /** Extra classes merged onto the section root. */
  className?: string;
}
