import {
  DEFAULT_ATTENDANCE_FORMULA_CONFIG,
  DEFAULT_FACE_DETECTION_SETTINGS,
  DEFAULT_REALTIME_TRACK_CONFIG,
} from "@/modules/School/attendance/attendanceColumnConfig";
import {
  EMPTY_CLASS_ATTENDANCE_STATE,
  type ClassAttendanceState,
  type AttendanceMarkStatus,
} from "@/modules/School/attendance/types";

const STORAGE_PREFIX = "dl.classAttendance.v1";

function storageKey(classItemId: string): string {
  return `${STORAGE_PREFIX}:${classItemId.trim()}`;
}

function parseState(raw: unknown): ClassAttendanceState {
  if (!raw || typeof raw !== "object") return EMPTY_CLASS_ATTENDANCE_STATE;
  const o = raw as Record<string, unknown>;
  const sessions = Array.isArray(o.sessions)
    ? (o.sessions as Record<string, unknown>[]).map((s) => ({
        id: String(s.id ?? ""),
        title: String(s.title ?? ""),
        scheduledAt: typeof s.scheduledAt === "string" ? s.scheduledAt : null,
        hidden: Boolean(s.hidden),
        trackingMode: s.trackingMode === "device" ? ("device" as const) : ("manual" as const),
        createdAt: String(s.createdAt ?? new Date().toISOString()),
      }))
    : [];
  return {
    sessions,
    devices: Array.isArray(o.devices) ? (o.devices as ClassAttendanceState["devices"]) : [],
    marks: o.marks && typeof o.marks === "object" ? (o.marks as Record<string, AttendanceMarkStatus>) : {},
    formulaConfig: parseFormulaConfig(o.formulaConfig),
    realtimeTrack: parseRealtimeTrack(o.realtimeTrack),
  };
}

function parseFormulaConfig(raw: unknown): ClassAttendanceState["formulaConfig"] {
  if (!raw || typeof raw !== "object") return DEFAULT_ATTENDANCE_FORMULA_CONFIG;
  const o = raw as Record<string, unknown>;
  const op = o.operation;
  const operation =
    op === "average" || op === "count_present" || op === "sum" ? op : DEFAULT_ATTENDANCE_FORMULA_CONFIG.operation;
  const sessionIds = Array.isArray(o.sessionIds) ? o.sessionIds.map(String) : [];
  const mode = o.mode === "custom" ? "custom" : "preset";
  const customExpression = typeof o.customExpression === "string" ? o.customExpression : "";
  return { mode, operation, sessionIds, customExpression };
}

function parseRealtimeTrack(raw: unknown): ClassAttendanceState["realtimeTrack"] {
  if (!raw || typeof raw !== "object") return DEFAULT_REALTIME_TRACK_CONFIG;
  const o = raw as Record<string, unknown>;
  const fds = o.faceDetectionSettings;
  let faceDetectionSettings = DEFAULT_FACE_DETECTION_SETTINGS;
  if (fds && typeof fds === "object") {
    const f = fds as Record<string, unknown>;
    faceDetectionSettings = {
      section: typeof f.section === "string" ? f.section : "all",
      trackOption: f.trackOption === "continuous" ? "continuous" : "random_sampling",
      samplingIntervalMinutes: typeof f.samplingIntervalMinutes === "number" ? f.samplingIntervalMinutes : 5,
      presenceThresholdPercent: typeof f.presenceThresholdPercent === "number" ? f.presenceThresholdPercent : 80,
    };
  }
  return {
    enabled: Boolean(o.enabled),
    faceDetection: Boolean(o.faceDetection),
    voiceRecognition: Boolean(o.voiceRecognition),
    recordVideo: Boolean(o.recordVideo),
    recordAudio: Boolean(o.recordAudio),
    faceDetectionSettings,
  };
}

export function loadClassAttendanceState(classItemId: string): ClassAttendanceState {
  if (typeof window === "undefined") return EMPTY_CLASS_ATTENDANCE_STATE;
  try {
    const raw = window.localStorage.getItem(storageKey(classItemId));
    if (!raw) return EMPTY_CLASS_ATTENDANCE_STATE;
    return parseState(JSON.parse(raw));
  } catch {
    return EMPTY_CLASS_ATTENDANCE_STATE;
  }
}

export function saveClassAttendanceState(classItemId: string, state: ClassAttendanceState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(classItemId), JSON.stringify(state));
}

export function markKey(studentId: string, sessionId: string): string {
  return `${studentId}:${sessionId}`;
}
