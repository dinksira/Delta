"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useAuthSession } from "@/contexts/AuthSession_Context";
import { fetchOrgAccess, fetchSchoolWorkspaceItem } from "@/modules/School/api";
import { userCanManageSchoolWorkspace } from "@/modules/School/class/schoolClassPermissions";
import { CourseExercisePanel } from "@/modules/School/course/CourseExercisePanel";
import { CourseIntroPanel } from "@/modules/School/course/CourseIntroPanel";
import { CoursePageHeader } from "@/modules/School/course/CoursePageHeader";
import { CourseQaPanel } from "@/modules/School/course/CourseQaPanel";
import {
  isBuiltCourseNavSection,
  parseCourseNavId,
  safeCourseReturnHref,
  type CourseNavId,
} from "@/modules/School/course/courseNavigation";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";

type SchoolCourseDetailViewProps = Readonly<{
  schoolId: string;
  courseItemId: string;
}>;

export function SchoolCourseDetailView({ schoolId, courseItemId }: SchoolCourseDetailViewProps) {
  const router = useRouter();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const { isAuthenticated, isReady, session } = useAuthSession();
  const userId = session?.user?.id ?? "anon";
  const { mySchools, mySchoolsPending, orgsPending } = useSchoolActiveOrgId();

  const cleanSchoolId = schoolId.trim();
  const cleanCourseId = courseItemId.trim();
  const returnHref = useMemo(
    () => safeCourseReturnHref(searchParams.get("returnTo"), cleanSchoolId),
    [searchParams, cleanSchoolId],
  );
  const activeNav = parseCourseNavId(searchParams.get("nav"));

  const schoolMembership = mySchools.find((row) => row.schoolId === cleanSchoolId) ?? null;
  const activeOrgId = schoolMembership?.orgId ?? null;

  const orgAccessQuery = useQuery({
    queryKey: schoolQueryKeys.orgAccess(userId, activeOrgId),
    queryFn: () => fetchOrgAccess(activeOrgId!),
    enabled: isAuthenticated && isReady && Boolean(activeOrgId && cleanSchoolId),
    staleTime: 30_000,
    retry: false,
  });
  const canMutate = userCanManageSchoolWorkspace(
    orgAccessQuery.data?.permissions,
    orgAccessQuery.data?.roleKeys,
    schoolMembership?.roleKeys,
  );
  const accessPending = orgAccessQuery.isPending;

  const courseItemQuery = useQuery({
    queryKey: schoolQueryKeys.workspaceItem(activeOrgId ?? "unknown-org", cleanSchoolId, cleanCourseId),
    queryFn: () => fetchSchoolWorkspaceItem(activeOrgId!, cleanSchoolId, cleanCourseId),
    enabled: Boolean(activeOrgId && cleanSchoolId && cleanCourseId),
    staleTime: 15_000,
    retry: false,
  });

  const wrongType = Boolean(courseItemQuery.data && courseItemQuery.data.type !== "course");
  const bootstrapLoading = Boolean(cleanSchoolId) && (orgsPending || mySchoolsPending);
  const pageLoading = bootstrapLoading || courseItemQuery.isPending;
  const headerTitle = wrongType ? "Course" : (courseItemQuery.data?.title ?? "Course");

  return (
    <main className="min-h-0" aria-label="Course workspace">
      <CoursePageHeader
        title={headerTitle}
        loading={pageLoading}
        wrongType={wrongType}
        onBack={() => router.push(returnHref)}
      />

      {courseItemQuery.isError ? (
        <p className="text-sm text-red-600">Could not load this course. It may have been removed.</p>
      ) : wrongType ? (
        <p className="text-sm leading-relaxed text-text-secondary">
          This workspace item is not a course. Open it from the school workspace.
        </p>
      ) : !isBuiltCourseNavSection(activeNav) ? (
        <ComingSoonSection navId={activeNav} />
      ) : activeOrgId && courseItemQuery.data && activeNav === "qa" ? (
        <CourseQaPanel
          orgId={activeOrgId}
          schoolId={cleanSchoolId}
          courseItem={courseItemQuery.data}
          canMutate={canMutate && !accessPending}
        />
      ) : activeOrgId && courseItemQuery.data && activeNav === "exercise" ? (
        <CourseExercisePanel
          orgId={activeOrgId}
          schoolId={cleanSchoolId}
          courseItem={courseItemQuery.data}
          canMutate={canMutate && !accessPending}
        />
      ) : activeOrgId && courseItemQuery.data ? (
        <CourseIntroPanel
          orgId={activeOrgId}
          schoolId={cleanSchoolId}
          courseItem={courseItemQuery.data}
          canMutate={canMutate && !accessPending}
        />
      ) : pageLoading ? (
        <div className="h-40 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />
      ) : null}
    </main>
  );
}

function ComingSoonSection({ navId }: Readonly<{ navId: CourseNavId }>) {
  return (
    <div
      className="flex min-h-[22rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/20 px-6 py-16 text-center"
      role="status"
    >
      <p className="text-sm font-semibold text-text-primary">Coming soon</p>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-tertiary">
        The <span className="font-medium text-text-secondary">{navId}</span> area for this course is not
        built yet. Use <span className="font-medium text-text-secondary">Course Intro</span> in the bottom
        bar to edit intro content.
      </p>
    </div>
  );
}
