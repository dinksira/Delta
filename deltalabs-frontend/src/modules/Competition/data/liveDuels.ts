/**
 * liveDuels data
 * Demo seed for the Live Duel room page. Contains a representative room, a
 * rotating deck of live questions, and a pool of simulated chat chatter so the
 * workspace demonstrates real-time behaviour (viewer drift, question posting,
 * incoming chat) without a backend channel yet.
 *
 * A future WebSocket / SSE feed can dispatch the same actions (`liveDuel.ts`)
 * into the `LiveDuelProvider` reducer without touching the view layer.
 */

import type { LiveChatMessage, LiveDuelRoom, LiveQuestion } from "@/modules/Competition/types/liveDuel";

export const DEMO_LIVE_ROOM: LiveDuelRoom = {
  id: "live-geo-001",
  title: "World Geography Challenge",
  hostName: "Dr. Sarah Martinez",
  hostAvatarUrl: null,
  viewers: 1247,
  participants: [
    { id: "p1", name: "Dinksira Elsa", micMuted: true },
    { id: "p2", name: "Kade Okafor", cameraOff: true },
    { id: "p3", name: "Milo Tran", micMuted: true },
    { id: "p4", name: "Zara Hussein", cameraOff: true },
    { id: "p5", name: "Elias Novak" },
    { id: "you", name: "You", isYou: true },
  ],
  leaderboard: [
    { rank: 1, name: "Dink Sira", points: 1240 },
    { rank: 2, name: "Kade Okafor", points: 1105 },
    { rank: 3, name: "You", points: 850, isCurrentUser: true },
    { rank: 4, name: "Milo Tran", points: 730 },
    { rank: 5, name: "Zara Hussein", points: 610 },
    { rank: 6, name: "Elias Novak", points: 405 },
  ],
  chat: [
    { id: "c1", username: "Kade Okafor", text: "This one is tough", sentAt: 1, emoji: "🤔" },
    { id: "c2", username: "Milo Tran", text: "my body is ready", sentAt: 2, emoji: "🔥" },
    { id: "c3", username: "Zara Hussein", text: "Go team!", sentAt: 3, emoji: "🥳" },
  ],
  liveQuestion: null,
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

export const DEMO_CHAT_ROTATION: LiveChatMessage[] = [
  { id: "ca", username: "Milo Tran", text: "Is it La Paz?", emoji: "🤠", sentAt: 0 },
  { id: "cb", username: "Zara Hussein", text: "nice round, Sarah!", emoji: "❤️", sentAt: 0 },
  { id: "cc", username: "Kade Okafor", text: "locked in B", emoji: "✅", sentAt: 0 },
  { id: "cd", username: "Elias Novak", text: "who else used the hint?", emoji: "🙋", sentAt: 0 },
];