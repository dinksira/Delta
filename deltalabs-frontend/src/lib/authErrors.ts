/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { ApiError } from "@/lib/apiClient";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Maps thrown errors to user-visible auth copy. */
export function authErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
/** ################################ /COMPONENT ############################# */
