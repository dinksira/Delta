"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useFeatureTabs } from "@/contexts/FeatureTabs_Context";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const TAB_ACTIVE_BG = "bg-[color:var(--color-features-tab-active-bg)]";
const TAB_IDLE_BG = "bg-[color:var(--color-features-tab-idle-bg)]";
const TAB_BORDER = "border-[color:var(--color-features-tab-border)]";
const TAB_TEXT = "text-[color:var(--color-features-tab-text)]";

/**
 * First path segment after `/features/school/` for **product sections** (offers, marketplace, …).
 * Must not be treated as a `{schoolId}` or every sidebar click spawns a new "School Workspace" tab
 * (`school-offers`, `school-archive`, …) with the same label.
 */
const SCHOOL_NON_ID_FIRST_SEGMENTS = new Set(
  ["offers", "marketplace", "archive", "create"].map((s) => s.toLowerCase()),
);

/** ################################ /CONSTANTS ############################# */
/** ################################ SUBCOMPONENTS ############################# */
/** Local subcomponents used by the main export. */
function TabCloseButton({
  label,
  onClose,
}: Readonly<{
  label: string;
  onClose: () => void;
}>) {
  return (
    <button
      type="button"
      className="ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-[color:var(--color-features-tab-close-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
      aria-label={`Close ${label} tab`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <span className="text-base leading-none font-normal" aria-hidden>
        ×
      </span>
    </button>
  );
}

type BrowserTabProps = Readonly<{
  href: string;
  label: string;
  active: boolean;
  pinned?: boolean;
  onClose?: () => void;
}>;

function BrowserTab({ href, label, active, pinned, onClose }: BrowserTabProps) {
  const shell = [
    "inline-flex shrink-0 items-stretch rounded-t-lg border border-b-0 text-[13px] transition-colors sm:rounded-t-xl sm:text-sm",
    TAB_BORDER,
    active ? `${TAB_ACTIVE_BG} z-[1] shadow-[0_1px_0_0_#dde6ee]` : `${TAB_IDLE_BG} z-0 hover:bg-[#cdd9e3]`,
    pinned
      ? "min-h-[2.4rem] min-w-[7.25rem] sm:min-h-[2.5rem] sm:min-w-[8rem]"
      : "min-h-[2.4rem] min-w-[5.5rem] max-w-[11rem] sm:min-h-[2.5rem] sm:min-w-[6rem] sm:max-w-[12rem]",
  ].join(" ");

  return (
    <div className={shell} role="tab" aria-selected={active}>
      <Link
        href={href}
        prefetch
        className={[
          "flex min-w-0 flex-1 items-center justify-center px-3.5 pb-0 pt-1.5 sm:px-4 sm:pt-2",
          pinned ? "sm:px-6" : "sm:px-3.5",
          TAB_TEXT,
          active ? "font-bold tracking-tight" : "font-semibold tracking-tight",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
        ].join(" ")}
        aria-current={active ? "page" : undefined}
      >
        <span className="min-w-0 flex-1 truncate text-center sm:whitespace-normal">{label}</span>
      </Link>
      {!pinned && onClose ? (
        <span className="flex shrink-0 items-center pr-1 pt-1 sm:pr-1.5 sm:pt-1.5">
          <TabCloseButton label={label} onClose={onClose} />
        </span>
      ) : null}
    </div>
  );
}

/** ################################ /SUBCOMPONENTS ############################# */
/** ################################ COMPONENT ############################# */
/**
 * Browser-style tab strip for `/features`: pinned Features + dynamic workspace tabs.
 * Compact browser tabs for h-16 header; colors still match the light-tab mock.
 */
export function FeatureBrowserTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    openTabs,
    removeWorkspaceTab,
    ensureTabForParam,
    updateWorkspaceTabHref,
  } = useFeatureTabs();

  const tabParam = pathname.startsWith("/features") ? searchParams.get("tab") : null;
  const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const featuresHomeActive = pathname === "/features";
  const schoolPathActive = pathname.startsWith("/features/school");
  const schoolWorkspaceMatch = pathname.match(/^\/features\/school\/([^/?#]+)/);
  const firstAfterSchool = schoolWorkspaceMatch?.[1] ?? null;
  const schoolWorkspaceId =
    firstAfterSchool && !SCHOOL_NON_ID_FIRST_SEGMENTS.has(firstAfterSchool.toLowerCase())
      ? firstAfterSchool
      : null;
  const schoolWorkspaceParam = schoolWorkspaceId ? `school-${schoolWorkspaceId}` : null;

  useEffect(() => {
    if (schoolWorkspaceParam) {
      ensureTabForParam(schoolWorkspaceParam, "School Workspace");
      return;
    }
    if (schoolPathActive) {
      ensureTabForParam("school", "School");
      return;
    }
    if (!pathname.startsWith("/features") || !tabParam) return;
    ensureTabForParam(tabParam);
  }, [pathname, tabParam, schoolPathActive, schoolWorkspaceParam, ensureTabForParam]);

  useEffect(() => {
    if (!schoolPathActive) return;
    updateWorkspaceTabHref(schoolWorkspaceParam ?? "school", currentUrl);
  }, [currentUrl, schoolPathActive, schoolWorkspaceParam, updateWorkspaceTabHref]);

  const onCloseDynamic = (param: string) => {
    removeWorkspaceTab(param);
    const leavingSchool =
      (param === "school" || (schoolWorkspaceParam !== null && param === schoolWorkspaceParam)) &&
      schoolPathActive;
    if (tabParam === param || leavingSchool) {
      router.push("/features");
    }
  };

  return (
    <nav
      role="tablist"
      className="flex w-full min-w-0 flex-1 items-end justify-start gap-1 overflow-x-auto overscroll-x-contain pl-0 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden"
      aria-label="Feature workspaces"
    >
      <BrowserTab href="/features" label="Features" active={featuresHomeActive} pinned />

      {openTabs.map((t) => {
        const href =
          t.href ??
          (t.param === "school"
            ? "/features/school"
            : `/features?tab=${encodeURIComponent(t.param)}`);
        const active = t.param === "school"
          ? pathname === "/features/school"
          : t.href
            ? currentUrl === t.href || pathname === t.href || pathname.startsWith(`${t.href}/`)
            : tabParam === t.param;
        return (
          <BrowserTab
            key={t.param}
            href={href}
            label={t.label}
            active={active}
            onClose={() => onCloseDynamic(t.param)}
          />
        );
      })}
    </nav>
  );
}
/** ################################ /COMPONENT ############################# */
