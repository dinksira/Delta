"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  bootstrapAssignmentsTableWorkspaceItem,
  bootstrapSchedulesTableWorkspaceItem,
  fetchClassRoadmapResources,
} from "@/modules/School/api";
import { readAssignmentsTableInstanceId } from "@/modules/School/assignments/assignmentsTableMeta";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { readSchedulesTableInstanceId } from "@/modules/School/schedules/schedulesTableMeta";
import { mapRoadmapResourcesFromApi } from "@/modules/School/roadmap/classRoadmapMappers";

export function useClassRoadmapResources({
  orgId,
  schoolId,
  classItemId,
  classMetadata,
  canMutate,
}: Readonly<{
  orgId: string;
  schoolId: string;
  classItemId: string;
  classMetadata: Record<string, unknown> | null | undefined;
  canMutate: boolean;
}>) {
  const queryClient = useQueryClient();
  const enabled = Boolean(orgId && schoolId && classItemId);

  const bootstrapMutation = useMutation({
    mutationFn: async () => {
      const tasks: Promise<unknown>[] = [];
      if (!readAssignmentsTableInstanceId(classMetadata)) {
        tasks.push(bootstrapAssignmentsTableWorkspaceItem(orgId, schoolId, classItemId));
      }
      if (!readSchedulesTableInstanceId(classMetadata)) {
        tasks.push(bootstrapSchedulesTableWorkspaceItem(orgId, schoolId, classItemId));
      }
      await Promise.all(tasks);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItem(orgId, schoolId, classItemId),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.classRoadmapResources(orgId, schoolId, classItemId),
      });
    },
  });

  useEffect(() => {
    if (!enabled || !canMutate || bootstrapMutation.isPending) return;
    const needsAssignments = !readAssignmentsTableInstanceId(classMetadata);
    const needsSchedules = !readSchedulesTableInstanceId(classMetadata);
    if (needsAssignments || needsSchedules) {
      bootstrapMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, canMutate, classMetadata, classItemId]);

  const resourcesQuery = useQuery({
    queryKey: schoolQueryKeys.classRoadmapResources(orgId, schoolId, classItemId),
    queryFn: async () => mapRoadmapResourcesFromApi(await fetchClassRoadmapResources(orgId, schoolId, classItemId)),
    enabled,
    staleTime: 15_000,
  });

  return {
    sessions: resourcesQuery.data?.sessions ?? [],
    courses: resourcesQuery.data?.courses ?? [],
    materials: resourcesQuery.data?.materials ?? [],
    loading: resourcesQuery.isPending || bootstrapMutation.isPending,
    error: resourcesQuery.error,
  };
}
