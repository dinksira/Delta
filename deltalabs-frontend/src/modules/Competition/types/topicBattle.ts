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
  prizePool: string;
  entryFee: string;
  playersJoined: number;
  playersMax: number;
  createdAt: string;
  questions: TopicBattleQuestion[];
}

export interface TopicBattleList {
  battles: TopicBattle[];
  total: number;
}
