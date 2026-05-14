/** ################################ TYPES ############################# */
/** Feed explorer filter model (mirrors `GET /v1/feed` optional query params). */

export type FeedContentModality = "all" | "video" | "audio" | "simulation";

export type FeedCourseCategory = "all" | "research" | "lab" | "course";

export type FeedDurationBucket = "any" | "short" | "medium" | "long";

/** Only fields the user explicitly chose are set; omitted keys are not sent to the API. */
export type FeedClipFilterSelection = Readonly<{
  modality?: FeedContentModality;
  hashtag?: string;
  courseCategory?: FeedCourseCategory;
  duration?: FeedDurationBucket;
}>;

/** Stable empty selection for TanStack keys and default browse. */
export const EMPTY_FEED_SELECTION: FeedClipFilterSelection = Object.freeze({});
export function feedClipFiltersToSearchParams(
  filters: FeedClipFilterSelection,
): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {};
  if ("modality" in filters && filters.modality !== undefined && filters.modality !== "all") {
    params.content_type = filters.modality;
  }
  const tag = "hashtag" in filters && filters.hashtag !== undefined ? filters.hashtag.trim() : "";
  if (tag.length > 0) {
    params.hashtag = tag;
  }
  if (
    "courseCategory" in filters &&
    filters.courseCategory !== undefined &&
    filters.courseCategory !== "all"
  ) {
    params.course_category = filters.courseCategory;
  }
  const duration = "duration" in filters ? filters.duration : undefined;
  if (duration === "short") {
    params.min_duration_s = 0;
    params.max_duration_s = 90;
  } else if (duration === "medium") {
    params.min_duration_s = 90;
    params.max_duration_s = 300;
  } else if (duration === "long") {
    params.min_duration_s = 300;
    params.max_duration_s = 86_400;
  }
  return params;
}

/** Collapses selections that produce no API params for stable TanStack keys. */
export function normalizeFeedQuerySelection(filters: FeedClipFilterSelection): FeedClipFilterSelection {
  const p = feedClipFiltersToSearchParams(filters);
  return Object.keys(p).length === 0 ? EMPTY_FEED_SELECTION : filters;
}
