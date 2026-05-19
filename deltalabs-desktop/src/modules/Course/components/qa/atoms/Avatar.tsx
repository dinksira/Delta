/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import Image from "next/image";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Props for the Avatar atom. */
export interface AvatarProps {
  src?: string;
  initials: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * Avatar Atom
 * A circular container for user photos or initials.
 */
export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  initials, 
  size = "sm", 
  className 
}) => {
  const sizeStyles = {
    xs: "h-5 w-5 text-[8px]",
    sm: "h-8 w-8 text-[11px]",
    md: "h-12 w-12 text-[14px]",
  };

  return (
    <div className={cx(
      "relative flex shrink-0 items-center justify-center rounded-full overflow-hidden bg-surface-secondary border border-border-subtle",
      sizeStyles[size],
      className
    )}>
      {src ? (
        <Image 
          src={src} 
          alt={initials} 
          fill 
          className="object-cover" 
        />
      ) : (
        <span className="font-bold text-text-secondary uppercase">
          {initials}
        </span>
      )}
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
