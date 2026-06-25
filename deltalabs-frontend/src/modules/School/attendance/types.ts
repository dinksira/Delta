/** Frontend-only attendance models — persisted via class attendance API. */

import type { AttendanceFormulaConfig, AttendanceRealtimeTrackConfig } from "@/modules/School/attendance/attendanceColumnConfig";
import {
  DEFAULT_ATTENDANCE_FORMULA_CONFIG,
  DEFAULT_REALTIME_TRACK_CONFIG,
} from "@/modules/School/attendance/attendanceColumnConfig";

export type {
  AttendanceFormulaConfig,
  AttendanceFormulaMode,
  AttendanceFormulaOperation,
  AttendanceRealtimeTrackConfig,
  AttendanceFaceDetectionSettings,
} from "@/modules/School/attendance/attendanceColumnConfig";

export type ClassAttendanceView = "sessions" | "leave" | "devices";

export type AttendanceMarkStatus = "present" | "absent" | "late";

export type AttendanceDeviceType = "qr_scanner" | "fingerprint" | "other";

export type AttendanceDeviceStatus = "online" | "offline";

export type AttendanceSessionTracking = "manual" | "device";

export type AttendanceSessionRecord = Readonly<{
  id: string;
  title: string;
  scheduledAt: string | null;
  /** When true, column header shows hidden (eye-off) — still visible to managers. */
  hidden: boolean;
  /** Manual = checkbox marks; device = auto track from hardware (grey cells). */
  trackingMode: AttendanceSessionTracking;
  createdAt: string;
}>;

export type AttendanceDeviceRecord = Readonly<{
  id: string;
  name: string;
  deviceType: AttendanceDeviceType;
  attendanceSessionLabel: string;
  status: AttendanceDeviceStatus;
  lastSyncedAt: string | null;
  createdAt: string;
}>;

export type AttendanceStudentRow = Readonly<{
  id: string;
  label: string;
}>;

export type ClassAttendanceState = Readonly<{
  sessions: readonly AttendanceSessionRecord[];
  devices: readonly AttendanceDeviceRecord[];
  /** Key: `${studentId}:${sessionId}` */
  marks: Readonly<Record<string, AttendanceMarkStatus>>;
  /** User-defined formula column (sum / average / count over session columns). */
  formulaConfig: AttendanceFormulaConfig;
  /** Realtime track column — face/voice auto attendance config. */
  realtimeTrack: AttendanceRealtimeTrackConfig;
}>;

export const EMPTY_CLASS_ATTENDANCE_STATE: ClassAttendanceState = {
  sessions: [],
  devices: [],
  marks: {},
  formulaConfig: DEFAULT_ATTENDANCE_FORMULA_CONFIG,
  realtimeTrack: DEFAULT_REALTIME_TRACK_CONFIG,
};
