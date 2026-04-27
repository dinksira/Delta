/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ReactNode } from "react";

import { AppShell } from "@/components/navigation/AppShell";
import { requireAuthenticated } from "@/lib/authGuards";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAuthenticated();
  return <AppShell>{children}</AppShell>;
}
/** ################################ /COMPONENT ############################# */
