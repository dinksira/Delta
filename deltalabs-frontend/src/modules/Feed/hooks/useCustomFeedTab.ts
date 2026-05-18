"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthSession } from "@/contexts/AuthSession_Context";
import { ApiError } from "@/lib/apiClient";
import {
  fetchFeedCustomTab,
  upsertFeedCustomTab,
  type FeedCustomTabDto,
  type FeedCustomTabUpsertDto,
} from "@/modules/Feed/api";
import { feedQueryKeys } from "@/modules/Feed/hooks/feedQueryKeys";

export function useCustomFeedTab() {
  const { isAuthenticated, isReady, session } = useAuthSession();
  const userId = session?.user?.id ?? "anon";
  const enabled = isAuthenticated && isReady;

  return useQuery({
    queryKey: feedQueryKeys.customTab(userId),
    queryFn: async (): Promise<FeedCustomTabDto | null> => {
      try {
        return await fetchFeedCustomTab();
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

export function useUpdateCustomFeedTab() {
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const userId = session?.user?.id ?? "anon";

  return useMutation({
    mutationFn: (payload: FeedCustomTabUpsertDto) => upsertFeedCustomTab(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(feedQueryKeys.customTab(userId), data);
    },
  });
}
