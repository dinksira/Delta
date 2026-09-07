/**
 * useCreateChampionship
 * Mutation hook for hosting a brand-new Championship season
 * (`POST /v1/competitions/championship`). On success the championship query
 * is refreshed so the freshly launched season renders immediately.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createChampionship } from "@/modules/Competition/api";
import { championshipQueryKeys } from "@/modules/Competition/hooks/championshipQueryKeys";
import { gamesQueryKeys } from "@/modules/Competition/hooks/gamesQueryKeys";
import type { CreateChampionshipPayload } from "@/modules/Competition/types/championship";

export function useCreateChampionship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChampionshipPayload) => createChampionship(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: championshipQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: gamesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["competitions", "hub"] });
    },
  });
}