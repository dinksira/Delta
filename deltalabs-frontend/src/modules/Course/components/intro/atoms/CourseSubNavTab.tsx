/** ################################ COMPONENT ############################# */
/** CourseSubNavTab: A single tab in the horizontal course sub-navigation bar. */

import React from "react";
import { cx } from "@/components/theme/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CourseSubNavTabProps {
  /** Display label for the tab */
  label: string;
  /** Whether this tab is currently active */
  isActive: boolean;
  /** Click handler for tab selection */
  onClick: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CourseSubNavTab: React.FC<Readonly<CourseSubNavTabProps>> = ({
  label,
  isActive,
  onClick,
}) => {
  return (
    <button
      type="button"
      className={cx(
        "relative px-1 pb-2 text-sm font-medium whitespace-nowrap",
        "transition-colors duration-200 cursor-pointer",
        isActive
          ? "text-primary-700"
          : "text-text-secondary hover:text-text-primary"
      )}
      onClick={onClick}
      aria-selected={isActive}
      role="tab"
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-600 rounded-full" />
      )}
    </button>
  );
};

CourseSubNavTab.displayName = "CourseSubNavTab";
/** ################################ /COMPONENT ############################# */
