"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, VideoOff } from "lucide-react";

import {
  CreatorIdentity,
  FeedActionRail,
  FeedAuthGateModal,
  FeedCaption,
  FeedCommentPanel,
  FeedHashtagList,
  FeedResourceLink,
  FeedShareSheet,
  FeedSnapScrollControls,
  FeedStatePanel,
  FeedViewport,
  type FeedActionItem,
} from "@/components/features/feed";
import { FeedLoadingState, FeedWorkerHealthDebugPanel } from "@/modules/Feed/features";
import { FeedExplorerShell } from "@/modules/Feed/views/FeedExplorerShell";
import { LANDING_FEED_PRESENTER } from "@/modules/Feed/data/landingFeedPresenter";
import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
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

/** ################################ /CONSTANTS ############################# */
/** ################################ HELPERS ############################# */
/** Helper utilities used by this file. */
function buildRailForClip(clip: LandingVideoClip): readonly FeedActionItem[] {
  return actionRailTemplate.map((item) =>
    item.key === "like" && typeof clip.likeCount === "number" && clip.likeCount > 0
      ? { ...item, metaLabel: formatCompactCount(clip.likeCount) }
      : { ...item },
  );
}

function formatCompactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function parseCompactCountLabel(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  if (!value) return 0;
  const sanitized = value.trim().replace(/,/g, "");
  const match = sanitized.match(/^(\d+(?:\.\d+)?)([kKmM])?$/);
  if (!match) return Number.parseInt(sanitized, 10) || 0;
  const base = Number.parseFloat(match[1] ?? "0");
  const suffix = (match[2] ?? "").toLowerCase();
  if (suffix === "m") return Math.round(base * 1_000_000);
  if (suffix === "k") return Math.round(base * 1_000);
  return Math.round(base);
}

