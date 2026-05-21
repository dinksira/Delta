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
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import {
  getFeatureWorkspaceDestination,
  tabParamToFeatureKey,
} from "@/modules/Features/featureWorkspaceRoutes";

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

type FeatureTabsContextValue = Readonly<{
  openTabs: readonly FeatureWorkspaceTab[];
  /** Opens a workspace tab using stable catalog `feature_key` (not display label). */
  openWorkspaceTabByKey: (featureKey: string, displayLabel: string) => void;
  /** @deprecated Use `openWorkspaceTabByKey` — label-based slugs break after rename. */
  openWorkspaceTab: (label: string) => void;
  /** Opens or focuses a tab that points to an explicit route (used for per-school workspaces). */
  openWorkspaceTabAt: (label: string, param: string, href: string) => void;
  /** Removes a tab from the strip (pinned Features is not in this list). */
  removeWorkspaceTab: (param: string) => void;
  /** User closed the tab — do not auto-recreate from route until opened again. */
  dismissWorkspaceTab: (param: string) => void;
  /** Closes tabs for a hidden catalog feature (e.g. `school` + `school-*`). */
  removeTabsForFeatureKey: (featureKey: string) => void;
  /** Drops tabs whose feature keys are in `hiddenKeys`. */
  pruneHiddenFeatureTabs: (hiddenKeys: readonly string[]) => void;
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
  /** Params the user explicitly closed — blocks `ensureTabForParam` until reopened. */
  const dismissedTabParamsRef = useRef<Set<string>>(new Set());

  const clearDismissedTab = useCallback((param: string) => {
    dismissedTabParamsRef.current.delete(param);
  }, []);

  // Hydrate once auth is ready, and rehydrate when account changes.
  useEffect(() => {
    if (!isReady) return;
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

  const openWorkspaceTabByKey = useCallback(
    (featureKey: string, displayLabel: string) => {
      const { param, href } = getFeatureWorkspaceDestination(featureKey);
      if (!param) return;
      clearDismissedTab(param);
      const label = displayLabel.trim() || param;
      const destination = href ?? `/features?tab=${encodeURIComponent(param)}`;
      setOpenTabs((prev) => {
        const existing = prev.find((t) => t.param === param);
        if (existing) {
          if (existing.label === label && existing.href === href) return prev;
          return prev.map((t) =>
            t.param === param ? { ...t, label, ...(href ? { href } : {}) } : t,
          );
        }
        return [...prev, { id: param, label, param, ...(href ? { href } : {}) }];
      });
      router.push(destination);
    },
    [clearDismissedTab, router],
  );

  const openWorkspaceTab = useCallback(
    (label: string) => {
      openWorkspaceTabByKey(label.trim().toLowerCase().replace(/\s+/g, "_"), label);
    },
    [openWorkspaceTabByKey],
  );

  const removeWorkspaceTab = useCallback((param: string) => {
    setOpenTabs((prev) => prev.filter((t) => t.param !== param));
  }, []);

  const dismissWorkspaceTab = useCallback(
    (param: string) => {
      if (!param) return;
      dismissedTabParamsRef.current.add(param);
      setOpenTabs((prev) => prev.filter((t) => t.param !== param));
    },
    [],
  );

  const removeTabsForFeatureKey = useCallback((featureKey: string) => {
    const key = featureKey.trim().toLowerCase();
    setOpenTabs((prev) =>
      prev.filter((t) => {
        const tabKey = tabParamToFeatureKey(t.param);
        return tabKey !== key;
      }),
    );
  }, []);

  const pruneHiddenFeatureTabs = useCallback((hiddenKeys: readonly string[]) => {
    const hidden = new Set(hiddenKeys.map((k) => k.trim().toLowerCase()));
    if (hidden.size === 0) return;
    setOpenTabs((prev) => prev.filter((t) => !hidden.has(tabParamToFeatureKey(t.param))));
  }, []);

  const openWorkspaceTabAt = useCallback(
    (label: string, param: string, href: string) => {
      const cleanLabel = label.trim();
      const cleanParam = param.trim().toLowerCase();
      const cleanHref = href.trim();
      if (!cleanLabel || !cleanParam || !cleanHref) return;
      clearDismissedTab(cleanParam);
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
    [clearDismissedTab, router],
  );

  const ensureTabForParam = useCallback((param: string, labelHint?: string) => {
    if (!param || dismissedTabParamsRef.current.has(param)) return;
    const catalogKey = tabParamToFeatureKey(param);
    const { href } = getFeatureWorkspaceDestination(catalogKey);
    setOpenTabs((prev) => {
      if (prev.some((t) => t.param === param)) return prev;
      const derived =
        param
          .split("-")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ") || param;
      const label = labelHint ?? derived;
      return [...prev, { id: param, label, param, ...(href && param === catalogKey ? { href } : {}) }];
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
      openWorkspaceTabByKey,
      openWorkspaceTab,
      openWorkspaceTabAt,
      removeWorkspaceTab,
      dismissWorkspaceTab,
      removeTabsForFeatureKey,
      pruneHiddenFeatureTabs,
      ensureTabForParam,
      updateWorkspaceTabHref,
    }),
    [
      openTabs,
      openWorkspaceTabByKey,
      openWorkspaceTab,
      openWorkspaceTabAt,
      removeWorkspaceTab,
      dismissWorkspaceTab,
      removeTabsForFeatureKey,
      pruneHiddenFeatureTabs,
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
