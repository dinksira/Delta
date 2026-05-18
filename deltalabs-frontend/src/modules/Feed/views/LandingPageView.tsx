"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, VideoOff } from "lucide-react";

import {
  FeedAuthGateModal,
  FeedClipFilterPanel,
  FeedSearchInput,
  FeedSearchSidebar,
  FeedShareSheet,
  FeedSnapScrollControls,
  FeedStatePanel,
  LandingClipSlide,
  LandingCommentSidebar,
  formatCompactCount,
  parseCompactCountLabel,
} from "@/components/features/feed";
import { FeedLoadingState, FeedWorkerHealthDebugPanel } from "@/modules/Feed/features";
import { FeedExplorerShell, type FeedFilterPanelSlotContext } from "@/modules/Feed/views/FeedExplorerShell";
import {
  EMPTY_FEED_SELECTION,
  appendFeedFilterPanelOpenQuery,
  feedClipFiltersToUrlQueryString,
  normalizeFeedQuerySelection,
  type FeedClipFilterSelection,
} from "@/modules/Feed/types/feedClipFilters";
import { LANDING_BRAND_CLICK_EVENT } from "@/lib/publicNavEvents";
import {
  useFeedClips,
  useFeedEventMutation,
  useFeedLikeMutation,
  useFeedSaveMutation,
  useFeedShareMutation,
} from "@/modules/Feed/hooks";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { useFeedMessages } from "@/i18n/LocaleContext";
import {
  selectCommentPanelOpen,
  setCommentPanelOpen,
  useAppDispatch,
  useAppSelector,
} from "@/store";

/** ################################ /IMPORT ############################# */
/** ################################ COMPONENT ############################# */
/** Public landing feed-style layout aligned to design parity target. */
export function LandingPageView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isAuthenticated, session } = useAuthSession();
  const { browseCategories } = useFeedMessages();
  const commentPanelOpen = useAppSelector(selectCommentPanelOpen);
  const [appliedSelection, setAppliedSelection] = useState<FeedClipFilterSelection>(EMPTY_FEED_SELECTION);
  const feedQuerySelection = useMemo(() => normalizeFeedQuerySelection(appliedSelection), [appliedSelection]);
  const {
    data: clipsData,
    isPending: isFeedPending,
    isError: isFeedError,
    refetch: refetchFeed,
    isFetching: isFeedFetching,
  } = useFeedClips(feedQuerySelection);
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
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
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

  useEffect(() => {
    const onBrandHomeClick = () => {
      setAppliedSelection(EMPTY_FEED_SELECTION);
      setSearchDraft("");
      setSearchOverlayOpen(false);
      feedScrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
      void refetchFeed();
    };
    window.addEventListener(LANDING_BRAND_CLICK_EVENT, onBrandHomeClick);
    return () => window.removeEventListener(LANDING_BRAND_CLICK_EVENT, onBrandHomeClick);
  }, [refetchFeed]);

  const commitSearchToPage = useCallback(
    (raw: string) => {
      const next = raw.trim();
      if (!next) return;
      setSearchOverlayOpen(false);
      router.push(`/search?q=${encodeURIComponent(next)}`);
    },
    [router],
  );

  const searchSidebarLabels = useMemo(
    () => ({
      aria: browseCategories.searchSidebarAria,
      close: browseCategories.searchSidebarClose,
      cancel: browseCategories.searchSidebarCancel,
      viewAllTemplate: browseCategories.searchSidebarViewAllTemplate,
      empty: browseCategories.searchSidebarEmpty,
      loading: browseCategories.searchSidebarLoading,
      error: browseCategories.searchSidebarError,
    }),
    [browseCategories],
  );

  const renderLeftSearch = useCallback(
    (ctx: {
      searchInputId: string;
      filterPanelId: string;
      isFilterOpen: boolean;
      onFilterToggle: () => void;
    }) => (
      <div className="w-full max-w-full">
        <FeedSearchInput
          id={ctx.searchInputId}
          filterControlsId={ctx.filterPanelId}
          isFilterOpen={ctx.isFilterOpen}
          onFilterToggle={ctx.onFilterToggle}
          filterAriaLabel={browseCategories.filtersAria}
          placeholder={browseCategories.searchPlaceholder}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          onFocus={() => setSearchOverlayOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitSearchToPage(searchDraft);
            }
          }}
        />
      </div>
    ),
    [searchDraft, commitSearchToPage, browseCategories],
  );

  const landingFilterPanel = useMemo(() => {
    function LandingFilterPanelSlot(ctx: FeedFilterPanelSlotContext) {
      return (
        <FeedClipFilterPanel
          id={ctx.panelId}
          open={ctx.isOpen}
          appliedSelection={appliedSelection}
          onDismiss={ctx.onDismiss}
          onApply={(next) => {
            const qs = feedClipFiltersToUrlQueryString(next);
            router.push(`/feed/filter?${appendFeedFilterPanelOpenQuery(qs, true)}`);
          }}
        />
      );
    }
    LandingFilterPanelSlot.displayName = "LandingFilterPanelSlot";
    return LandingFilterPanelSlot;
  }, [appliedSelection, router]);

  const explorerShellRails = useMemo(
    () => ({
      expandMainToFullWidth: true as const,
      leftSearch: renderLeftSearch,
      filterPanel: landingFilterPanel,
      rightAside: <FeedWorkerHealthDebugPanel enabled={showWorkerHealthDebugPanel && isAuthenticated} />,
    }),
    [renderLeftSearch, landingFilterPanel, showWorkerHealthDebugPanel, isAuthenticated],
  );

  const noVideosAvailable = !isFeedPending && !isFeedError && clips.length === 0;

  return (
    <>
      {isFeedPending ? (
        <FeedExplorerShell
          {...explorerShellRails}
          center={<FeedLoadingState />}
        />
      ) : null}
      {isFeedError ? (
        <FeedExplorerShell
          {...explorerShellRails}
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
          {...explorerShellRails}
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
        {...explorerShellRails}
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
      <FeedSearchSidebar
        open={searchOverlayOpen}
        onClose={() => setSearchOverlayOpen(false)}
        query={searchDraft}
        onQueryChange={setSearchDraft}
        onSubmitFullSearch={commitSearchToPage}
        labels={searchSidebarLabels}
        searchPlaceholder={browseCategories.searchPlaceholder}
      />
    </>
  );
}

/** ################################ /COMPONENT ############################# */
