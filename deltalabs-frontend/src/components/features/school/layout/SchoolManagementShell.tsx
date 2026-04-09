/** ################################ IMPORT ############################# */
/** React type imports and school layout dependencies. */
import type { ReactNode } from "react";

import { SchoolIconRail } from "@/components/features/school/layout/SchoolIconRail";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main school workspace shell with icon rail and scrolling content region. */
/**
 * Same canvas background as `/features` (`surface-canvas`); cards/search/table stay on `surface-default`.
 */
export function SchoolManagementShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-0 w-full flex-1 items-stretch gap-6 overflow-x-visible overflow-y-hidden bg-surface-canvas md:gap-8 lg:gap-10">
      <SchoolIconRail />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain bg-surface-canvas">
        {children}
      </div>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
