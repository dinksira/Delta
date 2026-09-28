/**
 * PeriodSelector.types
 * Prop types for the `PeriodSelector` molecule.
 *
 * Generic over the value type so callers keep their own literal union (for
 * example `AnalysisPeriod`) without widening to `string` or casting at the call
 * site.
 *
 * @example
 * ```tsx
 * <PeriodSelector
 *   value={period}
 *   onChange={setPeriod}
 *   options={["Month", "Quarter", "Year"]}
 *   ariaLabel="Enrollment period"
 * />
 * ```
 */

/** Public props for `PeriodSelector`. */
export interface PeriodSelectorProps<T extends string = string> {
  /** Currently selected value. */
  value: T;
  /** Values the user may pick from, in display order. */
  options: readonly T[];
  /** Called with the newly selected value. */
  onChange: (value: T) => void;
  /** Accessible name for the listbox, e.g. `"Enrollment period"`. */
  ariaLabel: string;
  /** Extra classes merged onto the trigger. */
  className?: string;
}
