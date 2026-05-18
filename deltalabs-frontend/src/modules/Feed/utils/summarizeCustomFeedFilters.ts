import type { FeedMessages } from "@/i18n/feedMessages";
import type { FeedClipFilterSelection } from "@/modules/Feed/types/feedClipFilters";

const COURSE_LABELS: Record<string, string> = {
  research: "Research",
  lab: "Lab",
  course: "Course",
};

export function summarizeCustomFeedFilters(
  selection: FeedClipFilterSelection,
  browse: FeedMessages["browseCategories"],
  copy: FeedMessages["customTab"],
): string {
  const parts: string[] = [];

  if (selection.modality === "video") parts.push(browse.video);
  else if (selection.modality === "audio") parts.push(browse.audio);
  else if (selection.modality === "simulation") parts.push(browse.simulation);
  else if (selection.modality === "all") parts.push(browse.all);

  if (selection.hashtag?.trim()) parts.push(selection.hashtag.trim());

  if (selection.courseCategory && selection.courseCategory !== "all") {
    parts.push(COURSE_LABELS[selection.courseCategory] ?? selection.courseCategory);
  }

  if (selection.duration === "short") parts.push(copy.durationShort);
  else if (selection.duration === "medium") parts.push(copy.durationMedium);
  else if (selection.duration === "long") parts.push(copy.durationLong);

  return parts.length > 0 ? parts.join(" · ") : copy.noFiltersSelected;
}
