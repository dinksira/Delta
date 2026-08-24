import type { ReactNode } from "react";

import { Calendar } from "lucide-react";

import { SearchPill } from "@/components/molecules/SearchPill/SearchPill";
import type { SearchPillOption } from "@/components/molecules/SearchPill/SearchPill";
import { UpcomingCompetitionItem } from "@/components/molecules/UpcomingCompetitionItem/UpcomingCompetitionItem";
import type { UpcomingCompetitionItemProps } from "@/components/molecules/UpcomingCompetitionItem/UpcomingCompetitionItem";
import { cn } from "@/lib/utils";

export interface UpcomingCompetitionListProps {
  items: UpcomingCompetitionItemProps[];
  onOpenBattle?: (id: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  activeFilter: string;
  filterOptions: SearchPillOption[];
  onFilterChange: (value: string) => void;
  /** Rendered instead of the list (loading / error states). */
  statusSlot?: ReactNode;
  className?: string;
}

export function UpcomingCompetitionList({
  items,
  onOpenBattle,
  searchValue,
  onSearchChange,
  activeFilter,
  filterOptions,
  onFilterChange,
  statusSlot,
  className,
}: Readonly<UpcomingCompetitionListProps>) {
  return (
    <section
      aria-labelledby="upcoming-competition-heading"
      className={cn(
        "rounded-2xl border border-border-default bg-surface-default p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-600 text-white dark:bg-primary-500">
            <Calendar className="size-5" />
          </div>
          <h2
            id="upcoming-competition-heading"
            className="text-base font-semibold text-text-primary"
          >
            Upcoming Competition
          </h2>
        </div>
        <SearchPill
          value={searchValue}
          onChange={onSearchChange}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          filterOptions={filterOptions}
          placeholder="Search..."
          size="sm"
          className="w-72 sm:w-80"
        />
      </div>

      {statusSlot ?? (
        <div className="mt-4 flex flex-col gap-2.5">
          {items.length > 0 ? (
            items.map((item) => (
              <UpcomingCompetitionItem
                key={item.id}
                {...item}
                onOpen={onOpenBattle}
              />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-border-default py-10 text-center text-sm text-text-secondary">
              No competitions match your search.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default UpcomingCompetitionList;
