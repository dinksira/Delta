/**
 * Hub-level types for the public competition page.
 *
 * @example
 * ```ts
 * const stats: HubStats = deriveHubStats(battles);
 * ```
 */

import type { TopicBattle } from "./topicBattle";

export type CompetitionTab = "public" | "mine";

export interface HubStats {
  totalCompetitions: number;
  totalPlayers: number;
  fillingNow: number;
  topPrizePool: string;
}

export interface GameMode {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
}

/** A single user achievement shown on the hub. */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

/** Static profile summary rendered by the "Your Status" card. */
export interface UserStatus {
  level: number;
  rank: string;
  progressLabel: string;
  progressValue: number;
  progressText: string;
  earnings: string;
  won: number;
}

export interface CompetitionHubData {
  battles: TopicBattle[];
  myBattles: TopicBattle[];
  stats: HubStats;
}

/** Payload returned by `GET /v1/competitions/hub`. */
export interface CompetitionHubApiResponse {
  modes: GameMode[];
  userStatus: UserStatus;
  achievements: Achievement[];
  myBattles: TopicBattle[];
}
