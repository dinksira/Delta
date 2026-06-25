import type { AttendanceFormulaConfig, AttendanceFormulaOperation } from "@/modules/School/attendance/attendanceColumnConfig";
import { evaluateCustomFormulaExpression } from "@/modules/School/attendance/attendanceFormulaExpression";
import { markKey } from "@/modules/School/attendance/classAttendanceStorage";
import type { AttendanceMarkStatus, AttendanceSessionRecord } from "@/modules/School/attendance/types";

/** Numeric value for a session cell when used in formulas (present/late = 1, absent/empty = 0). */
export function markNumericValue(status: AttendanceMarkStatus | undefined): number {
  if (status === "present" || status === "late") return 1;
  return 0;
}

export function formulaOperationLabel(op: AttendanceFormulaOperation): string {
  switch (op) {
    case "average":
      return "AVERAGE";
    case "count_present":
      return "COUNT";
    default:
      return "SUM";
  }
}

export function resolveFormulaSessionIds(
  config: AttendanceFormulaConfig,
  allSessions: readonly AttendanceSessionRecord[],
): readonly string[] {
  if (config.sessionIds.length > 0) return config.sessionIds;
  return allSessions.map((s) => s.id);
}

/** Display string for formula column header. */
export function formatFormulaExpression(
  config: AttendanceFormulaConfig,
  sessions: readonly AttendanceSessionRecord[],
): string {
  if (config.mode === "custom" && config.customExpression.trim()) {
    return config.customExpression.trim();
  }

  const ids = resolveFormulaSessionIds(config, sessions);
  const labels = ids
    .map((id) => sessions.find((s) => s.id === id)?.title ?? id)
    .map((t) => `{${t}}`);
  const fn = formulaOperationLabel(config.operation);
  if (labels.length === 0) return `${fn}()`;
  return `${fn}(${labels.join(", ")})`;
}

function evaluatePresetFormula(
  studentId: string,
  config: AttendanceFormulaConfig,
  sessions: readonly AttendanceSessionRecord[],
  marks: Readonly<Record<string, AttendanceMarkStatus>>,
): number {
  const sessionIds = resolveFormulaSessionIds(config, sessions);
  if (sessionIds.length === 0) return 0;

  const values = sessionIds.map((sessionId) => {
    const status = marks[markKey(studentId, sessionId)];
    return markNumericValue(status);
  });

  if (config.operation === "count_present") {
    return values.filter((v) => v > 0).length;
  }

  const sum = values.reduce((a, b) => a + b, 0);

  if (config.operation === "average") {
    return Math.round((sum / sessionIds.length) * 1000) / 1000;
  }

  return sum;
}

export function evaluateAttendanceFormula(
  studentId: string,
  config: AttendanceFormulaConfig,
  sessions: readonly AttendanceSessionRecord[],
  marks: Readonly<Record<string, AttendanceMarkStatus>>,
): number {
  if (config.mode === "custom" && config.customExpression.trim()) {
    try {
      return evaluateCustomFormulaExpression(config.customExpression, sessions, studentId, marks);
    } catch {
      return 0;
    }
  }

  return evaluatePresetFormula(studentId, config, sessions, marks);
}
