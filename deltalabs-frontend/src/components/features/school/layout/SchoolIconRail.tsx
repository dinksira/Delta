"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, Handshake, Home, Tag } from "lucide-react";

import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const items = [
  {
    href: "/features/school",
    label: "My School home",
    tooltip: "Home",
    icon: Home,
    match: (p: string) => p === "/features/school",
  },
  {
    href: "/features/school/offers",
    label: "Offers",
    tooltip: "Offers",
    icon: Tag,
    match: (p: string) => p.startsWith("/features/school/offers"),
  },
  {
    href: "/features/school/marketplace",
    label: "School marketplace",
    tooltip: "Marketplace",
    icon: Handshake,
    match: (p: string) => p.startsWith("/features/school/marketplace"),
  },
  {
    href: "/features/school/archive",
    label: "Archive",
    tooltip: "Archive",
    icon: Archive,
    match: (p: string) => p.startsWith("/features/school/archive"),
  },
] as const;

/** ################################ /CONSTANTS ############################# */
/** ################################ COMPONENT ############################# */
/**
 * Slim icon rail: tiles centered horizontally in the column and **vertically centered** in the
 * workspace height (matches Figma placement).
 */
export function SchoolIconRail() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="-ml-[6px] flex min-h-0 w-[4.5rem] shrink-0 flex-col items-center justify-center gap-3 self-stretch bg-surface-canvas"
      aria-label="School sections"
    >
      {items.map(({ href, label, tooltip, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <div key={href} className="group relative flex justify-center">
            <Link
              href={href}
              prefetch
              className={cx(
                "inline-flex size-12 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
                active
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-border-default bg-surface-default text-text-secondary hover:border-primary-500 hover:bg-surface-muted hover:text-text-primary",
              )}
              aria-current={active ? "page" : undefined}
              aria-label={label}
            >
              <Icon className="size-[1.35rem] shrink-0" strokeWidth={1.75} aria-hidden />
            </Link>
            <span
              className="pointer-events-none absolute left-full top-1/2 z-[60] ml-2 -translate-y-1/2 whitespace-nowrap rounded-full bg-text-primary px-3 py-1.5 text-xs font-medium text-text-inverse opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
              role="tooltip"
            >
              {tooltip}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
/** ################################ /COMPONENT ############################# */
