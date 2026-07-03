import type {
  ClassRoadmapContentItem,
  ClassRoadmapDocument,
  ClassRoadmapSection,
  ClassRoadmapSectionMilestone,
} from "@/modules/School/roadmap/types";

export function resolveSectionMilestone(
  section: ClassRoadmapSection,
  sectionIndex: number,
  doc: ClassRoadmapDocument,
): ClassRoadmapSectionMilestone {
  const currentId = doc.currentSectionId ?? doc.sections[0]?.id ?? null;
  if (!currentId) return "upcoming";
  const currentIndex = doc.sections.findIndex((s) => s.id === currentId);
  if (currentIndex < 0) return sectionIndex === 0 ? "current" : "upcoming";
  if (section.id === currentId) return "current";
  if (sectionIndex < currentIndex) return "completed";
  return "upcoming";
}

export function isContentCurrent(
  content: ClassRoadmapContentItem,
  section: ClassRoadmapSection,
  doc: ClassRoadmapDocument,
): boolean {
  if (doc.currentContentId) return content.id === doc.currentContentId;
  if (section.id !== doc.currentSectionId) return false;
  const firstPending = section.contents.find((c) => c.status !== "completed");
  return firstPending?.id === content.id;
}

export function computeSpineProgressPercent(doc: ClassRoadmapDocument): number {
  const { sections } = doc;
  if (sections.length === 0) return 0;

  const currentId = doc.currentSectionId ?? sections[0]?.id;
  const currentIndex = sections.findIndex((s) => s.id === currentId);
  if (currentIndex < 0) return 100 / sections.length;

  const section = sections[currentIndex];
  const contentCount = section?.contents.length ?? 0;
  let fraction = 0;
  if (contentCount > 0 && doc.currentContentId) {
    const contentIndex = section.contents.findIndex((c) => c.id === doc.currentContentId);
    fraction = contentIndex >= 0 ? (contentIndex + 0.5) / contentCount : 0.25;
  } else if (contentCount > 0) {
    const completed = section.contents.filter((c) => c.status === "completed").length;
    fraction = completed / contentCount;
  } else {
    fraction = 0.35;
  }

  const segment = 1 / sections.length;
  const progress = (currentIndex + fraction * segment) / sections.length;
  return Math.min(98, Math.max(8, progress * 100));
}

export function countCompletedSections(doc: ClassRoadmapDocument): number {
  const currentId = doc.currentSectionId;
  const idx = doc.sections.findIndex((s) => s.id === currentId);
  return idx < 0 ? 0 : idx;
}
