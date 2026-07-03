/** Resource dragged from sidebar (sessions, courses, etc.). */
export type ClassRoadmapResourceKind = "session" | "course" | "assignment" | "exam" | "video";

/** Learning item type shown on the class path. */
export type ClassRoadmapContentType = "video" | "exam" | "assignment" | "session" | "course";

export type ClassRoadmapContentStatus = "pending" | "completed";

export type ClassRoadmapSectionMilestone = "upcoming" | "current" | "completed";

export type ClassRoadmapContentItem = Readonly<{
  id: string;
  kind: ClassRoadmapResourceKind;
  contentType: ClassRoadmapContentType;
  title: string;
  subtitle?: string | null;
  sourceKey?: string | null;
  tags: readonly string[];
  status: ClassRoadmapContentStatus;
}>;

export type ClassRoadmapSection = Readonly<{
  id: string;
  title: string;
  description: string;
  tags: readonly string[];
  collapsed: boolean;
  contents: readonly ClassRoadmapContentItem[];
}>;

export type ClassRoadmapDocument = Readonly<{
  sections: readonly ClassRoadmapSection[];
  /** Where the class is on the roadmap right now. */
  currentSectionId: string | null;
  currentContentId: string | null;
}>;

export type ClassRoadmapSidebarResource = Readonly<{
  id: string;
  kind: ClassRoadmapResourceKind;
  contentType: ClassRoadmapContentType;
  title: string;
  subtitle?: string | null;
  sourceKey: string;
}>;

export const CLASS_ROADMAP_DRAG_MIME = "application/x-deltalabs-class-roadmap-resource";

/** @deprecated Use ClassRoadmapSection */
export type ClassRoadmapPhase = ClassRoadmapSection;

/** @deprecated Use ClassRoadmapContentItem */
export type ClassRoadmapAttachedResource = ClassRoadmapContentItem;
