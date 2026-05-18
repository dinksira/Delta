/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** ProgressCircleStat Molecule: Displays circular progress and key metrics. */
import React from "react";
import { Typography } from "@/components/theme";
import { Clock, Trophy, Monitor, Info, ExternalLink, TrendingUp } from "lucide-react";
import { cx } from "@/components/theme/utils";

export const ProgressCircleStat: React.FC = () => {
  const stats = [
    { icon: Clock, label: "Hours", subLabel: "Logged", value: "14 : 20", trend: "8%", isPositive: true },
    { icon: Trophy, label: "Spot", subLabel: "In the ranking", value: "100", trend: "10", isPositive: true },
    { icon: Monitor, label: "Score", subLabel: "In the ranking", value: "150", trend: "30", isPositive: true },
  ];

  return (
    <div className="bg-white rounded-[16px] border border-[#E2E8F0]/80 p-6 flex flex-col gap-8 h-full relative group">
      <div className="flex items-center justify-between">
        <Typography className="text-[18px] font-black text-[#111827]">Progress</Typography>
        <ExternalLink size={20} className="text-[#64748B] cursor-pointer hover:text-[#114B5F] transition-colors" />
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-10">
        {/* Circular Progress */}
        <div className="relative w-[180px] h-[180px] shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              className="text-[#E2E8F0]/40"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            {/* Progress Circle */}
            <circle
              className="text-[#114B5F]"
              strokeWidth="12"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 * (1 - 0.8)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Typography className="text-[32px] font-black text-[#111827]">80%</Typography>
          </div>
        </div>

        {/* Stats List */}
        <div className="flex flex-col gap-6 flex-1 w-full">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center justify-between group/item">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#114B5F]">
                  <stat.icon size={20} />
                </div>
                <div className="flex flex-col">
                  <Typography className="text-[15px] font-black text-[#111827]">{stat.label}</Typography>
                  <Typography className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{stat.subLabel}</Typography>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Typography className="text-[18px] font-black text-[#114B5F]">{stat.value}</Typography>
                <div className="flex items-center gap-1 text-[#1C9E45]">
                  <Typography className="text-[13px] font-black">{stat.trend}</Typography>
                  <TrendingUp size={14} className="rotate-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-6 border-t border-[#E2E8F0]/40 flex items-start gap-3">
        <Info size={18} className="text-[#114B5F] shrink-0 mt-0.5" />
        <Typography className="text-[13px] font-bold text-[#475569] leading-relaxed">
          Based on your Progress You will complete this course 6 days ahead of time
        </Typography>
      </div>
    </div>
  );
};

export default ProgressCircleStat;
/** ################################ /COMPONENT ############################# */
