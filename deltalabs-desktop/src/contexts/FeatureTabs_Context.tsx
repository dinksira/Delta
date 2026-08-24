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
  createWorkspaceTabId,
  deriveWorkspaceTabLabel,
  MAX_WORKSPACE_TABS,
  routeBaseKey,
  withWorkspaceTabId,
  WORKSPACE_TAB_QUERY,
} from "@/modules/Features/featureWorkspaceTabs";
import {
  getFeatureWorkspaceDestination,
  getFeatureWorkspaceHref,
  tabParamToFeatureKey,
} from "@/modules/Features/featureWorkspaceRoutes";

const STORAGE_KEY_PREFIX = "deltalabs-feature-open-tabs-v4";
const LEGACY_STORAGE_KEY_V2 = "deltalabs-feature-open-tabs-v2";
const LEGACY_STORAGE_KEY_V1 = "deltalabs-feature-open-tabs-v1";

export type FeatureWorkspaceTab = Readonly<{
  /** Unique browser-tab id (also in URL `?ws=`). */
  id: string;
  label: string;
  /** Catalog feature key (`school`, `course`, …). */
  featureKey: string;
  /** Last visited route for this tab (includes `?ws=`). */
  href: string;
  /**
   * Legacy slug kept for school-instance hints (`school-{id}`).
   * Not used for deduplication.
   */
  param?: string;
}>;

type FeatureTabsContextValue = Readonly<{
  openTabs: readonly FeatureWorkspaceTab[];
  /** Opens a **new** workspace tab for the catalog feature (never focuses an existing one). */
  openWorkspaceTabByKey: (featureKey: string, displayLabel: string) => void;
  /** @deprecated Use `openWorkspaceTabByKey` — label-based slugs break after rename. */
  openWorkspaceTab: (label: string) => void;
  /** Opens a **new** tab at an explicit route (e.g. per-school workspace). */
  openWorkspaceTabAt: (label: string, param: string, href: string) => void;
  /** Removes a tab from the strip by tab id. */
  removeWorkspaceTab: (tabId: string) => void;
  /** User closed the tab — do not auto-recreate until opened again. */
  dismissWorkspaceTab: (tabId: string) => void;
  /** Closes tabs for a hidden catalog feature. */
  removeTabsForFeatureKey: (featureKey: string) => void;
  /** Drops tabs whose feature keys are in `hiddenKeys`. */
  pruneHiddenFeatureTabs: (hiddenKeys: readonly string[]) => void;
  /** Ensures a tab exists when landing on a deep link (adds `ws` if missing). */
  ensureTabForRoute: (href: string, featureKey: string, labelHint?: string) => string | null;
  /** Ensures a tab exists for a param (e.g. `"school"`, `"course"`). Creates from workspace route if missing. */
  ensureTabForParam: (param: string, labelHint?: string) => string | null;
  /** Persists the last route visited inside a workspace tab. */
  updateWorkspaceTabHref: (tabId: string, href: string) => void;
}>;

const FeatureTabsContext = createContext<FeatureTabsContextValue | null>(null);

function storageKeyForUser(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function normalizeStoredTab(raw: unknown): FeatureWorkspaceTab | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  const label = typeof o.label === "string" ? o.label.trim() : "";
  const href = typeof o.href === "string" ? o.href.trim() : "";
  if (!id || !label || !href) return null;

  const featureKey =
    typeof o.featureKey === "string"
      ? o.featureKey.trim().toLowerCase()
      : typeof o.param === "string"
        ? tabParamToFeatureKey(o.param)
        : "";
  if (!featureKey) return null;

  const param = typeof o.param === "string" ? o.param.trim().toLowerCase() : undefined;
  return { id, label, featureKey, href, ...(param ? { param } : {}) };
}

function migrateLegacyTab(raw: unknown): FeatureWorkspaceTab | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const label = typeof o.label === "string" ? o.label.trim() : "";
  const param = typeof o.param === "string" ? o.param.trim().toLowerCase() : "";
  if (!label || !param) return null;

  const tabId = createWorkspaceTabId();
  const featureKey = tabParamToFeatureKey(param);
  const legacyHref = typeof o.href === "string" ? o.href.trim() : "";
  const baseHref =
    legacyHref ||
    (featureKey === "school" && param === "school"
      ? "/features/school"
      : param.startsWith("school-")
        ? legacyHref
        : `/features?tab=${encodeURIComponent(param)}`);

  if (!baseHref) return null;

  return {
    id: tabId,
    label,
    featureKey,
    param,
    href: withWorkspaceTabId(baseHref, tabId),
  };
}

