import type { ReactNode } from "react";

import { FeedCard } from "@/components/features/feed/FeedCard";
import { FeedMedia } from "@/components/features/feed/FeedMedia";
import { FeedOverlayGradient } from "@/components/features/feed/FeedOverlayGradient";

type FeedViewportProps = Readonly<{
  children: ReactNode;
  /** Selects placeholder gradient variant (e.g. per feed clip). */
  mediaTone?: number;
  videoSrc?: string;
  isActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}>;

export function FeedViewport({
  children,
  mediaTone = 0,
  videoSrc,
  isActive = false,
  isMuted = true,
  onToggleMute,
}: FeedViewportProps) {
  return (
    <FeedCard>
      <FeedMedia
        tone={mediaTone}
        videoSrc={videoSrc}
        isActive={isActive}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
      />
      <FeedOverlayGradient />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5 md:p-6">{children}</div>
    </FeedCard>
  );
}
