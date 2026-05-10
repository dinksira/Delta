/** ################################ IMPORT ############################# */
/** Imports used by this route file. */
import { Suspense } from "react";

import { SchoolWorkspaceDetailView } from "@/modules/School/views/SchoolWorkspaceDetailView";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Type definitions used by this route. */
type SchoolWorkspacePageProps = Readonly<{
  params: Promise<{
    schoolId: string;
  }>;
  searchParams: Promise<{
    name?: string;
    view?: string;
    /** Comma-separated workspace folder ids from root → current (nested browsing). */
    path?: string;
    /** @deprecated Prefer `path`; still read for older links. */
    parent?: string;
    parentName?: string;
  }>;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Thin school-detail route. UI logic lives in `modules/School/views`. */
export default async function SchoolWorkspacePage({ params, searchParams }: SchoolWorkspacePageProps) {
  const { schoolId } = await params;
  const { name, view } = await searchParams;
  return (
    <Suspense fallback={<div className="px-2 py-8 text-sm text-text-secondary md:px-3">Loading workspace…</div>}>
      <SchoolWorkspaceDetailView schoolId={schoolId} schoolName={name} initialView={view} />
    </Suspense>
  );
}
/** ################################ /COMPONENT ############################# */
