/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { apiClient } from "@/lib/apiClient";
import { MOCK_VIDEO_FEED, type LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** DTOs for the backend feed API. */
export type FeedPaginatedResponseDto = Readonly<{
  items: readonly LandingVideoClip[];
  total: number;
  next_cursor: string | null;
  has_more: boolean;
}>;

export type FeedItemDto = LandingVideoClip;

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

export type FeedCommentDto = Readonly<{
  id: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
}>;

export type FeedCommentListResponseDto = Readonly<{
  items: readonly FeedCommentDto[];
  count: number;
}>;

export type FeedCommentCreateRequestDto = Readonly<{ body: string }>;

export type FeedCommentCreateResponseDto = Readonly<{
  ok: boolean;
  action: string;
  comment_id: string;
  count: number;
}>;

export type FeedTelemetrySummaryDto = Readonly<{
  eventCounts: Readonly<Record<string, number>>;
  totalEvents: number;
  uniqueUsers: number;
  averageWatchMs: number;
  hideRate: number;
  completionRate: number;
}>;

export type FeedWorkerHealthDto = Readonly<{
  stream_length: number;
  dead_letter_length: number;
  processed_total: number;
  worker_cursor: string | null;
  last_processed_at_ms: number | null;
  lag_approx: number;
  lag_is_lower_bound: number;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
const ENABLE_LOCAL_FEED_DEBUG =
  (process.env.NEXT_PUBLIC_FEED_DEBUG_USE_LOCAL_VIDEOS_WHEN_EMPTY ?? "").toLowerCase() === "true";
const LOCAL_FEED_ID_PREFIX = "local-feed-";

const localLikeCounts = new Map<string, number>();
const localSaveCounts = new Map<string, number>();
const localShareCounts = new Map<string, number>();
const localCommentStore = new Map<string, FeedCommentDto[]>();

function isLocalDebugFeedItem(itemId: string): boolean {
  return ENABLE_LOCAL_FEED_DEBUG && itemId.startsWith(LOCAL_FEED_ID_PREFIX);
}

function parseCompactCountLabel(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  if (!value) return 0;
  const sanitized = value.trim().replace(/,/g, "");
  const match = sanitized.match(/^(\d+(?:\.\d+)?)([kKmM])?$/);
  if (!match) return Number.parseInt(sanitized, 10) || 0;
  const base = Number.parseFloat(match[1] ?? "0");
  const suffix = (match[2] ?? "").toLowerCase();
  if (suffix === "m") return Math.round(base * 1_000_000);
  if (suffix === "k") return Math.round(base * 1_000);
  return Math.round(base);
}

function getLocalVideoSeedById(itemId: string): LandingVideoClip | undefined {
  const indexPart = itemId.slice(LOCAL_FEED_ID_PREFIX.length);
  const index = Number.parseInt(indexPart, 10);
  if (!Number.isFinite(index) || index <= 0) return undefined;
  return MOCK_VIDEO_FEED[index - 1];
}

function getLocalLikeCount(itemId: string): number {
  const stored = localLikeCounts.get(itemId);
  if (stored !== undefined) return stored;
  const seed = getLocalVideoSeedById(itemId);
  const parsed = parseCompactCountLabel(seed?.likeCount);
  localLikeCounts.set(itemId, parsed);
  return parsed;
}

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
  if (isLocalDebugFeedItem(itemId)) {
    return {
      ok: true,
      action: "event",
      event: payload.event,
    };
  }
  return apiClient.post(`/v1/feed/${itemId}/event`, { json: payload });
}

export async function postFeedLike(itemId: string): Promise<FeedEngagementResponseDto> {
  if (isLocalDebugFeedItem(itemId)) {
    const nextCount = getLocalLikeCount(itemId) + 1;
    localLikeCounts.set(itemId, nextCount);
    return { ok: true, action: "like", count: nextCount, active: true };
  }
  return apiClient.post<FeedEngagementResponseDto>(`/v1/feed/${itemId}/like`, {
    headers: { "Idempotency-Key": `like-${itemId}-${Date.now()}` },
  });
}

export async function postFeedSave(itemId: string): Promise<FeedEngagementResponseDto> {
  if (isLocalDebugFeedItem(itemId)) {
    const nextCount = (localSaveCounts.get(itemId) ?? 0) + 1;
    localSaveCounts.set(itemId, nextCount);
    return { ok: true, action: "save", count: nextCount, active: true };
  }
  return apiClient.post<FeedEngagementResponseDto>(`/v1/feed/${itemId}/save`, {
    headers: { "Idempotency-Key": `save-${itemId}-${Date.now()}` },
  });
}

export async function postFeedShare(itemId: string): Promise<FeedShareResponseDto> {
  if (isLocalDebugFeedItem(itemId)) {
    const nextCount = (localShareCounts.get(itemId) ?? 0) + 1;
    localShareCounts.set(itemId, nextCount);
    return { ok: true, action: "share", count: nextCount };
  }
  return apiClient.post<FeedShareResponseDto>(`/v1/feed/${itemId}/share`, {
    headers: { "Idempotency-Key": `share-${itemId}-${Date.now()}` },
  });
}

export async function fetchFeedComments(
  itemId: string,
  limit = 50,
): Promise<FeedCommentListResponseDto> {
  if (isLocalDebugFeedItem(itemId)) {
    const comments = localCommentStore.get(itemId) ?? [];
    const sliced = comments.slice(0, Math.max(0, limit));
    return { items: sliced, count: comments.length };
  }
  return apiClient.get<FeedCommentListResponseDto>(`/v1/feed/${itemId}/comments`, {
    searchParams: { limit },
  });
}

export async function postFeedComment(
  itemId: string,
  payload: FeedCommentCreateRequestDto,
): Promise<FeedCommentCreateResponseDto> {
  if (isLocalDebugFeedItem(itemId)) {
    const existing = localCommentStore.get(itemId) ?? [];
    const created: FeedCommentDto = {
      id: `${itemId}-comment-${Date.now()}`,
      userId: "Debug User",
      username: "Debug User",
      body: payload.body,
      createdAt: new Date().toISOString(),
    };
    const updated = [created, ...existing];
    localCommentStore.set(itemId, updated);
    return {
      ok: true,
      action: "comment",
      comment_id: created.id,
      count: updated.length,
    };
  }
  return apiClient.post<FeedCommentCreateResponseDto>(`/v1/feed/${itemId}/comment`, {
    json: payload,
    headers: { "Idempotency-Key": `comment-${itemId}-${Date.now()}` },
  });
}

export async function fetchFeedItem(itemId: string): Promise<FeedItemDto> {
  return apiClient.get<FeedItemDto>(`/v1/feed/${itemId}`);
}

export async function postFeedEnroll(itemId: string): Promise<{
  ok: boolean;
  action: string;
  enrolled: boolean;
  message: string;
}> {
  return apiClient.post(`/v1/feed/${itemId}/enroll`);
}

export async function fetchFeedTelemetrySummary(
  hours?: number,
): Promise<FeedTelemetrySummaryDto> {
  return apiClient.get<FeedTelemetrySummaryDto>("/v1/feed/telemetry/summary", {
    searchParams: hours ? { hours } : undefined,
  });
}

export async function fetchFeedWorkerHealth(): Promise<FeedWorkerHealthDto> {
  return apiClient.get<FeedWorkerHealthDto>("/v1/feed/worker/health");
}
/** ################################ /COMPONENT ############################# */
