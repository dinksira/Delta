"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import {
  fetchClassAttendanceState,
  patchClassAttendanceMark,
  putClassAttendanceFormulaConfig,
  putClassAttendanceRealtimeTrack,
  registerClassAttendanceDevice,
  updateClassAttendanceSessionSettings,
} from "@/modules/School/api";
import { mapClassAttendanceStateFromApi } from "@/modules/School/attendance/attendanceApiMap";
import { markKey } from "@/modules/School/attendance/classAttendanceStorage";
import type {
  AttendanceDeviceType,
  AttendanceMarkStatus,
  AttendanceSessionTracking,
  ClassAttendanceState,
} from "@/modules/School/attendance/types";
import { EMPTY_CLASS_ATTENDANCE_STATE } from "@/modules/School/attendance/types";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

export function useClassAttendanceState({
  orgId,
  schoolId,
  classItemId,
}: Readonly<{
  orgId: string;
  schoolId: string;
  classItemId: string;
}>) {
  const queryClient = useQueryClient();
  const queryKey = schoolQueryKeys.classAttendance(orgId, schoolId, classItemId);
  const enabled = Boolean(orgId && schoolId && classItemId);

  const attendanceQuery = useQuery({
    queryKey,
    queryFn: async () => mapClassAttendanceStateFromApi(await fetchClassAttendanceState(orgId, schoolId, classItemId)),
    enabled,
    staleTime: 10_000,
  });

  const applyState = useCallback(
    (next: ClassAttendanceState) => {
      queryClient.setQueryData(queryKey, next);
    },
    [queryClient, queryKey],
  );

  const updateSessionSettingsMutation = useMutation({
    mutationFn: (input: {
      classSessionId: string;
      hidden?: boolean;
      trackingMode?: AttendanceSessionTracking;
    }) =>
      updateClassAttendanceSessionSettings(orgId, schoolId, classItemId, {
        classSessionId: input.classSessionId,
        hidden: input.hidden,
        trackingMode: input.trackingMode,
      }),
    onSuccess: (dto) => applyState(mapClassAttendanceStateFromApi(dto)),
  });

  const registerDeviceMutation = useMutation({
    mutationFn: (input: {
      name: string;
      deviceType: AttendanceDeviceType;
      attendanceSessionLabel: string;
    }) =>
      registerClassAttendanceDevice(orgId, schoolId, classItemId, {
        name: input.name,
        deviceType: input.deviceType,
        attendanceSessionLabel: input.attendanceSessionLabel,
      }),
    onSuccess: (dto) => applyState(mapClassAttendanceStateFromApi(dto)),
  });

  const patchMarkMutation = useMutation({
    mutationFn: (input: { studentId: string; sessionId: string; status: AttendanceMarkStatus | null }) =>
      patchClassAttendanceMark(orgId, schoolId, classItemId, input),
    onSuccess: (dto) => applyState(mapClassAttendanceStateFromApi(dto)),
  });

  const formulaConfigMutation = useMutation({
    mutationFn: (formulaConfig: ClassAttendanceState["formulaConfig"]) =>
      putClassAttendanceFormulaConfig(orgId, schoolId, classItemId, {
        mode: formulaConfig.mode,
        operation: formulaConfig.operation,
        sessionIds: [...formulaConfig.sessionIds],
        customExpression: formulaConfig.customExpression,
      }),
    onSuccess: (dto) => applyState(mapClassAttendanceStateFromApi(dto)),
  });

  const realtimeTrackMutation = useMutation({
    mutationFn: (realtimeTrack: ClassAttendanceState["realtimeTrack"]) =>
      putClassAttendanceRealtimeTrack(orgId, schoolId, classItemId, {
        enabled: realtimeTrack.enabled,
        faceDetection: realtimeTrack.faceDetection,
        voiceRecognition: realtimeTrack.voiceRecognition,
        recordVideo: realtimeTrack.recordVideo,
        recordAudio: realtimeTrack.recordAudio,
        faceDetectionSettings: { ...realtimeTrack.faceDetectionSettings },
      }),
    onSuccess: (dto) => applyState(mapClassAttendanceStateFromApi(dto)),
  });

  const state = attendanceQuery.data ?? EMPTY_CLASS_ATTENDANCE_STATE;

  const updateSessionSettings = useCallback(
    (input: {
      classSessionId: string;
      hidden?: boolean;
      trackingMode?: AttendanceSessionTracking;
    }) => {
      updateSessionSettingsMutation.mutate(input);
    },
    [updateSessionSettingsMutation],
  );

  const registerDevice = useCallback(
    (input: { name: string; deviceType: AttendanceDeviceType; attendanceSessionLabel: string }) => {
      registerDeviceMutation.mutate(input);
    },
    [registerDeviceMutation],
  );

  const toggleMark = useCallback(
    (studentId: string, sessionId: string, canMutate: boolean) => {
      if (!canMutate || patchMarkMutation.isPending) return;
      const key = markKey(studentId, sessionId);
      const current = state.marks[key];
      const order: (AttendanceMarkStatus | undefined)[] = [undefined, "present", "absent", "late"];
      const idx = order.indexOf(current);
      const nextStatus = order[(idx + 1) % order.length] ?? null;
      patchMarkMutation.mutate({
        studentId,
        sessionId,
        status: nextStatus ?? null,
      });
    },
    [patchMarkMutation, state.marks],
  );

  const updateFormulaConfig = useCallback(
    (formulaConfig: ClassAttendanceState["formulaConfig"]) => {
      formulaConfigMutation.mutate(formulaConfig);
    },
    [formulaConfigMutation],
  );

  const updateRealtimeTrack = useCallback(
    (realtimeTrack: ClassAttendanceState["realtimeTrack"]) => {
      realtimeTrackMutation.mutate(realtimeTrack);
    },
    [realtimeTrackMutation],
  );

  const updateFaceDetectionSettings = useCallback(
    (faceDetectionSettings: ClassAttendanceState["realtimeTrack"]["faceDetectionSettings"]) => {
      realtimeTrackMutation.mutate({
        ...state.realtimeTrack,
        faceDetectionSettings,
      });
    },
    [realtimeTrackMutation, state.realtimeTrack],
  );

  const mutating =
    updateSessionSettingsMutation.isPending ||
    registerDeviceMutation.isPending ||
    patchMarkMutation.isPending ||
    formulaConfigMutation.isPending ||
    realtimeTrackMutation.isPending;

  return {
    state,
    loading: attendanceQuery.isPending && !attendanceQuery.data,
    error: attendanceQuery.isError,
    mutating,
    updateSessionSettings,
    registerDevice,
    toggleMark,
    updateFormulaConfig,
    updateRealtimeTrack,
    updateFaceDetectionSettings,
  };
}
