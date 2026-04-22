"use client";

/** Resolves which org id to use for org-scoped school APIs (marketplace, offers, org school list). */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/contexts/AuthSession_Context";
import { fetchMyOrgs, fetchMySchools } from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

/**
 * Picks a single `activeOrgId` for this phase:
 * - Prefer org(s) where the user has school memberships (`GET /v1/me/schools`).
 * - If memberships span multiple orgs, use the lexicographically first org id (stable; a picker can come later).
 * - If none, fall back to the first org from `GET /v1/orgs/me` (legacy / empty memberships).
 */
export function useSchoolActiveOrgId() {
  const { isAuthenticated, isReady, session } = useAuthSession();
  const enabled = isAuthenticated && isReady;
  const userId = session?.user?.id ?? "anon";

  const {
    data: orgData,
    error: orgsError,
    isPending: orgsPending,
  } = useQuery({
    queryKey: schoolQueryKeys.orgsMe(userId),
    queryFn: fetchMyOrgs,
    enabled,
    staleTime: 60_000,
    retry: false,
  });

  const {
    data: mySchoolsData,
    error: mySchoolsError,
    isPending: mySchoolsPending,
  } = useQuery({
    queryKey: schoolQueryKeys.mySchools(userId),
    queryFn: fetchMySchools,
    enabled,
    staleTime: 60_000,
    retry: false,
  });

  const activeOrgId = useMemo(() => {
    const rows = mySchoolsData?.items ?? [];
    const distinct = [...new Set(rows.map((r) => r.orgId))].sort();
    if (distinct.length >= 1) return distinct[0]!;
    return orgData?.items?.[0]?.id ?? null;
  }, [mySchoolsData?.items, orgData?.items]);

  const orgs = orgData?.items ?? [];
  const mySchools = mySchoolsData?.items ?? [];

  const activeOrgName = useMemo(() => {
    if (!activeOrgId) return null;
    return orgs.find((o) => o.id === activeOrgId)?.name ?? null;
  }, [activeOrgId, orgs]);

  return {
    activeOrgId,
    activeOrgName,
    orgs,
    mySchools,
    orgsError,
    mySchoolsError,
    orgsPending,
    mySchoolsPending,
  };
}
