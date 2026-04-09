/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Chatroom API wrappers. */
export async function fetchChatroomModuleStatus() {
  return apiClient.get("/v1/chatroom");
}
/** ################################ /COMPONENT ############################# */
