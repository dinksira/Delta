"use client";

/** ################################ IMPORT ############################# */
import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FeedClipFilterPanel, FeedSearchInput, FeedSearchSidebar } from "@/components/features/feed";
import { useFeedMessages } from "@/i18n/LocaleContext";
import { useFeedClips } from "@/modules/Feed/hooks/useFeedQueries";
import {
  appendFeedFilterPanelOpenQuery,
  feedClipFiltersToUrlQueryString,
  FEED_FILTER_PANEL_OPEN_PARAM,
  normalizeFeedQuerySelection,
  parseFeedClipFiltersFromUrlSearchParams,
} from "@/modules/Feed/types/feedClipFilters";
import {
  FeedExplorerShell,
  type FeedFilterPanelSlotContext,
  type FeedSearchRailContext,
} from "@/modules/Feed/views/FeedExplorerShell";
import { SearchTopResultsSkeleton, SearchVideoTile } from "@/modules/Search/views/SearchResultsView";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/**
 * Standalone filtered clip grid: URL drives `GET /v1/feed` params; `fp=1` keeps the filter panel open
 * after Apply (same shell as search results).
 */
export function FilterResultsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const browseCategories = useFeedMessages().browseCategories;

  const selection = useMemo(
    () => normalizeFeedQuerySelection(parseFeedClipFiltersFromUrlSearchParams(searchParams)),
    [searchParams],
  );

  const filterPanelOpen = searchParams.get(FEED_FILTER_PANEL_OPEN_PARAM) === "1";

  const setFilterPanelOpen = useCallback(
    (open: boolean) => {
      const qs = appendFeedFilterPanelOpenQuery(searchParams.toString(), open);
      router.replace(`/feed/filter?${qs}`, { scroll: false });
    },
    [router, searchParams],
  );

  const {
    data: clipsData,
    isPending,
    isError,
    refetch,
  } = useFeedClips(selection);

  const clips = clipsData ?? [];

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
        appliedSelection={selection}
        onDismiss={ctx.onDismiss}
        onApply={(next) => {
          const qs = feedClipFiltersToUrlQueryString(next);
          router.replace(`/feed/filter?${appendFeedFilterPanelOpenQuery(qs, true)}`, { scroll: false });
        }}
      />
    ),
    [selection, router],
  );

  const center = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-2 py-4 sm:px-3 lg:px-4">
      {isPending ? <SearchTopResultsSkeleton loadingLabel={browseCategories.searchLoading} /> : null}
      {isError ? (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">{browseCategories.searchError}</p>
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
        <p className="text-sm text-text-secondary">{browseCategories.searchEmptyTop}</p>
      ) : null}
      {!isPending && !isError && clips.length > 0 ? (
        <section className="min-h-0">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {clips.map((clip) => (
              <SearchVideoTile key={clip.id} clip={clip} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );

  return (
    <>
      <FeedExplorerShell
        expandMainToFullWidth
        leftSearch={renderLeftSearch}
        filterPanel={filterPanel}
        filterOpenState={{ open: filterPanelOpen, onOpenChange: setFilterPanelOpen }}
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
