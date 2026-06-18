"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useAuthSession } from "@/contexts/AuthSession_Context";
import { fetchOrgAccess, fetchSchoolWorkspaceItem } from "@/modules/School/api";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";
import { userCanManageSchoolWorkspace as userCanManageSchoolStudentWorkspace } from "@/modules/School/class/schoolClassPermissions";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";
import { safeStudentReturnHref } from "@/modules/School/students/studentNavigation";
import { StudentsTablePanel } from "@/modules/School/students/StudentsTablePanel";

type SchoolStudentDetailViewProps = Readonly<{
  schoolId: string;
  studentItemId: string;
}>;

export function SchoolStudentDetailView({ schoolId, studentItemId }: SchoolStudentDetailViewProps) {
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, isReady, session } = useAuthSession();
  const userId = session?.user?.id ?? "anon";
  const { mySchools, mySchoolsPending } = useSchoolActiveOrgId();
  const cleanSchoolId = schoolId.trim();
  const cleanStudentId = studentItemId.trim();
  const returnHref = useMemo(
    () => safeStudentReturnHref(searchParams.get("returnTo"), cleanSchoolId),
    [searchParams, cleanSchoolId],
  );

  const schoolMembership = mySchools.find((row) => row.schoolId === cleanSchoolId) ?? null;
  const activeOrgId = schoolMembership?.orgId ?? null;

  const orgAccessQuery = useQuery({
    queryKey: schoolQueryKeys.orgAccess(userId, activeOrgId),
    queryFn: () => fetchOrgAccess(activeOrgId!),
    enabled: isAuthenticated && isReady && Boolean(activeOrgId && cleanSchoolId),
    staleTime: 30_000,
    retry: false,
  });

  const canMutate = userCanManageSchoolStudentWorkspace(
    orgAccessQuery.data?.permissions,
    orgAccessQuery.data?.roleKeys,
    schoolMembership?.roleKeys,
  );
  const accessPending = orgAccessQuery.isPending;

  const studentItemQuery = useQuery({
    queryKey: schoolQueryKeys.workspaceItem(activeOrgId ?? "unknown-org", cleanSchoolId, cleanStudentId),
    queryFn: () => fetchSchoolWorkspaceItem(activeOrgId!, cleanSchoolId, cleanStudentId),
    enabled: Boolean(activeOrgId && cleanSchoolId && cleanStudentId),
    staleTime: 15_000,
    retry: false,
  });

  const wrongType = studentItemQuery.data != null && studentItemQuery.data.type !== "student";
  const pageLoading = mySchoolsPending || studentItemQuery.isPending;

  return (
    <section
      className={[
        "min-h-[calc(100vh-10rem)] bg-surface-canvas",
        CLASS_WORKSPACE_LAYOUT.routeBodyTopPadding,
        "pb-16",
      ].join(" ")}
      aria-label="Student registration"
    >
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            href={returnHref}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary transition-colors hover:bg-surface-muted sm:h-9 sm:w-9"
            aria-label="Back to school workspace"
          >
            <ArrowLeft className="size-4 sm:size-[1.05rem]" aria-hidden />
          </Link>
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary sm:h-9 sm:w-9"
            aria-hidden
          >
            <GraduationCap className="size-3.5 sm:size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className={CLASS_WORKSPACE_LAYOUT.pageHeaderTitleClass}>
              {studentItemQuery.data?.title ?? (pageLoading ? "Loading…" : "Student registration")}
            </h1>
            {studentItemQuery.data?.description ? (
              <p className="mt-0.5 text-xs text-text-tertiary sm:text-sm">{studentItemQuery.data.description}</p>
            ) : null}
          </div>
        </div>
      </header>

      {studentItemQuery.isError ? (
        <p className="text-sm text-red-600">Could not load this student registration area.</p>
      ) : wrongType ? (
        <p className="text-sm text-text-secondary">This workspace item is not a student registration holder.</p>
      ) : activeOrgId && studentItemQuery.data ? (
        <StudentsTablePanel
          orgId={activeOrgId}
          schoolId={cleanSchoolId}
          workspaceItemId={cleanStudentId}
          itemMetadata={studentItemQuery.data.metadata ?? null}
          canMutate={canMutate && !accessPending}
          scope="school"
          onBootstrapped={() => {
            void queryClient.invalidateQueries({
              queryKey: schoolQueryKeys.workspaceItem(activeOrgId, cleanSchoolId, cleanStudentId),
            });
          }}
        />
      ) : pageLoading ? (
        <div className="h-52 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />
      ) : null}
    </section>
  );
}
