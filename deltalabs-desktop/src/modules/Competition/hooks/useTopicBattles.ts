/**
 * useTopicBattles
 * Hook for topic battle listing, filtering, joining, and payment flow.
 */

import { useState, useEffect, useMemo, useCallback } from "react";

import { MOCK_TOPIC_BATTLES } from "@/modules/Competition/data/mockTopicBattles";
import type { TopicBattle } from "@/modules/Competition/types/topicBattles";
import { useWalletBalance } from "@/modules/Competition/hooks/useWalletBalance";
import { fetchTopicBattles, joinTopicBattle } from "@/modules/Competition/api";

// ============================================================================
// TYPES
// ============================================================================

export interface SubjectCount {
  subject: string;
  count: number;
}

function parseEntryFee(value: string): number {
  if (value.toLowerCase() === "free") return 0;
  const digits = value.replace(/[^0-9.]/g, "");
  return parseFloat(digits) || 0;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTopicBattles() {
  const [battles, setBattles] = useState<TopicBattle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBattle, setSelectedBattle] = useState<TopicBattle | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { balance, deduct, addFunds } = useWalletBalance(10000);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetchTopicBattles();
        if (!cancelled) {
          setBattles(response.battles);
          setIsLoading(false);
        }
      } catch {
        // Fallback to mock data if API unavailable
        if (!cancelled) {
          setBattles(MOCK_TOPIC_BATTLES);
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const subjectCounts = useMemo<SubjectCount[]>(() => {
    const map = new Map<string, number>();
    battles.forEach((b) => {
      map.set(b.subject, (map.get(b.subject) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);
  }, [battles]);

  const filteredBattles = useMemo(() => {
    let result = battles;
    if (subjectFilter) {
      result = result.filter((b) => b.subject === subjectFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(q));
    }
    return result;
  }, [battles, subjectFilter, searchQuery]);

  const handleJoin = useCallback((battleId: string) => {
    const battle = battles.find((b) => b.id === battleId) ?? null;
    setSelectedBattle(battle);
  }, [battles]);

  const handleCloseModal = useCallback(() => {
    setSelectedBattle(null);
  }, []);

  const handleConfirmPayment = useCallback(
    async (battleId: string): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 700));

      const battle = battles.find((b) => b.id === battleId);
      if (!battle) return;

      const fee = parseEntryFee(battle.entryFee);
      deduct(fee);

      // Try API join, fall back to local state update
      try {
        await joinTopicBattle(battleId);
      } catch {
        // API unavailable — update locally
        setBattles((prev) =>
          prev.map((b) =>
            b.id === battleId
              ? { ...b, playersJoined: Math.min(b.playersJoined + 1, b.playersMax) }
              : b,
          ),
        );
      }

      setSuccessMessage(`You've joined ${battle.title}!`);
      window.location.hash = `/features/competitions/duel/${battleId}`;
    },
    [battles, deduct],
  );

  const handleDismissSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const handleCreateNew = useCallback(() => {
    window.location.hash = "/features/competitions/topic-battles/create";
  }, []);

  return {
    battles: filteredBattles,
    allBattles: battles,
    subjectCounts,
    isLoading,
    subjectFilter,
    setSubjectFilter,
    searchQuery,
    setSearchQuery,
    handleJoin,
    handleCreateNew,
    selectedBattle,
    handleCloseModal,
    handleConfirmPayment,
    walletBalance: balance,
    addFunds,
    successMessage,
    handleDismissSuccess,
  };
}
