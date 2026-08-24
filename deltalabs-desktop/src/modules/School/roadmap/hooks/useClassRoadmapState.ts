"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

import { fetchClassRoadmap, putClassRoadmap } from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import {
  isPersistedRoadmap,
  mapRoadmapFromApi,
  mapRoadmapToPutInput,
} from "@/modules/School/roadmap/classRoadmapMappers";
import {
  contentTypeFromResource,
  createEmptyRoadmapSection,
  defaultClassRoadmapDocument,
  readClassRoadmapDocument,
  clearClassRoadmapDocument,
} from "@/modules/School/roadmap/classRoadmapStorage";
import type {
  ClassRoadmapContentItem,
  ClassRoadmapDocument,
  ClassRoadmapSection,
  ClassRoadmapSidebarResource,
} from "@/modules/School/roadmap/types";

function withCurrentPointers(doc: ClassRoadmapDocument): ClassRoadmapDocument {
  const firstSection = doc.sections[0];
  if (!firstSection) {
    return { sections: [], currentSectionId: null, currentContentId: null };
  }
  const currentSectionId = doc.currentSectionId ?? firstSection.id;
  const section = doc.sections.find((s) => s.id === currentSectionId) ?? firstSection;
  return {
    ...doc,
    currentSectionId: section.id,
    currentContentId: doc.currentContentId,
  };
}

