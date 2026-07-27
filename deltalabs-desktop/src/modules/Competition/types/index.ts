/**
 * Competition types
 * TypeScript definitions for the Competition module.
 */

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

// Public competition landing types
export type { UserStatus, Achievement, GameMode, UpcomingCompetition, CompetitionTab, UpcomingCompetitionStatus } from "./public";
export type { HostCompetitionDraft, PrizeEntry, PhaseEntry, CompetitionModuleType, StepValidation } from "./host";
