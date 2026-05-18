/** ################################ IMPORT ############################# */
/** Imports used by this route file. */
import { Suspense } from "react";

import { SchoolWorkspaceDetailView } from "@/modules/School/views/SchoolWorkspaceDetailView";

export function generateStaticParams() {
  return [{ schoolId: "default" }];
}
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Type definitions used by this route. */
type SchoolWorkspacePageProps = Readonly<{
  params: Promise<{
    schoolId: string;
  }>;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Thin school-detail route. UI logic lives in `modules/School/views`. */
export default async function SchoolWorkspacePage({ params }: SchoolWorkspacePageProps) {
  const { schoolId } = await params;
  return (
    <Suspense fallback={<div className="px-2 py-8 text-sm text-text-secondary md:px-3">Loading workspace…</div>}>
      <SchoolWorkspaceDetailView schoolId={schoolId} />
    </Suspense>
  );
}
/** ################################ /COMPONENT ############################# */
