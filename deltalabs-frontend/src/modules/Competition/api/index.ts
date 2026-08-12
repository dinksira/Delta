import { apiClient } from "@/lib/apiClient";
import type { CompetitionHubApiResponse } from "@/modules/Competition/types/hub";
import type { GameMode } from "@/modules/Competition/types/hub";
import type { TopicBattle, TopicBattleList } from "@/modules/Competition/types/topicBattle";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";
import type {
  CodeExecuteResponse,
  CodeSubmitResponse,
} from "@/modules/Competition/types/codeExecution";

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

export async function fetchTopicBattles() {
  return apiClient.get<TopicBattleList>("/v1/competitions/topic-battles");
}

export async function fetchTopicBattle(id: string) {
  return apiClient.get<TopicBattle>(`/v1/competitions/topic-battles/${id}`);
}

export async function joinTopicBattle(id: string) {
  return apiClient.post<TopicBattle>(`/v1/competitions/topic-battles/${id}/join`);
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
