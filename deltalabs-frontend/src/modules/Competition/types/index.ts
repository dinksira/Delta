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
  DuelQuestion,
  DuelLeaderboardEntry,
  DuelQuiz,
  DuelState,
} from "./duelQuiz";

export type {
  CompetitionTab,
  HubStats,
  GameMode,
  Achievement,
  UserStatus,
  CompetitionHubData,
} from "./hub";

export type {
  ChampionshipStage,
  ChampionshipStageStatus,
  ChampionshipStanding,
  ChampionshipSeason,
  ChampionshipNextSeason,
  ChampionshipApiResponse,
} from "./championship";

export type {
  CompetitionGame,
  CompetitionGameStatus,
  CompetitionGamesResponse,
} from "./games";

export type {
  CreateBattleWizardStep,
  CreateBattleWizardState,
  CreateBattleWizardContextValue,
  TopicBattleDraft,
  CodingQuestion,
  TestCase,
  QuestionPoolMode,
  QuestionKind,
  MediaAsset,
  MarkdownPadPayload,
  DesignCanvasPayload,
} from "./createBattle";

export type {
  LiveDuelRoom,
  LiveDuelState,
  LiveDuelAction,
  LiveDuelContextValue,
  LiveChatMessage,
  LiveParticipant,
  LiveQuestion,
  LiveDuelEntry,
  LiveDuelEntryStatus,
} from "./liveDuel";
