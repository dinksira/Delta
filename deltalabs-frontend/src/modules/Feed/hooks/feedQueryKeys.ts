/** ################################ IMPORT ############################# */
import type { FeedClipFilterSelection } from "@/modules/Feed/types/feedClipFilters";

/** ################################ /IMPORT ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** TanStack Query keys for feed stream and per-clip resources. */
export type FeedListQueryParams = Readonly<{
  limit: number;
  contentType: string | null;
}>;

export const feedQueryKeys = {
  all: ["feed"] as const,
  clips: (selection: FeedClipFilterSelection) => [...feedQueryKeys.all, "clips", selection] as const,
  list: (params: FeedListQueryParams) => [...feedQueryKeys.all, "list", params] as const,
  item: (itemId: string) => [...feedQueryKeys.all, "item", itemId] as const,
  comments: (clipId: string) => [...feedQueryKeys.all, "comments", clipId] as const,
  telemetrySummary: (hours: number | undefined) =>
    [...feedQueryKeys.all, "telemetry-summary", hours ?? "all"] as const,
  workerHealth: () => [...feedQueryKeys.all, "worker-health"] as const,
} as const;
/** ################################ /COMPONENT ############################# */
