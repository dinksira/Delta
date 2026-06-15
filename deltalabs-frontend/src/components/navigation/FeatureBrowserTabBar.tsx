"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useFeatureTabs } from "@/contexts/FeatureTabs_Context";
import { useFeaturesLayoutAccess } from "@/modules/Features/hooks/useFeaturesLayoutAccess";
import { featuresPathWithHiddenNotice } from "@/modules/Features/featureHiddenNotice";
import { getWorkspaceTabId } from "@/modules/Features/featureWorkspaceTabs";
import { resolveFeatureKeyFromPath } from "@/modules/Features/featureWorkspaceRoutes";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const TAB_ACTIVE_BG = "bg-[color:var(--color-features-tab-active-bg)]";
const TAB_IDLE_BG = "bg-[color:var(--color-features-tab-idle-bg)]";
const TAB_BORDER = "border-[color:var(--color-features-tab-border)]";
const TAB_TEXT = "text-[color:var(--color-features-tab-text)]";

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
 * Each workspace tab has a unique `ws` id and restores its own last route.
 */
export function FeatureBrowserTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const {
    openTabs,
    dismissWorkspaceTab,
    updateWorkspaceTabHref,
    pruneHiddenFeatureTabs,
  } = useFeatureTabs();
  const { hiddenKeys, isFeatureHidden, isLayoutReady } = useFeaturesLayoutAccess();

  const tabParam = pathname.startsWith("/features") ? searchParams.get("tab") : null;
  const activeWorkspaceTabId = getWorkspaceTabId(searchParams);
  const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const featuresHomeActive = pathname === "/features" && !activeWorkspaceTabId;
  useEffect(() => {
    if (!isLayoutReady) return;
    pruneHiddenFeatureTabs(hiddenKeys);
  }, [hiddenKeys, isLayoutReady, pruneHiddenFeatureTabs]);

  useEffect(() => {
    if (!isLayoutReady) return;
    const routeKey = resolveFeatureKeyFromPath(pathname, tabParam);
    if (routeKey && isFeatureHidden(routeKey)) {
      router.replace(featuresPathWithHiddenNotice(routeKey));
    }
  }, [isFeatureHidden, isLayoutReady, pathname, router, tabParam]);

  useEffect(() => {
    if (!activeWorkspaceTabId || !pathname.startsWith("/features")) return;
    updateWorkspaceTabHref(activeWorkspaceTabId, currentUrl);
  }, [activeWorkspaceTabId, currentUrl, pathname, updateWorkspaceTabHref]);

  const onCloseDynamic = (tabId: string) => {
    dismissWorkspaceTab(tabId);
    if (activeWorkspaceTabId === tabId) {
      router.replace("/features");
    }
  };

  return (
    <nav
      role="tablist"
      className="flex w-full min-w-0 flex-1 items-end justify-start gap-1 overflow-x-auto overscroll-x-contain pl-0 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden"
      aria-label="Feature workspaces"
    >
      <BrowserTab href="/features" label="Features" active={featuresHomeActive} pinned />

      {openTabs
        .filter((t) => !isFeatureHidden(t.featureKey))
        .map((t) => {
          const active = activeWorkspaceTabId === t.id;
          return (
            <BrowserTab
              key={t.id}
              href={t.href}
              label={t.label}
              active={active}
              onClose={() => onCloseDynamic(t.id)}
            />
          );
        })}
    </nav>
  );
}
/** ################################ /COMPONENT ############################# */
