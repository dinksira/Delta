/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import {
  fetchFeedComments,
  fetchFeedItem,
  fetchFeedPage,
  fetchFeedTelemetrySummary,
  fetchFeedWorkerHealth,
  postFeedComment,
  postFeedEnroll,
  postFeedEvent,
  postFeedLike,
  postFeedSave,
  postFeedShare,
  type FeedEventRequestDto,
  type FeedCommentDto,
  type FeedItemDto,
  type FeedPaginatedResponseDto,
  type FeedTelemetrySummaryDto,
  type FeedWorkerHealthDto,
} from "@/modules/Feed/api";
import {
  MOCK_VIDEO_FEED,
  type LandingVideoClip,
} from "@/modules/Feed/data/mockVideoFeed";
import { feedQueryKeys } from "@/modules/Feed/hooks/feedQueryKeys";
import {
  EMPTY_FEED_SELECTION,
  normalizeFeedQuerySelection,
  type FeedClipFilterSelection,
} from "@/modules/Feed/types/feedClipFilters";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchFeedClips(filters: FeedClipFilterSelection): Promise<readonly LandingVideoClip[]> {
  const useLocalDebugVideosWhenEmpty =
    (process.env.NEXT_PUBLIC_FEED_DEBUG_USE_LOCAL_VIDEOS_WHEN_EMPTY ?? "").toLowerCase() === "true";
  const debugLoadingMsRaw = process.env.NEXT_PUBLIC_FEED_DEBUG_LOADING_MS ?? "";
  const debugLoadingMs = Number.parseInt(debugLoadingMsRaw, 10);
  if (Number.isFinite(debugLoadingMs) && debugLoadingMs > 0) {
    await delay(debugLoadingMs);
  }
  const normalized = normalizeFeedQuerySelection(filters);
  const response = await fetchFeedPage({ limit: 24, filters: normalized });
  if (useLocalDebugVideosWhenEmpty && response.items.length === 0) {
    return MOCK_VIDEO_FEED.map((clip, index) => ({
      ...clip,
      id: `local-feed-${index + 1}`,
    }));
  }
  return response.items;
}

/** Landing / feed stream; `selection` drives `GET /v1/feed` filters (main vertical feed uses same UI). */
export function useFeedClips(selection: FeedClipFilterSelection = EMPTY_FEED_SELECTION) {
  const queryFilters = normalizeFeedQuerySelection(selection);
  return useQuery({
    queryKey: feedQueryKeys.clips(queryFilters),
    queryFn: () => fetchFeedClips(queryFilters),
    staleTime: Infinity,
  });
}

const DEFAULT_INFINITE_PAGE_SIZE = 24;

/** Cursor-paginated feed (`next_cursor` / `has_more`); flatten with `flatMapFeedPages`. */
export function useFeedInfiniteQuery(options?: Readonly<{
  limit?: number;
  contentType?: string | null;
  enabled?: boolean;
}>) {
  const limit = options?.limit ?? DEFAULT_INFINITE_PAGE_SIZE;
  const contentType = options?.contentType ?? "video";
  const enabled = options?.enabled ?? true;
  return useInfiniteQuery({
    queryKey: feedQueryKeys.list({ limit, contentType }),
    queryFn: async ({ pageParam }: { pageParam: string | null }) =>
      fetchFeedPage({
        limit,
        cursor: pageParam,
        contentType,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: FeedPaginatedResponseDto) =>
      lastPage.has_more && lastPage.next_cursor ? lastPage.next_cursor : undefined,
    enabled,
    staleTime: Infinity,
  });
}

/** Single feed card by id (detail / deep link). */
export function useFeedItem(itemId: string | undefined, enabled = true) {
  return useQuery<FeedItemDto>({
    queryKey: feedQueryKeys.item(itemId ?? ""),
    queryFn: () => fetchFeedItem(itemId as string),
    enabled: Boolean(itemId) && enabled,
    staleTime: 60_000,
  });
}

/** Aggregated feed telemetry (admin / debug dashboards). */
export function useFeedTelemetrySummary(options?: Readonly<{
  hours?: number;
  enabled?: boolean;
}>) {
  const hours = options?.hours;
  const enabled = options?.enabled ?? true;
  return useQuery<FeedTelemetrySummaryDto>({
    queryKey: feedQueryKeys.telemetrySummary(hours),
    queryFn: () => fetchFeedTelemetrySummary(hours),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
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

export function useFeedEnrollMutation() {
  return useMutation({
    mutationFn: async (itemId: string) => postFeedEnroll(itemId),
  });
}

export function useFeedWorkerHealth(enabled: boolean) {
  return useQuery<FeedWorkerHealthDto>({
    queryKey: feedQueryKeys.workerHealth(),
    queryFn: fetchFeedWorkerHealth,
    enabled,
    staleTime: 0,
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/** Merge infinite feed pages into one clip list (dedupes by `id`, keeps first occurrence). */
export function flatMapFeedPages(
  data: { pages: readonly FeedPaginatedResponseDto[] } | undefined,
): readonly LandingVideoClip[] {
  if (!data?.pages.length) return [];
  const seen = new Set<string>();
  const out: LandingVideoClip[] = [];
  for (const page of data.pages) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

function mapCommentDtoToPreview(row: FeedCommentDto) {
  const displayName = getCommentDisplayName(row.username || row.userId);
  const initials = (displayName || "DL")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
  return {
    id: row.id,
    initials: initials || "DL",
    name: displayName,
    text: row.body,
    time: row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "now",
  };
}

function getCommentDisplayName(nameRaw: string): string {
  const value = String(nameRaw || "").trim();
  if (!value) return "Community member";
  if (value.includes(" ")) return value;
  const emailMatch = value.match(/^([^@\s]+)@[^@\s]+\.[^@\s]+$/);
  if (emailMatch?.[1]) return humanizeToken(emailMatch[1]);
  return humanizeToken(value);
}

function humanizeToken(token: string): string {
  const cleaned = token.replace(/[_\-.]+/g, " ").trim();
  if (!cleaned) return "Community member";
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
/** ################################ /COMPONENT ############################# */
