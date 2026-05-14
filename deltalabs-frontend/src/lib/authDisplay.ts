/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { AuthenticatedUser } from "@/modules/Auth/types/auth";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Two-letter avatar label from profile fields. */
export function profileInitialsFromUser(user: AuthenticatedUser): string {
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  const a = first?.[0];
  const b = last?.[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  const handle = user.username?.trim();
  if (handle && handle.length >= 2) return handle.slice(0, 2).toUpperCase();
  if (handle && handle.length === 1) return `${handle}${handle}`.toUpperCase();
  const local = user.email?.split("@")[0]?.trim();
  if (local && local.length >= 2) return local.slice(0, 2).toUpperCase();
  return "U";
}
/** ################################ /COMPONENT ############################# */
