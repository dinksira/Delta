/**
 * usePublicData
 * Returns mock data for the Public Competition landing page.
 */

import { useEffect, useState } from "react";
import { Trophy, Coins, BookOpen, Swords, Clock } from "lucide-react";

import type { UserStatus, Achievement, GameMode, UpcomingCompetition, CompetitionTab } from "@/modules/Competition/types/public";
import { MOCK_USER_STATUS, MOCK_ACHIEVEMENTS, MOCK_GAME_MODES, MOCK_UPCOMING_COMPETITIONS } from "@/modules/Competition/data/mockPublicData";

// ============================================================================
// RETURN TYPE
// ============================================================================

export interface PublicDataResult {
  userStatus: UserStatus;
  achievements: Achievement[];
  gameModes: GameMode[];
  upcomingCompetitions: UpcomingCompetition[];
  activeTab: CompetitionTab;
  setActiveTab: (tab: CompetitionTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isLoaded: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  trophy: <Trophy className="size-4" />,
  coin: <Coins className="size-4" />,
  book: <BookOpen className="size-4" />,
  swords: <Swords className="size-5" />,
  clock: <Clock className="size-5" />,
};

// ============================================================================
// HOOK
// ============================================================================

export function usePublicData(): PublicDataResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<CompetitionTab>("public");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const achievements = MOCK_ACHIEVEMENTS.map((a) => ({
    ...a,
    icon: ICON_MAP[a.icon] ?? null,
  }));

  const gameModes = MOCK_GAME_MODES.map((g) => ({
    ...g,
    icon: ICON_MAP[g.icon] ?? null,
  }));

  return {
    userStatus: MOCK_USER_STATUS,
    achievements,
    gameModes,
    upcomingCompetitions: MOCK_UPCOMING_COMPETITIONS,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isLoaded,
  };
}
