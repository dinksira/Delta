"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { MouseEvent } from "react";
import { Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Typography } from "@/components/theme";
import type { AuthMessages } from "@/i18n/authMessages";
import { useAuthMessages } from "@/i18n/LocaleContext";
import { LANDING_BRAND_CLICK_EVENT } from "@/lib/publicNavEvents";
import { FeatureBrowserTabBar } from "@/components/navigation/FeatureBrowserTabBar";
import { NavLanguageControl } from "@/components/navigation/NavLanguageControl";
import { TopNavAuthActions } from "@/components/navigation/TopNavAuthActions";
import {
  type TopNavCategoryItem,
  TopNavCategoryTabs,
} from "@/components/navigation/TopNavCategoryTabs";
import { TopNavUtilityActions } from "@/components/navigation/TopNavUtilityActions";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
export type TopNavVariant =
  | "landing_unauthorized"
  | "landing_authorized"
  /** Session not yet read from storage — neutral right rail (no Login flash on refresh). */
  | "landing_pending"
  | "features_authorized";

type TopNavProps = Readonly<{
  variant: TopNavVariant;
  isAuthenticated: boolean;
  /** Shown in the utility avatar when signed in (e.g. from session). */
  profileInitials?: string;
  /** User avatar URL for the utility menu. */
  avatarUrl?: string | null;
  /** App shell: session not hydrated yet (same placeholder as landing_pending, right rail only). */
  sessionPending?: boolean;
}>;

/** ################################ /TYPES ############################# */
/** ################################ SUBCOMPONENTS ############################# */
/** Local subcomponents used by the main export. */
function TopNavRightPlaceholder({ wide }: Readonly<{ wide?: boolean }>) {
  return (
    <div
      className="flex h-10 items-center"
      aria-busy="true"
      aria-label="Loading account"
    >
      <div
        className={[
          "h-10 animate-pulse rounded-full bg-white/15",
          wide ? "w-44 sm:w-52" : "w-[11rem] sm:w-[12rem]",
        ].join(" ")}
      />
    </div>
  );
}

/** ################################ /SUBCOMPONENTS ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const LANDING_CATEGORY_PATHS = [
  { href: "/" as const, labelKey: "video" as const },
  { href: "/audio" as const, labelKey: "audio" as const },
  { href: "/ai" as const, labelKey: "ai" as const },
  { href: "/simulation" as const, labelKey: "simulation" as const },
  { href: "/explore" as const, labelKey: "all" as const },
] as const;

/** ################################ /CONSTANTS ############################# */
/** ################################ HELPERS ############################# */
/** Helper utilities used by this file. */
function landingCategoryItems(
  pathname: string,
  browse: AuthMessages["browseCategories"],
): readonly TopNavCategoryItem[] {
  return LANDING_CATEGORY_PATHS.map((item) => {
    const active =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return { label: browse[item.labelKey], href: item.href, active };
  });
}

/**
 * Brand mark — sized like the old cube’s **drawing** (28×28 viewBox inside ~36px slot).
 * Plain `img` so layout width/height always win (Next `<Image fill>` was still reading large for some PNGs).
 */
function BrandLogoMark() {
  return (
    <img
      src="/delta-labs.png"
      alt=""
      width={28}
      height={28}
      decoding="async"
      fetchPriority="high"
      className="block h-7 w-7 max-h-7 max-w-7 shrink-0 object-contain sm:h-8 sm:w-8 sm:max-h-8 sm:max-w-8"
    />
  );
}

/** ################################ /HELPERS ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function TopNav({ variant, isAuthenticated, profileInitials, avatarUrl, sessionPending }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { browseCategories } = useAuthMessages();
  const landingTabs = useMemo(
    () => landingCategoryItems(pathname ?? "", browseCategories),
    [pathname, browseCategories],
  );
  const showAuthActions = variant === "landing_unauthorized";
  const showFeatureBrowserTabs = variant === "features_authorized";
  const showRightPlaceholder =
    variant === "landing_pending" || Boolean(sessionPending);

  const handleBrandClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if ((pathname ?? "") !== "/") return;
      event.preventDefault();
      window.dispatchEvent(new CustomEvent(LANDING_BRAND_CLICK_EVENT));
      router.refresh();
    },
    [pathname, router],
  );

  return (
    <header className="sticky top-0 z-50 shrink-0 bg-primary-600 text-white">
      <div
        className={[
          "h-16 w-full items-center px-2 md:px-3",
          showFeatureBrowserTabs
            ? "grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 md:gap-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-6"
            : [
                /* <sm: category tabs hidden — flex avoids an empty 1fr “dead” column */
                "flex justify-between gap-2 md:gap-4",
                "sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-2 md:gap-4",
                /* Third column `auto`: rail caps would clip language + auth actions */
                "lg:grid-cols-[minmax(var(--dl-layout-shell-rail-min),var(--dl-layout-shell-rail-max))_minmax(0,1fr)_auto] lg:gap-4",
              ].join(" "),
        ].join(" ")}
      >
        <Link
          href="/"
          onClick={handleBrandClick}
          className={[
            "flex min-w-0 shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
            showFeatureBrowserTabs ? "" : "lg:w-full lg:max-w-[var(--dl-layout-shell-rail-aside-cap)] lg:justify-self-start",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <BrandLogoMark />
          <Typography
            as="span"
            variant="label"
            className="truncate text-[19px] font-bold tracking-tight text-white sm:text-[21px]"
          >
            Delta Labs
          </Typography>
        </Link>

        {showFeatureBrowserTabs ? (
          <div className="flex min-h-0 w-full min-w-0 flex-col justify-end justify-self-stretch self-stretch pt-1">
            <Suspense
              fallback={<div className="min-h-[2.4rem] w-full flex-1 sm:min-h-[2.5rem]" aria-hidden />}
            >
              <FeatureBrowserTabBar />
            </Suspense>
          </div>
        ) : (
          <TopNavCategoryTabs items={landingTabs} ariaLabel={browseCategories.navAria} />
        )}

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-2.5 lg:w-auto lg:max-w-none lg:justify-self-end">
          {showRightPlaceholder ? (
            <>
              <NavLanguageControl tone="onPrimary" />
              <TopNavRightPlaceholder wide={showFeatureBrowserTabs} />
            </>
          ) : showAuthActions ? (
            <TopNavAuthActions isAuthenticated={isAuthenticated} />
          ) : (
            <TopNavUtilityActions profileInitials={profileInitials} avatarUrl={avatarUrl} />
          )}
        </div>
      </div>
    </header>
  );
}
/** ################################ /COMPONENT ############################# */
