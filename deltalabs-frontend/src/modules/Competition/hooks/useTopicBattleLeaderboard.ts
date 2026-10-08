/**
 * useTopicBattleLeaderboard — server standings for a joined topic battle.
 *
 * Fetches `GET .../topic-battles/{id}/leaderboard` and maps the rows onto the
 * duel view's entry shape, marking the current user's row. Ranks and points
 * come straight from the backend's persisted completion records.
 *
 * @example
 * ```ts
 * const { entries } = useTopicBattleLeaderboard(battleId, currentUserId);
 * const quiz = useMemo(() => buildDuelQuiz(battle, entries), [battle, entries]);
 * ```
 */

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { fetchTopicBattleLeaderboard } from "@/modules/Competition/api";
import { toDuelLeaderboardEntries } from "@/modules/Competition/data";
import { topicBattleQueryKeys } from "@/modules/Competition/hooks/topicBattleQueryKeys";
import type { DuelLeaderboardEntry } from "@/modules/Competition/types/duelQuiz";

export function useTopicBattleLeaderboard(
  battleId: string | undefined,
  currentUserId: string | null,
): { entries: DuelLeaderboardEntry[] } & ReturnType<typeof useQuery> {
  const query = useQuery({
    queryKey: topicBattleQueryKeys.leaderboard(battleId ?? "missing"),
    queryFn: () => fetchTopicBattleLeaderboard(battleId as string),
    enabled: Boolean(battleId),
  });

  const entries = useMemo(
    () => toDuelLeaderboardEntries(query.data, currentUserId),
    [query.data, currentUserId],
  );

  return { ...query, entries };
}
