/**
 * liveDuel types
 * TypeScript definitions for the Live Duel competition room — a live-streaming
 * workspace where a host posts questions in real time and participants answer
 * in real time.
 *
 * The room carries:
 * - the host identity and live viewer count,
 * - a participant roster (on-stage grid),
 * - a live question (`LiveQuestion | null`) published by the host,
 * - a scrolling chat feed of translated message pills,
 * - a live leaderboard reusing `DuelLeaderboardEntry` from the duel quiz.
 *
 * Demo seeding lives in `data/liveDuels.ts`; a WebSocket swap can feed the same
 * reducer later without touching the view layer.
 */

import type { DuelLeaderboardEntry } from "@/modules/Competition/types/duelQuiz";

/** A single comment pill rendered over the stage. */
export interface LiveChatMessage {
  id: string;
  username: string;
  avatarUrl?: string | null;
  text: string;
  /** Optional emoji reaction rendered at the end of the pill. */
  emoji?: string;
  sentAt: number;
}

/** One participant on stage in the secondary grid. */
export interface LiveParticipant {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isHost?: boolean;
  isYou?: boolean;
  /** Participant microphone muted indicator (top-right of the card). */
  micMuted?: boolean;
  /** Participant camera disabled indicator (top-right of the card). */
  cameraOff?: boolean;
}

/** The question the host has posted live, shown at the stage focal point. */
export interface LiveQuestion {
  id: string;
  /** 1-based round number within the battle. */
  round: number;
  total: number;
  text: string;
  points: number;
  /** Optional countdown label such as "0:20". */
  timeLabel?: string;
}

/** Snapshot of a running Live Duel room. */
export interface LiveDuelRoom {
  id: string;
  title: string;
  hostName: string;
  hostAvatarUrl?: string | null;
  viewers: number;
  participants: LiveParticipant[];
  leaderboard: DuelLeaderboardEntry[];
  chat: LiveChatMessage[];
  liveQuestion: LiveQuestion | null;
  /** History of questions the host has posted, newest first. */
  postedQuestions: LiveQuestion[];
}

/** Catalog-level status of a Live Duel card in the lobby list. */
export type LiveDuelEntryStatus = "open" | "live" | "scheduled" | "finished";

/** A card entry in the Live Duels lobby — mirrors the TopicBattle catalog shape. */
export interface LiveDuelEntry {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  status: LiveDuelEntryStatus;
  hostName: string;
  hostAvatarUrl?: string | null;
  viewers: number;
  playersJoined: number;
  playersMax: number;
  entryFee: string;
  prizePool: string;
  /** Start time for scheduled duels. */
  scheduledAt?: string | null;
  /** Human label such as "60 min" / "2 rounds". */
  durationLabel?: string;
  hasJoined?: boolean;
  /** True when the logged-in user created (and is hosting) this duel. */
  hostIsUser?: boolean;
}

/** Full mutable Live Duel workspace state driven by the context reducer. */
export interface LiveDuelState {
  room: LiveDuelRoom;
  isMicMuted: boolean;
  isCameraOff: boolean;
}

/** Room detail resolved from `GET /v1/live-duels/{id}`. */
export interface LiveDuelRoomDetail extends LiveDuelEntry {
  hostUserId?: string | null;
  hasJoined?: boolean;
  postedQuestions: LiveQuestion[];
  chat: LiveChatMessage[];
}

/** Best-effort shape of a realtime event broadcast by `GET /v1/live-duels/ws`. */
export interface LiveDuelServerEvent {
  type: string;
  room_id: string;
  payload: unknown;
  at?: number;
}

export type LiveDuelAction =
  | { type: "SET_ROOM"; payload: LiveDuelRoom }
  | { type: "UPDATE_VIEWERS"; payload: number }
  | { type: "SET_LIVE_QUESTION"; payload: LiveQuestion | null }
  | { type: "POST_LIVE_QUESTION"; payload: LiveQuestion }
  | { type: "APPEND_CHAT_MESSAGE"; payload: LiveChatMessage }
  | { type: "SET_PARTICIPANT_MUTED"; payload: { id: string; micMuted: boolean } }
  | { type: "UPDATE_LEADERBOARD"; payload: DuelLeaderboardEntry[] }
  | { type: "TOGGLE_MIC" }
  | { type: "TOGGLE_CAMERA" };

/** Value exposed by `LiveDuelProvider` to the workspace view. */
export interface LiveDuelContextValue {
  state: LiveDuelState;
  /** Raw dispatcher so live feeds / simulation loops can push room actions. */
  dispatch: (action: LiveDuelAction) => void;
  /** Adds a chat message from the current user and clears the draft. */
  sendMessage: (text: string) => void;
  /** Host: posts a question live to the stage focal and logs it in the room. */
  postLiveQuestion: (question: LiveQuestion) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
}