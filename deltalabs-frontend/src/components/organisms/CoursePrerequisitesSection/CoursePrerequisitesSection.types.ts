/**
 * CoursePrerequisitesSection.types
 * Prop types for the `CoursePrerequisitesSection` organism.
 *
 * @example
 * ```tsx
 * <CoursePrerequisitesSection prerequisites={prerequisites} requirements={requirements} />
 * ```
 */

/** A requirement as consumed by the section; see the `RequirementCard` molecule. */
import type { CourseRequirement } from "@/components/molecules/RequirementCard";

/** Public props for `CoursePrerequisitesSection`. */
export interface CoursePrerequisitesSectionProps {
  /** What the learner should already know before starting. */
  prerequisites: readonly string[];
  /** Items the learner must obtain or already owns. */
  requirements: readonly CourseRequirement[];
  /** Invoked by a card's CTA. Omit to hide every card's action. */
  onFindResource?: (requirementId: string) => void;
  /** CTA label forwarded to each card. Defaults to `"Look for Resource"`. */
  ctaLabel?: string;
  /** Heading for the first block. Defaults to `"Prerequisites"`. */
  prerequisitesTitle?: string;
  /** Heading for the second block. Defaults to `"Requirements"`. */
  requirementsTitle?: string;
  /** Extra classes merged onto the section root. */
  className?: string;
}
