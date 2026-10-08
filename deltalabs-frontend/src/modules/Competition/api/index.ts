import { apiClient } from "@/lib/apiClient";
import type { CompetitionHubApiResponse } from "@/modules/Competition/types/hub";
import type { GameMode } from "@/modules/Competition/types/hub";
import type { ChampionshipApiResponse } from "@/modules/Competition/types/championship";
import type { CreateChampionshipPayload } from "@/modules/Competition/types/championship";
import type { CompetitionGamesResponse } from "@/modules/Competition/types/games";
import type { TopicBattle, TopicBattleList } from "@/modules/Competition/types/topicBattle";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";
import type { DuelLeaderboardEntry, ParticipantAnswer } from "@/modules/Competition/types/duelQuiz";
import type {
  IntegrityEventResult,
  IntegrityEventType,
  TopicBattleAnswerResult,
} from "@/modules/Competition/types/integrity";
import { toAnswerPayload } from "@/modules/Competition/types/integrity";
import type {
  CodeExecuteResponse,
  CodeSubmitResponse,
} from "@/modules/Competition/types/codeExecution";
import { uploadSchoolMediaFile } from "@/modules/School/api";
import type {
  LiveDuelEntry,
  LiveDuelHistoryEntry,
  LiveDuelRoomDetail,
} from "@/modules/Competition/types/liveDuel";

/** Payload for POST /v1/competitions/topic-battles (mirrors backend TopicBattleCreateRequest). */
export interface CreateTopicBattlePayload {
  title: string;
  subject: string;
  difficulty: string;
  entryFee: string;
  prizePool: string;
  playersMax: number;
  creatorName: string;
  scheduleDate?: string;
  scheduleTime?: string;
  scheduleTimezone?: string;
  format: string;
  durationMinutes: number;
  visibility: string;
  timing: string;
  prizeRule: string;
  questionPoolMode: string;
  easyPct: number;
  mediumPct: number;
  hardPct: number;
  questions: CodingQuestion[];
}

export async function createTopicBattle(payload: CreateTopicBattlePayload): Promise<TopicBattle> {
  return apiClient.post<TopicBattle>("/v1/competitions/topic-battles", { json: payload });
}

export async function fetchCompetitionModes() {
  return apiClient.get<GameMode[]>("/v1/competitions/modes");
}

export async function fetchCompetitionHub() {
  return apiClient.get<CompetitionHubApiResponse>("/v1/competitions/hub");
}

export async function fetchChampionship() {
  return apiClient.get<ChampionshipApiResponse>("/v1/competitions/championship");
}

export async function completeChampionshipStage(stageOrder: number) {
  return apiClient.post<ChampionshipApiResponse>(
    `/v1/competitions/championship/stages/${stageOrder}/complete`,
  );
}

export async function createChampionship(
  payload: CreateChampionshipPayload,
): Promise<ChampionshipApiResponse> {
  return apiClient.post<ChampionshipApiResponse>("/v1/competitions/championship", {
    json: payload,
  });
}

export async function fetchGames() {
  return apiClient.get<CompetitionGamesResponse>("/v1/competitions/games");
}

export async function completeGameStage(gameId: string, stageOrder: number) {
  return apiClient.post<CompetitionGamesResponse>(
    `/v1/competitions/games/${gameId}/stages/${stageOrder}/complete`,
  );
}

export async function fetchTopicBattles() {
  return apiClient.get<TopicBattleList>("/v1/competitions/topic-battles");
}

export async function fetchTopicBattle(id: string) {
  return apiClient.get<TopicBattle>(`/v1/competitions/topic-battles/${id}`);
}

export async function joinTopicBattle(id: string) {
  return apiClient.post<TopicBattle>(`/v1/competitions/topic-battles/${id}/join`);
}

/**
 * Join a live duel room (`POST /v1/live-duels/{id}/join`). Rooms are
 * backend-hosted, so joining is a real network call; a 404/409 surfaces as a
 * thrown error that the lobby join modal translates for the user.
 */
export async function joinLiveDuel(id: string): Promise<{ id: string; joined: boolean }> {
  await apiClient.post<LiveDuelEntry>(`/v1/live-duels/${id}/join`);
  return { id, joined: true };
}

