/** ################################ IMPORT ############################# */
/** React type imports and school layout dependencies. */
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SchoolIconRail } from "@/components/features/school/layout/SchoolIconRail";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main school workspace shell with icon rail and scrolling content region. */
/**
 * Same canvas background as `/features` (`surface-canvas`); cards/search/table stay on `surface-default`.
 */
export function SchoolManagementShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const isCreateFlow = pathname.startsWith("/features/school/create");
  const isSchoolDetailRoute =
    /^\/features\/school\/[^/]+$/.test(pathname) &&
    !pathname.startsWith("/features/school/archive") &&
    !pathname.startsWith("/features/school/offers") &&
    !pathname.startsWith("/features/school/marketplace");

  /** Class deep-link matches `/features/school/:id/class/...` — same full-width body as school workspace (no icon rail). */
  const isClassWorkspaceRoute = /^\/features\/school\/[^/]+\/class\//.test(pathname);
  /** Department workspace: `/features/school/:id/department/...` — same treatment as class workspace. */
  const isDepartmentWorkspaceRoute = /^\/features\/school\/[^/]+\/department\//.test(pathname);
  /** School student registration: `/features/school/:id/student/...` — same treatment as class workspace. */
  const isStudentRegistrationRoute = /^\/features\/school\/[^/]+\/student\//.test(pathname);
  /** School parent registration: `/features/school/:id/parent/...` — same treatment as student registration. */
  const isParentRegistrationRoute = /^\/features\/school\/[^/]+\/parent\//.test(pathname);
  /** Live session room: full viewport, no horizontal gutters (Meet-style). */
  const isClassSessionMeetRoute = /^\/features\/school\/[^/]+\/class\/[^/]+\/session\/[^/]+$/.test(pathname);
  /** Management table hub + editor: same full-width body as class workspace (no icon rail). */
  const isManagementTableRoute = /^\/features\/school\/[^/]+\/management-tables/.test(pathname);

  if (isCreateFlow) {
    return (
      <div className="flex min-h-0 w-full flex-1 bg-surface-canvas">
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain bg-surface-canvas">
          <div className="pl-2 pr-6 md:pl-2 md:pr-8 xl:pl-2 xl:pr-10">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 items-stretch gap-3 overflow-x-visible overflow-y-hidden bg-surface-canvas md:gap-4 lg:gap-5">
      {isSchoolDetailRoute ||
      isClassWorkspaceRoute ||
      isDepartmentWorkspaceRoute ||
      isStudentRegistrationRoute ||
      isParentRegistrationRoute ||
      isManagementTableRoute ? null : (
        <SchoolIconRail />
      )}
      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-canvas"
      >
        {isClassSessionMeetRoute ? (
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">{children}</div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <div className="pl-2 pr-6 md:pl-2 md:pr-8 xl:pl-2 xl:pr-10">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
