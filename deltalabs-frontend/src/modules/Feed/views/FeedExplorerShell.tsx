"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";

import { FeedFilterPanel, FeedSearchInput } from "@/components/features/feed";
import { cx } from "@/components/theme/utils";

type FeedExplorerShellProps = Readonly<{
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
}>;

/**
 * Three-column shell shared by the video landing and module hub routes:
 * left `FeedSearchInput` + `FeedFilterPanel`, center content, optional right rail.
 */
export function FeedExplorerShell({
  center,
  leftFooter,
  rightAside,
  afterGrid,
  expandMainToFullWidth = false,
}: FeedExplorerShellProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const uid = useId().replace(/:/g, "");
  const filterPanelId = `feed-explorer-filter-${uid}`;
  const searchInputId = `feed-search-${uid}`;

  const twoColumnMain = expandMainToFullWidth && !rightAside;

  return (
    <section className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden px-2 sm:px-3 lg:px-4">
      <div
        className={cx(
          "grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden sm:gap-4 lg:grid-rows-[minmax(0,1fr)] lg:items-stretch lg:gap-4",
          twoColumnMain
            ? "lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]"
            : "lg:grid-cols-[minmax(14rem,18rem)_auto_minmax(14rem,18rem)]",
        )}
      >
        <aside className="w-full max-w-none justify-self-stretch pt-2 sm:pt-3 lg:sticky lg:top-0 lg:z-10 lg:w-full lg:max-w-[280px] lg:self-start">
          <FeedSearchInput
            id={searchInputId}
            filterControlsId={filterPanelId}
            isFilterOpen={isFilterOpen}
            onFilterToggle={() => setIsFilterOpen((value) => !value)}
          />
          <FeedFilterPanel id={filterPanelId} isOpen={isFilterOpen} />
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
                ? "hidden min-w-0 pt-2 sm:pt-3 lg:sticky lg:top-0 lg:z-10 lg:block lg:w-full lg:max-w-[280px] lg:justify-self-end lg:self-start"
                : "hidden min-w-0 lg:block lg:w-full lg:max-w-[280px] lg:justify-self-end"
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
