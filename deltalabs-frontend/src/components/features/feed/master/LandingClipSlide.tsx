"use client";

import { useState } from "react";

import { CreatorIdentity } from "../CreatorIdentity";
import { FeedActionRail } from "../FeedActionRail";
import { FeedCaption } from "../FeedCaption";
import { FeedHashtagList } from "../FeedHashtagList";
import { FeedResourceLink } from "../FeedResourceLink";
import { LANDING_FEED_PRESENTER } from "@/modules/Feed/data/landingFeedPresenter";
import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";

import { buildLandingRailForClip } from "./landingActionRail";
import { FeedViewport } from "./FeedViewport";

export type LandingClipSlideProps = Readonly<{
  clip: LandingVideoClip;
  isAuthenticated: boolean;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  commentsOpen: boolean;
  onCommentModeChange: (open: boolean) => void;
  onFeedEvent: (
    clipId: string,
    event: "view_start" | "view_complete" | "skip" | "hide",
    payload?: { watchMs?: number; positionMs?: number },
  ) => void;
  preloadStrategy: "auto" | "metadata" | "none";
  onFeedAction: (clipId: string, action: "like" | "bookmark" | "share") => void;
  onRequireAuth: () => void;
  likedActive: boolean;
  savedActive: boolean;
  actionPending: boolean;
  likeMetaLabel?: string;
  bookmarkMetaLabel?: string;
  commentMetaLabel?: string;
  shareMetaLabel?: string;
}>;

/** One snap feed slide: viewport + overlay metadata + action rail. */
export function LandingClipSlide({
  clip,
  isAuthenticated,
  isActive,
  isMuted,
  onToggleMute,
  commentsOpen,
  onCommentModeChange,
  onFeedEvent,
  preloadStrategy,
  onFeedAction,
  onRequireAuth,
  likedActive,
  savedActive,
  actionPending,
  likeMetaLabel,
  bookmarkMetaLabel,
  commentMetaLabel,
  shareMetaLabel,
}: LandingClipSlideProps) {
  const [localActionKey, setLocalActionKey] = useState<string | null>(null);
  const railItems = buildLandingRailForClip(clip);
  const resolvedRailItems = railItems.map((item) => {
    if (item.key === "like" && likeMetaLabel) {
      return { ...item, metaLabel: likeMetaLabel };
    }
    if (item.key === "bookmark" && bookmarkMetaLabel) {
      return { ...item, metaLabel: bookmarkMetaLabel };
    }
    if (item.key === "comment" && commentMetaLabel) {
      return { ...item, metaLabel: commentMetaLabel };
    }
    if (item.key === "share" && shareMetaLabel) {
      return { ...item, metaLabel: shareMetaLabel };
    }
    return item;
  });

  const railActiveKeys = !isActive
    ? []
    : [
        ...(commentsOpen ? (["comment"] as const) : []),
        ...(likedActive ? (["like"] as const) : []),
        ...(savedActive ? (["bookmark"] as const) : []),
      ];

  const handleRailToggle = (key: string) => {
    if (key === "comment") {
      if (commentsOpen) {
        onCommentModeChange(false);
        setLocalActionKey(null);
      } else {
        onCommentModeChange(true);
        setLocalActionKey("comment");
      }
      return;
    }
    if (key === "share") {
      if (actionPending) return;
      onFeedAction(clip.id, "share");
      setLocalActionKey((prev) => (prev === key ? null : key));
      return;
    }
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (actionPending) return;
    if (key === "like" || key === "bookmark" || key === "share") {
      onFeedAction(clip.id, key);
    }
    setLocalActionKey((prev) => (prev === key ? null : key));
  };

  return (
    <div
      className="flex min-h-full w-full shrink-0 snap-start snap-always items-center justify-center py-2 sm:py-3 lg:py-4"
      data-feed-slide=""
      data-clip-id={clip.id}
    >
      <div className="mx-auto flex w-full max-w-full flex-row items-end justify-center gap-1 px-1 sm:gap-1.5 sm:px-0">
        <div
          className="shrink-0"
          style={{
            width:
              "clamp(var(--dl-layout-feed-video-width-min), var(--dl-layout-feed-video-width-preferred), var(--dl-layout-feed-video-width-max))",
            maxWidth: "calc(100vw - var(--dl-layout-feed-video-vw-inset))",
          }}
        >
          <FeedViewport
            clipId={clip.id}
            mediaTone={clip.mediaTone}
            videoSrc={clip.videoSrc}
            isActive={isActive}
            isMuted={isMuted}
            onToggleMute={onToggleMute}
            onFeedEvent={(event, payload) => onFeedEvent(clip.id, event, payload)}
            preloadStrategy={preloadStrategy}
          >
            <CreatorIdentity
              initials={LANDING_FEED_PRESENTER.initials}
              name={LANDING_FEED_PRESENTER.name}
              handle={LANDING_FEED_PRESENTER.handle}
            />
            <FeedCaption text={clip.caption} />
            <FeedHashtagList hashtags={[...clip.hashtags]} />
            <FeedResourceLink text={clip.pdfLabel} />
          </FeedViewport>
        </div>

        <FeedActionRail
          items={resolvedRailItems}
          activeActionKey={localActionKey}
          activeActionKeys={railActiveKeys}
          onActionToggle={handleRailToggle}
        />
      </div>
    </div>
  );
}