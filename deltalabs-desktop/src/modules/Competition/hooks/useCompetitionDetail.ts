/**
 * useCompetitionDetail
 * Fetches competition detail by ID. Falls back to mock data in development.
 */

import { useState, useEffect } from "react";

import type { CompetitionDetail } from "@/modules/Competition/types/detail";
import { MOCK_COMPETITION_DETAILS } from "@/modules/Competition/data/mockCompetitionDetails";

// ============================================================================
// HOOK
// ============================================================================

export function useCompetitionDetail(competitionId: string) {
  const [detail, setDetail] = useState<CompetitionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise((r) => setTimeout(r, 200));
        const found = MOCK_COMPETITION_DETAILS[competitionId];
        if (!cancelled) {
          if (found) {
            setDetail(found);
          } else {
            setError("Competition not found");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load competition detail");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [competitionId]);

  return { detail, isLoading, error };
}
