/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** FastSummarySideNav Molecule: Specialized vertical navigation for the summary module. */
import React from "react";
import { FileText, Edit3, HelpCircle } from "lucide-react";
import { cx } from "@/components/theme/utils";

export type SummaryTabId = "summary" | "note" | "exercise";

export interface FastSummarySideNavProps {
  activeTab: SummaryTabId;
  onTabChange: (id: SummaryTabId) => void;
  className?: string;
}

export const FastSummarySideNav: React.FC<FastSummarySideNavProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  const items = [
    { id: "summary" as SummaryTabId, icon: FileText, label: "Summary" },
    { id: "note" as SummaryTabId, icon: Edit3, label: "Fast Note" },
    { id: "exercise" as SummaryTabId, icon: HelpCircle, label: "Fast Exercise" },
  ];

  return (
    <nav className={cx("fixed left-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5 z-50 pointer-events-none", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cx(
              "flex items-center justify-center w-11 h-11 rounded-xl relative group pointer-events-auto",
              "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "hover:scale-105 active:scale-95",
              isActive 
                ? "bg-primary-900 text-white shadow-[0_8px_20px_-6px_rgba(23,74,95,0.4)] ring-2 ring-primary-900/10" 
                : "bg-white border border-border-primary text-primary-900 hover:border-primary-600 hover:shadow-md hover:bg-primary-50"
            )}
          >
            <Icon 
              size={20} 
              className={cx(
                "transition-all duration-300",
                isActive ? "text-white scale-110" : "text-primary-900/70 group-hover:text-primary-900 group-hover:scale-110"
              )} 
            />
            
            {/* Tooltip */}
            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-primary-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl">
              {item.label}
              {/* Tooltip Arrow */}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-primary-900 rotate-45 -z-10" />
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export default FastSummarySideNav;
/** ################################ /COMPONENT ############################# */
