import { useQuery } from "@tanstack/react-query";

import { MOCK_VIDEO_FEED, type LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
import { fetchMockCommentsForClip } from "@/modules/Feed/data/mockComments";
import { feedQueryKeys } from "@/modules/Feed/hooks/feedQueryKeys";

async function fetchFeedClips(): Promise<readonly LandingVideoClip[]> {
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
