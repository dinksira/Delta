/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** StatusDot Atom: A simple indicator for online/offline status. */
import React from "react";
import { cx } from "@/components/theme/utils";

export interface StatusDotProps {
  status: "online" | "offline" | "away";
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, className }) => {
  const statusClasses = {
    online: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    offline: "bg-slate-300",
    away: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  };

  return (
    <span 
      className={cx(
        "inline-block w-2.5 h-2.5 rounded-full border border-white",
        statusClasses[status],
        className
      )} 
    />
  );
};

export default StatusDot;
/** ################################ /COMPONENT ############################# */
