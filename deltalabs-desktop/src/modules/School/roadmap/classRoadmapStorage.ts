import type {
  ClassRoadmapContentItem,
  ClassRoadmapContentType,
  ClassRoadmapDocument,
  ClassRoadmapResourceKind,
  ClassRoadmapSection,
  ClassRoadmapSidebarResource,
} from "@/modules/School/roadmap/types";

function storageKey(classItemId: string): string {
  return `deltalabs:class:roadmap:${classItemId.trim()}`;
}

const CONTENT_TYPE_FROM_KIND: Record<ClassRoadmapResourceKind, ClassRoadmapContentType> = {
  session: "session",
  course: "course",
  video: "video",
  exam: "exam",
  assignment: "assignment",
};

export function contentTypeFromResource(resource: ClassRoadmapSidebarResource): ClassRoadmapContentType {
  return resource.contentType ?? CONTENT_TYPE_FROM_KIND[resource.kind] ?? "session";
}

export function createEmptyRoadmapSection(order: number): ClassRoadmapSection {
  return {
    id: `section_${crypto.randomUUID().slice(0, 8)}`,
    title: order === 0 ? "Section 1" : `Section ${order + 1}`,
    description: "",
    tags: [],
    collapsed: false,
    contents: [],
  };
}

export const createEmptyRoadmapPhase = createEmptyRoadmapSection;

export function defaultClassRoadmapDocument(): ClassRoadmapDocument {
  const section = createEmptyRoadmapSection(0);
  return {
    sections: [section],
    currentSectionId: section.id,
    currentContentId: null,
  };
}

function normalizeContentItem(raw: unknown): ClassRoadmapContentItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<ClassRoadmapContentItem>;
  if (typeof item.id !== "string" || typeof item.title !== "string") return null;

  const kind = (item.kind ?? "session") as ClassRoadmapResourceKind;
  const contentType =
    item.contentType ??
    CONTENT_TYPE_FROM_KIND[kind as ClassRoadmapResourceKind] ??
    "session";

  return {
    id: item.id,
    kind: kind === "course" ? "course" : kind === "exam" ? "exam" : kind === "assignment" ? "assignment" : kind === "video" ? "video" : "session",
    contentType,
    title: item.title,
    subtitle: typeof item.subtitle === "string" ? item.subtitle : null,
    sourceKey: typeof item.sourceKey === "string" ? item.sourceKey : null,
    tags: Array.isArray(item.tags) ? item.tags.filter((t): t is string => typeof t === "string") : [],
    status: item.status === "completed" ? "completed" : "pending",
  };
}

function normalizeSection(raw: unknown): ClassRoadmapSection | null {
  if (!raw || typeof raw !== "object") return null;
  const section = raw as Partial<ClassRoadmapSection> & { attachments?: unknown[] };
  if (typeof section.id !== "string") return null;

  const legacyContents = Array.isArray(section.attachments) ? section.attachments : [];
  const contents = Array.isArray(section.contents) ? section.contents : legacyContents;

  return {
    id: section.id,
    title: typeof section.title === "string" ? section.title : "Section",
    description: typeof section.description === "string" ? section.description : "",
    tags: Array.isArray(section.tags) ? section.tags.filter((t): t is string => typeof t === "string") : [],
    collapsed: Boolean(section.collapsed),
    contents: contents.map(normalizeContentItem).filter((c): c is ClassRoadmapContentItem => c !== null),
  };
}

export function readClassRoadmapDocument(classItemId: string): ClassRoadmapDocument | null {
  if (typeof window === "undefined" || !classItemId.trim()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(classItemId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ClassRoadmapDocument> & { phases?: unknown[] };
    const legacySections = Array.isArray(parsed.phases) ? parsed.phases : [];
    const sections = Array.isArray(parsed.sections) ? parsed.sections : legacySections;
    if (!sections.length) return null;

    const normalizedSections = sections
      .map(normalizeSection)
      .filter((s): s is ClassRoadmapSection => s !== null);

    const currentSectionId =
      typeof parsed.currentSectionId === "string" && parsed.currentSectionId.trim()
        ? parsed.currentSectionId
        : normalizedSections[0]?.id ?? null;

    const currentContentId =
      typeof parsed.currentContentId === "string" && parsed.currentContentId.trim()
        ? parsed.currentContentId
        : null;

    return {
      sections: normalizedSections,
      currentSectionId,
      currentContentId,
    };
  } catch {
    return null;
  }
}

export function writeClassRoadmapDocument(classItemId: string, doc: ClassRoadmapDocument): void {
  if (typeof window === "undefined" || !classItemId.trim()) return;
  try {
    window.localStorage.setItem(storageKey(classItemId), JSON.stringify(doc));
  } catch {
    // ignore
  }
}

export function clearClassRoadmapDocument(classItemId: string): void {
  if (typeof window === "undefined" || !classItemId.trim()) return;
  try {
    window.localStorage.removeItem(storageKey(classItemId));
  } catch {
    // ignore
  }
}
