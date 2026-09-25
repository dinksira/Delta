/**
 * liveDuelsCatalog data
 * Session cache of Live Duel entries resolved from the backend (`GET
 * /v1/live-duels`). Entries are upserted by the lobby and the room detail fetch
 * so any room a user navigates to resolves; `buildLiveDuelRoom` seeds the room
 * snapshot from an entry (the backend room detail reconciled over the socket is
 * the authoritative roster/leaderboard).
 */

import type { DuelLeaderboardEntry } from "@/modules/Competition/types/duelQuiz";
import type {
  LiveDuelEntry,
  LiveDuelRoom,
  LiveParticipant,
} from "@/modules/Competition/types/liveDuel";

// ===== SESSION-CREATED / RESOLVED DUEL REGISTRY =====

/**
 * Duels resolved from the backend during this session (fetch list / room detail
 * / host create). The backend is the source of truth; this map is a session
 * cache so the lobby and room flows resolve a duel without extra round-trips.
 */
const REGISTERED_LIVE_DUELS = new Map<string, LiveDuelEntry>();

/**
 * Lobby catalog: every backend entry resolved this session, newest first
 * (registry insertion order — host-created duels land at the top).
 */
export function getLiveDuelsCatalog(): LiveDuelEntry[] {
  return [...REGISTERED_LIVE_DUELS.values()];
}

/** Resolve a lobby entry from the session registry. */
export function getLiveDuelEntry(entryId?: string | null): LiveDuelEntry | undefined {
  const id = entryId ?? "";
  return REGISTERED_LIVE_DUELS.get(id);
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

/** Seed a room from an entry — resolves the session registry first. */
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

/**
 * Build the initial `LiveDuelRoom` snapshot for a room id. When the entry is
 * not yet in the registry (direct nav to a fresh backend room), a bare
 * placeholder boots the workspace instantly; the room detail fetch reconciles
 * the real roster, title and host in `SET_ROOM`.
 */
export function buildLiveDuelRoom(
  entryId?: string | null,
  options?: BuildLiveDuelRoomOptions,
): LiveDuelRoom {
  const entry = getLiveDuelEntry(entryId);
  const hostIsUser = options?.hostIsUser ?? entry?.hostIsUser === true;
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
  } else if (entry) {
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
  } else {
    const youCard: LiveParticipant = {
      id: "you",
      name: options?.currentUser?.name ?? "You",
      avatarUrl: options?.currentUser?.avatarUrl ?? null,
      isYou: true,
    };
    participants = [youCard];
  }
  return {
    id: entry?.id ?? entryId ?? "",
    title: entry?.title ?? "Live Duel",
    hostName: entry?.hostName ?? "Host",
    hostAvatarUrl: entry?.hostAvatarUrl,
    viewers: entry?.viewers ?? 0,
    participants,
    leaderboard: toRealLeaderboard(participants),
    chat: [],
    liveQuestion: null,
    postedQuestions: [],
  };
}
