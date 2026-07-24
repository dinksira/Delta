"use client";

import { ClassRoadmapWorkspace } from "@/modules/School/roadmap/components/organisms/ClassRoadmapWorkspace";
import { useClassRoadmapResources } from "@/modules/School/roadmap/hooks/useClassRoadmapResources";
import { useClassRoadmapState } from "@/modules/School/roadmap/hooks/useClassRoadmapState";

export function ClassRoadmapPanel({
  orgId,
  schoolId,
  classItemId,
  classMetadata,
  canMutate,
}: Readonly<{
  orgId: string;
  schoolId: string;
  classItemId: string;
  classMetadata: Record<string, unknown> | null | undefined;
  canMutate: boolean;
}>) {
  const {
    doc,
    hydrated,
    loading: roadmapLoading,
    saving,
    addSection,
    updateSection,
    toggleSectionCollapsed,
    setCurrentPosition,
    toggleContentComplete,
    addContent,
    removeContent,
    reorderContent,
  } = useClassRoadmapState(orgId, schoolId, classItemId, canMutate);

  const resources = useClassRoadmapResources({
    orgId,
    schoolId,
    classItemId,
    classMetadata,
    canMutate,
  });

  if (!hydrated || roadmapLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div className="h-full min-h-0 flex-1 animate-pulse rounded-2xl border border-border-default bg-surface-muted/30" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ClassRoadmapWorkspace
      orgId={orgId}
      schoolId={schoolId}
      classItemId={classItemId}
      doc={doc}
      sessions={resources.sessions}
      courses={resources.courses}
      materials={resources.materials}
      resourcesLoading={resources.loading}
      saving={saving}
      canMutate={canMutate}
      onAddSection={addSection}
      onUpdateSection={updateSection}
      onToggleSectionCollapsed={toggleSectionCollapsed}
      onAddContent={addContent}
      onRemoveContent={removeContent}
      onSetCurrentPosition={setCurrentPosition}
      onToggleContentComplete={toggleContentComplete}
      onReorderContent={reorderContent}
      />
    </div>
  );
}



