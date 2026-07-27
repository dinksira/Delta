/** ################################ COMPONENT ############################# */
/** ThumbnailStrip: Horizontal scrollable strip of media thumbnails. */

import React from "react";
import { cx } from "@/components/theme/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ThumbnailItem {
  id: string;
  src: string;
  alt: string;
}

export interface ThumbnailStripProps {
  /** Array of thumbnail items to display */
  items: readonly ThumbnailItem[];
  /** Currently selected thumbnail index */
  activeIndex: number;
  /** Handler when a thumbnail is selected */
  onSelect: (index: number) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ThumbnailStrip: React.FC<Readonly<ThumbnailStripProps>> = ({
  items,
  activeIndex,
  onSelect,
}) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-2 px-1">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={cx(
            "flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden",
            "border-2 transition-all duration-200 cursor-pointer",
            "hover:border-primary-400 hover:shadow-md",
            index === activeIndex
              ? "border-primary-600 shadow-md ring-1 ring-primary-300"
              : "border-border-default opacity-70 hover:opacity-100"
          )}
          onClick={() => onSelect(index)}
          aria-label={item.alt}
        >
          <img
            src={item.src}
            alt={item.alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
};

ThumbnailStrip.displayName = "ThumbnailStrip";
/** ################################ /COMPONENT ############################# */
