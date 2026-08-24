/**
 * Hub data hook combining the topic battle list with the `/hub` aggregate
 * (game modes, user status, achievements, and the signed-in user's battles).
 *
 * @example
 * ```ts
 * const { query, battles, myBattles, stats, modes, userStatus, achievements } = useCompetitionHub();
 * ```
 */

import { useMemo } from "react";

import { useTopicBattles } from "@/modules/Competition/hooks/useTopicBattles";
import { useCompetitionHubData } from "@/modules/Competition/hooks/useCompetitionHubData";
import type { HubStats } from "@/modules/Competition/types/hub";
import type { TopicBattle } from "@/modules/Competition/types/topicBattle";
import { deriveHubStats } from "@/modules/Competition/utils";

const EMPTY_BATTLES: TopicBattle[] = [];

export function useCompetitionHub() {
  const topicQuery = useTopicBattles();
  const { query: hubQuery, modes, userStatus, achievements, myBattles } = useCompetitionHubData();

  const battles = useMemo(() => topicQuery.data?.battles ?? EMPTY_BATTLES, [topicQuery.data]);

  const stats = useMemo<HubStats>(() => deriveHubStats(battles), [battles]);

  return {
    query: topicQuery,
    hubQuery,
    battles,
    myBattles,
    stats,
    modes,
    userStatus,
    achievements,
  };
}