/** ################################ /HELPERS ############################# */
/** ################################ SUBCOMPONENTS ############################# */
/** Local subcomponents used by the main export. */
function LandingClipSlide({
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
}: Readonly<{
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
          activeActionKey={localActionKey}
          activeActionKeys={railActiveKeys}
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isAuthenticated, session } = useAuthSession();
  const commentPanelOpen = useAppSelector(selectCommentPanelOpen);
  const {
    data: clipsData,
    isPending: isFeedPending,
    isError: isFeedError,
    refetch: refetchFeed,
    isFetching: isFeedFetching,
  } = useFeedClips();
  const feedEventMutation = useFeedEventMutation();
  const feedLikeMutation = useFeedLikeMutation();
  const feedSaveMutation = useFeedSaveMutation();
  const feedShareMutation = useFeedShareMutation();
  const [hiddenClipIds, setHiddenClipIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
  const [likedByClip, setLikedByClip] = useState<Record<string, boolean>>({});
  const [savedByClip, setSavedByClip] = useState<Record<string, boolean>>({});
  const [actionPendingByClip, setActionPendingByClip] = useState<Record<string, boolean>>({});
  const clips = useMemo(() => {
    const source = clipsData ?? [];
    if (hiddenClipIds.size === 0) {
      return source;
    }
    const filtered = source.filter((clip) => !hiddenClipIds.has(clip.id));
    return filtered.length > 0 ? filtered : source;
  }, [clipsData, hiddenClipIds]);

  const [isFeedMuted, setIsFeedMuted] = useState(true);
  const [activeClipId, setActiveClipId] = useState<string>("");
  const [isOffline, setIsOffline] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [shareSheetClipId, setShareSheetClipId] = useState<string | null>(null);
  const showWorkerHealthDebugPanel =
    (process.env.NEXT_PUBLIC_FEED_DEBUG_WORKER_HEALTH ?? "").toLowerCase() === "true";
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const activeClipIndex = useMemo(
    () => clips.findIndex((clip) => clip.id === activeClipId),
    [clips, activeClipId],
  );
  const activeClip = useMemo(
    () => clips.find((c) => c.id === activeClipId) ?? clips[0],
    [clips, activeClipId],
  );
  const clipIdsKey = useMemo(() => clips.map((clip) => clip.id).join(","), [clips]);
  const accessToken = session?.accessToken ?? null;
  const currentUserId = session?.user?.id ?? null;

  useEffect(() => {
    if (clips.length === 0) return;
    setLikedByClip((prev) => {
      const next = { ...prev };
      for (const clip of clips) {
        if (next[clip.id] === undefined) {
          next[clip.id] = Boolean(clip.likedByMe);
        }
      }
      return next;
    });
    setSavedByClip((prev) => {
      const next = { ...prev };
      for (const clip of clips) {
        if (next[clip.id] === undefined) {
          next[clip.id] = Boolean(clip.savedByMe);
        }
      }
      return next;
    });
  }, [clips]);

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

  const openAuthModal = (mode: "login" | "signup") => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("auth", mode);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const openFeedAuthGate = () => {
    if (isAuthenticated) return;
    setAuthGateOpen(true);
  };

  const openLoginDirect = () => {
    if (isAuthenticated) return;
    openAuthModal("login");
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
    if (action === "share") {
      setShareSheetClipId(clipId);
      return;
    }
    if (!isAuthenticated) {
      openFeedAuthGate();
      return;
    }
    if (action === "like") {
      const clip = clips.find((row) => row.id === clipId);
      const currentCount =
        likeCounts[clipId] !== undefined
          ? likeCounts[clipId] ?? 0
          : parseCompactCountLabel(clip?.likeCount);
      const previousActive = likedByClip[clipId] ?? false;
      const nextActive = !previousActive;
      const nextCount = Math.max(0, currentCount + (nextActive ? 1 : -1));
      setActionPendingByClip((prev) => ({ ...prev, [clipId]: true }));
      setLikedByClip((prev) => ({ ...prev, [clipId]: nextActive }));
      setLikeCounts((prev) => ({ ...prev, [clipId]: nextCount }));
      feedLikeMutation.mutate(clipId, {
        onError: () => {
          setLikedByClip((prev) => ({ ...prev, [clipId]: previousActive }));
          setLikeCounts((prev) => ({ ...prev, [clipId]: currentCount }));
        },
        onSuccess: (result) => {
          setLikedByClip((prev) => ({ ...prev, [clipId]: result.active }));
          setLikeCounts((prev) => ({ ...prev, [clipId]: result.count }));
        },
        onSettled: () => {
          setActionPendingByClip((prev) => ({ ...prev, [clipId]: false }));
        },
      });
      return;
    }
    if (action === "bookmark") {
      const clip = clips.find((row) => row.id === clipId);
      const currentCount =
        saveCounts[clipId] !== undefined ? saveCounts[clipId] ?? 0 : Number(clip?.saveCount ?? 0);
      const previousActive = savedByClip[clipId] ?? false;
      const nextActive = !previousActive;
      const nextCount = Math.max(0, currentCount + (nextActive ? 1 : -1));
      setActionPendingByClip((prev) => ({ ...prev, [clipId]: true }));
      setSavedByClip((prev) => ({ ...prev, [clipId]: nextActive }));
      setSaveCounts((prev) => ({ ...prev, [clipId]: nextCount }));
      feedSaveMutation.mutate(clipId, {
        onError: () => {
          setSavedByClip((prev) => ({ ...prev, [clipId]: previousActive }));
          setSaveCounts((prev) => ({ ...prev, [clipId]: currentCount }));
        },
        onSuccess: (result) => {
          setSavedByClip((prev) => ({ ...prev, [clipId]: result.active }));
          setSaveCounts((prev) => ({ ...prev, [clipId]: result.count }));
        },
        onSettled: () => {
          setActionPendingByClip((prev) => ({ ...prev, [clipId]: false }));
        },
      });
      return;
    }
  };

  const handleShareSelect = () => {
    if (shareSheetClipId && isAuthenticated) {
      const clip = clips.find((row) => row.id === shareSheetClipId);
      const currentCount =
        shareCounts[shareSheetClipId] !== undefined
          ? shareCounts[shareSheetClipId] ?? 0
          : Number(clip?.shareCount ?? 0);
      setShareCounts((prev) => ({ ...prev, [shareSheetClipId]: currentCount + 1 }));
      feedShareMutation.mutate(shareSheetClipId, {
        onError: () => {
          setShareCounts((prev) => ({ ...prev, [shareSheetClipId]: currentCount }));
        },
        onSuccess: (result) => {
          setShareCounts((prev) => ({ ...prev, [shareSheetClipId]: result.count }));
        },
      });
    }
    setShareSheetClipId(null);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!accessToken) return;
    if (!clipIdsKey) return;
    const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    const sourceBase = configuredBase && configuredBase.length > 0 ? configuredBase : window.location.origin;
    const wsBase = sourceBase.replace(/^http/i, "ws");
    const socketUrl = new URL("/v1/feed/ws", wsBase.endsWith("/") ? wsBase : `${wsBase}/`);
    socketUrl.searchParams.set("clip_ids", clipIdsKey);
    socketUrl.searchParams.set("access_token", accessToken);
    let socket: WebSocket | null = null;
    try {
      socket = new window.WebSocket(socketUrl.toString());
    } catch {
      return;
    }
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          content_id?: string;
          user_id?: string;
          action?: string;
          payload?: { count?: number; active?: boolean };
        };
        const clipId = String(payload.content_id ?? "");
        if (!clipId) return;
        const action = String(payload.action ?? "");
        const count = Number(payload.payload?.count ?? 0);
        if (action === "like_toggled") {
          setLikeCounts((prev) => ({ ...prev, [clipId]: count }));
          if (payload.user_id && payload.user_id === currentUserId) {
            setLikedByClip((prev) => ({ ...prev, [clipId]: Boolean(payload.payload?.active) }));
          }
          return;
        }
        if (action === "save_toggled") {
          setSaveCounts((prev) => ({ ...prev, [clipId]: count }));
          if (payload.user_id && payload.user_id === currentUserId) {
            setSavedByClip((prev) => ({ ...prev, [clipId]: Boolean(payload.payload?.active) }));
          }
          return;
        }
        if (action === "comment_created") {
          setCommentCounts((prev) => ({ ...prev, [clipId]: count }));
          return;
        }
        if (action === "shared") {
          setShareCounts((prev) => ({ ...prev, [clipId]: count }));
        }
      } catch {
        // Ignore malformed realtime events.
      }
    };
    return () => {
      socket?.close();
    };
  }, [clipIdsKey, accessToken, currentUserId]);

  useEffect(() => {
    if (!activeClipId || clips.length === 0) return;
    const stillVisible = clips.some((clip) => clip.id === activeClipId);
    if (!stillVisible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync active clip when filtered list changes
      setActiveClipId(clips[0]?.id ?? "");
    }
  }, [activeClipId, clips]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setIsOffline(!window.navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const noVideosAvailable = !isFeedPending && !isFeedError && clips.length === 0;

  return (
    <>
      {isFeedPending ? (
        <FeedExplorerShell
          rightAside={<FeedWorkerHealthDebugPanel enabled={showWorkerHealthDebugPanel && isAuthenticated} />}
          center={<FeedLoadingState />}
        />
      ) : null}
      {isFeedError ? (
        <FeedExplorerShell
          rightAside={<FeedWorkerHealthDebugPanel enabled={showWorkerHealthDebugPanel && isAuthenticated} />}
          center={
            <FeedStatePanel
              icon={CircleAlert}
              title="Something went wrong"
              message={
                isOffline
                  ? "You are offline. Check your connection and try again."
                  : "Something went wrong while loading videos."
              }
              actionLabel={isFeedFetching ? "Refreshing..." : "Refresh"}
              isActionDisabled={isFeedFetching}
              onAction={() => {
                void refetchFeed();
              }}
            />
          }
        />
      ) : null}
      {noVideosAvailable ? (
        <FeedExplorerShell
          rightAside={<FeedWorkerHealthDebugPanel enabled={showWorkerHealthDebugPanel && isAuthenticated} />}
          center={
            <FeedStatePanel
              icon={VideoOff}
              title="No videos available"
              message="Public school posts have not appeared yet. Once videos are published, your feed will show up here."
            />
          }
        />
      ) : null}
      {!isFeedPending && !isFeedError && clips.length > 0 ? (
      <FeedExplorerShell
        rightAside={<FeedWorkerHealthDebugPanel enabled={showWorkerHealthDebugPanel && isAuthenticated} />}
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
                isAuthenticated={isAuthenticated}
                isActive={clip.id === activeClipId}
                isMuted={isFeedMuted}
                onToggleMute={() => setIsFeedMuted((prev) => !prev)}
                commentsOpen={commentPanelOpen && clip.id === activeClipId}
                onCommentModeChange={setCommentsOpen}
                onFeedEvent={handleFeedEvent}
                preloadStrategy={Math.abs(activeClipIndex - index) <= 4 ? "auto" : "metadata"}
                onFeedAction={handleFeedAction}
                onRequireAuth={openFeedAuthGate}
                likedActive={likedByClip[clip.id] ?? Boolean(clip.likedByMe)}
                savedActive={savedByClip[clip.id] ?? Boolean(clip.savedByMe)}
                actionPending={actionPendingByClip[clip.id] ?? false}
                likeMetaLabel={
                  likeCounts[clip.id] !== undefined
                    ? formatCompactCount(likeCounts[clip.id] ?? 0)
                    : typeof clip.likeCount === "number" && clip.likeCount > 0
                      ? formatCompactCount(clip.likeCount)
                      : undefined
                }
                bookmarkMetaLabel={
                  saveCounts[clip.id] !== undefined
                    ? formatCompactCount(saveCounts[clip.id] ?? 0)
                    : typeof clip.saveCount === "number" && clip.saveCount > 0
                      ? formatCompactCount(clip.saveCount)
                      : undefined
                }
                commentMetaLabel={
                  commentCounts[clip.id] !== undefined
                    ? formatCompactCount(commentCounts[clip.id] ?? 0)
                    : typeof clip.commentCount === "number" && clip.commentCount > 0
                      ? formatCompactCount(clip.commentCount)
                      : undefined
                }
                shareMetaLabel={
                  shareCounts[clip.id] !== undefined
                    ? formatCompactCount(shareCounts[clip.id] ?? 0)
                    : typeof clip.shareCount === "number" && clip.shareCount > 0
                      ? formatCompactCount(clip.shareCount)
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
        isAuthenticated={isAuthenticated}
        onRequireAuth={openLoginDirect}
        onCommentCreated={(clipId, nextCount) =>
          setCommentCounts((prev) => ({ ...prev, [clipId]: nextCount }))
        }
        onClose={() => dispatch(setCommentPanelOpen(false))}
      />
      <FeedAuthGateModal
        open={authGateOpen && !isAuthenticated}
        onClose={() => setAuthGateOpen(false)}
        onLogin={() => {
          setAuthGateOpen(false);
          openAuthModal("login");
        }}
        onSignup={() => {
          setAuthGateOpen(false);
          openAuthModal("signup");
        }}
      />
      <FeedShareSheet
        open={shareSheetClipId != null}
        onClose={() => setShareSheetClipId(null)}
        onShareSelect={handleShareSelect}
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
  isAuthenticated,
  onRequireAuth,
  onCommentCreated,
  onClose,
}: Readonly<{
  open: boolean;
  clip: LandingVideoClip | undefined;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onCommentCreated: (clipId: string, nextCount: number) => void;
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
      <FeedCommentPanel
        clip={clip}
        isAuthenticated={isAuthenticated}
        onRequireAuth={onRequireAuth}
        onCommentCreated={onCommentCreated}
        onClose={onClose}
      />
    </aside>,
    document.body,
  );
}
/** ################################ /SUBCOMPONENTS ############################# */
