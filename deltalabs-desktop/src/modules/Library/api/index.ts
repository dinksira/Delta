/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Library API wrappers. */
export async function fetchLibraryModuleStatus() {
  return apiClient.get("/v1/library");
}
/** ################################ /COMPONENT ############################# */
