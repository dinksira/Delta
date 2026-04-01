"use client";

import Link from "next/link";

import { Typography } from "@/components/theme";
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
}>;

function getCategoryItems(variant: TopNavVariant): readonly TopNavCategoryItem[] {
  if (variant === "landing_unauthorized") {
    return [
      { label: "Video", href: "/#features" },
      { label: "Audio", href: "/#features" },
      { label: "AI", href: "/#features" },
      { label: "Simulation", href: "/#features" },
      { label: "All", href: "/#features" },
    ];
  }
  if (variant === "features_authorized") {
    return [
      { label: "Features", href: "/features", active: true },
      { label: "Course", href: "/features", active: true, closable: true },
    ];
  }
  return [{ label: "Features", href: "/features", active: true }];
}

export function TopNav({ variant, isAuthenticated }: TopNavProps) {
  const showAuthActions = variant === "landing_unauthorized";
  const categoryItems = getCategoryItems(variant);

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-[#0f5169] text-white">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-black/25 text-[10px] font-bold">
            DL
          </span>
          <Typography as="span" variant="label" className="text-white">
            Delta Labs
          </Typography>
        </Link>

        <TopNavCategoryTabs items={categoryItems} />

        <div className="flex items-center gap-2 sm:gap-3">
          <TopNavUtilityActions isAuthenticated={isAuthenticated} />
          {showAuthActions ? <TopNavAuthActions isAuthenticated={isAuthenticated} /> : null}
        </div>
      </div>
    </header>
  );
}
