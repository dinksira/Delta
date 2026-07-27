/**
 * Competition API functions.
 */

import { apiClient } from "@/lib/apiClient";
import type { CodingQuestion, TestCase } from "@/modules/Competition/types/topicBattleDraft";
import type { TopicBattle } from "@/modules/Competition/types/topicBattles";

// ============================================================================
// API FUNCTIONS — GENERAL COMPETITIONS
// ============================================================================

export async function fetchCompetitionModuleStatus() {
  return apiClient.get("/v1/competitions");
}

export async function fetchCompetitions() {
  return apiClient.get("/v1/competitions/list");
}

export async function fetchCompetitionDetail(id: string) {
  return apiClient.get(`/v1/competitions/${id}`);
}

export async function saveCompetitionDraft(payload: Record<string, unknown>) {
  return apiClient.post("/v1/competitions/draft", { json: payload });
}

export async function publishCompetition(payload: Record<string, unknown>) {
  return apiClient.post("/v1/competitions", { json: payload });
}

// ============================================================================
// API FUNCTIONS — TOPIC BATTLES
// ============================================================================

export interface QuestionApiShape {
  title: string;
  description: string;
  codeTemplate: string;
  language: string;
  difficulty: string;
  timeLimitMinutes: number;
  points: number;
  hintEnabled: boolean;
  hintText: string;
  testCases: TestCase[];
}

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
  questions?: QuestionApiShape[];
}

export async function createTopicBattle(payload: CreateTopicBattlePayload): Promise<TopicBattle> {
  return apiClient.post("/v1/competitions/topic-battles", { json: payload });
}

export interface TopicBattleListResponse {
  battles: TopicBattle[];
  total: number;
}

export async function fetchTopicBattles(): Promise<TopicBattleListResponse> {
  return apiClient.get("/v1/competitions/topic-battles");
}

export async function fetchTopicBattle(battleId: string): Promise<TopicBattle> {
  return apiClient.get(`/v1/competitions/topic-battles/${battleId}`);
}

export async function joinTopicBattle(battleId: string): Promise<TopicBattle> {
  return apiClient.post(`/v1/competitions/topic-battles/${battleId}/join`);
}

// ============================================================================
// QUESTION CRUD
// ============================================================================

export interface QuestionResponse {
  id: string;
  title: string;
  description: string;
  codeTemplate: string;
  language: string;
  difficulty: string;
  timeLimitMinutes: number;
  points: number;
  hintEnabled: boolean;
  hintText: string;
  testCases: TestCase[];
}

export async function addQuestion(battleId: string, question: QuestionApiShape): Promise<QuestionResponse> {
  return apiClient.post(`/v1/competitions/topic-battles/${battleId}/questions`, { json: question });
}

export async function listQuestions(battleId: string): Promise<QuestionResponse[]> {
  return apiClient.get(`/v1/competitions/topic-battles/${battleId}/questions`);
}

export async function getQuestion(battleId: string, questionId: string): Promise<QuestionResponse> {
  return apiClient.get(`/v1/competitions/topic-battles/${battleId}/questions/${questionId}`);
}

export async function updateQuestion(
  battleId: string,
  questionId: string,
  question: Partial<QuestionApiShape>,
): Promise<QuestionResponse> {
  return apiClient.put(`/v1/competitions/topic-battles/${battleId}/questions/${questionId}`, { json: question });
}

export async function deleteQuestion(battleId: string, questionId: string): Promise<void> {
  return apiClient.delete(`/v1/competitions/topic-battles/${battleId}/questions/${questionId}`);
}
