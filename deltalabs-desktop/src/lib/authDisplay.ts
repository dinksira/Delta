/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { AuthenticatedUser } from "@/modules/Auth/types/auth";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Two-letter avatar label from profile fields. */
export function profileInitialsFromUser(user: AuthenticatedUser): string {
  const full = user.fullName?.trim();
  if (full) {
    const parts = full.split(/\s+/);
    const a = parts[0]?.[0];
    const b = parts[1]?.[0];
    if (a && b) return `${a}${b}`.toUpperCase();
    if (a) return `${a}${a}`.toUpperCase();
  }
  const handle = user.username?.trim();
  if (handle && handle.length >= 2) return handle.slice(0, 2).toUpperCase();
  if (handle && handle.length === 1) return `${handle}${handle}`.toUpperCase();
  const local = user.email?.split("@")[0]?.trim();
  if (local && local.length >= 2) return local.slice(0, 2).toUpperCase();
  return "U";
}
/** ################################ /COMPONENT ############################# */
