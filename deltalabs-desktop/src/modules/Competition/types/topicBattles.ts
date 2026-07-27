/**
 * topicBattles types
 * TypeScript definitions for topic battle listings.
 */

import type { TestCase } from './topicBattleDraft';

export interface BattleQuestion {
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
  testCases: TestCase[];
}

export interface TopicBattle {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  status: "filling" | "starting";
  countdownEndsAt: string | null;
  creator: {
    name: string;
    avatarUrl?: string;
  };
  prizePool: string;
  entryFee: string | "free";
  playersJoined: number;
  playersMax: number;
  questions: BattleQuestion[];
}
