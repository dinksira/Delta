/**
 * useJoinLiveDuel
 * Mutation hook for joining a live duel room. Wraps the (currently stubbed)
 * `joinLiveDuel` API call so the lobby/join flow matches the topic battle flow.
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