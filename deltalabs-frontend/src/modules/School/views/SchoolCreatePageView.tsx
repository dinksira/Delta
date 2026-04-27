"use client";

/** ################################ IMPORT ############################# */
/** React Query, navigation, and School create components. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { SchoolCreateWizardModal } from "@/components/features/school/master/SchoolCreateWizardModal";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { ApiError } from "@/lib/apiClient";
import { createSchoolForMe, fetchMyOrgs } from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
/** ################################ /IMPORT ############################# */

function mutationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "You don’t have permission to create a school in the selected organization (school:manage).";
    }
    if (error.status === 401) {
      return "Your session expired. Sign in again, then retry.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Could not create school. Please try again.";
}

/** ################################ COMPONENT ############################# */
/** Dedicated page flow for School creation wizard (non-modal). */
export function SchoolCreatePageView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isReady } = useAuthSession();
  const enabled = isAuthenticated && isReady;

  const { data: orgData, isPending: orgsPending, isError: orgsError } = useQuery({
    queryKey: schoolQueryKeys.orgsMe(),
    queryFn: fetchMyOrgs,
    enabled,
    staleTime: 60_000,
    retry: false,
  });
  const activeOrgId = orgData?.items?.[0]?.id ?? null;

  const createSchoolMutation = useMutation({
    mutationFn: async (payload: Parameters<typeof createSchoolForMe>[0]) => createSchoolForMe(payload),
    onSuccess: async (school) => {
      await queryClient.invalidateQueries({ queryKey: ["orgs", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["school", "me", "schools"] });
      await queryClient.refetchQueries({ queryKey: ["school", "me", "schools"], type: "all" });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.schools(school.orgId, false),
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem("dl.school.create.wizard.draft.v1");
      }
      router.push("/features/school");
    },
  });

  const submitError =
    orgsError
      ? "Could not load organizations. Check your connection and refresh the page."
      : createSchoolMutation.isError
        ? mutationErrorMessage(createSchoolMutation.error)
        : null;

  return (
    <SchoolCreateWizardModal
      presentation="page"
      orgId={activeOrgId}
      orgLoading={enabled && orgsPending}
      submitError={submitError}
      submitting={createSchoolMutation.isPending}
      onClose={() => router.push("/features/school")}
      onSubmit={(payload) => createSchoolMutation.mutate(payload)}
    />
  );
}
/** ################################ /COMPONENT ############################# */
