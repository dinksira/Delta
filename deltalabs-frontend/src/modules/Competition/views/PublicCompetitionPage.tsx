"use client";

import { useCallback, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  Footprints,
  Megaphone,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { PublicCompetitionTemplate } from "@/components/templates/PublicCompetitionTemplate/PublicCompetitionTemplate";
import type { GameModeConfig } from "@/components/templates/PublicCompetitionTemplate/PublicCompetitionTemplate";
import type { SearchPillOption } from "@/components/molecules/SearchPill/SearchPill";
import type { AchievementConfig } from "@/components/organisms/AchievementsPanel/AchievementsPanel";
import { useCompetitionHub } from "@/modules/Competition/hooks/useCompetitionHub";
import { toUpcomingItem } from "@/modules/Competition/utils";
import type { CompetitionTab } from "@/modules/Competition/types/hub";

const GAME_MODE_ICONS: Record<string, Pick<GameModeConfig, "icon" | "accentTone" | "iconShape">> = {
  "topic-battles": {
    icon: <Swords className="size-6" />,
    accentTone: "primary",
    iconShape: "square",
  },
  championship: {
    icon: <Trophy className="size-6" />,
    accentTone: "secondary",
    iconShape: "square",
  },
  "live-duels": {
    icon: <Clock className="size-6" />,
    accentTone: "info",
    iconShape: "circle",
  },
};

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  "first-battle": Footprints,
  showrunner: Megaphone,
  "regular-10": CalendarCheck,
  champion: Trophy,
};

export function PublicCompetitionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CompetitionTab>("public");
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const { query, battles, myBattles, modes, userStatus, achievements } = useCompetitionHub();

  const gameModes = useMemo<GameModeConfig[]>(
    () =>
      modes.map((mode) => ({
        ...mode,
        ...GAME_MODE_ICONS[mode.id],
        onAction: () =>
          router.push(
            mode.id === "topic-battles"
              ? "/features/competitions/topic-battles"
              : mode.id === "championship"
                ? "/features/competitions/games"
                : "/features/competitions/live-duels",
          ),
      })),
    [modes, router],
  );

  const achievementConfigs = useMemo<AchievementConfig[]>(
    () =>
      achievements.map((achievement) => {
        const Icon = ACHIEVEMENT_ICONS[achievement.id] ?? Trophy;
        return { ...achievement, icon: <Icon className="size-5" /> };
      }),
    [achievements],
  );

  const filterOptions = useMemo<SearchPillOption[]>(() => {
    const seen = new Set<string>();
    const options: SearchPillOption[] = [{ value: "all", label: "All difficulties" }];
    battles.forEach((battle) => {
      const difficulty = battle.difficulty.trim();
      if (difficulty && !seen.has(difficulty)) {
        seen.add(difficulty);
        options.push({ value: difficulty, label: difficulty });
      }
    });
    return options;
  }, [battles]);

  const filteredBattles = useMemo(() => {
    const queryText = searchValue.trim().toLowerCase();
    return battles.filter((battle) => {
      const matchesSearch =
        !queryText ||
        battle.title.toLowerCase().includes(queryText) ||
        battle.subject.toLowerCase().includes(queryText);
      const matchesFilter = activeFilter === "all" || battle.difficulty === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [battles, searchValue, activeFilter]);

  const upcomingItems = useMemo(() => filteredBattles.map(toUpcomingItem), [filteredBattles]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleHost = useCallback(() => {
    router.push("/features/competitions/host");
  }, [router]);

  const handleInvite = useCallback(() => {
    router.push("/features/competitions/host");
  }, [router]);

  const handleIntegrate = useCallback(() => {
    router.push("/features/competitions/host");
  }, [router]);

  const handleAutomate = useCallback(() => {
    router.push("/features/competitions/host");
  }, [router]);

  const handleOpenBattle = useCallback(
    (id: string) => {
      router.push(`/features/competitions/${id}`);
    },
    [router],
  );

  const statusSlot = query.isLoading ? (
    <div className="flex items-center justify-center rounded-2xl border border-border-default bg-surface-default p-12 text-text-secondary">
      Loading competitions...
    </div>
  ) : query.isError ? (
    <div className="flex items-center justify-center rounded-2xl border border-error-500 bg-error-50 p-6 text-error-700">
      {query.error instanceof Error ? query.error.message : "Failed to load competitions"}
    </div>
  ) : null;

  return (
    <PublicCompetitionTemplate
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onBack={handleBack}
      onHost={handleHost}
      onInvite={handleInvite}
      onIntegrate={handleIntegrate}
      onAutomate={handleAutomate}
      userStatus={userStatus}
      gameModes={gameModes}
      achievements={achievementConfigs}
      upcomingItems={upcomingItems}
      myBattles={myBattles}
      onOpenBattle={handleOpenBattle}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      activeFilter={activeFilter}
      filterOptions={filterOptions}
      onFilterChange={setActiveFilter}
      statusSlot={statusSlot}
    />
  );
}

export default PublicCompetitionPage;
