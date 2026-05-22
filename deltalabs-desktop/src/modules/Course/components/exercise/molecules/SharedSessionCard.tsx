/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** SharedSessionCard Molecule: Displays a collaborative exercise session. */
import React from "react";
import Image from "next/image";
import { Typography, Button } from "@/components/theme";
import { Clock, HelpCircle, ChevronRight } from "lucide-react";
import { cx } from "@/components/theme/utils";

export interface SharedSessionCardProps {
  title: string;
  subtitle: string;
  questionCount: number;
  duration: string;
  thumbnail: string;
  roleLabel: string; // e.g., "Invited by Leul" or "Owner"
  avatars: string[];
  onAction?: () => void;
  className?: string;
}

export const SharedSessionCard: React.FC<SharedSessionCardProps> = ({
  title,
  subtitle,
  questionCount,
  duration,
  thumbnail,
  roleLabel,
  avatars,
  onAction,
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
      <div className="flex-1 flex flex-col p-5 justify-between relative">
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

          {/* Stats Column */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[#4A7280]">
              <HelpCircle size={16} />
              <Typography className="text-[13px] font-bold">
                {questionCount} total questions
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

        {/* Status & Avatars (Positioned top-right-ish or bottom-right) */}
        <div className="absolute top-1/2 right-6 -translate-y-2 flex flex-col items-end gap-2">
          <Typography className="text-[13px] font-bold text-[#114B5F]">
            {roleLabel}
          </Typography>
          <div className="flex items-center">
            <div className="flex -space-x-3">
              {avatars.map((url, i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                  <Image src={url} alt="Friend" width={32} height={32} className="object-cover" />
                </div>
              ))}
            </div>
            <div className="h-8 w-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center -ml-2 z-10 shadow-sm">
               <ChevronRight size={14} className="text-[#114B5F]" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <Button 
            onClick={onAction}
            className="!bg-[#114B5F] !text-white rounded-lg px-6 h-9 text-xs font-bold border-none hover:brightness-110 transition-all w-fit"
          >
            Take Exercise
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharedSessionCard;
/** ################################ /COMPONENT ############################# */
