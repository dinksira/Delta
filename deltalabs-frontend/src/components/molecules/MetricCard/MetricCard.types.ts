/**
 * MetricCard.types
 * Prop types for the `MetricCard` molecule.
 *
 * The header badge and the footer both come in two shapes, so they are modelled
 * as discriminated unions rather than a set of optional booleans. That keeps
 * the component's contract honest: a trend badge has no rating, and a rating
 * footer has no period selector.
 *
 * @example
 * ```tsx
 * <MetricCard
 *   icon={<Signal />}
 *   iconTone="warning"
 *   badge={{ kind: "trend", value: "+0.25%", direction: "up" }}
 *   value="122"
 *   footer={{ kind: "period", label: "Enrollment", period: "Year", onPeriodChange: setPeriod }}
 * />
 * ```
 */

import type { ReactNode } from "react";

/** Reporting periods offered by the analysis filters. */
export type AnalysisPeriod = "Month" | "Quarter" | "Year";

/** Top-right indicator: a trend delta or a rating score pill. */
export type MetricCardBadge =
  | { kind: "trend"; value: string; direction: "up" | "down" }
  | { kind: "score"; value: string };

/** Bottom row: either a period filter or a star rating summary. */
export type MetricCardFooter =
  | {
      kind: "period";
      /** Static label preceding the selector, e.g. `"Enrollment"`. */
      label: string;
      /** Current period. */
      period: AnalysisPeriod;
      /** Periods the user may choose from. */
      options: readonly AnalysisPeriod[];
      /** Called with the newly selected period. */
      onPeriodChange: (period: AnalysisPeriod) => void;
    }
  | { kind: "rating"; score: number; reviews: number };

/** Icon badge fill tones. */
export type MetricCardTone = "warning" | "success" | "primary";

/** Public props for `MetricCard`. */
export interface MetricCardProps {
  /** Glyph rendered inside the icon badge. */
  icon: ReactNode;
  /** Fill tone for the icon badge. */
  iconTone: MetricCardTone;
  /** Top-right indicator. */
  badge: MetricCardBadge;
  /** The large headline figure. */
  value: string | number;
  /** Bottom row content. */
  footer: MetricCardFooter;
  /** Accessible name for the card, e.g. `"Enrollment"`. */
  ariaLabel: string;
  /** Extra classes merged onto the card root. */
  className?: string;
}
