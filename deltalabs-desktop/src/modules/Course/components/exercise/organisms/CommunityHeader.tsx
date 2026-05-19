/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** CommunityHeader Organism: Handles tab navigation and search. */
import React from "react";
import { CommunitySearchBar } from "../molecules/CommunitySearchBar";
import { cx } from "@/components/theme/utils";

export type CommunityTabId = "test" | "exercise" | "my";

export interface CommunityHeaderProps {
  activeTab: CommunityTabId;
  onTabChange: (id: CommunityTabId) => void;
  onSearch?: (query: string) => void;
}

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  activeTab,
  onTabChange,
  onSearch,
}) => {
  const tabs = [
    { id: "test" as CommunityTabId, label: "Community Test" },
    { id: "exercise" as CommunityTabId, label: "Community Exercise" },
    { id: "my" as CommunityTabId, label: "My Exercise" },
  ];

  return (
    <div className="flex flex-col gap-10 w-full pt-1 sticky top-[-8px] z-40 bg-white/95 backdrop-blur-md pb-6 -mx-8 px-8 border-b border-[#E2E8F0]/30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Tab Navigation */}
      <div className="flex items-center gap-12 w-fit mx-auto sm:mx-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cx(
                "relative py-4 text-[18px] font-black transition-all duration-300",
                isActive ? "text-[#114B5F]" : "text-[#64748B]/60 hover:text-[#114B5F]/80"
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#114B5F] rounded-t-full shadow-[0_-2px_6px_rgba(17,75,95,0.3)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Search Bar Container */}
      <div className="w-full">
        <CommunitySearchBar onChange={onSearch} />
      </div>
    </div>
  );
};

export default CommunityHeader;
/** ################################ /COMPONENT ############################# */
