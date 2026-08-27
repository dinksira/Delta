/**
 * managementTableWorkspaceKind.ts
 *
 * Workspace-kind constants and helpers for routing management-table
 * instances to the correct UI module (management, competitions, etc.).
 *
 * @example
 * ```tsx
 * const kind = readInstanceTableKind(instance);
 * ```
 */

import type { CompetitionManagementTableInstanceBundleDto } from "@/modules/Competition/managementTable/types";

// ===== CONSTANTS =====

/** Must match deltalabs-backend `MANAGEMENT_TABLE_KIND_*` values. */
export const MANAGEMENT_TABLE_WORKSPACE_KIND = {
  management: "management",
  competitions: "competitions",
} as const;

export type ManagementTableWorkspaceKind =
  (typeof MANAGEMENT_TABLE_WORKSPACE_KIND)[keyof typeof MANAGEMENT_TABLE_WORKSPACE_KIND];

// ===== HELPERS =====

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
  bundle: CompetitionManagementTableInstanceBundleDto,
  expected: ManagementTableWorkspaceKind,
): boolean {
  return instanceMatchesTableKind(bundle.instance, expected);
}
