"use client";

import { useCallback } from "react";

import { useRouter } from "next/navigation";
import { CircleDashed, Clock, Users, Trophy } from "lucide-react";

import { CompetitionPageTemplate } from "@/components/templates/CompetitionPageTemplate/CompetitionPageTemplate";
import type { FilterItem } from "@/components/templates/CompetitionPageTemplate/CompetitionPageTemplate";
import { useCompetitions } from "@/modules/Competition/hooks/useCompetitions";
import { useFilteredCompetitions } from "@/modules/Competition/hooks/useFilteredCompetitions";
import {
  CompetitionFilterProvider,
  useCompetitionFilter,
} from "@/modules/Competition/context/CompetitionFilterContext";

const FILTER_ITEMS: FilterItem[] = [
  { id: "active", icon: <CircleDashed className="size-5" />, label: "Active Competition" },
  { id: "recent", icon: <Clock className="size-5" />, label: "Recent Competition" },
  { id: "community", icon: <Users className="size-5" />, label: "Community Competition" },
];

function ActiveCompetitionPageInner() {
  const router = useRouter();
  const { activeCategory, searchQuery, setActiveCategory, setSearchQuery } =
    useCompetitionFilter();
  const { competitions, isLoading, error } = useCompetitions();
  const filtered = useFilteredCompetitions(competitions, activeCategory, searchQuery);

  const handleJoin = useCallback((id: string) => {
    router.push(`/features/competitions/${id}`);
  }, [router]);

  const handleHostCompetition = useCallback(() => {
  }, []);

  const handleMyLaunches = useCallback(() => {
  }, []);

  const handleFilterClick = useCallback(() => {
  }, []);

  const handleBack = useCallback(() => {
  }, []);

  const handleShare = useCallback(() => {
  }, []);

  return (
    <CompetitionPageTemplate
      title="Active Competition"
      onBack={handleBack}
      onShare={handleShare}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      onFilterClick={handleFilterClick}
      onMyLaunchesClick={handleMyLaunches}
      onHostCompetitionClick={handleHostCompetition}
      filterItems={FILTER_ITEMS}
      activeFilterId={activeCategory}
      onFilterItemClick={(id) => setActiveCategory(id as "active" | "recent" | "community")}
      competitions={filtered}
      onJoinCompetition={handleJoin}
      statusSlot={
        isLoading ? (
          <div className="flex items-center justify-center py-12 text-text-secondary">
            Loading competitions...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center rounded-2xl border border-error-500 bg-error-50 p-6 text-error-700">
            {error}
          </div>
        ) : null
      }
    />
  );
}

export function ActiveCompetitionPage() {
  return (
    <CompetitionFilterProvider>
      <ActiveCompetitionPageInner />
    </CompetitionFilterProvider>
  );
}

export default ActiveCompetitionPage;
