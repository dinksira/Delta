import type { ClassAttendanceStateDto } from "@/modules/School/api";
import type { ClassAttendanceState } from "@/modules/School/attendance/types";

/** Map API attendance payload to frontend state shape. */
export function mapClassAttendanceStateFromApi(dto: ClassAttendanceStateDto): ClassAttendanceState {
  return {
    sessions: dto.sessions.map((s) => ({
      id: s.id,
      title: s.title,
      scheduledAt: s.scheduledAt,
      hidden: s.hidden,
      trackingMode: s.trackingMode,
      createdAt: s.createdAt,
    })),
    devices: dto.devices.map((d) => ({
      id: d.id,
      name: d.name,
      deviceType: d.deviceType,
      attendanceSessionLabel: d.attendanceSessionLabel,
      status: d.status,
      lastSyncedAt: d.lastSyncedAt,
      createdAt: d.createdAt,
    })),
    marks: { ...dto.marks },
    formulaConfig: {
      mode: dto.formulaConfig.mode,
      operation: dto.formulaConfig.operation,
      sessionIds: [...dto.formulaConfig.sessionIds],
      customExpression: dto.formulaConfig.customExpression,
    },
    realtimeTrack: {
      enabled: dto.realtimeTrack.enabled,
      faceDetection: dto.realtimeTrack.faceDetection,
      voiceRecognition: dto.realtimeTrack.voiceRecognition,
      recordVideo: dto.realtimeTrack.recordVideo,
      recordAudio: dto.realtimeTrack.recordAudio,
      faceDetectionSettings: { ...dto.realtimeTrack.faceDetectionSettings },
    },
  };
}
