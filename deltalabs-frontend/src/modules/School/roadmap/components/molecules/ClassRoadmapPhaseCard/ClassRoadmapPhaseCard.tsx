"use client";

import { useState, type DragEvent } from "react";

import { ClassRoadmapAttachedItem } from "@/modules/School/roadmap/components/molecules/ClassRoadmapAttachedItem";
import { ClassRoadmapTag } from "@/modules/School/roadmap/components/molecules/ClassRoadmapTag";
import { CLASS_ROADMAP_DRAG_MIME, type ClassRoadmapPhase, type ClassRoadmapSidebarResource } from "@/modules/School/roadmap/types";

export function ClassRoadmapPhaseCard({
  phase,
  side,
  canMutate,
  onUpdate,
  onAttach,
  onDetach,
}: Readonly<{
  phase: ClassRoadmapPhase;
  side: "left" | "right";
  canMutate: boolean;
  onUpdate: (patch: Partial<Pick<ClassRoadmapPhase, "title" | "description" | "tags">>) => void;
  onAttach: (resource: ClassRoadmapSidebarResource) => void;
  onDetach: (attachmentId: string) => void;
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
      if (resource?.id && resource?.title) onAttach(resource);
    } catch {
      // ignore invalid payload
    }
  };

  return (
    <article
      className={[
        "w-full max-w-md rounded-2xl border bg-surface-default p-4 shadow-[0_8px_24px_rgba(2,24,43,0.08)] sm:p-5",
        side === "left" ? "border-primary-200/80" : "border-emerald-200/80",
      ].join(" ")}
    >
      {canMutate ? (
        <input
          type="text"
          value={phase.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Phase title"
          className="w-full border-0 bg-transparent text-lg font-bold text-primary-700 outline-none placeholder:text-text-tertiary"
        />
      ) : (
        <h3 className="text-lg font-bold text-primary-700">{phase.title || "Phase"}</h3>
      )}

      {canMutate ? (
        <textarea
          value={phase.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Description…"
          rows={3}
          className="mt-2 w-full resize-y rounded-lg border border-transparent bg-surface-muted/20 px-2 py-1.5 text-sm leading-relaxed text-text-secondary outline-none focus:border-primary-300"
        />
      ) : phase.description ? (
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{phase.description}</p>
      ) : null}

      <div
        onDragOver={(e) => {
          if (!canMutate) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={[
          "mt-4 space-y-2 rounded-xl border-2 border-dashed px-3 py-3 transition-colors",
          dragOver ? "border-primary-400 bg-primary-50/40" : "border-border-default bg-surface-muted/15",
        ].join(" ")}
      >
        {phase.attachments.length === 0 ? (
          <p className="text-center text-xs text-text-tertiary">You can drag and attach here</p>
        ) : (
          phase.attachments.map((item) => (
            <ClassRoadmapAttachedItem
              key={item.id}
              resource={item}
              canMutate={canMutate}
              onRemove={() => onDetach(item.id)}
            />
          ))
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(phase.tags.length ? phase.tags : ["team"]).map((tag) => (
          <ClassRoadmapTag key={tag} label={tag} />
        ))}
      </div>
    </article>
  );
}
