"use client";

/** ################################ IMPORT ############################# */
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FeedClipFilterPanel, FeedSearchInput, FeedSearchSidebar } from "@/components/features/feed";
import { Typography } from "@/components/theme";
import { cx } from "@/components/theme/utils";
import { feedItemDetailPath } from "@/lib/feedItemRoutes";
import { useFeedMessages } from "@/i18n/LocaleContext";
import { useFeedClips } from "@/modules/Feed/hooks/useFeedQueries";
import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
import {
  appendFeedFilterPanelOpenQuery,
  feedClipFiltersToUrlQueryString,
  type FeedClipFilterSelection,
} from "@/modules/Feed/types/feedClipFilters";
import {
  FeedExplorerShell,
  type FeedFilterPanelSlotContext,
  type FeedSearchRailContext,
} from "@/modules/Feed/views/FeedExplorerShell";
import { SearchTopResultsSkeleton } from "@/modules/Search/views/SearchResultsView";

/** ################################ /IMPORT ############################# */

/** ################################ CONSTANTS ############################# */
const AUDIO_CARD_GRADIENTS = [
  "from-slate-600 via-slate-700 to-slate-900",
  "from-primary-600 via-primary-800 to-slate-900",
  "from-emerald-600 via-teal-800 to-slate-900",
  "from-violet-600 via-indigo-800 to-slate-900",
  "from-amber-600 via-orange-800 to-slate-900",
  "from-rose-600 via-pink-900 to-slate-950",
] as const;

const hubScrollClass =
  "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain py-2 sm:py-3";

/** ################################ /CONSTANTS ############################# */

/** ################################ SUBCOMPONENTS ############################# */
function AudioEpisodeCard({ clip }: Readonly<{ clip: LandingVideoClip }>) {
  const href = feedItemDetailPath(clip) ?? "#";
  const grad = AUDIO_CARD_GRADIENTS[Math.abs(clip.mediaTone) % AUDIO_CARD_GRADIENTS.length];
  const subtitle = clip.hashtags.slice(0, 2).join(" · ");

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-border-default bg-surface-default shadow-sm transition-colors hover:border-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
    >
      <div className={cx("relative aspect-square w-full bg-gradient-to-br", grad)} aria-hidden>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-wide text-white/90">
          Audio
        </span>
      </div>
      <div className="space-y-1 p-3">
        <Typography as="h3" variant="label" className="line-clamp-2 font-semibold text-text-primary">
          {clip.caption}
        </Typography>
        {subtitle ? (
          <Typography variant="small" className="line-clamp-1 text-text-secondary">
            {subtitle}
          </Typography>
        ) : null}
      </div>
    </Link>
  );
}

/** ################################ /SUBCOMPONENTS ############################# */

/** ################################ COMPONENT ############################# */
type AudioExplorerVariant = "home" | "library";

/**
 * Spotify-style audio hub: real `/v1/feed?content_type=audio` data, search + filter wired like other explorer surfaces.
 */
export function AudioExplorerView({ variant }: Readonly<{ variant: AudioExplorerVariant }>) {
  const router = useRouter();
  const browseCategories = useFeedMessages().browseCategories;

  const audioSelection = useMemo<FeedClipFilterSelection>(() => ({ modality: "audio" }), []);
  const {
    data: clipsData,
    isPending,
    isError,
    refetch,
  } = useFeedClips(audioSelection);

  const clips = clipsData ?? [];

  const byTopic = useMemo(() => {
    const map = new Map<string, LandingVideoClip[]>();
    for (const clip of clips) {
      for (const raw of clip.hashtags) {
        const tag = raw.trim();
        if (!tag) continue;
        if (!map.has(tag)) map.set(tag, []);
        const bucket = map.get(tag)!;
        if (!bucket.some((c) => c.id === clip.id)) bucket.push(clip);
      }
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8);
  }, [clips]);

  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");

  const submitSearchQuery = useCallback(
    (raw: string) => {
      const next = raw.trim();
      if (!next) return;
      setSearchOverlayOpen(false);
      router.push(`/search?q=${encodeURIComponent(next)}&tab=top`);
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
    (ctx: FeedSearchRailContext) => (
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
              submitSearchQuery(searchDraft);
            }
          }}
        />
      </div>
    ),
    [browseCategories, searchDraft, submitSearchQuery],
  );

  const filterPanel = useCallback(
    (ctx: FeedFilterPanelSlotContext) => (
      <FeedClipFilterPanel
        id={ctx.panelId}
        open={ctx.isOpen}
        appliedSelection={audioSelection}
        onDismiss={ctx.onDismiss}
        onApply={(next) => {
          const qs = feedClipFiltersToUrlQueryString(next);
          router.push(`/feed/filter?${appendFeedFilterPanelOpenQuery(qs, true)}`);
        }}
      />
    ),
    [audioSelection, router],
  );

  const center = (
    <div className={hubScrollClass}>
      <div className="min-w-0 w-full space-y-10 px-1 pb-10 sm:px-2">
        <header className="space-y-1">
          <Typography as="h1" variant="h2" className="text-2xl font-bold text-text-primary sm:text-3xl">
            {variant === "library" ? "Your Library" : "Audio"}
          </Typography>
          <Typography as="p" variant="body" className="text-sm text-text-secondary">
            {variant === "library"
              ? "Public catalog episodes (saved listens will use your account later)."
              : "Stream research audio and lab sessions from the public feed."}
          </Typography>
        </header>

        {isPending ? <SearchTopResultsSkeleton loadingLabel={browseCategories.searchLoading} /> : null}
        {isError ? (
          <div className="space-y-2">
            <Typography as="p" variant="body" className="text-sm text-text-secondary">
              {browseCategories.searchError}
            </Typography>
            <button
              type="button"
              className="text-sm font-medium text-primary-600 hover:underline"
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {!isPending && !isError && clips.length === 0 ? (
          <Typography as="p" variant="body" className="text-sm text-text-secondary">
            No audio items yet. Run the backend seed script and add files under{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">public/mock-feed-audio/</code> (see README
            there).
          </Typography>
        ) : null}

        {!isPending && !isError && clips.length > 0 ? (
          <section aria-labelledby="audio-latest-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Typography as="h2" variant="h2" id="audio-latest-heading" className="text-xl font-semibold sm:text-2xl">
                New on Delta Labs
              </Typography>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {clips.map((clip) => (
                <AudioEpisodeCard key={clip.id} clip={clip} />
              ))}
            </div>
          </section>
        ) : null}

        {!isPending && !isError && byTopic.length > 0 ? (
          <div className="space-y-10">
            {byTopic.map(([topic, rows]) => (
              <section key={topic} aria-labelledby={`audio-topic-${topic}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <Typography
                    as="h2"
                    variant="h2"
                    id={`audio-topic-${topic}`}
                    className="text-xl font-semibold text-text-primary sm:text-2xl"
                  >
                    {topic}
                  </Typography>
                  <Link
                    href={`/search?q=${encodeURIComponent(topic)}&tab=top`}
                    className="shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Open in search
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {rows.map((clip) => (
                    <AudioEpisodeCard key={`${topic}-${clip.id}`} clip={clip} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </div>
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
        query={searchDraft}
        onQueryChange={setSearchDraft}
        onSubmitFullSearch={submitSearchQuery}
        labels={searchSidebarLabels}
        searchPlaceholder={browseCategories.searchPlaceholder}
      />
    </>
  );
}
/** ################################ /COMPONENT ############################# */
