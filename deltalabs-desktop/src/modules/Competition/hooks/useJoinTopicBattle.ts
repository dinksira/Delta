/**
 * Mutation hook for joining a topic battle.
 *
 * @example
 * ```ts
 * const { mutate, isPending } = useJoinTopicBattle();
 * mutate("tb_abc");
 * ```
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { joinTopicBattle } from "@/modules/Competition/api";
import { topicBattleQueryKeys } from "@/modules/Competition/hooks/topicBattleQueryKeys";

export function useJoinTopicBattle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinTopicBattle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicBattleQueryKeys.list });
    },
  });
}
