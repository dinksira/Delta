"use client";

import { Minus, Plus } from "lucide-react";
import { useState, type DragEvent } from "react";

import { ClassRoadmapSectionCard } from "@/modules/School/roadmap/components/molecules/ClassRoadmapSectionCard";
import { ClassRoadmapSectionContentList } from "@/modules/School/roadmap/components/organisms/ClassRoadmapSectionContentList";
import { ROADMAP_GRID } from "@/modules/School/roadmap/roadmapLayout";
import { resolveSectionMilestone } from "@/modules/School/roadmap/roadmapProgress";
import { CLASS_ROADMAP_DRAG_MIME, type ClassRoadmapDocument, type ClassRoadmapSection, type ClassRoadmapSidebarResource } from "@/modules/School/roadmap/types";

const MIN_SECTION_CONNECTOR = 16;

function useSectionDrop(canMutate: boolean, onAddContent: (resource: ClassRoadmapSidebarResource) => void) {
  const [dragOver, setDragOver] = useState(false);

  const onDragOver = (e: DragEvent) => {
    if (!canMutate) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!canMutate) return;
    const raw = e.dataTransfer.getData(CLASS_ROADMAP_DRAG_MIME);
    if (!raw) return;
    try {
      const resource = JSON.parse(raw) as ClassRoadmapSidebarResource;
      if (resource?.id && resource?.title) onAddContent(resource);
    } catch {
      // ignore
    }
  };

  return { dragOver, onDragOver, onDragLeave, onDrop };
}

function spineNodeClass(milestone: ReturnType<typeof resolveSectionMilestone>): string {
  if (milestone === "completed") return "bg-emerald-600 border-emerald-100";
  if (milestone === "current") return "bg-primary-600 border-white ring-2 ring-primary-300";
  return "bg-slate-300 border-white";
}

export function ClassRoadmapSectionBlock({
  section,
  sectionIndex,
  doc,
  canMutate,
  onUpdate,
  onToggleCollapsed,
  onAddContent,
  onRemoveContent,
  onSetCurrentPosition,
  onToggleContentComplete,
  onReorderContent,
}: Readonly<{
  section: ClassRoadmapSection;
  sectionIndex: number;
  doc: ClassRoadmapDocument;
  canMutate: boolean;
  isLast?: boolean;
  onUpdate: (patch: Partial<Pick<ClassRoadmapSection, "title" | "description" | "tags">>) => void;
  onToggleCollapsed: () => void;
  onAddContent: (resource: ClassRoadmapSidebarResource) => void;
  onRemoveContent: (contentId: string) => void;
  onSetCurrentPosition: (sectionId: string, contentId?: string | null) => void;
  onToggleContentComplete: (sectionId: string, contentId: string) => void;
  onReorderContent: (sectionId: string, activeId: string, overId: string) => void;
}>) {
  const side = sectionIndex % 2 === 0 ? "right" : "left";
  const expanded = !section.collapsed;
  const drop = useSectionDrop(canMutate, onAddContent);
  const milestone = resolveSectionMilestone(section, sectionIndex, doc);

  const sectionConnector = (
    <div
      className={[
        "h-0.5 flex-1",
        milestone === "completed"
          ? "bg-emerald-500"
          : milestone === "current"
            ? "bg-primary-500"
            : side === "left"
              ? "bg-[#174A5F]/35"
              : "bg-emerald-400/85",
      ].join(" ")}
      style={{ minWidth: MIN_SECTION_CONNECTOR }}
      aria-hidden
    />
  );

  const contentList =
    expanded && section.contents.length > 0 ? (
      <ClassRoadmapSectionContentList
        section={section}
        sectionIndex={sectionIndex}
        doc={doc}
        side={side}
        canMutate={canMutate}
        onRemoveContent={onRemoveContent}
        onToggleContentComplete={(contentId) => onToggleContentComplete(section.id, contentId)}
        onSetCurrentPosition={onSetCurrentPosition}
        onReorderContent={onReorderContent}
      />
    ) : expanded ? (
      <p className={["mt-2 text-xs text-text-tertiary", side === "left" ? "text-right" : "text-left"].join(" ")}>
        Drag resources here to add steps under this section.
      </p>
    ) : null;

  const sideColumn = (
    <div className="px-1 sm:px-2">
      <div
        className={[
          "flex w-full max-w-sm flex-col",
          side === "left" ? "ml-auto items-end" : "items-start",
        ].join(" ")}
      >
        <div
          className={[
            "flex w-full items-center",
            side === "left" ? "justify-end" : "justify-start",
          ].join(" ")}
        >
          {side === "left" ? (
            <>
              <ClassRoadmapSectionCard
                section={section}
                sectionIndex={sectionIndex}
                milestone={milestone}
                side={side}
                canMutate={canMutate}
                onUpdate={onUpdate}
                onSetCurrent={() => onSetCurrentPosition(section.id, null)}
              />
              {sectionConnector}
            </>
          ) : (
            <>
              {sectionConnector}
              <ClassRoadmapSectionCard
                section={section}
                sectionIndex={sectionIndex}
                milestone={milestone}
                side={side}
                canMutate={canMutate}
                onUpdate={onUpdate}
                onSetCurrent={() => onSetCurrentPosition(section.id, null)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section
      className={[
        "relative",
        drop.dragOver ? "rounded-xl ring-2 ring-teal-300/50 ring-offset-1" : "",
      ].join(" ")}
      aria-label={section.title || `Section ${sectionIndex + 1}`}
      onDragOver={drop.onDragOver}
      onDragLeave={drop.onDragLeave}
      onDrop={drop.onDrop}
    >
      <div className={`${ROADMAP_GRID} items-start`}>
        {side === "left" ? (
          <>
            {sideColumn}
            <div className="flex flex-col items-center self-stretch pt-6">
              <div
                className={`size-4 shrink-0 rounded-full border-2 shadow-sm ${spineNodeClass(milestone)}`}
                aria-hidden
              />
              <button
                type="button"
                className="mt-2 flex size-7 items-center justify-center rounded-full bg-[#174A5F] text-white shadow-md hover:bg-[#123d4f]"
                aria-label={expanded ? "Collapse section contents" : "Expand section contents"}
                aria-expanded={expanded}
                onClick={onToggleCollapsed}
              >
                {expanded ? <Minus className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
              </button>
            </div>
            <div />
          </>
        ) : (
          <>
            <div />
            <div className="flex flex-col items-center self-stretch pt-6">
              <div
                className={`size-4 shrink-0 rounded-full border-2 shadow-sm ${spineNodeClass(milestone)}`}
                aria-hidden
              />
              <button
                type="button"
                className="mt-2 flex size-7 items-center justify-center rounded-full bg-[#174A5F] text-white shadow-md hover:bg-[#123d4f]"
                aria-label={expanded ? "Collapse section contents" : "Expand section contents"}
                aria-expanded={expanded}
                onClick={onToggleCollapsed}
              >
                {expanded ? <Minus className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
              </button>
            </div>
            {sideColumn}
          </>
        )}
      </div>

      {contentList}
    </section>
  );
}
