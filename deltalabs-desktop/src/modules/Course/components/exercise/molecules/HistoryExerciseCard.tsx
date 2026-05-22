/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** HistoryExerciseCard Molecule: Horizontal card for history lists. */
import React from "react";
import Image from "next/image";
import { Typography, Button } from "@/components/theme";
import { cx } from "@/components/theme/utils";

export interface HistoryExerciseCardProps {
  title: string;
  description: string;
  difficulty: string; // e.g., "Easy"
  type: string; // e.g., "Multiple Choice"
  duration: string; // e.g., "30 mins"
  attempts: string; // e.g., "300+ attempts"
  userName: string;
  userAvatar: string;
  timeAgo: string;
  actionLabel: string; // "Go to Exercise" or "Resume Exercise"
  onAction?: () => void;
  className?: string;
}

export const HistoryExerciseCard: React.FC<HistoryExerciseCardProps> = ({
  title,
  description,
  difficulty,
  type,
  duration,
  attempts,
  userName,
  userAvatar,
  timeAgo,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cx("flex flex-col md:flex-row items-start md:items-center justify-between py-6 border-b border-[#E2E8F0]/60 gap-6 group", className)}>
      <div className="flex-1 space-y-3">
        {/* Title */}
        <Typography className="text-[18px] font-black text-[#114B5F] leading-tight group-hover:text-[#114B5F]/80 transition-colors">
          {title}
        </Typography>

        {/* Description */}
        <Typography className="text-[12px] text-[#64748B] line-clamp-2 max-w-2xl leading-relaxed">
          {description}
        </Typography>

        {/* Badges & Meta */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="px-3 py-1 rounded-md bg-[#81C784]/40 text-[#2E7D32] text-[11px] font-bold">
            {difficulty}
          </div>
          <div className="px-3 py-1 rounded-md bg-[#4A7280]/20 text-[#114B5F] text-[11px] font-bold">
            {type}
          </div>
          <div className="px-3 py-1 rounded-md bg-[#4A7280]/20 text-[#114B5F] text-[11px] font-bold">
            {duration}
          </div>
          <Typography className="text-[12px] font-bold text-[#64748B] ml-2">
            {attempts}
          </Typography>

          {/* User Info */}
          <div className="flex items-center gap-2 ml-4">
            <div className="h-6 w-6 rounded-full overflow-hidden bg-slate-200">
              <Image src={userAvatar} alt={userName} width={24} height={24} className="object-cover" />
            </div>
            <Typography className="text-[12px] font-bold text-[#114B5F]">
              {userName}
            </Typography>
            <Typography className="text-[12px] text-[#94A3B8]">
              {timeAgo}
            </Typography>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button 
        onClick={onAction}
        className="!bg-[#114B5F] !text-white rounded-lg px-8 h-12 text-[14px] font-bold border-none shadow-sm hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
      >
        {actionLabel}
      </Button>
    </div>
  );
};

export default HistoryExerciseCard;
/** ################################ /COMPONENT ############################# */
