"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useFeatureTabs } from "@/contexts/FeatureTabs_Context";

/** Active / light tab surface — matches product mock (~#dde6ee). */
const TAB_ACTIVE_BG = "bg-[#dde6ee]";
/** Inactive sibling tab — slightly cooler gray so active reads as “front”. */
const TAB_IDLE_BG = "bg-[#c5d4de]";
const TAB_BORDER = "border-[#b9c9d6]";
const TAB_TEXT = "text-[#121a24]";

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
      className="ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#475569] transition-colors hover:bg-[#b9c9d6]/90 hover:text-[#121a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64748b]/50"
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
    <div className={shell}>
      <Link
        href={href}
        prefetch
        className={[
          "flex min-w-0 flex-1 items-center justify-center px-3.5 pb-0 pt-1.5 sm:px-4 sm:pt-2",
          pinned ? "sm:px-6" : "sm:px-3.5",
          TAB_TEXT,
          active ? "font-bold tracking-tight" : "font-semibold tracking-tight",
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

/**
 * Browser-style tab strip for `/features`: pinned Features + dynamic workspace tabs.
 * Compact browser tabs for h-16 header; colors still match the light-tab mock.
 */
export function FeatureBrowserTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openTabs, removeWorkspaceTab, ensureTabForParam } = useFeatureTabs();

  const tabParam = pathname.startsWith("/features") ? searchParams.get("tab") : null;
  const featuresHomeActive = pathname.startsWith("/features") && !tabParam;

  useEffect(() => {
    if (!pathname.startsWith("/features") || !tabParam) return;
    ensureTabForParam(tabParam);
  }, [pathname, tabParam, ensureTabForParam]);

  const onCloseDynamic = (param: string) => {
    removeWorkspaceTab(param);
    if (tabParam === param) {
      router.push("/features");
    }
  };

  return (
    <nav
      className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto overscroll-x-contain pl-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1.5 sm:pl-3 [&::-webkit-scrollbar]:hidden"
      aria-label="Feature workspaces"
    >
      <BrowserTab href="/features" label="Features" active={featuresHomeActive} pinned />

      {openTabs.map((t) => (
        <BrowserTab
          key={t.param}
          href={`/features?tab=${encodeURIComponent(t.param)}`}
          label={t.label}
          active={tabParam === t.param}
          onClose={() => onCloseDynamic(t.param)}
        />
      ))}
    </nav>
  );
}
