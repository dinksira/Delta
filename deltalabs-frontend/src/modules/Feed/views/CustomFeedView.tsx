"use client";

/** ################################ IMPORT ############################# */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CircleAlert, VideoOff } from "lucide-react";

import {
  CustomFeedFilterModal,
  CustomFeedSetupModal,
  FeedSearchInput,
  FeedSearchSidebar,
  FeedSnapScrollControls,
  FeedStatePanel,
} from "@/components/features/feed";
import { Button, ButtonLink, Typography } from "@/components/theme";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { useFeedMessages } from "@/i18n/LocaleContext";
import { useCustomFeedTab, useUpdateCustomFeedTab } from "@/modules/Feed/hooks/useCustomFeedTab";
import { useFeedClips } from "@/modules/Feed/hooks/useFeedQueries";
import {
  EMPTY_FEED_SELECTION,
  feedCustomTabFiltersToSelection,
  feedSelectionHasActiveFilters,
  feedSelectionToCustomTabFilters,
  normalizeFeedQuerySelection,
  type FeedClipFilterSelection,
} from "@/modules/Feed/types/feedClipFilters";
import { FeedExplorerShell, type FeedSearchRailContext } from "@/modules/Feed/views/FeedExplorerShell";
import { FeedSnapScrollColumn } from "@/modules/Feed/views/FeedSnapScrollColumn";
import { SearchTopResultsSkeleton, SearchVideoTile } from "@/modules/Search/views/SearchResultsView";
import { selectCommentPanelOpen, setCommentPanelOpen, useAppDispatch, useAppSelector } from "@/store";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
export function CustomFeedView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { browseCategories, customTab: customCopy } = useFeedMessages();
  const { isAuthenticated, isReady } = useAuthSession();
  const dispatch = useAppDispatch();
  const commentPanelOpen = useAppSelector(selectCommentPanelOpen);
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const [viewerClipId, setViewerClipId] = useState<string | null>(null);

  const {
    data: savedTab,
    isPending: tabPending,
    isError: tabError,
    refetch: refetchTab,
  } = useCustomFeedTab();
  const updateTab = useUpdateCustomFeedTab();

  const isConfigured = savedTab != null;
  const feedSelection = useMemo(
    () =>
      savedTab
        ? normalizeFeedQuerySelection(feedCustomTabFiltersToSelection(savedTab.filters))
        : EMPTY_FEED_SELECTION,
    [savedTab],
  );

  const {
    data: clipsData,
    isPending: clipsPending,
    isError: clipsError,
    refetch: refetchClips,
  } = useFeedClips(feedSelection, {
    contentTypeWhenFilterUnset: null,
    enabled: isConfigured && isAuthenticated && isReady,
  });

  const clips = isConfigured ? (clipsData ?? []) : [];

  const [setupLabel, setSetupLabel] = useState("");
  const [setupFilters, setSetupFilters] = useState<FeedClipFilterSelection>(EMPTY_FEED_SELECTION);
  const [filterValidationError, setFilterValidationError] = useState<string | null>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");

  useEffect(() => {
    if (!savedTab) return;
    setSetupLabel(savedTab.label);
    setSetupFilters(feedCustomTabFiltersToSelection(savedTab.filters));
  }, [savedTab]);

  useEffect(() => {
    if (!isReady || !isAuthenticated || tabPending || tabError) return;
    if (!isConfigured) {
      setSetupModalOpen(true);
    }
  }, [isAuthenticated, isConfigured, isReady, tabError, tabPending]);

  const loginHref = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("auth", "login");
    return `${pathname}?${next.toString()}`;
  }, [pathname, searchParams]);

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

  const persistCustomTab = useCallback(async () => {
    const normalized = normalizeFeedQuerySelection(setupFilters);
    if (!feedSelectionHasActiveFilters(normalized)) {
      setFilterValidationError(customCopy.filtersRequired);
      return;
    }
    setFilterValidationError(null);
    const trimmedLabel = setupLabel.trim() || browseCategories.customTabDefault;
    await updateTab.mutateAsync({
      label: trimmedLabel,
      filters: feedSelectionToCustomTabFilters(normalized),
    });
    setSetupModalOpen(false);
    setFilterModalOpen(false);
  }, [browseCategories.customTabDefault, customCopy.filtersRequired, setupFilters, setupLabel, updateTab]);

  const openSetup = useCallback(() => {
    setFilterValidationError(null);
    setSetupModalOpen(true);
  }, []);

  const openClipViewer = useCallback((clipId: string) => {
    setViewerClipId(clipId);
  }, []);

  const closeClipViewer = useCallback(() => {
    setViewerClipId(null);
    dispatch(setCommentPanelOpen(false));
  }, [dispatch]);

  const renderLeftSearch = useCallback(
    (ctx: FeedSearchRailContext) => (
      <div className="w-full max-w-full">
        <FeedSearchInput
          id={ctx.searchInputId}
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

  const center = useMemo(() => {
    if (!isReady) {
      return <SearchTopResultsSkeleton loadingLabel={browseCategories.searchLoading} />;
    }

    if (!isAuthenticated) {
      return (
        <div className="mx-auto flex max-w-lg flex-col gap-3 px-2 py-8 text-center sm:px-4">
          <Typography variant="h2" as="h1">
            {customCopy.guestTitle}
          </Typography>
          <Typography variant="body" className="text-text-secondary">
            {customCopy.guestDescription}
          </Typography>
          <div className="flex justify-center pt-2">
            <ButtonLink href={loginHref} size="md">
              {customCopy.signInButton}
            </ButtonLink>
          </div>
        </div>
      );
    }

    if (tabPending) {
      return <SearchTopResultsSkeleton loadingLabel={browseCategories.searchLoading} />;
    }

    if (tabError) {
      return (
        <div className="space-y-2 px-2 py-8">
          <p className="text-sm text-text-secondary">{customCopy.loadError}</p>
          <button
            type="button"
            className="text-sm font-medium text-primary-600 hover:underline"
            onClick={() => void refetchTab()}
          >
            {customCopy.retry}
          </button>
        </div>
      );
    }

    if (!isConfigured) {
      return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-2 py-12 text-center sm:px-4">
          <Typography variant="h2" as="h1">
            {browseCategories.customTabDefault}
          </Typography>
          <Typography variant="body" className="text-text-secondary">
            {customCopy.configurePrompt}
          </Typography>
          <Button type="button" size="md" onClick={openSetup}>
            {customCopy.configureButton}
          </Button>
        </div>
      );
    }

    if (clipsPending) {
      return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-2 py-4 sm:px-3 lg:px-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Typography variant="h2" as="h1">
              {savedTab.label}
            </Typography>
            <div className="h-9 w-24 animate-pulse rounded-lg bg-surface-muted" aria-hidden />
          </div>
          <section className="min-h-0 flex-1">
            <SearchTopResultsSkeleton loadingLabel={browseCategories.searchLoading} />
          </section>
        </div>
      );
    }
    if (clipsError) {
      return (
        <FeedStatePanel
          icon={CircleAlert}
          title={browseCategories.searchError}
          message={customCopy.loadError}
          actionLabel={customCopy.retry}
          onAction={() => void refetchClips()}
        />
      );
    }
    if (clips.length === 0) {
      return (
        <FeedStatePanel
          icon={VideoOff}
          title={customCopy.emptyTitle}
          message={customCopy.emptyDescription}
          actionLabel={customCopy.editButton}
          onAction={openSetup}
        />
      );
    }

    if (viewerClipId) {
      return (
        <FeedSnapScrollColumn
          key={viewerClipId}
          clips={clips}
          initialClipId={viewerClipId}
          scrollContainerRef={feedScrollRef}
          feedAriaLabel={savedTab.label}
          toolbar={
            <div className="pointer-events-auto flex w-full items-center gap-2">
              <button
                type="button"
                onClick={closeClipViewer}
                aria-label={customCopy.backToGridAria}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-white ring-1 ring-white/25 transition-colors hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <ArrowLeft className="size-5" strokeWidth={2.25} aria-hidden />
              </button>
              <Typography
                variant="label"
                as="span"
                className="min-w-0 flex-1 truncate text-center font-semibold text-white drop-shadow"
              >
                {savedTab.label}
              </Typography>
              <Button type="button" variant="secondary" size="sm" onClick={openSetup}>
                {customCopy.editButton}
              </Button>
            </div>
          }
        />
      );
    }

    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-2 py-4 sm:px-3 lg:px-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Typography variant="h2" as="h1">
            {savedTab.label}
          </Typography>
          <Button type="button" variant="secondary" size="sm" onClick={openSetup}>
            {customCopy.editButton}
          </Button>
        </div>
        <section className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {clips.map((clip) => (
              <SearchVideoTile key={clip.id} clip={clip} onSelect={() => openClipViewer(clip.id)} />
            ))}
          </div>
        </section>
      </div>
    );
  }, [
    browseCategories,
    clips,
    clipsError,
    clipsPending,
    closeClipViewer,
    customCopy,
    feedScrollRef,
    isAuthenticated,
    isConfigured,
    isReady,
    loginHref,
    openClipViewer,
    openSetup,
    refetchClips,
    refetchTab,
    savedTab,
    tabError,
    tabPending,
    viewerClipId,
  ]);

  const showSnapControls =
    Boolean(viewerClipId) &&
    isConfigured &&
    isAuthenticated &&
    isReady &&
    !clipsPending &&
    !clipsError &&
    clips.length > 0;

  return (
    <>
      <FeedExplorerShell
        expandMainToFullWidth
        leftSearch={renderLeftSearch}
        filterPanel={() => null}
        center={center}
        afterGrid={
          showSnapControls ? (
            <FeedSnapScrollControls
              scrollContainerRef={feedScrollRef}
              commentSidebarOpen={commentPanelOpen}
            />
          ) : undefined
        }
      />

      <CustomFeedSetupModal
        open={setupModalOpen && isAuthenticated}
        label={setupLabel}
        filters={setupFilters}
        browse={browseCategories}
        copy={customCopy}
        saving={updateTab.isPending}
        validationError={filterValidationError}
        onLabelChange={setSetupLabel}
        onOpenFilters={() => setFilterModalOpen(true)}
        onSave={() => void persistCustomTab()}
        onClose={() => {
          setSetupModalOpen(false);
          setFilterValidationError(null);
        }}
      />

      <CustomFeedFilterModal
        open={filterModalOpen && isAuthenticated}
        appliedSelection={setupFilters}
        browse={browseCategories}
        copy={customCopy}
        onApply={setSetupFilters}
        onClose={() => setFilterModalOpen(false)}
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
