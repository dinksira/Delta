/** ################################ IMPORT ############################# */
import { Suspense } from "react";

import { ManagementTableEditorView } from "@/modules/School/managementTable/ManagementTableEditorView";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
type PageProps = Readonly<{
  params: Promise<{ schoolId: string; instanceId: string }>;
}>;

export default async function SchoolManagementTableEditorPage({ params }: PageProps) {
  const { schoolId, instanceId } = await params;
  return (
    <Suspense fallback={<div className="px-2 py-8 text-sm text-text-secondary">Loading table…</div>}>
      <ManagementTableEditorView schoolId={schoolId} instanceId={instanceId} />
    </Suspense>
  );
}
/** ################################ /COMPONENT ############################# */
