/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** SummaryCard Molecule: Detailed card for summary entries. */
import React from "react";
import { Typography } from "@/components/theme";
import { cx } from "@/components/theme/utils";

export interface SummaryCardProps {
  university: string;
  universityLogo?: string;
  title: string;
  description: string;
  isPublic?: boolean;
  badges: string[];
  readTime: string;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  university,
  universityLogo,
  title,
  description,
  isPublic,
  badges,
  readTime,
  className,
}) => {
  return (
    <div className={cx("group flex flex-col gap-4 py-8 border-b border-[#E2E8F0]/60", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden">
          {universityLogo ? (
            <img src={universityLogo} alt={university} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#FF5252]/20 border border-[#FF5252]/40 rounded-full" />
          )}
        </div>
        <Typography className="text-[12px] font-bold text-[#64748B]">
          {university}
        </Typography>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Typography className="text-[20px] font-black text-[#114B5F] group-hover:text-[#114B5F]/80 transition-colors">
          {title}
        </Typography>
        <Typography className="text-[14px] text-[#64748B] leading-relaxed line-clamp-3">
          {description}
        </Typography>
      </div>

      {/* Footer / Badges */}
      <div className="flex items-center gap-3 pt-2">
        {badges.map((badge, idx) => (
          <div key={idx} className="px-3 py-1 rounded-full bg-[#E2E8F0]/40 text-[#64748B] text-[11px] font-bold">
            {badge}
          </div>
        ))}
        {isPublic && (
          <div className="px-3 py-1 rounded-full bg-[#2E7D32] text-white text-[11px] font-bold">
            Public
          </div>
        )}
        <Typography className="text-[11px] font-bold text-[#94A3B8] ml-2">
          {readTime} read
        </Typography>
      </div>
    </div>
  );
};

export default SummaryCard;
/** ################################ /COMPONENT ############################# */
