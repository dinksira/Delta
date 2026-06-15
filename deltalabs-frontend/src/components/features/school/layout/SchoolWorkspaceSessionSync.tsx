"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useFeatureTabs } from "@/contexts/FeatureTabs_Context";
import {
  getWorkspaceTabId,
  preserveWorkspaceTabId,
} from "@/modules/Features/featureWorkspaceTabs";

const SCHOOL_NON_ID_SEGMENTS = new Set(
  ["offers", "marketplace", "archive", "create"].map((s) => s.toLowerCase()),
);

/**
 * When navigating inside School without `?ws=`, attach the active school workspace tab
 * (never creates a new tab — only reuses an existing one).
 */
export function SchoolWorkspaceSessionSync() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openTabs } = useFeatureTabs();
  const lastSyncRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname.startsWith("/features/school")) return;

    const ws = getWorkspaceTabId(searchParams);
    if (ws) {
      lastSyncRef.current = null;
      return;
    }

    const schoolTabs = openTabs.filter((t) => t.featureKey === "school");
    if (schoolTabs.length === 0) return;

    const currentQs = searchParams.toString();
    const fingerprint = `${pathname}?${currentQs}`;
    if (lastSyncRef.current === fingerprint) return;

    const segmentMatch = pathname.match(/^\/features\/school\/([^/]+)/);
    const segment = segmentMatch?.[1]?.toLowerCase() ?? null;

    let tab = null as (typeof schoolTabs)[number] | null;
    if (segment && !SCHOOL_NON_ID_SEGMENTS.has(segment)) {
      tab = schoolTabs.find((t) => t.param === `school-${segment}`) ?? null;
    }
    // Only attach a generic school tab when unambiguous — never pick the first of many.
    if (!tab && schoolTabs.length === 1) {
      tab = schoolTabs[0] ?? null;
    }
    if (!tab) return;

    lastSyncRef.current = fingerprint;
    const current = currentQs ? `${pathname}?${currentQs}` : pathname;
    router.replace(preserveWorkspaceTabId(current, tab.id));
  }, [openTabs, pathname, router, searchParams]);

  return null;
}
