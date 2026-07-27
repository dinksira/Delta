/** ################################ COMPONENT ############################# */
/**
 * EngagementPanel: Right-side panel with author info, engagement stats,
 * comment input, and comment list.
 */

import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
} from "lucide-react";
import { EngagementStat } from "../atoms/EngagementStat";
import { CommentItem, type CommentData } from "../molecules/CommentItem";
import { Button, Textarea } from "@/components/theme";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EngagementPanelProps {
  /** Course provider/university name */
  providerName: string;
  /** Course subtitle or ranking info */
  subtitle: string;
  /** Hashtags array */
  hashtags: readonly string[];
  /** Number of likes */
  likeCount: string;
  /** Number of comments */
  commentCount: string;
  /** Number of shares */
  shareCount: string;
  /** Comments data */
  comments: readonly CommentData[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export const EngagementPanel: React.FC<Readonly<EngagementPanelProps>> = ({
  providerName,
  subtitle,
  hashtags,
  likeCount,
  commentCount,
  shareCount,
  comments,
}) => {
  const [commentText, setCommentText] = useState("");

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between">
        <Button variant="primary" size="sm" className="gap-1.5">
          <Send className="w-3.5 h-3.5" />
          Post
        </Button>
        <button
          type="button"
          className="text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors cursor-pointer"
        >
          Go to roadmap →
        </button>
      </div>

      {/* Author Card */}
      <div className="bg-surface-default border border-border-default rounded-xl p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary truncate">
                  {providerName}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {subtitle}
                </p>
              </div>
              <button
                type="button"
                className="px-3 py-1 text-xs font-semibold text-primary-600 border border-primary-300 rounded-full
                  hover:bg-primary-50 transition-colors cursor-pointer flex-shrink-0"
              >
                Follow
              </button>
            </div>
            {/* Hashtags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-primary-500 font-medium cursor-pointer hover:text-primary-600 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-5">
          <EngagementStat
            icon={<Heart className="w-5 h-5 text-red-400" />}
            value={likeCount}
          />
          <EngagementStat
            icon={<MessageCircle className="w-5 h-5" />}
            value={commentCount}
          />
          <EngagementStat
            icon={<Share2 className="w-5 h-5" />}
            value={shareCount}
          />
        </div>
        <button
          type="button"
          className="text-xs text-text-tertiary hover:text-red-500 transition-colors cursor-pointer underline"
        >
          report
        </button>
      </div>

      {/* Comment Input */}
      <div className="bg-surface-default border border-border-default rounded-xl p-3">
        <Textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a Comment"
          className="min-h-[60px] text-sm resize-none border-none bg-transparent p-0 focus:ring-0"
        />
        <div className="flex justify-end mt-2">
          <Button
            variant="primary"
            size="sm"
            disabled={!commentText.trim()}
          >
            Post
          </Button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-text-primary px-1 mb-2">
          Comments
        </h3>
        <div className="flex flex-col gap-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      </div>
    </div>
  );
};

EngagementPanel.displayName = "EngagementPanel";
/** ################################ /COMPONENT ############################# */
