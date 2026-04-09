/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Competition API wrappers. */
export async function fetchCompetitionModuleStatus() {
  return apiClient.get("/v1/competitions");
}
/** ################################ /COMPONENT ############################# */
