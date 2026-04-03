/** TanStack Query keys for feed stream and per-clip resources. */
export const feedQueryKeys = {
  all: ["feed"] as const,
  clips: () => [...feedQueryKeys.all, "clips"] as const,
  comments: (clipId: string) => [...feedQueryKeys.all, "comments", clipId] as const,
} as const;
