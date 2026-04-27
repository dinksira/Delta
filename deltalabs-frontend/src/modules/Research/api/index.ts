/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Research API wrappers. */
export async function fetchResearchModuleStatus() {
  return apiClient.get("/v1/research");
}
/** ################################ /COMPONENT ############################# */
