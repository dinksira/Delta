/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** CourseSupport API wrappers. */
export async function fetchCourseSupportModuleStatus() {
  return apiClient.get("/v1/course_support");
}
/** ################################ /COMPONENT ############################# */
