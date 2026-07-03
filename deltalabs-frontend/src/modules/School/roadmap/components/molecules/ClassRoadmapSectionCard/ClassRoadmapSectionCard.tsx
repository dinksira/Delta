"use client";

import { Check, MapPin } from "lucide-react";

import { ClassRoadmapTag } from "@/modules/School/roadmap/components/molecules/ClassRoadmapTag";
import type { ClassRoadmapSection, ClassRoadmapSectionMilestone } from "@/modules/School/roadmap/types";

const MILESTONE_STYLES: Record<
  ClassRoadmapSectionMilestone,
  { badge: string; label: string }
> = {
  completed: { badge: "bg-emerald-600 text-white", label: "Completed" },
  current: { badge: "bg-primary-600 text-white", label: "In progress" },
  upcoming: { badge: "bg-surface-muted text-text-tertiary", label: "Upcoming" },
};

export function ClassRoadmapSectionCard({
  section,
  sectionIndex,
  milestone,
  canMutate,
  onUpdate,
  onSetCurrent,
}: Readonly<{
  section: ClassRoadmapSection;
  sectionIndex: number;
  milestone: ClassRoadmapSectionMilestone;
  side: "left" | "right";
  canMutate: boolean;
  onUpdate: (patch: Partial<Pick<ClassRoadmapSection, "title" | "description" | "tags">>) => void;
  onSetCurrent?: () => void;
}>) {
  const style = MILESTONE_STYLES[milestone];
  const isCurrent = milestone === "current";

  return (
    <article
      className={[
        "w-full overflow-hidden rounded-2xl border-2 bg-surface-default shadow-[0_10px_28px_rgba(2,24,43,0.1)]",
        isCurrent ? "border-primary-400 ring-2 ring-primary-200/80" : "border-border-default/80",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-start justify-between gap-2 border-b border-border-default/60 px-3.5 py-2.5 sm:px-4",
          isCurrent ? "bg-gradient-to-r from-primary-50 to-emerald-50/50" : "bg-surface-muted/20",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#174A5F] text-xs font-bold text-white">
              {sectionIndex + 1}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${style.badge}`}>
              {style.label}
            </span>
            {isCurrent ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary-700">
                <MapPin className="size-3" aria-hidden />
                Class is here
              </span>
            ) : null}
          </div>
          {canMutate ? (
            <input
              type="text"
              value={section.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Section title"
              className="mt-1.5 w-full border-0 bg-transparent text-lg font-bold text-primary-800 outline-none placeholder:text-text-tertiary"
            />
          ) : (
            <h3 className="mt-1.5 text-lg font-bold text-primary-800">{section.title || "Section"}</h3>
          )}
        </div>
        {canMutate && onSetCurrent && !isCurrent ? (
          <button
            type="button"
            className="shrink-0 rounded-md border border-border-default px-2 py-1 text-[10px] font-medium text-text-secondary hover:bg-white"
            onClick={onSetCurrent}
          >
            Set current
          </button>
        ) : null}
        {milestone === "completed" ? (
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>

      <div className="px-3.5 py-3 sm:px-4 sm:py-3.5">
        {canMutate ? (
          <textarea
            value={section.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="What should the class achieve in this section?"
            rows={2}
            className="w-full resize-y rounded-lg border border-border-default/70 bg-surface-muted/15 px-2.5 py-2 text-sm leading-relaxed text-text-secondary outline-none focus:border-primary-300"
          />
        ) : section.description ? (
          <p className="text-sm leading-relaxed text-text-secondary">{section.description}</p>
        ) : null}

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {(section.tags.length ? section.tags : ["milestone"]).map((tag) => (
            <ClassRoadmapTag key={tag} label={tag} />
          ))}
        </div>
      </div>
    </article>
  );
}
