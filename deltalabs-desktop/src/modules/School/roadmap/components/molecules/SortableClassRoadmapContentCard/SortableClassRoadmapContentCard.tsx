"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { CSSProperties } from "react";

import { ClassRoadmapContentCard } from "@/modules/School/roadmap/components/molecules/ClassRoadmapContentCard";
import {
  ROADMAP_CONTENT_CONNECTOR_CLASS,
  ROADMAP_CONTENT_LIST_MAX_WIDTH,
  ROADMAP_GRID,
} from "@/modules/School/roadmap/roadmapLayout";
import type { ClassRoadmapContentItem } from "@/modules/School/roadmap/types";

function contentConnectorClass(isCurrent: boolean, done: boolean): string {
  if (done) return "bg-emerald-500";
  if (isCurrent) return "bg-primary-500";
  return "bg-teal-600/80";
}

export function SortableClassRoadmapContentCard({
  item,
  step,
  isCurrent,
  canMutate,
  side,
  onRemove,
  onToggleComplete,
  onSetCurrent,
}: Readonly<{
  item: ClassRoadmapContentItem;
  step: number;
  isCurrent: boolean;
  canMutate: boolean;
  side: "left" | "right";
  onRemove?: () => void;
  onToggleComplete?: () => void;
  onSetCurrent?: () => void;
}>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canMutate,
  });

  const rowStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  const connector = (
    <div
      className={[ROADMAP_CONTENT_CONNECTOR_CLASS, contentConnectorClass(isCurrent, item.status === "completed")].join(" ")}
      aria-hidden
    />
  );

  const card = (
    <div className={["w-full", ROADMAP_CONTENT_LIST_MAX_WIDTH].join(" ")}>
      <ClassRoadmapContentCard
        item={item}
        step={step}
        isCurrent={isCurrent}
        canMutate={canMutate}
        onRemove={onRemove}
        onToggleComplete={onToggleComplete}
        onSetCurrent={onSetCurrent}
        dragHandle={
          canMutate ? (
            <button
              type="button"
              className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-text-tertiary hover:bg-surface-muted hover:text-text-secondary active:cursor-grabbing"
              aria-label={`Drag to reorder ${item.title}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-3.5" aria-hidden />
            </button>
          ) : null
        }
      />
    </div>
  );

  return (
    <li ref={setNodeRef} style={rowStyle} className={`${ROADMAP_GRID} list-none items-center`}>
      {side === "left" ? (
        <>
          <div className="flex w-full items-center px-1 sm:px-2">
            <div className="flex-1" aria-hidden />
            <div className="flex items-center">
              {card}
              {connector}
            </div>
          </div>
          <div aria-hidden />
          <div aria-hidden />
        </>
      ) : (
        <>
          <div aria-hidden />
          <div aria-hidden />
          <div className="flex w-full items-center px-1 sm:px-2">
            <div className="flex items-center">
              {connector}
              {card}
            </div>
          </div>
        </>
      )}
    </li>
  );
}
