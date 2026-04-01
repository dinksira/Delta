import type { ReactNode } from "react";

import { FeedCard } from "@/components/features/feed/FeedCard";
import { FeedMedia } from "@/components/features/feed/FeedMedia";
import { FeedOverlayGradient } from "@/components/features/feed/FeedOverlayGradient";

type FeedViewportProps = Readonly<{
  children: ReactNode;
  /** Selects placeholder gradient variant (e.g. per feed clip). */
  mediaTone?: number;
}>;

export function FeedViewport({ children, mediaTone = 0 }: FeedViewportProps) {
  return (
    <FeedCard>
      <FeedMedia tone={mediaTone} />
      <FeedOverlayGradient />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white">{children}</div>
    </FeedCard>
  );
}
