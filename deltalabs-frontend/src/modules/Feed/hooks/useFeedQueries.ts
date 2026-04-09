/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  fetchFeedComments,
  fetchFeedPage,
  fetchFeedWorkerHealth,
  postFeedComment,
  postFeedEvent,
  postFeedLike,
  postFeedSave,
  postFeedShare,
  type FeedEventRequestDto,
  type FeedCommentDto,
  type FeedWorkerHealthDto,
} from "@/modules/Feed/api";
import { MOCK_VIDEO_FEED, type LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
import { feedQueryKeys } from "@/modules/Feed/hooks/feedQueryKeys";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchFeedClips(): Promise<readonly LandingVideoClip[]> {
  const useLocalDebugVideosWhenEmpty =
    (process.env.NEXT_PUBLIC_FEED_DEBUG_USE_LOCAL_VIDEOS_WHEN_EMPTY ?? "").toLowerCase() === "true";
  const debugLoadingMsRaw = process.env.NEXT_PUBLIC_FEED_DEBUG_LOADING_MS ?? "";
  const debugLoadingMs = Number.parseInt(debugLoadingMsRaw, 10);
  if (Number.isFinite(debugLoadingMs) && debugLoadingMs > 0) {
    await delay(debugLoadingMs);
  }
  const response = await fetchFeedPage({ limit: 24, contentType: "video" });
  if (useLocalDebugVideosWhenEmpty && response.items.length === 0) {
    return MOCK_VIDEO_FEED.map((clip, index) => ({
      ...clip,
      id: `local-feed-${index + 1}`,
    }));
  }
  return response.items;
}

/** Landing / feed stream; swap `queryFn` for real API while keeping this hook name. */
export function useFeedClips() {
  return useQuery({
    queryKey: feedQueryKeys.clips(),
    queryFn: fetchFeedClips,
    staleTime: Infinity,
  });
}

/** Per-clip comment thread (mock); enable when `clipId` is defined. */
export function useFeedComments(clipId: string | undefined) {
  return useQuery({
    queryKey: feedQueryKeys.comments(clipId ?? ""),
    queryFn: async () => {
      if (!clipId) return [];
      const response = await fetchFeedComments(clipId);
      return response.items.map((row) => mapCommentDtoToPreview(row));
    },
    enabled: Boolean(clipId),
    // Keep comment threads fresh across multiple browsers/devices.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useFeedEventMutation() {
  return useMutation({
    mutationFn: async (input: Readonly<{ itemId: string; payload: FeedEventRequestDto }>) =>
      postFeedEvent(input.itemId, input.payload),
  });
}

export function useFeedLikeMutation() {
  return useMutation({
    mutationFn: async (itemId: string) => postFeedLike(itemId),
  });
}

export function useFeedSaveMutation() {
  return useMutation({
    mutationFn: async (itemId: string) => postFeedSave(itemId),
  });
}

export function useFeedShareMutation() {
  return useMutation({
    mutationFn: async (itemId: string) => postFeedShare(itemId),
  });
}

export function useFeedCommentMutation() {
  return useMutation({
    mutationFn: async (input: Readonly<{ itemId: string; body: string }>) =>
      postFeedComment(input.itemId, { body: input.body }),
  });
}

export function useFeedWorkerHealth(enabled: boolean) {
  return useQuery<FeedWorkerHealthDto>({
    queryKey: [...feedQueryKeys.all, "worker-health"],
    queryFn: fetchFeedWorkerHealth,
    enabled,
    staleTime: 0,
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

function mapCommentDtoToPreview(row: FeedCommentDto) {
  const initials = (row.userId || "DL")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
  return {
    id: row.id,
    initials: initials || "DL",
    name: row.userId || "Delta Labs User",
    text: row.body,
    time: row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "now",
    likes: "0",
  };
}
/** ################################ /COMPONENT ############################# */
