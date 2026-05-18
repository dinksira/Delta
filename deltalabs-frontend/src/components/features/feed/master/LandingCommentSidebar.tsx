"use client";

import { createPortal } from "react-dom";

import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";

import { FeedCommentPanel } from "./FeedCommentPanel";

export type LandingCommentSidebarProps = Readonly<{
  open: boolean;
  clip: LandingVideoClip | undefined;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onCommentCreated: (clipId: string, nextCount: number) => void;
  onClose: () => void;
}>;

/** Comment column on `document.body` so it is not clipped by feed layout; `top-16` matches `TopNav` `h-16`. */
export function LandingCommentSidebar({
  open,
  clip,
  isAuthenticated,
  onRequireAuth,
  onCommentCreated,
  onClose,
}: LandingCommentSidebarProps) {
  if (typeof document === "undefined" || !open || !clip) {
    return null;
  }

  return createPortal(
    <aside
      className="fixed right-0 top-16 z-40 flex h-[calc(100dvh-4rem)] w-full max-w-[var(--dl-layout-feed-comment-sheet-max)] min-w-0 flex-col border-l border-border-default bg-surface-default shadow-sm"
      aria-label="Comments"
    >
      <FeedCommentPanel
        clip={clip}
        isAuthenticated={isAuthenticated}
        onRequireAuth={onRequireAuth}
        onCommentCreated={onCommentCreated}
        onClose={onClose}
      />
    </aside>,
    document.body,
  );
}
