/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { ApiError } from "@/lib/apiClient";
import type { AuthMessages } from "@/i18n/authMessages";

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

const RECOVER_ERROR_FALLBACKS: Partial<
  Record<string, (messages: AuthMessages["recover"]) => string>
> = {
  recover_email_delivery_failed: (r) => r.emailDeliveryFailed,
  recover_email_not_configured: (r) => r.emailNotConfigured,
  recover_no_email_on_file: (r) => r.noEmailOnFile,
};

/** Maps recover API error codes to localized copy; falls back to the API message. */
export function recoverErrorMessage(error: unknown, messages: AuthMessages): string {
  if (error instanceof ApiError) {
    const mapped = error.code ? RECOVER_ERROR_FALLBACKS[error.code]?.(messages.recover) : undefined;
    if (mapped) return mapped;
    if (error.message) return error.message;
  }
  return authErrorMessage(error, messages.recover.emailDeliveryFailed);
}
/** ################################ /COMPONENT ############################# */
