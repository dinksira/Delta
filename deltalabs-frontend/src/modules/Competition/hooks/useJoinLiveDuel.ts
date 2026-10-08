/**
 * useJoinLiveDuel
 * Mutation hook for joining a live duel room. The server records the join in
 * the room's joined member list, so the caller can refetch the lobby and the
 * card flips to "Enter Duel".
 *
 * @example
 * ```ts
 * const { mutate, isPending } = useJoinLiveDuel();
 * mutate("live-geo-001");
 * ```
 */

import { useMutation } from "@tanstack/react-query";

import { joinLiveDuel } from "@/modules/Competition/api";

export function useJoinLiveDuel() {
  return useMutation({ mutationFn: joinLiveDuel });
}

export default useJoinLiveDuel;
