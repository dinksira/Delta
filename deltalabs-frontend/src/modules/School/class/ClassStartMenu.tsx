"use client";

/** ################################ IMPORT ############################# */
import type { ComponentType, RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  Atom,
  Award,
  BookMarked,
  Bus,
  Calendar,
  FlaskConical,
  MoreHorizontal,
  PanelsTopLeft,
  PencilRuler,
  Route,
  Server,
  User,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export type ClassStartNavTarget =
  | "class"
  | "students"
  | "parents"
  | "attendance"
  | "teacher"
  | "schedules"
  | "grade"
  | "assignment";

type StartTile = Readonly<{
  key: string;
  label: string;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | undefined }>;
  /** When set, navigates the class workspace to this `nav` tab and closes the menu. */
  targetNav?: ClassStartNavTarget;
}>;
/** ################################ /TYPES ############################# */

/** ################################ CONSTANTS ############################# */
/** 2×6 grid matching the reference (top → bottom, left → right). */
const START_TILES: readonly StartTile[] = [
  { key: "assets", label: "Assets", Icon: Server },
  { key: "plans", label: "Plans", Icon: PanelsTopLeft },
  { key: "labs", label: "Labs", Icon: FlaskConical },
  { key: "rnd", label: "R & D", Icon: Atom },
  { key: "schedules", label: "Schedules", Icon: Calendar, targetNav: "schedules" },
  { key: "transport", label: "Transport", Icon: Bus },
  { key: "student", label: "Student", Icon: User, targetNav: "students" },
  { key: "grade", label: "Grade", Icon: Award, targetNav: "grade" },
  { key: "roadmap", label: "Roadmap", Icon: Route },
  { key: "materials", label: "Materials", Icon: PencilRuler },
  { key: "courses", label: "Courses", Icon: BookMarked, targetNav: "assignment" },
  { key: "other", label: "Other", Icon: MoreHorizontal },
] as const;

/** Panel size / position (fixed `bottom` = px from viewport bottom; larger = higher on screen). */
const PANEL_H_MARGIN = 14;
const PANEL_MIN_W = 320;
const PANEL_MAX_W = 720;
/** Space between Start button top and panel bottom edge. */
const PANEL_GAP_ABOVE_ANCHOR = 32;
/** Extra lift so the menu sits clearly above the bottom bar. */
const PANEL_EXTRA_LIFT = 20;
/** ################################ /CONSTANTS ############################# */

/** ################################ COMPONENT ############################# */
type ClassStartMenuProps = Readonly<{
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
  getHref: (nav: ClassStartNavTarget) => string;
}>;

export function ClassStartMenu({ open, onClose, anchorRef, getHref }: ClassStartMenuProps) {
  const router = useRouter();
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

  const onPick = (tile: StartTile) => {
    if (tile.targetNav) {
      router.push(getHref(tile.targetNav));
    }
    onClose();
  };

  if (!open || typeof document === "undefined") return null;

  const fallbackW =
    typeof window !== "undefined"
      ? Math.min(PANEL_MAX_W, Math.max(PANEL_MIN_W, window.innerWidth - PANEL_H_MARGIN * 2))
      : 420;
  const s = panelStyle ?? { left: PANEL_H_MARGIN, bottom: 120, width: fallbackW };

  const portal = (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[95] cursor-default bg-primary-900/30 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        role="menu"
        aria-label="Class start menu"
        className="fixed z-[100] rounded-2xl bg-primary-50/98 p-5 sm:rounded-3xl sm:p-7"
        style={{
          left: s.left,
          bottom: s.bottom,
          width: s.width,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-6 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8">
          {START_TILES.map((tile) => {
            const Icon = tile.Icon;
            return (
              <button
                key={tile.key}
                type="button"
                role="menuitem"
                onClick={() => onPick(tile)}
                className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-primary-700 transition-colors hover:bg-primary-100 hover:text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70 sm:gap-2 sm:p-2"
              >
                <Icon className="size-4 shrink-0 text-primary-600 sm:size-[1.125rem]" aria-hidden />
                <span className="w-full truncate text-center text-[10px] font-medium leading-tight text-primary-800 sm:text-[11px]">
                  {tile.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return createPortal(portal, document.body);
}
/** ################################ /COMPONENT ############################# */
