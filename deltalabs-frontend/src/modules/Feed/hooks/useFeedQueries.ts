/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useQuery } from "@tanstack/react-query";

import { fetchFeedPage } from "@/modules/Feed/api";
import { MOCK_VIDEO_FEED, type LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
import { fetchMockCommentsForClip } from "@/modules/Feed/data/mockComments";
import { feedQueryKeys } from "@/modules/Feed/hooks/feedQueryKeys";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
async function fetchFeedClips(): Promise<readonly LandingVideoClip[]> {
  try {
    const response = await fetchFeedPage({ limit: 24, contentType: "video" });
    if (response.items.length > 0) {
      return response.items;
    }
  } catch {
    // Keep landing feed usable when backend is down in local/frontend-only flows.
  }
  return MOCK_VIDEO_FEED;
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
    queryFn: () => fetchMockCommentsForClip(clipId!),
    enabled: Boolean(clipId),
    staleTime: 60_000,
  });
}
/** ################################ /COMPONENT ############################# */
