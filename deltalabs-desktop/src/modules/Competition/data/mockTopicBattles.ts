/**
 * mockTopicBattles
 * Mock topic battle listings.
 */

import type { TopicBattle } from "@/modules/Competition/types/topicBattles";

// ============================================================================
// HELPERS
// ============================================================================

const futureCountdown = (minutesFromNow: number): string =>
  new Date(Date.now() + minutesFromNow * 60000).toISOString();

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_TOPIC_BATTLES: TopicBattle[] = [
  {
    id: "tb-1",
    title: "Calculus Showdown",
    subject: "Mathematics",
    difficulty: "Advanced",
    status: "filling",
    countdownEndsAt: futureCountdown(12),
    creator: { name: "Dinksira Elsa" },
    prizePool: "5,000 ETB",
    entryFee: "100 ETB",
    playersJoined: 4,
    playersMax: 8,
    questions: [],
  },
  {
    id: "tb-2",
    title: "Quantum Physics Duel",
    subject: "Physics",
    difficulty: "Expert",
    status: "filling",
    countdownEndsAt: futureCountdown(8),
    creator: { name: "Leul Solomon" },
    prizePool: "8,000 ETB",
    entryFee: "250 ETB",
    playersJoined: 6,
    playersMax: 8,
    questions: [],
  },
  {
    id: "tb-3",
    title: "Chemical Equations Sprint",
    subject: "Chemistry",
    difficulty: "Intermediate",
    status: "filling",
    countdownEndsAt: futureCountdown(25),
    creator: { name: "Meron Tadesse" },
    prizePool: "3,000 ETB",
    entryFee: "Free",
    playersJoined: 2,
    playersMax: 8,
    questions: [],
  },
  {
    id: "tb-4",
    title: "Ancient Civilizations Clash",
    subject: "History",
    difficulty: "Advanced",
    status: "filling",
    countdownEndsAt: futureCountdown(5),
    creator: { name: "Biruk Assefa" },
    prizePool: "6,000 ETB",
    entryFee: "150 ETB",
    playersJoined: 8,
    playersMax: 8,
    questions: [],
  },
  {
    id: "tb-5",
    title: "The Great Biology Quiz",
    subject: "Biology",
    difficulty: "Beginner",
    status: "starting",
    countdownEndsAt: null,
    creator: { name: "Hanna Wondimu" },
    prizePool: "1,500 ETB",
    entryFee: "Free",
    playersJoined: 1,
    playersMax: 8,
    questions: [],
  },
  {
    id: "tb-6",
    title: "Algebra Speed Run",
    subject: "Mathematics",
    difficulty: "Beginner",
    status: "filling",
    countdownEndsAt: futureCountdown(18),
    creator: { name: "Yonas Ayele" },
    prizePool: "2,000 ETB",
    entryFee: "50 ETB",
    playersJoined: 5,
    playersMax: 8,
    questions: [],
  },
  {
    id: "tb-7",
    title: "World War II Challenge",
    subject: "History",
    difficulty: "Expert",
    status: "starting",
    countdownEndsAt: null,
    creator: { name: "Selam Tesfaye" },
    prizePool: "10,000 ETB",
    entryFee: "500 ETB",
    playersJoined: 3,
    playersMax: 8,
    questions: [],
  },
  {
    id: "tb-8",
    title: "Physics Laws Challenge",
    subject: "Physics",
    difficulty: "Advanced",
    status: "filling",
    countdownEndsAt: futureCountdown(3),
    creator: { name: "Dinksira Elsa" },
    prizePool: "4,500 ETB",
    entryFee: "200 ETB",
    playersJoined: 7,
    playersMax: 8,
    questions: [],
  },
];
