/**
 * liveDuels data
 * Demo seed for the Live Duel room page. Contains a representative room and a
 * rotating deck of live questions so the workspace demonstrates real-time
 * behaviour (viewer drift, question posting) without a backend channel yet.
 * Mock participants and simulated chatter are intentionally absent — the grid
 * shows only real users (host + the current user), matching the backend roster.
 *
 * A future WebSocket / SSE feed can dispatch the same actions (`liveDuel.ts`)
 * into the `LiveDuelProvider` reducer without touching the view layer.
 */

import type { LiveDuelRoom, LiveQuestion } from "@/modules/Competition/types/liveDuel";

export const DEMO_LIVE_ROOM: LiveDuelRoom = {
  id: "live-geo-001",
  title: "World Geography Challenge",
  hostName: "Dr. Sarah Martinez",
  hostAvatarUrl: null,
  viewers: 1247,
  participants: [
    { id: "host", name: "Dr. Sarah Martinez", isHost: true },
    { id: "you", name: "You", isYou: true },
  ],
  leaderboard: [
    { rank: 1, name: "Dr. Sarah Martinez", points: 0 },
    { rank: 2, name: "You", points: 0, isCurrentUser: true },
  ],
  chat: [],
  liveQuestion: null,
  postedQuestions: [],
};

export const DEMO_LIVE_QUESTIONS: LiveQuestion[] = [
  {
    id: "q1",
    round: 1,
    total: 10,
    text: "Which of these is the ONLY landlocked country in Southeast Asia?",
    points: 250,
    timeLabel: "0:25",
  },
  {
    id: "q2",
    round: 2,
    total: 10,
    text: "The longest river entirely within one country is the Yangtze. True or false?",
    points: 250,
    timeLabel: "0:20",
  },
  {
    id: "q3",
    round: 3,
    total: 10,
    text: "In which desert would you find the city of Timbuktu?",
    points: 250,
    timeLabel: "0:20",
  },
];