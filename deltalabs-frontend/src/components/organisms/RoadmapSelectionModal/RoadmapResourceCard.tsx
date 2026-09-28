/** ################################ COMPONENT ############################# */
/** A single selectable resource inside a roadmap section. */

import React from "react";

import { Check, Eye, FileText, Headphones, Play, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RoadmapResource, RoadmapResourceKind } from "./RoadmapSelectionModal.types";
import {
  resourceCardClasses,
  resourceCardIdleClasses,
  resourceCardSelectedClasses,
  resourceCheckClasses,
  resourceCheckIdleClasses,
  resourceCheckSelectedClasses,
  resourceDescriptionClasses,
  resourceMetaClasses,
  resourceNameClasses,
  resourceTitleClasses,
  reviewClasses,
  tagClasses,
  tagSelectedClasses,
} from "./variants";

/** Icon per resource kind. */
const KIND_ICONS: Record<RoadmapResourceKind, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  video: Play,
  audio: Headphones,
  other: Sparkles,
};

/** Props for {@link RoadmapResourceCard}. */
export interface RoadmapResourceCardProps {
  /** The resource this card represents. */
  resource: RoadmapResource;
  /** Whether this resource is currently selected. */
  isSelected: boolean;
  /** Activates the card. */
  onToggle: (resourceId: string) => void;
}

/**
 * A resource as a single toggle control.
 *
 * The previous version rendered each resource as a clickable `<div>` with no
 * role and no keyboard access, and used an `X` badge to mean "not selected",
 * which reads as "excluded" rather than "available".
 */
export function RoadmapResourceCard({
  resource,
  isSelected,
  onToggle,
}: Readonly<RoadmapResourceCardProps>) {
  const Icon = KIND_ICONS[resource.kind];

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onToggle(resource.id)}
      className={cn(
        resourceCardClasses,
        isSelected ? resourceCardSelectedClasses : resourceCardIdleClasses,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          resourceCheckClasses,
          isSelected ? resourceCheckSelectedClasses : resourceCheckIdleClasses,
        )}
      >
        {isSelected ? <Check className="size-2.5 text-primary-600" strokeWidth={4} /> : null}
      </span>

      <span className={resourceTitleClasses}>
        <Icon className="size-3 shrink-0 text-primary-600" />
        <span className={resourceNameClasses}>{resource.title}</span>
      </span>

      {resource.description ? (
        <span className={resourceDescriptionClasses}>{resource.description}</span>
      ) : null}

      <span className={resourceMetaClasses}>
        {resource.tags?.map((tag) => (
          <span key={tag} className={cn(tagClasses, isSelected && tagSelectedClasses)}>
            {tag}
          </span>
        ))}

        {resource.isReviewable ? (
          <span className={reviewClasses}>
            <Eye className="size-3 text-text-secondary" aria-hidden="true" />
            <span className="text-xs font-bold uppercase text-text-secondary">Review</span>
          </span>
        ) : null}
      </span>
    </button>
  );
}
/** ################################ /COMPONENT ############################# */
