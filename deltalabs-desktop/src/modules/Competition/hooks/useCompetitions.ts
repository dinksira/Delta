/**
 * useCompetitions
 * Fetches competition data. Falls back to mock data in development.
 */

import { useState, useEffect } from "react";

import type { Competition } from "@/modules/Competition/types";
import { MOCK_COMPETITIONS } from "@/modules/Competition/data/mockCompetitions";

// ============================================================================
// HOOK
// ============================================================================

export function useCompetitions() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        // In production this would be:
        // const res = await fetchCompetitions();
        // const data = res.data ?? res;
        await new Promise((r) => setTimeout(r, 300));
        if (!cancelled) {
          setCompetitions(MOCK_COMPETITIONS);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load competitions");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { competitions, isLoading, error };
}
