"use client";

import Link from "next/link";
import { Suspense } from "react";

import { Typography } from "@/components/theme";
import { FeatureBrowserTabBar } from "@/components/navigation/FeatureBrowserTabBar";
import { TopNavAuthActions } from "@/components/navigation/TopNavAuthActions";
import {
  type TopNavCategoryItem,
  TopNavCategoryTabs,
} from "@/components/navigation/TopNavCategoryTabs";
import { TopNavUtilityActions } from "@/components/navigation/TopNavUtilityActions";

export type TopNavVariant =
  | "landing_unauthorized"
  | "landing_authorized"
  | "features_authorized";

type TopNavProps = Readonly<{
  variant: TopNavVariant;
  isAuthenticated: boolean;
  /** Shown in the utility avatar when signed in (e.g. from session). */
  profileInitials?: string;
}>;

/** Landing (guest or signed-in): same category row as product spec. */
const LANDING_CATEGORY_ITEMS: readonly TopNavCategoryItem[] = [
  { label: "Video", href: "/#features", active: true },
  { label: "Audio", href: "/#features" },
  { label: "AI", href: "/#features" },
  { label: "Simulation", href: "/#features" },
  { label: "All", href: "/#features" },
];

/** Isometric cube mark — gray/silver faces per unauthorized landing spec. */
function BrandMarkCube() {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center sm:h-11 sm:w-11" aria-hidden>
      <svg viewBox="0 0 28 28" className="h-9 w-9 sm:h-11 sm:w-11" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 6 L20 9.5 L14 13 L8 9.5 Z"
          fill="#E2E8F0"
          stroke="#94A3B8"
          strokeWidth={0.4}
          strokeLinejoin="round"
        />
        <path
          d="M20 9.5 L20 18.5 L14 22 L14 13 Z"
          fill="#94A3B8"
          stroke="#64748B"
          strokeWidth={0.4}
          strokeLinejoin="round"
        />
        <path
          d="M8 9.5 L14 13 L14 22 L8 18.5 Z"
          fill="#CBD5E1"
          stroke="#64748B"
          strokeWidth={0.4}
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function TopNav({ variant, isAuthenticated, profileInitials }: TopNavProps) {
  const showAuthActions = variant === "landing_unauthorized";
  const showFeatureBrowserTabs = variant === "features_authorized";

  return (
    <header className="sticky top-0 z-50 bg-primary-600 text-white">
      <div className="flex h-16 w-full items-center justify-between gap-2 px-2 md:gap-4 md:px-3">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <BrandMarkCube />
          <Typography
            as="span"
            variant="label"
            className="truncate text-[19px] font-bold tracking-tight text-white sm:text-[21px]"
          >
            Delta Labs
          </Typography>
        </Link>

        {showFeatureBrowserTabs ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-end self-stretch pt-1">
            <Suspense
              fallback={<div className="min-h-[2.4rem] flex-1 sm:min-h-[2.5rem]" aria-hidden />}
            >
              <FeatureBrowserTabBar />
            </Suspense>
          </div>
        ) : (
          <TopNavCategoryTabs items={LANDING_CATEGORY_ITEMS} />
        )}

        <div className="flex min-w-0 shrink-0 items-center">
          {showAuthActions ? (
            <TopNavAuthActions isAuthenticated={isAuthenticated} />
          ) : (
            <TopNavUtilityActions profileInitials={profileInitials} />
          )}
        </div>
      </div>
    </header>
  );
}
