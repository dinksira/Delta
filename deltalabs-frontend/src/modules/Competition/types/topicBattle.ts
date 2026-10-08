/**
 * Topic battle types shared with the backend `/v1/competitions/topic-battles` API.
 *
 * @example
 * ```ts
 * const battles: TopicBattle[] = (await fetchTopicBattles()).battles;
 * ```
 */

export interface TopicBattleTestCase {
  input: string;
  expectedOutput: string;
  explanation: string;
  isSample: boolean;
  isHidden: boolean;
}

export interface TopicBattleOption {
  id: string;
  label: string;
  text: string;
}

export interface TopicBattleMatchingAnswer {
  id: string;
  text: string;
}

export interface TopicBattleMatchingPair {
  id: string;
  prompt: string;
  /** References a `TopicBattleMatchingAnswer` in `matchingAnswers` (Column B pool). */
  answerId: string;
}

/**
 * Column A of a matching question as the participant receives it: the prompt
 * without its pairing. Both columns ship to the player; the mapping between
 * them is the answer key and stays on the server.
 */
export interface TopicBattleMatchingPrompt {
  id: string;
  prompt: string;
}

export interface TopicBattleOrderingItem {
  id: string;
  text: string;
}

/** Payload authored by the Markdown Pad workspace module (kind "markdown"). */
export interface TopicBattleMarkdownPayload {
  source: string;
  rubric: string;
}

/**
 * Markdown Pad as delivered to a participant: the document, without the rubric.
 * The rubric is the grading standard, so shipping it to the player would hand
 * over the subjective half of the answer.
 */
export interface PublicTopicBattleMarkdownPayload {
  source: string;
}

export interface TopicBattleMediaAsset {
  id: string;
  url: string;
  kind: "image" | "video";
}

/** Payload authored by the Design Canvas workspace module (kind "design"). */
export interface TopicBattleDesignPayload {
  brief: string;
  cover: TopicBattleMediaAsset | null;
  canvasWidth: number;
  canvasHeight: number;
  deliverables: string[];
  rubric: string;
}

/** Design Canvas as delivered to a participant — the brief without the rubric. */
export interface PublicTopicBattleDesignPayload {
  brief: string;
  cover: TopicBattleMediaAsset | null;
  canvasWidth: number;
  canvasHeight: number;
  deliverables: string[];
}

export interface TopicBattleQuestion {
  id: string;
  title: string;
  description: string;
  /** LeetCode-style constraints section (rich HTML), shown to participants. */
  constraints?: string;
  codeTemplate: string;
  language: string;
  difficulty: string;
  timeLimitMinutes: number;
  points: number;
  hintEnabled: boolean;
  hintText: string;
  /** Authoring surface discriminator (coding / quiz kinds). */
  kind: string;
  mcqOptions: TopicBattleOption[];
  orderingItems: TopicBattleOrderingItem[];
  /**
   * Matching, as delivered to a participant.
   *
   * This is the redacted projection from the backend: the answer key
   * (`mcqCorrectId`, `tfAnswer`, `fillExpected`, `fillAnswers`, the `answerId` on
   * each pair, expected outputs, hidden test cases) is never sent. Grading
   * happens server-side, so nothing here can mark an answer correct.
   */
  matchingAnswers?: TopicBattleMatchingAnswer[];
  matchingPrompts?: TopicBattleMatchingPrompt[];
  /** Sample inputs only — expected output is withheld. */
  sampleInputs?: string[];
  /** How many `[data-blank]` markers the stem has. Structure, not key. */
  blankCount?: number;
  /** Markdown Pad payload (present when kind === "markdown"). */
  markdown?: PublicTopicBattleMarkdownPayload;
  /** Design Canvas payload (present when kind === "design"). */
  design?: PublicTopicBattleDesignPayload;
}

export interface TopicBattleCreator {
  name: string;
  [key: string]: unknown;
}

export interface TopicBattle {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  status: string;
  countdownEndsAt: string | null;
  creator: TopicBattleCreator;
  /** Backend user id that hosted this battle, or null for anonymous hosts. */
  ownerUserId: string | null;
  /** True when the signed-in user hosted this battle (manage/track only). */
  isOwner: boolean;
  /** True when the signed-in user has already joined this battle. */
  hasJoined: boolean;
  /** True when the signed-in user has finished this battle (cannot re-take). */
  hasCompleted: boolean;
  prizePool: string;
  entryFee: string;
  playersJoined: number;
  playersMax: number;
  format: string;
  durationMinutes: number;
  visibility: string;
  timing: string;
  prizeRule: string;
  questionPoolMode: string;
  scheduleDate: string;
  scheduleTime: string;
  scheduleTimezone: string;
  easyPct: number;
  mediumPct: number;
  hardPct: number;
  createdAt: string;
  questions: TopicBattleQuestion[];
}

export interface TopicBattleList {
  battles: TopicBattle[];
  total: number;
}

/** One ranked row of a battle's standings (`GET .../topic-battles/{id}/leaderboard`). */
export interface TopicBattleLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  isOwner: boolean;
}

/**
 * Server-derived standings for a topic battle. Every value is computed from
 * persisted completion records on the backend, so a client cannot inflate its
 * own rank. Ranks are dense: tied players share a rank (1, 1, 2).
 */
export interface TopicBattleLeaderboard {
  battleId: string;
  entries: TopicBattleLeaderboardEntry[];
  totalCompleted: number;
}
