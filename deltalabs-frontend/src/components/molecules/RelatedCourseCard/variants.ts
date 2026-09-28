/**
 * RelatedCourseCard.variants
 * Shared Tailwind class maps for the `RelatedCourseCard` molecule.
 *
 * @example
 * ```tsx
 * <span className={statusClasses[status]}>{statusLabel[status]}</span>
 * ```
 */

import type { RelatedCourseStatus } from "./RelatedCourseCard.types";

/** Tinted status chip classes keyed by course relationship. */
export const statusClasses: Readonly<Record<RelatedCourseStatus, string>> = {
  supplement: "bg-success-50 text-success-600",
  complement: "bg-warning-50 text-warning-600",
};

/** Human-readable status label keyed by course relationship. */
export const statusLabel: Readonly<Record<RelatedCourseStatus, string>> = {
  supplement: "Supplement",
  complement: "Complement",
};
