/** Formula column — user-defined calculation over session columns (Monday.com-style). */

export type AttendanceFormulaOperation = "sum" | "average" | "count_present";

export type AttendanceFormulaMode = "preset" | "custom";

export type AttendanceFormulaConfig = Readonly<{
  /** Quick SUM/AVERAGE/COUNT or free-form expression. */
  mode: AttendanceFormulaMode;
  /** Used when mode === preset */
  operation: AttendanceFormulaOperation;
  /** Session column ids included in preset. Empty = all sessions. */
  sessionIds: readonly string[];
  /** Used when mode === custom — e.g. `{Session 1} * 0.5 + {Session 2}` */
  customExpression: string;
}>;

export const DEFAULT_ATTENDANCE_FORMULA_CONFIG: AttendanceFormulaConfig = {
  mode: "preset",
  operation: "sum",
  sessionIds: [],
  customExpression: "",
};

export type AttendanceFaceTrackOption = "random_sampling" | "continuous";

export type AttendanceFaceDetectionSettings = Readonly<{
  section: string;
  trackOption: AttendanceFaceTrackOption;
  samplingIntervalMinutes: number;
  presenceThresholdPercent: number;
}>;

export const DEFAULT_FACE_DETECTION_SETTINGS: AttendanceFaceDetectionSettings = {
  section: "all",
  trackOption: "random_sampling",
  samplingIntervalMinutes: 5,
  presenceThresholdPercent: 80,
};

/** Realtime track column — configure automated attendance capture. */
export type AttendanceRealtimeTrackConfig = Readonly<{
  enabled: boolean;
  faceDetection: boolean;
  voiceRecognition: boolean;
  recordVideo: boolean;
  recordAudio: boolean;
  faceDetectionSettings: AttendanceFaceDetectionSettings;
}>;

export const DEFAULT_REALTIME_TRACK_CONFIG: AttendanceRealtimeTrackConfig = {
  enabled: false,
  faceDetection: false,
  voiceRecognition: false,
  recordVideo: false,
  recordAudio: false,
  faceDetectionSettings: DEFAULT_FACE_DETECTION_SETTINGS,
};
