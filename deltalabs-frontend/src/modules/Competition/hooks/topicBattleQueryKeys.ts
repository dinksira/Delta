/** TanStack Query keys for topic battle data. */
export const topicBattleQueryKeys = {
  list: ["competitions", "topic-battles"] as const,
  detail: (id: string) => ["competitions", "topic-battles", id] as const,
} as const;
