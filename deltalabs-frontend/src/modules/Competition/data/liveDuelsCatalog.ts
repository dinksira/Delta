/**
 * liveDuelsCatalog data
 * Demo catalog of Live Duel cards rendered by the lobby list page. Each entry
 * mirrors the TopicBattle catalog shape (`LiveDuelEntry`): subject/difficulty,
 * host identity, live viewers, seat fill, prize pool and entry fee, plus the
 * room seed used after joining (`buildLiveDuelRoom`).
 *
 * A backend `GET /live-duels` feed can replace this module without changing the
 * list view or the join flow.
 */

import type { LiveDuelEntry, LiveDuelRoom } from "@/modules/Competition/types/liveDuel";

export const DEMO_LIVE_DUELS: LiveDuelEntry[] = [
  {
    id: "live-geo-001",
    title: "World Geography Showdown",
    subject: "Geography",
    difficulty: "Medium",
    status: "live",
    hostName: "Dr. Sarah Martinez",
    hostAvatarUrl: null,
    viewers: 1247,
    playersJoined: 8,
    playersMax: 20,
    entryFee: "Free",
    prizePool: "10,000 ETB",
    durationLabel: "10 rounds",
    hasJoined: true,
  },
  {
    id: "live-math-002",
    title: "Quick Maths Live Duel",
    subject: "Mathematics",
    difficulty: "Easy",
    status: "open",
    hostName: "Prof. Elias Novak",
    hostAvatarUrl: null,
    viewers: 3,
    playersJoined: 3,
    playersMax: 16,
    entryFee: "50 ETB",
    prizePool: "5,000 ETB",
    durationLabel: "60 min",
  },
  {
    id: "live-code-003",
    title: "Code Sprint Arena",
    subject: "Programming",
    difficulty: "Hard",
    status: "live",
    hostName: "Kade Okafor",
    hostAvatarUrl: null,
    viewers: 891,
    playersJoined: 12,
    playersMax: 24,
    entryFee: "100 ETB",
    prizePool: "20,000 ETB",
    durationLabel: "10 rounds",
  },
  {
    id: "live-hist-004",
    title: "History Rapid Fire",
    subject: "History",
    difficulty: "Medium",
    status: "scheduled",
    hostName: "Zara Hussein",
    hostAvatarUrl: null,
    viewers: 0,
    playersJoined: 0,
    playersMax: 12,
    entryFee: "Free",
    prizePool: "3,000 ETB",
    scheduledAt: "2026-09-08T18:00:00.000Z",
    durationLabel: "45 min",
  },
  {
    id: "live-bio-005",
    title: "Science Smackdown",
    subject: "Biology",
    difficulty: "Medium",
    status: "open",
    hostName: "Milo Tran",
    hostAvatarUrl: null,
    viewers: 0,
    playersJoined: 5,
    playersMax: 18,
    entryFee: "50 ETB",
    prizePool: "7,500 ETB",
    durationLabel: "60 min",
  },
  {
    id: "live-gen-006",
    title: "Brain Brawl: Trivia",
    subject: "General",
    difficulty: "Easy",
    status: "live",
    hostName: "Dinksira Elsa",
    hostAvatarUrl: null,
    viewers: 1562,
    playersJoined: 20,
    playersMax: 40,
    entryFee: "Free",
    prizePool: "15,000 ETB",
    durationLabel: "10 rounds",
  },
];

export const DEMO_LIVE_DUELS_SEED: LiveDuelRoom = {
  id: "live-geo-001",
  title: "World Geography Showdown",
  hostName: "Dr. Sarah Martinez",
  hostAvatarUrl: null,
  viewers: 1247,
  participants: [
    { id: "you", name: "You", isYou: true },
    { id: "p2", name: "Kade Okafor", cameraOff: true },
    { id: "p3", name: "Milo Tran", micMuted: true },
  ],
  leaderboard: [
    { rank: 1, name: "Dink Sira", points: 1240 },
    { rank: 2, name: "Kade Okafor", points: 1105 },
    { rank: 3, name: "You", points: 850, isCurrentUser: true },
  ],
  chat: [],
  liveQuestion: null,
};

/** Seed a room from an entry; falls back to the geography seed when unknown. */
export function buildLiveDuelRoom(entryId?: string | null): LiveDuelRoom {
  const entry = DEMO_LIVE_DUELS.find((candidate) => candidate.id === entryId);
  if (!entry) {
    return DEMO_LIVE_DUELS_SEED;
  }
  return {
    ...DEMO_LIVE_DUELS_SEED,
    id: entry.id,
    title: entry.title,
    hostName: entry.hostName,
    hostAvatarUrl: entry.hostAvatarUrl,
    viewers: entry.viewers,
    participants: [
      { id: "host", name: entry.hostName, avatarUrl: entry.hostAvatarUrl, isHost: true },
      { id: "you", name: "You", isYou: true },
      ...DEMO_LIVE_DUELS_SEED.participants.slice(1),
    ],
  };
}