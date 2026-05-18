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

/** UI-only: `fp=1` keeps the clip filter drawer open after Apply / deep links. */
export const FEED_FILTER_PANEL_OPEN_PARAM = "fp" as const;

/** Serialize filter fields to `content_type`, `hashtag`, … (no `fp`). */
export function feedClipFiltersToUrlQueryString(filters: FeedClipFilterSelection): string {
  const normalized = normalizeFeedQuerySelection(filters);
  const p = feedClipFiltersToSearchParams(normalized);
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(p)) {
    if (value === undefined) continue;
    usp.set(key, String(value));
  }
  return usp.toString();
}

export function appendFeedFilterPanelOpenQuery(queryWithoutLeadingQuestion: string, open: boolean): string {
  const usp = new URLSearchParams(queryWithoutLeadingQuestion);
  if (open) usp.set(FEED_FILTER_PANEL_OPEN_PARAM, "1");
  else usp.delete(FEED_FILTER_PANEL_OPEN_PARAM);
  return usp.toString();
}

/** Read filter chips from the URL (strips `fp`, `q`, `tab`). */
export function parseFeedClipFiltersFromUrlSearchParams(params: URLSearchParams): FeedClipFilterSelection {
  const sp = new URLSearchParams(params.toString());
  sp.delete(FEED_FILTER_PANEL_OPEN_PARAM);
  sp.delete("q");
  sp.delete("tab");

  const contentType = sp.get("content_type");
  const modality =
    contentType === "video" || contentType === "audio" || contentType === "simulation" ? contentType : undefined;

  const hashtagRaw = sp.get("hashtag")?.trim();
  const hashtag = hashtagRaw && hashtagRaw.length > 0 ? hashtagRaw : undefined;

  const course = sp.get("course_category");
  const courseCategory =
    course === "research" || course === "lab" || course === "course" ? course : undefined;

  const minRaw = sp.get("min_duration_s");
  const maxRaw = sp.get("max_duration_s");
  let duration: FeedDurationBucket | undefined;
  if (minRaw != null && maxRaw != null) {
    const min = Number(minRaw);
    const max = Number(maxRaw);
    if (min === 0 && max === 90) duration = "short";
    else if (min === 90 && max === 300) duration = "medium";
    else if (min === 300 && max === 86_400) duration = "long";
  }

  return {
    ...(modality ? { modality } : {}),
    ...(hashtag ? { hashtag } : {}),
    ...(courseCategory ? { courseCategory } : {}),
    ...(duration ? { duration } : {}),
  };
}

/** API shape for `GET/PUT /v1/me/feed/custom-tab` filters (snake_case). */
export type FeedCustomTabFiltersDto = Readonly<{
  content_type?: string;
  hashtag?: string;
  course_category?: string;
  min_duration_s?: number;
  max_duration_s?: number;
}>;

export function feedCustomTabFiltersToSelection(
  filters: FeedCustomTabFiltersDto,
): FeedClipFilterSelection {
  const usp = new URLSearchParams();
  if (filters.content_type) usp.set("content_type", filters.content_type);
  if (filters.hashtag) usp.set("hashtag", filters.hashtag);
  if (filters.course_category) usp.set("course_category", filters.course_category);
  if (filters.min_duration_s != null) usp.set("min_duration_s", String(filters.min_duration_s));
  if (filters.max_duration_s != null) usp.set("max_duration_s", String(filters.max_duration_s));
  return parseFeedClipFiltersFromUrlSearchParams(usp);
}

export function feedSelectionToCustomTabFilters(
  selection: FeedClipFilterSelection,
): FeedCustomTabFiltersDto {
  const p = feedClipFiltersToSearchParams(normalizeFeedQuerySelection(selection));
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(p)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function feedSelectionHasActiveFilters(selection: FeedClipFilterSelection): boolean {
  return Object.keys(feedClipFiltersToSearchParams(normalizeFeedQuerySelection(selection))).length > 0;
}
