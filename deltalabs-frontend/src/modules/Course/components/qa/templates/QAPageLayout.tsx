/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { SideNav, type SideTabId } from "../organisms/SideNav";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export interface QAPageLayoutProps {
  children: React.ReactNode;
  activeSideTab: SideTabId;
  onSideTabChange: (id: SideTabId) => void;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * QAPageLayout Template
 * Defines the overall two-column structure.
 */
export const QAPageLayout: React.FC<QAPageLayoutProps> = ({ 
  children,
  activeSideTab,
  onSideTabChange
}) => {
  return (
    <div className="flex min-h-screen w-full bg-white">
      <SideNav activeId={activeSideTab} onItemClick={onSideTabChange} />
      <main className="flex-1 ml-[68px] min-w-0">
        <div className="max-w-[1000px] mx-auto px-8 pt-2 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
