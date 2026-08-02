import { apiClient } from "@/lib/apiClient";
import type { CompetitionHubApiResponse } from "@/modules/Competition/types/hub";
import type { GameMode } from "@/modules/Competition/types/hub";
import type { TopicBattle, TopicBattleList } from "@/modules/Competition/types/topicBattle";

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
