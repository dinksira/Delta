/**
 * useChampionship
 * Query hook for the Championship game mode (`/v1/competitions/championship`).
 * Falls back to a deterministic local demo season when the endpoint is not
 * available yet, so the Championship flow is always viewable.
 *
 * @example
 * ```ts
 * const { data, isLoading, isError } = useChampionship();
 * ```
 */

import { useQuery } from "@tanstack/react-query";

import { fetchChampionship } from "@/modules/Competition/api";
import { championshipQueryKeys } from "@/modules/Competition/hooks/championshipQueryKeys";
import type { ChampionshipApiResponse } from "@/modules/Competition/types/championship";

export const FALLBACK_CHAMPIONSHIP: ChampionshipApiResponse = {
  season: {
    id: "season_demo_3",
    number: 3,
    title: "Rise of the Titans",
    status: "active",
    startsAt: "2026-09-01T00:00:00Z",
    endsAt: "2026-11-30T23:59:59Z",
    totalStages: 5,
    completedStages: 2,
    currentStageOrder: 3,
    pointsEarned: 500,
    totalPoints: 1000,
    playerRank: 4,
    totalPlayers: 128,
  },
  stages: [
    {
      id: "stage_3_r1",
      order: 1,
      name: "Qualifier Round",
      shortLabel: "R1",
      status: "completed",
      startsAt: "2026-09-01T00:00:00Z",
      pointsToEarn: 200,
      pointsEarned: 200,
      isCurrent: false,
      battleId: "tb_demo_math_olympiad",
      entryFee: "Free",
      prizePool: "ETB 12",
    },
    {
      id: "stage_3_r2",
      order: 2,
      name: "Round of 32",
      shortLabel: "R32",
      status: "completed",
      startsAt: "2026-09-15T00:00:00Z",
      pointsToEarn: 300,
      pointsEarned: 300,
      isCurrent: false,
      battleId: "tb_demo_ml_club",
      entryFee: "Free",
      prizePool: "ETB 25",
    },
    {
      id: "stage_3_r3",
      order: 3,
      name: "Round of 16",
      shortLabel: "R16",
      status: "unlocked",
      startsAt: "2026-09-28T00:00:00Z",
      pointsToEarn: 200,
      pointsEarned: 0,
      isCurrent: true,
      battleId: "tb_demo_bio_cells",
      entryFee: "Free",
      prizePool: "ETB 50",
    },
    {
      id: "stage_3_qf",
      order: 4,
      name: "Quarterfinals",
      shortLabel: "QF",
      status: "locked",
      startsAt: "2026-10-12T00:00:00Z",
      pointsToEarn: 200,
      pointsEarned: 0,
      isCurrent: false,
      battleId: "tb_demo_ast_planets",
      entryFee: "Free",
      prizePool: "ETB 100",
    },
    {
      id: "stage_3_sf",
      order: 5,
      name: "Semifinals & Grand Final",
      shortLabel: "F",
      status: "locked",
      startsAt: "2026-10-26T00:00:00Z",
      pointsToEarn: 100,
      pointsEarned: 0,
      isCurrent: false,
      battleId: "tb_demo_alg_sorting",
      entryFee: "Free",
      prizePool: "ETB 250",
    },
  ],
  standings: [
    { rank: 1, name: "Lina Petrova", points: 780 },
    { rank: 2, name: "Ken Nakamura", points: 745 },
    { rank: 3, name: "Elena Okafor", points: 690 },
    { rank: 4, name: "You", points: 500, isCurrentUser: true },
    { rank: 5, name: "Omar Farouk", points: 480 },
    { rank: 6, name: "Sara Hailu", points: 455 },
    { rank: 7, name: "Juan Rivera", points: 430 },
    { rank: 8, name: "Grace Adeyemi", points: 395 },
  ],
  nextSeason: {
    number: 4,
    title: "Crown of the Delta",
    isUnlocked: false,
    unlockHint: "Complete Season 3 to unlock Season 4 and claim your points.",
  },
};

export function useChampionship() {
  return useQuery({
    queryKey: championshipQueryKeys.all,
    queryFn: fetchChampionship,
    staleTime: 30_000,
  });
}