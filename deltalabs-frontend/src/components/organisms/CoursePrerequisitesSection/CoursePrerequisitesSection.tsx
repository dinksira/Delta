/**
 * CoursePrerequisitesSection
 * Organism: the course detail "Prerequisites" list stacked above a
 * three-column "Requirements" card grid, plus an empty state for the grid.
 *
 * @example
 * ```tsx
 * <CoursePrerequisitesSection
 *   prerequisites={COURSE_PREREQUISITES}
 *   requirements={COURSE_REQUIREMENTS}
 *   onFindResource={handleFindResource}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, icon set, class-merging utility, and composed molecules. */
import React from "react";
import { PackageOpen } from "lucide-react";

import { RequirementCard } from "@/components/molecules/RequirementCard";
import { cn } from "@/lib/utils";
import type { CoursePrerequisitesSectionProps } from "./CoursePrerequisitesSection.types";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Section heading, ~24px as specified. */
const headingClasses = "text-2xl font-semibold text-primary-900";

/** 12px row gap between prerequisites. */
const listClasses = "flex list-disc flex-col gap-3 pl-5 text-base text-text-secondary";

/** A single prerequisite sentence. */
const PrerequisiteList: React.FC<Readonly<{ items: readonly string[]; title: string }>> = ({
  items,
  title,
}) => (
  <div>
    <h2 className={cn("mb-4", headingClasses)}>{title}</h2>
    <ul className={listClasses}>
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  </div>
);

/** Shown when a course declares no requirements. */
const EmptyRequirements: React.FC = () => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-border-subtle bg-surface-muted py-12 text-center">
    <PackageOpen className="size-6 text-text-tertiary" aria-hidden="true" />
    <p className="text-sm text-text-secondary">No requirements listed.</p>
    <p className="text-xs text-text-tertiary">This course needs no extra materials or hardware.</p>
  </div>
);

/** The requirements grid, or its empty state. */
const RequirementGrid: React.FC<
  Readonly<Pick<CoursePrerequisitesSectionProps, "requirements" | "onFindResource" | "ctaLabel">>
> = ({ requirements, onFindResource, ctaLabel }) => {
  if (requirements.length === 0) {
    return <EmptyRequirements />;
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {requirements.map((requirement) => (
        <RequirementCard
          key={requirement.id}
          requirement={requirement}
          onFindResource={onFindResource}
          ctaLabel={ctaLabel}
        />
      ))}
    </div>
  );
};

/** Exposes both blocks as one labelled region. */
export const CoursePrerequisitesSection: React.FC<Readonly<CoursePrerequisitesSectionProps>> = ({
  prerequisites,
  requirements,
  onFindResource,
  ctaLabel,
  prerequisitesTitle = "Prerequisites",
  requirementsTitle = "Requirements",
  className,
}) => (
  <section aria-label="Course prerequisites and requirements" className={cn("flex flex-col gap-10", className)}>
    <PrerequisiteList items={prerequisites} title={prerequisitesTitle} />

    <div>
      <h2 className={cn("mb-6", headingClasses)}>{requirementsTitle}</h2>
      <RequirementGrid
        requirements={requirements}
        onFindResource={onFindResource}
        ctaLabel={ctaLabel}
      />
    </div>
  </section>
);

CoursePrerequisitesSection.displayName = "CoursePrerequisitesSection";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default CoursePrerequisitesSection;
/** ################################ /EXPORTS ############################# */
