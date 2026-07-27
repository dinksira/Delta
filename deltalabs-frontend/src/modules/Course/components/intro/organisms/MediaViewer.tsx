/** ################################ COMPONENT ############################# */
/**
 * MediaViewer: Large media display area with overlay controls and pagination dots.
 * Shows physics simulations/videos with microphone, pagination, and menu controls.
 */

import React, { useState } from "react";
import { Mic, MoreVertical } from "lucide-react";
import { ThumbnailStrip } from "../molecules/ThumbnailStrip";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MediaItem {
  id: string;
  src: string;
  thumbnailSrc: string;
  alt: string;
}

export interface MediaViewerProps {
  /** Array of media items to display */
  items: readonly MediaItem[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MediaViewer: React.FC<Readonly<MediaViewerProps>> = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const currentItem = items[activeIndex] ?? items[0];
  const totalItems = items.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Main Viewer */}
      <div className="relative w-full aspect-[16/10] bg-surface-muted rounded-2xl overflow-hidden group">
        {/* Media Content */}
        <img
          src={currentItem?.src ?? ""}
          alt={currentItem?.alt ?? "Course media"}
          className="w-full h-full object-cover"
        />

        {/* Bottom Overlay Controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-4">
          {/* Microphone Button */}
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-primary-700/80 text-white flex items-center justify-center
              hover:bg-primary-600 transition-colors backdrop-blur-sm cursor-pointer"
            aria-label="Toggle microphone"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Pagination Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalItems }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
                  i === activeIndex
                    ? "bg-white w-5"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Menu Button */}
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center
              hover:bg-black/50 transition-colors backdrop-blur-sm cursor-pointer"
            aria-label="Media options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thumbnail Strip */}
      <ThumbnailStrip
        items={items.map((item) => ({
          id: item.id,
          src: item.thumbnailSrc,
          alt: item.alt,
        }))}
        activeIndex={activeIndex}
        onSelect={setActiveIndex}
      />
    </div>
  );
};

MediaViewer.displayName = "MediaViewer";
/** ################################ /COMPONENT ############################# */
