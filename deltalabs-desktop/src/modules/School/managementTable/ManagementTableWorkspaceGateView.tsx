"use client";

/** Ensures a workspace management-table item has a linked instance, then opens the editor. */
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { ApiError } from "@/lib/apiClient";
import { bootstrapManagementTableWorkspaceItem } from "@/modules/School/api";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";

type ManagementTableWorkspaceGateViewProps = Readonly<{
  schoolId: string;
  workspaceItemId: string;
}>;

export function ManagementTableWorkspaceGateView({ schoolId, workspaceItemId }: ManagementTableWorkspaceGateViewProps) {
  const router = useRouter();
  const { activeOrgId, mySchoolsPending } = useSchoolActiveOrgId();
  const started = useRef(false);

  const bootstrap = useMutation({
    mutationFn: () => {
      const orgId = activeOrgId;
      if (!orgId) throw new Error("No organization");
      return bootstrapManagementTableWorkspaceItem(orgId, schoolId, workspaceItemId);
    },
    onSuccess: (data) => {
      router.replace(
        `/features/school/${encodeURIComponent(schoolId)}/management-tables/${encodeURIComponent(data.instance.id)}`,
      );
    },
    onError: () => {
      started.current = false;
    },
  });

  useEffect(() => {
    if (mySchoolsPending || !activeOrgId || started.current) return;
    started.current = true;
    bootstrap.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when org is known
  }, [activeOrgId, mySchoolsPending]);

  if (bootstrap.isError) {
    const msg = bootstrap.error instanceof ApiError ? bootstrap.error.message : String(bootstrap.error);
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-sm text-red-600">{msg}</p>
        <p className="mt-2 text-xs text-text-tertiary">You need school:manage on the org to link a management table.</p>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-primary-700 underline"
          onClick={() => {
            bootstrap.reset();
            bootstrap.mutate();
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 py-16">
      <p className="text-sm text-text-secondary">Preparing your management table…</p>
      <p className="text-xs text-text-tertiary">Linking this workspace item to a new board.</p>
    </div>
  );
}
