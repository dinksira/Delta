"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertCircle, Archive } from "lucide-react";

import { SchoolBodySearch } from "@/components/features/school/SchoolBodySearch";
import { SchoolConfirmActionModal } from "@/components/features/school/master/SchoolConfirmActionModal";
import { SchoolEntityCard } from "@/components/features/school/master/SchoolEntityCard";
import { SchoolStatePanel } from "@/components/features/school/master/SchoolStatePanel";
import { SchoolWorkspaceHeader } from "@/components/features/school/layout/SchoolWorkspaceHeader";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { setSchoolArchived } from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";

/** ################################ /IMPORT ############################# */
/** ################################ COMPONENT ############################# */
/** Archived schools — membership-based list (no dummy cards). */
export function SchoolArchiveView() {
  const { isAuthenticated, isReady } = useAuthSession();
  const enabled = isAuthenticated && isReady;
  const queryClient = useQueryClient();
  const { mySchools, mySchoolsError } = useSchoolActiveOrgId();
  const [restoreTarget, setRestoreTarget] = useState<{
    orgId: string;
    schoolId: string;
    schoolName: string;
  } | null>(null);

  const archivedSchools = mySchools.filter((row) => row.archived);

  const restoreMutation = useMutation({
    mutationFn: async ({ orgId, schoolId }: { orgId: string; schoolId: string }) => {
      await setSchoolArchived(orgId, schoolId, false);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.mySchools() });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.schools(variables.orgId, true),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.schools(variables.orgId, false),
      });
      setRestoreTarget(null);
    },
  });

  return (
    <>
      <SchoolWorkspaceHeader title="Archived" addSchoolHref="/features/school/create" />
      <div className="flex flex-col gap-4 bg-surface-canvas py-4 sm:flex-row sm:items-center sm:justify-end">
        <SchoolBodySearch id="school-archive-search" />
      </div>
      <div className="py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mySchoolsError ? (
            <SchoolStatePanel
              title="Unable to load archived schools"
              message="We could not load archived schools right now. Please refresh and try again."
              icon={AlertCircle}
              actionLabel="Reload"
              onAction={() => window.location.reload()}
            />
          ) : enabled && archivedSchools.length > 0 ? (
            archivedSchools.map((row) => (
              <SchoolEntityCard
                key={row.schoolId}
                id={row.schoolId}
                name={row.name}
                location={row.schoolType}
                ctaVariant="archive"
                onPrimaryAction={() => {
                  setRestoreTarget({
                    orgId: row.orgId,
                    schoolId: row.schoolId,
                    schoolName: row.name,
                  });
                }}
              />
            ))
          ) : (
            <SchoolStatePanel
              title="No archived schools"
              message="When you archive a school, it will appear here for easy restore."
              icon={Archive}
            />
          )}
        </div>
      </div>
      <SchoolConfirmActionModal
        open={restoreTarget != null}
        title="Restore school?"
        description={
          restoreTarget
            ? `Restore "${restoreTarget.schoolName}" back to your active schools?`
            : ""
        }
        confirmLabel="Restore"
        pending={restoreMutation.isPending}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={() => {
          if (!restoreTarget) return;
          restoreMutation.mutate({
            orgId: restoreTarget.orgId,
            schoolId: restoreTarget.schoolId,
          });
        }}
      />
    </>
  );
}
/** ################################ /COMPONENT ############################# */
