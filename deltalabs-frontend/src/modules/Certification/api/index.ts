/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Certification API wrappers. */
export async function fetchCertificationModuleStatus() {
  return apiClient.get("/v1/certification");
}
/** ################################ /COMPONENT ############################# */
