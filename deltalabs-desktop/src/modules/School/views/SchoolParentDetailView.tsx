"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useAuthSession } from "@/contexts/AuthSession_Context";
import { fetchOrgAccess, fetchSchoolWorkspaceItem } from "@/modules/School/api";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";
import { userCanManageSchoolWorkspace as userCanManageSchoolParentWorkspace } from "@/modules/School/class/schoolClassPermissions";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";
import { safeParentReturnHref } from "@/modules/School/parents/parentNavigation";
import { ParentsTablePanel } from "@/modules/School/parents/ParentsTablePanel";

type SchoolParentDetailViewProps = Readonly<{
  schoolId: string;
  parentItemId: string;
}>;

export function SchoolParentDetailView({ schoolId, parentItemId }: SchoolParentDetailViewProps) {
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, isReady, session } = useAuthSession();
  const userId = session?.user?.id ?? "anon";
  const { mySchools, mySchoolsPending } = useSchoolActiveOrgId();
  const cleanSchoolId = schoolId.trim();
  const cleanParentId = parentItemId.trim();
  const returnHref = useMemo(
    () => safeParentReturnHref(searchParams.get("returnTo"), cleanSchoolId),
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

  const canMutate = userCanManageSchoolParentWorkspace(
    orgAccessQuery.data?.permissions,
    orgAccessQuery.data?.roleKeys,
    schoolMembership?.roleKeys,
  );
  const accessPending = orgAccessQuery.isPending;

  const parentItemQuery = useQuery({
    queryKey: schoolQueryKeys.workspaceItem(activeOrgId ?? "unknown-org", cleanSchoolId, cleanParentId),
    queryFn: () => fetchSchoolWorkspaceItem(activeOrgId!, cleanSchoolId, cleanParentId),
    enabled: Boolean(activeOrgId && cleanSchoolId && cleanParentId),
    staleTime: 15_000,
    retry: false,
  });

  const wrongType = parentItemQuery.data != null && parentItemQuery.data.type !== "parent";
  const pageLoading = mySchoolsPending || parentItemQuery.isPending;

  return (
    <section
      className={[
        "min-h-[calc(100vh-10rem)] bg-surface-canvas",
        CLASS_WORKSPACE_LAYOUT.routeBodyTopPadding,
        "pb-16",
      ].join(" ")}
      aria-label="Parent registration"
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
            <Users className="size-3.5 sm:size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className={CLASS_WORKSPACE_LAYOUT.pageHeaderTitleClass}>
              {parentItemQuery.data?.title ?? (pageLoading ? "Loading…" : "Parent registration")}
            </h1>
            {parentItemQuery.data?.description ? (
              <p className="mt-0.5 text-xs text-text-tertiary sm:text-sm">{parentItemQuery.data.description}</p>
            ) : null}
          </div>
        </div>
      </header>

      {parentItemQuery.isError ? (
        <p className="text-sm text-red-600">Could not load this parent registration area.</p>
      ) : wrongType ? (
        <p className="text-sm text-text-secondary">This workspace item is not a parent registration holder.</p>
      ) : activeOrgId && parentItemQuery.data ? (
        <ParentsTablePanel
          orgId={activeOrgId}
          schoolId={cleanSchoolId}
          workspaceItemId={cleanParentId}
          itemMetadata={parentItemQuery.data.metadata ?? null}
          canMutate={canMutate && !accessPending}
          scope="school"
          onBootstrapped={() => {
            void queryClient.invalidateQueries({
              queryKey: schoolQueryKeys.workspaceItem(activeOrgId, cleanSchoolId, cleanParentId),
            });
          }}
        />
      ) : pageLoading ? (
        <div className="h-52 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />
      ) : null}
    </section>
  );
}
