/**
 * CompetitionPageTemplate
 * Composes PageHeader + ToolbarSection + (FilterRail + CompetitionGrid) in a two-column layout.
 */

import type { ReactNode } from "react";

import { PageHeader } from "@/components/organisms/PageHeader/PageHeader";
import type { ActionButton } from "@/components/organisms/PageHeader/PageHeader";
import { ToolbarSection } from "@/components/organisms/ToolbarSection/ToolbarSection";
import { FilterRail } from "@/components/organisms/FilterRail/FilterRail";
import type { FilterRailItem } from "@/components/organisms/FilterRail/FilterRail";
import { CompetitionGrid } from "@/components/organisms/CompetitionGrid/CompetitionGrid";
import type { CompetitionCardData } from "@/components/organisms/CompetitionCard/CompetitionCard";
import { cn } from "@/lib/utils";

// ============================================================================
// PROPS
// ============================================================================

export interface CompetitionPageTemplateProps {
  title: string;
  headerActions?: ActionButton[];
  onBack?: () => void;
  onShare?: () => void;

// ============================================================================
// PROPS (continued)
// ============================================================================

  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterClick?: () => void;
  onMyLaunchesClick?: () => void;
  onHostCompetitionClick?: () => void;

  filterItems: FilterRailItem[];
  activeFilterId: string;
  onFilterItemClick: (id: string) => void;

  competitions: CompetitionCardData[];
  onJoinCompetition?: (id: string) => void;

  className?: string;
  /** Optional slot above the grid (e.g. loading or error state) */
  statusSlot?: ReactNode;
}

// ============================================================================
// TEMPLATE
// ============================================================================

export function CompetitionPageTemplate({
  title,
  headerActions,
  onBack,
  onShare,

  searchValue,
  onSearchChange,
  onFilterClick,
  onMyLaunchesClick,
  onHostCompetitionClick,

  filterItems,
  activeFilterId,
  onFilterItemClick,

  competitions,
  onJoinCompetition,

  className,
  statusSlot,
}: Readonly<CompetitionPageTemplateProps>) {
  return (
    <div className={cn("flex h-full flex-col gap-5", className)}>
      {/* Page Header */}
      <PageHeader
        title={title}
        actions={headerActions}
        onBack={onBack}
        onShare={onShare}
      />

      {/* Toolbar */}
      <ToolbarSection
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onFilterClick={onFilterClick}
        onMyLaunchesClick={onMyLaunchesClick}
        onHostCompetitionClick={onHostCompetitionClick}
      />

      {/* Two-column body */}
      <div className="flex flex-1 gap-5 overflow-hidden">
        {/* Left: FilterRail */}
        <FilterRail
          items={filterItems}
          activeId={activeFilterId}
          onItemClick={onFilterItemClick}
          className="shrink-0"
        />

        {/* Right: CompetitionGrid */}
        <div className="flex-1 overflow-y-auto">
          {statusSlot}
          <CompetitionGrid
            competitions={competitions}
            onJoin={onJoinCompetition}
          />
        </div>
      </div>
    </div>
  );
}

export default CompetitionPageTemplate;
