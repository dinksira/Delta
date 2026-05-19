/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** CommunityExerciseCard Molecule: Based on the high-fidelity mockup. */
import React from "react";
import Image from "next/image";
import { Typography, Button } from "@/components/theme";
import { Clock, Calendar } from "lucide-react";
import { cx } from "@/components/theme/utils";

export interface CommunityExerciseCardProps {
  title: string;
  subtitle: string;
  questionCount: number;
  duration: string;
  thumbnail: string;
  type: "test" | "exercise";
  onAction?: () => void;
  onTakeWithFriend?: () => void;
  className?: string;
}

export const CommunityExerciseCard: React.FC<CommunityExerciseCardProps> = ({
  title,
  subtitle,
  questionCount,
  duration,
  thumbnail,
  type,
  onAction,
  onTakeWithFriend,
  className,
}) => {
  return (
    <div 
      className={cx(
        "flex flex-col sm:flex-row h-auto sm:h-[180px] w-full rounded-[24px] bg-[#E2E8F0]/40 border border-white/40 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300",
        className
      )}
    >
      {/* Left: Thumbnail (40%) */}
      <div className="relative w-full sm:w-[40%] h-40 sm:h-full shrink-0 overflow-hidden">
        <Image 
          src={thumbnail} 
          alt={title} 
          fill 
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Right: Details (60%) */}
      <div className="flex-1 flex flex-col p-5 justify-between">
        <div className="space-y-3">
          {/* Title & Subtitle */}
          <div className="flex items-center gap-2">
            <Typography className="text-[17px] font-black text-[#114B5F] leading-tight">
              {title}
            </Typography>
            <div className="h-4 w-[1.5px] bg-[#114B5F]/30" />
            <Typography className="text-[12px] font-bold text-[#64748B]">
              {subtitle}
            </Typography>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[#4A7280]">
              <Typography className="text-[13px] font-bold">
                {questionCount} questions
              </Typography>
            </div>
            <div className="flex items-center gap-2 text-[#114B5F]">
              <Clock size={16} className="text-[#114B5F]" />
              <Typography className="text-[13px] font-bold">
                {duration} long
              </Typography>
            </div>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={onAction}
              className="!bg-[#114B5F] !text-white rounded-lg px-5 h-9 text-xs font-bold border-none hover:brightness-110 transition-all"
            >
              Take {type === "test" ? "Test" : "Exercise"}
            </Button>
            
            <button className="h-9 w-9 flex items-center justify-center rounded-lg bg-white border border-[#114B5F]/20 text-[#114B5F] hover:bg-[#114B5F]/5 transition-colors">
              <Calendar size={18} />
            </button>
          </div>

          <button 
            onClick={onTakeWithFriend}
            className="flex items-center gap-2 text-[11px] font-bold text-[#4A7280] hover:text-[#114B5F] transition-colors"
          >
            <span className="underline underline-offset-2">Take with friend</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityExerciseCard;
/** ################################ /COMPONENT ############################# */
