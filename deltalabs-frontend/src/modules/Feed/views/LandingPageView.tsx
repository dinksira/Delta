"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  CreatorIdentity,
  FeedActionRail,
  FeedCaption,
  FeedCommentPanel,
  FeedHashtagList,
  FeedResourceLink,
  FeedSnapScrollControls,
  FeedViewport,
  type FeedActionItem,
} from "@/components/features/feed";
import { FeedExplorerShell } from "@/modules/Feed/views/FeedExplorerShell";
import { LANDING_FEED_PRESENTER } from "@/modules/Feed/data/landingFeedPresenter";
import { MOCK_VIDEO_FEED, type LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
import {
  useFeedClips,
  useFeedEventMutation,
  useFeedLikeMutation,
  useFeedSaveMutation,
  useFeedShareMutation,
} from "@/modules/Feed/hooks";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import {
  selectCommentPanelOpen,
  setCommentPanelOpen,
  useAppDispatch,
  useAppSelector,
} from "@/store";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const actionRailTemplate = [
  {
    key: "goToCourse",
    actionLabel: "Go to Course",
    metaLabel: "Go to\nCourse",
  },
  { key: "like", actionLabel: "Like", metaLabel: "42.8K" },
  { key: "comment", actionLabel: "Comment", metaLabel: "1,204" },
  { key: "bookmark", actionLabel: "Bookmark", metaLabel: "8.4K" },
  { key: "share", actionLabel: "Share", metaLabel: "Share" },
  {
    key: "profile",
    actionLabel: "Profile",
    metaLabel: "",
    profileInitials: LANDING_FEED_PRESENTER.initials,
  },
] as const satisfies readonly FeedActionItem[];

/** ################################ /CONSTANTS ############################# */
/** ################################ HELPERS ############################# */
/** Helper utilities used by this file. */
function buildRailForClip(clip: LandingVideoClip): readonly FeedActionItem[] {
  return actionRailTemplate.map((item) =>
    item.key === "like" && clip.likeCount
      ? { ...item, metaLabel: clip.likeCount }
      : { ...item },
  );
}

function formatCompactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

/** ################################ /HELPERS ############################# */
/** ################################ SUBCOMPONENTS ############################# */
/** Local subcomponents used by the main export. */
function LandingClipSlide({
  clip,
  isActive,
  isMuted,
  onToggleMute,
  commentsOpen,
  onCommentModeChange,
  onFeedEvent,
  preloadStrategy,
  onFeedAction,
  likeMetaLabel,
  bookmarkMetaLabel,
}: Readonly<{
  clip: LandingVideoClip;
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
  likeMetaLabel?: string;
  bookmarkMetaLabel?: string;
}>) {
  const [localActionKey, setLocalActionKey] = useState<string | null>(null);
  const railItems = buildRailForClip(clip);
  const resolvedRailItems = railItems.map((item) => {
    if (item.key === "like" && likeMetaLabel) {
      return { ...item, metaLabel: likeMetaLabel };
    }
    if (item.key === "bookmark" && bookmarkMetaLabel) {
      return { ...item, metaLabel: bookmarkMetaLabel };
    }
    return item;
  });

  const railActiveKey =
    !isActive ? null : commentsOpen ? "comment" : localActionKey === "comment" ? null : localActionKey;

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
        <div className="min-w-0 flex-1 basis-0 max-w-[380px] sm:w-[420px] sm:max-w-[420px] sm:flex-none sm:shrink-0 sm:basis-auto">
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
          activeActionKey={railActiveKey}
          onActionToggle={handleRailToggle}
        />
      </div>
    </div>
  );
}

