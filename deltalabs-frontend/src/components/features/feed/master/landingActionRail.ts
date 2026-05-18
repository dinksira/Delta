import type { FeedActionItem } from "../FeedActionRail";
import { formatCompactCount } from "../utils/feedCountFormat";
import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
import { LANDING_FEED_PRESENTER } from "@/modules/Feed/data/landingFeedPresenter";

export const landingActionRailTemplate = [
  {
    key: "goToCourse",
    actionLabel: "Go to Course",
    metaLabel: "Go to\nCourse",
  },
  { key: "like", actionLabel: "Like", metaLabel: "" },
  { key: "comment", actionLabel: "Comment", metaLabel: "" },
  { key: "bookmark", actionLabel: "Bookmark", metaLabel: "" },
  { key: "share", actionLabel: "Share", metaLabel: "Share" },
  {
    key: "profile",
    actionLabel: "Profile",
    metaLabel: "",
    profileInitials: LANDING_FEED_PRESENTER.initials,
  },
] as const satisfies readonly FeedActionItem[];

export function buildLandingRailForClip(clip: LandingVideoClip): readonly FeedActionItem[] {
  return landingActionRailTemplate.map((item) =>
    item.key === "like" && typeof clip.likeCount === "number" && clip.likeCount > 0
      ? { ...item, metaLabel: formatCompactCount(clip.likeCount) }
      : { ...item },
  );
}
