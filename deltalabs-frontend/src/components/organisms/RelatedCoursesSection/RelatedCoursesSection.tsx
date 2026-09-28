/**
 * RelatedCoursesSection
 * Organism: a "related course" rail composed of a section heading, a centred
 * search/filter/sort control bar, and a responsive grid of `RelatedCourseCard`.
 *
 * @example
 * ```tsx
 * <RelatedCoursesSection
 *   courses={visibleCourses}
 *   searchValue={query}
 *   onSearchChange={setQuery}
 *   onFilterClick={cycleSubject}
 *   onSortClick={cycleSort}
 *   isFilterActive={subject !== "all"}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, class-merging utility, and the two library molecules this organism composes. */
import React from "react";

import { cn } from "@/lib/utils";
import { SearchFilterSortBar } from "@/components/molecules/SearchFilterSortBar";
import { RelatedCourseCard } from "@/components/molecules/RelatedCourseCard";
import type { RelatedCoursesSectionProps } from "./RelatedCoursesSection.types";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/**
 * Owns only the section's presentation and layout. All list state — query,
 * active filter, sort key — stays in the calling feature hook, so the same
 * organism serves any course rail.
 */
export const RelatedCoursesSection: React.FC<Readonly<RelatedCoursesSectionProps>> = ({
  courses,
  searchValue,
  onSearchChange,
  onFilterClick,
  onSortClick,
  isFilterActive = false,
  isSortActive = false,
  onEnroll,
  onShare,
  title = "Related Course",
  emptyMessage = "No related courses match your search.",
  className,
}) => {
  return (
    <section className={cn("w-full", className)} aria-label={title}>
      <h2 className="text-2xl font-bold tracking-tight text-primary-900">{title}</h2>

      <div className="mt-6">
        <SearchFilterSortBar
          value={searchValue}
          onChange={onSearchChange}
          onFilterClick={onFilterClick}
          onSortClick={onSortClick}
          isFilterActive={isFilterActive}
          isSortActive={isSortActive}
          placeholder="Search"
        />
      </div>

      {courses.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {courses.map((course) => (
            <RelatedCourseCard
              key={course.id}
              course={course}
              onEnroll={onEnroll}
              onShare={onShare}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-border-default bg-surface-muted px-6 py-10 text-center text-sm text-text-secondary">
          {emptyMessage}
        </p>
      )}
    </section>
  );
};

RelatedCoursesSection.displayName = "RelatedCoursesSection";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default RelatedCoursesSection;
/** ################################ /EXPORTS ############################# */
