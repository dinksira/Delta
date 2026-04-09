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

const STORAGE_KEY = "deltalabs-feature-open-tabs-v1";

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
  /** Removes a tab from the strip (pinned Features is not in this list). */
  removeWorkspaceTab: (param: string) => void;
  /** Ensures a tab exists for the current URL (e.g. deep link). */
  ensureTabForParam: (param: string, labelHint?: string) => void;
}>;

const FeatureTabsContext = createContext<FeatureTabsContextValue | null>(null);

function readStoredTabs(): FeatureWorkspaceTab[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
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
  const [openTabs, setOpenTabs] = useState<FeatureWorkspaceTab[]>([]);

  // Intentionally after mount: sessionStorage is unavailable during SSR; avoids hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted tabs once on client
    setOpenTabs(readStoredTabs());
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(openTabs));
    } catch {
      /* ignore */
    }
  }, [openTabs]);

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

  const value = useMemo(
    () => ({
      openTabs,
      openWorkspaceTab,
      removeWorkspaceTab,
      ensureTabForParam,
    }),
    [openTabs, openWorkspaceTab, removeWorkspaceTab, ensureTabForParam],
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
