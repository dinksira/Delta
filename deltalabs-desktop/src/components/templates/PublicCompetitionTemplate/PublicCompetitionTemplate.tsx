import type { ReactNode } from "react";

import { Bot, Link2, Plug, Plus, PlusCircle, Trophy } from "lucide-react";

import { BackButton } from "@/components/theme/BackButton";
import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { TabNav } from "@/components/molecules/TabNav/TabNav";
import { SearchPill } from "@/components/molecules/SearchPill/SearchPill";
import type { SearchPillOption } from "@/components/molecules/SearchPill/SearchPill";
import { GameModeCard } from "@/components/molecules/GameModeCard/GameModeCard";
import type { GameModeCardProps } from "@/components/molecules/GameModeCard/GameModeCard";
import type { UpcomingCompetitionItemProps } from "@/components/molecules/UpcomingCompetitionItem/UpcomingCompetitionItem";
import { UserStatusCard } from "@/components/organisms/UserStatusCard/UserStatusCard";
import { AchievementsPanel } from "@/components/organisms/AchievementsPanel/AchievementsPanel";
import type { AchievementConfig } from "@/components/organisms/AchievementsPanel/AchievementsPanel";
import { UpcomingCompetitionList } from "@/components/organisms/UpcomingCompetitionList/UpcomingCompetitionList";
import { TopicBattleGrid } from "@/components/organisms/TopicBattleGrid/TopicBattleGrid";
import type { CompetitionTab, UserStatus } from "@/modules/Competition/types/hub";
import type { TopicBattle } from "@/modules/Competition/types/topicBattle";
import { cn } from "@/lib/utils";

export type GameModeConfig = GameModeCardProps & { id: string };

export interface PublicCompetitionTemplateProps {
  activeTab: CompetitionTab;
  onTabChange: (tab: CompetitionTab) => void;
  onBack?: () => void;
  onHost?: () => void;
  onInvite?: () => void;
  onIntegrate?: () => void;
  onAutomate?: () => void;

  userStatus: UserStatus;
  gameModes: GameModeConfig[];
  achievements: AchievementConfig[];
  upcomingItems: UpcomingCompetitionItemProps[];

  myBattles: TopicBattle[];
  onOpenBattle?: (id: string) => void;

  searchValue: string;
  onSearchChange: (value: string) => void;
  activeFilter: string;
  filterOptions: SearchPillOption[];
  onFilterChange: (value: string) => void;

  statusSlot?: ReactNode;
  className?: string;
}

export function PublicCompetitionTemplate({
  activeTab,
  onTabChange,
  onBack,
  onHost,
  onInvite,
  onIntegrate,
  onAutomate,

  userStatus,
  gameModes,
  achievements,
  upcomingItems,

  myBattles,
  onOpenBattle,

  searchValue,
  onSearchChange,
  activeFilter,
  filterOptions,
  onFilterChange,

  statusSlot,
  className,
}: Readonly<PublicCompetitionTemplateProps>) {
  return (
    <div className={cn("flex h-full flex-col gap-5 overflow-y-auto p-4 md:p-6", className)}>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && <BackButton label="" onClick={onBack} />}
          <Trophy className="size-6 text-primary-600" />
          <Typography as="h1" className="text-2xl font-semibold text-primary-600">
            Public Competition
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
            <Link2 className="size-4" />
            Invite
          </button>
        </div>
      </div>

      {/* Sub-header: tabs + search + host */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabNav
          variant="text"
          items={[
            { id: "public", label: "Public" },
            { id: "mine", label: "My Competitions" },
          ]}
          activeId={activeTab}
          onSelect={(id) => onTabChange(id as CompetitionTab)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <SearchPill
            value={searchValue}
            onChange={onSearchChange}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            filterOptions={filterOptions}
            placeholder="Search competitions..."
            size="sm"
            className="w-80 sm:w-96"
          />
          <Button variant="primary" size="sm" onClick={onHost}>
            <PlusCircle className="size-4" />
            Host Competition
          </Button>
        </div>
      </div>

      {activeTab === "public" ? (
        <>
          {/* Status + game modes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <UserStatusCard status={userStatus} />
            {gameModes.map((mode) => (
              <GameModeCard key={mode.id} {...mode} />
            ))}
          </div>

          {/* Achievements (left) + Upcoming feed (right) */}
          <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
            <AchievementsPanel achievements={achievements} />
            <UpcomingCompetitionList
              items={upcomingItems}
              onOpenBattle={onOpenBattle}
              searchValue={searchValue}
              onSearchChange={onSearchChange}
              activeFilter={activeFilter}
              filterOptions={filterOptions}
              onFilterChange={onFilterChange}
              statusSlot={statusSlot}
              className="lg:col-span-2"
            />
          </div>
        </>
      ) : (
        <>
          {/* My competitions */}
          <section aria-labelledby="my-competitions-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Typography
                as="h2"
                id="my-competitions-heading"
                className="text-lg font-semibold text-text-primary"
              >
                My Competitions
              </Typography>
              <Button variant="secondary" size="sm" onClick={onHost}>
                <Plus className="size-4" />
                Host Competition
              </Button>
            </div>
            {statusSlot ?? (
              <TopicBattleGrid
                battles={myBattles}
                onOpen={onOpenBattle}
                emptyTitle="You haven't hosted a competition yet"
                emptyDescription="Host your first competition and it will appear here."
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default PublicCompetitionTemplate;
