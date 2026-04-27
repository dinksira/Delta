/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** HelpSupport API wrappers. */
export async function fetchHelpSupportModuleStatus() {
  return apiClient.get("/v1/help_support");
}
/** ################################ /COMPONENT ############################# */
