import type { ManagementTableInstanceBundleDto } from "@/modules/School/api";

/** Must match deltalabs-backend `MANAGEMENT_TABLE_KIND_*` values. */
export const MANAGEMENT_TABLE_WORKSPACE_KIND = {
  management: "management",
  students: "students",
  parents: "parents",
  teachers: "teachers",
  leaveRequests: "leave_requests",
  grades: "grades",
  schedules: "schedules",
  assignments: "assignments",
} as const;

export type ManagementTableWorkspaceKind =
  (typeof MANAGEMENT_TABLE_WORKSPACE_KIND)[keyof typeof MANAGEMENT_TABLE_WORKSPACE_KIND];

export function readInstanceTableKind(
  instance: Readonly<{ tableKind?: string | null }>,
): ManagementTableWorkspaceKind | "management" {
  const raw = instance.tableKind?.trim();
  if (!raw) return MANAGEMENT_TABLE_WORKSPACE_KIND.management;
  const values = Object.values(MANAGEMENT_TABLE_WORKSPACE_KIND) as string[];
  if (values.includes(raw)) return raw as ManagementTableWorkspaceKind;
  return MANAGEMENT_TABLE_WORKSPACE_KIND.management;
}

export function instanceMatchesTableKind(
  instance: Readonly<{ tableKind?: string | null }>,
  expected: ManagementTableWorkspaceKind,
): boolean {
  return readInstanceTableKind(instance) === expected;
}

export function bundleMatchesTableKind(
  bundle: ManagementTableInstanceBundleDto,
  expected: ManagementTableWorkspaceKind,
): boolean {
  return instanceMatchesTableKind(bundle.instance, expected);
}
