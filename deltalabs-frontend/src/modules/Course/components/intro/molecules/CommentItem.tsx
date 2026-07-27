/** ################################ COMPONENT ############################# */
/**
 * CommentItem: A single comment with avatar, text, engagement, and reply support.
 * Supports nested replies via recursive rendering.
 */

import React, { useState } from "react";
import { Heart, MessageCircle, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { cx } from "@/components/theme/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CommentData {
  id: string;
  authorName: string;
  authorInitial: string;
  avatarColor: string;
  content: string;
  timestamp: string;
  likes: number;
  replies?: readonly CommentData[];
}

export interface CommentItemProps {
  /** Comment data to render */
  comment: CommentData;
  /** Nesting depth for visual indentation (max 2 levels) */
  depth?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CommentItem: React.FC<Readonly<CommentItemProps>> = ({
  comment,
  depth = 0,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const maxDepth = 2;

  return (
    <div className={cx("flex gap-3", depth > 0 ? "ml-10 mt-3" : "")}>
      {/* Avatar */}
      <div
        className={cx(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
          "text-white text-sm font-semibold"
        )}
        style={{ backgroundColor: comment.avatarColor }}
        aria-hidden="true"
      >
        {comment.authorInitial}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Author & Content */}
        <div className="bg-surface-muted rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-text-primary truncate">
              {comment.authorName}
            </span>
            <span className="text-xs text-text-tertiary flex-shrink-0">
              {comment.timestamp}
            </span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {comment.content}
          </p>
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-4 mt-1.5 px-2">
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-text-tertiary hover:text-red-500 transition-colors cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{comment.likes}</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 text-xs text-text-tertiary hover:text-primary-600 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 text-xs text-text-tertiary hover:text-primary-600 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Replies Toggle & Nested Replies */}
        {hasReplies && depth < maxDepth && (
          <>
            <button
              type="button"
              className="flex items-center gap-1 mt-2 px-2 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
              onClick={() => setShowReplies((prev) => !prev)}
            >
              {showReplies ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span>
                {showReplies
                  ? "Hide replies"
                  : `View ${comment.replies!.length} ${comment.replies!.length === 1 ? "reply" : "replies"}`}
              </span>
            </button>

            {showReplies && (
              <div className="mt-1">
                {comment.replies!.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

CommentItem.displayName = "CommentItem";
/** ################################ /COMPONENT ############################# */
