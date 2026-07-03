"use client";

import { ClassRoadmapResourcesSidebar } from "@/modules/School/roadmap/components/organisms/ClassRoadmapResourcesSidebar";
import { ClassRoadmapTimeline } from "@/modules/School/roadmap/components/organisms/ClassRoadmapTimeline";
import { ROADMAP_WORKSPACE_HEIGHT_CLASS } from "@/modules/School/roadmap/roadmapLayout";
import type { ClassRoadmapDocument, ClassRoadmapSidebarResource } from "@/modules/School/roadmap/types";

export function ClassRoadmapWorkspace({
  doc,
  sessions,
  courses,
  materials,
  resourcesLoading,
  saving,
  canMutate,
  onAddSection,
  onUpdateSection,
  onToggleSectionCollapsed,
  onAddContent,
  onRemoveContent,
  onSetCurrentPosition,
  onToggleContentComplete,
  onReorderContent,
}: Readonly<{
  doc: ClassRoadmapDocument;
  sessions: readonly ClassRoadmapSidebarResource[];
  courses: readonly ClassRoadmapSidebarResource[];
  materials: readonly ClassRoadmapSidebarResource[];
  resourcesLoading?: boolean;
  saving?: boolean;
  canMutate: boolean;
  onAddSection: () => void;
  onUpdateSection: (
    sectionId: string,
    patch: Partial<Pick<ClassRoadmapDocument["sections"][number], "title" | "description" | "tags">>,
  ) => void;
  onToggleSectionCollapsed: (sectionId: string) => void;
  onAddContent: (sectionId: string, resource: ClassRoadmapSidebarResource) => void;
  onRemoveContent: (sectionId: string, contentId: string) => void;
  onSetCurrentPosition: (sectionId: string, contentId?: string | null) => void;
  onToggleContentComplete: (sectionId: string, contentId: string) => void;
  onReorderContent: (sectionId: string, activeId: string, overId: string) => void;
}>) {
  return (
    <div
      className={[
        "flex min-h-0 flex-col gap-4 overflow-hidden sm:gap-6",
        "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:items-stretch lg:gap-6",
        ROADMAP_WORKSPACE_HEIGHT_CLASS,
      ].join(" ")}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-default/60 bg-surface-default/80 lg:min-h-0">
        {saving ? (
          <p className="shrink-0 border-b border-border-default/60 px-4 py-2 text-xs text-text-tertiary">
            Saving roadmap…
          </p>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ClassRoadmapTimeline
            doc={doc}
            canMutate={canMutate}
            onAddSection={onAddSection}
            onUpdateSection={onUpdateSection}
            onToggleSectionCollapsed={onToggleSectionCollapsed}
            onAddContent={onAddContent}
            onRemoveContent={onRemoveContent}
            onSetCurrentPosition={onSetCurrentPosition}
            onToggleContentComplete={onToggleContentComplete}
            onReorderContent={onReorderContent}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:min-h-0 lg:max-w-sm">
        <ClassRoadmapResourcesSidebar
          sessions={sessions}
          courses={courses}
          materials={materials}
          loading={resourcesLoading}
        />
      </div>
    </div>
  );
}
