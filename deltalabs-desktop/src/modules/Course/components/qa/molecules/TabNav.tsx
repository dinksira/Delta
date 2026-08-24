/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { cx } from "@/components/theme/utils";
import { Button } from "@/components/theme";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export type QATabId = "my-questions" | "my-answers" | "faqs";

export interface TabNavProps {
  activeTab: QATabId;
  onTabChange: (id: QATabId) => void;
  onAskQuestion?: () => void;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * TabNav Molecule
 * Inline tabs for switching between question views.
 */
export const TabNav: React.FC<TabNavProps> = ({ activeTab, onTabChange, onAskQuestion }) => {
  const tabs = [
    { id: "my-questions", label: "My Questions" },
    { id: "my-answers", label: "My Answers" },
    { id: "faqs", label: "FAQs Questions" },
  ] as const;

  return (
    <div className="relative flex items-center justify-between border-b border-border-subtle w-full px-1">
      <div className="flex items-center gap-12">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cx(
                "relative py-4 text-[15px] font-black uppercase tracking-tight transition-all duration-300",
                isActive 
                  ? "text-primary-900" 
                  : "text-text-tertiary"
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 rounded-t-full animate-in fade-in slide-in-from-bottom-1 duration-300" />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="absolute right-0">
        <Button 
          onClick={onAskQuestion}
          className="h-10 px-6 rounded-xl !bg-primary-900 !text-white border-none font-bold text-[13px] shadow-lg shadow-primary-900/10 transition-all gap-2"
        >
          Ask Question
        </Button>
      </div>
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
