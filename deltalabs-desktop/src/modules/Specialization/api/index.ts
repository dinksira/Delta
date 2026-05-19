/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Specialization API wrappers. */
export async function fetchSpecializationModuleStatus() {
  return apiClient.get("/v1/specialization");
}
/** ################################ /COMPONENT ############################# */
