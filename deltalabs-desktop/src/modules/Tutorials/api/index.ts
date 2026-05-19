/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Tutorials API wrappers. */
export async function fetchTutorialsModuleStatus() {
  return apiClient.get("/v1/tutorials");
}
/** ################################ /COMPONENT ############################# */
