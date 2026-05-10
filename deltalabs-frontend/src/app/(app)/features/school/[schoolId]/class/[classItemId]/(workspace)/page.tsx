/** ################################ IMPORT ############################# */
import { Suspense } from "react";

import { SchoolClassDetailView } from "@/modules/School/views/SchoolClassDetailView";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type ClassPageProps = Readonly<{
  params: Promise<{
    schoolId: string;
    classItemId: string;
  }>;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
export default async function SchoolClassPage({ params }: ClassPageProps) {
  const { schoolId, classItemId } = await params;
  return (
    <Suspense fallback={<div className="px-2 py-8 text-sm text-text-secondary md:px-3">Loading class…</div>}>
      <SchoolClassDetailView schoolId={schoolId} classItemId={classItemId} />
    </Suspense>
  );
}
/** ################################ /COMPONENT ############################# */
