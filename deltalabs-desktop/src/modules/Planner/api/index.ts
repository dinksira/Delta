/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Planner API wrappers. */
export async function fetchPlannerModuleStatus() {
  return apiClient.get("/v1/planner");
}
/** ################################ /COMPONENT ############################# */
