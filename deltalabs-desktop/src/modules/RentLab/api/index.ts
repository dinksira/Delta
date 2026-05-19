/** ################################ IMPORT ############################# */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** RentLab API wrappers. */
export async function fetchRentLabModuleStatus() {
  return apiClient.get("/v1/rent_lab");
}
/** ################################ /COMPONENT ############################# */
