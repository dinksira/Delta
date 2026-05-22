"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { fetchSchoolWorkspaceItem } from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";
import { SchoolWorkspaceDetailView } from "@/modules/School/views/SchoolWorkspaceDetailView";

import { safeDepartmentReturnHref } from "./departmentNavigation";

type SchoolDepartmentWorkspaceViewProps = Readonly<{
  schoolId: string;
  departmentItemId: string;
}>;

/** Department-scoped workspace: own URL segment; reuses {@link SchoolWorkspaceDetailView} with `departmentRootItemId`. */
export function SchoolDepartmentWorkspaceView({ schoolId, departmentItemId }: SchoolDepartmentWorkspaceViewProps) {
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const { mySchools } = useSchoolActiveOrgId();
  const cleanSchoolId = schoolId.trim();
  const cleanDeptId = departmentItemId.trim();
  const schoolMembership = mySchools.find((row) => row.schoolId === cleanSchoolId) ?? null;
  const activeOrgId = schoolMembership?.orgId ?? null;

  const backHref = useMemo(
    () => safeDepartmentReturnHref(searchParams.get("returnTo"), cleanSchoolId),
    [searchParams, cleanSchoolId],
  );

  const itemQuery = useQuery({
    queryKey: schoolQueryKeys.workspaceItem(activeOrgId ?? "unknown-org", cleanSchoolId, cleanDeptId),
    queryFn: () => fetchSchoolWorkspaceItem(activeOrgId!, cleanSchoolId, cleanDeptId),
    enabled: Boolean(activeOrgId && cleanSchoolId && cleanDeptId),
    staleTime: 15_000,
    retry: false,
  });

  if (!cleanSchoolId || !cleanDeptId) {
    return (
      <div className="px-2 py-8 text-sm text-text-secondary md:px-3">
        <p>Missing school or department.</p>
        <Link href={backHref} className="mt-4 inline-block text-sm font-semibold text-primary-600 underline-offset-2 hover:underline">
          Back
        </Link>
      </div>
    );
  }

  if (itemQuery.isPending) {
    return <div className="px-2 py-8 text-sm text-text-secondary md:px-3">Loading department…</div>;
  }

  if (itemQuery.isError || !itemQuery.data) {
    return (
      <div className="px-2 py-8 text-sm text-text-secondary md:px-3">
        <p className="font-medium text-text-primary">Could not load this workspace item.</p>
        <Link href={backHref} className="mt-3 inline-block text-sm font-semibold text-primary-600 underline-offset-2 hover:underline">
          Return to school
        </Link>
      </div>
    );
  }

  if (itemQuery.data.type !== "department") {
    return (
      <div className="px-2 py-8 text-sm text-text-secondary md:px-3">
        <p className="font-medium text-text-primary">This link is not a department.</p>
        <p className="mt-1 text-xs text-text-tertiary">Open classes from the class workspace instead.</p>
        <Link href={backHref} className="mt-3 inline-block text-sm font-semibold text-primary-600 underline-offset-2 hover:underline">
          Return to school
        </Link>
      </div>
    );
  }

  return <SchoolWorkspaceDetailView schoolId={cleanSchoolId} departmentRootItemId={cleanDeptId} />;
}
