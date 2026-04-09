"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useEffect } from "react";
import { useState } from "react";
import { Heart, Send, X } from "lucide-react";

import { Button, Textarea, Typography } from "@/components/theme";
import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";
import { useFeedCommentMutation, useFeedComments } from "@/modules/Feed/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { feedQueryKeys } from "@/modules/Feed/hooks/feedQueryKeys";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type FeedCommentPanelProps = Readonly<{
  clip: LandingVideoClip;
  isAuthenticated: boolean;
  onRequireAuth?: () => void;
  onCommentCreated?: (clipId: string, nextCount: number) => void;
  onClose: () => void;
}>;

type FeedCommentPreview = Readonly<{
  id: string;
  initials: string;
  name: string;
  text: string;
  time: string;
  likes: string;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Comment sidebar: header, thread (mock), and composer. Replace mock data via Feed hooks/api when wired. */
export function FeedCommentPanel({
  clip,
  isAuthenticated,
  onRequireAuth,
  onCommentCreated,
  onClose,
}: FeedCommentPanelProps) {
  const queryClient = useQueryClient();
  const { data: comments } = useFeedComments(clip.id);
  const { mutateAsync: submitComment, isPending: isSubmitting } = useFeedCommentMutation();
  const [draft, setDraft] = useState("");
  const commentList = (comments ?? []) as readonly FeedCommentPreview[];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticComment: FeedCommentPreview = {
      id: optimisticId,
      initials: "YO",
      name: "You",
      text: body,
      time: "now",
      likes: "0",
    };
    const previousComments = queryClient.getQueryData<readonly FeedCommentPreview[]>(
      feedQueryKeys.comments(clip.id),
    ) ?? [];
    const optimisticComments = [optimisticComment, ...previousComments];
    setDraft("");
    queryClient.setQueryData(feedQueryKeys.comments(clip.id), optimisticComments);
    onCommentCreated?.(clip.id, optimisticComments.length);
    try {
      const result = await submitComment({ itemId: clip.id, body });
      onCommentCreated?.(clip.id, result.count);
      await queryClient.invalidateQueries({ queryKey: feedQueryKeys.comments(clip.id) });
    } catch {
      // Keep the draft when request fails (auth/session/network) so user can retry.
      setDraft(body);
      queryClient.setQueryData(feedQueryKeys.comments(clip.id), previousComments);
      onCommentCreated?.(clip.id, previousComments.length);
    }
  };

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
        {isAuthenticated ? (
          <>
            <label className="sr-only" htmlFor={`feed-comment-draft-${clip.id}`}>
              Add comment
            </label>
            <div className="flex items-end gap-2">
              <Textarea
                id={`feed-comment-draft-${clip.id}`}
                rows={1}
                placeholder="Add comment…"
                className="min-h-10 min-w-0 flex-1 resize-none rounded-xl bg-surface-muted"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="size-10 shrink-0 rounded-full p-0"
                aria-label="Send comment"
                disabled={isSubmitting || draft.trim().length === 0}
                onClick={handleSend}
                title="Send comment"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onRequireAuth}
            className="h-12 w-full rounded-full text-base font-semibold"
          >
            Log in to comment
          </Button>
        )}
      </div>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
