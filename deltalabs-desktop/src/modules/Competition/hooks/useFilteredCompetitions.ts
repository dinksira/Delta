/**
 * useFilteredCompetitions
 * Filters competitions by category and search query with debounce.
 */

import { useMemo, useState, useEffect } from "react";

import type { Competition, CompetitionCategory } from "@/modules/Competition/types";

// ============================================================================
// DEBOUNCE HOOK (inline — no standalone hook library exists yet)
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// ============================================================================
// FILTERED COMPETITIONS HOOK
// ============================================================================

export function useFilteredCompetitions(
  competitions: Competition[],
  activeCategory: CompetitionCategory,
  searchQuery: string,
) {
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filtered = useMemo(() => {
    let result = competitions.filter((c) => c.category === activeCategory);

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [competitions, activeCategory, debouncedSearch]);

  return filtered;
}
