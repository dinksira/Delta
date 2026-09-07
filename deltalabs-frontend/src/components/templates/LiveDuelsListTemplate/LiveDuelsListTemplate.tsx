/**
 * LiveDuelsListTemplate — lobby layout for Live Duels, mirroring
 * `TopicBattleListTemplate`. Header (back + brand), search + difficulty filter,
 * subject pills, and a live-duel grid with an available count.
 *
 * @example
 * ```tsx
 * <LiveDuelsListTemplate
 *   duels={filtered}
 *   onJoinDuel={handleJoin}
 *   onEnterDuel={handleEnter}
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   subjects={subjects}
 *   activeSubject={activeSubject}
 *   onSubjectChange={setActiveSubject}
 *   activeFilter={filter}
 *   filterOptions={options}
 *   onFilterChange={setFilter}
 * />
 * ```
 */

import type { ReactNode } from "react";

import { Radio } from "lucide-react";

import { BackButton } from "@/components/theme/BackButton";
import { Typography } from "@/components/theme/Typography";
import { SearchPill } from "@/components/molecules/SearchPill/SearchPill";
import type { SearchPillOption } from "@/components/molecules/SearchPill/SearchPill";
import { SubjectPills } from "@/components/molecules/SubjectPills/SubjectPills";
import type { SubjectPill } from "@/components/molecules/SubjectPills/SubjectPills";
import { LiveDuelGrid } from "@/components/organisms/LiveDuelGrid/LiveDuelGrid";
import type { LiveDuelEntry } from "@/modules/Competition/types/liveDuel";
import { cn } from "@/lib/utils";

export interface LiveDuelsListTemplateProps {
  onBack?: () => void;

  searchValue: string;
  onSearchChange: (value: string) => void;
  activeFilter: string;
  filterOptions: SearchPillOption[];
  onFilterChange: (value: string) => void;

  subjects: SubjectPill[];
  activeSubject: string;
  onSubjectChange: (value: string) => void;

  duels: LiveDuelEntry[];
  onJoinDuel?: (id: string) => void;
  onEnterDuel?: (id: string) => void;

  /** Optional actions rendered at the right of the header (e.g. Create Duel). */
  actionsSlot?: ReactNode;
  statusSlot?: ReactNode;
  noticeSlot?: ReactNode;
  className?: string;
}

export function LiveDuelsListTemplate({
  onBack,

  searchValue,
  onSearchChange,
  activeFilter,
  filterOptions,
  onFilterChange,

  subjects,
  activeSubject,
  onSubjectChange,

  duels,
  onJoinDuel,
  onEnterDuel,

  actionsSlot,
  statusSlot,
  noticeSlot,
  className,
}: Readonly<LiveDuelsListTemplateProps>) {
  return (
    <div className={cn("flex h-full flex-col gap-5 overflow-y-auto p-4 md:p-6", className)}>
      {/* Header row: back + brand icon + title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && <BackButton label="" onClick={onBack} />}
          <Radio className="size-6 shrink-0 text-primary-600" />
          <Typography as="h1" className="text-2xl font-semibold text-primary-600">
            Live Duels
          </Typography>
        </div>
        {actionsSlot ? <div className="flex shrink-0 items-center gap-2">{actionsSlot}</div> : null}
      </div>

      {/* Toolbar: search + difficulty filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchPill
          value={searchValue}
          onChange={onSearchChange}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          filterOptions={filterOptions}
          placeholder="Search live duels..."
          size="sm"
          className="w-80 sm:w-96"
        />
      </div>

      {/* Subject filter pills */}
      <SubjectPills subjects={subjects} activeValue={activeSubject} onChange={onSubjectChange} />

      {/* Duel grid */}
      <section aria-labelledby="live-duels-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Typography
            as="h2"
            id="live-duels-heading"
            className="text-lg font-semibold text-text-primary"
          >
            Live Duels
          </Typography>
          <span className="text-sm tabular-nums text-text-secondary">{duels.length} available</span>
        </div>
        {noticeSlot}
        {statusSlot ?? (
          <LiveDuelGrid
            duels={duels}
            onJoin={onJoinDuel}
            onEnter={onEnterDuel}
            emptyTitle="No live duels found"
            emptyDescription="Try adjusting your search or filters."
          />
        )}
      </section>
    </div>
  );
}

export default LiveDuelsListTemplate;