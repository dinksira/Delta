/** ################################ IMPORT ############################# */
import { Suspense } from "react";

import { ExerciseCreationWorkspaceView } from "@/modules/School/course/exercise/ExerciseCreationWorkspaceView";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
type PageProps = Readonly<{
  params: Promise<{ schoolId: string; courseItemId: string; exerciseId: string }>;
}>;

export default async function EditCourseExercisePage({ params }: PageProps) {
  const { schoolId, courseItemId, exerciseId } = await params;
  return (
    <Suspense fallback={<div className="px-4 py-8 text-sm text-text-secondary">Loading exercise…</div>}>
      <ExerciseCreationWorkspaceView
        schoolId={schoolId}
        courseItemId={courseItemId}
        exerciseId={exerciseId}
      />
    </Suspense>
  );
}
/** ################################ /COMPONENT ############################# */
