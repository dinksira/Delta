import type { ReactNode } from "react";

import { Bot, Link2, Plug, Plus, Swords, UserPlus } from "lucide-react";

import { BackButton } from "@/components/theme/BackButton";
import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { SearchPill } from "@/components/molecules/SearchPill/SearchPill";
import type { SearchPillOption } from "@/components/molecules/SearchPill/SearchPill";
import { SubjectPills } from "@/components/molecules/SubjectPills/SubjectPills";
import type { SubjectPill } from "@/components/molecules/SubjectPills/SubjectPills";
import { TopicBattleGrid } from "@/components/organisms/TopicBattleGrid/TopicBattleGrid";
import type { TopicBattle } from "@/modules/Competition/types/topicBattle";
import { cn } from "@/lib/utils";

export interface TopicBattleListTemplateProps {
  onBack?: () => void;
  onIntegrate?: () => void;
  onAutomate?: () => void;
  onInvite?: () => void;
  onCopyLink?: () => void;

  searchValue: string;
  onSearchChange: (value: string) => void;
  activeFilter: string;
  filterOptions: SearchPillOption[];
  onFilterChange: (value: string) => void;

  subjects: SubjectPill[];
  activeSubject: string;
  onSubjectChange: (value: string) => void;

  onCreateNew?: () => void;

  battles: TopicBattle[];
  onJoinBattle?: (id: string) => void;
  onResumeBattle?: (id: string) => void;
  onOpenBattle?: (id: string) => void;

  statusSlot?: ReactNode;
  noticeSlot?: ReactNode;
  className?: string;
}

export function TopicBattleListTemplate({
  onBack,
  onIntegrate,
  onAutomate,
  onInvite,
  onCopyLink,

  searchValue,
  onSearchChange,
  activeFilter,
  filterOptions,
  onFilterChange,

  subjects,
  activeSubject,
  onSubjectChange,

  onCreateNew,

  battles,
  onJoinBattle,
  onResumeBattle,
  onOpenBattle,

  statusSlot,
  noticeSlot,
  className,
}: Readonly<TopicBattleListTemplateProps>) {
  return (
    <div className={cn("flex h-full flex-col gap-5 overflow-y-auto p-4 md:p-6", className)}>
      {/* Header row: back + brand icon + title, then Integrate / Automate / Invite + Copy Link */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && <BackButton label="" onClick={onBack} />}
          <Swords className="size-6 shrink-0 text-primary-600" />
          <Typography as="h1" className="text-2xl font-semibold text-primary-600">
            Topic Battles
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onIntegrate}>
            <Plug className="size-4" />
            Integrate
          </Button>
          <Button variant="ghost" size="sm" onClick={onAutomate}>
            <Bot className="size-4" />
            Automate
          </Button>
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-default px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <UserPlus className="size-4" />
            Invite
          </button>
          <div className="h-4 w-px bg-border-default" aria-hidden />
          <button
            type="button"
            onClick={onCopyLink}
            aria-label="Copy link"
            className="flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <Link2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Toolbar: search + filter pill, then Create New */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchPill
          value={searchValue}
          onChange={onSearchChange}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          filterOptions={filterOptions}
          placeholder="Search topic battles..."
          size="sm"
          className="w-80 sm:w-96"
        />
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <Plus className="size-4" />
          Create New
        </button>
      </div>

      {/* Subject filter pills */}
      <SubjectPills subjects={subjects} activeValue={activeSubject} onChange={onSubjectChange} />

      {/* Battle grid */}
      <section aria-labelledby="topic-battles-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Typography
            as="h2"
            id="topic-battles-heading"
            className="text-lg font-semibold text-text-primary"
          >
            Open Battles
          </Typography>
          <span className="text-sm tabular-nums text-text-secondary">
            {battles.length} available
          </span>
        </div>
        {noticeSlot}
        {statusSlot ?? (
          <TopicBattleGrid
            battles={battles}
            onJoin={onJoinBattle}
            onResume={onResumeBattle}
            onOpen={onOpenBattle}
            emptyTitle="No battles found"
            emptyDescription="Try adjusting your search or filters, or create a new battle."
          />
        )}
      </section>
    </div>
  );
}

export default TopicBattleListTemplate;
