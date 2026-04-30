"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import {
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/contexts/AuthSession_Context";

const STORAGE_KEY_PREFIX = "deltalabs-feature-open-tabs-v2";
const LEGACY_STORAGE_KEY = "deltalabs-feature-open-tabs-v1";

export type FeatureWorkspaceTab = Readonly<{
  id: string;
  label: string;
  /** Value for `?tab=` (slug). */
  param: string;
  /** When set, the tab links to this path instead of `?tab=` (e.g. `/features/school`). */
  href?: string;
}>;

function slugFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

type FeatureTabsContextValue = Readonly<{
  openTabs: readonly FeatureWorkspaceTab[];
  /** Opens or focuses a workspace tab and navigates to `/features?tab=…`. */
  openWorkspaceTab: (label: string) => void;
  /** Opens or focuses a tab that points to an explicit route (used for per-school workspaces). */
  openWorkspaceTabAt: (label: string, param: string, href: string) => void;
  /** Removes a tab from the strip (pinned Features is not in this list). */
  removeWorkspaceTab: (param: string) => void;
  /** Ensures a tab exists for the current URL (e.g. deep link). */
  ensureTabForParam: (param: string, labelHint?: string) => void;
  /** Updates the tab href so it can restore the last visited workspace route. */
  updateWorkspaceTabHref: (param: string, href: string) => void;
}>;

const FeatureTabsContext = createContext<FeatureTabsContextValue | null>(null);

function storageKeyForUser(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function readStoredTabsForUser(userId: string): FeatureWorkspaceTab[] {
  if (typeof window === "undefined") return [];
  try {
    const key = storageKeyForUser(userId);
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is FeatureWorkspaceTab =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as FeatureWorkspaceTab).id === "string" &&
        typeof (x as FeatureWorkspaceTab).label === "string" &&
        typeof (x as FeatureWorkspaceTab).param === "string" &&
        ((x as FeatureWorkspaceTab).href === undefined || typeof (x as FeatureWorkspaceTab).href === "string"),
    );
  } catch {
    return [];
  }
}

export function FeatureTabsProvider({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { isReady, session } = useAuthSession();
  const userId = session?.user?.id ?? "anon";
  const [openTabs, setOpenTabs] = useState<FeatureWorkspaceTab[]>([]);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);

  // Hydrate once auth is ready, and rehydrate when account changes.
  useEffect(() => {
    if (!isReady) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-side storage hydration
    setOpenTabs(readStoredTabsForUser(userId));
    setHydratedUserId(userId);
  }, [isReady, userId]);

  useEffect(() => {
    if (!isReady || hydratedUserId !== userId) return;
    try {
      localStorage.setItem(storageKeyForUser(userId), JSON.stringify(openTabs));
    } catch {
      /* ignore */
    }
  }, [hydratedUserId, isReady, openTabs, userId]);

  const openWorkspaceTab = useCallback(
    (label: string) => {
      const param = slugFromLabel(label);
      if (!param) return;
      const id = param;
      const href = label.trim().toLowerCase() === "school" ? "/features/school" : undefined;
      const destination = href ?? `/features?tab=${encodeURIComponent(param)}`;
      setOpenTabs((prev) => {
        if (prev.some((t) => t.param === param)) return prev;
        return [...prev, { id, label, param, ...(href ? { href } : {}) }];
      });
      router.push(destination);
    },
    [router],
  );

  const removeWorkspaceTab = useCallback((param: string) => {
    setOpenTabs((prev) => prev.filter((t) => t.param !== param));
  }, []);

  const openWorkspaceTabAt = useCallback(
    (label: string, param: string, href: string) => {
      const cleanLabel = label.trim();
      const cleanParam = param.trim().toLowerCase();
      const cleanHref = href.trim();
      if (!cleanLabel || !cleanParam || !cleanHref) return;
      setOpenTabs((prev) => {
        const existing = prev.find((t) => t.param === cleanParam);
        if (existing) {
          if (existing.label === cleanLabel && existing.href === cleanHref) return prev;
          return prev.map((t) =>
            t.param === cleanParam ? { ...t, label: cleanLabel, href: cleanHref } : t,
          );
        }
        return [...prev, { id: cleanParam, label: cleanLabel, param: cleanParam, href: cleanHref }];
      });
      router.push(cleanHref);
    },
    [router],
  );

  const ensureTabForParam = useCallback((param: string, labelHint?: string) => {
    if (!param) return;
    setOpenTabs((prev) => {
      if (prev.some((t) => t.param === param)) return prev;
      const derived =
        param
          .split("-")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ") || param;
      const label = labelHint ?? derived;
      const href = param === "school" ? "/features/school" : undefined;
      return [...prev, { id: param, label, param, ...(href ? { href } : {}) }];
    });
  }, []);

  const updateWorkspaceTabHref = useCallback((param: string, href: string) => {
    if (!param || !href) return;
    setOpenTabs((prev) =>
      prev.map((tab) => {
        if (tab.param !== param) return tab;
        if (tab.href === href) return tab;
        return { ...tab, href };
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      openTabs,
      openWorkspaceTab,
      openWorkspaceTabAt,
      removeWorkspaceTab,
      ensureTabForParam,
      updateWorkspaceTabHref,
    }),
    [
      openTabs,
      openWorkspaceTab,
      openWorkspaceTabAt,
      removeWorkspaceTab,
      ensureTabForParam,
      updateWorkspaceTabHref,
    ],
  );

  return <FeatureTabsContext.Provider value={value}>{children}</FeatureTabsContext.Provider>;
}

export function useFeatureTabs(): FeatureTabsContextValue {
  const ctx = useContext(FeatureTabsContext);
  if (!ctx) {
    throw new Error("useFeatureTabs must be used within FeatureTabsProvider");
  }
  return ctx;
}
/** ################################ /COMPONENT ############################# */
