/** TanStack Query keys for the Features hub. */
export const featuresQueryKeys = {
  list: (userId: string) => ["features", "list", userId] as const,
} as const;
