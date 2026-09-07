/**
 * useCompleteChampionshipStage
 * Mutation that completes the currently unlocked Championship stage on the
 * backend, which credits the stage's points + ETB prize and unlocks the next
 * stage. Refreshes the Championship query so the stage ladder re-renders.
 *
 * @example
 * ```ts
 * const complete = useCompleteChampionshipStage();
 * complete.mutate(stage.order, { onSuccess: () => router.push("/features/competitions/championship") });
 * ```
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { completeChampionshipStage } from "@/modules/Competition/api";
import { championshipQueryKeys } from "@/modules/Competition/hooks/championshipQueryKeys";

export function useCompleteChampionshipStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeChampionshipStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: championshipQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: championshipQueryKeys.detail("season") });
      queryClient.invalidateQueries({ queryKey: ["competitions", "games"] });
      queryClient.invalidateQueries({ queryKey: ["competitions", "hub"] });
    },
  });
}