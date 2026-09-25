/** TanStack Query keys for Championship hub data. */
export const championshipQueryKeys = {
  all: ["competitions", "championship"] as const,
  detail: (id: string) => ["competitions", "championship", id] as const,
} as const;