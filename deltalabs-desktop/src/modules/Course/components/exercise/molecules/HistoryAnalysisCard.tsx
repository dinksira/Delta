/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** HistoryAnalysisCard Molecule: Grid card for performance analysis. */
import React from "react";
import { Typography } from "@/components/theme";
import { cx } from "@/components/theme/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface HistoryAnalysisCardProps {
  title: string;
  performance: number; // 0 to 100
  attempts: number;
  correctPercentage: number;
  incorrectPercentage: number;
  difficulty: "Easy" | "Medium" | "Hard";
  className?: string;
}

export const HistoryAnalysisCard: React.FC<HistoryAnalysisCardProps> = ({
  title,
  performance,
  attempts,
  correctPercentage,
  incorrectPercentage,
  difficulty,
  className,
}) => {
  return (
    <div className={cx("relative p-8 rounded-[32px] bg-white border border-[#E2E8F0]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300", className)}>
      {/* Difficulty Badge (Top Right) */}
      <div className="absolute top-6 right-8 flex items-center gap-2">
        <Typography className="text-[12px] font-bold text-[#4A7280]">
          Difficulty
        </Typography>
        <div className={cx(
          "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-white",
          difficulty === "Hard" ? "bg-[#FF5252]" : difficulty === "Medium" ? "bg-[#FFAB40]" : "bg-[#66BB6A]"
        )}>
          {difficulty}
        </div>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <Typography className="text-[28px] font-black text-[#114B5F]">
            {title}
          </Typography>
          <Typography className="text-[18px] font-black text-[#111827]">
            Performance
          </Typography>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[6px] bg-[#E2E8F0] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#114B5F] rounded-full transition-all duration-1000" 
              style={{ width: `${performance}%` }}
            />
          </div>
          <Typography className="text-[18px] font-black text-[#111827]">
            {performance}%
          </Typography>
        </div>

        {/* Attempts */}
        <Typography className="text-[14px] font-bold text-[#64748B]">
          {attempts} attempts
        </Typography>

        {/* Stats Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E8F5E9] text-[#2E7D32]">
            <TrendingUp size={16} />
            <Typography className="text-[13px] font-black">
              Correct: {correctPercentage}%
            </Typography>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFEBEE] text-[#C62828]">
            <TrendingDown size={16} />
            <Typography className="text-[13px] font-black">
              Incorrect: {incorrectPercentage}%
            </Typography>
          </div>
          
          {/* Small Logo Placeholder (bottom rightish) */}
          <div className="ml-2 opacity-30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#114B5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#114B5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#114B5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryAnalysisCard;
/** ################################ /COMPONENT ############################# */
