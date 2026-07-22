"use client";

import { LayoutGrid, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { CourseStartMenu } from "@/modules/School/course/CourseStartMenu";
import {
  COURSE_NAV_ITEMS,
  COURSE_START_TILES,
  parseCourseNavId,
  type CourseNavId,
  type CourseStartTile,
} from "@/modules/School/course/courseNavigation";

/** Same active chrome as {@link ClassBottomNav}. */
const navActiveClass =
  "bg-primary-400/42 text-white shadow-inner ring-1 ring-primary-300/50 backdrop-blur-[2px]";

/**
 * Course bottom bar — class workspace chrome (Start + dark teal bar + active pill),
 * with the nine Course sections from the Figma course shell.
 */
export function CourseBottomNav() {
  const router = useRouter();
  const params = useParams<{ schoolId: string; courseItemId: string }>();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const [startOpen, setStartOpen] = useState(false);

  const schoolId = typeof params.schoolId === "string" ? params.schoolId : "";
  const courseItemId = typeof params.courseItemId === "string" ? params.courseItemId : "";
  const basePath = `/features/school/${encodeURIComponent(schoolId)}/course/${encodeURIComponent(courseItemId)}`;

  const activeNav = parseCourseNavId(searchParams.get("nav"));

  const hrefFor = useCallback(
    (id: CourseNavId) => {
      const next = new URLSearchParams(searchParams.toString());
      if (id === "intro") next.delete("nav");
      else next.set("nav", id);
      const qs = next.toString();
      return qs ? `${basePath}?${qs}` : basePath;
    },
    [basePath, searchParams],
  );

  const menuTiles = useMemo(() => COURSE_START_TILES, []);

  const onSelectStartTile = useCallback(
    (tile: CourseStartTile) => {
      router.push(hrefFor(tile.navId));
      setStartOpen(false);
    },
    [hrefFor, router],
  );

  const startHighlighted = startOpen;

  return (
    <nav
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[90] rounded-t-xl border-t border-primary-600/35 bg-primary-700 pb-[max(0.3rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-2px_12px_rgba(19,62,80,0.24)]"
      aria-label="Course sections"
    >
      <div className="mx-auto flex w-full max-w-[min(100%,1200px)] items-end gap-2 px-2 sm:gap-2.5 sm:px-3">
        <div className="shrink-0 pb-px">
          <button
            ref={startButtonRef}
            type="button"
            aria-label="Course start"
            title="Course start"
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
        <ul className="grid min-w-0 flex-1 grid-cols-9 items-end gap-x-0.5 sm:gap-x-1">
          {COURSE_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeNav === id;
            const href = hrefFor(id);

            return (
              <li key={id} className="min-w-0">
                <Link
                  href={href}
                  scroll={false}
                  prefetch={false}
                  className={[
                    "flex flex-col items-center gap-1 rounded-md px-0.5 py-1.5 text-[9px] font-medium leading-tight text-primary-50 transition-colors sm:gap-1.5 sm:px-1 sm:py-2 sm:text-[10px]",
                    isActive ? navActiveClass : "text-primary-100/95 hover:bg-primary-800/60 hover:text-white",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="relative inline-flex size-[1.625rem] items-center justify-center sm:size-7">
                    <Icon className="size-4 text-primary-50 sm:size-[1.05rem]" aria-hidden />
                  </span>
                  <span className="max-w-[4.5rem] truncate text-center tracking-tight">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <CourseStartMenu
        open={startOpen}
        onClose={() => setStartOpen(false)}
        anchorRef={startButtonRef}
        tiles={menuTiles}
        onSelectTile={onSelectStartTile}
      />
    </nav>
  );
}
