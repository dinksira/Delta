import { apiClient } from "@/lib/apiClient";

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
