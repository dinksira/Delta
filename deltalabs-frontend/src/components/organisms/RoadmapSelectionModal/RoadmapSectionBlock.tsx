/** ################################ COMPONENT ############################# */
/** A roadmap section: its spine segment, heading card, and resources. */

import React from "react";

import { cn } from "@/lib/utils";
import type { RoadmapResource, RoadmapSection } from "./RoadmapSelectionModal.types";
import { RoadmapResourceCard } from "./RoadmapResourceCard";
import {
  nodeClasses,
  nodeIdleClasses,
  resourceGridClasses,
  sectionCardClasses,
  sectionCardIdleClasses,
  sectionCardSelectedClasses,
  sectionClasses,
  sectionDescriptionClasses,
  sectionTitleClasses,
  spineClasses,
  spineReachedClasses,
  tagClasses,
  tagSelectedClasses,
} from "./variants";

/** Props for {@link RoadmapSectionBlock}. */
export interface RoadmapSectionBlockProps {
  /** The section being rendered. */
  section: RoadmapSection;
  /** Whether this section is currently selected. */
  isSelected: boolean;
  /**
   * Whether this section or an earlier one is selected, which is what tints the
   * spine. Derived from state instead of the previous hardcoded pixel offsets,
   * which drifted out of alignment.
   */
  isReached: boolean;
  /** Ids of the selected resources. */
  selectedResourceIds: ReadonlySet<string>;
  /** Activates the section. */
  onToggleSection: (sectionId: string) => void;
  /** Activates one of the section's resources. */
  onToggleResource: (resourceId: string) => void;
}

/** Renders one roadmap section with its spine and resources. */
export function RoadmapSectionBlock({
  section,
  isSelected,
  isReached,
  selectedResourceIds,
  onToggleSection,
  onToggleResource,
}: Readonly<RoadmapSectionBlockProps>) {
  return (
    <li className={sectionClasses}>
      <span aria-hidden="true" className={cn(spineClasses, isReached && spineReachedClasses)} />
      <span aria-hidden="true" className={cn(nodeClasses, !isReached && nodeIdleClasses)} />

      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onToggleSection(section.id)}
        className={cn(
          sectionCardClasses,
          isSelected ? sectionCardSelectedClasses : sectionCardIdleClasses,
        )}
      >
        <span className={sectionTitleClasses}>{section.title}</span>

        {section.description ? (
          <span className={sectionDescriptionClasses}>{section.description}</span>
        ) : null}

        {section.tags?.length ? (
          <span className="mt-3 flex gap-2">
            {section.tags.map((tag) => (
              <span key={tag} className={cn(tagClasses, isSelected && tagSelectedClasses)}>
                {tag}
              </span>
            ))}
          </span>
        ) : null}
      </button>

      {section.resources?.length ? (
        <div className={resourceGridClasses}>
          {section.resources.map((resource: RoadmapResource) => (
            <RoadmapResourceCard
              key={resource.id}
              resource={resource}
              isSelected={selectedResourceIds.has(resource.id)}
              onToggle={onToggleResource}
            />
          ))}
        </div>
      ) : null}
    </li>
  );
}
/** ################################ /COMPONENT ############################# */
