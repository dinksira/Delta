/**
 * championship types
 * TypeScript definitions for the Championship game mode — a season-long
 * knockout tournament where players complete stages to unlock the next one,
 * collecting season points along the way. Finishing the current season
 * unlocks the next season.
 *
 * @example
 * ```ts
 * const data: ChampionshipApiResponse = await fetchChampionship();
 * ```
 */

/** A single stage of a championship season. */
export type ChampionshipStageStatus = "locked" | "unlocked" | "completed";

export interface ChampionshipStage {
  id: string;
  /** 1-based position within the season. */
  order: number;
  /** Display name, e.g. "Qualifier Round" or "Grand Final". */
  name: string;
  /** Short label used in compact layouts, e.g. "R1" / "QF". */
  shortLabel: string;
  status: ChampionshipStageStatus;
  startsAt: string;
  /** Total points available for completing this stage. */
  pointsToEarn: number;
  /** Points the current player already earned from this stage. */
  pointsEarned: number;
  /** Marked on the single stage the player is expected to play next. */
  isCurrent: boolean;
  /** Real seeded battle the stage duel is played against ("Play" launches it). */
  battleId?: string;
  /** Monetized cost to enter the stage, e.g. "Free" or "ETB 25". */
  entryFee: string;
  /** What the stage pays out on completion, e.g. "ETB 50". */
  prizePool: string;
}

/** A ranked entry in the season leaderboard. */
export interface ChampionshipStanding {
  rank: number;
  name: string;
  avatarUrl?: string;
  points: number;
  isCurrentUser?: boolean;
}

/** Season summary shown in the Championship hero panel. */
export interface ChampionshipSeason {
  id: string;
  number: number;
  title: string;
  status: "active" | "completed";
  startsAt: string;
  endsAt: string;
  totalStages: number;
  completedStages: number;
  /** 1-based order of the stage the player is currently on (null when finished). */
  currentStageOrder: number | null;
  pointsEarned: number;
  totalPoints: number;
  playerRank: number;
  totalPlayers: number;
}

/** Info about the following season and whether it is unlocked yet. */
export interface ChampionshipNextSeason {
  number: number;
  title: string;
  isUnlocked: boolean;
  /** Copy explaining how to unlock the next season, shown when locked. */
  unlockHint: string;
}

/** Payload returned by `GET /v1/competitions/championship`. */
export interface ChampionshipApiResponse {
  season: ChampionshipSeason;
  stages: ChampionshipStage[];
  standings: ChampionshipStanding[];
  nextSeason: ChampionshipNextSeason;
}

/** Payload for `POST /v1/competitions/championship` (mirrors backend ChampionshipCreateRequest). */
export interface CreateChampionshipPayload {
  title: string;
  description?: string;
  /** Number of knockout stages: 3, 5 or 8. */
  stageCount: number;
  /** Entry cost per stage, e.g. "Free" or "ETB 5". */
  entryFee: string;
  /** Base ETB prize the wizard escalates per stage. */
  prizeBaseEtb: number;
  timing: "instant" | "schedule";
  scheduleDate?: string;
  scheduleTime?: string;
  scheduleTimezone?: string;
  creatorName?: string;
  /**
   * Per-stage compiled question sets (index-aligned with the stage ladder).
   * An empty inner array means the stage falls back to a curated battle pool.
   */
  stageQuestions?: BattleQuestionDto[][];
}

/**
 * One authored question in compiled form — mirrors the shape sent to
 * `POST /v1/competitions/topic-battles` so the stage battle stores it.
 * Reuses the question-builder draft model (see createBattle types).
 */
export interface BattleQuestionDto {
  id: string;
  title: string;
  description: string;
  constraints: string;
  codeTemplate: string;
  language: string;
  difficulty: string;
  timeLimitMinutes: number;
  points: number;
  hintEnabled: boolean;
  hintText: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    explanation?: string;
    isSample?: boolean;
    isHidden?: boolean;
  }>;
  kind: string;
  mcqOptions: Array<{ id: string; label: string; text: string }>;
  mcqCorrectId: string;
  tfAnswer: boolean;
  fillExpected: string;
  fillAnswers: string[];
  matchingAnswers: Array<{ id: string; text: string }>;
  matchingPairs: Array<{ id: string; prompt: string; answerId: string }>;
  orderingItems: Array<{ id: string; text: string }>;
  markdown: { source: string; rubric: string };
  design: {
    brief: string;
    cover: { id: string; url: string; kind: "image" | "video" } | null;
    canvasWidth: number;
    canvasHeight: number;
    deliverables: string[];
    rubric: string;
  };
}