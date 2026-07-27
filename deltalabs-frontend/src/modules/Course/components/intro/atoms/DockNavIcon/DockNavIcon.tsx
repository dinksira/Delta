/**
 * DockNavIcon
 * A premium dock navigation icon component that displays vector SVG icons.
 *
 * @example
 * ```tsx
 * <DockNavIcon
 *   icon="/Course Intro.svg"
 *   label="Course"
 *   isActive={true}
 *   onClick={() => {}}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core and type definitions. */
import React from "react";
import type { DockNavIconProps } from "./DockNavIcon.types";
/** ################################ /IMPORT ############################# */

// ============================================================================
// COMPONENT
// ============================================================================

/** ################################ COMPONENT ############################# */
/** DockNavIcon button with active indicator state and premium SVG rendering. */
export const DockNavIcon: React.FC<DockNavIconProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  className = "",
  ...props
}) => {
  const buttonClasses = [
    "flex items-center justify-center p-1 min-w-14",
    isActive
      ? "opacity-100 bg-white/15 text-white"
      : "opacity-60 hover:opacity-100 hover:bg-white/10 text-white",
    "transition-all duration-200 cursor-pointer rounded-xl",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={onClick}
      aria-label={label}
      title={label}
      {...props}
    >
      <img
        src={icon}
        alt={label}
        className="block h-14 w-auto pointer-events-none select-none"
      />
    </button>
  );
};

DockNavIcon.displayName = "DockNavIcon";
/** ################################ /COMPONENT ############################# */

// ============================================================================
// EXPORTS
// ============================================================================

export default DockNavIcon;
export * from "./DockNavIcon.types";