export function useClassRoadmapState(
  orgId: string,
  schoolId: string,
  classItemId: string,
  canMutate: boolean,
) {
  const queryClient = useQueryClient();
  const migratedRef = useRef(false);
  const enabled = Boolean(orgId && schoolId && classItemId);

  const roadmapQuery = useQuery({
    queryKey: schoolQueryKeys.classRoadmap(orgId, schoolId, classItemId),
    queryFn: async () => {
      const dto = await fetchClassRoadmap(orgId, schoolId, classItemId);
      return { dto, doc: withCurrentPointers(mapRoadmapFromApi(dto)) };
    },
    enabled,
    staleTime: 10_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (doc: ClassRoadmapDocument) => {
      const dto = await putClassRoadmap(orgId, schoolId, classItemId, mapRoadmapToPutInput(withCurrentPointers(doc)));
      return { dto, doc: withCurrentPointers(mapRoadmapFromApi(dto)) };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(schoolQueryKeys.classRoadmap(orgId, schoolId, classItemId), result);
    },
  });

  useEffect(() => {
    if (!enabled || !canMutate || migratedRef.current || !roadmapQuery.data) return;
    const { dto } = roadmapQuery.data;
    if (isPersistedRoadmap(dto)) return;

    const local = readClassRoadmapDocument(classItemId);
    if (!local || local.sections.length === 0) return;

    const hasContent = local.sections.some((section) => section.contents.length > 0);
    const hasCustomSections = local.sections.length > 1 || local.sections[0]?.title !== "Section 1";
    if (!hasContent && !hasCustomSections) return;

    migratedRef.current = true;
    void putClassRoadmap(orgId, schoolId, classItemId, mapRoadmapToPutInput(withCurrentPointers(local))).then(
      (nextDto) => {
        clearClassRoadmapDocument(classItemId);
        queryClient.setQueryData(schoolQueryKeys.classRoadmap(orgId, schoolId, classItemId), {
          dto: nextDto,
          doc: withCurrentPointers(mapRoadmapFromApi(nextDto)),
        });
      },
    );
  }, [canMutate, classItemId, enabled, orgId, roadmapQuery.data, queryClient, schoolId]);

  const doc = roadmapQuery.data?.doc ?? defaultClassRoadmapDocument();

  const persist = useCallback(
    (next: ClassRoadmapDocument) => {
      if (!canMutate) return;
      const normalized = withCurrentPointers(next);
      queryClient.setQueryData(schoolQueryKeys.classRoadmap(orgId, schoolId, classItemId), {
        dto: roadmapQuery.data?.dto,
        doc: normalized,
      });
      saveMutation.mutate(normalized);
    },
    [canMutate, classItemId, orgId, queryClient, roadmapQuery.data?.dto, saveMutation, schoolId],
  );

  const addSection = useCallback(() => {
    const section = createEmptyRoadmapSection(doc.sections.length);
    persist({
      ...doc,
      sections: [...doc.sections, section],
    });
  }, [doc, persist]);

  const updateSection = useCallback(
    (sectionId: string, patch: Partial<Pick<ClassRoadmapSection, "title" | "description" | "tags">>) => {
      persist({
        ...doc,
        sections: doc.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
      });
    },
    [doc, persist],
  );

  const toggleSectionCollapsed = useCallback(
    (sectionId: string) => {
      persist({
        ...doc,
        sections: doc.sections.map((s) =>
          s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s,
        ),
      });
    },
    [doc, persist],
  );

  const setCurrentPosition = useCallback(
    (sectionId: string, contentId: string | null = null) => {
      persist({
        ...doc,
        currentSectionId: sectionId,
        currentContentId: contentId,
        sections: doc.sections.map((s) =>
          s.id === sectionId ? { ...s, collapsed: false } : s,
        ),
      });
    },
    [doc, persist],
  );

  const toggleContentComplete = useCallback(
    (sectionId: string, contentId: string) => {
      const section = doc.sections.find((s) => s.id === sectionId);
      if (!section) return;

      const contents = section.contents.map((c) => {
        if (c.id !== contentId) return c;
        return { ...c, status: c.status === "completed" ? "pending" : "completed" } as ClassRoadmapContentItem;
      });

      const toggled = contents.find((c) => c.id === contentId);
      let nextContentId = doc.currentContentId;
      let nextSectionId = sectionId;

      if (toggled?.status === "completed") {
        const idx = contents.findIndex((c) => c.id === contentId);
        const next = contents.slice(idx + 1).find((c) => c.status !== "completed");
        if (next) {
          nextContentId = next.id;
        } else {
          const sectionIdx = doc.sections.findIndex((s) => s.id === sectionId);
          const nextSection = doc.sections[sectionIdx + 1];
          nextSectionId = nextSection?.id ?? sectionId;
          nextContentId = nextSection?.contents[0]?.id ?? null;
        }
      }

      persist({
        ...doc,
        currentSectionId: nextSectionId,
        currentContentId: nextContentId,
        sections: doc.sections.map((s) =>
          s.id === sectionId ? { ...s, contents, collapsed: false } : s,
        ),
      });
    },
    [doc, persist],
  );

  const addContent = useCallback(
    (sectionId: string, resource: ClassRoadmapSidebarResource) => {
      const contentType = contentTypeFromResource(resource);
      const content: ClassRoadmapContentItem = {
        id: `content_${crypto.randomUUID().slice(0, 8)}`,
        kind: resource.kind,
        contentType,
        title: resource.title,
        subtitle: resource.subtitle ?? null,
        sourceKey: resource.sourceKey,
        tags: [contentType],
        status: "pending",
      };
      persist({
        ...doc,
        sections: doc.sections.map((s) =>
          s.id === sectionId ? { ...s, contents: [...s.contents, content], collapsed: false } : s,
        ),
      });
    },
    [doc, persist],
  );

  const removeContent = useCallback(
    (sectionId: string, contentId: string) => {
      persist({
        ...doc,
        currentContentId: doc.currentContentId === contentId ? null : doc.currentContentId,
        sections: doc.sections.map((s) =>
          s.id === sectionId
            ? { ...s, contents: s.contents.filter((c) => c.id !== contentId) }
            : s,
        ),
      });
    },
    [doc, persist],
  );

  const reorderContent = useCallback(
    (sectionId: string, activeId: string, overId: string) => {
      if (activeId === overId) return;
      const section = doc.sections.find((s) => s.id === sectionId);
      if (!section) return;

      const oldIndex = section.contents.findIndex((c) => c.id === activeId);
      const newIndex = section.contents.findIndex((c) => c.id === overId);
      if (oldIndex < 0 || newIndex < 0) return;

      const nextContents = [...section.contents];
      const [moved] = nextContents.splice(oldIndex, 1);
      nextContents.splice(newIndex, 0, moved);

      persist({
        ...doc,
        sections: doc.sections.map((s) =>
          s.id === sectionId ? { ...s, contents: nextContents } : s,
        ),
      });
    },
    [doc, persist],
  );

  return {
    doc,
    hydrated: roadmapQuery.isSuccess,
    loading: roadmapQuery.isPending,
    saving: saveMutation.isPending,
    error: roadmapQuery.error ?? saveMutation.error,
    addSection,
    updateSection,
    toggleSectionCollapsed,
    setCurrentPosition,
    toggleContentComplete,
    addContent,
    removeContent,
    reorderContent,
    addPhase: addSection,
    updatePhase: updateSection,
    attachResource: addContent,
    detachResource: removeContent,
  };
}
