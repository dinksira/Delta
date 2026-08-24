import type { ReactNode } from "react";

import { ArrowLeft, Share2, Search, Trophy, Filter } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { CompetitionGrid } from "@/components/organisms/CompetitionGrid/CompetitionGrid";
import type { CompetitionCardData } from "@/components/organisms/CompetitionCard/CompetitionCard";
import { cn } from "@/lib/utils";

export type FilterItem = {
  id: string;
  icon: ReactNode;
  label: string;
};

export interface CompetitionPageTemplateProps {
  title: string;
  onBack?: () => void;
  onShare?: () => void;

  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterClick?: () => void;
  onMyLaunchesClick?: () => void;
  onHostCompetitionClick?: () => void;

  filterItems: FilterItem[];
  activeFilterId: string;
  onFilterItemClick: (id: string) => void;

  competitions: CompetitionCardData[];
  onJoinCompetition?: (id: string) => void;

  className?: string;
  statusSlot?: ReactNode;
}

export function CompetitionPageTemplate({
  title,
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
    <div className={cn("flex h-full flex-col gap-5 p-4 md:p-6", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex size-9 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <Typography as="h1" className="text-2xl font-semibold text-primary-600">
            {title}
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          {onShare && (
            <Button variant="ghost" size="sm" onClick={onShare}>
              <Share2 className="size-4" />
              Share
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search competitions..."
            className="h-9 w-full rounded-xl border border-border-default bg-surface-default pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={onFilterClick}>
          <Filter className="size-4" />
          Filter
        </Button>
        <Button variant="secondary" size="sm" onClick={onMyLaunchesClick}>
          <Trophy className="size-4" />
          My Launches
        </Button>
        <Button variant="primary" size="sm" onClick={onHostCompetitionClick}>
          Host Competition
        </Button>
      </div>

      {/* Body: filter rail + grid */}
      <div className="flex flex-1 gap-5 overflow-hidden">
        {/* Left: filter rail */}
        <div className="flex shrink-0 flex-col gap-1">
          {filterItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterItemClick(item.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                activeFilterId === item.id
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
              )}
            >
              <span className="size-5">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Right: grid */}
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
