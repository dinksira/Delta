/**
 * ActiveCompetitionPage
 * Wires the CompetitionPageTemplate to real data via hooks.
 * Route: /features/competitions
 */

import { useCallback } from "react";

import { useRouter } from "next/navigation";
import { CircleDashed, Clock, Users, Trophy } from "lucide-react";

import { CompetitionPageTemplate } from "@/components/templates/CompetitionPageTemplate/CompetitionPageTemplate";
import type { FilterRailItem } from "@/components/organisms/FilterRail/FilterRail";
import { useCompetitions } from "@/modules/Competition/hooks/useCompetitions";
import { useFilteredCompetitions } from "@/modules/Competition/hooks/useFilteredCompetitions";
import {
  CompetitionFilterProvider,
  useCompetitionFilter,
} from "@/modules/Competition/context/CompetitionFilterContext";

// ============================================================================
// FILTER DEFINITIONS
// ============================================================================

const FILTER_ITEMS: FilterRailItem[] = [
  { id: "active", icon: <CircleDashed className="size-5" />, label: "Active Competition" },
  { id: "recent", icon: <Clock className="size-5" />, label: "Recent Competition" },
  { id: "community", icon: <Users className="size-5" />, label: "Community Competition" },
];

// ============================================================================
// INNER COMPONENT (consumes filter context)
// ============================================================================

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
    // Stub: open host competition modal/wizard
  }, []);

  const handleMyLaunches = useCallback(() => {
    // Stub: navigate to my launches
  }, []);

  const handleFilterClick = useCallback(() => {
    // Stub: open advanced filter modal
  }, []);

  const handleBack = useCallback(() => {
    // Stub: navigate back to features overview
  }, []);

  const handleShare = useCallback(() => {
    // Stub: share competition page
  }, []);

  const headerActions = [
    { icon: <Trophy className="size-4" />, label: "Integrate" },
    { icon: <Trophy className="size-4" />, label: "Automate" },
    { icon: <Users className="size-4" />, label: "Invite" },
  ];

  return (
    <CompetitionPageTemplate
      title="Active Competition"
      headerActions={headerActions}
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

// ============================================================================
// EXPORTED PAGE (wraps in filter provider)
// ============================================================================

export function ActiveCompetitionPage() {
  return (
    <CompetitionFilterProvider>
      <ActiveCompetitionPageInner />
    </CompetitionFilterProvider>
  );
}

export default ActiveCompetitionPage;
