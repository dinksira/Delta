/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { apiClient } from "@/lib/apiClient";
import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** DTOs for the backend feed API. */
export type FeedPaginatedResponseDto = Readonly<{
  items: readonly LandingVideoClip[];
  total: number;
  next_cursor: string | null;
  has_more: boolean;
}>;

export type FeedEventType = "view_start" | "view_complete" | "skip" | "hide";

export type FeedEventRequestDto = Readonly<{
  event: FeedEventType;
  watch_ms?: number;
  position_ms?: number;
}>;

export type FeedEngagementResponseDto = Readonly<{
  ok: boolean;
  action: string;
  count: number;
  active: boolean;
}>;

export type FeedShareResponseDto = Readonly<{
  ok: boolean;
  action: string;
  count: number;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export async function fetchFeedPage(params?: {
  readonly limit?: number;
  readonly cursor?: string | null;
  readonly contentType?: string | null;
}): Promise<FeedPaginatedResponseDto> {
  return apiClient.get<FeedPaginatedResponseDto>("/v1/feed", {
    searchParams: {
      limit: params?.limit ?? 24,
      cursor: params?.cursor ?? undefined,
      content_type: params?.contentType ?? "video",
    },
  });
}

export async function postFeedEvent(
  itemId: string,
  payload: FeedEventRequestDto,
): Promise<Readonly<{ ok: boolean; action: string; event: FeedEventType }>> {
  return apiClient.post(`/v1/feed/${itemId}/event`, { json: payload });
}

export async function postFeedLike(itemId: string): Promise<FeedEngagementResponseDto> {
  return apiClient.post<FeedEngagementResponseDto>(`/v1/feed/${itemId}/like`, {
    headers: { "Idempotency-Key": `like-${itemId}-${Date.now()}` },
  });
}

export async function postFeedSave(itemId: string): Promise<FeedEngagementResponseDto> {
  return apiClient.post<FeedEngagementResponseDto>(`/v1/feed/${itemId}/save`, {
    headers: { "Idempotency-Key": `save-${itemId}-${Date.now()}` },
  });
}

export async function postFeedShare(itemId: string): Promise<FeedShareResponseDto> {
  return apiClient.post<FeedShareResponseDto>(`/v1/feed/${itemId}/share`, {
    headers: { "Idempotency-Key": `share-${itemId}-${Date.now()}` },
  });
}
/** ################################ /COMPONENT ############################# */
