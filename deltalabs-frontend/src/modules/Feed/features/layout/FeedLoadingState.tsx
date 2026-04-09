"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { FeedCard } from "@/components/features/feed";
/** ################################ /IMPORT ############################# */

/** ################################ CONSTANTS ############################# */
/** Count of rail placeholders (matches `FeedActionRail` item slots on landing). */
const FEED_LOADING_RAIL_PLACEHOLDER_COUNT = 6;

/** Neutral grey gradient (matches `FeedCard` slate frame, no brand teal). */
const feedLoadingCardOverlayClass =
  "absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200/90 via-slate-400/50 to-slate-600/65 dark:from-slate-700/50 dark:via-slate-800/55 dark:to-slate-900/85";

/** Same grey family as the card overlay midpoint for the action placeholders. */
const feedLoadingRailPillClass =
  "inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-slate-400/45 dark:bg-slate-500/40";
/** ################################ /CONSTANTS ############################# */

/** ################################ COMPONENT ############################# */
/** Landing feed skeleton: same column widths as `LandingClipSlide`; card matches `FeedCard`. */
export function FeedLoadingState() {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div
        className="flex min-h-full w-full shrink-0 items-center justify-center py-2 sm:py-3 lg:py-4"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Loading videos</span>
        <div className="mx-auto flex w-full max-w-full flex-row items-end justify-center gap-1 px-1 sm:gap-1.5 sm:px-0">
          <div className="min-w-0 flex-1 basis-0 max-w-[380px] sm:w-[420px] sm:max-w-[420px] sm:flex-none sm:shrink-0 sm:basis-auto">
            <FeedCard>
              <div className={feedLoadingCardOverlayClass} aria-hidden />
            </FeedCard>
          </div>
          <aside
            className="pointer-events-none flex shrink-0 select-none flex-col items-center"
            aria-hidden="true"
          >
            <ul className="flex flex-col items-center gap-5">
              {Array.from({ length: FEED_LOADING_RAIL_PLACEHOLDER_COUNT }, (_, i) => (
                <li key={i} className="flex flex-col items-center gap-1.5">
                  <div className={feedLoadingRailPillClass} />
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
