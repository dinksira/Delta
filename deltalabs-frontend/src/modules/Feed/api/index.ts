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
/** ################################ /COMPONENT ############################# */
