/** ################################ IMPORT ############################# */
import { Suspense } from "react";

import { ClassSessionMeetView } from "@/modules/School/class/ClassSessionMeetView";

export function generateStaticParams() {
  return [{ schoolId: "default", classItemId: "default", sessionId: "default" }];
}
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type ClassSessionMeetPageProps = Readonly<{
  params: Promise<{
    schoolId: string;
    classItemId: string;
    sessionId: string;
  }>;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
export default async function ClassSessionMeetPage({ params }: ClassSessionMeetPageProps) {
  const { schoolId, classItemId, sessionId } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-text-secondary">Loading session…</div>
      }
    >
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <ClassSessionMeetView schoolId={schoolId} classItemId={classItemId} sessionId={sessionId} />
      </div>
    </Suspense>
  );
}
/** ################################ /COMPONENT ############################# */
