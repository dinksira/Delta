/**
 * courseAnalysisData
 * Period-keyed enrollment/completion metrics and the course rating summary.
 *
 * In production these come from `GET /courses/{id}/analytics`; the shape below
 * is the contract that endpoint is expected to satisfy.
 */

import type { AnalysisPeriod } from "@/components/molecules/MetricCard";

/** Periods offered by the analysis filters. */
export const ANALYSIS_PERIODS: readonly AnalysisPeriod[] = ["Month", "Quarter", "Year"];

/** One period's figure for a trend metric. */
export interface PeriodMetric {
  /** Headline figure, pre-formatted for display. */
  value: string;
  /** Delta versus the previous period, e.g. `"+0.25%"`. */
  trend: string;
  /** Direction of the delta. */
  direction: "up" | "down";
}

/** Enrollment figures, keyed by period. */
export const COURSE_ENROLLMENT_BY_PERIOD: Readonly<Record<AnalysisPeriod, PeriodMetric>> = {
  Month: { value: "38", trend: "+0.25%", direction: "up" },
  Quarter: { value: "96", trend: "+1.40%", direction: "up" },
  Year: { value: "122", trend: "+4.80%", direction: "up" },
};

/** Completion figures, keyed by period. */
export const COURSE_COMPLETION_BY_PERIOD: Readonly<Record<AnalysisPeriod, PeriodMetric>> = {
  Month: { value: "31", trend: "+0.75%", direction: "up" },
  Quarter: { value: "84", trend: "+2.10%", direction: "up" },
  Year: { value: "104", trend: "+3.25%", direction: "up" },
};

/** Average score and total review count for the course. */
export const COURSE_RATING_SUMMARY = {
  score: 4.7,
  reviews: 578,
} as const;
