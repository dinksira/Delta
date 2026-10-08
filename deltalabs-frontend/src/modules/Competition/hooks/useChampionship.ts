/**
 * useChampionship
 * Query hook for the Championship game mode (`/v1/competitions/championship`).
 * Standings and the rank badge are computed server-side from real stored user
 * stats, so an empty ladder renders empty rather than a canned list of names.
 *
 * @example
 * ```ts
 * const { data, isLoading, isError } = useChampionship();
 * ```
 */

import { useQuery } from "@tanstack/react-query";

import { fetchChampionship } from "@/modules/Competition/api";
import { championshipQueryKeys } from "@/modules/Competition/hooks/championshipQueryKeys";

export function useChampionship() {
  return useQuery({
    queryKey: championshipQueryKeys.all,
    queryFn: fetchChampionship,
    staleTime: 30_000,
  });
}