function sanitizeOpenTabs(tabs: FeatureWorkspaceTab[]): FeatureWorkspaceTab[] {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const byId = new Map<string, FeatureWorkspaceTab>();

  for (const raw of tabs) {
    if (!raw.id || !raw.href || !raw.label || !raw.featureKey) continue;
    try {
      const url = new URL(raw.href, origin);
      const ws = url.searchParams.get(WORKSPACE_TAB_QUERY)?.trim();
      if (ws && ws !== raw.id) continue;
      const href = ws ? raw.href : withWorkspaceTabId(raw.href, raw.id);
      byId.set(raw.id, { ...raw, href });
    } catch {
      continue;
    }
  }

  const deduped = Array.from(byId.values());
  const groups = new Map<string, FeatureWorkspaceTab[]>();
  for (const tab of deduped) {
    const base = routeBaseKey(tab.href) ?? tab.href;
    const groupKey = `${tab.featureKey}|${base}`;
    const list = groups.get(groupKey) ?? [];
    list.push(tab);
    groups.set(groupKey, list);
  }

  const collapsed: FeatureWorkspaceTab[] = [];
  const seenParam = new Set<string>();
  for (const group of groups.values()) {
    if (group.length > 3) {
      collapsed.push(group[group.length - 1]!);
    } else {
      for (const tab of group) {
        if (tab.param && seenParam.has(tab.param)) continue;
        if (tab.param) seenParam.add(tab.param);
        collapsed.push(tab);
      }
    }
  }

  return collapsed.slice(-MAX_WORKSPACE_TABS);
}

function trimTabs(tabs: FeatureWorkspaceTab[]): FeatureWorkspaceTab[] {
  if (tabs.length <= MAX_WORKSPACE_TABS) return tabs;
  return tabs.slice(-MAX_WORKSPACE_TABS);
}

function appendTab(prev: FeatureWorkspaceTab[], tab: FeatureWorkspaceTab): FeatureWorkspaceTab[] {
  if (prev.some((t) => t.id === tab.id)) return prev;
  return trimTabs([...prev, tab]);
}

function readStoredTabsForUser(userId: string): FeatureWorkspaceTab[] {
  if (typeof window === "undefined") return [];
  try {
    const key = storageKeyForUser(userId);
    const raw =
      localStorage.getItem(key) ??
      localStorage.getItem("deltalabs-feature-open-tabs-v3:" + userId) ??
      localStorage.getItem(`${LEGACY_STORAGE_KEY_V2}:${userId}`) ??
      sessionStorage.getItem(LEGACY_STORAGE_KEY_V1);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const tabs: FeatureWorkspaceTab[] = [];
    for (const item of parsed) {
      const normalized = normalizeStoredTab(item) ?? migrateLegacyTab(item);
      if (normalized) tabs.push(normalized);
    }
    return sanitizeOpenTabs(tabs);
  } catch {
    return [];
  }
}

