 "use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ReactNode } from "react";

import { SchoolManagementShell } from "@/components/features/school/layout/SchoolManagementShell";
import { FeaturesHiddenGate } from "@/modules/Features/components/FeaturesHiddenGate";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export default function SchoolWorkspaceLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <FeaturesHiddenGate featureKey="school">
      <SchoolManagementShell>{children}</SchoolManagementShell>
    </FeaturesHiddenGate>
  );
}
/** ################################ /COMPONENT ############################# */
