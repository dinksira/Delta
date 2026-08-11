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

export interface TopicBattleOrderingItem {
  id: string;
  text: string;
}

export interface TopicBattleQuestion {
  id: string;
  title: string;
  description: string;
  codeTemplate: string;
  language: string;
  difficulty: string;
  timeLimitMinutes: number;
  points: number;
  hintEnabled: boolean;
  hintText: string;
  testCases: TopicBattleTestCase[];
  /** Authoring surface discriminator (coding / quiz kinds). */
  kind: string;
  mcqOptions: TopicBattleOption[];
  mcqCorrectId: string;
  tfAnswer: boolean;
  fillExpected: string;
  /** One answer per `[data-blank]` marker in the stem (multi-blank questions). */
  fillAnswers?: string[];
  matchingAnswers?: TopicBattleMatchingAnswer[];
  matchingPairs: TopicBattleMatchingPair[];
  orderingItems: TopicBattleOrderingItem[];
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
