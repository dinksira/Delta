/** ################################ IMPORT ############################# */
import { Suspense } from "react";

import { ExerciseCreationWorkspaceView } from "@/modules/School/course/exercise/ExerciseCreationWorkspaceView";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
type PageProps = Readonly<{
  params: Promise<{ schoolId: string; courseItemId: string }>;
  searchParams: Promise<{ kind?: string }>;
}>;

export default async function NewCourseExercisePage({ params, searchParams }: PageProps) {
  const { schoolId, courseItemId } = await params;
  const sp = await searchParams;
  const kind = sp.kind === "test" ? "test" : "exercise";
  return (
    <Suspense fallback={<div className="px-4 py-8 text-sm text-text-secondary">Loading workspace…</div>}>
      <ExerciseCreationWorkspaceView schoolId={schoolId} courseItemId={courseItemId} kind={kind} />
    </Suspense>
  );
}
/** ################################ /COMPONENT ############################# */
