"use client";

/**
 * Comment sidebar: header, thread (mock), and composer. Creator/caption/engagement stay on the video + rail.
 * Composes theme primitives (Button, Typography, Textarea). Replace mock data via Feed hooks/api when wired.
 */

import { useEffect } from "react";
import { Heart, Send, X } from "lucide-react";

import { Button, Textarea, Typography } from "@/components/theme";
import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
import { useFeedComments } from "@/modules/Feed/hooks";

type FeedCommentPanelProps = Readonly<{
  clip: LandingVideoClip;
  onClose: () => void;
}>;

export function FeedCommentPanel({ clip, onClose }: FeedCommentPanelProps) {
  const { data: comments } = useFeedComments(clip.id);
  const commentList = comments ?? [];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-default">
      <div className="flex shrink-0 items-center gap-2 border-b border-border-default px-3 py-3">
        <button
          type="button"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
          aria-label="Close comments"
          onClick={onClose}
        >
          <X className="size-5" />
        </button>
        <Typography as="span" variant="label" className="min-w-0 flex-1 truncate text-text-primary">
          Comments
        </Typography>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4">
        <div className="border-b border-border-default">
          <div className="flex gap-6" role="group" aria-label="Comment views">
            <button
              type="button"
              className="border-b-2 border-text-primary pb-2 text-sm font-semibold text-text-primary"
            >
              Comments ({commentList.length})
            </button>
            <button
              type="button"
              className="border-b-2 border-transparent pb-2 text-sm font-medium text-text-secondary"
            >
              Related research
            </button>
          </div>
        </div>

        <ul className="mt-4 space-y-4">
          {commentList.map((c) => (
            <li key={c.id} className="flex gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-text-primary">
                {c.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                  <Typography as="span" variant="label" className="text-sm text-text-primary">
                    {c.name}
                  </Typography>
                  <Typography as="span" variant="small" className="text-text-secondary">
                    {c.time}
                  </Typography>
                </div>
                <Typography as="p" variant="body" className="mt-0.5 text-sm text-text-primary">
                  {c.text}
                </Typography>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    className="text-xs font-medium text-text-secondary hover:text-text-primary"
                  >
                    Reply
                  </button>
                  <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                    <Heart className="size-3.5" aria-hidden />
                    {c.likes}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 border-t border-border-default bg-surface-default p-3">
        <label className="sr-only" htmlFor={`feed-comment-draft-${clip.id}`}>
          Add comment
        </label>
        <div className="flex items-end gap-2">
          <Textarea
            id={`feed-comment-draft-${clip.id}`}
            rows={1}
            placeholder="Add comment…"
            className="min-h-10 min-w-0 flex-1 resize-none rounded-xl bg-surface-muted"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="size-10 shrink-0 rounded-full p-0"
            aria-label="Send comment"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
