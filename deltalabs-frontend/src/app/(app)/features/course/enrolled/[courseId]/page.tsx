/** ################################ IMPORT ############################# */
/** Imports used by this route file. */
import { Suspense } from "react";

import { CourseDetailView } from "@/modules/Course/views/CourseDetailView";
import { CourseProvider } from "@/modules/Course";

export function generateStaticParams() {
  return [{ courseId: "default" }, { courseId: "1" }];
}
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Type definitions used by this route. */
type CourseDetailPageProps = Readonly<{
  params: Promise<{
    courseId: string;
  }>;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Thin course-detail route. UI logic lives in `modules/Course/views`. */
export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  return (
    <CourseProvider>
      <Suspense fallback={<div className="px-2 py-8 text-sm text-text-secondary md:px-3">Loading course…</div>}>
        <CourseDetailView courseId={courseId} />
      </Suspense>
    </CourseProvider>
  );
}
/** ################################ /COMPONENT ############################# */
