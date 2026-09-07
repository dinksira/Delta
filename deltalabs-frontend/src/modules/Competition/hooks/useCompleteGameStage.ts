/**
 * useCompleteGameStage
 * Mutation that completes the currently unlocked stage of a game ladder, which
 * credits the stage's points + ETB prize and unlocks the next stage. Refreshes
 * the Games lobby query so the ladder re-renders.
 *
 * @example
 * ```ts
 * const complete = useCompleteGameStage();
 * complete.mutate(gameId, {
 *   onSuccess: () => router.push(`/features/competitions/games/${gameId}`),
 * });
 * ```
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { completeGameStage } from "@/modules/Competition/api";
import { gamesQueryKeys } from "@/modules/Competition/hooks/gamesQueryKeys";

export function useCompleteGameStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { gameId: string; stageOrder: number }) =>
      completeGameStage(payload.gameId, payload.stageOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["competitions", "hub"] });
    },
  });
}