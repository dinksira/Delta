/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Props for the Tooltip component. */
export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * Tooltip Atom
 * A simple hover-based label for navigation items.
 */
export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  className 
}) => {
  return (
    <div className={cx("group relative flex items-center", className)}>
      {children}
      <div className="absolute left-full ml-3 px-3 py-1 bg-text-primary text-white text-[11px] font-medium rounded-full opacity-0 translate-x-[-10px] pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-xl">
        {content}
      </div>
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