/** ################################ /SUBCOMPONENTS ############################# */
/** ################################ COMPONENT ############################# */
/** Public landing feed-style layout aligned to design parity target. */
export function LandingPageView() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuthSession();
  const commentPanelOpen = useAppSelector(selectCommentPanelOpen);
  const { data: clipsData } = useFeedClips();
  const feedEventMutation = useFeedEventMutation();
  const feedLikeMutation = useFeedLikeMutation();
  const feedSaveMutation = useFeedSaveMutation();
  const feedShareMutation = useFeedShareMutation();
  const [hiddenClipIds, setHiddenClipIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});
  const clips = useMemo(() => {
    const source = clipsData ?? MOCK_VIDEO_FEED;
    if (hiddenClipIds.size === 0) {
      return source;
    }
    const filtered = source.filter((clip) => !hiddenClipIds.has(clip.id));
    return filtered.length > 0 ? filtered : source;
  }, [clipsData, hiddenClipIds]);

  const [isFeedMuted, setIsFeedMuted] = useState(true);
  const [activeClipId, setActiveClipId] = useState<string>(MOCK_VIDEO_FEED[0]?.id ?? "");
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const activeClipIndex = useMemo(
    () => clips.findIndex((clip) => clip.id === activeClipId),
    [clips, activeClipId],
  );
  const activeClip = useMemo(
    () => clips.find((c) => c.id === activeClipId) ?? clips[0],
    [clips, activeClipId],
  );

  useEffect(() => {
    const container = feedScrollRef.current;
    if (!container) return;
    if (typeof IntersectionObserver === "undefined") return;
    const slides = Array.from(container.querySelectorAll<HTMLElement>("[data-feed-slide]"));
    if (slides.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top) return;
        const id = (top.target as HTMLElement).dataset.clipId;
        if (!id) return;
        setActiveClipId((prev) => (prev === id ? prev : id));
      },
      {
        root: container,
        threshold: [0.25, 0.5, 0.75, 0.9],
      },
    );

    for (const slide of slides) observer.observe(slide);
    return () => observer.disconnect();
  }, [clips]);

  const scrollToClipByIndex = (index: number) => {
    const container = feedScrollRef.current;
    if (!container) return;
    const slides = Array.from(container.querySelectorAll<HTMLElement>("[data-feed-slide]"));
    if (index < 0 || index >= slides.length) return;
    slides[index]?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const setCommentsOpen = (open: boolean) => {
    dispatch(setCommentPanelOpen(open));
  };

  const handleFeedEvent = (
    clipId: string,
    event: "view_start" | "view_complete" | "skip" | "hide",
    payload?: { watchMs?: number; positionMs?: number },
  ) => {
    if (event === "hide") {
      setHiddenClipIds((prev) => {
        const next = new Set(prev);
        next.add(clipId);
        return next;
      });
    }
    if (!isAuthenticated) return;
    feedEventMutation.mutate({
      itemId: clipId,
      payload: {
        event,
        watch_ms: payload?.watchMs,
        position_ms: payload?.positionMs,
      },
    });
  };

  const handleFeedAction = (clipId: string, action: "like" | "bookmark" | "share") => {
    if (!isAuthenticated) return;
    if (action === "like") {
      feedLikeMutation.mutate(clipId, {
        onSuccess: (result) => {
          setLikeCounts((prev) => ({ ...prev, [clipId]: result.count }));
        },
      });
      return;
    }
    if (action === "bookmark") {
      feedSaveMutation.mutate(clipId, {
        onSuccess: (result) => {
          setSaveCounts((prev) => ({ ...prev, [clipId]: result.count }));
        },
      });
      return;
    }
    feedShareMutation.mutate(clipId);
  };

  useEffect(() => {
    if (!activeClipId || clips.length === 0) return;
    const stillVisible = clips.some((clip) => clip.id === activeClipId);
    if (!stillVisible) {
      setActiveClipId(clips[0]?.id ?? "");
    }
  }, [activeClipId, clips]);

  return (
    <>
      {clips.length === 0 ? (
        <FeedExplorerShell
          center={
            <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8">
              <div className="w-full max-w-lg rounded-2xl border border-border-default bg-surface-default p-6 text-center">
                <Typography as="h2" variant="title" className="text-text-primary">
                  No videos yet
                </Typography>
                <Typography as="p" variant="body" className="mt-2 text-text-secondary">
                  The feed is ready. Once schools and creators publish videos, personalized FYP
                  ranking will activate automatically.
                </Typography>
              </div>
            </div>
          }
        />
      ) : null}
      {clips.length > 0 ? (
      <FeedExplorerShell
        afterGrid={
          <FeedSnapScrollControls
            scrollContainerRef={feedScrollRef}
            commentSidebarOpen={commentPanelOpen}
          />
        }
        center={
          <div
            ref={feedScrollRef}
            role="feed"
            aria-label="Video feed"
            tabIndex={0}
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] snap-y snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                const next = activeClipIndex + 1;
                if (next < clips.length) scrollToClipByIndex(next);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                const prev = activeClipIndex - 1;
                if (prev >= 0) scrollToClipByIndex(prev);
              }
            }}
          >
            {clips.map((clip, index) => (
              <LandingClipSlide
                key={clip.id}
                clip={clip}
                isActive={clip.id === activeClipId}
                isMuted={isFeedMuted}
                onToggleMute={() => setIsFeedMuted((prev) => !prev)}
                commentsOpen={commentPanelOpen && clip.id === activeClipId}
                onCommentModeChange={setCommentsOpen}
                onFeedEvent={handleFeedEvent}
                preloadStrategy={Math.abs(activeClipIndex - index) <= 4 ? "auto" : "metadata"}
                onFeedAction={handleFeedAction}
                likeMetaLabel={
                  likeCounts[clip.id] !== undefined
                    ? formatCompactCount(likeCounts[clip.id] ?? 0)
                    : clip.likeCount
                }
                bookmarkMetaLabel={
                  saveCounts[clip.id] !== undefined
                    ? formatCompactCount(saveCounts[clip.id] ?? 0)
                    : undefined
                }
              />
            ))}
          </div>
        }
      />
      ) : null}
      <LandingCommentSidebarPortal
        open={commentPanelOpen}
        clip={activeClip}
        onClose={() => dispatch(setCommentPanelOpen(false))}
      />
    </>
  );
}

/** ################################ /COMPONENT ############################# */
/** ################################ SUBCOMPONENTS ############################# */
/** Renders the comment column on `document.body` so it is not clipped by feed layout; `top-16` matches `TopNav` `h-16`. */
function LandingCommentSidebarPortal({
  open,
  clip,
  onClose,
}: Readonly<{
  open: boolean;
  clip: LandingVideoClip | undefined;
  onClose: () => void;
}>) {
  if (typeof document === "undefined" || !open || !clip) {
    return null;
  }

  return createPortal(
    <aside
      className="fixed right-0 top-16 z-40 flex h-[calc(100dvh-4rem)] w-full max-w-md min-w-0 flex-col border-l border-border-default bg-surface-default shadow-sm"
      aria-label="Comments"
    >
      <FeedCommentPanel clip={clip} onClose={onClose} />
    </aside>,
    document.body,
  );
}
/** ################################ /SUBCOMPONENTS ############################# */
