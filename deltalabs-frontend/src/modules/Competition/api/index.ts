import { apiClient } from "@/lib/apiClient";
import type { CompetitionHubApiResponse } from "@/modules/Competition/types/hub";
import type { GameMode } from "@/modules/Competition/types/hub";
import type { TopicBattle, TopicBattleList } from "@/modules/Competition/types/topicBattle";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";

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
