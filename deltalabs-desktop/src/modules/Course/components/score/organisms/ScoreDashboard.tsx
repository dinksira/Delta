/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** ScoreDashboard Organism: Orchestrates the performance analytics grid. */
import React from "react";
import { Typography, Button } from "@/components/theme";
import { LayoutGrid, MessageCircle, Share2 } from "lucide-react";
import { ProgressCircleStat } from "../molecules/ProgressCircleStat";
import { GradeSummaryTable } from "../molecules/GradeSummaryTable";
import { CommunityRankingList } from "../molecules/CommunityRankingList";
import { ProcessBarChart } from "../molecules/ProcessBarChart";

export const ScoreDashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Typography className="text-[28px] font-black text-[#114B5F]">Score</Typography>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer group">
            <LayoutGrid size={18} className="text-[#114B5F] group-hover:scale-110 transition-transform" />
            <Typography className="text-[14px] font-bold text-[#114B5F]">View By Chapters</Typography>
          </div>

          <Button className="!bg-[#114B5F] !text-white rounded-lg px-6 h-10 text-[13px] font-bold border-none shadow-lg shadow-[#114B5F]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
            <MessageCircle size={16} />
            Ask for support
          </Button>

          <Button className="!bg-[#114B5F] !text-white rounded-lg px-6 h-10 text-[13px] font-bold border-none shadow-lg shadow-[#114B5F]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
            <Share2 size={16} />
            Export
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="min-h-[400px]">
          <ProgressCircleStat />
        </div>
        <div className="min-h-[400px]">
          <GradeSummaryTable />
        </div>
        <div className="min-h-[400px]">
          <CommunityRankingList />
        </div>
        <div className="min-h-[400px]">
          <ProcessBarChart />
        </div>
      </div>
    </div>
  );
};

export default ScoreDashboard;
/** ################################ /COMPONENT ############################# */
