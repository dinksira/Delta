/**
 * UpcomingCompetitionCard
 * Full-width card: calendar header + search/filter + scrollable CompetitionListItem list.
 */

import { Calendar, Filter } from "lucide-react";

import { SearchInput } from "@/components/theme/SearchInput";
import { CompetitionListItem } from "@/components/molecules/CompetitionListItem/CompetitionListItem";
import type { StatusDotVariant } from "@/components/atoms/StatusDot/StatusDot";
import { cn } from "@/lib/utils";

export interface UpcomingCompetitionItem {
  id: string;
  title: string;
  category: string;
  playerCount: number;
  status: StatusDotVariant;
  fee: string;
}

export interface UpcomingCompetitionCardProps {
  competitions: UpcomingCompetitionItem[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterClick?: () => void;
  className?: string;
}

export function UpcomingCompetitionCard({
  competitions,
  searchValue,
  onSearchChange,
  onFilterClick,
  className,
}: Readonly<UpcomingCompetitionCardProps>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border-default bg-surface-default p-5 shadow-sm",
        className,
      )}
    >
      {/* Header + search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-primary-600" aria-hidden />
          <span className="text-sm font-semibold text-text-primary">Upcoming Competition</span>
        </div>
        <SearchInput
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-44"
          inputClassName="text-xs py-0.5"
          endSlot={
            <button
              type="button"
              onClick={onFilterClick}
              className="flex size-5 items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors"
              aria-label="Filter"
            >
              <Filter className="size-3" />
            </button>
          }
        />
      </div>

      {/* Scrollable list */}
      <div className="max-h-[320px] space-y-0 overflow-y-auto divide-y divide-border-default">
        {competitions.map((comp) => (
          <CompetitionListItem
            key={comp.id}
            title={comp.title}
            category={comp.category}
            playerCount={comp.playerCount}
            status={comp.status}
            fee={comp.fee}
          />
        ))}
      </div>
    </div>
  );
}
