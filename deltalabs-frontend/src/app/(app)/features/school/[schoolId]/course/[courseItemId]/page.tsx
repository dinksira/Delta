import { Suspense } from "react";

import { CourseBottomNav } from "@/modules/School/course/CourseBottomNav";
import { CourseWorkspaceRouteLayout } from "@/modules/School/course/CourseWorkspaceRouteLayout";
import { SchoolCourseDetailView } from "@/modules/School/views/SchoolCourseDetailView";

export function generateStaticParams() {
  return [{ schoolId: "default", courseItemId: "default" }];
}

type CoursePageProps = Readonly<{
  params: Promise<{
    schoolId: string;
    courseItemId: string;
  }>;
}>;

export default async function SchoolCoursePage({ params }: CoursePageProps) {
  const { schoolId, courseItemId } = await params;
  return (
    <>
      <CourseWorkspaceRouteLayout>
        <Suspense
          fallback={<div className="px-2 py-8 text-sm text-text-secondary md:px-3">Loading course…</div>}
        >
          <SchoolCourseDetailView schoolId={schoolId} courseItemId={courseItemId} />
        </Suspense>
      </CourseWorkspaceRouteLayout>
      <Suspense fallback={null}>
        <CourseBottomNav />
      </Suspense>
    </>
  );
}
