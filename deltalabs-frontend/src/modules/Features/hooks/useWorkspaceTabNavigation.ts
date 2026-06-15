"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  getWorkspaceTabId,
  preserveWorkspaceTabId,
} from "@/modules/Features/featureWorkspaceTabs";

/** Navigate inside a workspace browser tab while preserving the `ws` session id. */
export function useWorkspaceTabNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceTabId = getWorkspaceTabId(searchParams);

  const push = useCallback(
    (href: string) => {
      router.push(preserveWorkspaceTabId(href, workspaceTabId));
    },
    [router, workspaceTabId],
  );

  const replace = useCallback(
    (href: string) => {
      router.replace(preserveWorkspaceTabId(href, workspaceTabId));
    },
    [router, workspaceTabId],
  );

  return { workspaceTabId, push, replace };
}
