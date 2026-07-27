/**
 * Competition module — competitions and challenges.
 * Standard folders: views, context, features, api, hooks, routing, types, utils.
 */

export { ActiveCompetitionPage, CompetitionDetailPage, PublicCompetitionPage, HostCompetitionPage, TopicBattlesPage, DuelScreenPage, CreateTopicBattlePage } from "@/modules/Competition/views";
export { CompetitionFilterProvider, useCompetitionFilter } from "@/modules/Competition/context";
export { useCompetitions, useFilteredCompetitions, useCompetitionDetail, usePublicData, useCustomTable, useHostCompetitionWizard } from "@/modules/Competition/hooks";
export type { Competition, CompetitionCategory, CompetitionFilterState, CompetitionContextValue } from "@/modules/Competition/types";
export type { CompetitionDetail, CompetitionPrize, CompetitionTimelineStep } from "@/modules/Competition/types/detail";
export type { HostCompetitionDraft, PrizeEntry, PhaseEntry, CompetitionModuleType, StepValidation } from "@/modules/Competition/types/host";
