"use client";

import { ClassRoadmapTag } from "@/modules/School/roadmap/components/molecules/ClassRoadmapTag";
import type { ClassRoadmapSection } from "@/modules/School/roadmap/types";

export function ClassRoadmapSectionHeaderCard({
  section,
  canMutate,
  onUpdate,
}: Readonly<{
  section: ClassRoadmapSection;
  canMutate: boolean;
  onUpdate: (patch: Partial<Pick<ClassRoadmapSection, "title" | "description" | "tags">>) => void;
}>) {
  return (
    <article className="w-full max-w-2xl rounded-2xl border border-border-default bg-surface-default p-5 shadow-[0_8px_24px_rgba(2,24,43,0.08)] sm:p-6">
      {canMutate ? (
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Section title"
          className="w-full border-0 bg-transparent text-xl font-bold text-primary-700 outline-none placeholder:text-text-tertiary sm:text-2xl"
        />
      ) : (
        <h3 className="text-xl font-bold text-primary-700 sm:text-2xl">{section.title || "Section"}</h3>
      )}

      {canMutate ? (
        <textarea
          value={section.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Section description…"
          rows={3}
          className="mt-3 w-full resize-y rounded-lg border border-transparent bg-surface-muted/20 px-2 py-1.5 text-sm leading-relaxed text-text-secondary outline-none focus:border-primary-300"
        />
      ) : section.description ? (
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{section.description}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(section.tags.length ? section.tags : ["overview"]).map((tag) => (
          <ClassRoadmapTag key={tag} label={tag} />
        ))}
      </div>
    </article>
  );
}
