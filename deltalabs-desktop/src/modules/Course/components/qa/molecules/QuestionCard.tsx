/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { 
  Bookmark, 
  Share2, 
  Pencil, 
  Trash2, 
  CheckSquare, 
  RotateCcw 
} from "lucide-react";
import { cx } from "@/components/theme/utils";
import { Typography } from "@/components/theme";
import { Badge } from "../atoms/Badge";
import { Avatar } from "../atoms/Avatar";
import type { QAQuestion } from "../../../data/qaMockData";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export interface QuestionCardProps {
  question: QAQuestion;
  showDelete?: boolean;
  isBookmarked?: boolean;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * QuestionCard Molecule
 * A detailed horizontal card representing a single question.
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question,
  showDelete = true,
  isBookmarked = false
}) => {
  const isClosed = question.status === "closed";

  return (
    <div className="flex items-start gap-4 py-6 border-b border-border-subtle group hover:bg-surface-secondary/30 transition-colors px-4 -mx-4 rounded-xl">
      {/* ZONE 1: Far Left Action Column */}
      <div className="flex flex-col gap-3 pt-1 shrink-0">
        <button className={cx(
          "transition-colors",
          isBookmarked ? "text-primary-600" : "text-text-tertiary hover:text-primary-600"
        )}>
          <Bookmark className={cx("h-4 w-4", isBookmarked && "fill-current")} />
        </button>
        <button className="text-text-tertiary hover:text-primary-600 transition-colors">
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* ZONE 2: Main Content Block */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {/* Title */}
        <Typography className="text-[17px] font-semibold text-text-primary leading-tight">
          {question.title}
        </Typography>

        {/* Description */}
        <Typography className="text-[13px] text-text-secondary line-clamp-2 leading-relaxed">
          {question.description}
        </Typography>

        {/* Tags + Meta */}
        <div className="flex items-center justify-between pt-2 gap-4">
          <div className="flex items-center gap-2 overflow-hidden">
            {question.isOpenEnded && (
              <Badge variant="teal">Open-ended</Badge>
            )}
            {question.tags.map((tag) => (
              <Badge key={tag} variant="filled" className="whitespace-nowrap">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Avatar initials={question.author.initials} size="xs" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-text-secondary">
                {question.author.name}
              </span>
              <span className="text-[10px] text-text-tertiary">
                • Asked {question.askedAt}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ZONE 3: Stats Column */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 w-20 px-2 border-x border-border-subtle/50">
        <div className="flex flex-col items-center justify-center h-11 w-14 rounded-lg bg-[#1E6F3E] text-white">
          <span className="text-[16px] font-bold leading-none">✓{question.answerCount}</span>
          <span className="text-[8px] font-black tracking-widest mt-0.5">ANSWER</span>
        </div>
        <div className="flex flex-col items-center -gap-0.5 pt-1">
          <span className="text-[13px] font-bold text-text-primary leading-none">
            {question.viewCount}
          </span>
          <span className="text-[10px] text-text-tertiary font-medium">views</span>
        </div>
      </div>

      {/* ZONE 4: Actions Column */}
      <div className="flex flex-col items-end gap-3 shrink-0 w-24">
        <button className="text-[11px] font-bold text-text-tertiary hover:text-primary-600 transition-colors uppercase tracking-tight">
          Follow Topic
        </button>

        <div className="flex items-center gap-3">
          <button className="text-text-tertiary hover:text-primary-600 transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
          {showDelete && (
            <button className="text-text-tertiary hover:text-red-500 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-auto">
          {isClosed ? (
            <button className="flex items-center gap-1.5 text-text-secondary hover:text-primary-600 transition-colors">
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold">Reopen question</span>
            </button>
          ) : (
            <button className="flex items-center gap-1.5 text-text-secondary hover:text-primary-600 transition-colors">
              <CheckSquare className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold">Close Question</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
