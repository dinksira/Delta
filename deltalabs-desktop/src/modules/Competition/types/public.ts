/**
 * Public Competition landing page types.
 */

export type CompetitionTab = "public" | "mine";

export type UpcomingCompetitionStatus = "filling" | "starting";

export interface UserStatus {
  level: number;
  tier: string;
  currentPoints: number;
  maxPoints: number;
  totalEarnings: string;
  totalWon: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface GameMode {
  id: string;
  icon: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaAction: string;
}

export interface UpcomingCompetition {
  id: string;
  title: string;
  category: string;
  playerCount: number;
  status: UpcomingCompetitionStatus;
  fee: string;
}

// My Competitions — customizable table types
export interface CustomTableColumn {
  id: string;
  label: string;
  type?: "text" | "number" | "date" | "tag";
}

export interface CustomTableRow {
  id: string;
  cells: Record<string, string>;
}

export interface CustomTableState {
  columns: CustomTableColumn[];
  rows: CustomTableRow[];
}
