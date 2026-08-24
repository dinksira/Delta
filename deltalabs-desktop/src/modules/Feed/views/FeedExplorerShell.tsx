"use client";

/** ################################ IMPORT ############################# */
/** React and local dependencies for the shared feed explorer shell. */
import type { ReactNode } from "react";
import { useCallback, useId, useState } from "react";

import { FeedFilterPanel, FeedSearchInput } from "@/components/features/feed";
import { cx } from "@/components/features/feed/primitives";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Context for a custom filter block in the left rail (below search). */
export type FeedFilterPanelSlotContext = Readonly<{
  panelId: string;
  isOpen: boolean;
  onDismiss: () => void;
}>;
export type FeedSearchRailContext = Readonly<{
  searchInputId: string;
  filterPanelId: string;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
}>;

type FeedExplorerShellProps = Readonly<{
  /**
   * Custom left-rail search (same filter panel wiring). When omitted, the default `FeedSearchInput` is used.
   */
  leftSearch?: (ctx: FeedSearchRailContext) => ReactNode;
  /** Main column (e.g. feed scroll region or hub content). */
  center: ReactNode;
  /** Extra controls under the shared filter panel (nav links, category pills, …). */
  leftFooter?: ReactNode;
  /** Optional right column on large screens (matches third grid track on video landing). */
  rightAside?: ReactNode;
  /** Renders below the grid (e.g. `FeedSnapScrollControls`). */
  afterGrid?: ReactNode;
  /**
   * When set with no `rightAside`, large screens use two columns only so the main area
   * fills the rest of the viewport (no empty third track).
   */
  expandMainToFullWidth?: boolean;
  /** When set, replaces default `FeedFilterPanel` (e.g. landing chip rail). */
  filterPanel?: (ctx: FeedFilterPanelSlotContext) => ReactNode;
  /**
   * Optional controlled filter panel visibility (e.g. `/feed/filter?fp=1`).
   * When omitted, visibility is toggled only inside this shell.
   */
  filterOpenState?: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/**
 * Three-column shell shared by the video landing and module hub routes:
 * left `FeedSearchInput` + `FeedFilterPanel`, center content, optional right rail.
 */
export function FeedExplorerShell({
  leftSearch,
  center,
  leftFooter,
  rightAside,
  afterGrid,
  expandMainToFullWidth = false,
  filterPanel,
  filterOpenState,
}: FeedExplorerShellProps) {
  const [internalFilterOpen, setInternalFilterOpen] = useState(false);
  const uid = useId().replace(/:/g, "");
  const filterPanelId = `feed-explorer-filter-${uid}`;
  const searchInputId = `feed-search-${uid}`;

  const isFilterOpen = filterOpenState?.open ?? internalFilterOpen;
  const setFilterOpen = useCallback(
    (next: boolean) => {
      if (filterOpenState) {
        filterOpenState.onOpenChange(next);
      } else {
        setInternalFilterOpen(next);
      }
    },
    [filterOpenState],
  );

  const twoColumnMain = expandMainToFullWidth && !rightAside;

  const railCtx: FeedSearchRailContext = {
    searchInputId,
    filterPanelId,
    isFilterOpen,
    onFilterToggle: () => setFilterOpen(!isFilterOpen),
  };

  const panelCtx: FeedFilterPanelSlotContext = {
    panelId: filterPanelId,
    isOpen: isFilterOpen,
    onDismiss: () => setFilterOpen(false),
  };

  return (
    <section className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden px-2 sm:px-3 lg:px-4">
      <div
        className={cx(
          "grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden sm:gap-4 lg:grid-rows-[minmax(0,1fr)] lg:items-stretch lg:gap-4",
          twoColumnMain
            ? "lg:grid-cols-[minmax(var(--dl-layout-shell-rail-min),var(--dl-layout-shell-rail-max))_minmax(0,1fr)]"
            : "lg:grid-cols-[minmax(var(--dl-layout-shell-rail-min),var(--dl-layout-shell-rail-max))_auto_minmax(var(--dl-layout-shell-rail-min),var(--dl-layout-shell-rail-max))]",
        )}
      >
        <aside className="flex min-h-0 w-full max-w-none flex-col justify-self-stretch pt-2 sm:pt-3 lg:sticky lg:top-0 lg:z-10 lg:max-h-[min(100dvh,100svh)] lg:w-full lg:max-w-[var(--dl-layout-shell-rail-aside-cap)] lg:overflow-y-auto lg:self-start">
          {leftSearch ? (
            leftSearch(railCtx)
          ) : (
            <FeedSearchInput
              id={searchInputId}
              filterControlsId={filterPanelId}
              isFilterOpen={isFilterOpen}
              onFilterToggle={railCtx.onFilterToggle}
            />
          )}
          {filterPanel ? (
            filterPanel(panelCtx)
          ) : (
            <FeedFilterPanel id={filterPanelId} isOpen={isFilterOpen} />
          )}
          {leftFooter}
        </aside>

        <div
          className={cx(
            "flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden",
            twoColumnMain
              ? "lg:max-w-none lg:w-full lg:justify-self-stretch"
              : "lg:w-auto lg:justify-self-center",
          )}
        >
          {center}
        </div>

        {!twoColumnMain ? (
          <div
            className={
              rightAside
                ? "hidden min-w-0 pt-2 sm:pt-3 lg:sticky lg:top-0 lg:z-10 lg:block lg:w-full lg:max-w-[var(--dl-layout-shell-rail-aside-cap)] lg:justify-self-end lg:self-start"
                : "hidden min-w-0 lg:block lg:w-full lg:max-w-[var(--dl-layout-shell-rail-aside-cap)] lg:justify-self-end"
            }
            {...(rightAside ? {} : { "aria-hidden": true as const })}
          >
            {rightAside}
          </div>
        ) : null}
      </div>
      {afterGrid}
    </section>
  );
}
/** ################################ /COMPONENT ############################# */
