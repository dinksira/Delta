/**
 * useJoinLiveDuelModal
 * Modal controller for the Join Live Duel confirmation flow, mirroring
 * `useJoinBattleModal`: owns which duel is open, the join mutation, inline
 * errors, and the "success" signal that flips the modal to its success view.
 *
 * @example
 * ```ts
 * const modal = useJoinLiveDuelModal();
 * modal.openFor(entry);
 * // render <JoinLiveDuelModal open={Boolean(modal.duel)} duel={modal.duel} ... />
 * ```
 */

import { useCallback, useState } from "react";

import type { LiveDuelEntry } from "@/modules/Competition/types/liveDuel";
import { useJoinLiveDuel } from "@/modules/Competition/hooks/useJoinLiveDuel";

export function useJoinLiveDuelModal() {
  const [duel, setDuel] = useState<LiveDuelEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinedDuelId, setJoinedDuelId] = useState<string | null>(null);
  const joinMutation = useJoinLiveDuel();

  const openFor = useCallback((next: LiveDuelEntry) => {
    setDuel(next);
    setError(null);
    setJoinedDuelId(null);
  }, []);

  const close = useCallback(() => {
    setDuel(null);
  }, []);

  const confirm = useCallback(() => {
    if (!duel) {
      return;
    }
    setError(null);
    setJoinedDuelId(null);
    joinMutation.mutate(duel.id, {
      onSuccess: () => setJoinedDuelId(duel.id),
      onError: (err) =>
        setError(err instanceof Error ? err.message : "Failed to join live duel"),
    });
  }, [duel, joinMutation]);

  return {
    duel,
    openFor,
    close,
    confirm,
    isSubmitting: joinMutation.isPending,
    error,
    isSuccess: joinedDuelId !== null && joinedDuelId === duel?.id,
  };
}

export default useJoinLiveDuelModal;