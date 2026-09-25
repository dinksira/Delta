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
 * Rooms are backend-hosted and realtime (WebSocket + Redis Pub/Sub); the
 * lobby history lists finished rooms with their snapshot final leaderboard for
 * replay.
 */

import type { DuelLeaderboardEntry, ParticipantAnswer } from "@/modules/Competition/types/duelQuiz";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";

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
  /**
   * Full authored question payload (all nine kinds) when available. Host-posted
   * questions carry it so the `QuestionModal` can render the real structure
   * (MCQ options, fill-blank blanks, matching pairs, code template, markdown
   * source, design brief…) instead of only the flat `text` fallback.
   */
  question?: CodingQuestion | null;
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

/**
 * The current user's locked-in answer for one posted question. Stored per
 * `questionId` so re-opening the modal reveals the result and re-submitting is
 * impossible. The backend is the single source of truth for grading and points.
 */
export interface LiveSubmittedAnswer {
  questionId: string;
  answer: ParticipantAnswer;
  /** True/false when auto-graded; null for recorded-for-review kinds. */
  correct: boolean | null;
  earnedPoints: number;
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
  /** Locked-in answers per `questionId` for the current user. */
  answers: Record<string, LiveSubmittedAnswer>;
}

/** Raw answer record from `GET /v1/live-duels/{id}` (carries the user id so a reload can restore the current user's reveal). */
export interface LiveDuelAnswerRecord {
  questionId: string;
  userId: string;
  answer: ParticipantAnswer;
  correct: boolean | null;
  earnedPoints: number;
}

/** Room detail resolved from `GET /v1/live-duels/{id}`. */
export interface LiveDuelRoomDetail extends LiveDuelEntry {
  hostUserId?: string | null;
  hasJoined?: boolean;
  /** Real on-stage roster (host + joined users) resolved from the backend. */
  participants?: LiveParticipant[];
  /** Current ranked points table (real rooms only). */
  leaderboard?: DuelLeaderboardEntry[];
  /** Every recorded answer (so a reload restores the participant's reveal). */
  answers?: LiveDuelAnswerRecord[];
  /** Final leaderboard snapshot persisted when the host ended the duel (replay). */
  finalLeaderboard?: DuelLeaderboardEntry[] | null;
  /** Completion timestamp (epoch ms) set when the duel was finished. */
  finishedAt?: number | null;
  postedQuestions: LiveQuestion[];
  chat: LiveChatMessage[];
}

/** A finished duel entry from `GET /v1/live-duels/history` (lobby replay list). */
export interface LiveDuelHistoryEntry extends LiveDuelEntry {
  /** Final ranked points table, frozen when the host ended the duel. */
  finalLeaderboard?: DuelLeaderboardEntry[] | null;
  /** Completion timestamp (epoch ms). */
  finishedAt?: number | null;
}

/** Best-effort shape of a realtime event broadcast by `GET /v1/live-duels/ws`. */
export interface LiveDuelServerEvent {
  type: string;
  room_id: string;
  payload: unknown;
  at?: number;
}

/** One side's camera/mic state for remote participant indicators. */
export interface LiveMediaState {
  cameraOff: boolean;
  micMuted: boolean;
}

/**
 * WebRTC signaling envelope relayed through the room channel. Peers route on
 * `fromUserId` (stamped by the backend so it is never spoofable) and target a
 * single peer via `toUserId`; `media-state` is a room broadcast.
 */
export interface LiveMediaSignal {
  type: "offer" | "answer" | "ice" | "media-state";
  /** Authenticated sender id in the `MEDIA_SIGNAL` echo. */
  fromUserId?: string;
  /** Optional recipient id; omitted signals are room-wide. */
  toUserId?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit | null;
  media?: LiveMediaState;
}

export type LiveDuelAction =
  | { type: "SET_ROOM"; payload: LiveDuelRoom }
  | { type: "UPDATE_VIEWERS"; payload: number }
  | { type: "SET_LIVE_QUESTION"; payload: LiveQuestion | null }
  | { type: "POST_LIVE_QUESTION"; payload: LiveQuestion }
  | { type: "APPEND_CHAT_MESSAGE"; payload: LiveChatMessage }
  | { type: "SET_PARTICIPANT_MUTED"; payload: { id: string; micMuted: boolean } }
  | {
      type: "UPDATE_PARTICIPANT_MEDIA";
      payload: { id: string; cameraOff?: boolean; micMuted?: boolean };
    }
  | { type: "ADD_PARTICIPANT"; payload: LiveParticipant }
  | { type: "UPDATE_LEADERBOARD"; payload: DuelLeaderboardEntry[] }
  | { type: "SET_LIVE_ANSWER_RESULT"; payload: LiveSubmittedAnswer }
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
