"use client";

/** ################################ IMPORT ############################# */
import type { ComponentType } from "react";
import {
  Award,
  Calendar,
  ClipboardList,
  Fingerprint,
  LayoutGrid,
  Plus,
  Presentation,
  User,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ClassStartMenu } from "./ClassStartMenu";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type NavId =
  | "home"
  | "class"
  | "students"
  | "parents"
  | "attendance"
  | "teacher"
  | "schedules"
  | "grade"
  | "assignment";

type NavItem = Readonly<{
  id: NavId;
  label: string;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | undefined }>;
}>;
/** ################################ /TYPES ############################# */

/** ################################ CONSTANTS ############################# */
const NAV_ITEMS: readonly NavItem[] = [
  { id: "home", label: "Home", Icon: LayoutGrid },
  { id: "class", label: "Class", Icon: Presentation },
  { id: "students", label: "Student", Icon: User },
  { id: "parents", label: "Parent", Icon: Users },
  { id: "attendance", label: "Attendance", Icon: Fingerprint },
  { id: "teacher", label: "Teacher", Icon: UserRound },
  { id: "schedules", label: "Schedules", Icon: Calendar },
  { id: "grade", label: "Grade", Icon: Award },
  { id: "assignment", label: "Assignment", Icon: ClipboardList },
] as const;

const NAV_MAIN_ITEMS = NAV_ITEMS.filter((i) => i.id !== "home");

/** Lighter translucent teal active pill — slightly tighter / softer than default size. */
const navActiveClass =
  "bg-primary-400/42 text-white shadow-inner ring-1 ring-primary-300/50 backdrop-blur-[2px]";

function parseClassNav(raw: string | null): NavId {
  const allowed = new Set<string>(NAV_ITEMS.map((i) => i.id));
  if (raw && allowed.has(raw)) return raw as NavId;
  return "class";
}
/** ################################ /CONSTANTS ############################# */

/** ################################ COMPONENT ############################# */
/**
 * Fixed bottom bar — primary teal bar; **Home** is icon-only at the far left (start);
 * active tab uses a **light translucent teal** highlight.
 */
export function ClassBottomNav() {
  const params = useParams<{ schoolId: string; classItemId: string }>();
  const searchParams = useSearchParams();
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const [startOpen, setStartOpen] = useState(false);

  const schoolId = typeof params.schoolId === "string" ? params.schoolId : "";
  const classItemId = typeof params.classItemId === "string" ? params.classItemId : "";
  const basePath = `/features/school/${encodeURIComponent(schoolId)}/class/${encodeURIComponent(classItemId)}`;

  const activeNav = parseClassNav(searchParams.get("nav"));

  const hrefFor = useMemo(() => {
    return (id: NavId) => {
      const next = new URLSearchParams(searchParams.toString());
      if (id === "class") next.delete("nav");
      else next.set("nav", id);
      const qs = next.toString();
      return qs ? `${basePath}?${qs}` : basePath;
    };
  }, [basePath, searchParams]);

  const startHighlighted = startOpen || activeNav === "home";

  return (
    <nav
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[90] rounded-t-xl border-t border-primary-600/35 bg-primary-700 pb-[max(0.3rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-2px_12px_rgba(19,62,80,0.24)]"
      aria-label="Class sections"
    >
      {/* Start is the first control; tabs follow in one row with a tight gap (no wide “dead” column). */}
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
            aria-current={activeNav === "home" && !startOpen ? "page" : undefined}
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
          {NAV_MAIN_ITEMS.map(({ id, label, Icon }) => {
            const isActive = activeNav === id;
            const href = hrefFor(id);

            return (
              <li key={id} className="min-w-0">
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
        getHref={(id) => hrefFor(id as NavId)}
      />
    </nav>
  );
}
/** ################################ /COMPONENT ############################# */
