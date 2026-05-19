/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** ScoreView: Main view for the performance analytics module. */
import React from "react";
import { ScoreDashboard } from "../components/score/organisms/ScoreDashboard";

export const ScoreView: React.FC = () => {
  return (
    <div className="min-h-full bg-[#F8FAFC] px-8 pt-6">
      <div className="max-w-[1400px] mx-auto">
        <ScoreDashboard />
      </div>
    </div>
  );
};

export default ScoreView;
/** ################################ /COMPONENT ############################# */
