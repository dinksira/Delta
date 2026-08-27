/**
 * competitionQueryKeys.ts
 *
 * React Query keys for competition management table queries.
 *
 * @example
 * ```tsx
 * const keys = competitionQueryKeys.rows(orgId, instanceId, groupId);
 * ```
 */

// ===== QUERY KEYS =====

const PREFIX = ["competition", "management-tables"] as const;

export const competitionQueryKeys = {
  all: [...PREFIX] as const,

  definitions: (orgId: string) =>
    [...PREFIX, "definitions", orgId] as const,

  instanceBundle: (orgId: string, instanceId: string) =>
    [...PREFIX, "instance", orgId, instanceId] as const,

  rows: (orgId: string, instanceId: string, groupId: string) =>
    [...PREFIX, "rows", orgId, instanceId, groupId] as const,
} as const;