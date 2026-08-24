"use client";

import { useSearchParams } from "next/navigation";

import { useFeatureTabs } from "@/contexts/FeatureTabs_Context";
import {
  getWorkspaceTabId,
  preserveWorkspaceTabId,
} from "@/modules/Features/featureWorkspaceTabs";

/** Build an in-app href that keeps the current workspace tab session (`?ws=`). */
export function useWorkspaceTabHref(path: string): string {
  const searchParams = useSearchParams();
  const { openTabs } = useFeatureTabs();

  const fromUrl = getWorkspaceTabId(searchParams);
  if (fromUrl) return preserveWorkspaceTabId(path, fromUrl);

  const schoolTabs = openTabs.filter((t) => t.featureKey === "school");
  if (schoolTabs.length === 1) {
    return preserveWorkspaceTabId(path, schoolTabs[0]!.id);
  }

  return path;
}
