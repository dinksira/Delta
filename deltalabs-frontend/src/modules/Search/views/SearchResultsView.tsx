"use client";

/** ################################ IMPORT ############################# */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { FeedClipFilterPanel, FeedSearchInput, FeedSearchSidebar } from "@/components/features/feed";
import { cx } from "@/components/theme/utils";
import { feedItemDetailPath, isLikelyAudioMediaUrl } from "@/lib/feedItemRoutes";
import { useAuthMessages } from "@/i18n/LocaleContext";
import { fetchGlobalSearch, type SearchUserHitDto } from "@/modules/Feed/api";
import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
import {
  EMPTY_FEED_SELECTION,
  appendFeedFilterPanelOpenQuery,
  feedClipFiltersToUrlQueryString,
} from "@/modules/Feed/types/feedClipFilters";
import {
  FeedExplorerShell,
  type FeedFilterPanelSlotContext,
  type FeedSearchRailContext,
} from "@/modules/Feed/views/FeedExplorerShell";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type SearchResultsTab = "top" | "users";

/** ################################ /TYPES ############################# */

/** ################################ HELPERS ############################# */
function formatCompactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function normalizeSearchTab(raw: string | null): SearchResultsTab {
  const t = (raw ?? "top").trim().toLowerCase();
  return t === "users" ? "users" : "top";
}

export function SearchTopResultsSkeleton({ loadingLabel }: Readonly<{ loadingLabel: string }>) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={loadingLabel}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={`search-top-skel-${i}`} className="dl-search-shimmer-surface aspect-[3/4] w-full rounded-lg" />
      ))}
    </div>
  );
}

function SearchUsersResultsSkeleton({ loadingLabel }: Readonly<{ loadingLabel: string }>) {
  return (
    <div role="status" aria-live="polite" aria-label={loadingLabel} className="divide-y divide-border-default">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={`search-user-skel-${i}`} className="flex items-center gap-3 py-3">
          <div className="dl-search-shimmer-surface size-11 shrink-0 rounded-full" />
          <div className="dl-search-shimmer-surface h-4 max-w-[14rem] flex-1 rounded-md" />
        </div>
      ))}
    </div>
  );
}

const AUDIO_CARD_GRADIENTS = [
  "from-slate-600 via-slate-700 to-slate-900",
  "from-primary-600 via-primary-800 to-slate-900",
  "from-emerald-600 via-teal-800 to-slate-900",
  "from-violet-600 via-indigo-800 to-slate-900",
  "from-amber-600 via-orange-800 to-slate-900",
  "from-rose-600 via-pink-900 to-slate-950",
] as const;

export function SearchVideoTile({ clip }: Readonly<{ clip: LandingVideoClip }>) {
  const href = feedItemDetailPath(clip);
  const isAudio = clip.contentType === "audio" || isLikelyAudioMediaUrl(clip.videoSrc);
  const grad = AUDIO_CARD_GRADIENTS[Math.abs(clip.mediaTone) % AUDIO_CARD_GRADIENTS.length];

  const inner = (
    <article className="group relative aspect-[3/4] w-full overflow-hidden rounded-lg">
      {isAudio ? (
        <div
          className={cx("flex h-full w-full items-center justify-center bg-gradient-to-br", grad)}
          aria-hidden
        >
          <span className="rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/95 ring-1 ring-white/25">
            Audio
          </span>
        </div>
      ) : (
        <video
          src={clip.videoSrc}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          muted
          playsInline
          preload="metadata"
          aria-label={clip.caption}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
        {typeof clip.likeCount === "number" && clip.likeCount > 0 ? (
          <p className="mb-0.5 text-xs font-semibold drop-shadow">{formatCompactCount(clip.likeCount)} likes</p>
        ) : null}
        <p className="line-clamp-2 text-xs leading-snug drop-shadow">{clip.caption}</p>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2">
        {inner}
      </Link>
    );
  }
  return inner;
}

function SearchUserRow({ user }: Readonly<{ user: SearchUserHitDto }>) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-1 py-3 sm:px-2">
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-text-secondary ring-1 ring-border-default"
        aria-hidden
      >
        {(user.username || "?").slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">@{user.username}</p>
      </div>
    </div>
  );
}

/** ################################ /HELPERS ############################# */

