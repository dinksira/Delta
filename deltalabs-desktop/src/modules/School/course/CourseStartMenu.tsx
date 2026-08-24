"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  COURSE_START_TILE_ICONS,
  type CourseStartTile,
} from "@/modules/School/course/courseNavigation";

const PANEL_H_MARGIN = 14;
const PANEL_MIN_W = 320;
const PANEL_MAX_W = 720;
const PANEL_GAP_ABOVE_ANCHOR = 32;
const PANEL_EXTRA_LIFT = 20;

type CourseStartMenuProps = Readonly<{
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
  tiles: readonly CourseStartTile[];
  onSelectTile: (tile: CourseStartTile) => void;
}>;

/** Same Start-menu chrome as {@link ClassStartMenu}, course tiles. */
export function CourseStartMenu({ open, onClose, anchorRef, tiles, onSelectTile }: CourseStartMenuProps) {
  const [panelStyle, setPanelStyle] = useState<{ left: number; bottom: number; width: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!open || !anchorRef.current) {
      setPanelStyle(null);
      return;
    }
    const rect = anchorRef.current.getBoundingClientRect();
    const width = Math.min(PANEL_MAX_W, Math.max(PANEL_MIN_W, window.innerWidth - PANEL_H_MARGIN * 2));
    let left = rect.left;
    if (left + width > window.innerWidth - PANEL_H_MARGIN) left = window.innerWidth - PANEL_H_MARGIN - width;
    if (left < PANEL_H_MARGIN) left = PANEL_H_MARGIN;
    const anchorTopFromViewportBottom = window.innerHeight - rect.top;
    const bottom = anchorTopFromViewportBottom + PANEL_GAP_ABOVE_ANCHOR + PANEL_EXTRA_LIFT;
    setPanelStyle({ left, bottom, width });
  }, [anchorRef, open]);

  useLayoutEffect(() => {
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onPick = (tile: CourseStartTile) => {
    onSelectTile(tile);
    onClose();
  };

  if (!open || typeof document === "undefined") return null;

  const fallbackW =
    typeof window !== "undefined"
      ? Math.min(PANEL_MAX_W, Math.max(PANEL_MIN_W, window.innerWidth - PANEL_H_MARGIN * 2))
      : 420;
  const s = panelStyle ?? { left: PANEL_H_MARGIN, bottom: 120, width: fallbackW };

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[95] cursor-default bg-primary-900/30 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        role="menu"
        aria-label="Course start menu"
        className="fixed z-[100] rounded-2xl bg-primary-50/98 p-5 sm:rounded-3xl sm:p-7"
        style={{
          left: s.left,
          bottom: s.bottom,
          width: s.width,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {tiles.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-primary-700/80">All course sections are on the bar.</p>
        ) : (
          <div className="grid grid-cols-4 gap-x-2 gap-y-6 sm:grid-cols-6 sm:gap-x-4 sm:gap-y-8">
            {tiles.map((tile) => {
              const Icon = COURSE_START_TILE_ICONS[tile.key];
              return (
                <button
                  key={tile.key}
                  type="button"
                  role="menuitem"
                  onClick={() => onPick(tile)}
                  className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-primary-700 transition-colors hover:bg-primary-100 hover:text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70 sm:gap-2 sm:p-2"
                >
                  {Icon ? <Icon className="size-4 shrink-0 text-primary-600 sm:size-[1.125rem]" aria-hidden /> : null}
                  <span className="w-full truncate text-center text-[10px] font-medium leading-tight text-primary-800 sm:text-[11px]">
                    {tile.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}
