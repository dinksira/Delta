"use client";

import { Button } from "@/components/theme";
import { useThemeContext } from "@/contexts/Theme_Context";

/** Cycles theme mode: light → dark → system. */
export function ThemeToggle() {
  const { mode, setMode } = useThemeContext();

  const cycle = () => {
    if (mode === "light") {
      setMode("dark");
      return;
    }
    if (mode === "dark") {
      setMode("system");
      return;
    }
    setMode("light");
  };

  const label =
    mode === "light" ? "Theme: light" : mode === "dark" ? "Theme: dark" : "Theme: system";

  return (
    <Button type="button" variant="ghost" size="sm" onClick={cycle} aria-label={label}>
      {mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System"}
    </Button>
  );
}
