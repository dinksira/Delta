"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Button } from "@/components/theme";
import { useThemeContext } from "@/contexts/Theme_Context";

/** ################################ /IMPORT ############################# */
/** ################################ COMPONENT ############################# */
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
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="!text-[15px] text-white/90 shadow-none hover:bg-white/10 hover:!text-white sm:!text-base"
      onClick={cycle}
      aria-label={label}
    >
      {mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System"}
    </Button>
  );
}
/** ################################ /COMPONENT ############################# */
