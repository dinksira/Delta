/** ################################ IMPORT ############################# */
import { Suspense } from "react";

import { SchoolDepartmentWorkspaceView } from "@/modules/School/department";

export function generateStaticParams() {
  return [{ schoolId: "default", departmentItemId: "default" }];
}
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type DepartmentPageProps = Readonly<{
  params: Promise<{
    schoolId: string;
    departmentItemId: string;
  }>;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
export default async function SchoolDepartmentPage({ params }: DepartmentPageProps) {
  const { schoolId, departmentItemId } = await params;
  return (
    <Suspense fallback={<div className="px-2 py-8 text-sm text-text-secondary md:px-3">Loading department…</div>}>
      <SchoolDepartmentWorkspaceView schoolId={schoolId} departmentItemId={departmentItemId} />
    </Suspense>
  );
}
/** ################################ /COMPONENT ############################# */
