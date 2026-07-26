/** ################################ IMPORT ############################# */
import { Suspense } from "react";

import { FastSummaryWorkspaceView } from "@/modules/School/course/summary/FastSummaryWorkspaceView";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
type PageProps = Readonly<{
  params: Promise<{ schoolId: string; courseItemId: string; summaryId: string }>;
}>;

export default async function EditCourseSummaryPage({ params }: PageProps) {
  const { schoolId, courseItemId, summaryId } = await params;
  return (
    <Suspense fallback={<div className="px-4 py-8 text-sm text-text-secondary">Loading summary…</div>}>
      <FastSummaryWorkspaceView
        schoolId={schoolId}
        courseItemId={courseItemId}
        summaryId={summaryId}
      />
    </Suspense>
  );
}
/** ################################ /COMPONENT ############################# */
