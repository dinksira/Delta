/** ################################ IMPORT ############################# */
import { Suspense } from "react";

import { SchoolStudentDetailView } from "@/modules/School/views/SchoolStudentDetailView";

export function generateStaticParams() {
  return [{ schoolId: "default", studentItemId: "default" }];
}
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type StudentPageProps = Readonly<{
  params: Promise<{
    schoolId: string;
    studentItemId: string;
  }>;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
export default async function SchoolStudentPage({ params }: StudentPageProps) {
  const { schoolId, studentItemId } = await params;
  return (
    <Suspense fallback={<div className="px-2 py-8 text-sm text-text-secondary md:px-3">Loading students…</div>}>
      <SchoolStudentDetailView schoolId={schoolId} studentItemId={studentItemId} />
    </Suspense>
  );
}
/** ################################ /COMPONENT ############################# */
