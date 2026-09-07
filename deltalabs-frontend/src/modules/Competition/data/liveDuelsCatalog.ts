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

import type { DuelLeaderboardEntry } from "@/modules/Competition/types/duelQuiz";
import type {
  LiveDuelEntry,
  LiveDuelRoom,
  LiveParticipant,
} from "@/modules/Competition/types/liveDuel";

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

// ===== SESSION-CREATED DUEL REGISTRY =====

/**
 * Duels created in this session by the host. A backend `POST /live-duels`
 * endpoint can replace this map without changing the lobby or room flow.
 */
const REGISTERED_LIVE_DUELS = new Map<string, LiveDuelEntry>();

/** Lobby catalog: session-created + backend-resolved duels first, then demo. */
export function getLiveDuelsCatalog(): LiveDuelEntry[] {
  const registered = [...REGISTERED_LIVE_DUELS.values()];
  const registeredIds = new Set(registered.map((entry) => entry.id));
  return [...registered, ...DEMO_LIVE_DUELS.filter((entry) => !registeredIds.has(entry.id))];
}

/** Resolve a lobby entry from the registry or the demo list. */
export function getLiveDuelEntry(entryId?: string | null): LiveDuelEntry | undefined {
  const id = entryId ?? "";
  return REGISTERED_LIVE_DUELS.get(id) ?? DEMO_LIVE_DUELS.find((candidate) => candidate.id === id);
}

export interface CreateLiveDuelInput {
  title: string;
  subject: string;
  difficulty: string;
  durationLabel: string;
  entryFee: string;
  prizePool: string;
  playersMax: number;
  hostName: string;
  hostAvatarUrl?: string | null;
}

/** Register a new live duel hosted by the current user and return its entry. */
export function createLiveDuel(input: CreateLiveDuelInput): LiveDuelEntry {
  const entry: LiveDuelEntry = {
    id: `live-host-${Date.now().toString(36)}`,
    title: input.title.trim(),
    subject: input.subject,
    difficulty: input.difficulty,
    status: "live",
    hostName: input.hostName,
    hostAvatarUrl: input.hostAvatarUrl ?? null,
    viewers: 2 + Math.floor(Math.random() * 8),
    playersJoined: 1,
    playersMax: input.playersMax,
    entryFee: input.entryFee,
    prizePool: input.prizePool,
    durationLabel: input.durationLabel,
    hasJoined: true,
    hostIsUser: true,
  };
  REGISTERED_LIVE_DUELS.set(entry.id, entry);
  return entry;
}

/**
 * Register an entry resolved from the backend (`GET /v1/live-duels`) so the
 * lobby and room flows resolve it without further round-trips. The backend
 * derives `hostIsUser` from the authenticated requester (`GET /{room_id}`), so a
 * session-created entry (registry `hostIsUser: true`) OR an authoritative
 * backend flag can drive host mode after a reload. `hostIsUser` stays `true`
 * when either source says so — it is never downgraded by merging a fetched
 * detail that omits the flag.
 */
export function upsertLiveDuelEntry(entry: LiveDuelEntry): LiveDuelEntry {
  const existing = REGISTERED_LIVE_DUELS.get(entry.id);
  REGISTERED_LIVE_DUELS.set(entry.id, {
    ...existing,
    ...entry,
    hostIsUser: existing?.hostIsUser === true || entry.hostIsUser === true,
  });
  return entry;
}

/** Seed a room from an entry — resolves the session-created registry first. */
export interface BuildLiveDuelRoomOptions {
  /**
   * Treat the host participant as the current user (host-created duel). When
   * omitted, defaults to `entry.hostIsUser`.
   */
  hostIsUser?: boolean;
  /**
   * Real identity of the current user (from the auth session) so the self card
   * shows the account's username/avatar instead of the placeholder "You".
   */
  currentUser?: { id?: string | null; name: string; avatarUrl?: string | null };
  /**
   * Authoritative roster from the backend room detail (host + joined users).
   * When provided it replaces any client-side fabrication.
   */
  participants?: LiveParticipant[];
}

/** Minimal point-free leaderboard over the real roster (no mock names/scores). */
function toRealLeaderboard(participants: LiveParticipant[]): DuelLeaderboardEntry[] {
  return participants.map((participant, index) => ({
    rank: index + 1,
    name: participant.name,
    avatarUrl: participant.avatarUrl ?? undefined,
    points: 0,
    isCurrentUser: participant.isYou === true,
  }));
}

export function buildLiveDuelRoom(
  entryId?: string | null,
  options?: BuildLiveDuelRoomOptions,
): LiveDuelRoom {
  const entry = getLiveDuelEntry(entryId);
  if (!entry) {
    return { ...DEMO_LIVE_DUELS_SEED };
  }
  const hostIsUser = options?.hostIsUser ?? entry.hostIsUser === true;
  const remoteRoster = options?.participants;
  let participants: LiveParticipant[];
  if (remoteRoster && remoteRoster.length > 0) {
    // Backend roster: mark the current user's card (matched by account id).
    const currentUserId = options?.currentUser?.id;
    participants = remoteRoster.map((participant) => ({
      ...participant,
      isHost: participant.isHost === true,
      isYou: currentUserId != null && participant.id === currentUserId,
    }));
  } else {
    const hostCard: LiveParticipant = {
      id: "host",
      name: entry.hostName,
      avatarUrl: entry.hostAvatarUrl,
      isHost: true,
      isYou: hostIsUser,
    };
    const youCard: LiveParticipant = {
      id: "you",
      name: options?.currentUser?.name ?? "You",
      avatarUrl: options?.currentUser?.avatarUrl ?? null,
      isYou: true,
    };
    participants = hostIsUser ? [hostCard] : [hostCard, youCard];
  }
  return {
    ...DEMO_LIVE_DUELS_SEED,
    id: entry.id,
    title: entry.title,
    hostName: entry.hostName,
    hostAvatarUrl: entry.hostAvatarUrl,
    viewers: entry.viewers,
    participants,
    leaderboard: toRealLeaderboard(participants),
    chat: [],
    liveQuestion: null,
    postedQuestions: [],
  };
}