/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Course API wrappers. */
export async function fetchCourseModuleStatus() {
  return apiClient.get("/v1/courses");
}
/** ################################ /COMPONENT ############################# */
