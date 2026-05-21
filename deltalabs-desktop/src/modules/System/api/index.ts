/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Backend operational endpoints wrappers. */
export async function fetchSystemStatus() {
  return apiClient.get<{ status: string }>("/v1/system/status");
}

export async function fetchSystemMetrics() {
  return apiClient.get<Record<string, unknown>>("/v1/system/metrics");
}
/** ################################ /COMPONENT ############################# */
