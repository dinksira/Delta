"use client";

/** Vertical snap-scroll feed column (landing-style playback + engagement). */
import { useCallback, useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  FeedAuthGateModal,
  FeedShareSheet,
  formatCompactCount,
  LandingClipSlide,
  LandingCommentSidebar,
  parseCompactCountLabel,
} from "@/components/features/feed";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
import {
  useFeedEventMutation,
  useFeedLikeMutation,
  useFeedSaveMutation,
  useFeedShareMutation,
} from "@/modules/Feed/hooks";
import {
  selectCommentPanelOpen,
  setCommentPanelOpen,
  useAppDispatch,
  useAppSelector,
} from "@/store";

type FeedSnapScrollColumnProps = Readonly<{
  clips: readonly LandingVideoClip[];
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  /** Scroll to this clip when the column mounts (e.g. after grid pick). */
  initialClipId?: string;
  feedAriaLabel?: string;
  toolbar?: ReactNode;
}>;

export function FeedSnapScrollColumn({
  clips,
  scrollContainerRef,
  initialClipId,
  feedAriaLabel = "Feed",
  toolbar,
}: FeedSnapScrollColumnProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isAuthenticated, session } = useAuthSession();
  const commentPanelOpen = useAppSelector(selectCommentPanelOpen);

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

  const visibleClips = useMemo(() => {
    if (hiddenClipIds.size === 0) return clips;
    const filtered = clips.filter((clip) => !hiddenClipIds.has(clip.id));
    return filtered.length > 0 ? filtered : clips;
  }, [clips, hiddenClipIds]);

  const [isFeedMuted, setIsFeedMuted] = useState(true);
  const [activeClipId, setActiveClipId] = useState("");
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [shareSheetClipId, setShareSheetClipId] = useState<string | null>(null);

  const activeClipIndex = useMemo(
    () => visibleClips.findIndex((clip) => clip.id === activeClipId),
    [visibleClips, activeClipId],
  );
  const activeClip = useMemo(
    () => visibleClips.find((c) => c.id === activeClipId) ?? visibleClips[0],
    [visibleClips, activeClipId],
  );
  const clipIdsKey = useMemo(() => visibleClips.map((clip) => clip.id).join(","), [visibleClips]);
  const accessToken = session?.accessToken ?? null;
  const currentUserId = session?.user?.id ?? null;

  useEffect(() => {
    if (visibleClips.length === 0) return;
    setLikedByClip((prev) => {
      const next = { ...prev };
      for (const clip of visibleClips) {
        if (next[clip.id] === undefined) next[clip.id] = Boolean(clip.likedByMe);
      }
      return next;
    });
    setSavedByClip((prev) => {
      const next = { ...prev };
      for (const clip of visibleClips) {
        if (next[clip.id] === undefined) next[clip.id] = Boolean(clip.savedByMe);
      }
      return next;
    });
  }, [visibleClips]);

  useEffect(() => {
    const container = scrollContainerRef.current;
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
      { root: container, threshold: [0.25, 0.5, 0.75, 0.9] },
    );

    for (const slide of slides) observer.observe(slide);
    return () => observer.disconnect();
  }, [visibleClips, scrollContainerRef]);

  const scrollToClipByIndex = useCallback(
    (index: number) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const slides = Array.from(container.querySelectorAll<HTMLElement>("[data-feed-slide]"));
      if (index < 0 || index >= slides.length) return;
      slides[index]?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    [scrollContainerRef],
  );

  const openAuthModal = useCallback(
    (mode: "login" | "signup") => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("auth", mode);
      const query = next.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const openFeedAuthGate = useCallback(() => {
    if (isAuthenticated) return;
    setAuthGateOpen(true);
  }, [isAuthenticated]);

  const openLoginDirect = useCallback(() => {
    if (isAuthenticated) return;
    openAuthModal("login");
  }, [isAuthenticated, openAuthModal]);

  const setCommentsOpen = useCallback(
    (open: boolean) => {
      dispatch(setCommentPanelOpen(open));
    },
    [dispatch],
  );

  const handleFeedEvent = useCallback(
    (
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
    },
    [feedEventMutation, isAuthenticated],
  );

  const handleFeedAction = useCallback(
    (clipId: string, action: "like" | "bookmark" | "share") => {
      if (action === "share") {
        setShareSheetClipId(clipId);
        return;
      }
      if (!isAuthenticated) {
        openFeedAuthGate();
        return;
      }
      if (action === "like") {
        const clip = visibleClips.find((row) => row.id === clipId);
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
        const clip = visibleClips.find((row) => row.id === clipId);
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
      }
    },
    [
      feedLikeMutation,
      feedSaveMutation,
      isAuthenticated,
      likeCounts,
      likedByClip,
      openFeedAuthGate,
      saveCounts,
      savedByClip,
      visibleClips,
    ],
  );

  const handleShareSelect = useCallback(() => {
    if (shareSheetClipId && isAuthenticated) {
      const clip = visibleClips.find((row) => row.id === shareSheetClipId);
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
  }, [feedShareMutation, isAuthenticated, shareCounts, shareSheetClipId, visibleClips]);

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
    if (!activeClipId || visibleClips.length === 0) return;
    const stillVisible = visibleClips.some((clip) => clip.id === activeClipId);
    if (!stillVisible) {
      setActiveClipId(visibleClips[0]?.id ?? "");
    }
  }, [activeClipId, visibleClips]);

  useEffect(() => {
    if (visibleClips.length === 0) {
      setActiveClipId("");
      return;
    }
    if (initialClipId) {
      const index = visibleClips.findIndex((c) => c.id === initialClipId);
      if (index >= 0) {
        setActiveClipId(initialClipId);
        requestAnimationFrame(() => {
          scrollToClipByIndex(index);
        });
        return;
      }
    }
    setActiveClipId((prev) => {
      if (prev && visibleClips.some((c) => c.id === prev)) return prev;
      return visibleClips[0]?.id ?? "";
    });
  }, [visibleClips, initialClipId, scrollToClipByIndex]);

  if (visibleClips.length === 0) return null;

  return (
    <>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {toolbar ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2 sm:p-3">
            {toolbar}
          </div>
        ) : null}
        <div
          ref={scrollContainerRef}
          role="feed"
          aria-label={feedAriaLabel}
          tabIndex={0}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] snap-y snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const next = activeClipIndex + 1;
              if (next < visibleClips.length) scrollToClipByIndex(next);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const prev = activeClipIndex - 1;
              if (prev >= 0) scrollToClipByIndex(prev);
            }
          }}
        >
          {visibleClips.map((clip, index) => (
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
      </div>

      <LandingCommentSidebar
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
