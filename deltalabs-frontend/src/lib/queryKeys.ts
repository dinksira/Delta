/**
 * Stable, namespaced React Query keys. Module hooks should extend these patterns:
 * `["module", "resource", ...params]`.
 */
export const queryKeys = {
  root: ["dl"] as const,
  health: () => [...queryKeys.root, "health"] as const,
} as const;