export function FeatureTabsProvider({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { isReady, session } = useAuthSession();
  const userId = session?.user?.id ?? "anon";
  const [openTabs, setOpenTabs] = useState<FeatureWorkspaceTab[]>([]);
  const openTabsRef = useRef<FeatureWorkspaceTab[]>([]);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  /** Tab ids the user explicitly closed. */
  const dismissedTabIdsRef = useRef<Set<string>>(new Set());
  /** In-flight deep-link normalize (`/features/school` → add `?ws=`) — prevents duplicate tabs. */
  const routeNormalizeRef = useRef<{ href: string; tabId: string } | null>(null);

  useEffect(() => {
    openTabsRef.current = openTabs;
  }, [openTabs]);

  const clearDismissedTab = useCallback((tabId: string) => {
    dismissedTabIdsRef.current.delete(tabId);
  }, []);

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
      const key = featureKey.trim().toLowerCase();
      if (!key) return;

      const { param, href: baseHref } = getFeatureWorkspaceDestination(key);
      if (!param) return;

      const tabId = createWorkspaceTabId();
      clearDismissedTab(tabId);

      const destination = withWorkspaceTabId(
        baseHref ?? `/features?tab=${encodeURIComponent(param)}`,
        tabId,
      );
      setOpenTabs((prev) =>
        appendTab(prev, {
          id: tabId,
          label: deriveWorkspaceTabLabel(key, displayLabel, prev),
          featureKey: key,
          param,
          href: destination,
        }),
      );

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

  const removeWorkspaceTab = useCallback((tabId: string) => {
    setOpenTabs((prev) => prev.filter((t) => t.id !== tabId));
  }, []);

  const dismissWorkspaceTab = useCallback((tabId: string) => {
    if (!tabId) return;
    dismissedTabIdsRef.current.add(tabId);
    setOpenTabs((prev) => prev.filter((t) => t.id !== tabId));
  }, []);

  const removeTabsForFeatureKey = useCallback((featureKey: string) => {
    const key = featureKey.trim().toLowerCase();
    setOpenTabs((prev) => prev.filter((t) => t.featureKey !== key));
  }, []);

  const pruneHiddenFeatureTabs = useCallback((hiddenKeys: readonly string[]) => {
    const hidden = new Set(hiddenKeys.map((k) => k.trim().toLowerCase()));
    if (hidden.size === 0) return;
    setOpenTabs((prev) => prev.filter((t) => !hidden.has(t.featureKey)));
  }, []);

  const openWorkspaceTabAt = useCallback(
    (label: string, param: string, href: string) => {
      const cleanLabel = label.trim();
      const cleanParam = param.trim().toLowerCase();
      const cleanHref = href.trim();
      if (!cleanLabel || !cleanParam || !cleanHref) return;

      const featureKey = tabParamToFeatureKey(cleanParam);
      const existing = openTabsRef.current.find((t) => t.param === cleanParam);

      if (existing) {
        clearDismissedTab(existing.id);
        const destination = withWorkspaceTabId(cleanHref, existing.id);
        setOpenTabs((prev) =>
          prev.map((t) =>
            t.param === cleanParam ? { ...t, label: cleanLabel, href: destination } : t,
          ),
        );
        router.push(destination);
        return;
      }

      const tabId = createWorkspaceTabId();
      clearDismissedTab(tabId);
      const destination = withWorkspaceTabId(cleanHref, tabId);

      setOpenTabs((prev) =>
        appendTab(prev, {
          id: tabId,
          label: cleanLabel,
          featureKey,
          param: cleanParam,
          href: destination,
        }),
      );
      router.push(destination);
    },
    [clearDismissedTab, router],
  );

  const ensureTabForRoute = useCallback(
    (href: string, featureKey: string, labelHint?: string): string | null => {
      const cleanHref = href.trim();
      const key = featureKey.trim().toLowerCase();
      if (!cleanHref || !key) return null;

      const origin =
        typeof window !== "undefined" ? window.location.origin : "http://localhost";
      const baseKey = routeBaseKey(cleanHref);

      try {
        const url = new URL(cleanHref, origin);
        const existingWs = url.searchParams.get(WORKSPACE_TAB_QUERY)?.trim();
        if (existingWs) {
          routeNormalizeRef.current = null;
          if (dismissedTabIdsRef.current.has(existingWs)) return null;
          setOpenTabs((prev) => {
            if (prev.some((t) => t.id === existingWs)) return prev;
            const label =
              labelHint ??
              key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
            return appendTab(prev, {
              id: existingWs,
              label,
              featureKey: key,
              href: cleanHref,
            });
          });
          return existingWs;
        }
      } catch {
        return null;
      }

      const inFlight = routeNormalizeRef.current;
      if (inFlight?.href === cleanHref) {
        return inFlight.tabId;
      }

      const existing =
        baseKey &&
        openTabsRef.current.find((t) => {
          if (dismissedTabIdsRef.current.has(t.id)) return false;
          return routeBaseKey(t.href) === baseKey;
        });
      const reuseTabId = existing?.id ?? null;

      if (reuseTabId) {
        routeNormalizeRef.current = { href: cleanHref, tabId: reuseTabId };
        router.replace(withWorkspaceTabId(cleanHref, reuseTabId));
        return reuseTabId;
      }

      const tabId = createWorkspaceTabId();
      routeNormalizeRef.current = { href: cleanHref, tabId };
      const destination = withWorkspaceTabId(cleanHref, tabId);
      const label =
        labelHint ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");

      setOpenTabs((prev) =>
        appendTab(prev, {
          id: tabId,
          label,
          featureKey: key,
          href: destination,
        }),
      );

      router.replace(destination);
      return tabId;
    },
    [clearDismissedTab, router],
  );

  const ensureTabForParam = useCallback(
    (param: string, labelHint?: string): string | null => {
      const cleanParam = param.trim().toLowerCase();
      if (!cleanParam) return null;

      const { href: baseHref } = getFeatureWorkspaceDestination(cleanParam);
      if (!baseHref) {
        const existing = openTabsRef.current.find((t) => t.param === cleanParam);
        if (existing) return existing.id;
        return null;
      }

      const existing = openTabsRef.current.find((t) => t.param === cleanParam);
      if (existing) return existing.id;

      const tabId = createWorkspaceTabId();
      clearDismissedTab(tabId);
      const destination = withWorkspaceTabId(baseHref, tabId);
      const label =
        labelHint ??
        cleanParam.charAt(0).toUpperCase() + cleanParam.slice(1).replace(/_/g, " ");

      setOpenTabs((prev) =>
        appendTab(prev, {
          id: tabId,
          label,
          featureKey: cleanParam,
          param: cleanParam,
          href: destination,
        }),
      );
      return tabId;
    },
    [clearDismissedTab],
  );

  const updateWorkspaceTabHref = useCallback((tabId: string, href: string) => {
    if (!tabId || !href) return;
    setOpenTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (!tab || tab.href === href) return prev;
      return prev.map((t) => (t.id === tabId ? { ...t, href } : t));
    });
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
      ensureTabForRoute,
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
      ensureTabForRoute,
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
