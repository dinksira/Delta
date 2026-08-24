"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchManagementTableRows } from "@/modules/School/api";
import { readStudentsTableInstanceId } from "@/modules/School/students/studentsTableMeta";
import type { AttendanceStudentRow } from "@/modules/School/attendance/types";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

function studentLabelFromCell(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const fullName = typeof o.fullName === "string" ? o.fullName.trim() : "";
  if (fullName) return fullName;
  const username = typeof o.username === "string" ? o.username.trim() : "";
  if (username) return username;
  const userId = typeof o.userId === "string" ? o.userId.trim() : "";
  return userId || null;
}

function studentIdFromCell(value: unknown, fallback: string): string {
  if (value && typeof value === "object") {
    const userId = (value as Record<string, unknown>).userId;
    if (typeof userId === "string" && userId.trim()) return userId.trim();
  }
  return fallback;
}

/** Loads student rows from the class students MT when bootstrapped; otherwise empty. */
export function useClassAttendanceStudents({
  orgId,
  schoolId,
  classMetadata,
}: Readonly<{
  orgId: string;
  schoolId: string;
  classMetadata: Record<string, unknown> | null | undefined;
}>) {
  const instanceId = readStudentsTableInstanceId(classMetadata);
  const studentColumnId =
    typeof classMetadata?.studentsTableStudentColumnId === "string"
      ? classMetadata.studentsTableStudentColumnId
      : typeof classMetadata?.students_table_student_column_id === "string"
        ? classMetadata.students_table_student_column_id
        : null;

  const rowsQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableRows(orgId, schoolId, instanceId ?? "none", "mtg_main", 1),
    queryFn: () => fetchManagementTableRows(orgId, schoolId, instanceId!, 1, 500, "mtg_main"),
    enabled: Boolean(orgId && schoolId && instanceId),
    staleTime: 15_000,
  });

  const students: readonly AttendanceStudentRow[] = (() => {
    if (!rowsQuery.data?.items.length || !studentColumnId) return [];
    return rowsQuery.data.items
      .map((row, index) => {
        const cell = row.cells[studentColumnId];
        const label = studentLabelFromCell(cell);
        if (!label) return null;
        return {
          id: studentIdFromCell(cell, row.id),
          label,
        };
      })
      .filter((row): row is AttendanceStudentRow => row !== null);
  })();

  return {
    students,
    loading: Boolean(instanceId) && rowsQuery.isPending,
    hasStudentsTable: Boolean(instanceId),
  };
}
