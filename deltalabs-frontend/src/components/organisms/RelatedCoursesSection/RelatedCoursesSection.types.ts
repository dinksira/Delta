/**
 * RelatedCoursesSection.types
 * Prop types for the `RelatedCoursesSection` organism.
 *
 * @example
 * ```tsx
 * <RelatedCoursesSection courses={visible} searchValue={q} onSearchChange={setQ}
 *   onFilterClick={noop} onSortClick={noop} />
 * ```
 */

import type { RelatedCourse } from "@/components/molecules/RelatedCourseCard";

/** Public props for `RelatedCoursesSection`. */
export interface RelatedCoursesSectionProps {
  /** Already-filtered entries to render. Filtering belongs to the feature hook. */
  courses: readonly RelatedCourse[];
  /** Current value of the toolbar search input. */
  searchValue: string;
  /** Fired when the toolbar search input changes. */
  onSearchChange: (value: string) => void;
  /** Fired when the toolbar filter action is pressed. */
  onFilterClick: () => void;
  /** Fired when the toolbar sort action is pressed. */
  onSortClick: () => void;
  /** Whether a filter is currently applied. */
  isFilterActive?: boolean;
  /** Whether a sort is currently applied. */
  isSortActive?: boolean;
  /** Fired with the course id when a card CTA is pressed. */
  onEnroll?: (id: string) => void;
  /** Fired with the course id when a card share action is pressed. */
  onShare?: (id: string) => void;
  /** Section heading. Defaults to `"Related Course"`. */
  title?: string;
  /** Copy shown when `courses` is empty. */
  emptyMessage?: string;
  /** Extra classes merged onto the section root. */
  className?: string;
}
