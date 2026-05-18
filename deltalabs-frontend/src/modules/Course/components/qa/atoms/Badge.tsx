/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Props for the Badge atom. */
export interface BadgeProps {
  children: React.ReactNode;
  variant?: "outline" | "filled" | "teal";
  className?: string;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * Badge Atom
 * A small pill-shaped component for tags and labels.
 */
export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = "outline", 
  className 
}) => {
  const variantStyles = {
    outline: "border border-border-primary bg-transparent text-text-secondary",
    filled: "bg-surface-secondary text-text-primary",
    teal: "bg-primary-100 border border-primary-200 text-primary-700",
  };

  return (
    <span className={cx(
      "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium tracking-wide",
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
};

/** ################################ /COMPONENT ############################# */
