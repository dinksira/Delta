export type CompetitionCategory = "active" | "recent" | "community";

export interface Competition {
  id: string;
  title: string;
  endsAt: string;
  participants: number;
  tags: string[];
  backgroundImageUrl: string;
  category: CompetitionCategory;
}

export interface CompetitionFilterState {
  activeCategory: CompetitionCategory;
  searchQuery: string;
}

export interface CompetitionContextValue extends CompetitionFilterState {
  setActiveCategory: (category: CompetitionCategory) => void;
  setSearchQuery: (query: string) => void;
}

export type {
  TopicBattle,
  TopicBattleList,
  TopicBattleCreator,
  TopicBattleQuestion,
  TopicBattleTestCase,
} from "./topicBattle";

export type {
  CompetitionTab,
  HubStats,
  GameMode,
  Achievement,
  UserStatus,
  CompetitionHubData,
} from "./hub";
