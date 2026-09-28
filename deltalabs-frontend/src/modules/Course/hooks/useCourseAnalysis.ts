/**
 * useCourseAnalysis
 * Owns the course analysis dashboard's filter state: the reporting period for
 * the enrollment and completion cards. Kept out of the view so
 * `CourseDetailView` only renders markup.
 */

import { useCallback, useState } from "react";

import type { AnalysisPeriod } from "@/components/molecules/MetricCard";
import {
  ANALYSIS_PERIODS,
  COURSE_COMPLETION_BY_PERIOD,
  COURSE_ENROLLMENT_BY_PERIOD,
  COURSE_RATING_SUMMARY,
} from "@/modules/Course/data/courseAnalysisData";
import type {
  RatingMetric,
  TrendMetric,
} from "@/components/organisms/CourseAnalysisSection";

/** Period selector state, seeded on "Year" to match the design spec. */
const DEFAULT_PERIOD: AnalysisPeriod = "Year";

export interface UseCourseAnalysisResult {
  /** Periods offered by both filters. */
  periods: readonly AnalysisPeriod[];
  /** Enrollment metric for the selected period. */
  enrollment: TrendMetric;
  /** Completion metric for the selected period. */
  completion: TrendMetric;
  /** Rating summary, which has no period filter. */
  rating: RatingMetric;
  /** Selects the enrollment reporting period. */
  setEnrollmentPeriod: (period: AnalysisPeriod) => void;
  /** Selects the completion reporting period. */
  setCompletionPeriod: (period: AnalysisPeriod) => void;
}

/** Resolves a period-keyed table into the metric shape the section expects. */
function toTrendMetric(
  table: Readonly<Record<AnalysisPeriod, { value: string; trend: string; direction: "up" | "down" }>>,
  period: AnalysisPeriod,
): TrendMetric {
  return { ...table[period], period };
}

/** Seeds both filters on the default period and exposes their setters. */
export function useCourseAnalysis(): UseCourseAnalysisResult {
  const [enrollmentPeriod, setEnrollmentPeriod] = useState<AnalysisPeriod>(DEFAULT_PERIOD);
  const [completionPeriod, setCompletionPeriod] = useState<AnalysisPeriod>(DEFAULT_PERIOD);

  const setEnrollment = useCallback((period: AnalysisPeriod) => setEnrollmentPeriod(period), []);
  const setCompletion = useCallback((period: AnalysisPeriod) => setCompletionPeriod(period), []);

  return {
    periods: ANALYSIS_PERIODS,
    enrollment: toTrendMetric(COURSE_ENROLLMENT_BY_PERIOD, enrollmentPeriod),
    completion: toTrendMetric(COURSE_COMPLETION_BY_PERIOD, completionPeriod),
    rating: COURSE_RATING_SUMMARY,
    setEnrollmentPeriod: setEnrollment,
    setCompletionPeriod: setCompletion,
  };
}

export default useCourseAnalysis;
