/**
 * Games lobby types for the public competitions arcade.
 *
 * Every `open` game carries a staged unlock ladder (`stages`) — win a stage's
 * duel to collect its points + prize and unlock the next. The ladder reuses
 * the real duel engine end-to-end (duel → submit → complete → points + prize
 * credited to the player profile).
 */

export type CompetitionGameStatus = "open" | "locked" | "coming-soon";

export type GameStageStatus = "locked" | "unlocked" | "completed";

/** One unlockable stage of a game ladder. */
export interface GameStage {
  id: string;
  /** 1-based position within the ladder (W1/W2/W3). */
  order: number;
  name: string;
  shortLabel: string;
  status: GameStageStatus;
  startsAt: string;
  pointsToEarn: number;
  pointsEarned: number;
  isCurrent: boolean;
  /** Real seeded battle the stage duel is played against. */
  battleId?: string;
  entryFee: string;
  prizePool: string;
}

export interface CompetitionGame {
  id: string;
  title: string;
  genre: string;
  description: string;
  difficulty: string;
  /** Design-token pill tone; mapped by GameCard (primary | chip tones). */
  tone: string;
  isChampionship: boolean;
  status: CompetitionGameStatus;
  pointsToEarn: number;
  playersCount: number;
  playersMax: number | null;
  /** Battle backing this game; null for locked/coming-soon entries. */
  battleId: string | null;
  unlockHint: string | null;
  /** Unlock ladder for open games; empty for locked/coming-soon. */
  stages: GameStage[];
}

/** Payload returned by `GET /v1/competitions/games`. */
export interface CompetitionGamesResponse {
  games: CompetitionGame[];
  total: number;
  openCount: number;
}