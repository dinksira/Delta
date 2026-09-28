/**
 * useRelatedCourses
 * Feature hook owning the "Related Course" rail's list state: free-text query,
 * subject filter, sort order, and the derived visible list. The view stays
 * presentational and receives the already-narrowed list.
 *
 * @example
 * ```tsx
 * const related = useRelatedCourses();
 * <RelatedCoursesSection
 *   courses={related.courses}
 *   searchValue={related.searchValue}
 *   onSearchChange={related.setSearchValue}
 *   onFilterClick={related.cycleFilter}
 *   onSortClick={related.cycleSort}
 *   isFilterActive={related.isFilterActive}
 *   isSortActive={related.isSortActive}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, shared types, and the module's placeholder source list. */
import { useCallback, useMemo, useState } from "react";

import type { RelatedCourse } from "@/components/molecules/RelatedCourseCard";
import {
  RELATED_COURSE_RECORDS,
  RELATED_COURSE_SORTS,
  RELATED_COURSE_SUBJECTS,
  type RelatedCourseSort,
  type RelatedCourseSubject,
} from "../data/relatedCourseData";
/** ################################ /IMPORT ############################# */

// ===== TYPES =====

/** Value returned by `useRelatedCourses`. */
export interface UseRelatedCoursesResult {
  /** Courses left after query, subject filter, and sort are applied. */
  courses: readonly RelatedCourse[];
  /** Current free-text query. */
  searchValue: string;
  /** Current subject filter. */
  subject: RelatedCourseSubject;
  /** Current sort order. */
  sort: RelatedCourseSort;
  /** Whether a non-`all` subject filter is applied. */
  isFilterActive: boolean;
  /** Whether a non-default sort order is applied. */
  isSortActive: boolean;
  /** Replaces the free-text query. */
  setSearchValue: (value: string) => void;
  /** Advances the subject filter to its next value. */
  cycleFilter: () => void;
  /** Advances the sort order to its next value. */
  cycleSort: () => void;
}

// ===== HELPERS =====

/** Strips the `subject` bookkeeping key before the list reaches the UI. */
const toCourse = (record: (typeof RELATED_COURSE_RECORDS)[number]): RelatedCourse => {
  const { subject, ...course } = record;
  void subject;
  return course;
};

/** Advances `value` to the next entry in `options`, wrapping at the end. */
const nextValue = <T,>(value: T, options: readonly T[]): T => {
  const index = options.indexOf(value);
  return options[(index + 1) % options.length];
};

// ===== HOOK =====

/**
 * Derives the visible list with `useMemo` so the grid only re-renders when the
 * query, subject, or sort actually changes.
 */
export function useRelatedCourses(): UseRelatedCoursesResult {
  const [searchValue, setSearchValue] = useState("");
  const [subject, setSubject] = useState<RelatedCourseSubject>("all");
  const [sort, setSort] = useState<RelatedCourseSort>("relevance");

  const cycleFilter = useCallback(() => {
    setSubject((current) => nextValue(current, RELATED_COURSE_SUBJECTS));
  }, []);

  const cycleSort = useCallback(() => {
    setSort((current) => nextValue(current, RELATED_COURSE_SORTS));
  }, []);

  const courses = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    const matched = RELATED_COURSE_RECORDS.filter(
      (record) =>
        (subject === "all" || record.subject === subject) &&
        (query === "" ||
          record.title.toLowerCase().includes(query) ||
          record.institution.toLowerCase().includes(query)),
    );

    const ordered =
      sort === "rating"
        ? [...matched].sort((a, b) => b.rating - a.rating)
        : sort === "title"
          ? [...matched].sort((a, b) => a.title.localeCompare(b.title))
          : matched;

    return ordered.map(toCourse);
  }, [searchValue, subject, sort]);

  return {
    courses,
    searchValue,
    subject,
    sort,
    isFilterActive: subject !== "all",
    isSortActive: sort !== "relevance",
    setSearchValue,
    cycleFilter,
    cycleSort,
  };
}

// ===== EXPORTS =====

export default useRelatedCourses;
