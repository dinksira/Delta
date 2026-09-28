/**
 * RelatedCourseCard.types
 * Prop and data types for the `RelatedCourseCard` molecule.
 *
 * @example
 * ```tsx
 * <RelatedCourseCard course={{ id: "chem-1", title: "Chemistry", ... }} onEnroll={enroll} />
 * ```
 */

/** Course relationship badge shown on the rating row. */
export type RelatedCourseStatus = "supplement" | "complement";

/** Shape of a single related-course entry rendered by the card. */
export interface RelatedCourse {
  /** Stable identifier, passed back through the action callbacks. */
  id: string;
  /** Course title. */
  title: string;
  /** Institution offering the course. */
  institution: string;
  /** Course thumbnail URL. */
  thumbnailUrl: string;
  /** Star rating on a 0–5 scale. Fractional values floor to whole stars. */
  rating: number;
  /** Optional reviewer count rendered in parentheses after the stars. */
  ratingCount?: number;
  /** Whether the course supplements or complements the current one. */
  status: RelatedCourseStatus;
}

/** Public props for `RelatedCourseCard`. */
export interface RelatedCourseCardProps {
  /** Entry to display. */
  course: RelatedCourse;
  /** Fired with the course id when the primary CTA is pressed. */
  onEnroll?: (id: string) => void;
  /** Fired with the course id when the share action is pressed. */
  onShare?: (id: string) => void;
  /** Label for the primary CTA. Defaults to `"Enroll"`. */
  enrollLabel?: string;
  /** Extra classes merged onto the card root. */
  className?: string;
}
