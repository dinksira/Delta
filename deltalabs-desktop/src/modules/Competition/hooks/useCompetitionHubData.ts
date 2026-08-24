/**
 * Query hook for the competition hub aggregate (`/v1/competitions/hub`).
 *
 * @example
 * ```ts
 * const { query, modes, userStatus, achievements, myBattles } = useCompetitionHubData();
 * ```
 */

import { useQuery } from "@tanstack/react-query";

import { fetchCompetitionHub } from "@/modules/Competition/api";
import { competitionHubQueryKeys } from "@/modules/Competition/hooks/competitionHubQueryKeys";
import type { Achievement, GameMode, UserStatus } from "@/modules/Competition/types/hub";
import type { TopicBattle } from "@/modules/Competition/types/topicBattle";

const EMPTY_MODES: GameMode[] = [];
const EMPTY_ACHIEVEMENTS: Achievement[] = [];
const EMPTY_MY_BATTLES: TopicBattle[] = [];

export const FALLBACK_USER_STATUS: UserStatus = {
  level: 1,
  rank: "Bronze I",
  progressLabel: "Progress",
  progressValue: 0,
  progressText: "0/100 PTS",
  earnings: "0 ETB",
  won: 0,
};

export function useCompetitionHubData() {
  const query = useQuery({
    queryKey: competitionHubQueryKeys.hub,
    queryFn: fetchCompetitionHub,
    staleTime: 30_000,
  });

  const data = query.data;

  return {
    query,
    modes: data?.modes ?? EMPTY_MODES,
    userStatus: data?.userStatus ?? FALLBACK_USER_STATUS,
    achievements: data?.achievements ?? EMPTY_ACHIEVEMENTS,
    myBattles: data?.myBattles ?? EMPTY_MY_BATTLES,
  };
}
