"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, School } from "lucide-react";

import { SchoolBodySearch } from "@/components/features/school/SchoolBodySearch";
import { SchoolConfirmActionModal } from "@/components/features/school/master/SchoolConfirmActionModal";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";
import { useFeatureTabs } from "@/contexts/FeatureTabs_Context";
import { SchoolDetailsDrawer } from "@/components/features/school/master/SchoolDetailsDrawer";
import { SchoolEntityCard } from "@/components/features/school/master/SchoolEntityCard";
import { SchoolStatePanel } from "@/components/features/school/master/SchoolStatePanel";
import { SchoolStatStrip } from "@/components/features/school/master/SchoolStatStrip";
import { SchoolWorkspaceHeader } from "@/components/features/school/layout/SchoolWorkspaceHeader";
import { setSchoolArchived } from "@/modules/School/api";

/** ################################ /IMPORT ############################# */
/** ################################ COMPONENT ############################# */
/** My School — overview, stats, search, and school cards (membership-based list). */
export function SchoolHomeView() {
  const router = useRouter();
  const { openWorkspaceTabAt } = useFeatureTabs();
  const { isAuthenticated, isReady } = useAuthSession();
  const queryClient = useQueryClient();
  const { orgs, mySchools, orgsError, mySchoolsError, orgsPending, mySchoolsPending } =
    useSchoolActiveOrgId();
  const [detailsSchoolId, setDetailsSchoolId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    | {
        kind: "archive" | "delete";
        schoolId: string;
        orgId: string;
        schoolName: string;
      }
    | null
  >(null);

  const activeSchools = mySchools.filter((row) => !row.archived);
  const schoolsCount = activeSchools.length;
  const schoolStats = {
    mySchools: schoolsCount,
    /**
     * These stay true-to-data (0) until dedicated classes/students/teachers
     * aggregates are exposed by backend endpoints.
     */
    totalClasses: 0,
    totalStudents: 0,
    totalTeachers: 0,
  } as const;

  const archiveSchoolMutation = useMutation({
    mutationFn: async ({ orgId, schoolId }: { orgId: string; schoolId: string }) => {
      await setSchoolArchived(orgId, schoolId, true);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.mySchools() });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.schools(variables.orgId, false),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.schools(variables.orgId, true),
      });
      setConfirmAction(null);
    },
  });

  const slugForOrg = (orgId: string) => orgs.find((o) => o.id === orgId)?.slug ?? "org";
  const detailsSchool = useMemo(
    () => activeSchools.find((row) => row.schoolId === detailsSchoolId) ?? null,
    [activeSchools, detailsSchoolId],
  );
  const detailsDrawerSchool = detailsSchool
    ? {
        schoolId: detailsSchool.schoolId,
        orgId: detailsSchool.orgId,
        name: detailsSchool.name,
        schoolType: detailsSchool.schoolType,
        orgSlug: slugForOrg(detailsSchool.orgId),
      }
    : null;
  const schoolsLoading = isAuthenticated && isReady && (orgsPending || mySchoolsPending);
  const openSchoolWorkspaceTab = (schoolId: string, schoolName: string) => {
    const safeSchoolId = encodeURIComponent(schoolId);
    const safeSchoolName = encodeURIComponent(schoolName);
    openWorkspaceTabAt(
      schoolName,
      `school-${schoolId}`,
      `/features/school/${safeSchoolId}?name=${safeSchoolName}`,
    );
  };

  return (
    <>
      <SchoolWorkspaceHeader title="My School" addSchoolHref="/features/school/create" />
      <div className="space-y-6 py-6">
        <SchoolStatStrip values={schoolStats} />
        <SchoolBodySearch id="school-home-search" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schoolsLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`school-card-skeleton-${index}`}
                className="min-h-[188px] rounded-xl border border-border-default bg-surface-default px-4 py-4 shadow-sm"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <span className="sr-only">Loading schools</span>
                <div className="h-5 w-2/3 animate-pulse rounded bg-surface-muted" />
                <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-surface-muted" />
                <div className="mt-8 h-9 w-full animate-pulse rounded-md bg-surface-muted" />
                <div className="mt-3 h-9 w-full animate-pulse rounded-md bg-surface-muted" />
              </div>
            ))
          ) : orgsError || mySchoolsError ? (
            <SchoolStatePanel
              title="Unable to load schools"
              message="We could not load your school workspace right now. Please refresh and try again."
              icon={AlertCircle}
              actionLabel="Reload"
              onAction={() => router.refresh()}
            />
          ) : activeSchools.length > 0 ? (
            activeSchools.map((row) => (
              <SchoolEntityCard
                key={row.schoolId}
                id={row.schoolId}
                name={row.name}
                location={row.schoolType}
                partnershipLabel={`Org: ${slugForOrg(row.orgId)}`}
                ctaVariant="portal"
                primaryLabel="Go to School"
                onPrimaryAction={() => {
                  openSchoolWorkspaceTab(row.schoolId, row.name);
                }}
                onDetailsAction={() => setDetailsSchoolId(row.schoolId)}
                onEditAction={() => setDetailsSchoolId(row.schoolId)}
                onDeleteAction={() => {
                  setConfirmAction({
                    kind: "delete",
                    orgId: row.orgId,
                    schoolId: row.schoolId,
                    schoolName: row.name,
                  });
                }}
              />
            ))
          ) : (
            <SchoolStatePanel
              title={mySchools.length === 0 ? "No schools yet" : "No active schools"}
              message={
                mySchools.length === 0
                  ? "Create your first school to start managing classes, offers, and marketplace activity."
                  : "All your schools are archived right now. Restore one from archived schools to continue."
              }
              icon={School}
              actionLabel={mySchools.length === 0 ? "Add school" : undefined}
              onAction={mySchools.length === 0 ? () => router.push("/features/school/create") : undefined}
            />
          )}
        </div>
      </div>
      <SchoolDetailsDrawer
        open={detailsSchool != null}
        school={detailsDrawerSchool}
        onClose={() => setDetailsSchoolId(null)}
        onArchive={(school) => {
          setConfirmAction({
            kind: "archive",
            orgId: school.orgId,
            schoolId: school.schoolId,
            schoolName: school.name,
          });
          setDetailsSchoolId(null);
        }}
        onGoToSchool={(school) => {
          openSchoolWorkspaceTab(school.schoolId, school.name);
          setDetailsSchoolId(null);
        }}
      />
      <SchoolConfirmActionModal
        open={confirmAction != null}
        title={confirmAction?.kind === "delete" ? "Delete school?" : "Archive school?"}
        description={
          confirmAction
            ? confirmAction.kind === "delete"
              ? `Delete "${confirmAction.schoolName}" from active list? This will archive it and hide it from My School.`
              : `Archive "${confirmAction.schoolName}"? You can restore it from Archived anytime.`
            : ""
        }
        confirmLabel={confirmAction?.kind === "delete" ? "Delete" : "Archive"}
        confirmTone="danger"
        pending={archiveSchoolMutation.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          archiveSchoolMutation.mutate({
            orgId: confirmAction.orgId,
            schoolId: confirmAction.schoolId,
          });
        }}
      />
    </>
  );
}
/** ################################ /COMPONENT ############################# */
