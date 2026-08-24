/**
 * Modal controller for the Join Topic Battle confirmation flow.
 * Owns which battle is open, the join mutation, inline errors, and the
 * "success" signal that flips the modal to its success view.
 *
 * @example
 * ```ts
 * const modal = useJoinBattleModal();
 * modal.openFor(battle);
 * // render <JoinTopicBattleModal open={Boolean(modal.battle)} battle={modal.battle} ... />
 * ```
 */

import { useCallback, useState } from "react";

import type { TopicBattle } from "@/modules/Competition/types/topicBattle";
import { useJoinTopicBattle } from "@/modules/Competition/hooks/useJoinTopicBattle";

export function useJoinBattleModal() {
  const [battle, setBattle] = useState<TopicBattle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinedBattleId, setJoinedBattleId] = useState<string | null>(null);
  const joinMutation = useJoinTopicBattle();

  const openFor = useCallback((next: TopicBattle) => {
    setBattle(next);
    setError(null);
    setJoinedBattleId(null);
  }, []);

  const close = useCallback(() => {
    setBattle(null);
  }, []);

  const confirm = useCallback(() => {
    if (!battle) {
      return;
    }
    setError(null);
    setJoinedBattleId(null);
    joinMutation.mutate(battle.id, {
      onSuccess: () => setJoinedBattleId(battle.id),
      onError: (err) =>
        setError(err instanceof Error ? err.message : "Failed to join battle"),
    });
  }, [battle, joinMutation]);

  return {
    battle,
    openFor,
    close,
    confirm,
    isSubmitting: joinMutation.isPending,
    error,
    isSuccess: joinedBattleId !== null && joinedBattleId === battle?.id,
  };
}
