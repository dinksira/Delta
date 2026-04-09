/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ReactNode } from "react";

import { AppShell } from "@/components/navigation/AppShell";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export default function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
/** ################################ /COMPONENT ############################# */
