export {
  ActiveCompetitionPage,
  CompetitionDetailPage,
  PublicCompetitionPage,
  CreateBattleTopicPage,
  TopicBattleDuelPage,
} from "@/modules/Competition/views";
export {
  CompetitionFilterProvider,
  useCompetitionFilter,
  CreateBattleWizardProvider,
  useCreateBattleWizard,
} from "@/modules/Competition/context";
export {
  useFilteredCompetitions,
  useTopicBattles,
  useCompetitionHub,
  useJoinTopicBattle,
  useDuelQuiz,
  topicBattleQueryKeys,
} from "@/modules/Competition/hooks";
export type {
  Competition,
  CompetitionCategory,
  CompetitionFilterState,
  CompetitionContextValue,
} from "@/modules/Competition/types";
export type {
  TopicBattle,
  TopicBattleList,
  TopicBattleCreator,
  TopicBattleQuestion,
  TopicBattleTestCase,
} from "@/modules/Competition/types";
export type {
  CompetitionTab,
  HubStats,
  GameMode,
  CompetitionHubData,
} from "@/modules/Competition/types";
export type {
  DuelQuestion,
  DuelLeaderboardEntry,
  DuelQuiz,
  DuelState,
} from "@/modules/Competition/types";
export type { CompetitionDetail } from "@/modules/Competition/types/detail";
export type {
  CreateBattleWizardStep,
  CreateBattleWizardState,
  CreateBattleWizardContextValue,
} from "@/modules/Competition/types";
