"use client";

/** ################################ IMPORT ############################# */
import type { ComponentType } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CLASS_FIXED_NAV_ICONS,
  CLASS_FIXED_NAV_IDS,
  CLASS_FIXED_NAV_LABELS,
  DEFAULT_LAST_NAV_SLOT,
  iconForNavSlot,
  parseClassNavId,
  readStoredLastNavSlot,
  startMenuTiles,
  type ClassFixedNavId,
  type ClassNavId,
  type ClassStartTile,
  type StoredLastNavSlot,
  writeStoredLastNavSlot,
} from "@/modules/School/class/classBottomNavConfig";
import { ClassStartMenu } from "./ClassStartMenu";
/** ################################ /IMPORT ############################# */

/** ################################ CONSTANTS ############################# */
const navActiveClass =
  "bg-primary-400/42 text-white shadow-inner ring-1 ring-primary-300/50 backdrop-blur-[2px]";
/** ################################ /CONSTANTS ############################# */

/** ################################ COMPONENT ############################# */
/**
 * Fixed bottom bar — Start opens overflow menu; the **last** tab is swappable from that menu.
 */
export function ClassBottomNav() {
  const router = useRouter();
  const params = useParams<{ schoolId: string; classItemId: string }>();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [lastSlot, setLastSlot] = useState<StoredLastNavSlot>(DEFAULT_LAST_NAV_SLOT);

  const schoolId = typeof params.schoolId === "string" ? params.schoolId : "";
  const classItemId = typeof params.classItemId === "string" ? params.classItemId : "";
  const basePath = `/features/school/${encodeURIComponent(schoolId)}/class/${encodeURIComponent(classItemId)}`;

  useEffect(() => {
    if (!classItemId) return;
    const stored = readStoredLastNavSlot(classItemId);
    setLastSlot(stored ?? DEFAULT_LAST_NAV_SLOT);
  }, [classItemId]);

  const activeNav = parseClassNavId(searchParams.get("nav"));

  const hrefFor = useCallback(
    (id: ClassNavId) => {
      const next = new URLSearchParams(searchParams.toString());
      if (id === "class") next.delete("nav");
      else next.set("nav", id);
      const qs = next.toString();
      return qs ? `${basePath}?${qs}` : basePath;
    },
    [basePath, searchParams],
  );

  const mainNavItems = useMemo(() => {
    const fixed = CLASS_FIXED_NAV_IDS.map((id) => ({
      id,
      label: CLASS_FIXED_NAV_LABELS[id],
      Icon: CLASS_FIXED_NAV_ICONS[id] as ComponentType<{ className?: string; "aria-hidden"?: boolean | undefined }>,
      slotKey: id,
    }));
    const LastIcon = iconForNavSlot(lastSlot);
    return [
      ...fixed,
      {
        id: lastSlot.navId,
        label: lastSlot.label,
        Icon: LastIcon as ComponentType<{ className?: string; "aria-hidden"?: boolean | undefined }>,
        slotKey: `last:${lastSlot.key}`,
      },
    ];
  }, [lastSlot]);

  const menuTiles = useMemo(() => startMenuTiles(lastSlot), [lastSlot]);

  const onSelectStartTile = useCallback(
    (tile: ClassStartTile) => {
      const next: StoredLastNavSlot = { key: tile.key, label: tile.label, navId: tile.navId };
      setLastSlot(next);
      if (classItemId) writeStoredLastNavSlot(classItemId, next);
      router.push(hrefFor(tile.navId));
      setStartOpen(false);
    },
    [classItemId, hrefFor, router],
  );

  const startHighlighted = startOpen;

  return (
    <nav
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[90] rounded-t-xl border-t border-primary-600/35 bg-primary-700 pb-[max(0.3rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-2px_12px_rgba(19,62,80,0.24)]"
      aria-label="Class sections"
    >
      <div className="mx-auto flex w-full max-w-[min(100%,1200px)] items-end gap-2 px-2 sm:gap-2.5 sm:px-3">
        <div className="shrink-0 pb-px">
          <button
            ref={startButtonRef}
            type="button"
            aria-label="Class start"
            title="Class start"
            aria-expanded={startOpen}
            aria-haspopup="menu"
            onClick={() => setStartOpen((v) => !v)}
            className={[
              "flex min-h-[2.625rem] w-[2.625rem] shrink-0 flex-col items-center justify-center rounded-md transition-colors sm:min-h-[2.95rem] sm:w-[2.95rem]",
              startHighlighted ? navActiveClass : "text-primary-100/95 hover:bg-primary-800/55 hover:text-white",
            ].join(" ")}
          >
            <span className="relative inline-flex size-[1.625rem] items-center justify-center sm:size-7">
              <LayoutGrid className="size-4 text-primary-50 sm:size-[1.05rem]" aria-hidden />
              <Plus
                className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary-800 text-primary-50 ring-1 ring-primary-500/40"
                aria-hidden
                strokeWidth={3}
              />
            </span>
          </button>
        </div>
        <ul className="grid min-w-0 flex-1 grid-cols-8 items-end gap-x-0.5 sm:gap-x-1">
          {mainNavItems.map(({ id, label, Icon, slotKey }) => {
            const isFixed = CLASS_FIXED_NAV_IDS.includes(id as ClassFixedNavId);
            const isActive = isFixed ? activeNav === id : activeNav === id;
            const href = hrefFor(id as ClassNavId);

            return (
              <li key={slotKey} className="min-w-0">
                <Link
                  href={href}
                  scroll={false}
                  prefetch={false}
                  className={[
                    "flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium leading-tight text-primary-50 transition-colors sm:gap-1.5 sm:px-1.5 sm:py-2 sm:text-[11px]",
                    isActive ? navActiveClass : "text-primary-100/95 hover:bg-primary-800/60 hover:text-white",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="relative inline-flex size-[1.625rem] items-center justify-center sm:size-7">
                    <Icon className="size-4 text-primary-50 sm:size-[1.05rem]" aria-hidden />
                  </span>
                  <span className="max-w-[4.25rem] truncate text-center tracking-tight">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <ClassStartMenu
        open={startOpen}
        onClose={() => setStartOpen(false)}
        anchorRef={startButtonRef}
        tiles={menuTiles}
        onSelectTile={onSelectStartTile}
      />
    </nav>
  );
}
/** ################################ /COMPONENT ############################# */