/** Payload for POST /v1/live-duels (host create, camelCase like the view types). */
export interface CreateLiveDuelApiPayload {
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

export async function createLiveDuelRoom(
  payload: CreateLiveDuelApiPayload,
): Promise<LiveDuelEntry> {
  return apiClient.post<LiveDuelEntry>("/v1/live-duels", { json: payload });
}

export async function fetchLiveDuels(): Promise<LiveDuelEntry[]> {
  return apiClient.get<LiveDuelEntry[]>("/v1/live-duels");
}

export async function fetchLiveDuelRoom(roomId: string): Promise<LiveDuelRoomDetail> {
  return apiClient.get<LiveDuelRoomDetail>(`/v1/live-duels/${roomId}`);
}

/** Finished duels (`GET /v1/live-duels/history`) with snapshot final leaderboards. */
export async function fetchLiveDuelHistory(): Promise<LiveDuelHistoryEntry[]> {
  return apiClient.get<LiveDuelHistoryEntry[]>("/v1/live-duels/history");
}

/** Host ends a live duel (`POST /v1/live-duels/{id}/finish`); fans out a SET_LIVE_DUEL_FINISHED. */
export async function finishLiveDuel(roomId: string): Promise<LiveDuelRoomDetail> {
  return apiClient.post<LiveDuelRoomDetail>(`/v1/live-duels/${roomId}/finish`);
}

export interface PostLiveDuelQuestionPayload {
  /** Client-generated id echoed back so host optimistic state dedupes. */
  id: string;
  text: string;
  points: number;
  timeLabel?: string;
  /** Full authored question payload (all nine kinds) for the QuestionModal. */
  question?: CodingQuestion | null;
}

/** Host posts a question live; the backend fans it out via the room channel. */
export async function postLiveDuelQuestion(
  roomId: string,
  payload: PostLiveDuelQuestionPayload,
): Promise<{
  id: string;
  round: number;
  total: number;
  text: string;
  points: number;
  timeLabel?: string;
  question?: CodingQuestion | null;
}> {
  return apiClient.post(`/v1/live-duels/${roomId}/questions`, { json: payload });
}

/** Sends chat through the backend so every connected client in the room sees it. */
export async function postLiveDuelChat(
  roomId: string,
  payload: { text: string; emoji?: string },
): Promise<{
  id: string;
  username: string;
  avatarUrl?: string | null;
  text: string;
  emoji?: string;
  sentAt: number;
}> {
  return apiClient.post(`/v1/live-duels/${roomId}/chat`, { json: payload });
}

/**
 * Participant submits an answer to the live question. The backend grades it
 * against the authored payload, folds the earned points into the room
 * leaderboard, and returns the private result so this client can reveal the
 * outcome without leaking the answer key to the other tabs.
 */
export async function submitLiveDuelAnswer(
  roomId: string,
  questionId: string,
  payload: { answer: ParticipantAnswer },
): Promise<{
  questionId: string;
  correct: boolean | null;
  earnedPoints: number;
  leaderboard: DuelLeaderboardEntry[];
}> {
  return apiClient.post(`/v1/live-duels/${roomId}/questions/${questionId}/answers`, {
    json: payload,
  });
}

export async function completeTopicBattle(id: string) {
  return apiClient.post<TopicBattle>(`/v1/competitions/topic-battles/${id}/complete`);
}

/**
 * Submit one answer for server-side grading
 * (`POST /v1/competitions/topic-battles/{id}/answers`).
 *
 * This is the only thing that decides whether an answer is correct. The client
 * no longer holds the answer key, so a verdict here is the score — which is why
 * `latencyMs` is reported alongside it: the server cannot measure how long a
 * participant actually spent, so it can only ask.
 *
 * Idempotent per question on the server, so a retry after a dropped response is
 * safe to make blindly.
 */
export async function submitTopicBattleAnswer(input: {
  battleId: string;
  questionId: string;
  answer: ParticipantAnswer;
  latencyMs?: number;
}): Promise<TopicBattleAnswerResult> {
  return apiClient.post<TopicBattleAnswerResult>(
    `/v1/competitions/topic-battles/${input.battleId}/answers`,
    { json: { questionId: input.questionId, answer: toAnswerPayload(input.answer), latencyMs: input.latencyMs } },
  );
}

/**
 * Report a proctoring signal (`POST .../integrity-events`).
 *
 * Advisory: the response only says how many signals have accumulated and
 * whether that crossed the review threshold. It never affects the score, so a
 * failed report is not worth surfacing to the player.
 */
export async function recordTopicBattleIntegrityEvent(input: {
  battleId: string;
  eventType: IntegrityEventType;
  questionId?: string;
  detail?: Record<string, unknown>;
}): Promise<IntegrityEventResult> {
  return apiClient.post<IntegrityEventResult>(
    `/v1/competitions/topic-battles/${input.battleId}/integrity-events`,
    { json: { eventType: input.eventType, questionId: input.questionId ?? "", detail: input.detail ?? {} } },
  );
}

/** Payload for POST /v1/competitions/execute (Run: compile + run once). */
export interface ExecuteCodePayload {
  language: string;
  code: string;
  stdin?: string;
}

export async function executeCode(payload: ExecuteCodePayload): Promise<CodeExecuteResponse> {
  return apiClient.post<CodeExecuteResponse>("/v1/competitions/execute", { json: payload });
}

/** Payload for POST /v1/competitions/submit (grade authored test cases). */
export interface SubmitCodePayload {
  language: string;
  code: string;
  testCases: { input: string; expectedOutput: string }[];
}

export async function submitCode(payload: SubmitCodePayload): Promise<CodeSubmitResponse> {
  return apiClient.post<CodeSubmitResponse>("/v1/competitions/submit", {
    json: {
      language: payload.language,
      code: payload.code,
      testCases: payload.testCases,
    },
  });
}

/**
 * Result of uploading a Design Canvas cover through the shared media pipeline
 * (`upload-intent` → presigned PUT → complete).
 */
export interface DesignCoverUploadResult {
  mediaId: string;
  objectKey: string;
  /** Playback-ready URL; may be unresolved while transcoding on some providers. */
  url: string;
}

/** Upload a Design Canvas cover image via the shared `upload-intent` pipeline. */
export async function uploadDesignCoverMedia(
  orgId: string,
  file: File,
): Promise<DesignCoverUploadResult> {
  const uploaded = await uploadSchoolMediaFile(orgId, file, {
    caption: "Design canvas cover",
    visibility: "org",
    publishToFeed: false,
  });
  return {
    mediaId: uploaded.mediaId,
    objectKey: uploaded.objectKey,
    url: uploaded.playbackUrl || `media://${uploaded.mediaId}`,
  };
}
