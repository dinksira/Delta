/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Props for the IconButton atom. */
export interface IconButtonProps {
  icon: React.ReactNode;
  active?: boolean;
  tooltip?: string;
  onClick?: () => void;
  className?: string;
  hasNotification?: boolean;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * IconButton Atom
 * A square button with an icon, used in sidebars and toolbars.
 */
export const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  active = false, 
  tooltip, 
  onClick, 
  className,
  hasNotification = false
}) => {
  return (
    <button
      onClick={onClick}
      className={cx(
        "relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 active:scale-95 group shrink-0",
        active 
          ? "bg-white text-primary-900 shadow-sm" 
          : "bg-transparent text-white hover:bg-white/10",
        className
      )}
    >
      {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 20 })}
      
      {hasNotification && (
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#EF4444]" />
      )}
      
      {tooltip && (
        <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-primary-900 text-white text-[12px] rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-50">
          {tooltip}
        </div>
      )}
    </button>
  );
};

/** ################################ /COMPONENT ############################# */
