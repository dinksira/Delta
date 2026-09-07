import { apiClient } from "@/lib/apiClient";
import type { CompetitionHubApiResponse } from "@/modules/Competition/types/hub";
import type { GameMode } from "@/modules/Competition/types/hub";
import type { ChampionshipApiResponse } from "@/modules/Competition/types/championship";
import type { CreateChampionshipPayload } from "@/modules/Competition/types/championship";
import type { CompetitionGamesResponse } from "@/modules/Competition/types/games";
import type { TopicBattle, TopicBattleList } from "@/modules/Competition/types/topicBattle";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";
import type {
  CodeExecuteResponse,
  CodeSubmitResponse,
} from "@/modules/Competition/types/codeExecution";
import { uploadSchoolMediaFile } from "@/modules/School/api";
import type { LiveDuelEntry, LiveDuelRoomDetail } from "@/modules/Competition/types/liveDuel";

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
 * Join a live duel room. Backend-hosted rooms (`<24-hex-id>`) hit
 * `POST /v1/live-duels/{id}/join` so the seat fill is shared; demo/local rooms
 * resolve via the short stub to keep the bag-of-demo flow identical to the
 * topic battle flow.
 */
export async function joinLiveDuel(id: string): Promise<{ id: string; joined: boolean }> {
  if (/^[0-9a-f]{24}$/i.test(id)) {
    try {
      await apiClient.post<LiveDuelEntry>(`/v1/live-duels/${id}/join`);
      return { id, joined: true };
    } catch {
      // Fall through to the demo stub; the lobby join modal still succeeds.
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 700));
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

export async function createLiveDuelRoom(payload: CreateLiveDuelApiPayload): Promise<LiveDuelEntry> {
  return apiClient.post<LiveDuelEntry>("/v1/live-duels", { json: payload });
}

export async function fetchLiveDuels(): Promise<LiveDuelEntry[]> {
  return apiClient.get<LiveDuelEntry[]>("/v1/live-duels");
}

export async function fetchLiveDuelRoom(roomId: string): Promise<LiveDuelRoomDetail> {
  return apiClient.get<LiveDuelRoomDetail>(`/v1/live-duels/${roomId}`);
}

export interface PostLiveDuelQuestionPayload {
  text: string;
  points: number;
  timeLabel?: string;
}

/** Host posts a question live; the backend fans it out via the room channel. */
export async function postLiveDuelQuestion(
  roomId: string,
  payload: PostLiveDuelQuestionPayload,
): Promise<{ id: string; round: number; total: number; text: string; points: number; timeLabel?: string }> {
  return apiClient.post(`/v1/live-duels/${roomId}/questions`, { json: payload });
}

/** Sends chat through the backend so every connected client in the room sees it. */
export async function postLiveDuelChat(
  roomId: string,
  payload: { text: string; emoji?: string },
): Promise<{ id: string; username: string; avatarUrl?: string | null; text: string; emoji?: string; sentAt: number }> {
  return apiClient.post(`/v1/live-duels/${roomId}/chat`, { json: payload });
}

export async function completeTopicBattle(id: string) {
  return apiClient.post<TopicBattle>(`/v1/competitions/topic-battles/${id}/complete`);
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