/** ################################ COMPONENT ############################# */
export function SearchResultsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const browseCategories = useAuthMessages().browseCategories;

  const qRaw = searchParams.get("q") ?? "";
  const q = qRaw.trim();
  const searchTab = normalizeSearchTab(searchParams.get("tab"));

  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  const [draft, setDraft] = useState(qRaw);

  useEffect(() => {
    setDraft(qRaw);
  }, [qRaw]);

  const query = useQuery({
    queryKey: ["search", "global", q, searchTab],
    queryFn: () => fetchGlobalSearch({ q, tab: searchTab, limit: 24 }),
    enabled: q.length > 0,
  });

  const clips = useMemo(() => {
    if (!query.data) return [] as readonly LandingVideoClip[];
    const { videos, audio, simulations } = query.data;
    return [...videos, ...audio, ...simulations];
  }, [query.data]);

  const users = query.data?.users ?? [];

  const submitSearchQuery = useCallback((raw: string) => {
    const next = raw.trim();
    if (!next) return;
    setSearchOverlayOpen(false);
    router.push(`/search?q=${encodeURIComponent(next)}&tab=top`);
  }, [router]);

  const goTab = useCallback(
    (tab: SearchResultsTab) => {
      if (!q) return;
      const sp = new URLSearchParams();
      sp.set("q", q);
      sp.set("tab", tab);
      router.replace(`/search?${sp.toString()}`);
    },
    [q, router],
  );

  const closeSearchAndGoBack = useCallback(() => {
    router.back();
  }, [router]);

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

  const filterPanel = useCallback(
    (ctx: FeedFilterPanelSlotContext) => (
      <FeedClipFilterPanel
        id={ctx.panelId}
        open={ctx.isOpen}
        appliedSelection={EMPTY_FEED_SELECTION}
        onDismiss={ctx.onDismiss}
        onApply={(next) => {
          const qs = feedClipFiltersToUrlQueryString(next);
          router.push(`/feed/filter?${appendFeedFilterPanelOpenQuery(qs, true)}`);
        }}
      />
    ),
    [router],
  );

  const renderLeftSearch = useCallback(
    (ctx: FeedSearchRailContext) => (
      <div className="w-full max-w-full">
        <FeedSearchInput
          id={ctx.searchInputId}
          filterControlsId={ctx.filterPanelId}
          isFilterOpen={ctx.isFilterOpen}
          onFilterToggle={ctx.onFilterToggle}
          filterAriaLabel={browseCategories.filtersAria}
          placeholder={browseCategories.searchPlaceholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setSearchOverlayOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitSearchQuery(draft);
            }
          }}
        />
      </div>
    ),
    [browseCategories.searchPlaceholder, browseCategories.filtersAria, draft, submitSearchQuery],
  );

  const center = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-2 sm:pt-3">
      {!q ? (
        <div className="mt-2 flex shrink-0 items-start justify-between gap-3 border-b border-border-default px-2 pb-3 sm:mt-3 sm:px-3 lg:px-4">
          <p className="min-w-0 flex-1 pt-1 text-sm text-text-secondary">{browseCategories.searchHintNoQuery}</p>
          <button
            type="button"
            onClick={closeSearchAndGoBack}
            className="shrink-0 rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2"
            aria-label={browseCategories.searchCloseReturnAria}
          >
            <X className="size-5" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      ) : (
        <>
          <div className="relative mt-2 shrink-0 border-b border-border-default px-2 sm:mt-3 sm:px-3 lg:px-4">
            <div
              role="tablist"
              aria-label={browseCategories.searchResultsTabsAria}
              className="flex shrink-0 gap-8 pr-11 sm:pr-12"
            >
              <button
                type="button"
                role="tab"
                aria-selected={searchTab === "top"}
                className={cx(
                  "relative shrink-0 pb-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2",
                  searchTab === "top"
                    ? "text-text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-text-primary"
                    : "text-text-secondary hover:text-text-primary",
                )}
                onClick={() => goTab("top")}
              >
                {browseCategories.searchTabTop}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={searchTab === "users"}
                className={cx(
                  "relative shrink-0 pb-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2",
                  searchTab === "users"
                    ? "text-text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-text-primary"
                    : "text-text-secondary hover:text-text-primary",
                )}
                onClick={() => goTab("users")}
              >
                {browseCategories.searchTabUsers}
              </button>
            </div>
            <button
              type="button"
              onClick={closeSearchAndGoBack}
              className="absolute inset-y-0 right-2 flex items-center rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 sm:right-3 lg:right-4"
              aria-label={browseCategories.searchCloseReturnAria}
            >
              <X className="size-5" strokeWidth={2.25} aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-4 sm:px-3 lg:px-4">
            {query.isPending && searchTab === "top" ? (
              <SearchTopResultsSkeleton loadingLabel={browseCategories.searchLoading} />
            ) : null}
            {query.isPending && searchTab === "users" ? (
              <SearchUsersResultsSkeleton loadingLabel={browseCategories.searchLoading} />
            ) : null}
            {query.isError ? (
              <p className="text-sm text-text-secondary">{browseCategories.searchError}</p>
            ) : null}

            {query.isSuccess && searchTab === "top" && clips.length === 0 ? (
              <p className="text-sm text-text-secondary">{browseCategories.searchEmptyTop}</p>
            ) : null}
            {query.isSuccess && searchTab === "users" && users.length === 0 ? (
              <p className="text-sm text-text-secondary">{browseCategories.searchEmptyUsers}</p>
            ) : null}

            {query.isSuccess && searchTab === "top" && clips.length > 0 ? (
              <section aria-label={browseCategories.searchTabTop} className="min-h-0">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {clips.map((clip) => (
                    <SearchVideoTile key={clip.id} clip={clip} />
                  ))}
                </div>
              </section>
            ) : null}

            {query.isSuccess && searchTab === "users" && users.length > 0 ? (
              <section aria-label={browseCategories.searchTabUsers} className="min-h-0 divide-y divide-border-default">
                {users.map((u) => (
                  <SearchUserRow key={u.id} user={u} />
                ))}
              </section>
            ) : null}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <FeedExplorerShell
        expandMainToFullWidth
        leftSearch={renderLeftSearch}
        filterPanel={filterPanel}
        center={center}
      />
      <FeedSearchSidebar
        open={searchOverlayOpen}
        onClose={() => setSearchOverlayOpen(false)}
        query={draft}
        onQueryChange={setDraft}
        onSubmitFullSearch={submitSearchQuery}
        labels={searchSidebarLabels}
        searchPlaceholder={browseCategories.searchPlaceholder}
      />
    </>
  );
}
/** ################################ /COMPONENT ############################# */
