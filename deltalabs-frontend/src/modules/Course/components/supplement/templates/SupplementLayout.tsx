/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** SupplementLayout Template: Main layout structure for the supplement module. */
import React, { useState, useEffect } from "react";
import { SupplementSideNav, type SupplementNavId } from "../molecules/SupplementSideNav";

export interface SupplementLayoutProps {
  children: React.ReactNode;
}

export const SupplementLayout: React.FC<SupplementLayoutProps> = ({
  children,
}) => {
  const [activeNav, setActiveNav] = useState<SupplementNavId>("supplements");
  
  // Reset scroll when switching sub-tabs
  useEffect(() => {
    const container = document.querySelector('main.overflow-y-auto');
    if (container) {
      container.scrollTop = 0;
    }
  }, [activeNav]);

  return (
    <div className="flex h-full w-full bg-white">
      {/* Left Vertical Nav (Fixed inside component) */}
      <SupplementSideNav activeId={activeNav} onNavChange={setActiveNav} />

      {/* Main Content Area */}
      <div className="flex-1 ml-[68px] h-[calc(100vh-64px)] overflow-y-auto px-8 pt-2 pb-20">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SupplementLayout;
/** ################################ /COMPONENT ############################# */
