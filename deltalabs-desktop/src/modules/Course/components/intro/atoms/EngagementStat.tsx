/** ################################ COMPONENT ############################# */
/** EngagementStat: A single engagement metric (likes, comments, shares). */

import React, { type ReactNode } from "react";
import { cx } from "@/components/theme/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EngagementStatProps {
  /** Icon element to render */
  icon: ReactNode;
  /** Metric count or value */
  value: string;
  /** Optional click handler for interactive stats */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const EngagementStat: React.FC<Readonly<EngagementStatProps>> = ({
  icon,
  value,
  onClick,
  className,
}) => {
  return (
    <button
      type="button"
      className={cx(
        "flex items-center gap-1.5 text-text-secondary text-sm",
        "hover:text-primary-600 transition-colors cursor-pointer",
        className
      )}
      onClick={onClick}
      aria-label={`${value} engagements`}
    >
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span className="font-medium">{value}</span>
    </button>
  );
};

EngagementStat.displayName = "EngagementStat";
/** ################################ /COMPONENT ############################# */
