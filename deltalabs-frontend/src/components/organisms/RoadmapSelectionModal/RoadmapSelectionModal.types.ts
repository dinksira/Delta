/** ################################ TYPES ############################# */
/** Props contract for RoadmapSelectionModal. */

/** Media kind of a roadmap resource. */
export type RoadmapResourceKind = "document" | "video" | "audio" | "other";

/** One selectable resource inside a roadmap section. */
export interface RoadmapResource {
  /** Stable id, matched against `selectedResourceIds`. */
  id: string;
  /** Short resource name. */
  title: string;
  /** Optional one-line summary. */
  description?: string;
  /** Drives the leading icon. */
  kind: RoadmapResourceKind;
  /** Topic tags rendered as chips. */
  tags?: readonly string[];
  /** Whether the resource carries a review affordance. */
  isReviewable?: boolean;
}

/** One selectable section of the roadmap, with its resources. */
export interface RoadmapSection {
  /** Stable id, matched against `selectedSectionIds`. */
  id: string;
  /** Section heading. */
  title: string;
  /** Optional section summary. */
  description?: string;
  /** Topic tags rendered as chips. */
  tags?: readonly string[];
  /** Resources belonging to this section. */
  resources?: readonly RoadmapResource[];
}

/** What {@link RoadmapSelectionModal} hands back on confirm. */
export interface RoadmapSelection {
  /** Ids of the selected sections. */
  sectionIds: string[];
  /** Ids of the selected resources. */
  resourceIds: string[];
}

/** Props for {@link RoadmapSelectionModal}. */
export interface RoadmapSelectionModalProps {
  /** Whether the dialog is visible. */
  isOpen: boolean;
  /** Dismisses the dialog without confirming. */
  onClose: () => void;
  /** Roadmap to render. Supplied by the caller so the component holds no data. */
  sections: readonly RoadmapSection[];
  /** Ids of the selected sections. */
  selectedSectionIds?: readonly string[];
  /** Ids of the selected resources. */
  selectedResourceIds?: readonly string[];
  /**
   * Fired when a section is activated. Takes a section **id**, not a title:
   * the previous API keyed on the heading string, which is neither unique nor
   * stable across content edits.
   */
  onToggleSection?: (sectionId: string) => void;
  /** Fired when a resource is activated. */
  onToggleResource?: (resourceId: string) => void;
  /** Fired by the confirm button with the selection at that moment. */
  onConfirm?: (selection: RoadmapSelection) => void;
  /** Message shown when the roadmap has no sections. */
  emptyMessage?: string;
  /** Extra classes merged onto the dialog content. */
  className?: string;
}
/** ################################ /TYPES ############################# */
