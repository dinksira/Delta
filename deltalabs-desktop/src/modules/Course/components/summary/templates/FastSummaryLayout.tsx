/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** FastSummaryLayout Template: Main layout structure for the summary module. */
import React from "react";
import { FastSummarySideNav, type SummaryTabId } from "../molecules/FastSummarySideNav";

export interface FastSummaryLayoutProps {
  children: React.ReactNode;
  activeTab: SummaryTabId;
  onTabChange: (id: SummaryTabId) => void;
}

export const FastSummaryLayout: React.FC<FastSummaryLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex h-full w-full bg-white">
      {/* Left Vertical Nav (Fixed inside component) */}
      <FastSummarySideNav activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main Content Area */}
      <div className="flex-1 ml-[68px] h-[calc(100vh-64px)] overflow-y-auto px-8 pt-2 pb-20">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FastSummaryLayout;
/** ################################ /COMPONENT ############################# */
