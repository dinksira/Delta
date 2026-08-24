/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ReactNode } from "react";

import { FeedCard } from "../FeedCard";
import { FeedOverlayGradient } from "../FeedOverlayGradient";
import { FeedMedia } from "./FeedMedia";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type FeedViewportProps = Readonly<{
  clipId?: string;
  children: ReactNode;
  /** Selects placeholder gradient variant (e.g. per feed clip). */
  mediaTone?: number;
  videoSrc?: string;
  isActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onFeedEvent?: (event: "view_start" | "view_complete" | "skip" | "hide", payload?: {
    watchMs?: number;
    positionMs?: number;
  }) => void;
  preloadStrategy?: "auto" | "metadata" | "none";
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function FeedViewport({
  clipId,
  children,
  mediaTone = 0,
  videoSrc,
  isActive = false,
  isMuted = true,
  onToggleMute,
  onFeedEvent,
  preloadStrategy = "metadata",
}: FeedViewportProps) {
  return (
    <FeedCard>
      <FeedMedia
        tone={mediaTone}
        videoSrc={videoSrc}
        isActive={isActive}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        clipId={clipId}
        onFeedEvent={onFeedEvent}
        preloadStrategy={preloadStrategy}
      />
      <FeedOverlayGradient />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5 md:p-6">{children}</div>
    </FeedCard>
  );
}
/** ################################ /COMPONENT ############################# */
