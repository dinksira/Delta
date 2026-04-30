 "use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ReactNode } from "react";

import { SchoolManagementShell } from "@/components/features/school/layout/SchoolManagementShell";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export default function SchoolWorkspaceLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <SchoolManagementShell>{children}</SchoolManagementShell>;
}
/** ################################ /COMPONENT ############################# */
