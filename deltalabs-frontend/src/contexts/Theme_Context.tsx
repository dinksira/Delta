"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const THEME_STORAGE_KEY = "dl-theme-mode";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeClass(mode: ThemeMode): void {
  if (typeof window === "undefined") {
    return;
  }

  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedMode = mode === "system" ? (prefersDark ? "dark" : "light") : mode;

  root.classList.toggle("dark", resolvedMode === "dark");
  root.classList.toggle("light", resolvedMode === "light");
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "system";
    }
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    applyThemeClass(mode);

    if (mode !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyThemeClass("system");

    media.addEventListener("change", listener);
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode: () => {
        setMode((current) => (current === "dark" ? "light" : "dark"));
      },
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return value;
}
/** ################################ /COMPONENT ############################# */
