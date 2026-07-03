"use client";

import { MapPin, Plus } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/theme";
import { ClassRoadmapSectionBlock } from "@/modules/School/roadmap/components/organisms/ClassRoadmapSectionBlock";
import { ROADMAP_SPINE_WIDTH_PX } from "@/modules/School/roadmap/roadmapLayout";
import { computeSpineProgressPercent, countCompletedSections } from "@/modules/School/roadmap/roadmapProgress";
import type { ClassRoadmapDocument, ClassRoadmapSidebarResource } from "@/modules/School/roadmap/types";

export function ClassRoadmapTimeline({
  doc,
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
  const { sections } = doc;
  const progressPercent = useMemo(() => computeSpineProgressPercent(doc), [doc]);
  const completedSections = countCompletedSections(doc);

  return (
    <div className="relative mx-auto w-full max-w-4xl py-6 sm:py-10">
      <div className="mb-4 sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-surface-default/95 px-2 py-2 backdrop-blur-sm sm:px-4">
        <div>
          <p className="text-sm font-semibold text-text-primary">Class roadmap</p>
          <p className="text-xs text-text-tertiary">
            {completedSections} of {sections.length} section{sections.length === 1 ? "" : "s"} passed
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700">
          <MapPin className="size-3.5" aria-hidden />
          Track where the class is now
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 top-16 rounded-full bg-slate-200"
        style={{ left: "50%", width: ROADMAP_SPINE_WIDTH_PX, transform: "translateX(-50%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-16 rounded-full bg-emerald-500 transition-all duration-500"
        style={{
          left: "50%",
          width: ROADMAP_SPINE_WIDTH_PX,
          transform: "translateX(-50%)",
          height: `${progressPercent}%`,
        }}
        aria-hidden
      />

      <div className="relative space-y-14 sm:space-y-16">
        {sections.map((section, index) => (
          <ClassRoadmapSectionBlock
            key={section.id}
            section={section}
            sectionIndex={index}
            doc={doc}
            canMutate={canMutate}
            isLast={index === sections.length - 1}
            onUpdate={(patch) => onUpdateSection(section.id, patch)}
            onToggleCollapsed={() => onToggleSectionCollapsed(section.id)}
            onAddContent={(resource) => onAddContent(section.id, resource)}
            onRemoveContent={(contentId) => onRemoveContent(section.id, contentId)}
            onSetCurrentPosition={onSetCurrentPosition}
            onToggleContentComplete={onToggleContentComplete}
            onReorderContent={onReorderContent}
          />
        ))}

        <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
          <div />
          <div className="flex min-w-[4.5rem] items-center justify-center gap-2">
            {canMutate ? (
              <button
                type="button"
                className="relative z-10 flex size-9 items-center justify-center rounded-full border-2 border-dashed border-primary-400 bg-white text-primary-700 shadow-sm hover:bg-primary-50"
                aria-label="Add section"
                onClick={onAddSection}
              >
                <Plus className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
          <div />
        </div>
      </div>

      {canMutate && sections.length === 0 ? (
        <div className="flex justify-center pt-6">
          <Button type="button" variant="secondary" size="sm" onClick={onAddSection}>
            Add first section
          </Button>
        </div>
      ) : null}
    </div>
  );
}
