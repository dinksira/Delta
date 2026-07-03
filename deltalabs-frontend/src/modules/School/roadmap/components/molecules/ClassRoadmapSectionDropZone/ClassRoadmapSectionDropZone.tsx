"use client";

import { useState, type DragEvent } from "react";

import { CLASS_ROADMAP_DRAG_MIME, type ClassRoadmapSidebarResource } from "@/modules/School/roadmap/types";

export function ClassRoadmapSectionDropZone({
  canMutate,
  onDropResource,
  compact = false,
}: Readonly<{
  canMutate: boolean;
  onDropResource: (resource: ClassRoadmapSidebarResource) => void;
  compact?: boolean;
}>) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!canMutate) return;
    const raw = e.dataTransfer.getData(CLASS_ROADMAP_DRAG_MIME);
    if (!raw) return;
    try {
      const resource = JSON.parse(raw) as ClassRoadmapSidebarResource;
      if (resource?.id && resource?.title) onDropResource(resource);
    } catch {
      // ignore invalid payload
    }
  };

  if (!canMutate) return null;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={[
        "rounded-xl border-2 border-dashed text-center transition-colors",
        compact ? "px-3 py-2" : "px-4 py-4",
        dragOver ? "border-emerald-400 bg-emerald-50/50" : "border-border-default bg-surface-muted/10",
      ].join(" ")}
    >
      <p className={compact ? "text-[11px] text-text-tertiary" : "text-xs text-text-tertiary"}>
        Drag a resource here to add under this section
      </p>
    </div>
  );
}
