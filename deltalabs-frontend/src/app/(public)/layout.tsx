/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { PublicLayoutShell } from "@/components/navigation/PublicLayoutShell";
import { AUTH_SESSION_COOKIE, isAuthenticatedFromCookieValue } from "@/lib/authSession";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export default async function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  let serverAuthenticated = false;
  
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    try {
      const cookieStore = await cookies();
      serverAuthenticated = isAuthenticatedFromCookieValue(
        cookieStore.get(AUTH_SESSION_COOKIE)?.value,
      );
    } catch (e) {
      // Swallowed during static generation
    }
  }

  return <PublicLayoutShell serverAuthenticated={serverAuthenticated}>{children}</PublicLayoutShell>;
}
/** ################################ /COMPONENT ############################# */
