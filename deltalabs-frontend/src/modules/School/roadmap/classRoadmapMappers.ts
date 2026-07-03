import type {
  ClassRoadmapDto,
  ClassRoadmapPutInputDto,
  ClassRoadmapResourcesResponseDto,
  ClassRoadmapSidebarResourceDto,
} from "@/modules/School/api";
import type { ClassRoadmapDocument, ClassRoadmapSidebarResource } from "@/modules/School/roadmap/types";

export function mapRoadmapFromApi(dto: ClassRoadmapDto): ClassRoadmapDocument {
  return {
    sections: dto.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      tags: [...section.tags],
      collapsed: section.collapsed,
      contents: section.contents.map((item) => ({
        id: item.id,
        kind: item.kind,
        contentType: item.contentType,
        title: item.title,
        subtitle: item.subtitle ?? null,
        sourceKey: item.sourceKey ?? null,
        tags: [...item.tags],
        status: item.status,
      })),
    })),
    currentSectionId: dto.currentSectionId,
    currentContentId: dto.currentContentId,
  };
}

export function mapRoadmapToPutInput(doc: ClassRoadmapDocument): ClassRoadmapPutInputDto {
  return {
    sections: doc.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      tags: [...section.tags],
      collapsed: section.collapsed,
      contents: section.contents.map((item) => ({
        id: item.id,
        kind: item.kind,
        contentType: item.contentType,
        title: item.title,
        subtitle: item.subtitle,
        sourceKey: item.sourceKey,
        tags: [...item.tags],
        status: item.status,
      })),
    })),
    currentSectionId: doc.currentSectionId,
    currentContentId: doc.currentContentId,
  };
}

function mapSidebarResource(dto: ClassRoadmapSidebarResourceDto): ClassRoadmapSidebarResource {
  return {
    id: dto.id,
    kind: dto.kind,
    contentType: dto.contentType,
    title: dto.title,
    subtitle: dto.subtitle ?? null,
    sourceKey: dto.sourceKey,
  };
}

export function mapRoadmapResourcesFromApi(dto: ClassRoadmapResourcesResponseDto): {
  sessions: readonly ClassRoadmapSidebarResource[];
  courses: readonly ClassRoadmapSidebarResource[];
  materials: readonly ClassRoadmapSidebarResource[];
} {
  return {
    sessions: dto.sessions.map(mapSidebarResource),
    courses: dto.courses.map(mapSidebarResource),
    materials: dto.materials.map(mapSidebarResource),
  };
}

export function isPersistedRoadmap(dto: ClassRoadmapDto): boolean {
  return Boolean(dto.updatedAt);
}
