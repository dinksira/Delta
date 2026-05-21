"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/contexts/AuthSession_Context";
import { fetchFeaturesLayout } from "@/modules/Features/api";
import { tabParamToFeatureKey } from "@/modules/Features/featureWorkspaceRoutes";
import { featuresQueryKeys } from "@/modules/Features/hooks/featuresQueryKeys";

/** Per-user hidden feature keys from layout persistence. */
export function useFeaturesLayoutAccess() {
  const { isAuthenticated, isReady, session } = useAuthSession();
  const userId = session?.user?.id ?? "anon";

  const { data, isPending } = useQuery({
    queryKey: featuresQueryKeys.layout(userId),
    queryFn: fetchFeaturesLayout,
    enabled: isReady && isAuthenticated,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
  });

  const hiddenSet = useMemo(() => new Set(data?.hiddenKeys ?? []), [data?.hiddenKeys]);

  return {
    hiddenKeys: data?.hiddenKeys ?? [],
    hiddenSet,
    isLayoutReady: isReady && (!isAuthenticated || !isPending),
    isFeatureHidden: (featureKey: string) => hiddenSet.has(featureKey.trim().toLowerCase()),
    isTabParamHidden: (tabParam: string) => hiddenSet.has(tabParamToFeatureKey(tabParam)),
  };
}
