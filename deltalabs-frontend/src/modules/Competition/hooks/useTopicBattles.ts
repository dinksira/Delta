/**
 * Query hook for the topic battle list.
 *
 * @example
 * ```ts
 * const { data, isLoading, error } = useTopicBattles();
 * ```
 */

import { useQuery } from "@tanstack/react-query";

import { fetchTopicBattles } from "@/modules/Competition/api";
import { topicBattleQueryKeys } from "@/modules/Competition/hooks/topicBattleQueryKeys";

export function useTopicBattles() {
  return useQuery({
    queryKey: topicBattleQueryKeys.list,
    queryFn: fetchTopicBattles,
    staleTime: 30_000,
  });
}
