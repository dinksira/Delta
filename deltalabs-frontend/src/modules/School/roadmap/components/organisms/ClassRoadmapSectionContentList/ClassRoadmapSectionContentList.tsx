"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { SortableClassRoadmapContentCard } from "@/modules/School/roadmap/components/molecules/SortableClassRoadmapContentCard";
import { ROADMAP_CONTENT_LIST_MAX_WIDTH, ROADMAP_GRID } from "@/modules/School/roadmap/roadmapLayout";
import { isContentCurrent } from "@/modules/School/roadmap/roadmapProgress";
import type { ClassRoadmapDocument, ClassRoadmapSection } from "@/modules/School/roadmap/types";

export function ClassRoadmapSectionContentList({
  section,
  sectionIndex: _sectionIndex,
  doc,
  side,
  canMutate,
  onRemoveContent,
  onToggleContentComplete,
  onSetCurrentPosition,
  onReorderContent,
}: Readonly<{
  section: ClassRoadmapSection;
  sectionIndex: number;
  doc: ClassRoadmapDocument;
  side: "left" | "right";
  canMutate: boolean;
  onRemoveContent: (contentId: string) => void;
  onToggleContentComplete: (contentId: string) => void;
  onSetCurrentPosition: (sectionId: string, contentId: string) => void;
  onReorderContent: (sectionId: string, activeId: string, overId: string) => void;
}>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorderContent(section.id, String(active.id), String(over.id));
  };

  if (section.contents.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <div className={`${ROADMAP_GRID}`}>
        {side === "left" ? (
          <>
            <p
              className={[
                "px-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary sm:px-2",
                ROADMAP_CONTENT_LIST_MAX_WIDTH,
                "ml-auto text-right",
              ].join(" ")}
            >
              Class path
            </p>
            <div aria-hidden />
            <div aria-hidden />
          </>
        ) : (
          <>
            <div aria-hidden />
            <div aria-hidden />
            <p
              className={[
                "px-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary sm:px-2",
                ROADMAP_CONTENT_LIST_MAX_WIDTH,
                "text-left",
              ].join(" ")}
            >
              Class path
            </p>
          </>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={section.contents.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {section.contents.map((item, index) => (
              <SortableClassRoadmapContentCard
                key={item.id}
                item={item}
                step={index + 1}
                side={side}
                isCurrent={isContentCurrent(item, section, doc)}
                canMutate={canMutate}
                onRemove={() => onRemoveContent(item.id)}
                onToggleComplete={() => onToggleContentComplete(item.id)}
                onSetCurrent={() => onSetCurrentPosition(section.id, item.id)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}
